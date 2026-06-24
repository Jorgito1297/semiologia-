import os
import sys
import json
import uuid
import math
import re
import urllib.request
import urllib.error
import datetime
from pathlib import Path
from collections import Counter

# Base directory setup
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# Load .env
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "ollama").strip().lower()
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "qwen3:8b")
OLLAMA_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "60"))
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# ── Clinical Cases ──────────────────────────────────────────────────────────
CASES = {
    "1": {
        "name": "María Rodríguez",
        "week": 5,
        "topic": "Cefalea Tensional",
        "description": "Femenina de 35 años, se presenta por dolor de cabeza intenso.",
        "details": {
            "dolor": "Dolor opresivo, en banda (como si le apretara un casco), bilateral.",
            "duracion": "Lleva 3 días continuos con el dolor.",
            "intensidad": "Moderada, 6/10.",
            "acompanantes": "Sin náuseas, sin vómitos, sin fotofobia ni fonofobia.",
            "desencadenantes": "Estrés laboral y falta de sueño por entrega de proyectos.",
            "aliviantes": "Mejora parcialmente con el reposo y con paracetamol de 500mg.",
            "antecedentes": "Migraña ocasional en la adolescencia, no toma medicamentos de forma crónica."
        },
        "critical_findings": [
            "dolor opresivo/en banda",
            "bilateral",
            "sin nauseas/vomitos",
            "sin fotofobia/fonofobia",
            "desencadenante: estres/sueño"
        ]
    },
    "2": {
        "name": "Juan Pérez",
        "week": 8,
        "topic": "Disnea de Esfuerzo / Insuficiencia Cardíaca",
        "description": "Masculino de 62 años, refiere dificultad para respirar de 3 meses de evolución.",
        "details": {
            "disnea": "Dificultad para respirar al caminar dos cuadras o subir un tramo de escaleras (Clase funcional II-III NYHA).",
            "duracion": "Progresiva desde hace 3 meses.",
            "acompanantes": "Ortopnea (duerme con 2 almohadas porque si se acuesta plano siente que se ahoga), hinchazón leve en ambos tobillos (edema vespertino).",
            "desencadenantes": "Esfuerzos físicos moderados.",
            "aliviantes": "Alivia rápidamente al sentarse o detener la marcha.",
            "antecedentes": "Hipertenso de 15 años de evolución, medicado con Enalapril 20mg diario (pero lo toma de forma irregular)."
        },
        "critical_findings": [
            "disnea de esfuerzo progresiva",
            "ortopnea",
            "edema de tobillo",
            "antecedente de hipertension",
            "medicacion irregular"
        ]
    },
    "3": {
        "name": "Carlos Gómez",
        "week": 12,
        "topic": "Cólico Biliar",
        "description": "Masculino de 45 años, con dolor agudo en el abdomen.",
        "details": {
            "dolor": "Dolor tipo cólico (va y viene en oleadas) de gran intensidad en el hipocondrio derecho (cuadrante superior derecho).",
            "irradiacion": "Se irradia hacia la espalda y la escápula/hombro derecho.",
            "duracion": "Comenzó hace 4 horas.",
            "acompanantes": "Náuseas leves, un episodio de vómito alimentario, sin fiebre, sin coloración amarilla en ojos o piel (ictericia).",
            "desencadenantes": "Dolor se inició 1 hora después de cenar chicharrón y comida grasosa.",
            "aliviantes": "Ninguno, el dolor se mantiene intenso.",
            "antecedentes": "Sobrepeso leve, dislipidemia (colesterol alto)."
        },
        "critical_findings": [
            "dolor colico en hipocondrio derecho",
            "irradiacion a escapula/hombro derecho",
            "desencadenado por comida grasosa",
            "presencia de nauseas/vomitos",
            "ausencia de ictericia/fiebre"
        ]
    }
,
    "4": {
        "name": "Sofía Ramírez",
        "week": 10,
        "topic": "Neumonía Adquirida en la Comunidad",
        "description": "Femenina de 68 años, acude por tos con flema y fiebre alta.",
        "details": {
            "tos": "Tos productiva, expectoración herrumbrosa (color óxido).",
            "fiebre": "Fiebre alta, escalofríos intensos desde hace 4 días.",
            "disnea": "Siente que le falta el aire cuando tose, respiración rápida (taquipnea).",
            "dolor": "Dolor en punta de costado en el lado derecho del tórax al inspirar profundo.",
            "acompanantes": "Astenia, adinamia (debilidad generalizada) e inapetencia.",
            "desencadenantes": "Comenzó como un resfriado común hace una semana que empeoró bruscamente.",
            "antecedentes": "Diabética controlada. No fuma."
        },
        "vital_signs": {
            "Frecuencia Cardiaca": "115 lpm (taquicardia)",
            "Frecuencia Respiratoria": "26 rpm (taquipnea)",
            "Presion Arterial": "110/70 mmHg",
            "Temperatura": "39.2 °C"
        },
        "physical_exam": "A la inspección torácica: tiraje intercostal leve. A la palpación: aumento de vibraciones vocales en base derecha. A la percusión: matidez en base derecha. A la auscultación: estertores crepitantes audibles en lóbulo inferior derecho.",
        "critical_findings": [
            "tos productiva herrumbrosa",
            "fiebre alta con escalofrios",
            "dolor en punta de costado pleuritico",
            "disnea taquipnea",
            "antecedente de diabetes"
        ]
    },
    "5": {
        "name": "Roberto Fernández",
        "week": 6,
        "topic": "Hipertiroidismo / Enfermedad de Graves-Basedow",
        "description": "Masculino de 42 años, acude muy inquieto por palpitaciones, pérdida de peso y temblor.",
        "personality": "Ansioso, hiperactivo, y ligeramente irritable. Hablas un poco rápido y te desesperas si el estudiante hace pausas largas o te hace preguntas que consideras inútiles.",
        "details": {
            "motivo": "Siento que el corazón se me va a salir del pecho y estoy perdiendo mucho peso aunque como el doble.",
            "nerviosismo": "Estoy muy irritable, me peleo con todos en mi casa y no puedo dormir bien por las noches.",
            "calor": "Tengo mucho calor todo el tiempo, sudo demasiado incluso con el aire acondicionado.",
            "cuello": "He notado que el cuello se me ha puesto más grueso en la base, los cuellos de las camisas ya no me abrochan.",
            "ojos": "Mi esposa dice que tengo los ojos como 'salidos' o asustados.",
            "antecedentes": "Ninguno de importancia en mí, pero mi madre sufría de la tiroides."
        },
        "vital_signs": {
            "Frecuencia Cardiaca": "125 lpm (taquicardia de reposo)",
            "Frecuencia Respiratoria": "20 rpm",
            "Presion Arterial": "140/60 mmHg (presión divergente)",
            "Temperatura": "37.5 °C"
        },
        "physical_exam": "Inspección de cabeza y cuello: Exoftalmos bilateral evidente. Aumento de volumen difuso en la región anterior del cuello (bocio) que asciende con la deglución. A la palpación: glándula tiroides aumentada de tamaño, firme, indolora. A la auscultación: soplo tiroideo audible. Extremidades: temblor fino en las manos al extenderlas.",
        "complementary_tests": {
            "Perfil Tiroideo": "TSH suprimida (<0.01 mUI/L), T3 y T4 libre marcadamente elevadas.",
            "Hemograma": "Normal.",
            "Electrocardiograma": "Taquicardia sinusal a 125 lpm, sin signos de isquemia."
        },
        "critical_findings": [
            "palpitaciones / taquicardia",
            "perdida de peso con polifagia",
            "intolerancia al calor / sudoracion",
            "bocio / aumento de volumen en cuello",
            "exoftalmos",
            "temblor fino",
            "antecedentes familiares de tiroides"
        ]
    }
}

# ── RAG Helpers ─────────────────────────────────────────────────────────────

def get_gemini_embedding(text):
    """Retrieves embedding vector from Gemini text-embedding-004 API."""
    if not GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    data = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        }
    }
    try:
        req_body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["embedding"]["values"]
    except Exception as e:
        return None

def get_ollama_embedding(text):
    """Retrieves embedding vector from local Ollama endpoint."""
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    data = {
        "model": OLLAMA_EMBED_MODEL,
        "prompt": text
    }
    try:
        req_body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT_SECONDS) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("embedding")
    except Exception:
        return None

def get_query_embedding(text):
    """Gets query embedding using configured provider with safe fallback."""
    provider = LLM_PROVIDER
    if provider == "gemini":
        embedding = get_gemini_embedding(text)
        if embedding:
            return embedding
        return get_ollama_embedding(text)

    embedding = get_ollama_embedding(text)
    if embedding:
        return embedding
    return get_gemini_embedding(text)

def db_vector_search(query_text, limit=3):
    """Queries Supabase database table for similar chunks."""
    embedding = get_query_embedding(query_text)
    if not embedding:
        return []
    
    # Run vector similarity search using Supabase Management API query endpoint
    # (Bypasses client auth constraints using management token)
    sql = f"""
    SELECT id, chunk_text, source_book, source_chapter, source_pages, topic
    FROM public.content_chunks
    ORDER BY embedding <=> %s::vector
    LIMIT {limit};
    """
    url = f"{SUPABASE_URL}/rest/v1/rpc/match_chunks" # Recomendado usar una función RPC en Supabase
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_ANON_KEY
    }
    try:
        req_body = json.dumps({"query": sql}).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data
    except Exception as e:
        return []

# Local TF-IDF search for offline mode
def calculate_tfidf_similarity(query, chunks, limit=3):
    """Fallback text similarity calculation (TF-IDF Cosine Similarity)."""
    def tokenize(text):
        return re.findall(r'\w+', text.lower())

    query_tokens = tokenize(query)
    query_counter = Counter(query_tokens)
    
    # Calculate word document frequencies
    doc_tokens_list = [tokenize(c.get("chunk_text", "")) for c in chunks]
    doc_freqs = Counter()
    for doc_tokens in doc_tokens_list:
        unique_tokens = set(doc_tokens)
        for token in unique_tokens:
            doc_freqs[token] += 1
            
    num_docs = len(chunks)
    
    def cosine_similarity(counter1, counter2):
        intersection = set(counter1.keys()) & set(counter2.keys())
        numerator = sum(counter1[x] * counter2[x] for x in intersection)
        
        sum1 = sum(counter1[x]**2 for x in counter1.keys())
        sum2 = sum(counter2[x]**2 for x in counter2.keys())
        
        if not sum1 or not sum2:
            return 0.0
        return numerator / (math.sqrt(sum1) * math.sqrt(sum2))
        
    scored_chunks = []
    for idx, c in enumerate(chunks):
        doc_tokens = doc_tokens_list[idx]
        doc_counter = Counter(doc_tokens)
        
        # Calculate TF-IDF weight vectors
        tf_idf_query = {}
        tf_idf_doc = {}
        for token in set(query_tokens + doc_tokens):
            df = doc_freqs.get(token, 0)
            idf = math.log((1 + num_docs) / (1 + df)) + 1
            
            tf_idf_query[token] = query_counter.get(token, 0) * idf
            tf_idf_doc[token] = doc_counter.get(token, 0) * idf
            
        score = cosine_similarity(tf_idf_query, tf_idf_doc)
        scored_chunks.append((score, c))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    return [c for score, c in scored_chunks[:limit]]

def get_rag_context(query_text, local_chunks_cache=None):
    """Retrieves contextual RAG chunks using Online or Offline mode."""
    # Try online database RAG first
    results = db_vector_search(query_text)
    mode = "online_vector"
    
    if not results and local_chunks_cache:
        # Fallback to local file text RAG
        results = calculate_tfidf_similarity(query_text, local_chunks_cache)
        mode = "offline_tfidf"
        
    return results, mode

# ── LLM Chat Call ───────────────────────────────────────────────────────────

def call_gemini_api(system_prompt, conversation_history):
    """Performs HTTP request to Gemini API to get chat completion."""
    if not GEMINI_API_KEY:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    contents = []
    # Add system prompt as instructions or system instruction if supported
    # In v1beta generateContent, we can add systemInstruction to the config
    # or just prepend it to the conversation. Let's send systemInstruction in configuration.
    
    for speaker, text in conversation_history:
        role = "user" if speaker == "estudiante" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": text}]
        })
        
    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": 0.4
        }
    }
    
    try:
        req_body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None

def call_ollama_api(system_prompt, conversation_history):
    """Performs HTTP request to local Ollama server to get chat completion."""
    url = f"{OLLAMA_BASE_URL}/api/chat"

    messages = [{"role": "system", "content": system_prompt}]
    for speaker, text in conversation_history:
        role = "user" if speaker == "estudiante" else "assistant"
        messages.append({"role": role, "content": text})

    payload = {
        "model": OLLAMA_CHAT_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.4
        }
    }

    try:
        req_body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT_SECONDS) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            message = res_data.get("message", {})
            return message.get("content")
    except Exception:
        return None

def call_model_api(system_prompt, conversation_history):
    """Routes chat requests to the configured provider with graceful fallback."""
    provider = LLM_PROVIDER

    if provider == "gemini":
        reply = call_gemini_api(system_prompt, conversation_history)
        if reply:
            return reply
        reply = call_ollama_api(system_prompt, conversation_history)
        if reply:
            return reply
    else:
        reply = call_ollama_api(system_prompt, conversation_history)
        if reply:
            return reply
        reply = call_gemini_api(system_prompt, conversation_history)
        if reply:
            return reply

    return "No se pudo generar respuesta desde el proveedor LLM configurado. Verifica Ollama local y/o GEMINI_API_KEY."

# ── Database Progress Logging ───────────────────────────────────────────────

def get_or_create_default_student():
    """Finds or creates a default student in public.students table for simulation logging."""
    url = f"https://api.supabase.com/v1/projects/fnusnboleqnabqwqfucr/database/query"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # 1. Look for existing student
    find_sql = "SELECT id FROM public.students LIMIT 1;"
    try:
        req = urllib.request.Request(url, data=json.dumps({"query": find_sql}).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            if res:
                return res[0]["id"]
    except Exception:
        pass
        
    # 2. Insert default student if empty
    student_id = str(uuid.uuid4())
    insert_sql = f"""
    INSERT INTO public.students (id, full_name, email, completed_med224)
    VALUES ('{student_id}', 'Estudiante Simulación', 'estudiante.sim@uce.edu.do', true)
    ON CONFLICT DO NOTHING
    RETURNING id;
    """
    try:
        req = urllib.request.Request(url, data=json.dumps({"query": insert_sql}).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            if res:
                return res[0]["id"]
    except Exception:
        pass
        
    return student_id

def log_session_progress(student_id, score, case_name, memory_domain="executive"):
    """Saves session progress to public.student_memory_states table."""
    # We find a random chunk from database to link the memory state to
    url = f"https://api.supabase.com/v1/projects/fnusnboleqnabqwqfucr/database/query"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Find a chunk related to the topic of the case
    topic_query = "Cefalea" if "María" in case_name else ("Disnea" if "Juan" in case_name else "Biliar")
    find_chunk_sql = f"SELECT id FROM public.content_chunks WHERE topic ILIKE '%{topic_query}%' LIMIT 1;"
    chunk_id = None
    
    try:
        req = urllib.request.Request(url, data=json.dumps({"query": find_chunk_sql}).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            if res:
                chunk_id = res[0]["id"]
    except Exception:
        pass
        
    if not chunk_id:
        # Fallback: get any chunk ID
        try:
            req = urllib.request.Request(url, data=json.dumps({"query": "SELECT id FROM public.content_chunks LIMIT 1;"}).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=5) as response:
                res = json.loads(response.read().decode("utf-8"))
                if res:
                    chunk_id = res[0]["id"]
        except Exception:
            pass
            
    if not chunk_id:
        print("⚠️ No se pudo asociar a un chunk de contenido. Guardando localmente.")
        return False
    
    # Save memory state. The trigger will handle SM-2 logic (ease_factor, interval_days, next_review_at, review_count)
    sql = f"""
    INSERT INTO public.student_memory_states (
        student_id, chunk_id, memory_domain, accuracy_pct, last_reviewed_at, ease_factor, interval_days, review_count
    ) VALUES (
        '{student_id}', '{chunk_id}', '{memory_domain}'::memory_domain, {score}, NOW(), 2.5, 0, 0
    ) ON CONFLICT (student_id, chunk_id, memory_domain) DO UPDATE SET
        accuracy_pct = EXCLUDED.accuracy_pct,
        last_reviewed_at = NOW();
    """
    try:
        req = urllib.request.Request(url, data=json.dumps({"query": sql}).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            return True
    except Exception as e:
        print(f"⚠️ Error guardando en base de datos: {e}")
        return False

# ── Simulation Engine ───────────────────────────────────────────────────────

def generate_patient_system_prompt(case_data, ease_factor, rag_chunks):
    """Builds system instructions for the LLM simulating the patient."""
    case_details = case_data["details"]
    personality = case_data.get("personality", "Eres un paciente colaborador, respondes con naturalidad a las preguntas.")
    
    # Format RAG context
    rag_context = ""
    if rag_chunks:
        rag_context = "\nCONTEXTO MÉDICO DE SOPORTE (Bibliografía oficial UCE):\n"
        for idx, chunk in enumerate(rag_chunks):
            rag_context += f"[{idx+1}] Libro: {chunk.get('source_book', 'N/A')}, Cap: {chunk.get('source_chapter', 'N/A')}\n"
            rag_context += f"Contenido: {chunk.get('chunk_text', '')}\n\n"
            
    # Dialogue adaptation instructions based on ease_factor
    if ease_factor >= 2.5:
        adaptation = (
            "- Sé concisa y reservada. No des detalles a menos que te pregunten directamente.\n"
            "- Describe tus síntomas de forma vaga (ej. 'me duele la cabeza', 'siento que me ahogo') y obliga al estudiante a hacer preguntas específicas sobre la localización, duración, desencadenantes, etc.\n"
            "- No menciones antecedentes médicos o factores que alivian tu dolor a menos que te pregunten explícitamente sobre tus antecedentes o tratamientos.\n"
        )
    else:
        adaptation = (
            "- Sé cooperadora y explícita. Si te preguntan algo general, ofrece detalles relacionados de forma voluntaria.\n"
            "- Describe tus síntomas de forma clara y ayuda al estudiante aportando factores desencadenantes o acompañantes sin que te lo insistan tanto.\n"
            "- Ofrece descripciones ricas de cómo te sientes.\n"
        )
        
    # Include physical exam and vital signs if available
    clinical_data_instructions = ""
    if "vital_signs" in case_data or "physical_exam" in case_data:
        vital_signs = json.dumps(case_data.get("vital_signs", {}), ensure_ascii=False)
        physical_exam = case_data.get("physical_exam", "Sin hallazgos relevantes.")
        clinical_data_instructions = f"""
DATOS CLÍNICOS RESERVADOS (SOLO PARA EL EXAMEN FÍSICO):
Signos Vitales: {vital_signs}
Examen Físico: {physical_exam}

REGLA ESPECIAL PARA EXAMEN FÍSICO: Si el estudiante indica expresamente que va a tomarte los signos vitales, examinarte, auscultarte, palparte, etc., DEBES salir de tu personaje de paciente por un momento y actuar como el "Narrador del Sistema Clínico", entregándole los hallazgos físicos o vitales solicitados en base a tus DATOS CLÍNICOS RESERVADOS. Luego, vuelve a tu personaje.
"""

    complementary_tests_instructions = ""
    if "complementary_tests" in case_data:
        labs = json.dumps(case_data.get("complementary_tests", {}), ensure_ascii=False)
        complementary_tests_instructions = f"""
EXÁMENES COMPLEMENTARIOS RESERVADOS:
{labs}

REGLA ESPECIAL PARA LABORATORIOS: Si el estudiante indica expresamente que va a prescribir u ordenar exámenes de laboratorio o de imagen (ej. "indicaré un hemograma", "vamos a hacer un perfil tiroideo"), DEBES salir de tu personaje y actuar como el "Narrador del Sistema Clínico", entregando los resultados de los EXÁMENES COMPLEMENTARIOS RESERVADOS que correspondan a lo que pidió.
"""

    prompt = f"""
Tu rol y persona:
Eres el paciente virtual {case_data['name']}. Estás en la consulta de Propedéutica Clínica y Semiología Médica (MED-228) de la UCE, siendo interrogado por un estudiante de medicina.

DATOS DE TU CASO:
Nombre del paciente: {case_data['name']}
Tema Clínico Secreto: {case_data['topic']}
Descripción del caso: {case_data['description']}
Perfil Psicológico / Personalidad: {personality}
Detalles de tus respuestas según lo que te pregunten:
{json.dumps(case_details, indent=2, ensure_ascii=False)}

REGLAS DE ADAPTACIÓN (ease_factor del estudiante = {ease_factor}):
{adaptation}

{clinical_data_instructions}
{complementary_tests_instructions}

REGLAS GENERALES:
1. Responde SIEMPRE en español, en primera persona, manteniendo el personaje en todo momento.
2. Eres un paciente lego: NO uses terminología médica avanzada (no digas 'ortopnea', di 'necesito almohadas para respirar'; no digas 'cefalea opresiva en banda', di 'es como si me apretara un casco a ambos lados de la cabeza').
3. Si el estudiante te hace preguntas irrelevantes o agresivas, responde con timidez o extrañeza.
4. Responde de forma breve y realista (máximo 3-4 frases por intervención) para mantener un diálogo dinámico.
5. El estudiante debe seguir los protocolos de la anamnesis (ej. preguntar detalles del dolor, antecedentes, etc.). Si es desordenado, puedes mostrar confusión.

{rag_context}
"""
    return prompt

def run_feedback_report(case_data, conversation_history):
    """Uses LLM to evaluate the conversation and output a clinical review report."""
    print("\n" + "═"*60)
    print("⏳ EVALUANDO TU DESEMPEÑO CLÍNICO (Procesando con LLM)...")
    print("═"*60)
    
    dialogue_text = ""
    for speaker, text in conversation_history:
        dialogue_text += f"{speaker.upper()}: {text}\n"
        
    prompt = f"""
Analiza la siguiente transcripción de una entrevista clínica socrática realizada por un estudiante de medicina a un paciente virtual.

DATOS DEL CASO:
Nombre del Paciente: {case_data['name']}
Caso Clínico: {case_data['topic']}
Hallazgos críticos que el estudiante DEBÍA preguntar/identificar:
{json.dumps(case_data['critical_findings'], indent=2, ensure_ascii=False)}

ATENCIÓN: La evaluación debe regirse ESTRICTAMENTE por los protocolos de la Universidad Central del Este (UCE) y sus libros oficiales, prioritariamente "Propedéutica Clínica y Semiología Médica - Tomo I y II" de Raimundo Llanio Navarro, así como Argente-Álvarez o Bates. El estudiante debe seguir el método clínico ortodoxo en su interrogatorio.

TRANSCRIPCIÓN DEL INTERROGATORIO:
{dialogue_text}

Tu tarea es evaluar al estudiante y devolver un reporte detallado en español.
El formato del reporte debe ser exactamente el siguiente en texto plano Markdown:

# Reporte de Evaluación: Simulación Paciente Virtual
**Paciente:** {case_data['name']}
**Caso Clínico:** {case_data['topic']}
**Fecha:** {datetime.date.today().isoformat()}

## 📊 Calificación
**Puntaje:** [Puntaje de 0 a 100] / 100

## 🏆 Competencias Evaluadas
*   **CG2 (Comunicación Efectiva):** [Excelente / Aceptable / Requiere Mejora] - Breve justificación.
*   **CG6 (Historia Clínica Integral):** [Excelente / Aceptable / Requiere Mejora] - Breve justificación.
*   **CG8 (Procedimiento Diagnóstico):** [Excelente / Aceptable / Requiere Mejora] - Breve justificación.

## 🎯 Hallazgos Críticos Identificados
[Lista de hallazgos que el estudiante sí logró extraer en el interrogatorio]

## ⚠️ Puntos Omitidos
[Lista de hallazgos críticos u orientaciones diagnósticas importantes que el estudiante no preguntó o ignoró]

## 💡 Retroalimentación del Catedrático (Espejo Clínico)
[Retroalimentación rigurosa como docente de la UCE. Señala si el estudiante respetó el orden del método clínico (anamnesis próxima y remota). Cita de forma explícita los protocolos y pasajes de los libros base: "Llanio Navarro Tomos I o II", "Argente-Álvarez" o "Bates", para corregir sus errores o fundamentar sus aciertos.]
"""
    
    score = 50 # Default score if API call fails
    report = "Error al conectar con la API de Evaluación. Generando reporte local simple."
    
    try:
        llm_report = call_model_api(
            "Eres el Catedrático Titular de Propedéutica Clínica de la UCE. Evalúas las entrevistas clínicas estrictamente según el método clínico y los protocolos de los libros oficiales (Llanio Navarro, Argente-Álvarez). Tus criterios de evaluación institucional son CG2, CG6 y CG8.",
            [("estudiante", prompt)]
        )
        if llm_report:
            report = llm_report
            
            # Extract score from report text
            score_match = re.search(r'\*\*Puntaje:\*\*\s*(\d+)', report)
            if score_match:
                score = int(score_match.group(1))
    except Exception as e:
        # Simple local analysis
        found = []
        missing = []
        dialogue_lower = dialogue_text.lower()
        for f in case_data['critical_findings']:
            words = f.replace('/', ' ').split()
            if any(w in dialogue_lower for w in words):
                found.append(f)
            else:
                missing.append(f)
                
        score = int((len(found) / len(case_data['critical_findings'])) * 100)
        report = f"""# Reporte de Evaluación (Offline/Mock)
**Paciente:** {case_data['name']}
**Caso Clínico:** {case_data['topic']}
**Fecha:** {datetime.date.today().isoformat()}

## 📊 Calificación
**Puntaje:** {score} / 100

## 🏆 Competencias Evaluadas
*   **CG2:** Aceptable - Comunicación directa en la entrevista.
*   **CG6:** {"Excelente" if score > 80 else "Requiere Mejora"} - Cobertura de hallazgos críticos.
*   **CG8:** {"Excelente" if score > 80 else "Requiere Mejora"} - Orientación diagnóstica basada en interrogatorio.

## 🎯 Hallazgos Críticos Identificados
{chr(10).join(f'* {x}' for x in found) if found else '* Ninguno'}

## ⚠️ Puntos Omitidos
{chr(10).join(f'* {x}' for x in missing) if missing else '* Ninguno'}

## 💡 Retroalimentación (Modo Desconectado)
Recuerde estructurar su interrogatorio siguiendo los protocolos de la escuela clínica de la UCE. Use la caracterización del dolor y explore a fondo los antecedentes según la semiología descrita en el **Tomo I de Llanio Navarro** y *Argente-Álvarez*.
"""
    
    print(report)
    return score, report

def load_local_chunks_cache():
    """Loads approved chunks from local approved_chunks.json to serve as RAG fallback."""
    approved_path = BASE_DIR / "review" / "approved_chunks.json"
    if approved_path.exists():
        try:
            print("📦 Cargando base de datos RAG local (fallback offline)...")
            with open(approved_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def start_simulation():
    """Interactive CLI menu loop for virtual patient simulation."""
    print("═"*60)
    print("🏥  UCE MED-228: SIMULADOR DE PACIENTE VIRTUAL (FASE 3)")
    print("    Cátedra de Propedéutica Clínica y Semiología Médica")
    print("═"*60)
    
    print(f"🧠 Proveedor LLM activo: {LLM_PROVIDER}")
    if LLM_PROVIDER == "ollama":
        print(f"   Endpoint: {OLLAMA_BASE_URL} | Modelo chat: {OLLAMA_CHAT_MODEL} | Modelo embedding: {OLLAMA_EMBED_MODEL}")
    elif LLM_PROVIDER == "gemini" and not GEMINI_API_KEY:
        print("⚠️ Advertencia: GEMINI_API_KEY no se encontró. Intentando fallback local con Ollama.")
        
    print("\nSelecciona un caso clínico para iniciar el interrogatorio:")
    print("1. María Rodríguez (Semana 5: Cefalea)")
    print("2. Juan Pérez      (Semana 8: Disnea)")
    print("3. Carlos Gómez    (Semana 12: Dolor abdominal / Cólico biliar)")
    print("4. Sofía Ramírez   (Semana 10: Respiratorio / Neumonía)")
    print("5. Roberto Fdz.    (Semana 6: 1er Parcial / Hipertiroidismo - Perfil Ansioso)")
    
    choice = input("\nElige una opción (1-5): ").strip()
    if choice not in CASES:
        print("Opción inválida. Saliendo...")
        return
        
    case_data = CASES[choice]
    
    # Load student parameters
    ease_factor = 2.5
    ef_input = input("Calibrar dificultad del estudiante (Ease Factor de 1.3 a 5.0, Enter para default 2.5): ").strip()
    if ef_input:
        try:
            ease_factor = float(ef_input)
            ease_factor = max(1.3, min(5.0, ease_factor))
        except ValueError:
            pass
            
    print(f"\nIniciando caso con {case_data['name']} (Dificultad: EF {ease_factor})...")
    print("El paciente está en la consulta. Salúdalo e interrógalo sobre sus síntomas.")
    print("Escribe 'salir' o 'terminar' para finalizar la entrevista y recibir tu calificación.\n")
    
    # Load offline RAG chunks
    local_chunks = load_local_chunks_cache()
    
    conversation_history = []
    
    # Initial patient greet
    initial_greet = f"Buenas tardes doctor(a), mi nombre es {case_data['name']}. Vengo a consulta porque {case_data['description'].lower()}"
    print(f"\n{case_data['name'].upper()}: {initial_greet}")
    conversation_history.append(("paciente", initial_greet))
    
    while True:
        try:
            user_input = input("\nESTUDIANTE: ").strip()
        except (KeyboardInterrupt, EOFError):
            break
            
        if not user_input:
            continue
            
        if user_input.lower() in ["salir", "terminar", "fin", "evaluar"]:
            break
            
        # 1. RAG Retrieve: search database/file for relevant context
        print("🔍 [RAG] Buscando conceptos en la biblioteca médica...")
        rag_chunks, rag_mode = get_rag_context(user_input, local_chunks)
        print(f"   Contexto recuperado en modo '{rag_mode}' ({len(rag_chunks)} fragmentos).")
        
        # 2. Build system instructions and append context
        sys_prompt = generate_patient_system_prompt(case_data, ease_factor, rag_chunks)
        
        # 3. Add user input to history
        conversation_history.append(("estudiante", user_input))
        
        # 4. Generate response
        print("💬 [AI] Generando respuesta del paciente...")
        patient_response = call_model_api(sys_prompt, conversation_history)
        
        print(f"\n{case_data['name'].upper()}: {patient_response}")
        conversation_history.append(("paciente", patient_response))
        
    # Run evaluation
    score, report_text = run_feedback_report(case_data, conversation_history)
    
    # Log to DB
    print("\n💾 Guardando resultados de la sesión...")
    student_id = get_or_create_default_student()
    logged = log_session_progress(student_id, score, case_data['name'])
    if logged:
        print("✅ Simulación guardada correctamente en la base de datos de Supabase!")
    else:
        # Save to local file as offline backup
        backup_path = BASE_DIR / "review" / "simulation_progress.json"
        existing = []
        if backup_path.exists():
            try:
                with open(backup_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except Exception:
                pass
        existing.append({
            "case": case_data["name"],
            "score": score,
            "date": datetime.datetime.now().isoformat(),
            "dialogue_length": len(conversation_history)
        })
        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
        print(f"⚠️ Modo Desconectado: Progreso de simulación guardado localmente en {backup_path.name}")

if __name__ == "__main__":
    start_simulation()
