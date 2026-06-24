#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chunk Ingestion Governance Pipeline (governance_pipeline.py)
MED-228 | UCE | Pensum 36 | Período MAYO-AGOSTO 2026

Pipeline:
  PDF/PPT/Notes → Document Parser → Semantic Chunking → CG Mapping
  → Compliance Validation → Faculty Staging → Embedding Queue → Status Report

Usage:
  python src/ingestion/governance_pipeline.py [--manifest path/to/manifest.yaml]
                                              [--dry-run]
                                              [--report-only]
                                              [--embed]

Flags:
  --manifest     Path to YAML manifest (default: src/ingestion/chunk_manifest.yaml)
  --dry-run      Parse and validate but do NOT write to Supabase
  --report-only  Print pipeline status report from DB without ingesting
  --embed        Generate embeddings via Gemini API (requires GEMINI_API_KEY)
"""

import os
import sys
import json
import time
import uuid
import datetime
import argparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

# ── Optional dependencies (graceful degradation) ──────────────────────────────
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    print("[PIPELINE] ⚠️  PyYAML not installed. Install with: pip install pyyaml")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from src.ai.compliance.academic_compliance_agent import validate_chunk

# ── Environment ───────────────────────────────────────────────────────────────
def load_env(filepath=".env"):
    env_path = os.path.join(BASE_DIR, filepath)
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

load_env()

SUPABASE_URL      = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
GEMINI_API_KEY    = os.environ.get("GEMINI_API_KEY")

# ── Chunking ──────────────────────────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = (current + "\n\n" + para).strip() if current else para
        else:
            if current:
                chunks.append(current)
            if len(para) > chunk_size:
                start = 0
                while start < len(para):
                    chunks.append(para[start:start + chunk_size])
                    start += chunk_size - overlap
                current = ""
            else:
                current = para
    if current:
        chunks.append(current)
    return chunks

# ── Document extraction ───────────────────────────────────────────────────────
def extract_pdf_pages(filepath: str, page_range: list[int]) -> str:
    if not PDF_AVAILABLE:
        return f"[PIPELINE ERROR]: PyMuPDF not installed. Cannot read '{filepath}'."
    if not os.path.exists(filepath):
        return ""
    try:
        doc = fitz.open(filepath)
        start = max(0, page_range[0] - 1)
        end   = min(len(doc), page_range[1]) if len(page_range) > 1 else len(doc)
        return "\n\n".join(doc[i].get_text().strip() for i in range(start, end) if doc[i].get_text().strip())
    except Exception as e:
        return f"[PIPELINE ERROR]: {e}"

def extract_text_file(filepath: str) -> str:
    if not os.path.exists(filepath):
        return ""
    with open(filepath, encoding="utf-8", errors="ignore") as f:
        return f.read()

# ── Embedding ─────────────────────────────────────────────────────────────────
def generate_embedding(client, text: str) -> list[float] | None:
    if not GENAI_AVAILABLE or not client:
        return None
    try:
        cfg = types.EmbedContentConfig(output_dimensionality=1536)
        res = client.models.embed_content(
            model="models/gemini-embedding-2",
            contents=text,
            config=cfg
        )
        return res.embeddings[0].values
    except Exception as e:
        print(f"[PIPELINE] Embedding error: {e}")
        return None

# ── Supabase helpers ──────────────────────────────────────────────────────────
def get_course_id(course_code: str) -> str | None:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not REQUESTS_AVAILABLE:
        return None
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/courses?code=eq.{course_code}&select=id",
            headers=headers, timeout=10
        )
        data = res.json()
        return data[0]["id"] if data else None
    except Exception:
        return None

def stage_chunk(payload: dict, run_id: str, source_file: str, assigned_to: str, dry_run: bool) -> bool:
    """
    Inserts chunk as pending_review into content_chunks + chunk_review_queue.
    Chunks start is_active=False and retrieval_priority='LOW' until faculty approves.
    """
    if dry_run:
        return True

    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not REQUESTS_AVAILABLE:
        print("[PIPELINE] ⚠️  Cannot write to Supabase — missing credentials.")
        return False

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    chunk_payload = {**payload, "is_active": False, "retrieval_priority": "LOW"}
    try:
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/content_chunks",
            json=chunk_payload, headers=headers, timeout=15
        )
        if res.status_code not in [200, 201]:
            print(f"[PIPELINE] Supabase insert failed ({res.status_code}): {res.text[:200]}")
            return False

        chunk_id = res.json()[0]["id"] if res.json() else None
        if not chunk_id:
            return False

        queue_payload = {
            "chunk_id":       chunk_id,
            "assigned_to":    assigned_to,
            "review_status":  "pending_review",
            "pipeline_run_id": run_id,
            "source_file":    source_file,
            "ingestion_mode": payload.get("_ingestion_mode", "pdf_batch")
        }
        requests.post(
            f"{SUPABASE_URL}/rest/v1/chunk_review_queue",
            json=queue_payload, headers=headers, timeout=10
        )
        return True
    except Exception as e:
        print(f"[PIPELINE] Stage error: {e}")
        return False

# ── Pipeline status report ────────────────────────────────────────────────────
def pipeline_status_report(run_id: str | None = None) -> str:
    lines = []
    lines.append("═══════════════════════════════════════════")
    lines.append("CHUNK INGESTION GOVERNANCE PIPELINE — STATUS")
    lines.append(f"Generated: {datetime.datetime.now().isoformat()}")
    lines.append("═══════════════════════════════════════════\n")

    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not REQUESTS_AVAILABLE:
        lines.append("⚠️  Supabase not connected — showing local state only.")
        return "\n".join(lines)

    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
    try:
        # Queue breakdown
        q_url = f"{SUPABASE_URL}/rest/v1/chunk_review_queue?select=review_status"
        if run_id:
            q_url += f"&pipeline_run_id=eq.{run_id}"
        res = requests.get(q_url, headers=headers, timeout=10)
        queue = res.json() if res.status_code == 200 else []

        from collections import Counter
        counts = Counter(r["review_status"] for r in queue)
        total = sum(counts.values())

        lines.append("REVIEW QUEUE:")
        lines.append(f"  Total staged      : {total}")
        lines.append(f"  Pending review    : {counts.get('pending_review', 0)}")
        lines.append(f"  Approved          : {counts.get('approved', 0)}")
        lines.append(f"  Rejected          : {counts.get('rejected', 0)}")
        lines.append(f"  Revision needed   : {counts.get('revision_needed', 0)}\n")

        # Active chunks breakdown
        c_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/content_chunks?select=is_active,retrieval_priority,memory_domain,block",
            headers=headers, timeout=10
        )
        chunks = c_res.json() if c_res.status_code == 200 else []

        active = [c for c in chunks if c.get("is_active")]
        pending = [c for c in chunks if not c.get("is_active")]

        lines.append("CORPUS READINESS:")
        lines.append(f"  Active (approved) chunks : {len(active)}")
        lines.append(f"  Staged (pending) chunks  : {len(pending)}")

        targets = {"theory": 250, "procedural": 150, "clinical_cases": 80, "patterns": 50}
        domain_counts = Counter(c.get("memory_domain") for c in active)
        lines.append("\n  Memory Domain Distribution (active):")
        for dom in ["semantic", "procedural", "executive", "perceptual"]:
            count = domain_counts.get(dom, 0)
            lines.append(f"    {dom:<12} → {count:>4} chunks")

        pri_counts = Counter(c.get("retrieval_priority") for c in active)
        lines.append("\n  Retrieval Priority (active):")
        for pri in ["HIGH", "MEDIUM", "LOW"]:
            lines.append(f"    {pri:<8} → {pri_counts.get(pri, 0):>4} chunks")

        lines.append("\n  Corpus Targets (Phase 2 minimum):")
        lines.append(f"    Semantic/Theory  → {domain_counts.get('semantic', 0):>4} / 250 target")
        lines.append(f"    Procedural       → {domain_counts.get('procedural', 0):>4} / 150 target")
        lines.append(f"    Executive        → {domain_counts.get('executive', 0):>4} /  80 target")
        lines.append(f"    Perceptual       → {domain_counts.get('perceptual', 0):>4} /  50 target")

    except Exception as e:
        lines.append(f"⚠️  Could not fetch Supabase stats: {e}")

    lines.append("\n═══════════════════════════════════════════")
    return "\n".join(lines)

# ── Main pipeline ─────────────────────────────────────────────────────────────
def run_pipeline(manifest_path: str, dry_run: bool, with_embeddings: bool) -> dict:
    if not YAML_AVAILABLE:
        print("[PIPELINE] FATAL: PyYAML required. Run: pip install pyyaml")
        sys.exit(1)

    with open(manifest_path, encoding="utf-8") as f:
        manifest = yaml.safe_load(f)

    course_code = manifest.get("course_code", "MED-228")
    run_id      = manifest.get("pipeline_run_id", f"run-{datetime.date.today()}")
    default_validator = manifest.get("default_validated_by", "Dr. Rivas (UCE)")
    default_date      = manifest.get("default_validated_date", str(datetime.date.today()))
    sources           = manifest.get("sources", [])

    course_id = get_course_id(course_code)
    if not course_id:
        print(f"[PIPELINE] ⚠️  Course ID for '{course_code}' not found in DB. Using placeholder.")
        course_id = "00000000-0000-0000-0000-000000000000"

    embed_client = None
    if with_embeddings and GENAI_AVAILABLE and GEMINI_API_KEY:
        embed_client = genai.Client(api_key=GEMINI_API_KEY)

    stats = {
        "run_id": run_id,
        "sources_processed": 0,
        "chunks_generated":  0,
        "chunks_compliant":  0,
        "chunks_rejected":   0,
        "chunks_held":       0,
        "chunks_staged":     0,
        "errors":            []
    }

    print(f"\n{'='*60}")
    print(f"GOVERNANCE PIPELINE: {run_id}")
    print(f"Course: {course_code}  |  Sources: {len(sources)}")
    print(f"Dry-run: {dry_run}  |  Embeddings: {with_embeddings}")
    print(f"{'='*60}\n")

    for src in sources:
        src_id    = src.get("id", "unknown")
        filepath  = os.path.join(BASE_DIR, src.get("file", ""))
        file_type = src.get("file_type", "pdf")

        print(f"[{src_id}] Processing source: {src.get('source_book', '')} — {src.get('topic', '')}")

        # 1. Extract text
        if file_type == "pdf":
            page_range = src.get("page_range", [1, 50])
            raw_text = extract_pdf_pages(filepath, page_range)
        else:
            raw_text = extract_text_file(filepath)

        if not raw_text or raw_text.startswith("[PIPELINE ERROR]"):
            msg = f"Skipped '{src_id}' — file not found or unreadable: {filepath}"
            print(f"  ⚠️  {msg}")
            stats["errors"].append(msg)
            continue

        stats["sources_processed"] += 1

        # 2. Chunk
        chunks = chunk_text(
            raw_text,
            chunk_size=src.get("chunk_size", 800),
            overlap=src.get("overlap", 120)
        )
        print(f"  → {len(chunks)} chunks extracted")
        stats["chunks_generated"] += len(chunks)

        # 3. Build + validate each chunk
        for idx, chunk_text_str in enumerate(chunks):
            payload = {
                "course_id":       course_id,
                "week":            src["week"],
                "block":           src["block"],
                "topic":           src["topic"],
                "subtopic":        src.get("subtopic"),
                "content_type":    src["content_type"],
                "memory_domain":   src["memory_domain"],
                "cg_competencies": src["cg_competencies"],
                "evaluation_type": src.get("evaluation_type", ["quiz"]),
                "chunk_text":      chunk_text_str,
                "source_book":     src["source_book"],
                "source_chapter":  src.get("source_chapter"),
                "source_pages":    src.get("source_pages", "N/A"),
                "validated_by":    src.get("validated_by", default_validator),
                "validated_date":  src.get("validated_date", default_date),
                "validation_notes": f"Batch pipeline run: {run_id}",
                "is_active":       False,
                "chunk_index":     idx,
                "token_count":     len(chunk_text_str.split()),
                "_ingestion_mode": f"{file_type}_batch"
            }

            result = validate_chunk(payload)

            if not result["success"]:
                stats["chunks_rejected"] += 1
                if idx == 0 or idx % 10 == 0:
                    print(f"  ❌ Chunk {idx} rejected: {result['reason'][:80]}")
                continue

            if result["status"] == "HOLD":
                stats["chunks_held"] += 1

            stats["chunks_compliant"] += 1

            # 4. Generate embedding (optional)
            if with_embeddings and embed_client:
                embedding = generate_embedding(embed_client, chunk_text_str)
                if embedding:
                    payload["embedding"] = embedding
                time.sleep(0.15)  # Rate limit courtesy delay

            # Remove internal pipeline key before staging
            payload.pop("_ingestion_mode", None)

            # 5. Stage to DB (pending faculty review)
            ingestion_mode = f"{file_type}_batch"
            ok = stage_chunk(
                payload,
                run_id=run_id,
                source_file=src.get("file", src_id),
                assigned_to=src.get("assigned_to", default_validator),
                dry_run=dry_run
            )
            if ok:
                stats["chunks_staged"] += 1

        print(f"  ✅ {src_id}: {stats['chunks_compliant']} compliant | "
              f"{stats['chunks_rejected']} rejected | staged: {stats['chunks_staged']}")

    return stats

# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Chunk Ingestion Governance Pipeline — MED-228 UCE"
    )
    parser.add_argument(
        "--manifest",
        default=os.path.join(BASE_DIR, "src", "ingestion", "chunk_manifest.yaml"),
        help="Path to YAML manifest file"
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing to DB")
    parser.add_argument("--report-only", action="store_true", help="Print status report and exit")
    parser.add_argument("--embed", action="store_true", help="Generate embeddings via Gemini API")
    args = parser.parse_args()

    if args.report_only:
        print(pipeline_status_report())
        return

    stats = run_pipeline(
        manifest_path=args.manifest,
        dry_run=args.dry_run,
        with_embeddings=args.embed
    )

    print(f"\n{'='*60}")
    print("PIPELINE COMPLETE")
    print(f"  Sources processed : {stats['sources_processed']}")
    print(f"  Chunks generated  : {stats['chunks_generated']}")
    print(f"  Chunks compliant  : {stats['chunks_compliant']}")
    print(f"  Chunks rejected   : {stats['chunks_rejected']}")
    print(f"  Chunks on hold    : {stats['chunks_held']}")
    print(f"  Chunks staged     : {stats['chunks_staged']}")
    if stats["errors"]:
        print(f"\n  ⚠️  Errors ({len(stats['errors'])}):")
        for e in stats["errors"]:
            print(f"    - {e}")
    print(f"\n  STATUS: Chunks are pending faculty review in chunk_review_queue.")
    print(f"  NEXT: Open Faculty Approval Dashboard → /faculty")
    print(f"{'='*60}\n")

    if not args.dry_run:
        print(pipeline_status_report(stats["run_id"]))

    # Save pipeline run stats to analytics
    analytics_dir = os.path.join(BASE_DIR, "src", "analytics", "academic")
    os.makedirs(analytics_dir, exist_ok=True)
    run_file = os.path.join(analytics_dir, f"pipeline_run_{stats['run_id']}.json")
    with open(run_file, "w", encoding="utf-8") as f:
        json.dump({
            **stats,
            "generated_at": datetime.datetime.now().isoformat(),
            "dry_run": args.dry_run
        }, f, indent=2, ensure_ascii=False)
    print(f"  Run stats saved → {run_file}")

if __name__ == "__main__":
    main()
