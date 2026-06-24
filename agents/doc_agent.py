"""
Documentation Agent — NEXUS AI System
=======================================
Agente especializado en generación automática de documentación.
Genera: READMEs, JSDoc/TSDoc, docstrings, changelogs, ADRs.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig


DOC_SYSTEM_PROMPT = """
Eres un Technical Writer senior especializado en documentación de software enterprise.

Principios de documentación que sigues:
1. Claridad sobre brevedad — explica el "por qué" no solo el "qué"
2. Ejemplos concretos siempre que sea posible
3. Formato Markdown profesional con emojis estratégicos
4. Documentación que no envejece rápido (evita referencias a versiones específicas)
5. Orientada al lector: dev junior puede entenderla, dev senior la valora

Formatos que dominas:
- README.md (estructura: badges → descripción → instalación → uso → API → contribución)
- JSDoc/TSDoc para TypeScript
- Docstrings Google-style para Python
- Architecture Decision Records (ADR)
- Changelogs (Keep a Changelog format)
- API documentation (OpenAPI/Swagger descriptions)
"""


class DocAgent(BaseAgent):
    """Agente de generación de documentación técnica."""

    def __init__(self):
        super().__init__(AgentConfig(
            name="doc_agent",
            description="Generación automática de documentación técnica",
            preferred_model=os.getenv("OLLAMA_CHAT_MODEL", "qwen3:8b"),
            temperature=0.5,  # Balance entre creatividad y precisión
        ))

    async def generate(self, task: str) -> str:
        """Genera documentación para una tarea dada."""
        return await self.generate(task, system_prompt=DOC_SYSTEM_PROMPT)

    async def generate_readme(self, project_description: str) -> str:
        """Genera un README.md profesional."""
        prompt = (
            f"Genera un README.md profesional y completo para:\n\n{project_description}\n\n"
            f"Incluye: badges, descripción, arquitectura, "
            f"instalación paso a paso, uso, API reference, deployment, contributing, license."
        )
        result = await self.generate(prompt, system_prompt=DOC_SYSTEM_PROMPT)
        return result

    async def generate_adr(self, decision: str, context: str, options: str) -> str:
        """
        Genera un Architecture Decision Record (ADR).

        Args:
            decision: La decisión tomada
            context: Contexto que llevó a la decisión
            options: Opciones consideradas

        Returns:
            ADR en formato Markdown
        """
        prompt = (
            f"Genera un Architecture Decision Record (ADR) para:\n\n"
            f"**Decisión**: {decision}\n"
            f"**Contexto**: {context}\n"
            f"**Opciones consideradas**: {options}\n\n"
            f"Sigue el formato estándar de Michael Nygard: "
            f"Status → Context → Decision → Consequences"
        )
        return await self.generate(prompt, system_prompt=DOC_SYSTEM_PROMPT)

    async def generate_changelog_entry(self, changes: list[str], version: str) -> str:
        """Genera una entrada de CHANGELOG siguiendo Keep a Changelog."""
        changes_text = "\n".join(f"- {c}" for c in changes)
        prompt = (
            f"Genera una entrada de CHANGELOG en formato 'Keep a Changelog' "
            f"para la versión {version} con los siguientes cambios:\n\n{changes_text}\n\n"
            f"Categorías: Added, Changed, Deprecated, Removed, Fixed, Security"
        )
        return await self.generate(prompt, system_prompt=DOC_SYSTEM_PROMPT)
