import os
import time
import numpy as np
import json
import urllib.request

def generate_openai_embedding(text: str, client, model="text-embedding-3-small") -> list[float]:
    """Generates embedding using OpenAI API client."""
    response = client.embeddings.create(
        input=[text.replace("\n", " ")],
        model=model
    )
    return response.data[0].embedding

def generate_ollama_embedding(text: str, base_url: str, model: str, timeout_seconds: int = 30) -> list[float] | None:
    """Generates embedding using local Ollama /api/embeddings endpoint."""
    url = f"{base_url.rstrip('/')}/api/embeddings"
    payload = {
        "model": model,
        "prompt": text.replace("\n", " ")
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("embedding")
    except Exception:
        return None

def generate_offline_embedding() -> list[float]:
    """Generates a pseudo-random 1536-dimensional vector as offline fallback."""
    # Generate 1536 zeros with a tiny random noise
    vec = np.random.normal(loc=0.0, scale=0.0001, size=1536)
    return vec.tolist()

def embed_chunks(chunks: list[dict], batch_size: int = 20) -> list[dict]:
    """
    Generates embeddings for a list of chunks.
    Processes in batches of batch_size, sleeps 0.5s between batches.
    Skips chunks that already have embeddings.
    """
    provider = os.environ.get("EMBEDDING_PROVIDER", "ollama").strip().lower()

    api_key = os.environ.get("OPENAI_API_KEY")
    client = None
    ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")

    if provider == "openai" and api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            print("[EMBEDDER]: OpenAI API client initialized.")
        except ImportError:
            print("[EMBEDDER]: openai package not installed. Falling back to offline embeddings.")
    elif provider == "openai":
        print("[EMBEDDER]: OPENAI_API_KEY not found. Falling back to local/OFFLINE embeddings.")
    elif provider == "ollama":
        print(f"[EMBEDDER]: Using local Ollama embeddings ({ollama_model}) at {ollama_base_url}.")
    else:
        print("[EMBEDDER]: Unknown EMBEDDING_PROVIDER. Using offline fallback.")

    embedded_chunks = []
    
    # Filter chunks that need embedding
    chunks_to_process = []
    for chunk in chunks:
        if chunk.get("embedding") is not None:
            embedded_chunks.append(chunk)
        else:
            chunks_to_process.append(chunk)

    total = len(chunks_to_process)
    print(f"[EMBEDDER]: Processing {total} chunks requiring embeddings.")

    for i in range(0, total, batch_size):
        batch = chunks_to_process[i:i + batch_size]
        print(f"[EMBEDDER]: Processing batch {i // batch_size + 1} ({len(batch)} chunks)...")
        
        for chunk in batch:
            try:
                if provider == "openai" and client:
                    embedding = generate_openai_embedding(chunk["chunk_text"], client)
                elif provider == "ollama":
                    embedding = generate_ollama_embedding(chunk["chunk_text"], ollama_base_url, ollama_model)
                    if embedding is None:
                        embedding = generate_offline_embedding()
                else:
                    embedding = generate_offline_embedding()
                chunk["embedding"] = embedding
            except Exception as e:
                print(f"[EMBEDDER WARNING]: Failed to embed chunk: {e}. Using offline fallback.")
                try:
                    chunk["embedding"] = generate_offline_embedding()
                except Exception:
                    chunk["embedding"] = [0.0] * 1536
            
            embedded_chunks.append(chunk)

        # Sleep between batches
        if i + batch_size < total:
            time.sleep(0.5)

    return embedded_chunks
