param(
  [switch]$UseToken,
  [switch]$CheckProxy,
  [string]$EnvPath = ".env"
)

$ErrorActionPreference = "Stop"

function Load-EnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "No se encontro archivo de entorno en '$Path'."
  }

  $vars = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    $vars[$key] = $value
  }

  return $vars
}

function Require-Env {
  param(
    [hashtable]$Vars,
    [string[]]$Keys
  )

  $missing = @()
  foreach ($k in $Keys) {
    if (-not $Vars.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($Vars[$k])) {
      $missing += $k
    }
  }

  if ($missing.Count -gt 0) {
    throw "Faltan variables: $($missing -join ', ')"
  }
}

function Test-MoodleByToken {
  param([hashtable]$Vars)

  Require-Env -Vars $Vars -Keys @("MOODLE_URL", "MOODLE_TOKEN")

  $base = $Vars["MOODLE_URL"].TrimEnd('/')
  $token = $Vars["MOODLE_TOKEN"]
  $uri = "$base/webservice/rest/server.php?wstoken=$token&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"

  Write-Host "[CHECK] Verificando token Moodle..."
  $res = Invoke-RestMethod -Method Get -Uri $uri -TimeoutSec 30

  if ($res.error) {
    throw "Moodle devolvio error: $($res.error)"
  }

  if (-not $res.userid) {
    throw "Respuesta invalida: no vino userid."
  }

  Write-Host "[OK] Token valido. UserId Moodle: $($res.userid)"
}

function Test-MoodleByCredentials {
  param([hashtable]$Vars)

  Require-Env -Vars $Vars -Keys @("MOODLE_URL", "MOODLE_USERNAME", "MOODLE_PASSWORD")

  $base = $Vars["MOODLE_URL"].TrimEnd('/')
  $loginUri = "$base/login/token.php"

  Write-Host "[CHECK] Solicitando token por credenciales..."
  $body = @{
    username = $Vars["MOODLE_USERNAME"]
    password = $Vars["MOODLE_PASSWORD"]
    service = "moodle_mobile_app"
  }

  $res = Invoke-RestMethod -Method Post -Uri $loginUri -Body $body -TimeoutSec 30

  if ($res.error) {
    throw "Autenticacion Moodle fallo: $($res.error)"
  }

  if (-not $res.token) {
    throw "No se recibio token Moodle."
  }

  Write-Host "[OK] Moodle responde credenciales. Token recibido (oculto)."
}

function Test-MoodleProxyEndpoint {
  param([hashtable]$Vars)

  Require-Env -Vars $Vars -Keys @("SUPABASE_URL")
  $supabaseUrl = $Vars["SUPABASE_URL"].TrimEnd('/')
  $proxyUri = "$supabaseUrl/functions/v1/supabase_moodle_proxy"

  Write-Host "[CHECK] Verificando endpoint del proxy Moodle (sin auth)..."

  try {
    Invoke-RestMethod -Method Post -Uri $proxyUri -ContentType "application/json" -Body '{"action":"login"}' -TimeoutSec 30 | Out-Null
    Write-Host "[WARN] El proxy respondio sin autenticacion; revisa reglas de seguridad."
  }
  catch {
    $msg = $_.Exception.Message
    if ($msg -match "401|403|Unauthorized") {
      Write-Host "[OK] Proxy protegido (requiere auth)."
    }
    else {
      Write-Host "[INFO] Proxy respondio con error esperado: $msg"
    }
  }
}

try {
  $vars = Load-EnvFile -Path $EnvPath

  if ($UseToken) {
    Test-MoodleByToken -Vars $vars
  }
  else {
    Test-MoodleByCredentials -Vars $vars
  }

  if ($CheckProxy) {
    Test-MoodleProxyEndpoint -Vars $vars
  }

  Write-Host "`nValidacion completada." -ForegroundColor Green
}
catch {
  Write-Error $_
  exit 1
}
