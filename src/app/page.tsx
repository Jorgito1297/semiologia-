'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/services/supabase';
import { isEnabled } from '@/config/feature-flags';
import {
  calculateFatigue,
  calculateClinicalReadiness
} from '@/utils/cognitive_metrics';

interface Assignment {
  id: number;
  title: string;
  due: string;
  status: string;
}

interface Exam {
  id: number;
  title: string;
  date: string;
  status: string;
}

interface ColorClass {
  border: string;
  badge: string;
  iconBg: string;
  bar: string;
}

interface Course {
  code: string;
  shortname: string;
  fullname: string;
  icon: string;
  color: string;
  status: string;
  description: string;
  syllabusLink: string;
  notesLink: string;
  repasoLink: string;
  objectives: string[];
  assignments: Assignment[];
  exams: Exam[];
  progress: number;
}

// Estructura de cursos predeterminada
const DEFAULT_COURSES: Record<string, Course> = {
  semiologia: {
    code: "MED-228",
    shortname: "Semiología",
    fullname: "Semiología Médica",
    icon: "🩺",
    color: "blue",
    status: "Activo",
    description: "Método clínico, anamnesis, pilares de exploración (inspección, palpación, percusión, auscultación) y síndromes clínicos.",
    syllabusLink: "semiologia/programa_clase_MED228.md",
    notesLink: "semiologia/notas_clase.txt",
    repasoLink: "semiologia/repaso.html",
    objectives: [
      "Dominar el método clínico para realizar un diagnóstico sindrómico.",
      "Desarrollar destreza en la anamnesis e interrogatorio.",
      "Dominar los cuatro pilares: inspección, palpación, percusión y auscultación.",
      "Redactar de forma ordenada e integrada la Historia Clínica."
    ],
    assignments: [
      { id: 101, title: "Elaborar Historia Clínica Completa de Paciente Simulado", due: "15 de Junio, 2026", status: "pendiente" },
      { id: 102, title: "Reporte Escrito de Maniobras de Palpación Hepática", due: "22 de Junio, 2026", status: "pendiente" },
      { id: 103, title: "Análisis de Focos y Soplos Cardíacos en Simulador", due: "29 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 1001, title: "Evaluación Práctica de Examen Físico Cardiovascular", date: "18 de Junio, 2026", status: "pendiente" },
      { id: 1002, title: "Examen Parcial Teórico: Aparato Respiratorio y Abdomen", date: "02 de Julio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  farmacologia: {
    code: "FAR-301",
    shortname: "Farmacología",
    fullname: "Farmacología Clínica",
    icon: "💊",
    color: "red",
    status: "Monitoreado",
    description: "Farmacocinética, farmacodinamia, interacciones medicamentosas y terapéutica farmacológica para patologías sistémicas.",
    syllabusLink: "farmacologia/programa_clase_farmacologia.md",
    notesLink: "farmacologia/notas_clase.txt",
    repasoLink: "farmacologia/repaso.html",
    objectives: [
      "Comprender la farmacocinética y farmacodinamia general.",
      "Diferenciar fármacos agonistas de antagonistas.",
      "Aprender interacciones y contraindicaciones farmacológicas.",
      "Resolver casos clínicos de prescripción médica en patologías comunes."
    ],
    assignments: [
      { id: 201, title: "Mapa Conceptual de Vías de Administración de Fármacos", due: "18 de Junio, 2026", status: "pendiente" },
      { id: 202, title: "Resolución de Casos: Dosificación y Aclaramiento Renal", due: "25 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 2001, title: "Prueba Corta: Farmacología Cardiovascular y Autonómica", date: "20 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  fisiopatologia: {
    code: "FIS-302",
    shortname: "Fisiopatología",
    fullname: "Fisiopatología",
    icon: "🧬",
    color: "purple",
    status: "Monitoreado",
    description: "Mecanismos biológicos del origen de las enfermedades, disfunción de órganos y respuestas compensadoras del organismo.",
    syllabusLink: "fisiopatologia/programa_clase_fisiopatologia.md",
    notesLink: "fisiopatologia/notas_clase.txt",
    repasoLink: "fisiopatologia/repaso.html",
    objectives: [
      "Explicar la alteración funcional en el organismo enfermo.",
      "Analizar los mecanismos de compensación hemodinámica.",
      "Comprender la patogenia del shock y del edema generalizado.",
      "Correlacionar hallazgos de laboratorio con disfunción orgánica."
    ],
    assignments: [
      { id: 301, title: "Esquema Comparativo: Shock Cardiogénico vs. Hipovolémico", due: "16 de Junio, 2026", status: "pendiente" },
      { id: 302, title: "Análisis del Eje Renina-Angiotensina-Aldosterona", due: "30 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 3001, title: "Examen de Unidad: Fisiopatología Renal y Cardíaca", date: "23 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  bioetica: {
    code: "BIO-101",
    shortname: "Bioética",
    fullname: "Bioética Médica",
    icon: "⚖️",
    color: "yellow",
    status: "Monitoreado",
    description: "Principios éticos en el ejercicio de la medicina, relación médico-paciente, consentimientos y dilemas morales en la clínica.",
    syllabusLink: "bioetica/programa_clase_bioetica.md",
    notesLink: "bioetica/notas_clase.txt",
    repasoLink: "bioetica/repaso.html",
    objectives: [
      "Aplicar los cuatro principios de la bioética en dilemas clínicos.",
      "Analizar la confidencialidad y el consentimiento informado.",
      "Resolver dilemas morales en la toma de decisiones al final de la vida.",
      "Comprender la responsabilidad legal del profesional de salud."
    ],
    assignments: [
      { id: 401, title: "Ensayo Crítico sobre el Consentimiento Informado", due: "17 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 4001, title: "Debate Evaluado: Dilemas en Trasplantes de Órganos", date: "24 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  patologia: {
    code: "PAT-201",
    shortname: "Patología",
    fullname: "Patología General",
    icon: "🔬",
    color: "pink",
    status: "Monitoreado",
    description: "Estudio macroscópico y microscópico de las alteraciones tisulares y celulares que sustentan las manifestaciones de enfermedad.",
    syllabusLink: "patologia/programa_clase_patologia.md",
    notesLink: "patologia/notas_clase.txt",
    repasoLink: "patologia/repaso.html",
    objectives: [
      "Identificar cambios macro y microscópicos en tejidos lesionados.",
      "Diferenciar procesos de inflamación aguda y crónica.",
      "Comprender las bases genéticas y celulares de las neoplasias.",
      "Describir la necrosis y apoptosis tisular."
    ],
    assignments: [
      { id: 501, title: "Dibujo y Rotulación de Muestras de Necrosis Coagulativa", due: "19 de Junio, 2026", status: "pendiente" },
      { id: 502, title: "Estudio de Caso: Biopsia de Neoplasia Maligna", due: "03 de Julio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 5001, title: "Evaluación de Laboratorio Histopatológico", date: "26 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  microbiologia: {
    code: "MIC-202",
    shortname: "Microbiología",
    fullname: "Microbiología",
    icon: "🧫",
    color: "emerald",
    status: "Monitoreado",
    description: "Estudio de bacterias, virus, hongos y parásitos de importancia médica, mecanismos de infección y diagnóstico.",
    syllabusLink: "microbiologia/programa_clase_microbiologia.md",
    notesLink: "microbiologia/notas_clase.txt",
    repasoLink: "microbiologia/repaso.html",
    objectives: [
      "Clasificar los principales agentes patógenos humanos.",
      "Comprender los mecanismos de tinción de Gram y cultivo celular.",
      "Identificar tratamientos de primera línea y perfiles de resistencia.",
      "Aprender el ciclo biológico de parásitos prevalentes."
    ],
    assignments: [
      { id: 601, title: "Ficha Técnica de Bacterias Gram Positivas y Negativas", due: "14 de Junio, 2026", status: "pendiente" },
      { id: 602, title: "Informe de Laboratorio: Antibiograma e Interpretación", due: "28 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 6001, title: "Examen Práctico: Tinción y Observación Microscópica", date: "21 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  },
  epidemiologia: {
    code: "EPI-203",
    shortname: "Epidemiología",
    fullname: "Epidemiología",
    icon: "📊",
    color: "cyan",
    status: "Monitoreado",
    description: "Estudio de la distribución de enfermedades en poblaciones, metodología de investigación y políticas de salud pública.",
    syllabusLink: "epidemiologia/programa_clase_epidemiologia.md",
    notesLink: "epidemiologia/notas_clase.txt",
    repasoLink: "epidemiologia/repaso.html",
    objectives: [
      "Calcular medidas de frecuencia de enfermedad (incidencia, prevalencia).",
      "Diferenciar diseños de estudios (casos-controles, cohortes).",
      "Interpretar curvas epidémicas y canales endémicos.",
      "Analizar estrategias de prevención primaria, secundaria y terciaria."
    ],
    assignments: [
      { id: 701, title: "Cálculo de Riesgo Relativo y Razón de Momios (Odds Ratio)", due: "20 de Junio, 2026", status: "pendiente" }
    ],
    exams: [
      { id: 7001, title: "Análisis de Brote de Enfermedad de Notificación Obligatoria", date: "27 de Junio, 2026", status: "pendiente" }
    ],
    progress: 0
  }
};

const COLOR_CLASSES: Record<string, ColorClass> = {
  blue: {
    border: "border-blue-500/20 hover:border-blue-500/40",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bar: "from-blue-500 to-indigo-500"
  },
  red: {
    border: "border-red-500/20 hover:border-red-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-red-500/10 text-red-400 border-red-500/20",
    bar: "from-red-500 to-rose-500"
  },
  purple: {
    border: "border-purple-500/20 hover:border-purple-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    bar: "from-purple-500 to-indigo-500"
  },
  yellow: {
    border: "border-yellow-500/20 hover:border-yellow-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    bar: "from-yellow-500 to-amber-500"
  },
  pink: {
    border: "border-pink-500/20 hover:border-pink-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    bar: "from-pink-500 to-rose-500"
  },
  emerald: {
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar: "from-emerald-500 to-teal-500"
  },
  cyan: {
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    bar: "from-cyan-500 to-teal-500"
  }
};

const UNIVERSITY_TITLES: Record<string, string> = {
  UCE: "Universidad Central del Este",
  UASD: "Universidad Autónoma de Santo Domingo",
  INTEC: "Instituto Tecnológico de Santo Domingo",
  UNIBE: "Universidad Iberoamericana",
  PUCMM: "Pontificia Universidad Católica Madre y Maestra"
};

export default function DashboardPage() {
  const [studentUser, setStudentUser] = useState('Estudiante');
  const [studentUniv, setStudentUniv] = useState('UCE');
  const [isDemoMode, setIsDemoMode] = useState(true);

  // --- CAPA EMOCIONAL (MOTIVATIONAL COGNITION LAYER) ---
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [, setConsecutiveErrors] = useState(0);
  const [showBurnoutModal, setShowBurnoutModal] = useState(false);

  const [simulatorAccuracy, setSimulatorAccuracy] = useState(75);
  const [osceScore, setOsceScore] = useState(80);

  // Hydration pattern: reading localStorage on mount is correct in 'use client' components.
  // setState in useEffect is required here to avoid SSR hydration mismatch with localStorage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStudentUser(localStorage.getItem('study_user') || 'Estudiante');
    setStudentUniv(localStorage.getItem('study_university') || 'UCE');
    setIsDemoMode(localStorage.getItem('is_demo') !== 'false');
    setSimulatorAccuracy(parseInt(localStorage.getItem('virtual_patient_accuracy') || '75', 10));
    setOsceScore(parseInt(localStorage.getItem('osce_score') || '80', 10));

    const timer = setInterval(() => {
      setSessionSeconds((prev) => {
        const nextSec = prev + 1;
        if (nextSec === 2700) { // 45 minutos continuos
          setShowBurnoutModal(true);
        }
        return nextSec;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */


  const handleDismissBurnout = () => {
    setShowBurnoutModal(false);
    setSessionSeconds(0);
    setConsecutiveErrors(0);
  };

  const [courses, setCourses] = useState<Record<string, Course>>(DEFAULT_COURSES);
  // Ref para acceder al valor actual de courses sin crear dependencia reactiva en useEffect
  const coursesRef = useRef(courses);
  useEffect(() => { coursesRef.current = courses; }, [courses]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const localCache = localStorage.getItem('study_courses_state');
    if (!localCache) return;

    try {
      const parsed = JSON.parse(localCache);
      if (parsed && typeof parsed === 'object') {
        setCourses(parsed);
      }
    } catch (e) {
      console.error("Error al cargar study_courses_state de localStorage:", e);
    }
  }, []);

  const [globalProgress, setGlobalProgress] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const localCache = localStorage.getItem('study_courses_state');
      let courseList: Record<string, Course> = DEFAULT_COURSES;
      if (localCache) {
        try {
          const parsed = JSON.parse(localCache);
          if (parsed && typeof parsed === 'object') {
            courseList = parsed as Record<string, Course>;
          }
        } catch {
          // localStorage corrupto o esquema antiguo — usar defaults
        }
      }
      const keys = Object.keys(courseList);
      if (keys.length > 0) {
        let totalProgress = 0;
        let validCoursesCount = 0;
        keys.forEach(key => {
          const course = courseList[key];
          if (course && typeof course === 'object') {
            const assignments = Array.isArray(course.assignments) ? course.assignments : [];
            const exams = Array.isArray(course.exams) ? course.exams : [];
            const total = assignments.length + exams.length;
            const completed = assignments.filter(a => a && a.status === 'completado').length +
                              exams.filter(e => e && e.status === 'completado').length;
            totalProgress += total > 0 ? Math.round((completed / total) * 100) : 0;
            validCoursesCount++;
          }
        });
        return validCoursesCount > 0 ? Math.round(totalProgress / validCoursesCount) : 0;
      }
    }
    return 0;
  });

  
  // Estado de Panel Lateral
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentCourseKey, setCurrentCourseKey] = useState<string | null>(null);

  const calculateAndSetProgress = (courseList: Record<string, Course>) => {
    const keys = Object.keys(courseList);
    if (keys.length === 0) return;

    let totalProgress = 0;
    keys.forEach(key => {
      const course = courseList[key];
      const total = course.assignments.length + course.exams.length;
      const completed = course.assignments.filter((a: Assignment) => a.status === 'completado').length +
                        course.exams.filter((e: Exam) => e.status === 'completado').length;
      
      course.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      totalProgress += course.progress;
    });

    setCourses({ ...courseList });
    setGlobalProgress(Math.round(totalProgress / keys.length));
    localStorage.setItem('study_courses_state', JSON.stringify(courseList));
  };

  const deterministicId = (str: string) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000;
  };

  const syncFromSupabase = useCallback(async (userEmail: string, currentCourses: Record<string, Course>) => {
    try {
      const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
      if (!userErr && user) {
        // Actualizar last_active del estudiante en Supabase
        await supabaseClient
          .from('students')
          .update({ last_active: new Date().toISOString() })
          .eq('auth_id', user.id);

        if (isEnabled('ENABLE_MOODLE_SYNC')) {
          const { data: dbCourses, error: coursesErr } = await supabaseClient
            .from('moodle_courses')
            .select('*');

          if (coursesErr) throw coursesErr;

          if (!dbCourses || dbCourses.length === 0) {
            // Sembrar datos iniciales si la DB está vacía
            for (const courseKey of Object.keys(currentCourses)) {
              const course = currentCourses[courseKey];
              const { data: courseData, error: courseErr } = await supabaseClient
                .from('moodle_courses')
                .upsert({
                  user_id: user.id,
                  moodle_course_id: deterministicId(course.shortname),
                  fullname: course.fullname,
                  shortname: course.shortname
                }, { onConflict: 'user_id, moodle_course_id' })
                .select()
                .single();

              if (courseErr || !courseData) continue;

              for (const assign of course.assignments) {
                await supabaseClient
                  .from('moodle_assignments')
                  .upsert({
                    user_id: user.id,
                    course_id: courseData.id,
                    moodle_assign_id: assign.id,
                    name: assign.title,
                    duedate: new Date().toISOString(),
                    submitted: assign.status === 'completado'
                  }, { onConflict: 'user_id, moodle_assign_id' });
              }

              for (const exam of course.exams) {
                await supabaseClient
                  .from('moodle_exams')
                  .upsert({
                    user_id: user.id,
                    course_id: courseData.id,
                    moodle_event_id: exam.id,
                    name: exam.title,
                    description: "Hito evaluado para " + course.shortname,
                    timestart: new Date().toISOString()
                  }, { onConflict: 'user_id, moodle_event_id' });
              }
            }
          } else {
            // Sincronizar desde Supabase a local
            const updatedCourses = { ...currentCourses };
            for (const dbCourse of dbCourses) {
              const courseKey = Object.keys(updatedCourses).find(key => 
                updatedCourses[key].fullname.toLowerCase() === dbCourse.fullname.toLowerCase()
              );

              if (!courseKey) continue;

              const { data: dbAssigns, error: assignErr } = await supabaseClient
                .from('moodle_assignments')
                .select('*')
                .eq('course_id', dbCourse.id);

              if (!assignErr && dbAssigns) {
                dbAssigns.forEach((dbAssign: { moodle_assign_id: number; submitted: boolean }) => {
                  const localAssign = updatedCourses[courseKey].assignments.find((a: Assignment) => a.id === dbAssign.moodle_assign_id);
                  if (localAssign) {
                    localAssign.status = dbAssign.submitted ? 'completado' : 'pendiente';
                  }
                });
              }
            }
            calculateAndSetProgress(updatedCourses);
          }
        }
      }
    } catch (e) {
      console.error("Error sincronizando Supabase:", e);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      if (typeof window !== 'undefined') {
        const demo = localStorage.getItem('is_demo');

        if (demo === 'true') {
          // --- MODO DEMO ---
          const user = localStorage.getItem('study_user');
          const univ = localStorage.getItem('study_university');
          if (!user || !univ) {
            window.location.href = '/login';
            return;
          }

          const onboardingCompleted = localStorage.getItem('med224_completed');
          if (!onboardingCompleted) {
            window.location.href = '/onboarding';
            return;
          }
        } else {
          // --- MODO PRODUCCIÓN (Supabase) ---
          try {
            const { data: { session }, error: sessionErr } = await supabaseClient.auth.getSession();
            if (sessionErr || !session || !session.user) {
              window.location.href = '/login';
              return;
            }

            const email = session.user.email ?? '';
            const user = email.split('@')[0] ?? 'Estudiante';
            
            localStorage.setItem('study_email', email);
            localStorage.setItem('study_user', user);
            localStorage.setItem('study_university', 'UCE');
            localStorage.setItem('is_demo', 'false');

            // Consultar si el estudiante ya completó el onboarding en DB
            const { data: student, error: studentErr } = await supabaseClient
              .from('students')
              .select('completed_med224')
              .eq('auth_id', session.user.id)
              .maybeSingle();

            if (studentErr) {
              console.error("Error al obtener estudiante:", studentErr);
            }

            if (student && student.completed_med224) {
              localStorage.setItem('med224_completed', 'true');
            } else {
              localStorage.removeItem('med224_completed');
              window.location.href = '/onboarding';
              return;
            }

            // Sincronizar desde Supabase (usa ref para evitar dependencia reactiva)
            await syncFromSupabase(user, coursesRef.current);

          } catch (e) {
            console.error("Error en flujo de autenticación de producción:", e);
            window.location.href = '/login';
          }
        }
      }
    };

    checkAuthAndOnboarding();
  // courses se lee via coursesRef.current para evitar el bucle:
  // setCourses → re-run effect → setCourses → ...
  }, [syncFromSupabase]);

  const toggleTaskStatus = async (courseKey: string, type: 'assignment' | 'exam', id: number, isChecked: boolean) => {
    const updatedCourses = { ...courses };
    const course = updatedCourses[courseKey];
    if (!course) return;

    // --- TRACK FATIGUE AND ERRORS ---
    setResponseCount(prev => prev + 1);
    if (isChecked) {
      setConsecutiveErrors(0);
    } else {
      setErrorCount(prev => prev + 1);
      setConsecutiveErrors(prev => {
        const next = prev + 1;
        if (next >= 4) {
          setShowBurnoutModal(true);
        }
        return next;
      });
    }

    const newStatus = isChecked ? 'completado' : 'pendiente';

    if (type === 'assignment') {
      const assign = course.assignments.find((a: Assignment) => a.id === id);
      if (assign) {
        assign.status = newStatus;
        if (!isDemoMode) {
          try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
              await supabaseClient
                .from('moodle_assignments')
                .update({ submitted: isChecked })
                .eq('user_id', user.id)
                .eq('moodle_assign_id', id);
            }
          } catch (e) {
            console.error("Fallo al actualizar asignación en DB:", e);
          }
        }
      }
    } else {
      const exam = course.exams.find((e: Exam) => e.id === id);
      if (exam) {
        exam.status = newStatus;
      }
    }

    calculateAndSetProgress(updatedCourses);
  };

  const handleLogout = () => {
    localStorage.removeItem('study_user');
    localStorage.removeItem('study_university');
    localStorage.removeItem('study_email');
    localStorage.removeItem('is_demo');
    localStorage.removeItem('study_courses_state');

    if (supabaseClient && !isDemoMode) {
      supabaseClient.auth.signOut().finally(() => {
        window.location.href = '/login';
      });
    } else {
      window.location.href = '/login';
    }
  };

  const currentCourse = currentCourseKey ? courses[currentCourseKey] : null;

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-gray-100 pb-16 relative overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* ENCABEZADO */}
        <header className="glass rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-2xl border-l-4 border-l-blue-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 tracking-wider">
                  {(UNIVERSITY_TITLES[studentUniv] || studentUniv).toUpperCase()}
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 uppercase">
                  Área de Medicina
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase ${
                  isDemoMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'
                }`}>
                  {isDemoMode ? 'Modo Demo Comercial' : 'Modo Producción'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold mt-3 tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                Portal Académico Inteligente
              </h1>
              <p className="text-gray-400 text-sm mt-1">Multi-Curso de Repasos y Autoevaluación Clínica en Tiempo Real</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 text-xl select-none">
                  🩺
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Estudiante</p>
                  <p className="text-sm font-bold text-gray-200">{studentUser} - {studentUniv}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Cerrar Sesión"
              >
                <span>🚪</span> <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Progreso Global */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>PROGRESO ACADÉMICO GLOBAL: <strong className="text-blue-400 font-mono">{globalProgress}%</strong></span>
              <span className="text-blue-400">7 CURSOS DETECTADOS</span>
            </div>
            <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${globalProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Métricas de Cognición y Fatiga Emocional */}
          <div className="mt-6 border-t border-gray-800/80 pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {/* Medidor de Fatiga */}
            {(() => {
              const fatigue = calculateFatigue(sessionSeconds, responseCount, errorCount);
              let barColor = "from-green-500 to-emerald-500";
              let textColor = "text-green-400";
              let label = "Óptimo (Foco Alto)";
              if (fatigue > 75) {
                barColor = "from-red-500 to-rose-500";
                textColor = "text-red-400";
                label = "Crítico (Requiere Pausa)";
              } else if (fatigue > 40) {
                barColor = "from-yellow-500 to-amber-500";
                textColor = "text-yellow-400";
                label = "Moderado (Fatiga Leve)";
              }
              return (
                <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-1">
                      <span>MEDIDOR DE FATIGA COGNITIVA</span>
                      <span className={`font-mono ${textColor}`}>{fatigue}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-900">
                      <div
                        className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${fatigue}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Estado: <span className={`font-bold ${textColor}`}>{label}</span></p>
                </div>
              );
            })()}

            {/* Clinical Readiness Score */}
            {(() => {
              const readiness = calculateClinicalReadiness(
                globalProgress,
                100,
                simulatorAccuracy,
                osceScore
              );
              return (
                <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-1">
                      <span>PREPARACIÓN CLÍNICA (ACREDITACIÓN UCE)</span>
                      <span className="font-mono text-cyan-400 font-bold">{readiness}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-900">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${readiness}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Calificación UCE: <span className="font-bold text-cyan-400">{readiness >= 70 ? 'Listo para Rotación' : 'Refuerzo Pendiente'}</span></p>
                </div>
              );
            })()}

            {/* Copywriting Neurocognitivo / Zonas de Olvido */}
            <div className="bg-gray-900/30 border border-gray-800/60 p-4 rounded-2xl flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Sistemas con mayor riesgo de olvido clínico</span>
                <p className="text-[11px] text-gray-300 leading-relaxed italic">
                  &quot;Tu cerebro está listo para reforzar esta memoria antes de que se degrade. Planifica tus repasos activos hoy.&quot;
                </p>
              </div>
              <p className="text-[9px] text-gray-500 mt-2">Basado en el algoritmo SM-2 UCE</p>
            </div>

          </div>
        </header>

        {/* Sección de Cursos */}
        <h2 className="text-2xl font-display font-bold mb-6 text-gray-100 flex items-center gap-2">
          <span>📚</span> Selecciona un Curso para Estudiar
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(courses).map(key => {
            const course = courses[key];
            const colors = COLOR_CLASSES[course.color] || COLOR_CLASSES.blue;

            return (
              <div
                key={key}
                className={`glass border ${colors.border} rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between premium-card`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-4xl p-3 rounded-2xl select-none border border-opacity-50 block leading-none w-16 h-16 text-center leading-[48px] bg-opacity-20 bg-blue-500 border-blue-400">
                      {course.icon}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${colors.badge}`}>
                      {course.status}
                    </span>
                  </div>
                  
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{course.code}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">Progreso: <strong className="text-gray-200">{course.progress}%</strong></span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-gray-100 mt-2">{course.fullname}</h3>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{course.description}</p>

                  <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mt-4 p-0.5 border border-gray-800">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-505`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <a
                    href={`/repaso/${key}`}
                    className="block text-center w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all transform active:scale-[0.98] cursor-pointer"
                  >
                    Estudiar Repaso Interactivo
                  </a>
                  {key === 'semiologia' && (
                    <div className="space-y-2">
                      <Link
                        href="/auscultacion"
                        className="block text-center w-full py-2.5 bg-[#0e1629] hover:bg-[#15203c] text-cyan-400 border border-cyan-500/20 font-bold text-xs rounded-xl shadow-md transition-all transform active:scale-[0.98] cursor-pointer"
                      >
                        🔊 Laboratorio de Auscultación UCE
                      </Link>
                      <Link
                        href="/abdomen"
                        className="block text-center w-full py-2.5 bg-[#121020] hover:bg-[#1b1830] text-purple-400 border border-purple-500/20 font-bold text-xs rounded-xl shadow-md transition-all transform active:scale-[0.98] cursor-pointer"
                      >
                        🩺 Simulador de Abdomen, Cuello y Tórax
                      </Link>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={course.syllabusLink}
                      target="_blank"
                      className="block text-center py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 font-semibold text-[10px] rounded-lg transition-all"
                    >
                      Syllabus
                    </a>
                    <a
                      href={course.notesLink}
                      target="_blank"
                      className="block text-center py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 font-semibold text-[10px] rounded-lg transition-all"
                    >
                      Notas
                    </a>
                    <button
                      onClick={() => {
                        setCurrentCourseKey(key);
                        setDetailOpen(true);
                      }}
                      className="block text-center py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-[10px] rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                    >
                      Actividades
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Instrucciones del Guardian */}
        <div className="mt-12 glass rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-200 mb-3 font-display">⚙️ ¿Cómo funciona el Guardián Multi-Curso?</h3>
          <div className="text-sm text-gray-400 space-y-2 leading-relaxed">
            <p>1. Coloca las grabaciones de clases de Teams (.vtt, .srt, .mp4, .mp3, etc.) dentro de la subcarpeta del curso correspondiente en <code className="text-blue-400 font-mono">teams_recordings/&lt;curso&gt;/</code>.</p>
            <p>2. El Guardián procesará automáticamente el archivo, generará las notas en <code className="text-blue-400 font-mono">public/&lt;curso&gt;/notas_clase.txt</code>, y producirá el repaso interactivo (<code className="text-blue-400 font-mono">repaso.html</code> y <code className="text-blue-400 font-mono">repaso.md</code>).</p>
            <p>3. El panel superior se mantendrá actualizado para que puedas estudiar directamente.</p>
          </div>
        </div>

      </div>

      {/* BACKDROP DETALLES */}
      <div
        className={`fixed inset-0 bg-[#060913]/70 backdrop-blur-sm z-40 transition-all duration-300 ${
          detailOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setDetailOpen(false)}
      ></div>

      {/* PANEL LATERAL DESLIZANTE */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#0b0f19]/97 border-l border-gray-800/80 shadow-2xl z-50 transition-transform duration-350 ease-out flex flex-col ${
          detailOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {currentCourse && (
          <>
            <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-gray-950/40">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded">
                  {currentCourse.code}
                </span>
                <h3 className="text-xl font-display font-bold text-gray-100 mt-2">{currentCourse.fullname}</h3>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Progreso del curso */}
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4">
                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
                  <span>PROGRESO DE LA ASIGNATURA</span>
                  <span className="text-blue-400 font-mono font-bold">{currentCourse.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-900">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentCourse.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Objetivos */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🎯 Objetivos del Syllabus</h4>
                <ul className="space-y-2 bg-gray-900/20 border border-gray-800/60 p-4 rounded-2xl text-xs text-gray-300 leading-relaxed">
                  {currentCourse.objectives.map((obj: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-blue-400 mt-0.5 select-none">✓</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deberes */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📝 Deberes y Tareas</h4>
                <div className="space-y-3">
                  {currentCourse.assignments.map((assign: Assignment) => {
                    const isCompleted = assign.status === 'completado';
                    return (
                      <label
                        key={assign.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none bg-gray-900/40 border-gray-800/80 hover:bg-gray-900/80 hover:border-gray-700/80"
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => toggleTaskStatus(currentCourseKey!, 'assignment', assign.id, e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-offset-2 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`text-xs font-semibold text-gray-200 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {assign.title}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">Vence: {assign.due}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Exámenes */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📅 Exámenes y Evaluaciones</h4>
                <div className="space-y-3">
                  {currentCourse.exams.map((exam: Exam) => {
                    const isCompleted = exam.status === 'completado';
                    return (
                      <label
                        key={exam.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none bg-gray-900/40 border-gray-800/80 hover:bg-gray-900/80 hover:border-gray-700/80"
                      >
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => toggleTaskStatus(currentCourseKey!, 'exam', exam.id, e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-offset-2 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`text-xs font-semibold text-gray-200 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {exam.title}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">Fecha: {exam.date}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800/80 bg-gray-950/40 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Técnicas de Aprendizaje Activo (Active Recall)</p>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE PREVENCIÓN DE BURNOUT */}
      {showBurnoutModal && (
        <div className="fixed inset-0 bg-[#060913]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl text-center space-y-6 animate-fade-slide">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-3xl select-none animate-pulse">
              ⚠️
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-100 font-display">Alerta de Sobrecarga Cognitiva</h3>
              <p className="text-xs text-red-400 font-mono tracking-widest uppercase">Prevención de Burnout Clínico</p>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
              Se ha detectado fatiga en tus respuestas o tiempo de estudio excesivo (más de 45 minutos continuos). 
              Para garantizar la consolidación de memorias clínicas a largo plazo en tu corteza cerebral, 
              **la cátedra sugiere firmemente tomar un descanso de 15 minutos.**
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDismissBurnout}
                className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition-all cursor-pointer"
              >
                Seguiré bajo mi propio riesgo
              </button>
              <button
                onClick={() => { handleDismissBurnout(); handleLogout(); }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                Tomar Descanso (Cerrar)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
