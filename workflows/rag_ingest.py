"""
RAG Ingest Workflow — NEXUS AI System
=======================================
Ingesta documentos al índice RAG del sistema.
Soporta: archivos .txt, .md, código fuente.
Para PDFs: requiere instalar pdfplumber (pip install pdfplumber).

Uso:
    python workflows/rag_ingest.py --dir books/        # Ingesta PDFs médicos
    python workflows/rag_ingest.py --dir src/          # Ingesta código fuente
    python workflows/rag_ingest.py --all               # Ingesta todo el proyecto
    python workflows/rag_ingest.py --query "¿Qué es la auscultación?"
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.rag_agent import RAGAgent

PROJECT_ROOT = Path(__file__).parent.parent


async def main():
    parser = argparse.ArgumentParser(description="NEXUS RAG Ingest Workflow")
    parser.add_argument("--dir", type=str, help="Directorio a indexar")
    parser.add_argument("--all", action="store_true", help="Indexar proyecto completo")
    parser.add_argument("--query", type=str, help="Hacer una consulta al RAG")
    parser.add_argument("--top-k", type=int, default=5, help="Chunks a recuperar")
    args = parser.parse_args()

    async with RAGAgent() as agent:
        if args.all:
            print("📚 Indexando proyecto completo (excluyendo node_modules, .git)...")
            count = await agent.ingest_directory(PROJECT_ROOT)
            print(f"✅ Indexación completa: {count} chunks")

        elif args.dir:
            target = Path(args.dir)
            if not target.is_absolute():
                target = PROJECT_ROOT / target
            if not target.exists():
                print(f"❌ Directorio no encontrado: {target}")
                sys.exit(1)
            print(f"📚 Indexando: {target}")
            count = await agent.ingest_directory(target)
            print(f"✅ {count} chunks indexados de {target}")

        elif args.query:
            result = await agent.query(args.query, args.top_k)
            print(f"\n{'─'*60}\n{result}\n{'─'*60}")

        else:
            print("Uso: python rag_ingest.py --dir <ruta> | --all | --query '<pregunta>'")
            print("\nEjemplos:")
            print("  python workflows/rag_ingest.py --all")
            print("  python workflows/rag_ingest.py --dir books/")
            print("  python workflows/rag_ingest.py --query '¿Qué es la semiología?'")


if __name__ == "__main__":
    asyncio.run(main())
