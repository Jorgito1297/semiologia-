#!/usr/bin/env python3
"""
Generador de Repasos de Semiología Médica (MVP Local)
Curso: Propedéutica Clínica y Semiología Médica (MED-228-T-1)
Autor: AI Architect & Integration Engineer
Fecha: Junio 2026
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error
import time

# Configuración por defecto
DEFAULT_INPUT = os.path.join("public", "notas_clase.txt")
DEFAULT_HTML_OUTPUT = os.path.join("public", "repaso.html")
DEFAULT_MD_OUTPUT = os.path.join("public", "repaso.md")

# Plantillas de datos por defecto para el modo Mock/Offline
MOCK_MARKDOWN = """# 🫀 REPASO DE CLASE: Semiología Cardiovascular
**Curso:** Propedéutica Clínica y Semiología Médica (MED-228-T-1)  
**Fecha de la sesión:** 3 de junio de 2026  

---

## 📌 1. Caracterización del Dolor Torácico (Diagnóstico Diferencial)

| Tipo de Dolor | Características Principales | Localización e Irradiación | Factores Modificadores |
| :--- | :--- | :--- | :--- |
| **Coronario (Anginoso)** | Opresivo ("peso en el pecho"). Dura <20 min (angina) o >20 min (Infarto). | Retroesternal. Irradia a brazo izquierdo, mandíbula o cuello. | Aumenta con esfuerzo/estrés. Cede con reposo o nitratos en 2-5 min. |
| **Pleurítico** | Punzante ("punzada de costado"). | Costados del tórax. | Aumenta con inspiración profunda/tos. Alivia en decúbito lateral sobre lado afectado. |
| **Pericardítico** | Opresivo o punzante. | Retroesternal o precordial. | **Alivia al inclinarse hacia adelante** (plegaria mahometana). Empeora en decúbito supino. |
| **Disección Aórtica** | Lancinante, desgarrador, de inicio súbito y máxima intensidad inmediata. | Cara anterior del tórax. Irradia a zona interescapular (espalda). | Asociado a asimetría de pulsos e hipertensión severa. |

---

## 🫁 2. Clasificación de Disnea (NYHA)

La disnea cardíaca se clasifica según la severidad del esfuerzo que la desencadena en la escala **NYHA**:
*   **Clase I:** Sin limitación. La actividad física ordinaria no causa disnea.
*   **Clase II:** Limitación ligera. Cómodo en reposo. La actividad ordinaria (caminar varias cuadras, subir escaleras rápido) causa disnea.
*   **Clase III:** Limitación marcada. Cómodo en reposo. Actividades menores a las ordinarias (vestirse, bañarse, caminar una cuadra) desencadenan disnea.
*   **Clase IV:** Incapacidad de realizar actividad física sin síntomas. **Disnea en reposo absoluto**.

> 💡 **Concepto Semiológico Clave:** 
> *   **Ortopnea:** Disnea en decúbito supino. Se produce por la redistribución del volumen sanguíneo de las extremidades inferiores al tórax. Típica de insuficiencia cardíaca izquierda.
> *   **Disnea Paroxística Nocturna (DPN):** Crisis súbita de ahogo que despierta al paciente 1-2 horas después de dormirse, obligándolo a sentarse.

---

## 🎧 3. Focos de Auscultación y Ruidos Cardíacos

### Focos Clásicos
1.  **Foco Aórtico:** 2° espacio intercostal derecho, línea paraesternal derecha.
2.  **Foco Pulmonar:** 2° espacio intercostal izquierdo, línea paraesternal izquierda.
3.  **Foco Tricúspide:** 4° o 5° espacio intercostal izquierdo, línea paraesternal izquierda.
4.  **Foco Mitral (Apexiano):** 5° espacio intercostal izquierdo, línea medioclavicular.

### Ruidos Cardíacos (R1 - R4)
*   **R1 (Primer Ruido):** Cierre de válvulas mitral y tricúspide. Coincide con el inicio de la sístole y el pulso carotídeo. Tono grave.
*   **R2 (Segundo Ruido):** Cierre de válvulas aórtica y pulmonar. Inicio de la diástole. Tono agudo.
*   **R3 (Tercer Ruido):** Llenado diastólico rápido pasivo. *Normal en niños/embarazadas*. En mayores de 40 años indica **disfunción sistólica (insuficiencia cardíaca)**. Ritmo de galope ventricular.
*   **R4 (Cuarto Ruido):** Contracción auricular contra un ventrículo rígido (hipertrofia por HTA o estenosis aórtica). *Nunca ocurre en fibrilación auricular*. Ritmo de galope auricular.

---

## 🙋‍♂️ 4. Tarjetas de Memoria Rápidas (Active Recall)

<details>
<summary><b>🔍 ¿Cuál es la diferencia de posición entre el dolor pericardítico y el pleurítico?</b></summary>
El dolor pericardítico alivia característicamente al inclinarse hacia adelante (posición genupectoral) y empeora en decúbito supino. El dolor pleurítico disminuye cuando el paciente se acuesta sobre el lado afectado (decúbito lateral del lado de la pleura inflamada) para limitar su excursión respiratoria.
</details>

<details>
<summary><b>🔍 ¿Por qué el R4 no se puede auscultar en un paciente con Fibrilación Auricular (FA)?</b></summary>
Porque el R4 es producido por la vibración que causa la contracción auricular forzada en la fase de llenado activo. En la fibrilación auricular no hay una contracción auricular coordinada (sino una desorganizada actividad eléctrica sin contracción mecánica efectiva), lo que hace físicamente imposible generar un cuarto ruido.
</details>

<details>
<summary><b>🔍 ¿Cómo se realiza y qué evalúa el Reflujo Hepatojugular (RHJ)?</b></summary>
Se presiona firmemente el cuadrante superior derecho del abdomen (hígado) durante 10-15 segundos mientras el paciente respira normalmente en decúbito dorsal a 45 grados. Es positivo si la ingurgitación de las venas yugulares del cuello aumenta y persiste más de 3 cm. Evalúa la capacidad del ventrículo derecho para adaptarse a un aumento repentino del retorno venoso.
</details>

---

## 📅 Recordatorio Semanal:
*   **Próximo Miércoles:** Examen parcial práctico de técnicas de examen de pulso arterial y venoso yugular. ¡Estudien!
"""

MOCK_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repaso Interactivo: Semiología Cardiovascular (MED-228-T-1)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .flashcard-inner {
            transition: transform 0.6s;
            transform-style: preserve-3d;
        }
        .flashcard-flipped .flashcard-inner {
            transform: rotateY(180deg);
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .rotate-y-180 {
            transform: rotateY(180deg);
        }
    </style>
</head>
<body class="bg-gray-50 font-sans text-gray-800 pb-16">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Encabezado -->
        <header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md mb-8">
            <p class="text-sm font-semibold tracking-wider uppercase text-blue-100">PROPE DÉUTICA CLÍNICA Y SEMIOLOGÍA MÉDICA (MED-228-T-1)</p>
            <h1 class="text-3xl font-bold mt-1">Estudio Interactivo: Semiología Cardiovascular</h1>
            <p class="text-xs text-blue-200 mt-2">Basado en la sesión del miércoles, 3 de junio de 2026. Diseñado para Active Recall y Autoevaluación.</p>
        </header>

        <!-- Tarjetas de Flashcards (Active Recall) -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>🎴</span> Tarjetas de Repaso (Haz clic para voltear)
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Tarjeta 1 -->
                <div class="h-48 cursor-pointer group" onclick="toggleCard(this)">
                    <div class="flashcard-inner relative w-full h-full text-center rounded-xl shadow-md bg-white border border-gray-100">
                        <div class="backface-hidden absolute w-full h-full flex flex-col justify-center items-center p-6">
                            <span class="text-blue-500 font-bold mb-2">DOLOR TORÁCICO</span>
                            <p class="font-medium text-gray-700 text-sm">¿Cómo se comporta el dolor de la pericarditis aguda según la posición corporal del paciente?</p>
                            <span class="text-xs text-gray-400 mt-4 group-hover:text-blue-500">Hacer clic para ver respuesta</span>
                        </div>
                        <div class="backface-hidden rotate-y-180 absolute w-full h-full flex flex-col justify-center items-center p-6 bg-blue-50 text-blue-900 rounded-xl">
                            <p class="font-semibold text-xs uppercase text-blue-600 mb-1">Respuesta</p>
                            <p class="text-sm">Alivia al **inclinarse hacia adelante** (posición genupectoral o plegaria mahometana) y **empeora al acostarse boca arriba** (decúbito supino).</p>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta 2 -->
                <div class="h-48 cursor-pointer group" onclick="toggleCard(this)">
                    <div class="flashcard-inner relative w-full h-full text-center rounded-xl shadow-md bg-white border border-gray-100">
                        <div class="backface-hidden absolute w-full h-full flex flex-col justify-center items-center p-6">
                            <span class="text-blue-500 font-bold mb-2">CLASIFICACIÓN DE DISNEA</span>
                            <p class="font-medium text-gray-700 text-sm">Un paciente con disnea al bañarse o vestirse, ¿qué clase funcional de la NYHA representa?</p>
                            <span class="text-xs text-gray-400 mt-4 group-hover:text-blue-500">Hacer clic para ver respuesta</span>
                        </div>
                        <div class="backface-hidden rotate-y-180 absolute w-full h-full flex flex-col justify-center items-center p-6 bg-blue-50 text-blue-900 rounded-xl">
                            <p class="font-semibold text-xs uppercase text-blue-600 mb-1">Respuesta</p>
                            <p class="text-sm">Pertenece a la **NYHA Clase III** (limitación marcada de la actividad física, cómodo en reposo pero disnea con esfuerzos menores a la actividad ordinaria).</p>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta 3 -->
                <div class="h-48 cursor-pointer group" onclick="toggleCard(this)">
                    <div class="flashcard-inner relative w-full h-full text-center rounded-xl shadow-md bg-white border border-gray-100">
                        <div class="backface-hidden absolute w-full h-full flex flex-col justify-center items-center p-6">
                            <span class="text-blue-500 font-bold mb-2">RUIDOS CARDÍACOS</span>
                            <p class="font-medium text-gray-700 text-sm">¿Cuál es el significado clínico de auscultar un R3 en un paciente mayor de 40 años?</p>
                            <span class="text-xs text-gray-400 mt-4 group-hover:text-blue-500">Hacer clic para ver respuesta</span>
                        </div>
                        <div class="backface-hidden rotate-y-180 absolute w-full h-full flex flex-col justify-center items-center p-6 bg-blue-50 text-blue-900 rounded-xl">
                            <p class="font-semibold text-xs uppercase text-blue-600 mb-1">Respuesta</p>
                            <p class="text-sm">Indica **disfunción sistólica ventricular (insuficiencia cardíaca)** o sobrecarga de volumen diastólico. Genera el "ritmo de galope ventricular".</p>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta 4 -->
                <div class="h-48 cursor-pointer group" onclick="toggleCard(this)">
                    <div class="flashcard-inner relative w-full h-full text-center rounded-xl shadow-md bg-white border border-gray-100">
                        <div class="backface-hidden absolute w-full h-full flex flex-col justify-center items-center p-6">
                            <span class="text-blue-500 font-bold mb-2">EXAMEN FÍSICO CARDIOVASCULAR</span>
                            <p class="font-medium text-gray-700 text-sm">¿Por qué el reflujo hepatojugular (RHJ) es indicativo de falla ventricular derecha?</p>
                            <span class="text-xs text-gray-400 mt-4 group-hover:text-blue-500">Hacer clic para ver respuesta</span>
                        </div>
                        <div class="backface-hidden rotate-y-180 absolute w-full h-full flex flex-col justify-center items-center p-6 bg-blue-50 text-blue-900 rounded-xl">
                            <p class="font-semibold text-xs uppercase text-blue-600 mb-1">Respuesta</p>
                            <p class="text-sm">Porque al comprimir el hígado aumenta el retorno venoso a la cava inferior y aurícula derecha. Si el VD tiene falla y no puede bombear este exceso, se congestiona y se eleva la presión yugular en el cuello.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quiz de Autoevaluación -->
        <section class="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📝</span> Cuestionario de Autoevaluación (Self-Grading)
            </h2>
            <form id="quizForm" onsubmit="event.preventDefault(); gradeQuiz();">
                <!-- Pregunta 1 -->
                <div class="mb-6 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-gray-800 mb-3">1. Paciente varón de 68 años con disnea al caminar plano media cuadra. Cómodo en reposo absoluto. ¿Clase NYHA?</p>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q1" value="A" class="form-radio text-blue-600">
                            <span>NYHA Clase I</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q1" value="B" class="form-radio text-blue-600">
                            <span>NYHA Clase II</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q1" value="C" class="form-radio text-blue-600">
                            <span>NYHA Clase III</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q1" value="D" class="form-radio text-blue-600">
                            <span>NYHA Clase IV</span>
                        </label>
                    </div>
                    <p id="feedback-q1" class="hidden text-sm mt-2 font-medium"></p>
                </div>

                <!-- Pregunta 2 -->
                <div class="mb-6 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-gray-800 mb-3">2. Paciente de 54 años con HTA mal controlada de larga data. Ausculta un ruido de tono grave antes de R1 (presistólico). Ritmo sinusal. ¿Cuál es?</p>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q2" value="A" class="form-radio text-blue-600">
                            <span>Tercer Ruido (R3) fisiológico</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q2" value="B" class="form-radio text-blue-600">
                            <span>Cuarto Ruido (R4) - galope auricular</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q2" value="C" class="form-radio text-blue-600">
                            <span>Chasquido de apertura mitral</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q2" value="D" class="form-radio text-blue-600">
                            <span>Clic de eyección aórtico</span>
                        </label>
                    </div>
                    <p id="feedback-q2" class="hidden text-sm mt-2 font-medium"></p>
                </div>

                <!-- Pregunta 3 -->
                <div class="mb-6 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-gray-800 mb-3">3. ¿Qué dolor aumenta a la inspiración profunda y alivia al acostarse sobre el lado afectado?</p>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q3" value="A" class="form-radio text-blue-600">
                            <span>Dolor de disección aórtica</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q3" value="B" class="form-radio text-blue-600">
                            <span>Dolor anginoso típico</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q3" value="C" class="form-radio text-blue-600">
                            <span>Dolor pleurítico</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q3" value="D" class="form-radio text-blue-600">
                            <span>Dolor pericardítico</span>
                        </label>
                    </div>
                    <p id="feedback-q3" class="hidden text-sm mt-2 font-medium"></p>
                </div>

                <!-- Pregunta 4 -->
                <div class="mb-6 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-gray-800 mb-3">4. Un soplo mesosistólico eyectivo, de forma creciente-decreciente, auscultado en el 2do espacio intercostal derecho e irradiado a carótidas, es característico de:</p>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q4" value="A" class="form-radio text-blue-600">
                            <span>Insuficiencia mitral</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q4" value="B" class="form-radio text-blue-600">
                            <span>Estenosis aórtica</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q4" value="C" class="form-radio text-blue-600">
                            <span>Estenosis mitral</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q4" value="D" class="form-radio text-blue-600">
                            <span>Insuficiencia aórtica</span>
                        </label>
                    </div>
                    <p id="feedback-q4" class="hidden text-sm mt-2 font-medium"></p>
                </div>

                <!-- Pregunta 5 -->
                <div class="mb-8 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-gray-800 mb-3">5. Paciente en urgencias con disnea. Al explorar el cuello acostado a 45 grados, observa ingurgitación yugular y se mantiene elevada por más de 3 cm al comprimir el hígado. ¿Qué signo confirma y qué indica?</p>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q5" value="A" class="form-radio text-blue-600">
                            <span>Pulso carotídeo dícroto, estenosis aórtica</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q5" value="B" class="form-radio text-blue-600">
                            <span>Reflujo hepatojugular positivo, insuficiencia ventricular derecha</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q5" value="C" class="form-radio text-blue-600">
                            <span>Signo de Kussmaul positivo, pericarditis constrictiva únicamente</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="q5" value="D" class="form-radio text-blue-600">
                            <span>Choque de punta desviado, insuficiencia aórtica severa</span>
                        </label>
                    </div>
                    <p id="feedback-q5" class="hidden text-sm mt-2 font-medium"></p>
                </div>

                <!-- Botón de Envío y Resultado -->
                <div class="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100 pt-6">
                    <button type="submit" class="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
                        Calificar Cuestionario
                    </button>
                    <button type="button" onclick="resetQuiz()" class="w-full sm:w-auto px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm transition-colors">
                        Reiniciar
                    </button>
                    <div id="quizResult" class="hidden font-bold text-lg text-gray-800"></div>
                </div>
            </form>
        </section>
    </div>

    <script>
        function toggleCard(cardElement) {
            cardElement.classList.toggle('flashcard-flipped');
        }

        const answers = {
            q1: "C",
            q2: "B",
            q3: "C",
            q4: "B",
            q5: "B"
        };

        const explanations = {
            q1: "Correcto: Actividades menores que las ordinarias como bañarse, vestirse o caminar menos de 100m plano que generen disnea corresponden a la Clase III de la NYHA.",
            q2: "Correcto: El R4 se produce por la contracción auricular activa contra una cámara ventricular rígida o con sobrecarga de presión (hipertrofia ventricular por HTA). Requiere contracción auricular activa (ritmo sinusal).",
            q3: "Correcto: El dolor pleurítico aumenta característicamente con movimientos respiratorios (tos, inspiración profunda) y alivia en decúbito lateral sobre el lado afectado, al 'ferular' la pleura inflamada contra la cama.",
            q4: "Correcto: El soplo de estenosis aórtica es mesosistólico eyectivo, de tipo creciente-decreciente (romboidal), y se irradia característicamente a las carótidas en el cuello.",
            q5: "Correcto: La presencia de reflujo hepatojugular persistente (>3 cm) bajo compresión hepática sostenida es un signo clave de congestión venosa pasiva y disfunción del ventrículo derecho."
        };

        function gradeQuiz() {
            const form = document.getElementById('quizForm');
            let score = 0;
            const total = 5;

            for (let i = 1; i <= total; i++) {
                const qName = 'q' + i;
                const selected = form.elements[qName].value;
                const feedbackEl = document.getElementById('feedback-' + qName);
                
                feedbackEl.classList.remove('hidden', 'text-green-600', 'text-red-600');

                if (selected === answers[qName]) {
                    score++;
                    feedbackEl.innerText = explanations[qName];
                    feedbackEl.classList.add('text-green-600');
                } else {
                    const incorrectText = "Incorrecto. La respuesta correcta era la " + answers[qName] + ". " + 
                                          (selected ? "Seleccionaste la " + selected + "." : "No respondiste.");
                    feedbackEl.innerText = incorrectText + " Explicación: " + explanations[qName];
                    feedbackEl.classList.add('text-red-600');
                }
            }

            const resultDiv = document.getElementById('quizResult');
            resultDiv.classList.remove('hidden');
            resultDiv.innerText = "Resultado: " + score + " de " + total + " respuestas correctas (" + Math.round((score/total)*100) + "%).";
        }

        function resetQuiz() {
            const form = document.getElementById('quizForm');
            form.reset();
            const total = 5;
            for (let i = 1; i <= total; i++) {
                const feedbackEl = document.getElementById('feedback-q' + i);
                feedbackEl.classList.add('hidden');
            }
            const resultDiv = document.getElementById('quizResult');
            resultDiv.classList.add('hidden');
        }
    </script>
</body>
</html>
"""

def read_input_file(filepath):
    if not os.path.exists(filepath):
        print(f"Error: El archivo de entrada '{filepath}' no existe.")
        sys.exit(1)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def generate_with_gemini(api_key, text_content, syllabus_content=""):
    print("Conectando con la API de Gemini (Modelo: gemini-2.5-flash)...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = (
        "Tu rol y persona:\n"
        "Eres el Dr./Dra. [Nombre del Docente], Catedrático/a de Propedéutica Clínica y Semiología Médica de la Universidad Central del Este (UCE), asignatura MED-228 del Pensum 36. Tu misión es guiar a estudiantes de tercer año de Medicina en el dominio del arte diagnóstico: desde la primera entrevista con el paciente hasta la construcción de un síndrome clínico fundamentado.\n"
        "Tu metodología combina el rigor académico con el humanismo médico. Eres socrático/a, empático/a y exiges precisión semiológica. Nunca das la respuesta directa antes de que el estudiante razone. Tu frase inspiradora: \"El médico que sabe escuchar ya ha hecho la mitad del diagnóstico.\"\n\n"
        "FUENTE DE VERDAD — BIBLIOGRAFÍA OFICIAL UCE\n"
        "Todas tus explicaciones y preguntas deben basarse exclusivamente en estas fuentes del programa MED-228:\n"
        "| Prioridad | Texto | Uso Principal |\n"
        "| :--- | :--- | :--- |\n"
        "| ⭐⭐⭐ | Argente-Álvarez — Semiología Médica, Fisiopatología, Semiotecnia y Propedéutica (2ª ed., 2013) | Texto base de toda la asignatura |\n"
        "| ⭐⭐⭐ | Bickley — Bates: Guía de Exploración Física e Historia Clínica (Ovid, 2017) | Examen físico y técnica semiológica |\n"
        "| ⭐⭐⭐ | Argente (H.A.) — Semiología Médica (2ª ed., Panamericana, 2013) | Signos, síntomas y síndromes |\n"
        "| ⭐⭐ | Goic-Chamorro-Reyes — Semiología Médica (3ª ed., Chile, 2010) | Complemento clínico |\n"
        "| ⭐⭐ | Surós — Semiología Médica y Técnica Exploratoria (8ª ed., Masson, 2004) | Técnicas exploratorias |\n"
        "| ⭐ | First Aid USMLE Step 2 CS (McGraw-Hill, 2017) | Patrones clínicos y casos |\n"
        "Si un dato no está en estas fuentes, indícalo claramente en el texto antes de responder.\n\n"
        "ESTRUCTURA DEL PROGRAMA (Guía de Evaluación)\n"
        "📅 BLOQUE 1 — Primer Parcial (Semanas 1–6) → 30%\n"
        "- Introducción a la Semiología: signos, síntomas, síndrome, signo patognomónico\n"
        "- Estructura de la Historia Clínica completa (Anamnesis, Motivo de consulta, HEA, Antecedentes)\n"
        "- Revisión por sistemas y aparatos (SNC, respiratorio, cardiovascular, GI, genitourinario, endocrino, hematopoyético, musculoesquelético)\n"
        "- Introducción a la Exploración Física: Inspección, Palpación, Percusión, Auscultación\n"
        "- Semiología de Cabeza y Cuello (cráneo, ojos, nariz, oídos, boca, tiroides, ganglios, pulsos)\n\n"
        "📅 BLOQUE 2 — Segundo Parcial (Semanas 7–11) → 30%\n"
        "- Semiología del Tórax Posterior y Anterior (sistema respiratorio)\n"
        "- Semiología Cardiovascular (ruidos cardíacos, focos, soplos, latidos)\n"
        "- Toma de Presión Arterial (Korotkoff, clasificación ACC/AHA, variaciones)\n"
        "- Examen de pulsos arteriales y venosos (tipos de pulsos patológicos)\n"
        "- Semiología de Mamas\n\n"
        "📅 BLOQUE 3 — Evaluación Final (Semanas 12–16) → 40%\n"
        "- Semiología Abdominal (gastrointestinal: inspección, auscultación, palpación, percusión)\n"
        "- Semiología Genitourinaria (genitales externos masculinos y femeninos, órganos internos)\n"
        "- Examen físico de extremidades superiores e inferiores\n"
        "- Integración en Síndrome Clínico\n"
        "- Exámenes complementarios y su aporte diagnóstico\n\n"
        "METODOLOGÍA DE ENSEÑANZA — EL CICLO SEMIOLÓGICO\n"
        "Para guiar al estudiante a través de la lección generada, asegúrate de que el material simule o guíe a través de este ciclo:\n"
        "- FASE 1: Anamnesis Académica (Preguntar al estudiante por su bloque/parcial actual, temas de mayor dificultad, y enfoque teórico vs práctico)\n"
        "- FASE 2: Planificación del Módulo (Proponer un mini-plan estructurado)\n"
        "- FASE 3: Ejecución Activa — El Método IPPAA (Define el término de concepto anclaje, describe inmersión sensorial (VE/TOQUE/OYE), provee un caso clínico disparador y una pregunta socrática)\n"
        "- FASE 4: Evaluación y Retroalimentación (Cita la fuente ante aciertos, y usa el 'Espejo Clínico' con analogías y razonamiento guiado en lugar de dar la respuesta directa ante fallos)\n\n"
        "REGLAS DE PRIORIZACIÓN ACADÉMICA (Pesos UCE MED-228)\n"
        "Al redactar explicaciones y ponderar el contenido, prioriza:\n"
        "- Semiología práctica (45%): Técnica exploratoria correcta (IPPA), hallazgos e interpretación.\n"
        "- Historia Clínica (30%): Estructura, redacción, anamnesis completa, síndrome clínico.\n"
        "- Bases fisiopatológicas (25%): Razonamiento del 'por qué' de cada signo o síntoma.\n\n"
        "DISEÑO COGNITIVO DE CADA EXPLICACIÓN (Tanto en el repaso Markdown como en el HTML):\n"
        "Toda explicación o sección de repaso debe incluir estos elementos estructurados:\n"
        "A. Gancho Clínico: Inicia con una escena de consulta o sala de emergencias que despierte curiosidad.\n"
        "B. El Trío Semiológico: Para cada hallazgo, describe siempre:\n"
        "   - 👁️ Lo que VE: inspección (coloración, forma, simetría, movimiento)\n"
        "   - 🤲 Lo que TOCA: palpación (consistencia, temperatura, pulso, frémito)\n"
        "   - 👂 Lo que OYE: auscultación/percusión (ruidos, matidez, timpanismo)\n"
        "C. Tabla Comparativa (obligatoria para diferenciación): Cuando el tema involucre diagnóstico diferencial o comparación de hallazgos (ej. matidez vs timpanismo; ruidos normales vs patológicos; pulso normal vs tipos anormales).\n"
        "D. Perla de la Cátedra: Un consejo clínico práctico o mnemotecnia de alto valor al final de cada explicación.\n\n"
        "Especificaciones del Cuestionario (en html_content):\n"
        "- Debe ser un cuestionario interactivo calificado por JavaScript para 5 preguntas.\n"
        "- Formato de cada pregunta: Viñeta clínica estilo USMLE / UCE (presentación del caso -> pregunta -> 5 opciones de la A a la E).\n"
        "- Distribución de preguntas: 45% práctica semiológica, 30% Historia Clínica, 25% fisiopatología del signo.\n"
        "- Justificación integrada en el JavaScript: Mínimo 150 palabras por pregunta, explicando el razonamiento correcto y descartando con precisión científica cada distractor con base en la bibliografía oficial UCE.\n"
        "- Perla de la Cátedra: Una mnemotecnia o consejo práctico al final de la justificación de cada pregunta.\n\n"
        "Formato de Salida (JSON):\n"
        "Genera un JSON estructurado con dos claves exactas:\n"
        "- 'markdown_content': Una versión formateada en Markdown didáctico y estructurado para Teams (con tablas, resúmenes, y bloques <details> para active recall).\n"
        "- 'html_content': Un documento HTML autocontenido que utilice Tailwind CSS para un diseño médico premium (diseño limpio, colores HSL/azules médicos, tipografía Inter/Roboto). Debe contener tarjetas de repaso interactivas (revelables al hacer clic) y el cuestionario interactivo con JavaScript.\n\n"
        "Asegúrate de que la salida sea ÚNICAMENTE un objeto JSON válido sin bloques de código tipo markdown alrededor (como ```json) o que comience directamente con { y termine con }.\n\n"
        f"Programa Oficial de la Materia (Syllabus):\n{syllabus_content}\n\n"
        f"Notas de la clase a procesar:\n{text_content}"
    )

    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req_body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_body,
        headers={"Content-Type": "application/json"}
    )
    
    max_retries = 3
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Limpiar posibles bloques de código y parsear tolerando caracteres de control
                text = text_response.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text, strict=False)
        except urllib.error.HTTPError as he:
            print(f"Intento {attempt+1} de llamada a Gemini falló: HTTP Error {he.code}: {he.reason}")
            if he.code in [429, 503, 504]:
                if attempt < max_retries - 1:
                    print(f"Reintentando en {retry_delay} segundos...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
            break
        except Exception as e:
            print(f"Intento {attempt+1} de llamada a Gemini falló: {e}")
            if attempt < max_retries - 1:
                print(f"Reintentando en {retry_delay} segundos...")
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            break
            
    print("Todos los intentos a la API de Gemini fallaron.")
    print("Reintentando con valores por defecto (Mock)...")
    return None

def generate_with_openai(api_key, text_content, syllabus_content=""):
    print("Conectando con la API de OpenAI (Modelo: gpt-4o-mini)...")
    url = "https://api.openai.com/v1/chat/completions"
    
    prompt = (
        "Tu rol y persona:\n"
        "Eres el Dr./Dra. [Nombre del Docente], Catedrático/a de Propedéutica Clínica y Semiología Médica de la Universidad Central del Este (UCE), asignatura MED-228 del Pensum 36. Tu misión es guiar a estudiantes de tercer año de Medicina en el dominio del arte diagnóstico: desde la primera entrevista con el paciente hasta la construcción de un síndrome clínico fundamentado.\n"
        "Tu metodología combina el rigor académico con el humanismo médico. Eres socrático/a, empático/a y exiges precisión semiológica. Nunca das la respuesta directa antes de que el estudiante razone. Tu frase inspiradora: \"El médico que sabe escuchar ya ha hecho la mitad del diagnóstico.\"\n\n"
        "FUENTE DE VERDAD — BIBLIOGRAFÍA OFICIAL UCE\n"
        "Todas tus explicaciones y preguntas deben basarse exclusivamente en estas fuentes del programa MED-228:\n"
        "| Prioridad | Texto | Uso Principal |\n"
        "| :--- | :--- | :--- |\n"
        "| ⭐⭐⭐ | Argente-Álvarez — Semiología Médica, Fisiopatología, Semiotecnia y Propedéutica (2ª ed., 2013) | Texto base de toda la asignatura |\n"
        "| ⭐⭐⭐ | Bickley — Bates: Guía de Exploración Física e Historia Clínica (Ovid, 2017) | Examen físico y técnica semiológica |\n"
        "| ⭐⭐⭐ | Argente (H.A.) — Semiología Médica (2ª ed., Panamericana, 2013) | Signos, síntomas y síndromes |\n"
        "| ⭐⭐ | Goic-Chamorro-Reyes — Semiología Médica (3ª ed., Chile, 2010) | Complemento clínico |\n"
        "| ⭐⭐ | Surós — Semiología Médica y Técnica Exploratoria (8ª ed., Masson, 2004) | Técnicas exploratorias |\n"
        "| ⭐ | First Aid USMLE Step 2 CS (McGraw-Hill, 2017) | Patrones clínicos y casos |\n"
        "Si un dato no está en estas fuentes, indícalo claramente en el texto antes de responder.\n\n"
        "ESTRUCTURA DEL PROGRAMA (Guía de Evaluación)\n"
        "📅 BLOQUE 1 — Primer Parcial (Semanas 1–6) → 30%\n"
        "- Introducción a la Semiología: signos, síntomas, síndrome, signo patognomónico\n"
        "- Estructura de la Historia Clínica completa (Anamnesis, Motivo de consulta, HEA, Antecedentes)\n"
        "- Revisión por sistemas y aparatos (SNC, respiratorio, cardiovascular, GI, genitourinario, endocrino, hematopoyético, musculoesquelético)\n"
        "- Introducción a la Exploración Física: Inspección, Palpación, Percusión, Auscultación\n"
        "- Semiología de Cabeza y Cuello (cráneo, ojos, nariz, oídos, boca, tiroides, ganglios, pulsos)\n\n"
        "📅 BLOQUE 2 — Segundo Parcial (Semanas 7–11) → 30%\n"
        "- Semiología del Tórax Posterior y Anterior (sistema respiratorio)\n"
        "- Semiología Cardiovascular (ruidos cardíacos, focos, soplos, latidos)\n"
        "- Toma de Presión Arterial (Korotkoff, clasificación ACC/AHA, variaciones)\n"
        "- Examen de pulsos arteriales y venosos (tipos de pulsos patológicos)\n"
        "- Semiología de Mamas\n\n"
        "📅 BLOQUE 3 — Evaluación Final (Semanas 12–16) → 40%\n"
        "- Semiología Abdominal (gastrointestinal: inspección, auscultación, palpación, percusión)\n"
        "- Semiología Genitourinaria (genitales externos masculinos y femeninos, órganos internos)\n"
        "- Examen físico de extremidades superiores e inferiores\n"
        "- Integración en Síndrome Clínico\n"
        "- Exámenes complementarios y su aporte diagnóstico\n\n"
        "METODOLOGÍA DE ENSEÑANZA — EL CICLO SEMIOLÓGICO\n"
        "Para guiar al estudiante a través de la lección generada, asegúrate de que el material simule o guíe a través de este ciclo:\n"
        "- FASE 1: Anamnesis Académica (Preguntar al estudiante por su bloque/parcial actual, temas de mayor dificultad, y enfoque teórico vs práctico)\n"
        "- FASE 2: Planificación del Módulo (Proponer un mini-plan estructurado)\n"
        "- FASE 3: Ejecución Activa — El Método IPPAA (Define el término de concepto anclaje, describe inmersión sensorial (VE/TOQUE/OYE), provee un caso clínico disparador y una pregunta socrática)\n"
        "- FASE 4: Evaluación y Retroalimentación (Cita la fuente ante aciertos, y usa el 'Espejo Clínico' con analogías y razonamiento guiado en lugar de dar la respuesta directa ante fallos)\n\n"
        "REGLAS DE PRIORIZACIÓN ACADÉMICA (Pesos UCE MED-228)\n"
        "Al redactar explicaciones y ponderar el contenido, prioriza:\n"
        "- Semiología práctica (45%): Técnica exploratoria correcta (IPPA), hallazgos e interpretación.\n"
        "- Historia Clínica (30%): Estructura, redacción, anamnesis completa, síndrome clínico.\n"
        "- Bases fisiopatológicas (25%): Razonamiento del 'por qué' de cada signo o síntoma.\n\n"
        "DISEÑO COGNITIVO DE CADA EXPLICACIÓN (Tanto en el repaso Markdown como en el HTML):\n"
        "Toda explicación o sección de repaso debe incluir estos elementos estructurados:\n"
        "A. Gancho Clínico: Inicia con una escena de consulta o sala de emergencias que despierte curiosidad.\n"
        "B. El Trío Semiológico: Para cada hallazgo, describe siempre:\n"
        "   - 👁️ Lo que VE: inspección (coloración, forma, simetría, movimiento)\n"
        "   - 🤲 Lo que TOCA: palpación (consistencia, temperatura, pulso, frémito)\n"
        "   - 👂 Lo que OYE: auscultación/percusión (ruidos, matidez, timpanismo)\n"
        "C. Tabla Comparativa (obligatoria para diferenciación): Cuando el tema involucre diagnóstico diferencial o comparación de hallazgos (ej. matidez vs timpanismo; ruidos normales vs patológicos; pulso normal vs tipos anormales).\n"
        "D. Perla de la Cátedra: Un consejo clínico práctico o mnemotecnia de alto valor al final de cada explicación.\n\n"
        "Especificaciones del Cuestionario (en html_content):\n"
        "- Debe ser un cuestionario interactivo calificado por JavaScript para 5 preguntas.\n"
        "- Formato de cada pregunta: Viñeta clínica estilo USMLE / UCE (presentación del caso -> pregunta -> 5 opciones de la A a la E).\n"
        "- Distribución de preguntas: 45% práctica semiológica, 30% Historia Clínica, 25% fisiopatología del signo.\n"
        "- Justificación integrada en el JavaScript: Mínimo 150 palabras por pregunta, explicando el razonamiento correcto y descartando con precisión científica cada distractor con base en la bibliografía oficial UCE.\n"
        "- Perla de la Cátedra: Una mnemotecnia o consejo práctico al final de la justificación de cada pregunta.\n\n"
        "Formato de Salida (JSON):\n"
        "Genera un JSON estructurado con dos claves exactas:\n"
        "- 'markdown_content': Una versión formateada en Markdown didáctico y estructurado para Teams (con tablas, resúmenes, y bloques <details> para active recall).\n"
        "- 'html_content': Un documento HTML autocontenido que utilice Tailwind CSS para un diseño médico premium (diseño limpio, colores HSL/azules médicos, tipografía Inter/Roboto). Debe contener tarjetas de repaso interactivas (revelables al hacer clic) y el cuestionario interactivo con JavaScript.\n\n"
        "Asegúrate de que la salida sea ÚNICAMENTE un objeto JSON válido sin bloques de código tipo markdown alrededor (como ```json) o que comience directamente con { y termine con }.\n\n"
        f"Programa Oficial de la Materia (Syllabus):\n{syllabus_content}\n\n"
        f"Notas de la clase a procesar:\n{text_content}"
    )

    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "Eres un asistente educativo médico experto en el rol y persona indicados, que devuelve únicamente respuestas en JSON estructurado y alineadas al currículum universitario."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    
    req_body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )

    max_retries = 3
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["choices"][0]["message"]["content"]
                
                # Limpiar posibles bloques de código y parsear tolerando caracteres de control
                text = text_response.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text, strict=False)
        except urllib.error.HTTPError as he:
            print(f"Intento {attempt+1} de llamada a OpenAI falló: HTTP Error {he.code}: {he.reason}")
            if he.code in [429, 503, 504]:
                if attempt < max_retries - 1:
                    print(f"Reintentando en {retry_delay} segundos...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
            break
        except Exception as e:
            print(f"Intento {attempt+1} de llamada a OpenAI falló: {e}")
            if attempt < max_retries - 1:
                print(f"Reintentando en {retry_delay} segundos...")
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            break

    print("Todos los intentos a la API de OpenAI fallaron.")
    print("Reintentando con valores por defecto (Mock)...")
    return None

def load_env_file(filepath=".env"):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()
        print(f"Variables de entorno cargadas desde '{filepath}'.")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_env_file(os.path.join(base_dir, ".env"))
    parser = argparse.ArgumentParser(description="MVP Local para el procesamiento de clases de semiología.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Ruta al archivo txt con notas de la clase.")
    parser.add_argument("--api", choices=["openai", "gemini", "mock", "auto"], default="auto", 
                        help="API a utilizar. 'auto' detectará variables de entorno.")
    parser.add_argument("--html", default=DEFAULT_HTML_OUTPUT, help="Ruta del archivo HTML de salida.")
    parser.add_argument("--md", default=DEFAULT_MD_OUTPUT, help="Ruta del archivo Markdown de salida.")
    parser.add_argument("--syllabus", default=os.path.join("public", "programa_clase_MED228.md"), help="Ruta al archivo del programa de clase.")
    
    args = parser.parse_args()

    # 1. Leer archivo de entrada y programa de clase
    notes = read_input_file(args.input)
    print(f"Leído exitosamente el archivo '{args.input}' ({len(notes)} caracteres).")

    syllabus = ""
    if os.path.exists(args.syllabus):
        with open(args.syllabus, "r", encoding="utf-8") as f:
            syllabus = f.read()
        print(f"Programa de clase cargado exitosamente desde '{args.syllabus}' ({len(syllabus)} caracteres).")
    else:
        print(f"Advertencia: El programa de clase '{args.syllabus}' no existe. La generación continuará sin alineación.")

    # 2. Identificar API e intentar generación
    api_to_use = args.api
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    result = None

    if api_to_use == "auto":
        if gemini_key:
            api_to_use = "gemini"
        elif openai_key:
            api_to_use = "openai"
        else:
            api_to_use = "mock"

    print(f"Modo seleccionado: {api_to_use.upper()}")

    if api_to_use == "gemini":
        if not gemini_key:
            print("Error: GEMINI_API_KEY no encontrada en las variables de entorno.")
            sys.exit(1)
        result = generate_with_gemini(gemini_key, notes, syllabus)
    elif api_to_use == "openai":
        if not openai_key:
            print("Error: OPENAI_API_KEY no encontrada en las variables de entorno.")
            sys.exit(1)
        result = generate_with_openai(openai_key, notes, syllabus)
    
    # Si falló la API o se seleccionó mock, cargamos el mock interactivo
    if not result:
        print("Utilizando la generación Mock/Offline local para cardiovascular...")
        result = {
            "markdown_content": MOCK_MARKDOWN,
            "html_content": MOCK_HTML_TEMPLATE
        }

    # 3. Escribir resultados
    try:
        with open(args.md, "w", encoding="utf-8") as f:
            f.write(result["markdown_content"])
        print(f"Archivo Markdown generado: {args.md}")

        with open(args.html, "w", encoding="utf-8") as f:
            f.write(result["html_content"])
        print(f"Archivo HTML Interactivo generado: {args.html}")
        print("\n¡Proceso de generación de repaso completado con éxito!")
    except Exception as e:
        print(f"Error escribiendo los archivos de salida: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
