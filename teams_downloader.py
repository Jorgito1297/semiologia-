#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cliente de Descarga Automática de Grabaciones de Teams (teams_downloader.py)
Medical AI Learning System — UCE

Este script se conecta a Microsoft Graph API para buscar y descargar grabaciones de video (.mp4)
de las clases impartidas en Microsoft Teams. Asocia cada equipo con uno de los 7 cursos activos
y almacena los archivos en teams_recordings/<curso>/ para su procesamiento por el RAG local.
"""

import os
import sys
import json
import argparse
import requests
import msal

# =====================================================================
# 🔑 CARGA SEGURA DE CONFIGURACIÓN (.env)
# =====================================================================
def load_env_variables() -> dict:
    """
    Carga variables de entorno desde el archivo .env sin dependencias externas.
    """
    env_vars = {}
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env")
    
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip()
    return env_vars

# =====================================================================
# 🧭 MAPEO DE CURSOS INSTITUCIONALES DE LA UCE
# =====================================================================
COURSES_MAP = {
    "semiologia": ["med-228", "med228", "semiologia", "semiología", "propedéutica", "propedeutica"],
    "farmacologia": ["med-229", "med229", "med-230", "med230", "farmacologia", "farmacología"],
    "fisiopatologia": ["med-225", "med225", "fisiopatologia", "fisiopatología"],
    "bioetica": ["bioetica", "bioética", "deontologia", "deontología"],
    "patologia": ["med-227", "med227", "patologia", "patología", "anatomia patologica", "anatomía patológica"],
    "microbiologia": ["med-226", "med226", "microbiologia", "microbiología"],
    "epidemiologia": ["med-290", "med290", "epidemiologia", "epidemiología", "tropical", "enfermedades tropicales"]
}

def resolve_course_key(display_name: str) -> str:
    """
    Determina a cuál de las 7 materias corresponde un equipo de Teams.
    """
    name_lower = display_name.lower()
    for key, keywords in COURSES_MAP.items():
        for kw in keywords:
            if kw in name_lower:
                return key
    return None

# =====================================================================
# 🏛️ CLASE CLIENTE DE MICROSOFT GRAPH API
# =====================================================================
class TeamsGraphClient:
    def __init__(self, username, password, tenant, dry_run=False):
        self.username = username
        self.password = password
        self.tenant = tenant
        self.dry_run = dry_run
        self.access_token = None
        
        # Teams Desktop Client ID pre-autorizado en el tenant de UCE
        self.client_id = "1fec8e78-bce4-4aaf-ab1b-5451cc387264"
        self.authority = f"https://login.microsoftonline.com/{self.tenant}"
        
        if not self.dry_run:
            self.access_token = self.authenticate()

    def authenticate(self) -> str:
        """
        Adquiere un token Bearer seguro usando MSAL y ROPC flow.
        """
        print(f"[TEAMS]: Autenticando en Azure AD para '{self.username}'...")
        app = msal.PublicClientApplication(
            client_id=self.client_id,
            authority=self.authority
        )
        
        # Solicitar el alcance .default pre-autorizado
        result = app.acquire_token_by_username_password(
            username=self.username,
            password=self.password,
            scopes=["https://graph.microsoft.com/.default"]
        )
        
        if "access_token" in result:
            print("[TEAMS]: Autenticación de Microsoft Graph exitosa.")
            return result["access_token"]
        else:
            error = result.get("error")
            desc = result.get("error_description")
            print(f"[TEAMS ERROR]: No se pudo iniciar sesión: {error}. Detalles: {desc}")
            raise ValueError(f"Fallo de inicio de sesión en Microsoft: {error}")

    def call_api(self, endpoint: str, method: str = "GET", params: dict = None, data: dict = None) -> dict:
        """
        Llama de forma genérica a los endpoints v1.0 de Microsoft Graph API.
        """
        if self.dry_run:
            print(f"[DRY-RUN] [GRAPH MOCK]: Llamando API '{endpoint}' ({method})")
            return {}

        url = f"https://graph.microsoft.com/v1.0/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json"
        }
        
        try:
            if method.upper() == "GET":
                r = requests.get(url, headers=headers, params=params, timeout=30)
            else:
                r = requests.post(url, headers=headers, json=data, timeout=30)
                
            r.raise_for_status()
            return r.json() if r.text else {}
        except Exception as e:
            print(f"[TEAMS ERROR]: Error en llamada API a '{endpoint}': {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Detalles del error del servidor: {e.response.text}")
            return {}

    def get_joined_teams(self) -> list:
        """
        Obtiene la lista de todos los Teams en los que el usuario está inscrito.
        """
        print("[TEAMS]: Buscando tus Equipos de Microsoft Teams...")
        response = self.call_api("/me/joinedTeams")
        return response.get("value", []) if response else []

    def get_team_drive_id(self, team_id: str) -> str:
        """
        Obtiene el ID de la biblioteca de documentos (SharePoint Drive) del Team.
        """
        response = self.call_api(f"/groups/{team_id}/drive")
        return response.get("id") if response else None

    def search_mp4_recordings(self, drive_id: str) -> list:
        """
        Busca todos los archivos .mp4 (grabaciones) en el Drive del Equipo.
        """
        # Usamos search(q='mp4') para localizar rápidamente cualquier video en el drive.
        # Es mucho más rápido y robusto ante localizaciones (ej. Recordings vs Grabaciones).
        response = self.call_api(f"/drives/{drive_id}/root/search(q='mp4')")
        items = response.get("value", []) if response else []
        
        # Filtrar solo archivos mp4 reales y que contengan "Grabación" o "Meeting" o se ubiquen en Recordings
        recordings = []
        for item in items:
            if item.get("folder") is None and item.get("name", "").lower().endswith(".mp4"):
                # Generalmente Teams nombra las grabaciones como "Reunión en General-...mp4"
                recordings.append(item)
        return recordings

    def download_file(self, download_url: str, dest_path: str):
        """
        Descarga físicamente un archivo de Teams SharePoint a disco con barra de progreso.
        """
        if self.dry_run:
            print(f"[DRY-RUN] [GRAPH MOCK]: Simulando descarga a '{dest_path}'")
            with open(dest_path, "w") as f:
                f.write(f"MOCK VIDEO CONTENT for {os.path.basename(dest_path)}")
            return

        try:
            with requests.get(download_url, stream=True, timeout=120) as r:
                r.raise_for_status()
                total_size = int(r.headers.get('content-length', 0))
                
                with open(dest_path, "wb") as f:
                    downloaded = 0
                    for chunk in r.iter_content(chunk_size=1024*1024): # chunks de 1MB
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                percent = (downloaded / total_size) * 100
                                sys.stdout.write(f"\r[TEAMS]: Descargando... {percent:.1f}% ({downloaded/(1024*1024):.2f} MB / {total_size/(1024*1024):.2f} MB)")
                                sys.stdout.flush()
                print(f"\n[TEAMS]: Descarga completa: {os.path.basename(dest_path)}")
        except Exception as e:
            print(f"\n[TEAMS ERROR]: Fallo al descargar grabación: {e}")
            if os.path.exists(dest_path):
                os.remove(dest_path) # Limpiar archivo parcial corrupto
            raise

# =====================================================================
# 💾 CONTROL DE HISTORIAL DE DESCARGAS
# =====================================================================
def load_download_history(base_dir: str) -> dict:
    history_path = os.path.join(base_dir, "scratch", "teams_download_history.json")
    if os.path.exists(history_path):
        try:
            with open(history_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_download_history(base_dir: str, history: dict):
    os.makedirs(os.path.join(base_dir, "scratch"), exist_ok=True)
    history_path = os.path.join(base_dir, "scratch", "teams_download_history.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4)

# =====================================================================
# 🚀 FUNCIÓN PRINCIPAL DE EJECUCIÓN
# =====================================================================
def sync_teams_recordings(limit=None, dry_run=False):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    if dry_run:
        print("=== INICIANDO SINCRONIZADOR DE MICROSOFT TEAMS (MODO DRY-RUN) ===")
    else:
        print("=== INICIANDO SINCRONIZADOR DE MICROSOFT TEAMS UCE ===")

    # 1. Cargar credenciales
    env = load_env_variables()
    username = env.get("MS_USERNAME")
    password = env.get("MS_PASSWORD")
    tenant = env.get("MS_TENANT", "uce.edu.do")

    if not dry_run and (not username or not password):
        print("[TEAMS ERROR]: Faltan credenciales en tu archivo .env (MS_USERNAME o MS_PASSWORD)")
        return False

    # 2. Cargar historial
    history = load_download_history(base_dir)

    # 3. Inicializar Cliente
    try:
        client = TeamsGraphClient(username, password, tenant, dry_run=dry_run)
    except Exception as e:
        print(f"[TEAMS ERROR]: No se pudo iniciar el proceso por fallo de autenticación: {e}")
        return False

    # 4. Obtener Teams
    teams = client.get_joined_teams()
    print(f"[TEAMS]: Se encontraron {len(teams)} equipos en total.")

    downloaded_count = 0
    skipped_count = 0

    for team in teams:
        display_name = team.get("displayName", "")
        team_id = team.get("id")
        
        # Filtrar si corresponde a uno de nuestros cursos
        course_key = resolve_course_key(display_name)
        if not course_key:
            # Ignorar equipos que no corresponden a las asignaturas de medicina
            continue

        print(f"\n[TEAMS]: >>> Procesando clase activa: {display_name} -> Carpeta local: '{course_key}'")
        
        # Obtener biblioteca de SharePoint
        drive_id = client.get_team_drive_id(team_id)
        if not drive_id:
            print(f"  [TEAMS WARNING]: No se pudo resolver la biblioteca de SharePoint para {display_name}.")
            continue

        # Buscar grabaciones mp4
        recordings = client.search_mp4_recordings(drive_id)
        print(f"  Se encontraron {len(recordings)} grabaciones de video (.mp4) en SharePoint.")

        for rec in recordings:
            rec_name = rec.get("name")
            rec_id = rec.get("id")
            rec_size = rec.get("size", 0)
            download_url = rec.get("@microsoft.graph.downloadUrl")
            if not download_url:
                # Si no viene en la búsqueda, obtener el detalle directo del item
                rec_detail = client.call_api(f"/drives/{drive_id}/items/{rec_id}")
                download_url = rec_detail.get("@microsoft.graph.downloadUrl") if rec_detail else None

            # Validar si ya se descargó
            if rec_id in history:
                skipped_count += 1
                continue

            # Validar límite
            if limit is not None and downloaded_count >= limit:
                print(f"  [TEAMS]: Límite de descargas de esta corrida alcanzado ({limit}). Omitiendo resto.")
                break

            print(f"  🆕 Nueva grabación encontrada: '{rec_name}' ({rec_size / (1024*1024):.2f} MB)")
            
            # Directorio de destino local
            dest_dir = os.path.join(base_dir, "teams_recordings", course_key)
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, rec_name)

            # Proceder a descargar
            try:
                client.download_file(download_url, dest_path)
                
                # Registrar en el historial
                history[rec_id] = {
                    "name": rec_name,
                    "course": course_key,
                    "team": display_name,
                    "size_bytes": rec_size,
                    "downloaded_at": time.time() if not dry_run else 0
                }
                if not dry_run:
                    save_download_history(base_dir, history)
                
                downloaded_count += 1
            except Exception as e:
                print(f"  [TEAMS ERROR]: Omitiendo grabación por fallo de descarga: {e}")

    print(f"\n=== SINOPSIS TEAMS: {downloaded_count} grabaciones descargadas, {skipped_count} omitidas (ya en historial) ===")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cliente de sincronización de grabaciones de Microsoft Teams UCE.")
    parser.add_argument("--dry-run", action="store_true", help="Simula el flujo de autenticación y detección de archivos sin descargar.")
    parser.add_argument("--limit-downloads", type=int, default=None, help="Límite máximo de videos nuevos a descargar en esta ejecución.")
    args = parser.parse_args()
    
    sync_teams_recordings(limit=args.limit_downloads, dry_run=args.dry_run)
