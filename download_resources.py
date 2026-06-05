import os
import urllib.request
import sys

def download_file(url, filename):
    print(f"Descargando {filename} desde {url}...")
    try:
        # User-Agent para evitar bloqueos
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(filename, 'wb') as out_file:
                # Descargar en bloques para mostrar progreso
                meta = response.info()
                file_size = int(meta.get("Content-Length", 0))
                print(f"Tamaño del archivo: {file_size / (1024*1024):.2f} MB")
                
                downloaded = 0
                block_size = 8192
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    downloaded += len(buffer)
                    out_file.write(buffer)
                    if file_size:
                        percent = downloaded * 100 / file_size
                        sys.stdout.write(f"\rProgreso: {percent:.2f}% ({downloaded / (1024*1024):.2f} MB / {file_size / (1024*1024):.2f} MB)")
                        sys.stdout.flush()
                print("\nDescarga completada con éxito.")
    except Exception as e:
        print(f"\nError al descargar {filename}: {e}")

def generate_syllabus():
    print("Generando el programa de la materia (programa_clase_MED228.md)...")
    syllabus_content = """# 📋 PROGRAMA DE LA ASIGNATURA: Propedéutica Clínica y Semiología Médica (MED-228)
**Código del Curso:** MED-228-T-1  
**Dirigido a:** Estudiantes de Medicina (Tercer Año / Ciclo Clínico)  
**Libro de Texto Base:** Propedéutica Clínica y Semiología Médica - Tomo I y II (Llanio Navarro)

---

## 🎯 OBJETIVOS DE LA ASIGNATURA
1. Dominar el método clínico para realizar un diagnóstico sindrómico correcto.
2. Desarrollar destreza en la anamnesis o interrogatorio y la relación médico-paciente.
3. Dominar los cuatro pilares del examen físico: inspección, palpación, percusión y auscultación.
4. Redactar de forma ordenada e integrada la Historia Clínica del paciente.
5. Interpretar la semiología de los principales síntomas, signos y síndromes por sistemas.

---

## 📅 CONTENIDO PROGRAMÁTICO POR SEMANAS

### 🧱 MÓDULO I: Introducción al Método Clínico e Historia Clínica
*   **Semana 1:**
    *   *Tema:* Concepto de Semiología, Propedéutica y Método Clínico. Ética médica y relación médico-paciente.
    *   *Estudio en Texto:* Tomo I, Capítulos 1 - 3.
*   **Semana 2:**
    *   *Tema:* La Anamnesis (Interrogatorio). Datos de filiación, motivo de consulta, historia de la enfermedad actual (HEA), antecedentes personales y familiares.
    *   *Estudio en Texto:* Tomo I, Capítulos 4 - 6.

### 🔍 MÓDULO II: Examen Físico General y Regional
*   **Semana 3:**
    *   *Tema:* Examen físico general: Biotipo constitucional, marcha, actitud en el lecho, facies. Examen de piel, mucosas, faneras (uñas y pelo) y tejido celular subcutáneo (edemas).
    *   *Estudio en Texto:* Tomo I, Capítulos 7 - 12.
*   **Semana 4:**
    *   *Tema:* Constantes vitales (temperatura, pulso arterial, respiración, presión arterial). Examen físico regional (cabeza, cuello, tórax, abdomen y extremidades en general).
    *   *Estudio en Texto:* Tomo I, Capítulos 13 - 15.

### 🫀 MÓDULO III: Semiología y Propedéutica del Sistema Cardiovascular
*   **Semana 5:**
    *   *Tema:* Interrogatorio del aparato cardiovascular: dolor torácico (isquémico vs. pleurítico vs. pericardítico), disnea (escala NYHA, ortopnea, DPN), palpitaciones, síncope y claudicación intermitente.
    *   *Estudio en Texto:* Tomo I, Capítulos 18 - 20.
*   **Semana 6:**
    *   *Tema:* Examen físico cardiovascular I: Inspección y palpación del área precordial (choque de la punta). Examen del pulso arterial (amplitud, frecuencia, ritmo) y del pulso venoso yugular (ingurgitación yugular y reflujo hepatojugular).
    *   *Estudio en Texto:* Tomo I, Capítulos 21 - 22.
*   **Semana 7:**
    *   *Tema:* Examen físico cardiovascular II: Auscultación cardíaca. Focos clásicos. Ruidos cardíacos fundamentales (R1, R2, desdoblamientos). Ruidos agregados (R3, R4, clics, chasquidos). Soplos cardíacos (clasificación de Levine, sístole y diástole).
    *   *Estudio en Texto:* Tomo I, Capítulo 23.

### 🫁 MÓDULO IV: Semiología y Propedéutica del Sistema Respiratorio
*   **Semana 8:**
    *   *Tema:* Sintomatología respiratoria: tos, expectoración (esputo), hemoptisis, disnea respiratoria, dolor torácico no cardíaco.
    *   *Estudio en Texto:* Tomo I, Capítulos 25 - 26.
*   **Semana 9:**
    *   *Tema:* Examen físico respiratorio: Inspección estática y dinámica. Palpación (expansibilidad torácica y vibraciones vocales). Percusión (sonoridad, matidez, timpanismo).
    *   *Estudio en Texto:* Tomo I, Capítulos 27 - 28.
*   **Semana 10:**
    *   *Tema:* Auscultación pulmonar: Ruidos respiratorios normales (murmullo vesicular, soplo laringotraqueal). Ruidos adventicios o agregados (estertores secos: sibilantes y roncus; estertores húmedos: crepitantes, subcrepitantes; frote pleural). Síndromes pleuropulmonares (condensación, atelectasia, derrame pleural, neumotórax).
    *   *Estudio en Texto:* Tomo I, Capítulos 29 - 31.

### 🍏 MÓDULO V: Semiología y Propedéutica del Aparato Digestivo y Renal
*   **Semana 11:**
    *   *Tema:* Sintomatología digestiva: dolor abdominal, disfagia, náuseas, vómitos, hematemesis, melena, diarrea, constipación e ictericia.
    *   *Estudio en Texto:* Tomo II, Capítulos 34 - 36.
*   **Semana 12:**
    *   *Tema:* Examen físico del abdomen: División topográfica (9 regiones). Inspección, auscultación de ruidos hidroaéreos, percusión general y palpación superficial y profunda. Maniobras de palpación de hígado y bazo. Puntos dolorosos abdominales.
    *   *Estudio en Texto:* Tomo II, Capítulos 37 - 40.
*   **Semana 13:**
    *   *Tema:* Semiología del aparato renal: dolor renal, alteraciones de la micción (disuria, poliuria, oliguria, hematuria). Maniobras de palpación renal (Guyon, peloteo). Puntos renoureterales.
    *   *Estudio en Texto:* Tomo II, Capítulos 43 - 45.

### 🧠 MÓDULO VI: Semiología Neurológica
*   **Semana 14:**
    *   *Tema:* Examen neurológico I: Nivel de conciencia (Escala de coma de Glasgow). Examen de las funciones mentales superiores. Examen de los 12 pares craneales.
    *   *Estudio en Texto:* Tomo II, Capítulos 48 - 50.
*   **Semana 15:**
    *   *Tema:* Examen neurológico II: Examen del sistema motor (fuerza, tono muscular, trofismo). Reflejos osteotendinosos y cutáneos (Babinski). Examen del sistema sensitivo. Coordinación y marcha. Signos de irritación meníngea.
    *   *Estudio en Texto:* Tomo II, Capítulos 51 - 54.

---

## 📝 EVALUACIÓN DE LA ASIGNATURA
*   **Evaluación Práctica Semanal:** 30% (Desempeño en sala clínica y simulación de maniobras).
*   **Examen Parcial de Técnicas Clínicas:** 20% (Evaluación en vivo de interrogatorio y examen físico).
*   **Portafolio de Historias Clínicas:** 20% (Redacción y análisis de casos asignados).
*   **Examen Final Teórico-Práctico (Tipo USMLE/Caso Clínico):** 30%.
"""
    with open("programa_clase_MED228.md", "w", encoding="utf-8") as f:
        f.write(syllabus_content.strip())
    print("Syllabus 'programa_clase_MED228.md' generado con éxito.")

def main():
    print("--- INICIANDO DESCARGA DE RECURSOS PARA NOTEBOOKLM ---")
    
    # URLs de los tomos de Llanio
    url_tomo_i = "https://joseluisvitte.wordpress.com/wp-content/uploads/2019/07/propedeutica-clinica-y-semiologia-medica-tomo-i.pdf"
    url_tomo_ii = "https://joseluisvitte.wordpress.com/wp-content/uploads/2019/07/propedeutica-clinica-y-semiologia-medica-tomo-ii.pdf"
    
    # Descargar Tomo I
    download_file(url_tomo_i, "Llanio_Tomo_I_Semiologia.pdf")
    print("-" * 50)
    
    # Descargar Tomo II
    download_file(url_tomo_ii, "Llanio_Tomo_II_Semiologia.pdf")
    print("-" * 50)
    
    # Generar el Syllabus
    generate_syllabus()
    
    print("\n--- PROCESO TERMINADO ---")
    print("Ahora tienes en tu carpeta:")
    print("1. Llanio_Tomo_I_Semiologia.pdf (Libro de Texto Tomo I)")
    print("2. Llanio_Tomo_II_Semiologia.pdf (Libro de Texto Tomo II)")
    print("3. programa_clase_MED228.md (Programa Académico de la clase)")
    print("\nSube estos 3 archivos a NotebookLM para crear el asistente definitivo de tu clase.")

if __name__ == "__main__":
    main()
