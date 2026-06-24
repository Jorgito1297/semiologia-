"""
Coding Agent — NEXUS AI System
================================
Agente especializado en generación, refactoring y revisión de código.
Usa qwen2.5-coder:7b como modelo principal (optimizado para código).

Capacidades:
- Generar código TypeScript/Python/SQL
- Refactorizar código existente
- Revisar código (code review)
- Generar tests unitarios
- Explicar código complejo
- Detectar bugs y vulnerabilidades
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig


CODING_SYSTEM_PROMPT = """
Eres un Senior Software Engineer especializado en:
- TypeScript / React / Next.js / NestJS
- Python / FastAPI / SQLAlchemy
- PostgreSQL / Prisma / Supabase
- Docker / CI/CD / DevSecOps
- Firebase Auth / JWT

Reglas para todo el código que generes:
1. TypeScript strict mode siempre — nunca `any`
2. Manejo de errores explícito (try/catch, Result types)
3. Comentarios en español para el negocio, inglés para código técnico
4. Principios SOLID y patrones de diseño cuando aplique
5. Sin secretos hardcodeados — siempre process.env o os.getenv()
6. Tests incluidos cuando se pida implementación completa
7. Código production-ready, no MVP mínimo

Cuando respondas:
- Proporciona el código completo, no fragmentos parciales
- Explica brevemente las decisiones de diseño importantes
- Señala posibles mejoras o consideraciones de seguridad
"""


class CodingAgent(BaseAgent):
    """
    Agente de generación y revisión de código.
    Usa qwen2.5-coder:7b como modelo preferido.
    """

    def __init__(self):
        super().__init__(AgentConfig(
            name="coding_agent",
            description="Generación, refactoring y revisión de código enterprise",
            preferred_model=os.getenv("OLLAMA_CODE_MODEL", "qwen2.5-coder:7b"),
            temperature=0.1,  # Muy baja temperatura para código determinista
            max_tokens=8192,
        ))

    async def handle(self, task: str) -> str:
        """Maneja una tarea de código."""
        return await self.generate(
            prompt=task,
            system_prompt=CODING_SYSTEM_PROMPT
        )

    async def review(self, code: str, language: str = "typescript") -> str:
        """
        Realiza un code review completo.

        Args:
            code: Código a revisar
            language: Lenguaje del código

        Returns:
            Reporte de review con bugs, mejoras y security issues
        """
        prompt = (
            f"Realiza un code review exhaustivo del siguiente código {language}.\n\n"
            f"Evalúa:\n"
            f"1. 🐛 Bugs y errores potenciales\n"
            f"2. 🔒 Vulnerabilidades de seguridad\n"
            f"3. 📐 Calidad y legibilidad del código\n"
            f"4. ⚡ Problemas de performance\n"
            f"5. 🧪 Cobertura de tests sugerida\n\n"
            f"CÓDIGO:\n```{language}\n{code}\n```"
        )
        return await self.generate(prompt, system_prompt=CODING_SYSTEM_PROMPT)

    async def generate_tests(self, code: str, framework: str = "jest") -> str:
        """
        Genera tests unitarios para el código dado.

        Args:
            code: Código a testear
            framework: Framework de testing (jest, pytest, etc.)

        Returns:
            Suite de tests completa
        """
        prompt = (
            f"Genera tests unitarios completos con {framework} para el siguiente código.\n\n"
            f"Incluye:\n"
            f"- Happy path\n"
            f"- Edge cases\n"
            f"- Error handling\n"
            f"- Mocks necesarios\n\n"
            f"CÓDIGO:\n```\n{code}\n```"
        )
        return await self.generate(prompt, system_prompt=CODING_SYSTEM_PROMPT)

    async def explain(self, code: str) -> str:
        """Explica código complejo en español."""
        prompt = (
            f"Explica el siguiente código de forma clara y didáctica en español.\n\n"
            f"Estructura tu respuesta así:\n"
            f"1. **¿Qué hace?** — Propósito general\n"
            f"2. **¿Cómo funciona?** — Paso a paso\n"
            f"3. **Conceptos clave** — Patrones o técnicas utilizadas\n"
            f"4. **Posibles mejoras** — Si aplica\n\n"
            f"CÓDIGO:\n```\n{code}\n```"
        )
        return await self.generate(prompt, system_prompt=CODING_SYSTEM_PROMPT)
