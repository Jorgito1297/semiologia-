"""
Base Agent — NEXUS AI System
============================
Clase base para todos los agentes del sistema. Proporciona:
- Comunicación con Ollama (local-first)
- Fallback a OpenRouter (cloud)
- Sistema de memoria persistente
- Logging estructurado
- Retry con backoff exponencial
- Gestión de contexto
"""

import os
import json
import time
import logging
import asyncio
from pathlib import Path
from typing import Any, Optional
from datetime import datetime
from dataclasses import dataclass, field, asdict

import httpx

# ── Logging estructurado ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)

# ── Paths ───────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
MEMORY_DIR = PROJECT_ROOT / "memory"
MEMORY_DIR.mkdir(exist_ok=True)


@dataclass
class AgentMessage:
    """Mensaje en el historial de conversación del agente."""
    role: str           # 'system' | 'user' | 'assistant'
    content: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    model: Optional[str] = None
    tokens_used: Optional[int] = None


@dataclass
class AgentConfig:
    """Configuración de un agente."""
    name: str
    description: str
    # Modelo preferido para tareas de este agente
    preferred_model: str = "qwen3:8b"
    # Modelo de código si aplica
    code_model: str = "qwen2.5-coder:7b"
    # Temperatura (0.0 = determinista, 1.0 = creativo)
    temperature: float = 0.3
    # Contexto máximo
    max_tokens: int = 4096
    # Número de reintentos en caso de error
    max_retries: int = 3
    # Tiempo entre reintentos (segundos)
    retry_delay: float = 1.0


class BaseAgent:
    """
    Clase base para todos los agentes del sistema NEXUS AI.

    Implementa:
    - Comunicación Ollama (local) con fallback OpenRouter (cloud)
    - Memoria persistente en JSON
    - Logging estructurado
    - Retry con backoff exponencial
    """

    def __init__(self, config: AgentConfig):
        self.config = config
        self.logger = logging.getLogger(f"agent.{config.name}")
        self.conversation_history: list[AgentMessage] = []

        # URLs de proveedores IA
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.openrouter_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

        # HTTP client con timeout
        self.http = httpx.AsyncClient(timeout=120.0)

        # Archivo de memoria del agente
        self.memory_file = MEMORY_DIR / f"{config.name}_memory.json"
        self._load_memory()

        self.logger.info(f"Agente '{config.name}' inicializado | modelo={config.preferred_model}")

    # ── MEMORIA PERSISTENTE ─────────────────────────────────────────────────

    def _load_memory(self) -> None:
        """Carga la memoria persistente del agente desde disco."""
        if self.memory_file.exists():
            try:
                with open(self.memory_file, encoding="utf-8") as f:
                    data = json.load(f)
                    self.memory: dict[str, Any] = data
                self.logger.debug(f"Memoria cargada: {len(self.memory)} entradas")
            except json.JSONDecodeError:
                self.logger.warning("Memoria corrupta, iniciando limpia")
                self.memory: dict[str, Any] = {}
        else:
            self.memory: dict[str, Any] = {}

    def save_memory(self, key: str, value: Any) -> None:
        """Guarda un valor en la memoria persistente del agente."""
        self.memory[key] = {
            "value": value,
            "updated_at": datetime.utcnow().isoformat()
        }
        with open(self.memory_file, "w", encoding="utf-8") as f:
            json.dump(self.memory, f, indent=2, ensure_ascii=False)
        self.logger.debug(f"Memoria guardada: {key}")

    def recall(self, key: str) -> Optional[Any]:
        """Recupera un valor de la memoria persistente."""
        entry = self.memory.get(key)
        return entry["value"] if entry else None

    # ── COMUNICACIÓN CON OLLAMA ─────────────────────────────────────────────

    async def _call_ollama(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> str:
        """
        Llama a Ollama local para generar una respuesta.

        Args:
            prompt: El prompt del usuario
            model: Modelo a usar (default: config.preferred_model)
            system_prompt: Prompt de sistema opcional
            stream: Si True, retorna texto en streaming

        Returns:
            Texto de respuesta del modelo
        """
        model = model or self.config.preferred_model

        # Construir messages array (formato OpenAI-compatible)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Agregar historial de conversación (últimos 10 mensajes)
        for msg in self.conversation_history[-10:]:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens,
            }
        }

        try:
            response = await self.http.post(
                f"{self.ollama_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            content = data["message"]["content"]

            # Registrar en historial
            self.conversation_history.append(
                AgentMessage(role="user", content=prompt, model=model)
            )
            self.conversation_history.append(
                AgentMessage(role="assistant", content=content, model=model)
            )

            return content

        except httpx.ConnectError:
            raise ConnectionError(
                f"Ollama no está disponible en {self.ollama_url}. "
                "Verifica que el servicio esté corriendo: ollama serve"
            )
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Error HTTP de Ollama: {e.response.status_code} — {e.response.text}")

    # ── COMUNICACIÓN CON OPENROUTER (FALLBACK CLOUD) ────────────────────────

    async def _call_openrouter(
        self,
        prompt: str,
        model: str = "anthropic/claude-3.5-sonnet",
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Llama a OpenRouter como proveedor cloud de fallback.

        Args:
            prompt: El prompt del usuario
            model: Modelo OpenRouter (ej. 'google/gemini-1.5-pro')
            system_prompt: Prompt de sistema opcional

        Returns:
            Texto de respuesta
        """
        if not self.openrouter_key:
            raise ValueError(
                "OPENROUTER_API_KEY no configurada. "
                "Agrega la variable de entorno para usar modelos cloud."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "HTTP-Referer": "https://github.com/nexusvault/semiologia",
            "X-Title": "NEXUS AI System — Semiología Médica",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }

        response = await self.http.post(
            f"{self.openrouter_url}/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    # ── MÉTODO PRINCIPAL: GENERA CON RETRY + FALLBACK ──────────────────────

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        force_cloud: bool = False,
        cloud_model: str = "anthropic/claude-3.5-sonnet"
    ) -> str:
        """
        Genera una respuesta usando Ollama local, con fallback a OpenRouter.

        Estrategia:
        1. Intenta Ollama (local, gratis, privado)
        2. Si falla después de max_retries → usa OpenRouter (cloud, de pago)
        3. Si force_cloud=True → va directo a OpenRouter

        Args:
            prompt: El prompt de entrada
            model: Modelo local a usar
            system_prompt: Prompt de sistema
            force_cloud: Fuerza uso de cloud (para tareas complejas)
            cloud_model: Modelo OpenRouter si se usa cloud

        Returns:
            Respuesta del modelo
        """
        if force_cloud:
            self.logger.info(f"Cloud forzado: {cloud_model}")
            return await self._call_openrouter(prompt, cloud_model, system_prompt)

        # Intentar Ollama con retry exponencial
        last_error: Optional[Exception] = None
        for attempt in range(1, self.config.max_retries + 1):
            try:
                self.logger.debug(f"Ollama intento {attempt}/{self.config.max_retries}")
                result = await self._call_ollama(prompt, model, system_prompt)
                self.logger.info(f"✓ Respuesta local | modelo={model or self.config.preferred_model}")
                return result
            except Exception as e:
                last_error = e
                wait = self.config.retry_delay * (2 ** (attempt - 1))  # backoff exponencial
                self.logger.warning(f"Ollama falló (intento {attempt}): {e}. Esperando {wait}s...")
                await asyncio.sleep(wait)

        # Ollama falló → fallback cloud
        self.logger.warning(f"Ollama no disponible. Usando fallback cloud: {cloud_model}")
        try:
            return await self._call_openrouter(prompt, cloud_model, system_prompt)
        except Exception as cloud_error:
            raise RuntimeError(
                f"Ambos proveedores fallaron.\n"
                f"  Ollama: {last_error}\n"
                f"  OpenRouter: {cloud_error}"
            )

    # ── EMBEDDINGS ──────────────────────────────────────────────────────────

    async def embed(self, text: str, model: str = "nomic-embed-text") -> list[float]:
        """
        Genera embeddings vectoriales usando Ollama.

        Args:
            text: Texto a vectorizar
            model: Modelo de embedding

        Returns:
            Vector de floats (embedding)
        """
        response = await self.http.post(
            f"{self.ollama_url}/api/embeddings",
            json={"model": model, "prompt": text}
        )
        response.raise_for_status()
        return response.json()["embedding"]

    # ── UTILIDADES ──────────────────────────────────────────────────────────

    def clear_history(self) -> None:
        """Limpia el historial de conversación (no afecta memoria persistente)."""
        self.conversation_history.clear()
        self.logger.debug("Historial de conversación limpiado")

    async def health_check(self) -> dict[str, Any]:
        """Verifica el estado del agente y sus dependencias."""
        status = {
            "agent": self.config.name,
            "timestamp": datetime.utcnow().isoformat(),
            "ollama": False,
            "openrouter": bool(self.openrouter_key),
            "memory_entries": len(self.memory)
        }

        try:
            response = await self.http.get(f"{self.ollama_url}/api/tags", timeout=5.0)
            status["ollama"] = response.status_code == 200
            models = response.json().get("models", [])
            status["ollama_models"] = [m["name"] for m in models]
        except Exception:
            status["ollama"] = False

        return status

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.http.aclose()
