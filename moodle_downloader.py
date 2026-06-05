#!/usr/bin/env python3
"""
Cliente de Sincronización y Descarga de Moodle (moodle_downloader.py)
Medical AI Learning System — MED-228-T-1 (UCE)

Este script se conecta de forma segura a la API de Moodle Web Services (Mobile App Service)
de la Universidad Central del Este (UCE) para descargar de manera automática diapositivas,
guías de laboratorio, libros y materiales cargados por el profesor en la materia de Semiología.
"""

import os
import sys
import requests
import json
import argparse

# =====================================================================
# 🔑 CARGA SEGURA DE CONFIGURACIÓN (.env)
# =====================================================================
def load_env_variables() -> dict:
    """
    Carga de forma segura las variables de entorno desde el archivo local .env
    evitando dependencias externas (zero-dependency parser).
    """
    env_vars = {}
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    
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
# 🌐 API CLIENT: MOODLE MOBILE WEB SERVICES
# =====================================================================
class MoodleClient:
    def __init__(self, username=None, password=None, token=None, base_url="https://moodle.uce.edu.do", dry_run=False):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.username = username
        self.password = password
        self.dry_run = dry_run
        
        if self.dry_run:
            if not self.token:
                self.token = "mock_token_123456"
        else:
            if not self.token and (self.username and self.password):
                self.token = self.authenticate()

    def authenticate(self) -> str:
        """
        Obtiene un token de acceso WS utilizando las credenciales del estudiante.
        Llama al endpoint login/token.php configurado para el servicio oficial de la app móvil.
        """
        login_url = f"{self.base_url}/login/token.php"
        params = {
            "username": self.username,
            "password": self.password,
            "service": "moodle_mobile_app"
        }
        
        print(f"[MOODLE]: Autenticando en {self.base_url} para el usuario '{self.username}'...")
        try:
            r = requests.get(login_url, params=params, timeout=15)
            r.raise_for_status()
            data = r.json()
            
            if "error" in data:
                raise ValueError(f"Moodle retornó un error: {data.get('error')}. Detalles: {data.get('errorcode')}")
            if "token" not in data:
                raise ValueError("Respuesta inválida de Moodle. No se recibió el token.")
                
            print("[MOODLE]: Token de acceso WS obtenido con éxito.")
            return data["token"]
        except Exception as e:
            print(f"[MOODLE]: Error crítico de autenticación: {e}")
            raise

    def call_ws(self, ws_function: str, params: dict) -> dict:
        """
        Ejecuta una petición POST al servidor de Moodle Web Services.
        """
        if self.dry_run:
            return self._mock_call_ws(ws_function, params)

        ws_url = f"{self.base_url}/webservice/rest/server.php"
        full_params = {
            "wstoken": self.token,
            "wsfunction": ws_function,
            "moodlewsrestformat": "json"
        }
        full_params.update(params)
        
        try:
            r = requests.post(ws_url, data=full_params, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[MOODLE]: Error al llamar la función WS '{ws_function}': {e}")
            return {}

    def _mock_call_ws(self, ws_function: str, params: dict) -> dict:
        """
        Simula las respuestas de Moodle Web Services para pruebas sin conexión.
        """
        print(f"[DRY-RUN] [MOODLE MOCK]: Llamando WS '{ws_function}' con parámetros: {params}")
        if ws_function == "core_webservice_get_site_info":
            return {"userid": 12345, "fullname": "Estudiante de Prueba", "username": "mock_user"}
            
        elif ws_function == "core_enrol_get_users_courses":
            return [
                {
                    "id": 101,
                    "fullname": "Semiología Médica (MED-228-T-1)",
                    "shortname": "MED-228",
                    "idnumber": "MED-228"
                },
                {
                    "id": 102,
                    "fullname": "Farmacología Clínica (MED-229-T-1)",
                    "shortname": "MED-229",
                    "idnumber": "MED-229"
                }
            ]
            
        elif ws_function == "core_course_get_contents":
            return [
                {
                    "id": 1,
                    "name": "General",
                    "modules": [
                        {
                            "id": 2001,
                            "name": "Guía de Prácticas de Semiología",
                            "modname": "resource",
                            "contents": [
                                {
                                    "filename": "guia_semiologia.pdf",
                                    "fileurl": "https://moodle.uce.edu.do/files/guia_semiologia.pdf",
                                    "filesize": 102400
                                }
                            ]
                        },
                        {
                            "id": 2002,
                            "name": "Presentación de la Materia",
                            "modname": "resource",
                            "contents": [
                                {
                                    "filename": "presentacion_semiologia.pptx",
                                    "fileurl": "https://moodle.uce.edu.do/files/presentacion_semiologia.pptx",
                                    "filesize": 204800
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": 2,
                    "name": "Tema 1: Semiología Respiratoria",
                    "modules": [
                        {
                            "id": 2003,
                            "name": "Carpeta de Lecturas",
                            "modname": "folder",
                            "contents": [
                                {
                                    "filename": "historia_clinica.docx",
                                    "fileurl": "https://moodle.uce.edu.do/files/historia_clinica.docx",
                                    "filesize": 51200
                                },
                                {
                                    "filename": "lectura_complementaria.pdf",
                                    "fileurl": "https://moodle.uce.edu.do/files/lectura_complementaria.pdf",
                                    "filesize": 153600
                                }
                            ]
                        }
                    ]
                }
            ]
        return {}

    def get_courses(self) -> list:
        """
        Obtiene la lista de cursos en los que el estudiante está inscrito.
        """
        # Primero necesitamos resolver el ID de usuario si no lo tenemos.
        # Pero core_enrol_get_users_courses solo requiere el userid como parámetro.
        # Podemos llamar a core_user_get_users_by_field o similar, o pasar un parámetro genérico.
        # En la API móvil de Moodle, core_enrol_get_users_courses a menudo deduce el usuario
        # si se consulta el perfil de sí mismo, pero requiere obligatoriamente el userid.
        # Podemos obtener la información del usuario logueado con 'webservice/rest/server.php'
        # o llamar a 'core_webservice_get_site_info' para obtener el userid.
        site_info = self.call_ws("core_webservice_get_site_info", {})
        userid = site_info.get("userid")
        
        if not userid:
            print("[MOODLE]: No se pudo resolver el ID de usuario del estudiante.")
            return []
            
        print(f"[MOODLE]: Resolviendo cursos para el ID de estudiante: {userid}...")
        courses = self.call_ws("core_enrol_get_users_courses", {"userid": userid})
        return courses if isinstance(courses, list) else []

    def get_course_resources(self, course_id: int) -> list:
        """
        Obtiene los módulos y archivos dentro de todas las secciones de un curso.
        """
        contents = self.call_ws("core_course_get_contents", {"courseid": course_id})
        resources = []
        
        if not contents or not isinstance(contents, list):
            return []
            
        for section in contents:
            for module in section.get("modules", []):
                # 'resource' representa un archivo simple adjunto
                if module.get("modname") == "resource":
                    resources.append(module)
                # 'folder' representa un directorio de archivos de Moodle
                elif module.get("modname") == "folder":
                    resources.append(module)
        return resources

    def download_file(self, file_url: str, dest_path: str):
        """
        Descarga físicamente un archivo privado de Moodle enviando el token de sesión.
        """
        if self.dry_run:
            print(f"[DRY-RUN] [MOODLE MOCK]: Simulando descarga de '{file_url}' a '{dest_path}'")
            try:
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(f"MOCK CONTENT for {os.path.basename(dest_path)}")
                print(f"[DRY-RUN] [MOODLE MOCK]: Descarga completada: {os.path.basename(dest_path)}")
            except Exception as e:
                print(f"[DRY-RUN] [MOODLE MOCK]: Error al simular la descarga: {e}")
            return

        # Moodle exige pasar el token en la petición para recursos privados
        params = {"token": self.token}
        
        try:
            with requests.get(file_url, params=params, stream=True, timeout=30) as r:
                r.raise_for_status()
                total_size = int(r.headers.get('content-length', 0))
                
                with open(dest_path, "wb") as f:
                    downloaded = 0
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                percent = (downloaded / total_size) * 100
                                sys.stdout.write(f"\r[MOODLE]: Descargando... {percent:.1f}% ({downloaded/(1024*1024):.2f} MB)")
                                sys.stdout.flush()
                print(f"\n[MOODLE]: Descarga completada: {os.path.basename(dest_path)}")
        except Exception as e:
            print(f"\n[MOODLE]: Error al descargar el archivo: {e}")

# =====================================================================
# 🚀 FUNCIÓN DE SINCRONIZACIÓN PRINCIPAL
# =====================================================================
COURSES_MAP = {
    "semiologia": ["med-228", "med228", "semiologia", "semiología", "propedéutica", "propedeutica"],
    "farmacologia": ["med-229", "med229", "farmacologia", "farmacología"],
    "fisiopatologia": ["fisiopatologia", "fisiopatología"],
    "bioetica": ["bioetica", "bioética", "deontologia", "deontología"],
    "patologia": ["patologia", "patología", "anatomia patologica", "anatomía patológica"],
    "microbiologia": ["microbiologia", "microbiología"],
    "epidemiologia": ["epidemiologia", "epidemiología"]
}

def resolve_course_key(fullname: str, shortname: str) -> str:
    combined = (fullname + " " + shortname).lower()
    for key, keywords in COURSES_MAP.items():
        for kw in keywords:
            if kw in combined:
                return key
    return None

def sync_all_courses(dry_run: bool = False):
    """
    Sincroniza todos los recursos de Moodle de la UCE asociados a las 7 asignaturas del semestre.
    """
    if dry_run:
        print("=== INICIANDO SINCRONIZADOR MULTI-CURSO DE MOODLE UCE (MODO SIMULACIÓN - DRY RUN) ===")
    else:
        print("=== INICIANDO SINCRONIZADOR MULTI-CURSO DE MOODLE UCE ===")
    
    # 1. Cargar credenciales desde .env
    env = load_env_variables()
    username = env.get("MOODLE_USERNAME")
    password = env.get("MOODLE_PASSWORD")
    token = env.get("MOODLE_TOKEN")
    
    if not dry_run and not token and (not username or not password):
        print("[MOODLE]: Error: Faltan credenciales de Moodle en tu archivo .env")
        print("[MOODLE]: Agrega MOODLE_USERNAME y MOODLE_PASSWORD a tu archivo .env")
        return False
        
    # 2. Inicializar cliente
    try:
        client = MoodleClient(username=username, password=password, token=token, dry_run=dry_run)
    except Exception:
        print("[MOODLE]: Abortando descarga por error de autenticación.")
        return False
        
    # 3. Listar cursos del alumno
    courses = client.get_courses()
    print(f"[MOODLE]: Se encontraron {len(courses)} asignaturas activas en Moodle.")
    
    base_output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "material_moodle")
    os.makedirs(base_output_dir, exist_ok=True)
    
    sync_count = 0
    total_download_count = 0
    
    for c in courses:
        fullname = c.get("fullname", "")
        shortname = c.get("shortname", "")
        course_id = c.get("id")
        
        course_key = resolve_course_key(fullname, shortname)
        if not course_key:
            # Omitir cursos no configurados en el selector de 7 materias
            continue
            
        print(f"\n[MOODLE]: >>> Sincronizando curso detectado: {fullname} -> carpeta: '{course_key}' (ID: {course_id})")
        sync_count += 1
        
        # Crear subcarpeta específica de la materia
        output_dir = os.path.join(base_output_dir, course_key)
        os.makedirs(output_dir, exist_ok=True)
        
        # 4. Obtener archivos de este curso
        modules = client.get_course_resources(course_id)
        print(f"[MOODLE]: Se encontraron {len(modules)} recursos en {course_key.upper()}.")
        
        course_download_count = 0
        for mod in modules:
            mod_type = mod.get("modname")
            
            # Recurso tipo archivo simple
            if mod_type == "resource":
                for content in mod.get("contents", []):
                    filename = content.get("filename")
                    fileurl = content.get("fileurl")
                    
                    ext = filename.split(".")[-1].lower()
                    if ext in ["pdf", "pptx", "docx"]:
                        dest_path = os.path.join(output_dir, filename)
                        if os.path.exists(dest_path):
                            continue
                            
                        print(f"[MOODLE]: Nuevo archivo: {filename}")
                        client.download_file(fileurl, dest_path)
                        course_download_count += 1
                        total_download_count += 1
                        
            # Recurso tipo carpeta
            elif mod_type == "folder":
                for content in mod.get("contents", []):
                    filename = content.get("filename")
                    fileurl = content.get("fileurl")
                    
                    ext = filename.split(".")[-1].lower()
                    if ext in ["pdf", "pptx", "docx"]:
                        dest_path = os.path.join(output_dir, filename)
                        if os.path.exists(dest_path):
                            continue
                            
                        print(f"[MOODLE]: Nuevo archivo en carpeta [{mod.get('name')}]: {filename}")
                        client.download_file(fileurl, dest_path)
                        course_download_count += 1
                        total_download_count += 1
                        
        print(f"[MOODLE]: Sincronización de {course_key.upper()} completada. {course_download_count} archivos nuevos.")
        
    print(f"\n=== SINOPSIS: Sincronización completada. Se procesaron {sync_count} asignaturas y se descargaron {total_download_count} archivos nuevos ===")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cliente de Sincronización y Descarga de Moodle para 7 Asignaturas UCE.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula el flujo de sincronización de cursos sin realizar llamadas de red."
    )
    args = parser.parse_args()
    sync_all_courses(dry_run=args.dry_run)
