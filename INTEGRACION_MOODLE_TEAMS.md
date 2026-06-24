# Integracion Moodle y Teams

## Estado Actual del Proyecto

### Moodle
- Hay soporte en dos capas:
  - Proxy Edge Function para login/sync (Supabase): `supabase/functions/supabase_moodle_proxy/index.ts`
  - Descargador Python para materiales del aula: `moodle_downloader.py`
- En la app principal, la sincronizacion depende del flag `ENABLE_MOODLE_SYNC` en `src/config/feature-flags.ts`.

### Teams
- Actualmente no hay conector por Microsoft Graph API.
- La integracion activa es por carpeta local:
  - `teams_recordings/<curso>/`
  - El proceso `medical_guardian.py` detecta archivos y los procesa automaticamente.

## Checklist de Conexion Moodle (Produccion)

1. Supabase:
- Tener desplegada la funcion `supabase_moodle_proxy`.
- Configurar secret `MOODLE_ENCRYPTION_KEY` en Supabase Functions secrets.
- Confirmar tablas relacionadas (`user_tokens`, `moodle_courses`, `moodle_assignments`, `moodle_exams`) creadas.

2. App:
- Definir `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Definir `MOODLE_URL`.
- Decidir metodo de auth Moodle:
  - Opcion A: `MOODLE_USERNAME` + `MOODLE_PASSWORD`
  - Opcion B: `MOODLE_TOKEN`

3. Governance:
- Si quieren mantener fase estable, controlar `ENABLE_MOODLE_SYNC` por release.
- No exponer credenciales en frontend.

## Prueba Rapida de Moodle

Script incluido:
- `scripts/validate-moodle-connection.ps1`

Ejemplos:

```powershell
# 1) Validar por credenciales (usa .env)
pwsh -File scripts/validate-moodle-connection.ps1

# 2) Validar por token
pwsh -File scripts/validate-moodle-connection.ps1 -UseToken

# 3) Validar Moodle + existencia/proteccion del proxy
pwsh -File scripts/validate-moodle-connection.ps1 -CheckProxy
```

## Checklist de Conexion Teams (Actual)

1. Definir ruta local (opcional) en `.env`:
- `LOCAL_TEAMS_PATH=C:\ruta\a\teams_recordings`

2. Estructura esperada:
- `teams_recordings/semiologia/`
- `teams_recordings/farmacologia/`
- ...

3. Levantar guardian:

```powershell
python medical_guardian.py
```

4. Depositar archivos de clase:
- `.vtt`, `.srt`, `.mp4`, `.mp3`, `.docx`, `.pdf`, etc.

5. Verificar salida:
- `public/<curso>/notas_clase.txt`
- `public/<curso>/repaso.md`
- `public/<curso>/repaso.html`

## Proxima Fase Recomendada (Teams por API)

Si quieren conexion nativa a Teams (sin carga manual), implementar:

1. App registration en Entra ID.
2. Permisos Graph para meetings/recordings/transcripts.
3. Job backend para extraer transcripciones y guardar en `teams_recordings/<curso>/`.
4. Reusar `medical_guardian.py` como pipeline de normalizacion.

Esto evita reescribir toda la ingesta y mantiene compatibilidad con el flujo actual.
