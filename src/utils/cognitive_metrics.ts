/**
 * Capa de Cognición Motivacional y Métricas Emocionales
 * MED-228 NeuroAdaptive Platform (UCE)
 */

export interface MemoryRiskInfo {
  label: string;
  style: string;
  copywriting: string;
}

/**
 * Calcula el nivel de fatiga cognitiva del estudiante (0 - 100)
 * Basado en la duración de la sesión y el rendimiento reciente
 */
export function calculateFatigue(
  sessionSeconds: number,
  responseCount: number,
  errorCount: number
): number {
  // Base de fatiga por tiempo transcurrido (porcentaje lineal hasta 45 minutos)
  const timeFatigue = Math.min(100, (sessionSeconds / 2700) * 70); // Máximo 70 puntos de fatiga por tiempo
  
  // Penalización por errores consecutivos y volumen de respuestas
  let performancePenalty = 0;
  if (responseCount > 0) {
    const errorRate = errorCount / responseCount;
    performancePenalty = errorRate * 30; // Máximo 30 puntos por errores
  }

  const totalFatigue = Math.round(timeFatigue + performancePenalty);
  return Math.min(100, Math.max(0, totalFatigue));
}

/**
 * Traduce el estado matemático de la repetición espaciada (next_review_at) 
 * a una advertencia empática de decaimiento de memoria (copywriting neurocognitivo).
 */
export function getMemoryRiskStatus(
  nextReviewAtStr: string | null | undefined,
  easeFactor: number
): MemoryRiskInfo {
  if (!nextReviewAtStr) {
    return {
      label: "Nueva memoria",
      style: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      copywriting: "Esta memoria está lista para ser sembrada en tu corteza cerebral."
    };
  }

  const nextReviewAt = new Date(nextReviewAtStr);
  const now = new Date();
  const diffHours = (nextReviewAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    // Vencida
    return {
      label: "Memoria degradada",
      style: "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse",
      copywriting: "Tu cerebro está perdiendo esta memoria clínica. Refuérzala de inmediato."
    };
  } else if (diffHours <= 24) {
    // Próxima en 24 horas
    return {
      label: "Memoria vulnerable",
      style: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      copywriting: "Esta huella de memoria se está debilitando. Refuérzala antes de que se degrade."
    };
  } else {
    // Consolidada
    const label = easeFactor >= 2.8 ? "Memoria consolidada" : "Memoria en maduración";
    const style = easeFactor >= 2.8 ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    return {
      label,
      style,
      copywriting: `Memoria clínicamente estable para las próximas semanas (Ease Factor: ${easeFactor.toFixed(2)}).`
    };
  }
}

/**
 * Calcula el Clinical Readiness Score combinando:
 * 1. Porcentaje de chunks de contenido revisados/estudiados
 * 2. Promedio de precisión en el simulador de paciente virtual
 * 3. Promedio de éxito en las estaciones OSCE
 */
export function calculateClinicalReadiness(
  reviewedChunksCount: number,
  totalActiveChunks: number,
  simulatorAccuracyPct: number,
  osceSuccessPct: number
): number {
  if (totalActiveChunks === 0) return 0;
  
  // Ponderaciones oficiales UCE
  // 30% cobertura de contenido (chunks revisados)
  // 40% precisión en paciente virtual
  // 30% rendimiento en OSCE
  const coverageWeight = 0.30;
  const simulatorWeight = 0.40;
  const osceWeight = 0.30;

  const coverageScore = Math.min(100, (reviewedChunksCount / totalActiveChunks) * 100);
  
  const readiness = (coverageScore * coverageWeight) + 
                    (simulatorAccuracyPct * simulatorWeight) + 
                    (osceSuccessPct * osceWeight);

  return Math.round(readiness);
}

/**
 * Determina si se debe disparar la alerta de prevención de burnout (sobrecarga)
 */
export function shouldTriggerBurnoutIntervention(
  sessionSeconds: number,
  consecutiveErrors: number
): boolean {
  // Alerta si el estudiante lleva más de 45 minutos (2700s) continuos
  if (sessionSeconds >= 2700) {
    return true;
  }

  // Alerta si comete más de 4 errores consecutivos (fatiga de razonamiento rápida)
  if (consecutiveErrors >= 4) {
    return true;
  }

  return false;
}
