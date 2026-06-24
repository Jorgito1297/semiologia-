# start_litellm_proxy.ps1
# Inicia el proxy LiteLLM que traduce llamadas de Claude Code → Ollama
# Uso: .\start_litellm_proxy.ps1
#
# NOTA: Usa .venv-litellm (Python 3.12) porque orjson no soporta Python 3.14
# Crear con: uv venv .venv-litellm --python 3.12 && uv pip install "litellm[proxy]" --python .venv-litellm\Scripts\python.exe

Write-Host "=== LiteLLM Proxy para Ollama ===" -ForegroundColor Cyan
Write-Host "Convierte la API de Anthropic → Ollama local" -ForegroundColor Gray
Write-Host ""

# Verificar que Ollama esté corriendo
try {
    $health = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
    Write-Host "✅ Ollama OK — $(($health.models).Count) modelos disponibles" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama no responde en localhost:11434" -ForegroundColor Red
    Write-Host "   Ejecuta: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Verificar venv de LiteLLM (Python 3.12 dedicado)
$venvPython = ".venv-litellm\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "❌ .venv-litellm no encontrado. Ejecuta:" -ForegroundColor Red
    Write-Host "   uv venv .venv-litellm --python 3.12" -ForegroundColor Yellow
    Write-Host "   uv pip install 'litellm[proxy]' --python .venv-litellm\Scripts\python.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Python 3.12 venv OK" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando LiteLLM Proxy en http://localhost:4111" -ForegroundColor Cyan
Write-Host "   Variables para Claude Code:" -ForegroundColor Gray
Write-Host '   $env:ANTHROPIC_BASE_URL="http://localhost:4111"' -ForegroundColor Yellow
Write-Host '   $env:ANTHROPIC_API_KEY="sk-litellm-local-semiologia"' -ForegroundColor Yellow
Write-Host ""
Write-Host "   Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

& $venvPython -m litellm --config litellm_config.yaml --port 4111
