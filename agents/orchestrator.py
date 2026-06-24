"""
Orchestrator Agent — NEXUS AI System
=====================================
Agente orquestador central. Recibe tareas de alto nivel,
las descompone en subtareas y las delega a agentes especializados.

Uso:
    python agents/orchestrator.py
    python agents/orchestrator.py --task "analiza la arquitectura del proyecto"
"""

import os
import sys
import json
import asyncio
import argparse
import logging
from pathlib import Path
from typing import Any, Optional
from datetime import datetime

# Asegura que el directorio raíz esté en el path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig, AgentMessage
from agents.rag_agent import RAGAgent
from agents.coding_agent import CodingAgent
from agents.research_agent import ResearchAgent
from agents.doc_agent import DocAgent

logger = logging.getLogger("orchestrator")


# ── Definición de tareas ────────────────────────────────────────────────────

TASK_ROUTING = {
    "code":        ["generate", "fix", "refactor", "implement", "debug"],
    "research":    ["analyze", "explain", "investigate", "study", "what is"],
    "rag":         ["find", "search", "retrieve", "from docs", "según el libro"],
    "docs":        ["document", "write docs", "readme", "generate docs"],
}


class OrchestratorAgent(BaseAgent):
    """
    Agente orquestador. Coordina el sistema multi-agente.

    Responsabilidades:
    - Recibir tareas en lenguaje natural
    - Clasificar el tipo de tarea
    - Delegar al agente especializado correcto
    - Agregar resultados
    - Mantener log de sesión
    """

    def __init__(self):
        super().__init__(AgentConfig(
            name="orchestrator",
            description="Coordinador central del sistema multi-agente NEXUS AI",
            preferred_model=os.getenv("OLLAMA_CHAT_MODEL", "qwen3:8b"),
            temperature=0.2,
        ))

        # Instanciar agentes especializados
        self.rag = RAGAgent()
        self.coder = CodingAgent()
        self.researcher = ResearchAgent()
        self.doc_writer = DocAgent()

        # Log de sesión
        self.session_log_file = Path("memory") / "session_log.jsonl"
        self.session_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        self.logger.info("🎯 Orquestador NEXUS AI iniciado")

    # ── Clasificación de tareas ─────────────────────────────────────────────

    def _classify_task(self, task: str) -> str:
        """
        Clasifica una tarea en una categoría para routing.

        Returns:
            'code' | 'research' | 'rag' | 'docs' | 'general'
        """
        task_lower = task.lower()
        for category, keywords in TASK_ROUTING.items():
            if any(kw in task_lower for kw in keywords):
                return category
        return "general"

    # ── Log de sesión ───────────────────────────────────────────────────────

    def _log_session(self, task: str, category: str, result: str, agent_used: str) -> None:
        """Registra la tarea en el log de sesión JSONL."""
        entry = {
            "session_id": self.session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "task": task[:200],  # truncar para no inflar el log
            "category": category,
            "agent_used": agent_used,
            "result_length": len(result),
            "success": True
        }
        with open(self.session_log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # ── Ejecución de tareas ─────────────────────────────────────────────────

    async def execute(self, task: str, context: Optional[str] = None) -> str:
        """
        Ejecuta una tarea delegando al agente apropiado.

        Args:
            task: Descripción de la tarea en lenguaje natural
            context: Contexto adicional opcional

        Returns:
            Resultado de la tarea
        """
        self.logger.info(f"📋 Tarea recibida: {task[:80]}...")

        # Clasificar
        category = self._classify_task(task)
        self.logger.info(f"🏷️  Categoría: {category}")

        # Construir prompt con contexto
        full_task = f"{task}\n\nContexto adicional: {context}" if context else task

        # Delegar al agente correcto
        result = ""
        agent_used = ""

        try:
            if category == "code":
                result = await self.coder.handle(full_task)
                agent_used = "coding_agent"

            elif category == "rag":
                result = await self.rag.query(full_task)
                agent_used = "rag_agent"

            elif category == "research":
                result = await self.researcher.investigate(full_task)
                agent_used = "research_agent"

            elif category == "docs":
                result = await self.doc_writer.generate(full_task)
                agent_used = "doc_agent"

            else:
                # Tarea general → orquestador la maneja directamente
                result = await self.generate(
                    prompt=full_task,
                    system_prompt=(
                        "Eres el asistente principal del sistema NEXUS AI para la "
                        "plataforma de Semiología Médica y NEXUS VAULT. "
                        "Responde de forma precisa, estructurada y accionable. "
                        "Siempre considera el contexto del proyecto médico educativo."
                    )
                )
                agent_used = "orchestrator"

            # Registrar en log
            self._log_session(task, category, result, agent_used)

            self.logger.info(f"✅ Tarea completada por: {agent_used}")
            return result

        except Exception as e:
            error_msg = f"Error ejecutando tarea ({category}): {e}"
            self.logger.error(error_msg)
            self._log_session(task, category, str(e), agent_used or "error")
            raise

    async def run_interactive(self) -> None:
        """Modo interactivo — chatea con el orquestador via CLI."""
        print("\n" + "="*60)
        print("🤖 NEXUS AI — Orquestador Interactivo")
        print("   Modelo local: qwen3:8b via Ollama")
        print("   Escribe 'exit' para salir | 'status' para estado")
        print("="*60 + "\n")

        while True:
            try:
                task = input("📝 Tarea > ").strip()
                if not task:
                    continue
                if task.lower() == "exit":
                    print("👋 Hasta luego.")
                    break
                if task.lower() == "status":
                    status = await self.health_check()
                    print(json.dumps(status, indent=2))
                    continue

                result = await self.execute(task)
                print(f"\n{'─'*60}")
                print(result)
                print(f"{'─'*60}\n")

            except KeyboardInterrupt:
                print("\n👋 Interrumpido por usuario.")
                break
            except Exception as e:
                print(f"❌ Error: {e}")


# ── Entrypoint ──────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(
        description="NEXUS AI Orchestrator — Multi-agent coordinator"
    )
    parser.add_argument("--task", type=str, help="Tarea a ejecutar (no-interactivo)")
    parser.add_argument("--context", type=str, help="Contexto adicional", default=None)
    parser.add_argument("--status", action="store_true", help="Ver estado del sistema")
    args = parser.parse_args()

    async with OrchestratorAgent() as agent:
        if args.status:
            status = await agent.health_check()
            print(json.dumps(status, indent=2, ensure_ascii=False))

        elif args.task:
            result = await agent.execute(args.task, args.context)
            print(result)

        else:
            await agent.run_interactive()


if __name__ == "__main__":
    asyncio.run(main())
