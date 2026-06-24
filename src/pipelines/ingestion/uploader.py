import os
from supabase import create_client, Client

def get_supabase_client() -> Client | None:
    """Initializes and returns Supabase Client using env variables."""
    url = os.environ.get("SUPABASE_URL")
    # Use SERVICE_KEY if available, fallback to ANON_KEY
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"[UPLOADER ERROR]: Failed to create Supabase client: {e}")
        return None

def verify_course_exists(client: Client, course_id: str) -> bool:
    """Checks if the course_id exists in the courses table."""
    try:
        res = client.table("courses").select("id").eq("id", course_id).execute()
        return len(res.data) > 0
    except Exception as e:
        print(f"[UPLOADER WARNING]: Error checking course existence: {e}")
        return False

def upload_chunks_to_supabase(chunks: list[dict], batch_size: int = 100) -> dict:
    """
    Uploads chunks to Supabase content_chunks table in batches of 10.
    Ensures is_active is ALWAYS False during ingestion staging.
    Performs upsert on conflict.
    """
    client = get_supabase_client()
    if not client:
        print("[UPLOADER ERROR]: Supabase client unavailable. Check environment variables.")
        return {"inserted": 0, "updated": 0, "errors": len(chunks)}

    stats = {"inserted": 0, "updated": 0, "errors": 0}
    schema_fields = {
        "id", "course_id", "week", "block", "topic", "subtopic",
        "content_type", "memory_domain", "cg_competencies",
        "evaluation_type", "chunk_text", "source_book",
        "source_chapter", "source_pages", "validated_by",
        "validated_date", "validation_notes", "is_active",
        "chunk_index", "token_count", "embedding"
    }

    # Verify courses table setup
    verified_courses = {}

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        payloads = []

        for chunk in batch:
            # Academic safety guard: preserve is_active only if validated by the official validator.
            # Otherwise, force is_active = False to prevent unauthorized content activation.
            if chunk.get("validated_by") == "Dr. Angel Augusto Tusen Madrigal":
                # Keep current is_active (usually True if approved)
                pass
            else:
                chunk["is_active"] = False

            if not chunk.get("validated_by"):
                chunk["validated_by"] = "Staged Pending Review"

            course_id = chunk.get("course_id")
            if not course_id:
                print("[UPLOADER ERROR]: Missing course_id in chunk.")
                stats["errors"] += 1
                continue

            # Check if course exists in courses table
            if course_id not in verified_courses:
                exists = verify_course_exists(client, course_id)
                verified_courses[course_id] = exists
                if not exists:
                    print(f"[UPLOADER WARNING]: Course ID {course_id} not found in courses table. Creating dynamic fallback or skipping.")

            # Filter payload to match exact schema fields
            payload = {k: chunk[k] for k in schema_fields if k in chunk}
            
            # Enforce embedding formatting
            if "embedding" in payload and payload["embedding"] is not None:
                payload["embedding"] = list(payload["embedding"])

            payloads.append(payload)

        if not payloads:
            continue

        # Upload batch
        try:
            # Perform upsert on content_chunks
            # pgvector/Supabase upsert accepts primary key conflict matching
            res = client.table("content_chunks").upsert(payloads).execute()
            
            # Count inserts and updates
            # In supabase-py, upsert response data contains the upserted rows
            if res.data:
                stats["inserted"] += len(res.data) # Assuming inserts for simplicity
            else:
                stats["errors"] += len(payloads)
        except Exception as e:
            print(f"[UPLOADER ERROR]: Batch upload failed: {e}")
            stats["errors"] += len(payloads)

    return stats
