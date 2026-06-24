# ================================================================
# setup_med228.ps1
# Script completo: inicializa DB + verifica + sube chunks
# MED-228 NeuroAdaptive Platform — UCE
# ================================================================
# COMO USAR:
#   1. Coloca este archivo en la raiz de tu proyecto
#   2. Obtén tu Access Token en:
#      supabase.com/dashboard/account/tokens
#   3. Corre en PowerShell:
#      .\setup_med228.ps1 -AccessToken "tu_token_aqui"
# ================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$AccessToken
)

# ── CONFIGURACION ──────────────────────────────────────────────
$PROJECT_REF  = "fnusnboleqnabqwqfucr"
$SCHEMA_FILE  = "supabase_full_schema.sql"
$API_BASE     = "https://api.supabase.com/v1"
$PIPELINE_DIR = "src/pipelines/ingestion"

# ── COLORES ────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "     $msg" -ForegroundColor Gray }

# ── HEADER ────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  MED-228 NeuroAdaptive Platform — UCE Setup" -ForegroundColor Blue
Write-Host "  Proyecto: $PROJECT_REF" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue

# ================================================================
# PASO 1: Verificar que el archivo schema existe
# ================================================================
Write-Step "PASO 1/5 — Verificando archivo schema"

if (-not (Test-Path $SCHEMA_FILE)) {
    Write-Fail "No se encontró: $SCHEMA_FILE"
    Write-Info "Asegúrate de correr este script desde la raíz del proyecto"
    Write-Info "Ruta esperada: $(Get-Location)\$SCHEMA_FILE"
    exit 1
}

$schemaContent = Get-Content $SCHEMA_FILE -Raw -Encoding UTF8
$schemaSize    = (Get-Item $SCHEMA_FILE).Length / 1KB
Write-OK "Schema encontrado: $SCHEMA_FILE ($([math]::Round($schemaSize, 1)) KB)"

# Verificar que no tiene DROP TABLE
if ($schemaContent -match "DROP TABLE(?! IF EXISTS)") {
    Write-Fail "El schema contiene DROP TABLE sin IF EXISTS — peligroso"
    Write-Info "Revisa el archivo antes de continuar"
    exit 1
}
Write-OK "Schema verificado — sin comandos DROP peligrosos"

# ================================================================
# PASO 2: Verificar que la DB está vacía
# ================================================================
Write-Step "PASO 2/5 — Verificando estado de la base de datos"

$checkTablesSQL = @"
SELECT COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public';
"@

$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

$body = @{
    query = $checkTablesSQL
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$API_BASE/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    $tableCount = $response[0].total

    if ($tableCount -gt 0) {
        Write-Warn "La DB ya tiene $tableCount tablas"
        Write-Info "Si quieres reinicializar, borra las tablas manualmente primero"
        Write-Info "Si las tablas son correctas, salta al Paso 4 (pipeline)"
        $continue = Read-Host "  ¿Continuar de todas formas? (s/n)"
        if ($continue -ne "s") { exit 0 }
    } else {
        Write-OK "DB vacía confirmada — seguro inicializar"
    }

} catch {
    Write-Fail "Error conectando a Supabase Management API"
    Write-Info "Verifica que el Access Token sea correcto"
    Write-Info "Obtén uno en: supabase.com/dashboard/account/tokens"
    Write-Info "Error: $($_.Exception.Message)"
    exit 1
}

# ================================================================
# PASO 3: Ejecutar el schema completo
# ================================================================
Write-Step "PASO 3/5 — Inicializando base de datos"
Write-Info "Ejecutando $SCHEMA_FILE..."

$stmtBody = @{ query = $schemaContent } | ConvertTo-Json

try {
    $res = Invoke-RestMethod `
        -Uri "$API_BASE/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $stmtBody `
        -ErrorAction Stop
    Write-OK "Schema inicializado con éxito"
} catch {
    Write-Fail "Error al ejecutar el schema: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Info "Detalles: $($_.ErrorDetails)" }
    exit 1
}

# ================================================================
# PASO 4: Verificar que las 7 tablas se crearon
# ================================================================
Write-Step "PASO 4/5 — Verificando tablas creadas"

$verifySQL = @"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"@

$verifyBody = @{ query = $verifySQL } | ConvertTo-Json

try {
    $tables = Invoke-RestMethod `
        -Uri "$API_BASE/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $verifyBody `
        -ErrorAction Stop

    $expectedTables = @(
        "academic_blocks",
        "competencies",
        "content_chunks",
        "courses",
        "student_competency_progress",
        "student_memory_states",
        "students"
    )

    $createdTables = $tables | ForEach-Object { $_.table_name }
    $allOK = $true

    foreach ($expected in $expectedTables) {
        if ($createdTables -contains $expected) {
            Write-OK "Tabla: $expected"
        } else {
            Write-Fail "Tabla faltante: $expected"
            $allOK = $false
        }
    }

    if (-not $allOK) {
        Write-Fail "Algunas tablas no se crearon — revisa el schema"
        exit 1
    }

    Write-OK "Las 7 tablas verificadas correctamente"

} catch {
    Write-Fail "Error verificando tablas: $($_.Exception.Message)"
    exit 1
}

# ================================================================
# PASO 5: Correr el pipeline de ingesta
# ================================================================
Write-Step "PASO 5/5 — Iniciando pipeline de ingesta de chunks"

if (-not (Test-Path $PIPELINE_DIR)) {
    Write-Fail "Directorio no encontrado: $PIPELINE_DIR"
    exit 1
}

# Verificar que hay PDFs
$pdfCount = (Get-ChildItem "$PIPELINE_DIR/pdfs" -Filter "*.pdf" -ErrorAction SilentlyContinue).Count
if ($pdfCount -eq 0) {
    Write-Warn "No hay PDFs en $PIPELINE_DIR/pdfs/"
    Write-Info "Coloca los libros PDF antes de continuar"
    Write-Info "Nombres requeridos:"
    Write-Info "  argente_alvarez.pdf"
    Write-Info "  bickley_bates.pdf"
    Write-Info "  argente_ha.pdf"
    Write-Info "  goic_chamorro.pdf"
    Write-Info "  suros.pdf"
    Write-Info "  first_aid_step2.pdf"
} else {
    Write-OK "$pdfCount PDF(s) encontrados"
}

# Instalar dependencias Python
Write-Info "Instalando dependencias Python..."
pip install -r "$PIPELINE_DIR/requirements.txt" -q
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Algunas dependencias no se instalaron — continúa con precaución"
} else {
    Write-OK "Dependencias instaladas"
}

# Correr el pipeline
Write-Info "Corriendo pipeline completo..."
Write-Info "(Esto puede tomar varios minutos con los PDFs)"
Write-Host ""

Set-Location $PIPELINE_DIR

if ($pdfCount -gt 0) {
    python pipeline.py full
} else {
    Write-Warn "Saltando pipeline — no hay PDFs"
    Write-Info "Cuando tengas los PDFs corre:"
    Write-Info "  cd $PIPELINE_DIR"
    Write-Info "  python pipeline.py full"
}

Set-Location (Split-Path $PSScriptRoot -Parent)

# ================================================================
# REPORTE FINAL
# ================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  REPORTE FINAL" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue

# Consultar chunks activos
$chunksSQL = @"
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as activos,
  SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as pendientes
FROM content_chunks;
"@

$chunksBody = @{ query = $chunksSQL } | ConvertTo-Json

try {
    $chunks = Invoke-RestMethod `
        -Uri "$API_BASE/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $chunksBody `
        -ErrorAction Stop

    $total     = $chunks[0].total
    $activos   = $chunks[0].activos
    $pendientes = $chunks[0].pendientes
    $meta      = 60

    Write-Host ""
    Write-Info "Chunks totales:   $total"
    Write-Info "Chunks activos:   $activos (meta: $meta)"
    Write-Info "Pendientes validación: $pendientes"
    Write-Host ""

    if ($activos -ge $meta) {
        Write-OK "B-01: CERRADO — Sistema listo para estudiantes"
    } elseif ($total -gt 0) {
        Write-Warn "B-01: PARCIAL — $activos/$meta activos"
        Write-Info "Corre: python pipeline.py review"
        Write-Info "El Dr. Tusen Madrigal debe aprobar los chunks pendientes"
    } else {
        Write-Warn "B-01: ABIERTO — No hay chunks aún"
        Write-Info "Agrega los PDFs y corre: python pipeline.py full"
    }

} catch {
    Write-Warn "No se pudo consultar chunks: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Aprobar chunks: cd $PIPELINE_DIR && python pipeline.py review" -ForegroundColor White
Write-Host "  2. Verificar estado: python pipeline.py status" -ForegroundColor White
Write-Host "  3. Iniciar Fase 3 en Antigravity cuando chunks >= 60" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
