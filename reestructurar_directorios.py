#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Reestructuración de Directorios para el Sistema Multi-Curso.
Organiza los directorios de 'public', 'teams_recordings' y 'material_moodle'
para soportar los 7 cursos requeridos.
"""

import os
import shutil

# Definición del directorio base del proyecto
directorio_base = os.path.dirname(os.path.abspath(__file__))

# Lista de los 7 cursos en minúsculas y sin acentos
cursos = [
    "semiologia",
    "farmacologia",
    "fisiopatologia",
    "bioetica",
    "patologia",
    "microbiologia",
    "epidemiologia"
]

# Títulos de los cursos para generar los programas por defecto
nombres_cursos_legibles = {
    "semiologia": "Semiología Médica",
    "farmacologia": "Farmacología Clínica",
    "fisiopatologia": "Fisiopatología",
    "bioetica": "Bioética Médica",
    "patologia": "Patología General",
    "microbiologia": "Microbiología y Parasitología",
    "epidemiologia": "Epidemiología y Salud Pública"
}

def crear_directorios():
    """
    Crea los subdirectorios para cada curso dentro de public,
    teams_recordings y material_moodle.
    """
    print("[REESTRUCTURACIÓN]: Creando estructuras de carpetas para cada curso...")
    
    carpetas_padre = ["public", "teams_recordings", "material_moodle"]
    
    for padre in carpetas_padre:
        ruta_padre = os.path.join(directorio_base, padre)
        os.makedirs(ruta_padre, exist_ok=True)
        
        for curso in cursos:
            ruta_curso = os.path.join(ruta_padre, curso)
            if not os.path.exists(ruta_curso):
                os.makedirs(ruta_curso)
                print(f"  - Creado: {padre}/{curso}")
            else:
                print(f"  - Ya existe: {padre}/{curso}")

def mover_archivos_semiologia():
    """
    Mueve los archivos existentes de Semiología de la raíz de public/ a public/semiologia/.
    """
    print("[REESTRUCTURACIÓN]: Moviendo archivos de Semiología a su subcarpeta correspondiente...")
    
    ruta_public = os.path.join(directorio_base, "public")
    ruta_semiologia = os.path.join(ruta_public, "semiologia")
    
    # Archivos a mover (excluyendo carpetas y el index.html principal del selector)
    archivos_a_mover = [
        "Llanio_Tomo_I_Semiologia.pdf",
        "Llanio_Tomo_II_Semiologia.pdf",
        "notas_clase.txt",
        "programa_clase_MED228.md",
        "repaso.html",
        "repaso.md"
    ]
    
    for archivo in archivos_a_mover:
        ruta_origen = os.path.join(ruta_public, archivo)
        ruta_destino = os.path.join(ruta_semiologia, archivo)
        
        if os.path.exists(ruta_origen):
            # Mover y sobreescribir si ya existe
            if os.path.exists(ruta_destino):
                os.remove(ruta_destino)
            shutil.move(ruta_origen, ruta_destino)
            print(f"  - Mover: public/{archivo} -> public/semiologia/{archivo}")
        else:
            if os.path.exists(ruta_destino):
                print(f"  - El archivo ya se encuentra en su destino: public/semiologia/{archivo}")
            else:
                print(f"  - Advertencia: No se encontró el archivo de origen public/{archivo}")

def generar_programas_defecto():
    """
    Crea archivos de programa (syllabus) por defecto para los cursos que no los tienen.
    """
    print("[REESTRUCTURACIÓN]: Generando programas de estudio (syllabus) por defecto...")
    
    for curso in cursos:
        # Semiología ya tiene programa_clase_MED228.md
        if curso == "semiologia":
            continue
            
        nombre_syllabus = f"programa_clase_{curso}.md"
        ruta_syllabus = os.path.join(directorio_base, "public", curso, nombre_syllabus)
        
        if not os.path.exists(ruta_syllabus):
            nombre_bonito = nombres_cursos_legibles[curso]
            contenido_programa = f"""# Programa de Estudio Oficial: {nombre_bonito}
## Universidad Central del Este (UCE)

### Información General
* **Curso:** {nombre_bonito}
* **Semestre:** Académico 2026
* **Descripción:** Este programa contiene los temas de estudio semanales para el aprendizaje y repaso guiado de la materia.

### Contenido Temático Semanal
* **Semana 1-2:** Fundamentos Básicos y Conceptos Claves de {nombre_bonito}.
* **Semana 3-4:** Principios Clínicos Aplicados y Diagnóstico Inicial.
* **Semana 5-6:** Módulo Avanzado y Discusión de Casos Prácticos I.
* **Semana 7-8:** Evaluación Parcial y Revisión de Literatura Médica.
* **Semana 9-10:** Módulo de Profundización Temática y Laboratorios.
* **Semana 11-12:** Integración Multidisciplinaria y Casos Complejos II.
* **Semana 13-14:** Repaso General Pre-Examen Final.
* **Semana 15:** Evaluación Final del Semestre.

### Bibliografía Recomendada
1. Manual y Guías de {nombre_bonito}, Edición 2026.
2. Recursos de la Biblioteca Digital de la UCE.
"""
            with open(ruta_syllabus, "w", encoding="utf-8") as f:
                f.write(contenido_programa)
            print(f"  - Creado syllabus: public/{curso}/{nombre_syllabus}")
        else:
            print(f"  - Ya existe syllabus: public/{curso}/{nombre_syllabus}")

if __name__ == "__main__":
    crear_directorios()
    mover_archivos_semiologia()
    generar_programas_defecto()
    print("[REESTRUCTURACIÓN COMPLETA]: Las carpetas y archivos base han sido organizados.")
