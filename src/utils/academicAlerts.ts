/**
 * Motor de Alertas Académicas
 * MED-228 NeuroAdaptive Platform (UCE)
 */

export interface AcademicAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: 'deterioro_competencia' | 'inactividad_prolongada' | 'bajo_desempeno';
  severity: 'CRITICA' | 'MEDIA' | 'BAJA';
  description: string;
  recommendedAction: string;
  details?: string;
  createdAt: string;
}

export interface StudentMemoryStateExtended {
  id: string;
  student_id: string;
  chunk_id: string;
  memory_domain: 'semantic' | 'procedural' | 'executive' | 'perceptual';
  accuracy_pct: number;
  ease_factor: number;
  last_reviewed_at: string | null;
  content_chunks?: {
    topic: string;
    cg_competencies: string[];
  };
}

export interface StudentProfileWithActivity {
  id: string;
  full_name: string;
  email: string;
  last_active: string | null;
  med224_baseline_score: number | null;
  completed_med224: boolean;
}

/**
 * Analiza el rendimiento y actividad de un estudiante para generar alertas académicas.
 */
export function analyzeStudentAlerts(
  student: StudentProfileWithActivity,
  memoryStates: StudentMemoryStateExtended[]
): AcademicAlert[] {
  const alerts: AcademicAlert[] = [];
  const now = new Date();

  // 1. Alerta de Inactividad Prolongada (48 horas)
  if (student.last_active) {
    const lastActiveDate = new Date(student.last_active);
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 48) {
      alerts.push({
        id: `inactivity-${student.id}`,
        studentId: student.id,
        studentName: student.full_name,
        type: 'inactividad_prolongada',
        severity: diffHours >= 96 ? 'CRITICA' : 'MEDIA',
        description: `El estudiante lleva ${Math.round(diffHours)} horas sin registrar actividad en la plataforma.`,
        recommendedAction: 'Enviar recordatorio por Microsoft Teams o correo institucional para reanudar el repaso espaciado.',
        details: `Último acceso: ${lastActiveDate.toLocaleString('es-ES')}`,
        createdAt: now.toISOString()
      });
    }
  } else {
    // Nunca ha accedido
    alerts.push({
      id: `inactivity-never-${student.id}`,
      studentId: student.id,
      studentName: student.full_name,
      type: 'inactividad_prolongada',
      severity: 'CRITICA',
      description: 'El estudiante nunca ha iniciado sesión o completado el onboarding en la plataforma.',
      recommendedAction: 'Verificar si tiene problemas de acceso con SSO (Microsoft Entra ID) y asistirlo académicamente.',
      details: 'Sin registro de último acceso',
      createdAt: now.toISOString()
    });
  }

  // Si no tiene estados de memoria y nunca entró, no evaluamos rendimiento para no duplicar alertas
  if (memoryStates.length === 0) {
    // Si su puntuación diagnóstica inicial es muy baja, alertar
    if (student.med224_baseline_score !== null && student.med224_baseline_score < 60) {
      alerts.push({
        id: `low-baseline-${student.id}`,
        studentId: student.id,
        studentName: student.full_name,
        type: 'bajo_desempeno',
        severity: 'MEDIA',
        description: `Bajo puntaje en la evaluación diagnóstica inicial de prerrequisitos (MED-224): ${student.med224_baseline_score}/100.`,
        recommendedAction: 'Proveer material remedial de propedéutica I antes de iniciar las simulaciones clínicas avanzadas.',
        details: `Puntaje inicial: ${student.med224_baseline_score}`,
        createdAt: now.toISOString()
      });
    }
    return alerts;
  }

  // 2. Alerta de Deterioro de Competencias (CG6 - Historia Clínica o CG8 - Procedimiento Diagnóstico)
  // Requisito: ease_factor < 1.8 en más del 30% de los temas evaluados en esa competencia.
  const cgCompetenciesToTrack = ['CG6', 'CG8'];
  
  cgCompetenciesToTrack.forEach(cg => {
    // Filtrar estados de memoria que pertenecen a esta competencia
    const cgStates = memoryStates.filter(state => {
      const competencies = state.content_chunks?.cg_competencies || [];
      return competencies.includes(cg);
    });

    if (cgStates.length >= 3) { // Evaluamos si tiene al menos 3 registros
      const lowEaseStates = cgStates.filter(state => state.ease_factor < 1.8);
      const lowEasePct = (lowEaseStates.length / cgStates.length) * 100;

      if (lowEasePct >= 30) {
        const cgLabel = cg === 'CG6' ? 'CG6 (Historia Clínica Integral)' : 'CG8 (Procedimiento Diagnóstico)';
        alerts.push({
          id: `decay-${cg}-${student.id}`,
          studentId: student.id,
          studentName: student.full_name,
          type: 'deterioro_competencia',
          severity: lowEasePct >= 50 ? 'CRITICA' : 'MEDIA',
          description: `Deterioro cognitivo en la competencia ${cgLabel}. El ${Math.round(lowEasePct)}% de los conceptos clínicos evaluados presentan dificultad severa (Ease Factor < 1.80).`,
          recommendedAction: `Asignar sesión socrática remedial sobre ${cg === 'CG6' ? 'anamnesis y redacción de antecedentes' : 'técnicas específicas de exploración física y maniobras'}.`,
          details: `${lowEaseStates.length} de ${cgStates.length} tarjetas con Ease Factor crítico.`,
          createdAt: now.toISOString()
        });
      }
    }
  });

  // 3. Alerta de Bajo Desempeño General (Precisión promedio < 60% o diagnóstico < 60% con baja precisión)
  const totalReviews = memoryStates.reduce((sum, state) => sum + (state.accuracy_pct > 0 ? 1 : 0), 0);
  if (totalReviews >= 5) {
    const avgAccuracy = memoryStates.reduce((sum, state) => sum + Number(state.accuracy_pct), 0) / memoryStates.length;
    
    if (avgAccuracy < 60) {
      alerts.push({
        id: `low-perf-${student.id}`,
        studentId: student.id,
        studentName: student.full_name,
        type: 'bajo_desempeno',
        severity: avgAccuracy < 50 ? 'CRITICA' : 'MEDIA',
        description: `Riesgo académico por bajo desempeño. La precisión media en repasos y simulaciones es de ${avgAccuracy.toFixed(1)}% (umbral mínimo requerido de acreditación: 60%).`,
        recommendedAction: 'Revisar la bitácora de errores del simulador de paciente virtual y programar tutoría presencial.',
        details: `Precisión promedio: ${avgAccuracy.toFixed(1)}% en ${memoryStates.length} conceptos activos.`,
        createdAt: now.toISOString()
      });
    }
  }

  return alerts;
}
