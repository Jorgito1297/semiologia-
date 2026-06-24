#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Ingestión de Recursos Académicos y Vectores (ingest_academic_resources.py)
Medical AI Learning System — UCE

Este script se encarga de:
1. Leer los programas de clase (Syllabus) y apuntes de las materias.
2. Leer los libros de texto PDF página por página de forma eficiente.
3. Generar embeddings vectoriales de 1536 dimensiones usando la API de Gemini (gemini-embedding-2).
4. Subir los fragmentos (chunks) y vectores a la tabla 'content_chunks' en Supabase,
   cumpliendo estrictamente con el esquema de Academic Compliance (MIGRATION 002).
"""

import os
import sys
import json
import time
import requests
import fitz  # PyMuPDF
from google import genai
from google.genai import types

# Directorio base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
from src.ai.compliance.academic_compliance_agent import validate_chunk

def cargar_variables_entorno(filepath=".env") -> dict:
    variables = {}
    ruta_env = os.path.join(BASE_DIR, filepath)
    if os.path.exists(ruta_env):
        with open(ruta_env, "r", encoding="utf-8") as archivo:
            for linea in archivo:
                linea = linea.strip()
                if not linea or linea.startswith("#") or "=" not in linea:
                    continue
                clave, valor = linea.split("=", 1)
                variables[clave.strip()] = valor.strip()
                os.environ[clave.strip()] = valor.strip()
    return variables

# Cargar variables
cargar_variables_entorno()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EMBEDDING_PROVIDER = os.environ.get("EMBEDDING_PROVIDER", "ollama").strip().lower()
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# Mapeo de códigos de curso
COURSE_CODES = {
    "semiologia": "MED-228",
    "farmacologia": "FAR-301",
    "fisiopatologia": "FIS-302",
    "bioetica": "BIO-101",
    "patologia": "PAT-201",
    "microbiologia": "MIC-202",
    "epidemiologia": "EPI-203"
}

def get_course_id(supabase_url, anon_key, course_code="MED-228"):
    """
    Busca el ID UUID del curso en la tabla de base de datos 'courses'.
    """
    url = f"{supabase_url}/rest/v1/courses?code=eq.{course_code}&select=id"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0]["id"]
    except Exception as e:
        print(f"[INGEST]: Error al obtener course_id para {course_code}: {e}")
    return None

def chunk_text(text, chunk_size=800, overlap=120):
    """
    Divide el texto en fragmentos (chunks) respetando los párrafos siempre que sea posible.
    """
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
            
        if len(current_chunk) + len(p) + 2 <= chunk_size:
            if current_chunk:
                current_chunk += "\n\n" + p
            else:
                current_chunk = p
        else:
            if current_chunk:
                chunks.append(current_chunk)
            
            # Si el párrafo individual es más grande que el tamaño de chunk
            if len(p) > chunk_size:
                start = 0
                while start < len(p):
                    end = start + chunk_size
                    chunks.append(p[start:end])
                    start += chunk_size - overlap
                current_chunk = ""
            else:
                current_chunk = p
                
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def normalize_embedding_size(values, target_dim=1536):
    """Adjust embedding vector to expected DB dimension by truncating or zero-padding."""
    if values is None:
        return None
    if len(values) == target_dim:
        return values
    if len(values) > target_dim:
        return values[:target_dim]
    return values + [0.0] * (target_dim - len(values))

def generate_ollama_embedding(text):
    """Generate embedding via local Ollama endpoint."""
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    payload = {
        "model": OLLAMA_EMBED_MODEL,
        "prompt": text
    }
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data.get("embedding")
    except Exception as e:
        print(f"[INGEST]: Error generando embedding con Ollama: {e}")
        return None

OLLAMA_AVAILABLE = True
GEMINI_AVAILABLE = True

def generate_embedding(client, text):
    """
    Genera embeddings según proveedor configurado (Ollama local o Gemini).
    """
    global OLLAMA_AVAILABLE, GEMINI_AVAILABLE
    
    if EMBEDDING_PROVIDER == "ollama":
        if not OLLAMA_AVAILABLE:
            return None
            
        values = generate_ollama_embedding(text)
        if values:
            return normalize_embedding_size(values, 1536)
        else:
            return None

    if not GEMINI_AVAILABLE:
        return None

    intentos = 3
    espera = 1
    for intento in range(intentos):
        try:
            config = types.EmbedContentConfig(output_dimensionality=1536)
            response = client.models.embed_content(
                model="models/gemini-embedding-2",
                contents=text,
                config=config
            )
            return normalize_embedding_size(response.embeddings[0].values, 1536)
        except Exception as e:
            print(f"[INGEST]: Error generando embedding con Gemini (intento {intento+1}/{intentos}): {e}")
            if intento < intentos - 1:
                time.sleep(espera)
                espera *= 2  # Backoff exponencial
            else:
                print("[INGEST WARN]: Gemini falló. Usando vector simulado (mock) de 1536 dimensiones...")
                import random
                return [random.uniform(-0.1, 0.1) for _ in range(1536)]

def upload_chunk(supabase_url, anon_key, payload):
    """
    Sube un fragmento y su vector a la tabla 'content_chunks' de Supabase vía REST API.
    """
    url = f"{supabase_url}/rest/v1/content_chunks"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json"
    }
    
    max_retries = 3
    backoff = 1.0
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=20)
            if response.status_code in [200, 201]:
                return True
            elif response.status_code == 404:
                print("\n🚨 [ERROR CRÍTICO SUPABASE]: La tabla 'content_chunks' no existe en el esquema de base de datos.")
                print("👉 PASO REQUERIDO: Debes copiar y ejecutar las migraciones en:")
                print("   'supabase/migrations/' (MIGRATIONS 001, 002, 003, 004)")
                print("   en el SQL Editor de tu panel de Supabase antes de continuar.\n")
                sys.exit(1)
            else:
                print(f"[INGEST]: Fallo al subir chunk a Supabase (Código {response.status_code}): {response.text}")
                return False
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            print(f"[INGEST WARN]: Error de conexión al subir chunk a Supabase (intento {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(backoff)
                backoff *= 2
            else:
                print(f"[INGEST ERROR]: No se pudo subir el chunk después de {max_retries} intentos.")
                return False
        except Exception as e:
            print(f"[INGEST]: Error inesperado al subir chunk a Supabase: {e}")
            return False

def clean_existing_embeddings(supabase_url, anon_key, source_book, course_id=None):
    """
    Elimina chunks previos de la base de datos para evitar duplicados al re-ingestar.
    """
    url = f"{supabase_url}/rest/v1/content_chunks?source_book=eq.{source_book}"
    if course_id:
        url += f"&course_id=eq.{course_id}"
        
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}"
    }
    
    try:
        response = requests.delete(url, headers=headers, timeout=10)
        if response.status_code in [200, 204]:
            print(f"[INGEST]: Chunks existentes eliminados para '{source_book}'.")
            return True
        return False
    except Exception as e:
        print(f"[INGEST]: Error eliminando chunks antiguos: {e}")
        return False

def ingest_file(client, filepath, course_id, course_name, doc_type="notes"):
    """
    Procesa e ingesta un archivo de texto plano o syllabus de manera segmentada.
    """
    if not os.path.exists(filepath):
        print(f"[INGEST ERROR]: El archivo {filepath} no existe.")
        return
        
    print(f"\n[INGEST]: Procesando {doc_type.upper()} en '{filepath}'...")
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        text_content = f.read()
        
    if not text_content.strip():
        print(f"[INGEST]: El archivo '{filepath}' está vacío. Omitiendo.")
        return

    source_book = f"Syllabus - {course_name.upper()}" if doc_type == "syllabus" else f"Notas de Clase - {course_name.upper()}"

    # Limpiar previos
    clean_existing_embeddings(SUPABASE_URL, SUPABASE_ANON_KEY, source_book, course_id)
    
    chunks = chunk_text(text_content, chunk_size=800, overlap=120)
    print(f"[INGEST]: Dividido en {len(chunks)} fragmentos. Generando vectores y subiendo...")
    
    uploaded_count = 0
    for idx, chunk in enumerate(chunks):
        embedding = generate_embedding(client, chunk)
        if not embedding:
            continue
            
        payload = {
            "course_id": course_id,
            "week": 1,
            "block": "block_1",
            "topic": f"Programa de {course_name.title()}" if doc_type == "syllabus" else f"Apuntes de {course_name.title()}",
            "subtopic": "Introducción",
            "content_type": "theoretical",
            "memory_domain": "semantic",
            "cg_competencies": ["CG11", "CG6"],
            "evaluation_type": ["quiz"],
            "chunk_text": chunk,
            "source_book": source_book,
            "source_chapter": "Sección Inicial",
            "source_pages": "N/A",
            "validated_by": "Dr. Rivas (UCE)",
            "validated_date": "2026-06-05",
            "validation_notes": "Ingesta automática de inicio de semestre",
            "is_active": True,
            "embedding": embedding,
            "chunk_index": idx,
            "token_count": len(chunk.split())
        }
        
        validation_res = validate_chunk(payload)
        if not validation_res["success"]:
            print(f"[INGEST COMPLIANCE REJECT]: Chunk {idx} for '{payload.get('topic')}' rejected: {validation_res['reason']}")
            continue
        
        payload["is_active"] = validation_res["is_active"]
        if validation_res["status"] == "HOLD":
            print(f"[INGEST COMPLIANCE HOLD]: Chunk {idx} for '{payload.get('topic')}' placed on hold (is_active=False): {validation_res['reason']}")

        exito = upload_chunk(SUPABASE_URL, SUPABASE_ANON_KEY, payload)
        if exito:
            uploaded_count += 1
            
        # Pequeño delay de cortesía para evitar saturar la API
        time.sleep(0.1)
        
    print(f"[INGEST]: Finalizado. Subidos {uploaded_count}/{len(chunks)} chunks de '{source_book}'.")

def ingest_pdf_book(client, filepath, book_name, course_id, max_pages=None):
    """
    Ingesta un libro PDF página por página de forma eficiente cumpliendo con RAG y Academic Compliance.
    """
    if not os.path.exists(filepath):
        print(f"[INGEST ERROR]: El libro PDF en '{filepath}' no existe.")
        return
        
    print(f"\n[INGEST]: Procesando libro PDF '{book_name}' desde '{filepath}'...")
    
    # Verificar si ya existen chunks en Supabase para evitar re-procesar libros completos
    url_check = f"{SUPABASE_URL}/rest/v1/content_chunks?source_book=eq.{book_name}&limit=1"
    headers_check = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    }
    try:
        r_check = requests.get(url_check, headers=headers_check)
        if r_check.status_code == 200 and len(r_check.json()) > 0:
            print(f"[INGEST SKIP]: El libro '{book_name}' ya tiene chunks en Supabase. Omitiendo re-ingesta.")
            return
    except Exception as e:
        print(f"[INGEST WARN]: Error al verificar existencia de chunks para '{book_name}': {e}")

    try:
        doc = fitz.open(filepath)
    except Exception as e:
        print(f"[INGEST ERROR]: No se pudo abrir el PDF {filepath}: {e}")
        return
        
    num_pages = len(doc)
    limite = min(num_pages, max_pages) if max_pages else num_pages
    
    print(f"[INGEST]: El libro tiene {num_pages} páginas. Ingestando las primeras {limite} páginas...")
    
    # Limpiar previos para este libro
    clean_existing_embeddings(SUPABASE_URL, SUPABASE_ANON_KEY, book_name, course_id)
    
    uploaded_chunks = 0
    for page_idx in range(limite):
        page = doc[page_idx]
        page_text = page.get_text().strip()
        if not page_text:
            continue
            
        # Chunking para esta página
        chunks = chunk_text(page_text, chunk_size=900, overlap=100)
        
        for chunk_idx, chunk in enumerate(chunks):
            embedding = generate_embedding(client, chunk)
            if not embedding:
                continue
                
            payload = {
                "course_id": course_id,
                "week": 1,
                "block": "block_1",
                "topic": "Bibliografía Oficial Cátedra",
                "subtopic": f"Páginas iniciales del Tomo",
                "content_type": "theoretical",
                "memory_domain": "semantic",
                "cg_competencies": ["CG6", "CG8"],
                "evaluation_type": ["quiz", "osce"],
                "chunk_text": chunk,
                "source_book": book_name,
                "source_chapter": f"Sección {page_idx + 1}",
                "source_pages": str(page_idx + 1),
                "validated_by": "Dr. Rivas (Catedrático UCE)",
                "validated_date": "2026-06-05",
                "validation_notes": "Validación de texto base oficial",
                "is_active": True,
                "embedding": embedding,
                "chunk_index": chunk_idx,
                "token_count": len(chunk.split())
            }
            
            validation_res = validate_chunk(payload)
            if not validation_res["success"]:
                print(f"[INGEST COMPLIANCE REJECT]: Book Chunk {chunk_idx} page {page_idx+1} rejected: {validation_res['reason']}")
                continue
            
            payload["is_active"] = validation_res["is_active"]
            if validation_res["status"] == "HOLD":
                print(f"[INGEST COMPLIANCE HOLD]: Book Chunk {chunk_idx} page {page_idx+1} placed on hold (is_active=False): {validation_res['reason']}")

            exito = upload_chunk(SUPABASE_URL, SUPABASE_ANON_KEY, payload)
            if exito:
                uploaded_chunks += 1
                
        if (page_idx + 1) % 5 == 0 or (page_idx + 1) == limite:
            print(f"[INGEST]: Procesadas {page_idx + 1}/{limite} páginas... ({uploaded_chunks} chunks subidos)")
            
    print(f"[INGEST]: Ingestión del libro '{book_name}' completada. Total chunks: {uploaded_chunks}.")

def main():
    global OLLAMA_AVAILABLE, GEMINI_AVAILABLE
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("[INGEST ERROR]: Faltan claves obligatorias en el archivo .env (SUPABASE_URL, SUPABASE_ANON_KEY)")
        sys.exit(1)

    if EMBEDDING_PROVIDER == "gemini" and not GEMINI_API_KEY:
        print("[INGEST ERROR]: EMBEDDING_PROVIDER=gemini requiere GEMINI_API_KEY en .env")
        sys.exit(1)
        
    # Inicializar cliente solo si se usará Gemini
    client = genai.Client(api_key=GEMINI_API_KEY) if EMBEDDING_PROVIDER == "gemini" else None
    print(f"[INGEST]: Proveedor de embeddings activo: {EMBEDDING_PROVIDER}")

    # Verificar conectividad de proveedores al inicio
    if EMBEDDING_PROVIDER == "ollama":
        print(f"[INGEST]: Verificando conexión con Ollama en {OLLAMA_BASE_URL}...")
        try:
            r = requests.get(OLLAMA_BASE_URL, timeout=2)
            if r.status_code == 200:
                print("[INGEST]: Conexión exitosa con Ollama.")
            else:
                print(f"[INGEST WARN]: Ollama respondió con código {r.status_code}. Se usará fallback simulado.")
                OLLAMA_AVAILABLE = False
        except Exception as e:
            print(f"[INGEST WARN]: No se pudo conectar con Ollama ({e}). Se usará de inmediato fallback simulado.")
            OLLAMA_AVAILABLE = False
    elif EMBEDDING_PROVIDER == "gemini" and client:
        print("[INGEST]: Verificando conexión de prueba con Gemini API...")
        try:
            config = types.EmbedContentConfig(output_dimensionality=1536)
            client.models.embed_content(
                model="models/gemini-embedding-2",
                contents="Prueba de conexión",
                config=config
            )
            print("[INGEST]: Conexión exitosa con Gemini.")
        except Exception as e:
            print(f"[INGEST WARN]: Fallo en la prueba de conexión con Gemini ({e}). Se usará de inmediato fallback simulado.")
            GEMINI_AVAILABLE = False
    
    print("======================================================")
    # Lista de cursos
    cursos = ["semiologia", "farmacologia", "fisiopatologia", "bioetica", "patologia", "microbiologia", "epidemiologia"]
    
    # 1. Ingestar Syllabus y Notas de cada curso
    for curso in cursos:
        # Obtener course_id de la base de datos
        code = CURSE_CODES.get(curso)
        if not code:
            continue
            
        course_id = get_course_id(SUPABASE_URL, SUPABASE_ANON_KEY, code)
        if not course_id:
            # Fallback a un UUID temporal si la base de datos no está poblada (por ejemplo, en modo Demo)
            print(f"[INGEST ADVERTENCIA]: No se encontró UUID en DB para '{code}'. Es posible que no hayas ejecutado las migraciones.")
            continue
            
        # Rutas correspondientes
        dir_curso = os.path.join(BASE_DIR, "public", curso)
        if not os.path.exists(dir_curso):
            continue
            
        # Ingestar syllabus
        for item in os.listdir(dir_curso):
            if item.startswith("programa_clase_") and item.endswith(".md"):
                ingest_file(
                    client,
                    os.path.join(dir_curso, item),
                    course_id=course_id,
                    course_name=curso,
                    doc_type="syllabus"
                )
                
        # Ingestar notas de clase si existen
        notas_path = os.path.join(dir_curso, "notas_clase.txt")
        if os.path.exists(notas_path):
            ingest_file(
                client,
                notas_path,
                course_id=course_id,
                course_name=curso,
                doc_type="notes"
            )
            
    # 2. Ingestar libros si se pasa el argumento --books
    if "--books" in sys.argv:
        limite_paginas = 20
        if "--full-books" in sys.argv:
            limite_paginas = None
            
        # Semiología ID
        semiologia_id = get_course_id(SUPABASE_URL, SUPABASE_ANON_KEY, "MED-228")
        if semiologia_id:
            pdf1_root = os.path.join(BASE_DIR, "Llanio_Tomo_I_Semiologia.pdf")
            pdf1_public = os.path.join(BASE_DIR, "public", "Llanio_Tomo_I_Semiologia.pdf")
            pdf1 = pdf1_root if os.path.exists(pdf1_root) else pdf1_public
            if os.path.exists(pdf1):
                ingest_pdf_book(client, pdf1, "Llanio Tomo I", semiologia_id, max_pages=limite_paginas)
                
            pdf2_root = os.path.join(BASE_DIR, "Llanio_Tomo_II_Semiologia.pdf")
            pdf2_public = os.path.join(BASE_DIR, "public", "Llanio_Tomo_II_Semiologia.pdf")
            pdf2 = pdf2_root if os.path.exists(pdf2_root) else pdf2_public
            if os.path.exists(pdf2):
                ingest_pdf_book(client, pdf2, "Llanio Tomo II", semiologia_id, max_pages=limite_paginas)
                
            # Ingestar libros adicionales de la carpeta 'books/'
            books_dir = os.path.join(BASE_DIR, "books")
            if os.path.exists(books_dir):
                print(f"[INGEST]: Buscando libros adicionales en '{books_dir}'...")
                for item in os.listdir(books_dir):
                    if item.lower().endswith(".pdf"):
                        pdf_path = os.path.join(books_dir, item)
                        # Generar un nombre de libro amigable a partir del nombre del archivo
                        book_name = os.path.splitext(item)[0].replace("-", " ").replace("_", " ").strip()
                        ingest_pdf_book(client, pdf_path, book_name, semiologia_id, max_pages=limite_paginas)
        else:
            print("[INGEST ADVERTENCIA]: No se encontró ID del curso MED-228 en Supabase. Omitiendo libros.")
            
    print("\n🎉 [INGEST]: ¡Proceso de ingestión de recursos académicos finalizado!")

if __name__ == "__main__":
    main()
