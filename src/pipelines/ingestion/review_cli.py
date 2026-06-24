import os
import json
import datetime
from pathlib import Path

# Setup review directory path relative to project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
REVIEW_DIR = BASE_DIR / "review"

def get_pending_files() -> list[Path]:
    """Finds all *_chunks_pending.json files in the review directory."""
    if not REVIEW_DIR.exists():
        REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    return list(REVIEW_DIR.glob("*_chunks_pending.json"))

def load_chunks_from_files() -> list[dict]:
    """Loads all pending chunks from *_chunks_pending.json files."""
    files = get_pending_files()
    all_chunks = []
    for f in files:
        try:
            with open(f, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, list):
                    all_chunks.extend(data)
                elif isinstance(data, dict):
                    all_chunks.append(data)
        except Exception as e:
            print(f"[REVIEW CLI ERROR]: Failed to load file {f.name}: {e}")
    return all_chunks

def edit_metadata(chunk: dict) -> dict:
    """Prompts user to edit chunk metadata."""
    print("\n📝 EDITANDO METADATA:")
    
    topic = input(f"Tema [{chunk.get('topic', '')}]: ").strip()
    if topic: chunk["topic"] = topic

    week_str = input(f"Semana [{chunk.get('week', '')}]: ").strip()
    if week_str:
        try:
            chunk["week"] = int(week_str)
        except ValueError:
            print("Semana inválida (debe ser número).")

    block = input(f"Bloque [{chunk.get('block', '')}]: ").strip()
    if block: chunk["block"] = block

    cgs_str = input(f"CG Competencies (separadas por coma) [{','.join(chunk.get('cg_competencies', []))}]: ").strip()
    if cgs_str:
        chunk["cg_competencies"] = [cg.strip() for cg in cgs_str.split(",") if cg.strip()]

    domain = input(f"Memory Domain [{chunk.get('memory_domain', '')}]: ").strip()
    if domain: chunk["memory_domain"] = domain

    ctype = input(f"Content Type [{chunk.get('content_type', '')}]: ").strip()
    if ctype: chunk["content_type"] = ctype

    print("✅ Metadata actualizada.")
    return chunk

def run_review_session():
    """Starts the CLI review session."""
    pending_chunks = load_chunks_from_files()
    if not pending_chunks:
        print("\n🎉 No hay chunks pendientes de revisión en 'review/*_chunks_pending.json'.")
        return

    approved_chunks = []
    rejected_chunks = []
    skipped_count = 0

    total_chunks = len(pending_chunks)
    print(f"\n==================================================")
    print(f"  SESIÓN DE VALIDACIÓN DOCENTE — DR. TUSEN")
    print(f"  Total chunks pendientes: {total_chunks}")
    print(f"==================================================")

    idx = 0
    while idx < total_chunks:
        chunk = pending_chunks[idx]
        
        # Display chunk
        print("\n" + "═" * 50)
        print(f"CHUNK {idx + 1}/{total_chunks} | Semana {chunk.get('week', 'N/A')} | {chunk.get('block', 'N/A')} | {chunk.get('memory_domain', 'N/A')}")
        print(f"Tema: {chunk.get('topic', 'N/A')}")
        print(f"Fuente: {chunk.get('source_book', 'N/A')} — Cap. {chunk.get('source_chapter', 'N/A')} (pág. {chunk.get('source_pages', 'N/A')})")
        print(f"CGs: {', '.join(chunk.get('cg_competencies', []))} | Tipo: {chunk.get('content_type', 'N/A')}")
        print("-" * 50)
        print("TEXTO:")
        print(chunk.get("chunk_text", ""))
        print("═" * 50)
        
        action = input("[A]probar  [R]echazar  [E]ditar metadata  [S]altar  [G]uardar y salir: ").strip().upper()

        if action == "A":
            chunk["validated_by"] = "Dr. Angel Augusto Tusen Madrigal"
            chunk["validated_date"] = datetime.date.today().isoformat()
            chunk["is_active"] = True
            approved_chunks.append(chunk)
            print("✅ Chunk Aprobado.")
            idx += 1
        elif action == "R":
            reason = input("Escribe la razón del rechazo: ").strip()
            chunk["validation_notes"] = f"Rechazado: {reason}"
            chunk["is_active"] = False
            rejected_chunks.append(chunk)
            print("❌ Chunk Rechazado.")
            idx += 1
        elif action == "E":
            pending_chunks[idx] = edit_metadata(chunk)
        elif action == "S":
            skipped_count += 1
            print("➡️ Saltado.")
            idx += 1
        elif action == "G":
            print("\n💾 Guardando y saliendo...")
            break
        else:
            print("Opción inválida. Intente de nuevo.")

    # Save results
    if approved_chunks:
        approved_file = REVIEW_DIR / "approved_chunks.json"
        existing_approved = []
        if approved_file.exists():
            try:
                with open(approved_file, "r", encoding="utf-8") as f:
                    existing_approved = json.load(f)
            except Exception:
                pass
        existing_approved.extend(approved_chunks)
        with open(approved_file, "w", encoding="utf-8") as f:
            json.dump(existing_approved, f, indent=2, ensure_ascii=False)

    if rejected_chunks:
        rejected_file = REVIEW_DIR / "rejected_chunks.json"
        existing_rejected = []
        if rejected_file.exists():
            try:
                with open(rejected_file, "r", encoding="utf-8") as f:
                    existing_rejected = json.load(f)
            except Exception:
                pass
        existing_rejected.extend(rejected_chunks)
        with open(rejected_file, "w", encoding="utf-8") as f:
            json.dump(existing_rejected, f, indent=2, ensure_ascii=False)

    # Show progress
    print("\n==================================================")
    print("PROGRESO DE LA SESIÓN:")
    print(f"  Aprobados  : {len(approved_chunks)}")
    print(f"  Rechazados : {len(rejected_chunks)}")
    print(f"  Saltados   : {skipped_count}")
    print("==================================================")

    # Show summary counts per block and CG
    from collections import Counter
    all_processed = approved_chunks + rejected_chunks
    block_counts = Counter(c.get("block") for c in all_processed)
    cg_counts = Counter()
    for c in all_processed:
        for cg in c.get("cg_competencies", []):
            cg_counts[cg] += 1

    print("\nRESUMEN DE CHUNKS PROCESADOS:")
    print("  Por Bloque:")
    for b, count in block_counts.items():
         print(f"    - {b}: {count}")
    print("  Por Competencia General (CG):")
    for cg, count in cg_counts.items():
         print(f"    - {cg}: {count}")
    print("==================================================\n")

if __name__ == "__main__":
    run_review_session()
