/**
 * Algoritmo SuperMemo-2 (SM-2) para Repaso Espaciado
 * 
 * Calcula el próximo intervalo de repaso, el número de repeticiones consecutivas
 * y el factor de facilidad (Ease Factor) basado en la calidad de la respuesta.
 */

export interface SM2State {
  repetitions: number; // Repeticiones consecutivas correctas
  intervalDays: number; // Intervalo en días hasta el próximo repaso
  easeFactor: number;   // Factor de facilidad (Ease Factor) de aprendizaje
}

/**
 * Calcula los nuevos valores de repetición basándose en la respuesta del estudiante.
 * 
 * @param quality Calidad de la respuesta (0 = Olvido completo, 5 = Respuesta perfecta)
 * @param prevRepetitions Repeticiones previas
 * @param prevInterval Días transcurridos hasta este repaso
 * @param prevEF Factor de facilidad previo (por defecto 2.5)
 */
export function calculateSM2(
  quality: number,
  prevRepetitions: number,
  prevInterval: number,
  prevEF: number = 2.5
): SM2State {
  // Asegurar que la calidad de respuesta esté en rango 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  
  // 1. Calcular el nuevo Ease Factor (EF')
  // Fórmula clásica: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let nextEF = prevEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  // Limitar el Ease Factor al rango obligatorio (1.3 - 5.0)
  nextEF = Math.max(1.3, Math.min(5.0, nextEF));
  
  let nextRepetitions = 0;
  let nextIntervalDays = 1;
  
  // 2. Calcular repeticiones e intervalo
  if (q >= 3) {
    // Respuesta correcta
    if (prevRepetitions === 0) {
      nextRepetitions = 1;
      nextIntervalDays = 1;
    } else if (prevRepetitions === 1) {
      nextRepetitions = 2;
      nextIntervalDays = 6;
    } else {
      nextRepetitions = prevRepetitions + 1;
      nextIntervalDays = Math.round(prevInterval * nextEF);
    }
  } else {
    // Respuesta incorrecta (reinicio de secuencia de repeticiones)
    nextRepetitions = 0;
    nextIntervalDays = 1;
  }
  
  // Asegurar que el intervalo sea al menos 1 día
  nextIntervalDays = Math.max(1, nextIntervalDays);
  
  return {
    repetitions: nextRepetitions,
    intervalDays: nextIntervalDays,
    easeFactor: parseFloat(nextEF.toFixed(2)) // Redondear a 2 decimales para limpieza
  };
}
