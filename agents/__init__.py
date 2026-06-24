"""
Agentes NEXUS AI — Paquete Python
Exportaciones principales del sistema multi-agente.
"""

from agents.base_agent import BaseAgent, AgentConfig, AgentMessage
from agents.orchestrator import OrchestratorAgent
from agents.rag_agent import RAGAgent
from agents.coding_agent import CodingAgent
from agents.research_agent import ResearchAgent
from agents.doc_agent import DocAgent

__all__ = [
    "BaseAgent",
    "AgentConfig",
    "AgentMessage",
    "OrchestratorAgent",
    "RAGAgent",
    "CodingAgent",
    "ResearchAgent",
    "DocAgent",
]

__version__ = "1.0.0"
