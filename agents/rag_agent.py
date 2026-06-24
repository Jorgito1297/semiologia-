"""
RAG Agent — NEXUS AI System
============================
Agente especializado en Retrieval-Augmented Generation.
Indexa y consulta la base de conocimiento médica del proyecto:
- PDFs: Llanio Tomo I y II de Semiología
- Documentos de planificación docente
- Código del proyecto (para queries técnicas)

Uso:
    python agents/rag_agent.py --query "¿Qué es la auscultación?"
    python agents/rag_agent.py --index  # re-indexa todos los documentos
"""

import os
import sys
import json
import asyncio
import argparse
import hashlib
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig


# ── Paths ───────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
BOOKS_DIR = PROJECT_ROOT / "books"
CHUNKS_DIR = PROJECT_ROOT / "memory" / "rag_chunks"
INDEX_FILE = PROJECT_ROOT / "memory" / "rag_index.json"
CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

# Configuración de chunking
CHUNK_SIZE = 500       # palabras por chunk
CHUNK_OVERLAP = 50     # palabras de solapamiento


class RAGAgent(BaseAgent):
    """
    Agente RAG para consultas sobre la base de conocimiento médica.

    Pipeline:
    1. INGESTIÓN: PDF → texto → chunks → embeddings → índice JSON
    2. RETRIEVAL: query → embedding → similarity search → top-k chunks
    3. GENERATION: chunks + query → Ollama → respuesta fundamentada
    """

    def __init__(self):
        super().__init__(AgentConfig(
            name="rag_agent",
            description="Retrieval-Augmented Generation sobre base de conocimiento médica",
            preferred_model=os.getenv("OLLAMA_CHAT_MODEL", "qwen3:8b"),
            temperature=0.1,   # Baja temperatura para respuestas basadas en hechos
        ))
        self.embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        self.index: list[dict[str, Any]] = []
        self._load_index()

    # ── GESTIÓN DE ÍNDICE ───────────────────────────────────────────────────

    def _load_index(self) -> None:
        """Carga el índice RAG desde disco si existe."""
        if INDEX_FILE.exists():
            try:
                with open(INDEX_FILE, encoding="utf-8") as f:
                    self.index = json.load(f)
                self.logger.info(f"Índice RAG cargado: {len(self.index)} chunks")
            except Exception as e:
                self.logger.warning(f"No se pudo cargar índice: {e}")
                self.index = []
        else:
            self.logger.info("No hay índice RAG. Ejecuta --index para crear uno.")

    def _save_index(self) -> None:
        """Guarda el índice RAG en disco."""
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(self.index, f, ensure_ascii=False, indent=2)
        self.logger.info(f"Índice guardado: {len(self.index)} chunks → {INDEX_FILE}")

    # ── CHUNKING DE TEXTO ───────────────────────────────────────────────────

    def _chunk_text(self, text: str, source: str) -> list[dict[str, Any]]:
        """
        Divide un texto en chunks solapados para mejor retrieval.

        Args:
            text: Texto completo del documento
            source: Nombre del archivo fuente

        Returns:
            Lista de chunks con metadatos
        """
        words = text.split()
        chunks = []
        step = CHUNK_SIZE - CHUNK_OVERLAP

        for i in range(0, len(words), step):
            chunk_words = words[i:i + CHUNK_SIZE]
            if len(chunk_words) < 20:  # ignorar chunks muy pequeños
                continue
            chunk_text = " ".join(chunk_words)
            chunk_id = hashlib.md5(f"{source}:{i}".encode()).hexdigest()[:12]
            chunks.append({
                "id": chunk_id,
                "source": source,
                "chunk_index": len(chunks),
                "text": chunk_text,
                "word_count": len(chunk_words),
                "embedding": None  # se llena en ingestión
            })

        return chunks

    # ── INGESTIÓN DE DOCUMENTOS ─────────────────────────────────────────────

    async def ingest_directory(self, directory: Path) -> int:
        """
        Ingesta todos los documentos de texto (.txt, .md) en un directorio.
        Para PDFs necesitarías PyMuPDF/pdfplumber (instalado aparte).

        Args:
            directory: Directorio a escanear

        Returns:
            Número de chunks indexados
        """
        total_chunks = 0
        self.index = []  # reset índice

        text_extensions = {".txt", ".md", ".py", ".ts", ".tsx", ".js"}
        files = list(directory.rglob("*"))

        for file_path in files:
            if file_path.suffix.lower() not in text_extensions:
                continue
            if any(skip in str(file_path) for skip in ["node_modules", ".git", "__pycache__", ".next"]):
                continue

            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
                if len(text.strip()) < 100:  # ignorar archivos muy pequeños
                    continue

                chunks = self._chunk_text(text, str(file_path.relative_to(PROJECT_ROOT)))
                self.logger.info(f"  {file_path.name}: {len(chunks)} chunks")

                # Generar embeddings para cada chunk
                for chunk in chunks:
                    try:
                        chunk["embedding"] = await self.embed(chunk["text"], self.embed_model)
                    except Exception as e:
                        self.logger.warning(f"    Embedding falló para chunk {chunk['id']}: {e}")
                        chunk["embedding"] = []

                self.index.extend(chunks)
                total_chunks += len(chunks)

            except Exception as e:
                self.logger.warning(f"No se pudo leer {file_path}: {e}")

        self._save_index()
        self.logger.info(f"✅ Ingestión completa: {total_chunks} chunks de {len(files)} archivos")
        return total_chunks

    # ── RETRIEVAL ───────────────────────────────────────────────────────────

    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """Calcula similitud coseno entre dos vectores."""
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = sum(x * x for x in a) ** 0.5
        mag_b = sum(x * x for x in b) ** 0.5
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    async def retrieve(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """
        Recupera los chunks más relevantes para una query.

        Args:
            query: Pregunta o búsqueda del usuario
            top_k: Número de chunks a retornar

        Returns:
            Lista de chunks ordenados por relevancia
        """
        if not self.index:
            return []

        # Generar embedding de la query
        query_embedding = await self.embed(query, self.embed_model)

        # Calcular similitud con todos los chunks indexados
        scored = []
        for chunk in self.index:
            if not chunk.get("embedding"):
                continue
            score = self._cosine_similarity(query_embedding, chunk["embedding"])
            scored.append({**chunk, "score": score})

        # Ordenar por score descendente
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    # ── GENERACIÓN CON CONTEXTO ─────────────────────────────────────────────

    async def query(self, question: str, top_k: int = 5) -> str:
        """
        Responde una pregunta usando RAG: retrieval + generation.

        Args:
            question: Pregunta del usuario
            top_k: Chunks de contexto a usar

        Returns:
            Respuesta fundamentada en los documentos
        """
        self.logger.info(f"RAG query: {question[:60]}...")

        # Recuperar contexto relevante
        relevant_chunks = await self.retrieve(question, top_k)

        if not relevant_chunks:
            self.logger.warning("No hay chunks relevantes. ¿El índice está vacío?")
            # Responder sin RAG (conocimiento general)
            return await self.generate(question)

        # Construir contexto
        context_parts = []
        for i, chunk in enumerate(relevant_chunks, 1):
            context_parts.append(
                f"[Fuente {i}: {chunk['source']} | relevancia: {chunk['score']:.2f}]\n"
                f"{chunk['text']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        # Prompt RAG
        system_prompt = (
            "Eres un asistente médico educativo especializado en Semiología Médica. "
            "Responde SOLO basándote en el contexto proporcionado. "
            "Si la información no está en el contexto, dilo claramente. "
            "Cita las fuentes cuando sea relevante. "
            "Usa lenguaje claro y apropiado para estudiantes de medicina."
        )

        rag_prompt = (
            f"CONTEXTO RECUPERADO:\n{context}\n\n"
            f"PREGUNTA: {question}\n\n"
            "Responde basándote en el contexto anterior."
        )

        return await self.generate(rag_prompt, system_prompt=system_prompt)


# ── Entrypoint ──────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="NEXUS RAG Agent")
    parser.add_argument("--query", type=str, help="Pregunta a responder")
    parser.add_argument("--index", action="store_true", help="Re-indexar documentos")
    parser.add_argument("--dir", type=str, help="Directorio a indexar", default=str(PROJECT_ROOT))
    parser.add_argument("--top-k", type=int, default=5, help="Chunks a recuperar")
    args = parser.parse_args()

    async with RAGAgent() as agent:
        if args.index:
            print(f"📚 Indexando directorio: {args.dir}")
            count = await agent.ingest_directory(Path(args.dir))
            print(f"✅ {count} chunks indexados")

        elif args.query:
            result = await agent.query(args.query, args.top_k)
            print(f"\n{'─'*60}\n{result}\n{'─'*60}")

        else:
            print("Uso: python rag_agent.py --query '¿Qué es?' | --index")


if __name__ == "__main__":
    asyncio.run(main())
