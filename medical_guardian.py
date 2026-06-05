#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Guardián de Monitoreo de Recursos Médicos (medical_guardian.py)
Medical AI Learning System — UCE

Este guardián utiliza la librería watchdog para monitorear directorios clave
en busca de nuevos materiales de clase (PDF, PPTX, DOCX, VTT, etc.) para 7 cursos.
Cuando se detecta un nuevo archivo, espera a que se estabilice y lo procesa
automáticamente para actualizar notas_clase.txt y generar un nuevo repaso interactivo.
"""

import os
import sys
import time
import subprocess
import argparse
import threading

# Asegurar que el directorio del script esté en el path de búsqueda de Python
DIRECTORIO_BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(DIRECTORIO_BASE)

# =====================================================================
# ⚙️ GESTIÓN DE DEPENDENCIAS AUTOMÁTICA
# =====================================================================
try:
    import watchdog
except ImportError:
    print("[GUARDIÁN]: watchdog no detectado localmente. Intentando importar dependencias de document_parser...")
    try:
        import document_parser
        import watchdog
    except (ImportError, ModuleNotFoundError):
        print("[GUARDIÁN]: document_parser no disponible. Instalando watchdog vía pip...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog"])
            import watchdog
            print("[GUARDIÁN]: watchdog instalado exitosamente.")
        except Exception as error_instalacion:
            print(f"[GUARDIÁN ERROR]: No se pudo instalar watchdog automáticamente: {error_instalacion}")
            sys.exit(1)

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Extensiones soportadas por el document_parser.py
EXTENSIONES_SOPORTADAS = {'.pdf', '.pptx', '.docx', '.vtt', '.srt', '.mp4', '.mp3'}

# Control de hilos y temporizadores para debouncing
temporizadores_activos = {}
bloqueo_temporizadores = threading.Lock()

# =====================================================================
# 🔑 CARGA SEGURA DE CONFIGURACIÓN (.env)
# =====================================================================
def cargar_variables_entorno() -> dict:
    """
    Carga variables de entorno desde el archivo .env local sin dependencias externas.
    """
    variables = {}
    ruta_env = os.path.join(DIRECTORIO_BASE, ".env")
    if os.path.exists(ruta_env):
        with open(ruta_env, "r", encoding="utf-8") as archivo:
            for linea in archivo:
                linea = linea.strip()
                if not linea or linea.startswith("#") or "=" not in linea:
                    continue
                clave, valor = linea.split("=", 1)
                variables[clave.strip()] = valor.strip()
    return variables

# Propagar variables de entorno al proceso actual y sus subprocesos
variables_entorno = cargar_variables_entorno()
for clave_env, valor_env in variables_entorno.items():
    os.environ[clave_env] = valor_env

# =====================================================================
# 🧭 RESOLUCIÓN DINÁMICA DE CURSO Y RUTAS
# =====================================================================
def determinar_curso_y_rutas(ruta_archivo: str) -> dict:
    """
    Analiza la ruta de un archivo modificado/creado para identificar a qué curso pertenece.
    Retorna un diccionario con todas las rutas necesarias para el pipeline.
    """
    curso_detectado = "semiologia"
    cursos_soportados = [
        "semiologia",
        "farmacologia",
        "fisiopatologia",
        "bioetica",
        "patologia",
        "microbiologia",
        "epidemiologia"
    ]
    
    ruta_abs = os.path.abspath(ruta_archivo)
    ruta_teams = os.path.abspath(os.path.join(DIRECTORIO_BASE, "teams_recordings"))
    ruta_moodle = os.path.abspath(os.path.join(DIRECTORIO_BASE, "material_moodle"))
    
    # Analizar si proviene de grabaciones de Teams
    if ruta_abs.startswith(ruta_teams):
        ruta_relativa = os.path.relpath(ruta_abs, ruta_teams)
        partes = ruta_relativa.split(os.sep)
        if len(partes) >= 2:
            primer_directorio = partes[0].lower()
            if primer_directorio in cursos_soportados:
                curso_detectado = primer_directorio
                
    # Analizar si proviene de material de Moodle
    elif ruta_abs.startswith(ruta_moodle):
        ruta_relativa = os.path.relpath(ruta_abs, ruta_moodle)
        partes = ruta_relativa.split(os.sep)
        if len(partes) >= 2:
            primer_directorio = partes[0].lower()
            if primer_directorio in cursos_soportados:
                curso_detectado = primer_directorio
                
    # Determinar rutas específicas de la carpeta del curso en public/
    directorio_publico = os.path.join(DIRECTORIO_BASE, "public", curso_detectado)
    os.makedirs(directorio_publico, exist_ok=True)
    
    ruta_notas = os.path.join(directorio_publico, "notas_clase.txt")
    ruta_repaso_html = os.path.join(directorio_publico, "repaso.html")
    ruta_repaso_md = os.path.join(directorio_publico, "repaso.md")
    
    # Buscar el syllabus de la materia en su subcarpeta (un archivo md que empiece con programa_clase_)
    archivo_syllabus = None
    for item in os.listdir(directorio_publico):
        if item.startswith("programa_clase_") and item.endswith(".md"):
            archivo_syllabus = os.path.join(directorio_publico, item)
            break
            
    # Fallback si no se detecta ningún archivo
    if not archivo_syllabus:
        if curso_detectado == "semiologia":
            archivo_syllabus = os.path.join(directorio_publico, "programa_clase_MED228.md")
        else:
            archivo_syllabus = os.path.join(directorio_publico, f"programa_clase_{curso_detectado}.md")
            
    return {
        "curso": curso_detectado,
        "notas_txt": ruta_notas,
        "repaso_html": ruta_repaso_html,
        "repaso_md": ruta_repaso_md,
        "syllabus": archivo_syllabus
    }

# =====================================================================
# 🛠️ PROCESAMIENTO DE ARCHIVO (PIPELINE)
# =====================================================================
def ejecutar_pipeline(ruta_archivo: str) -> bool:
    """
    Ejecuta el pipeline completo de procesamiento para el archivo y curso detectados:
    1. document_parser.py -> notas_clase.txt del curso
    2. generate_review.py -> repaso.html & repaso.md del curso
    """
    ruta_abs = os.path.abspath(ruta_archivo)
    informacion_curso = determinar_curso_y_rutas(ruta_abs)
    
    curso = informacion_curso["curso"]
    notas_txt = informacion_curso["notas_txt"]
    repaso_html = informacion_curso["repaso_html"]
    repaso_md = informacion_curso["repaso_md"]
    syllabus = informacion_curso["syllabus"]
    
    print(f"\n[GUARDIÁN]: >>> INICIANDO PIPELINE PARA EL CURSO: {curso.upper()}")
    print(f"[GUARDIÁN]: Archivo origen detectado: {os.path.basename(ruta_archivo)}")
    print(f"[GUARDIÁN]: Notas generadas: {notas_txt}")
    print(f"[GUARDIÁN]: Repaso HTML: {repaso_html}")
    print(f"[GUARDIÁN]: Repaso MD: {repaso_md}")
    print(f"[GUARDIÁN]: Syllabus del curso: {syllabus}")
    
    script_parser = os.path.join(DIRECTORIO_BASE, "document_parser.py")
    script_review = os.path.join(DIRECTORIO_BASE, "generate_review.py")
    
    # 1. Ejecutar document_parser.py
    print(f"[GUARDIÁN]: Parseando archivo...")
    cmd_parser = [sys.executable, script_parser, ruta_archivo, notas_txt]
    
    try:
        resultado_parser = subprocess.run(
            cmd_parser,
            capture_output=True,
            text=True,
            cwd=DIRECTORIO_BASE,
            timeout=180
        )
        if resultado_parser.returncode != 0:
            print(f"[GUARDIÁN ERROR]: document_parser.py falló con código {resultado_parser.returncode}")
            print(f"Detalles:\n{resultado_parser.stderr}")
            return False
        print(f"[GUARDIÁN]: Extracción exitosa. Guardado en notas_clase.txt.")
    except subprocess.TimeoutExpired:
        print(f"[GUARDIÁN ERROR]: Tiempo de espera agotado al parsear {ruta_archivo}.")
        return False
    except Exception as error_parser:
        print(f"[GUARDIÁN ERROR]: Excepción al ejecutar el parser: {error_parser}")
        return False

    # 2. Ejecutar generate_review.py con argumentos específicos para el curso
    print(f"[GUARDIÁN]: Generando repaso interactivo (HTML & Markdown)...")
    cmd_review = [
        sys.executable, 
        script_review,
        "--input", notas_txt,
        "--html", repaso_html,
        "--md", repaso_md,
        "--syllabus", syllabus
    ]
    
    try:
        resultado_review = subprocess.run(
            cmd_review,
            capture_output=True,
            text=True,
            cwd=DIRECTORIO_BASE,
            timeout=120
        )
        if resultado_review.returncode != 0:
            print(f"[GUARDIÁN ERROR]: generate_review.py falló con código {resultado_review.returncode}")
            print(f"Detalles:\n{resultado_review.stderr}")
            return False
        print(f"[GUARDIÁN]: Repaso generado exitosamente para el curso: {curso.upper()}.")
        
        # 3. Firebase Auto-Deploy (si está configurado)
        autodespliegue = os.environ.get("AUTO_DEPLOY_FIREBASE", "false").lower() == "true"
        if autodespliegue:
            print(f"[GUARDIÁN]: Desplegando en Firebase Hosting...")
            try:
                resultado_despliegue = subprocess.run(
                    "firebase deploy --only hosting",
                    shell=True,
                    capture_output=True,
                    text=True,
                    cwd=DIRECTORIO_BASE,
                    timeout=90
                )
                if resultado_despliegue.returncode != 0:
                    print(f"[GUARDIÁN ERROR]: Despliegue de Firebase falló con código {resultado_despliegue.returncode}")
                    print(f"Detalles:\n{resultado_despliegue.stderr}")
                else:
                    print(f"[GUARDIÁN]: Despliegue en Firebase Hosting exitoso.")
                    for linea in resultado_despliegue.stdout.splitlines():
                        if "Hosting URL:" in linea:
                            print(f"[GUARDIÁN]: {linea.strip()}")
            except Exception as error_deploy:
                print(f"[GUARDIÁN ERROR]: Excepción durante el despliegue en Firebase: {error_deploy}")
                
        print(f"[GUARDIÁN]: >>> PIPELINE COMPLETADO CON ÉXITO para {os.path.basename(ruta_archivo)}")
        return True
    except Exception as error_review:
        print(f"[GUARDIÁN ERROR]: Excepción al ejecutar generador de repasos: {error_review}")
        return False

def procesar_archivo_estabilizado(ruta_archivo: str):
    """
    Función llamada tras el retraso del temporizador. 
    Verifica que el archivo esté completamente escrito antes de procesar.
    """
    with bloqueo_temporizadores:
        temporizadores_activos.pop(ruta_archivo, None)
        
    if not os.path.exists(ruta_archivo):
        print(f"[GUARDIÁN]: Archivo {os.path.basename(ruta_archivo)} ya no existe. Cancelando procesamiento.")
        return

    print(f"[GUARDIÁN]: Verificando estabilidad del archivo {os.path.basename(ruta_archivo)}...")
    
    tamanio_anterior = -1
    contador_estabilidad = 0
    while contador_estabilidad < 3:
        try:
            tamanio_actual = os.path.getsize(ruta_archivo)
        except OSError:
            # El archivo podría estar bloqueado momentáneamente por el sistema
            time.sleep(1)
            continue
            
        if tamanio_actual == tamanio_anterior and tamanio_actual > 0:
            contador_estabilidad += 1
        else:
            contador_estabilidad = 0
            tamanio_anterior = tamanio_actual
            
        time.sleep(1)

    ejecutar_pipeline(ruta_archivo)

def programar_procesamiento_archivo(ruta_archivo: str):
    """
    Programa el procesamiento de un archivo en 5 segundos. 
    Si ya estaba programado, reinicia el temporizador (debouncing).
    """
    with bloqueo_temporizadores:
        if ruta_archivo in temporizadores_activos:
            temporizadores_activos[ruta_archivo].cancel()
            print(f"[GUARDIÁN]: Reiniciando temporizador de 5s para {os.path.basename(ruta_archivo)}")
            
        temporizador = threading.Timer(5.0, procesar_archivo_estabilizado, args=[ruta_archivo])
        temporizadores_activos[ruta_archivo] = temporizador
        temporizador.start()
        print(f"[GUARDIÁN]: Procesamiento programado en 5s para: {os.path.basename(ruta_archivo)}")

# =====================================================================
# 👁️ EVENT HANDLER DE WATCHDOG
# =====================================================================
class ManejadorEventosClinicos(FileSystemEventHandler):
    def procesar_evento(self, tipo_evento: str, ruta_origen: str, es_directorio: bool):
        if es_directorio:
            return
            
        ruta_abs = os.path.abspath(ruta_origen)
        extension = os.path.splitext(ruta_abs)[1].lower()
        
        if extension in EXTENSIONES_SOPORTADAS:
            nombre_archivo = os.path.basename(ruta_abs)
            # Evitar procesar archivos temporales o de bloqueo de editores (como Word ~$doc)
            if nombre_archivo.startswith("~$") or nombre_archivo.startswith("."):
                return
            programar_procesamiento_archivo(ruta_abs)

    def on_created(self, event):
        self.procesar_evento("CREADO", event.src_path, event.is_directory)

    def on_modified(self, event):
        self.procesar_evento("MODIFICADO", event.src_path, event.is_directory)

    def on_moved(self, event):
        self.procesar_evento("MOVIDO", event.dest_path, event.is_directory)

# =====================================================================
# 🚀 MODO SIMULACIÓN (E2E TESTING)
# =====================================================================
def ejecutar_simulacion(ruta_teams_local: str):
    """
    Ejecuta una simulación end-to-end para el curso de semiología:
    1. Inicia el observer
    2. Escribe una transcripción WebVTT ficticia en la subcarpeta del curso
    3. Espera a que el event handler reaccione y ejecute el pipeline
    4. Verifica que los archivos de salida del curso se hayan actualizado
    """
    print("\n" + "="*60)
    print("🎬 MODO SIMULACIÓN: Probando integración end-to-end del pipeline multi-curso")
    print("="*60)
    
    ruta_curso_semiologia = os.path.join(ruta_teams_local, "semiologia")
    os.makedirs(ruta_curso_semiologia, exist_ok=True)
    
    # Iniciar Observer temporal con monitoreo recursivo
    observador = Observer()
    manejador = ManejadorEventosClinicos()
    observador.schedule(manejador, ruta_teams_local, recursive=True)
    observador.start()
    print(f"[SIMULACIÓN]: Observer de prueba iniciado en: {ruta_teams_local} (Recursivo)")
    
    archivo_dummy = os.path.join(ruta_curso_semiologia, "clase_simulada_respiratorio.vtt")
    
    contenido_vtt = """WEBVTT

1
00:00:01.000 --> 00:00:10.000
<v Dr. Rivas>Buenas tardes a todos. Hoy entraremos en el Módulo IV y revisaremos el síndrome de derrame pleural y el neumotórax.</v>

2
00:00:11.000 --> 00:00:25.000
<v Dr. Rivas>El derrame pleural se caracteriza por dolor pleurítico, matidez a la percusión, abolición del murmullo vesicular y disminución de las vibraciones vocales. En cambio, en el neumotórax tenemos timpanismo.</v>

3
00:00:26.000 --> 00:00:35.000
<v Dr. Rivas>Recuerden que para el examen físico pulmonar, el Llanio Tomo I, Capítulo 27 al 29 detalla todas estas maniobras diagnósticas. Estudien para la evaluación práctica.</v>
"""
    
    # Escribir el archivo para gatillar el evento
    print(f"[SIMULACIÓN]: Escribiendo archivo de prueba: {archivo_dummy}")
    with open(archivo_dummy, "w", encoding="utf-8") as f:
        f.write(contenido_vtt)
        
    # Esperar los 5s de retardo + estabilidad + procesamiento de API (115s en total)
    tiempo_espera = 115
    print(f"[SIMULACIÓN]: Archivo escrito. Esperando {tiempo_espera} segundos para completar el pipeline...")
    for i in range(tiempo_espera, 0, -1):
        print(f"[SIMULACIÓN]: Cuenta regresiva: {i}s...", end="\r", flush=True)
        time.sleep(1)
    print("\n[SIMULACIÓN]: Tiempo de espera finalizado. Evaluando resultados...")
    
    # Detener observer de prueba
    observador.stop()
    observador.join()
    
    # Verificar la creación/modificación de archivos
    notas_txt = os.path.join(DIRECTORIO_BASE, "public", "semiologia", "notas_clase.txt")
    repaso_html = os.path.join(DIRECTORIO_BASE, "public", "semiologia", "repaso.html")
    repaso_md = os.path.join(DIRECTORIO_BASE, "public", "semiologia", "repaso.md")
    
    exito = True
    for ruta, nombre in [(notas_txt, "notas_clase.txt"), (repaso_html, "repaso.html"), (repaso_md, "repaso.md")]:
        if os.path.exists(ruta):
            antiguedad = time.time() - os.path.getmtime(ruta)
            if antiguedad < (tiempo_espera + 10): # Actualizado recientemente
                print(f"✅ [SIMULACIÓN OK]: '{nombre}' actualizado hace {antiguedad:.1f}s.")
            else:
                print(f"⚠️ [SIMULACIÓN ALERTA]: '{nombre}' existe pero no fue actualizado recientemente (edad: {antiguedad:.1f}s).")
                exito = False
        else:
            print(f"❌ [SIMULACIÓN ERROR]: '{nombre}' no fue creado en public/semiologia/.")
            exito = False
            
    # Limpieza del archivo de prueba
    if os.path.exists(archivo_dummy):
        try:
            os.remove(archivo_dummy)
            print(f"[SIMULACIÓN]: Archivo temporal {os.path.basename(archivo_dummy)} eliminado.")
        except Exception as error_limpieza:
            print(f"[SIMULACIÓN ERROR]: No se pudo eliminar el archivo temporal: {error_limpieza}")
            
    if exito:
        print("\n🎉 [SIMULACIÓN ÉXITO]: El pipeline de integración funciona correctamente.")
    else:
        print("\n🚨 [SIMULACIÓN FALLIDA]: El pipeline no se completó como se esperaba.")
    sys.exit(0 if exito else 1)

# =====================================================================
# 🏁 PROGRAMA PRINCIPAL CLI
# =====================================================================
def principal():
    analizador = argparse.ArgumentParser(
        description="Guardián de automatización para aprendizaje de Medicina UCE."
    )
    analizador.add_argument(
        "--simulate", 
        action="store_true", 
        help="Ejecuta una prueba de integración end-to-end simulada."
    )
    argumentos_analizador = analizador.parse_args()

    # Cargar rutas de monitoreo desde .env con valores por defecto
    ruta_teams_local = os.path.abspath(variables_entorno.get("LOCAL_TEAMS_PATH", os.path.join(DIRECTORIO_BASE, "teams_recordings")))
    ruta_trabajo = os.path.abspath(variables_entorno.get("workspace", DIRECTORIO_BASE))
    ruta_moodle = os.path.abspath(variables_entorno.get("material_moodle", os.path.join(DIRECTORIO_BASE, "material_moodle")))

    # Si se selecciona el modo simulación, ejecutarlo directamente
    if argumentos_analizador.simulate:
        ejecutar_simulacion(ruta_teams_local)

    # Modo Guardián Normal
    print("="*60)
    print("🩺 GUARDIÁN DE AUTOMATIZACIÓN MÉDICA MULTI-CURSO — ACTIVADO")
    print("="*60)
    
    rutas_a_monitorear = {ruta_teams_local, ruta_trabajo, ruta_moodle}
    
    print("[GUARDIÁN]: Configurando observadores en las siguientes rutas:")
    for ruta in rutas_a_monitorear:
        os.makedirs(ruta, exist_ok=True)
        print(f"  📂 Carpeta: {ruta}")
        
    # Inicializar y configurar Watchdog Observer
    observador = Observer()
    manejador = ManejadorEventosClinicos()
    
    # Grabaciones de Teams: monitoreo recursivo para capturar las subcarpetas de cursos
    observador.schedule(manejador, ruta_teams_local, recursive=True)
    print(f"[GUARDIÁN]: Escuchando (Recursivo): {ruta_teams_local}")
    
    # Material Moodle: monitoreo recursivo para capturar las subcarpetas de cursos
    observador.schedule(manejador, ruta_moodle, recursive=True)
    print(f"[GUARDIÁN]: Escuchando (Recursivo): {ruta_moodle}")
    
    # Directorio de trabajo raíz: monitoreo NO recursivo para evitar bucles con la carpeta public/
    observador.schedule(manejador, ruta_trabajo, recursive=False)
    print(f"[GUARDIÁN]: Escuchando (No Recursivo): {ruta_trabajo}")
        
    observador.start()
    print("\n[GUARDIÁN]: Escuchando cambios en tiempo real... (Presione Ctrl+C para detener)")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[GUARDIÁN]: Solicitud de detención recibida.")
    finally:
        print("[GUARDIÁN]: Deteniendo observador...")
        observador.stop()
        observador.join()
        
        # Detener cualquier temporizador activo pendiente
        with bloqueo_temporizadores:
            for temporizador in temporizadores_activos.values():
                temporizador.cancel()
        print("[GUARDIÁN]: Guardián finalizado correctamente.")

if __name__ == "__main__":
    principal()
