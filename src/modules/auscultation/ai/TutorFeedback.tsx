'use client';

import React from 'react';
import { useAnatomyStore } from '../stores/anatomy.store';
import { useQuizStore } from '../stores/quiz.store';
import { HOTSPOTS } from '../constants';

export const TutorFeedback: React.FC = () => {
  const selectedHotspotId = useAnatomyStore((state) => state.selectedHotspotId);
  const quizScore = useQuizStore((state) => state.quizScore);
  const quizAttemptedCount = useQuizStore((state) => state.quizAttemptedCount);

  if (!selectedHotspotId) return null;

  const hotspot = HOTSPOTS[selectedHotspotId];
  if (!hotspot) return null;

  // Calculate local error rate for dynamic feedback
  const errorRate = quizAttemptedCount > 0 ? (quizAttemptedCount - quizScore) / quizAttemptedCount : 0;
  const showReviewWarning = quizAttemptedCount >= 3 && errorRate >= 0.4;

  return (
    <div className="glass rounded-3xl p-6 border border-gray-800 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-800/80 pb-3 flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">
            Tutor Clínico
          </span>
          <h3 className="text-xl font-bold text-gray-100 mt-0.5">Ficha Semiológica Oficial</h3>
        </div>
        <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase">
          {hotspot.type === 'heart' ? 'Cardiovascular' : 'Respiratorio'}
        </span>
      </div>

      {/* The Semiological Trio (Ve, Toca, Oye) */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-cyan-500 pl-2">
          El Trío Semiológico de Cátedra
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* VE */}
          <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80">
            <span className="font-bold text-cyan-400 block mb-1">👁️ Inspección (VE):</span>
            <p className="text-gray-400 leading-relaxed font-sans">{hotspot.ve}</p>
          </div>

          {/* TOCA */}
          <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80">
            <span className="font-bold text-pink-400 block mb-1">🤲 Palpación (TOCA):</span>
            <p className="text-gray-400 leading-relaxed font-sans">{hotspot.toca}</p>
          </div>

          {/* OYE */}
          <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80">
            <span className="font-bold text-emerald-400 block mb-1">👂 Auscultación (OYE):</span>
            <p className="text-gray-400 leading-relaxed font-sans">{hotspot.oye}</p>
          </div>

        </div>
      </div>

      {/* Cátedra Pearl */}
      <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-xs">
        <span className="font-bold text-cyan-400 block mb-1">⭐ Perla de la Cátedra (Dra. Rivas / Argente):</span>
        <p className="text-gray-300 italic leading-relaxed">{hotspot.pearl}</p>
      </div>

      {/* Competency recommendations */}
      {quizAttemptedCount > 0 && (
        <div className="pt-2">
          {showReviewWarning ? (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300 space-y-1">
              <span className="font-bold block">⚠️ Recomendación de Estudio Adaptativo:</span>
              <p className="leading-relaxed">
                Has tenido dificultades al diferenciar los ruidos y soplos en los últimos intentos (tasa de error del {(errorRate * 100).toFixed(0)}%).
                Te sugerimos repasar los capítulos de exploración física del tórax y síndromes valvulares en el <strong>Llanio (Tomo I y II)</strong>.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300 space-y-0.5">
              <span className="font-bold block">🌟 Progreso Clínico Excelente:</span>
              <p className="leading-relaxed">
                Vas por buen camino. Sigue practicando las diferentes patologías para consolidar tu oído semiológico.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export default TutorFeedback;
