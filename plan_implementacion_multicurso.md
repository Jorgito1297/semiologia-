# Plan de Implementación de Sistema Multi-Curso — UCE

Este documento describe la reestructuración del proyecto **Study With Me** para soportar el escalado a 7 asignaturas médicas de forma simultánea e inteligente.

---

## 📂 1. Estructura de Directorios Creada

Se crearon subcarpetas específicas para cada uno de los 7 cursos bajo `public/`, `teams_recordings/` y `material_moodle/`:
*   **Cursos Soportados:**
    1.  `semiologia` (Semiología Médica)
    2.  `farmacologia` (Farmacología Clínica)
    3.  `fisiopatologia` (Fisiopatología)
    4.  `bioetica` (Bioética Médica)
    5.  `patologia` (Patología General)
    6.  `microbiologia` (Microbiología y Parasitología)
    7.  `epidemiologia` (Epidemiología y Salud Pública)

### Detalle de Carpetas por Curso
Para cada curso se cuenta con:
*   `public/<curso>/`: Contiene los archivos generados del curso como `notas_clase.txt`, `repaso.html`, `repaso.md` y su syllabus correspondiente `programa_clase_<curso>.md`.
*   `teams_recordings/<curso>/`: Carpeta donde se deben colocar las grabaciones o transcripciones (.vtt, .srt, .mp4, .mp3, etc.) de las clases de Teams correspondientes al curso.
*   `material_moodle/<curso>/`: Carpeta de soporte para otros materiales específicos descargados de Moodle.

---

## ⚙️ 2. Actualización de Scripts

### A. Guardián de Monitoreo (`medical_guardian.py`)
El script fue adaptado para:
1.  **Detección Dinámica de Curso:** Extrae el nombre del curso a partir del primer subdirectorio de la ruta del archivo detectado (ej. si se coloca un archivo en `teams_recordings/farmacologia/clase1.vtt`, se detecta automáticamente el curso `farmacologia`).
2.  **Monitoreo Recursivo Selectivo:** Configura observadores recursivos en `teams_recordings/` y `material_moodle/` para capturar archivos dentro de las carpetas de curso, pero mantiene un observador no recursivo en la raíz del espacio de trabajo para evitar bucles infinitos al escribir los repasos en `public/`.
3.  **Invocación Parametrizada de `generate_review.py`:** Llama al generador enviando explícitamente los parámetros del curso (`--input`, `--html`, `--md` y `--syllabus`) garantizando aislamiento completo de datos.
4.  **Cumplimiento del Idioma:** Se renombraron todas las variables, comentarios y registros al español. No se incluyeron palabras prohibidas.

### B. Panel Principal Selector (`public/index.html`)
El archivo HTML principal de la raíz de `public/` fue actualizado para funcionar como un **Selector Multi-Curso**:
*   Muestra una interfaz interactiva adaptada a Tailwind CSS con tarjetas para las 7 asignaturas.
*   Cada asignatura tiene enlaces directos a sus respectivos archivos de estudio interactivo (`repaso.html`), syllabus (`programa_clase_*.md`) y notas extraídas (`notas_clase.txt`).

---

## 🧹 3. Guía de Limpieza e Instrucciones de Uso

Para completar la migración de los archivos PDF de Semiología y remover los archivos antiguos de la raíz de `public/`, se ha proporcionado el script automático `reestructurar_directorios.py` en la raíz del proyecto.

### Cómo ejecutar el script de limpieza
Dado que el entorno de ejecución requiere confirmación del usuario para comandos de sistema, puedes ejecutar el script manualmente abriendo una terminal de PowerShell y corriendo:
```powershell
python reestructurar_directorios.py
```

Este script se encargará de:
1.  Mover los dos tomos de PDF de Semiología (`Llanio_Tomo_I_Semiologia.pdf` y `Llanio_Tomo_II_Semiologia.pdf`) desde `public/` hacia `public/semiologia/`.
2.  Eliminar los archivos residuales de la raíz de `public/` que ya fueron migrados de forma segura a `public/semiologia/`.
