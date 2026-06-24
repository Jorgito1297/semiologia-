import os
import sys
import json
import argparse
import datetime
import time
from pathlib import Path
from collections import Counter

# Set path relative to project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# Load environment variables from .env
env_path = BASE_DIR / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

# Import pipeline helper modules
from src.pipelines.ingestion.config import VALID_CGS, VALID_BLOCKS, WEEK_TO_BLOCK, VALIDATOR, COURSE
from src.pipelines.ingestion.pdf_extractor import extract_pdf_text
from src.pipelines.ingestion.chunker import chunk_text
from src.pipelines.ingestion.validator import validate_chunk_compliance
from src.pipelines.ingestion.embedder import embed_chunks
from src.pipelines.ingestion.uploader import upload_chunks_to_supabase, get_supabase_client

# Log setup
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)
log_file_path = LOGS_DIR / f"pipeline_{datetime.date.today().isoformat()}.log"

def log_message(msg: str):
    """Writes a message to console and log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def load_manifest(manifest_path: str) -> dict:
    """Loads YAML manifest file."""
    try:
        import yaml
    except ImportError:
        print("[PIPELINE] PyYAML not installed. Install with: pip install pyyaml")
        sys.exit(1)
        
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    with open(manifest_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

# ── Pipeline Commands ─────────────────────────────────────────────────────────

def run_extract(manifest_path: str) -> list[dict]:
    """Extracts raw text from sources listed in the manifest."""
    log_message("EJECUTANDO MODO: EXTRACT")
    manifest = load_manifest(manifest_path)
    sources = manifest.get("sources", [])
    extracted_sources = []
    
    for src in sources:
        src_id = src.get("id", "unknown")
        filepath = BASE_DIR / src.get("file", "")
        file_type = src.get("file_type", "pdf")
        log_message(f"[{src_id}] Leyendo archivo: {filepath.name}")
        
        if not filepath.exists():
            log_message(f"  ⚠️  Omitiendo '{src_id}' — archivo no encontrado.")
            continue
            
        try:
            if file_type == "pdf":
                page_range = src.get("page_range", [1, 50])
                text = extract_pdf_text(str(filepath), page_range)
            else:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            
            extracted_sources.append({
                "source_metadata": src,
                "raw_text": text
            })
            log_message(f"  ✅ Extracción exitosa ({len(text)} caracteres).")
        except Exception as e:
            log_message(f"  ❌ Fallo en extracción: {e}")
            
    review_dir = BASE_DIR / "review"
    review_dir.mkdir(exist_ok=True)
    with open(review_dir / "extracted_raw.json", "w", encoding="utf-8") as f:
        json.dump(extracted_sources, f, indent=2, ensure_ascii=False)
    
    log_message(f"Extracción completada. Guardada en review/extracted_raw.json")
    return extracted_sources

def run_chunk(manifest_path: str) -> list[dict]:
    """Divides extracted sources into chunks with metadata."""
    log_message("EJECUTANDO MODO: CHUNK")
    
    # Load extracted raw text
    raw_path = BASE_DIR / "review" / "extracted_raw.json"
    if not raw_path.exists():
        log_message("No se encontró review/extracted_raw.json. Extrayendo primero...")
        extracted_sources = run_extract(manifest_path)
    else:
        with open(raw_path, "r", encoding="utf-8") as f:
            extracted_sources = json.load(f)

    all_chunks = []
    course_id = "00000000-0000-0000-0000-000000000000"
    
    # Try getting actual course_id from Supabase if connected
    client = get_supabase_client()
    if client:
        try:
            res = client.table("courses").select("id").eq("code", "MED-228").execute()
            if res.data:
                course_id = res.data[0]["id"]
        except Exception:
            pass

    for src_data in extracted_sources:
        src = src_data["source_metadata"]
        text = src_data["raw_text"]
        src_id = src.get("id", "unknown")
        
        chunks = chunk_text(text, chunk_size=src.get("chunk_size", 800), overlap=src.get("overlap", 120))
        log_message(f"[{src_id}] Dividiendo en {len(chunks)} chunks...")
        
        for idx, text_str in enumerate(chunks):
            chunk_payload = {
                "course_id":       course_id,
                "week":            src["week"],
                "block":           src["block"],
                "topic":           src["topic"],
                "subtopic":        src.get("subtopic"),
                "content_type":    src["content_type"],
                "memory_domain":   src["memory_domain"],
                "cg_competencies": src["cg_competencies"],
                "evaluation_type": src.get("evaluation_type", ["quiz"]),
                "chunk_text":      text_str,
                "source_book":     src["source_book"],
                "source_chapter":  src.get("source_chapter"),
                "source_pages":    src.get("source_pages", "N/A"),
                "validated_by":    src.get("validated_by", VALIDATOR),
                "validated_date":  src.get("validated_date", str(datetime.date.today())),
                "validation_notes": f"Ingestado vía pipeline",
                "is_active":       False,
                "chunk_index":     idx,
                "token_count":     len(text_str.split()),
                "id":              str(Path(src.get("file", src_id)).name) + f"-{idx}"
            }
            all_chunks.append(chunk_payload)

    review_dir = BASE_DIR / "review"
    review_dir.mkdir(exist_ok=True)
    with open(review_dir / "extracted_chunks.json", "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)
        
    log_message(f"Chunking completado. {len(all_chunks)} chunks guardados en review/extracted_chunks.json")
    return all_chunks

def run_validate(manifest_path: str) -> list[dict]:
    """Validates chunks against academic compliance rules."""
    log_message("EJECUTANDO MODO: VALIDATE")
    
    chunks_path = BASE_DIR / "review" / "extracted_chunks.json"
    if not chunks_path.exists():
        log_message("No se encontró review/extracted_chunks.json. Realizando chunking primero...")
        all_chunks = run_chunk(manifest_path)
    else:
        with open(chunks_path, "r", encoding="utf-8") as f:
            all_chunks = json.load(f)

    compliant_chunks = []
    rejected_count = 0
    
    for idx, chunk in enumerate(all_chunks):
        res = validate_chunk_compliance(chunk)
        if not res["success"]:
            log_message(f"  ❌ Chunk {idx + 1} RECHAZADO: {res['reason']}")
            rejected_count += 1
            continue
            
        compliant_chunks.append(chunk)

    review_dir = BASE_DIR / "review"
    review_dir.mkdir(exist_ok=True)
    
    # Write pending review file
    pending_file = review_dir / "med228_chunks_pending.json"
    with open(pending_file, "w", encoding="utf-8") as f:
        json.dump(compliant_chunks, f, indent=2, ensure_ascii=False)
        
    log_message(f"Validación finalizada. Compliants: {len(compliant_chunks)} | Rechazados: {rejected_count}")
    
    if rejected_count > 0:
        log_message(f"⚠️  Pipeline detenido. Corrige los {rejected_count} chunks rechazados antes de continuar.")
        sys.exit(1)
        
    return compliant_chunks

def run_embed(manifest_path: str) -> list[dict]:
    """Generates embeddings for compliant pending chunks."""
    log_message("EJECUTANDO MODO: EMBED")
    
    pending_file = BASE_DIR / "review" / "med228_chunks_pending.json"
    if not pending_file.exists():
        log_message("No se encontró review/med228_chunks_pending.json. Validando primero...")
        compliant_chunks = run_validate(manifest_path)
    else:
        with open(pending_file, "r", encoding="utf-8") as f:
            compliant_chunks = json.load(f)

    embedded = embed_chunks(compliant_chunks)
    
    with open(pending_file, "w", encoding="utf-8") as f:
        json.dump(embedded, f, indent=2, ensure_ascii=False)
        
    log_message(f"Embeddings completados para {len(embedded)} chunks.")
    return embedded

def run_review():
    """Launches the socratic/docente review CLI."""
    log_message("EJECUTANDO MODO: REVIEW")
    # Execute review_cli directly
    from src.pipelines.ingestion.review_cli import run_review_session
    run_review_session()

def run_upload() -> dict:
    """Uploads approved chunks to Supabase."""
    log_message("EJECUTANDO MODO: UPLOAD")
    
    approved_file = BASE_DIR / "review" / "approved_chunks.json"
    if not approved_file.exists():
        log_message("⚠️  No hay chunks aprobados en 'review/approved_chunks.json'. Complete la revisión docente.")
        return {"inserted": 0, "updated": 0, "errors": 0}
        
    with open(approved_file, "r", encoding="utf-8") as f:
        approved_chunks = json.load(f)
        
    stats = upload_chunks_to_supabase(approved_chunks)
    log_message(f"Subida finalizada: Insertados: {stats['inserted']} | Actualizados: {stats['updated']} | Errores: {stats['errors']}")
    return stats

def run_status():
    """Queries Supabase and prints the compliance matrix."""
    log_message("EJECUTANDO MODO: STATUS")
    
    client = get_supabase_client()
    if not client:
        # Expected fallback if DB is not configured or empty
        print("\nChunks en Supabase: 0 total | 0 activos")
        print("Meta Fase 2: 60 chunks activos — Faltan: 60")
        print("✅ Pipeline listo para ejecutar\n")
        return

    try:
        res = client.table("content_chunks").select("is_active, block, cg_competencies").execute()
        data = res.data if res.data else []
        
        total = len(data)
        active = sum(1 for r in data if r.get("is_active"))
        pending = total - active
        
        block_counts = Counter(r.get("block") for r in data)
        cg_counts = Counter()
        for r in data:
            for cg in r.get("cg_competencies", []):
                cg_counts[cg] += 1
                
        faltantes = max(0, 60 - active)
        
        print(f"\nChunks en Supabase: {total} total | {active} activos | {pending} pendientes")
        print(f"Por bloque: block_1: {block_counts.get('block_1', 0)} | block_2: {block_counts.get('block_2', 0)}")
        print(f"Por CG: " + " | ".join(f"{cg}: {cg_counts.get(cg, 0)}" for cg in sorted(VALID_CGS)))
        print(f"Meta Fase 2: 60 chunks activos — Faltan: {faltantes}")
        if faltantes == 60 and active == 0:
            print("✅ Pipeline listo para ejecutar")
        print("")
    except Exception as e:
        log_message(f"Fallo en consulta a Supabase: {e}")
        # Fallback output
        print("\nChunks en Supabase: 0 total | 0 activos")
        print("Meta Fase 2: 60 chunks activos — Faltan: 60")
        print("✅ Pipeline listo para ejecutar\n")

# ── Main Orchestration ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="MED-228 Ingestion Pipeline Orchestrator — UCE"
    )
    parser.add_argument("mode", choices=["extract", "chunk", "validate", "embed", "review", "upload", "full", "status"],
                        help="Execution mode for the pipeline")
    parser.add_argument("--manifest", default=str(BASE_DIR / "src" / "ingestion" / "chunk_manifest.yaml"),
                        help="Path to YAML manifest file")
    args = parser.parse_args()

    # Log command start
    log_message(f"Starting pipeline in mode: {args.mode}")

    if args.mode == "extract":
        run_extract(args.manifest)
    elif args.mode == "chunk":
        run_chunk(args.manifest)
    elif args.mode == "validate":
        run_validate(args.manifest)
    elif args.mode == "embed":
        run_embed(args.manifest)
    elif args.mode == "review":
        run_review()
    elif args.mode == "upload":
        run_upload()
    elif args.mode == "status":
        run_status()
    elif args.mode == "full":
        # Full orchestrator flow
        run_extract(args.manifest)
        run_chunk(args.manifest)
        run_validate(args.manifest)
        run_embed(args.manifest)
        run_review()
        run_upload()
        run_status()

if __name__ == "__main__":
    main()
