/**
 * Feature flags del sistema MED-228 NeuroAdaptive Platform
 * Controlan qué funcionalidades están activas por fase.
 *
 * FASE 1: ENABLE_MOODLE_SYNC = false, ENABLE_VOICE_AI = false
 * FASE 2: ENABLE_MOODLE_SYNC = false, ENABLE_ADAPTIVE_REVIEW = true
 * FASE 3: ENABLE_MOODLE_SYNC = true  ← único momento para activar
 * FASE 4: ENABLE_VOICE_AI = true
 */

export const FEATURE_FLAGS = {
  // ─── FASE 1 ──────────────────────────────────────────────
  ENABLE_RAG_SEARCH:       true,   // ✅ Activo desde Fase 1
  ENABLE_NOTEBOOK_GEN:     true,   // ✅ Activo desde Fase 1
  ENABLE_OFFLINE_MODE:     true,   // ✅ SIEMPRE activo (no negociable)

  // ─── FASE 2 ──────────────────────────────────────────────
  ENABLE_ADAPTIVE_REVIEW:  true,   // ✅ Activo en Fase 2
  ENABLE_FLASHCARDS:       true,   // ✅ Activo en Fase 2
  ENABLE_BASELINE_DIAG:    true,   // ✅ Activo en Fase 2

  // ─── FASE 3 (Activo) ───────────────────────────────
  // PATCH B-02: ACTIVADO para Fase 3
  ENABLE_MOODLE_SYNC:      true,  // ✅ Fase 3 active

  // ─── FASE 4 (aún inactivo) ───────────────────────────────
  ENABLE_VOICE_AI:         false,  // 🚫 Fase 4 only
  ENABLE_VIRTUAL_PATIENTS: true,   // ✅ Fase 3 active
  ENABLE_OSCE_SIM:         true,   // ✅ Fase 3 active
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/** Helper: verificar si un flag está activo */
export function isEnabled(flag: FeatureFlag): boolean {
  if (typeof window !== 'undefined') {
    // Allow override via localStorage for testing and staging deployment
    const override = localStorage.getItem(`FEATURE_FLAG_${flag}`);
    if (override !== null) {
      return override === 'true';
    }
  }
  return FEATURE_FLAGS[flag];
}
