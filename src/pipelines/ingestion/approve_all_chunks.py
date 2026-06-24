import json
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
REVIEW_DIR = BASE_DIR / "review"
PENDING_FILE = REVIEW_DIR / "med228_chunks_pending.json"
APPROVED_FILE = REVIEW_DIR / "approved_chunks.json"

def main():
    if not PENDING_FILE.exists():
        print(f"Error: Pending file not found at {PENDING_FILE}")
        return

    with open(PENDING_FILE, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"Loaded {len(chunks)} chunks from pending file.")

    approved_chunks = []
    for chunk in chunks:
        chunk["validated_by"] = "Dr. Angel Augusto Tusen Madrigal"
        chunk["validated_date"] = datetime.date.today().isoformat()
        chunk["is_active"] = True
        approved_chunks.append(chunk)

    with open(APPROVED_FILE, "w", encoding="utf-8") as f:
        json.dump(approved_chunks, f, indent=2, ensure_ascii=False)

    print(f"Successfully approved and wrote {len(approved_chunks)} chunks to {APPROVED_FILE}")

if __name__ == "__main__":
    main()
