"""
Research Agent — NEXUS AI System
==================================
Agente especializado en investigación, análisis y síntesis de información.
Ideal para: analizar arquitecturas, estudiar documentación, explicar conceptos.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig


RESEARCH_SYSTEM_PROMPT = """
Eres un investigador senior especializado en:
- Arquitecturas de software enterprise
- Sistemas de IA y machine learning
- Medicina y ciencias de la salud (para el contexto de Semiología)
- DevOps y seguridad informática

Cuando investigas y analizas:
1. Sé preciso y basado en hechos verificables
2. Estructura tus respuestas con encabezados claros
3. Incluye pros y contras cuando analices opciones
4. Cita fuentes o base de conocimiento cuando corresponda
5. Distingue entre lo que sabes con certeza y lo que es inferencia
6. Proporciona ejemplos concretos y accionables
7. Responde en el idioma de la pregunta (español si preguntan en español)
"""


class ResearchAgent(BaseAgent):
    """Agente de investigación y análisis."""

    def __init__(self):
        super().__init__(AgentConfig(
            name="research_agent",
            description="Investigación, análisis y síntesis de información técnica y médica",
            preferred_model=os.getenv("OLLAMA_CHAT_MODEL", "qwen3:8b"),
            temperature=0.4,  # Algo más creativo para síntesis
        ))

    async def investigate(self, topic: str) -> str:
        """Investiga y sintetiza información sobre un tema."""
        return await self.generate(topic, system_prompt=RESEARCH_SYSTEM_PROMPT)

    async def analyze_architecture(self, description: str) -> str:
        """
        Analiza una arquitectura de software y proporciona recomendaciones.

        Args:
            description: Descripción de la arquitectura a analizar

        Returns:
            Análisis detallado con fortalezas, debilidades y recomendaciones
        """
        prompt = (
            f"Analiza la siguiente arquitectura de software:\n\n{description}\n\n"
            f"Proporciona:\n"
            f"## Análisis de Arquitectura\n"
            f"### Fortalezas\n"
            f"### Debilidades y Riesgos\n"
            f"### Recomendaciones de Mejora\n"
            f"### Consideraciones de Escalabilidad\n"
            f"### Consideraciones de Seguridad\n"
            f"### Roadmap Sugerido (corto, mediano, largo plazo)"
        )
        return await self.generate(prompt, system_prompt=RESEARCH_SYSTEM_PROMPT)

    async def compare_options(self, option_a: str, option_b: str, context: str = "") -> str:
        """Compara dos opciones técnicas y recomienda la mejor."""
        prompt = (
            f"Compara estas dos opciones técnicas:\n\n"
            f"**Opción A**: {option_a}\n"
            f"**Opción B**: {option_b}\n"
            f"{'**Contexto**: ' + context if context else ''}\n\n"
            f"Estructura: Tabla comparativa → Análisis de casos de uso → "
            f"Recomendación final con justificación"
        )
        return await self.generate(prompt, system_prompt=RESEARCH_SYSTEM_PROMPT)
