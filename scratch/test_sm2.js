// Test de la lógica SM-2 traducida a JavaScript para ejecución inmediata en Node

function calculateSM2(quality, prevRepetitions, prevInterval, prevEF = 2.5) {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let nextEF = prevEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  nextEF = Math.max(1.3, Math.min(5.0, nextEF));
  
  let nextRepetitions = 0;
  let nextIntervalDays = 1;
  
  if (q >= 3) {
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
    nextRepetitions = 0;
    nextIntervalDays = 1;
  }
  
  return {
    repetitions: nextRepetitions,
    intervalDays: Math.max(1, nextIntervalDays),
    easeFactor: parseFloat(nextEF.toFixed(2))
  };
}

// Escenarios de Prueba
console.log("=== TESTS DEL ALGORITMO SM-2 ===");

// 1. Respuesta Perfecta (q=5) en primera repetición
console.log("1. Calidad 5 (primera vez):", calculateSM2(5, 0, 0, 2.5));
// Esperado: repetitions=1, intervalDays=1, easeFactor=2.6 (2.5 + 0.1)

// 2. Respuesta Perfecta (q=5) en segunda repetición
console.log("2. Calidad 5 (segunda vez):", calculateSM2(5, 1, 1, 2.6));
// Esperado: repetitions=2, intervalDays=6, easeFactor=2.7

// 3. Respuesta Perfecta (q=5) en tercera repetición
console.log("3. Calidad 5 (tercera vez):", calculateSM2(5, 2, 6, 2.7));
// Esperado: repetitions=3, intervalDays=Math.round(6 * 2.8) = 17, easeFactor=2.8

// 4. Fallo absoluto (q=0)
console.log("4. Calidad 0 (fallo):", calculateSM2(0, 3, 17, 2.8));
// Esperado: repetitions=0, intervalDays=1, easeFactor=Math.max(1.3, 2.8 + (0.1 - 5*(0.08+5*0.02))) = 2.8 + (0.1 - 5*(0.18)) = 2.8 - 0.8 = 2.0

// 5. Límite inferior de Ease Factor (q=0 repetido)
console.log("5. Calidad 0 (Límite inferior EF):", calculateSM2(0, 0, 1, 1.4));
// Esperado: easeFactor=1.3 (no baja de 1.3)

// 6. Límite superior de Ease Factor (q=5 repetido)
console.log("6. Calidad 5 (Límite superior EF):", calculateSM2(5, 4, 10, 4.95));
// Esperado: easeFactor=5.0 (no sube de 5.0)

console.log("=== FIN DE LOS TESTS ===");
