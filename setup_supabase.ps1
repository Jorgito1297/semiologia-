# ============================================================================
# SCRIPT DE AUTOMATIZACIÓN DE SUPABASE - "Study With Me"
# ============================================================================

$projectRef = "fnusnboleqnabqwqfucr"
$encryptionKey = "DmMRVKBanJGv$#MaQdaBzrNd9QcEWMwo"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         CONFIGURACIÓN DE SUPABASE & EDGE FUNCTIONS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script te guiará para desplegar la Edge Function en tu" -ForegroundColor White
Write-Host "proyecto de Supabase: $projectRef" -ForegroundColor White
Write-Host ""

# 1. Iniciar sesión en Supabase CLI
Write-Host "[1/3] Autenticando con Supabase..." -ForegroundColor Green
Write-Host "Se abrirá tu navegador para iniciar sesión. Presiona ENTER para continuar..." -ForegroundColor Gray
Read-Host

npx supabase login

# 2. Configurar Secret de Encriptación
Write-Host ""
Write-Host "[2/3] Configurando la clave de encriptación de Moodle (Secrets)..." -ForegroundColor Green
npx supabase secrets set MOODLE_ENCRYPTION_KEY=$encryptionKey --project-ref $projectRef

# 3. Desplegar Edge Function
Write-Host ""
Write-Host "[3/3] Desplegando la Edge Function (supabase_moodle_proxy)..." -ForegroundColor Green
npx supabase functions deploy supabase_moodle_proxy --project-ref $projectRef

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "               ¡PROCESO COMPLETADO EXITOSAMENTE!" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "RECUERDA: Si no lo has hecho, debes copiar el contenido del" -ForegroundColor Yellow
Write-Host "archivo 'supabase_schema.sql' y ejecutarlo en el SQL Editor" -ForegroundColor Yellow
Write-Host "de tu panel de Supabase para crear las tablas de la base de datos." -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
Read-Host
