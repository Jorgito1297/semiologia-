'use client';

import React from 'react';
import { useAnatomyStore } from '../stores/anatomy.store';
import { useAudioStore } from '../stores/audio.store';
import { useQuizStore } from '../stores/quiz.store';
import { useSimulationStore } from '../stores/simulation.store';
import { HOTSPOTS } from '../constants';
import { PersistenceManager } from '../persistence/PersistenceManager';

export const QuizComponent: React.FC = () => {
  const selectedHotspotId = useAnatomyStore((state) => state.selectedHotspotId);
  const soundMode = useAudioStore((state) => state.soundMode);
  const view = useAnatomyStore((state) => state.view);
  const simulationMode = useSimulationStore((state) => state.simulationMode);

  const quizScore = useQuizStore((state) => state.quizScore);
  const quizAttemptedCount = useQuizStore((state) => state.quizAttemptedCount);
  const quizSubmitted = useQuizStore((state) => state.quizSubmitted);
  const selectedQuizOpt = useQuizStore((state) => state.selectedQuizOpt);
  const submitAnswer = useQuizStore((state) => state.submitAnswer);

  if (!selectedHotspotId) return null;

  const hotspot = HOTSPOTS[selectedHotspotId];
  if (!hotspot || !hotspot.quiz) return null;

  const handleAnswerClick = async (oIdx: number) => {
    if (quizSubmitted) return;

    // 1. Update store state (updates score & submission status)
    submitAnswer(hotspot.quiz.correctIndex, oIdx);

    // 2. Persist session through the hybrid persistence layer
    const isCorrect = oIdx === hotspot.quiz.correctIndex;
    try {
      await PersistenceManager.saveSession({
        focus_id: hotspot.id,
        layer: hotspot.type,
        diagnosis: hotspot.quiz.options[oIdx],
        is_correct: isCorrect,
        score: isCorrect ? 1 : 0,
        metadata: {
          soundMode,
          view,
          simulationMode,
          clinicalFinding: hotspot.oye,
          timeSpentMs: 0, // expandable in future updates
        },
      });
    } catch (err) {
      console.error('[QuizComponent] Error saving session:', err);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
          Mini-Cuestionario Clínico
        </h4>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
          Puntaje: {quizScore} / {quizAttemptedCount}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-gray-900/30 border border-gray-800/80 space-y-4">
        <p className="text-xs font-semibold text-gray-200 leading-relaxed">
          {hotspot.quiz.question}
        </p>

        <div className="space-y-2.5">
          {hotspot.quiz.options.map((opt, oIdx) => {
            const isCorrect = oIdx === hotspot.quiz.correctIndex;
            const isSelected = selectedQuizOpt === oIdx;

            let optStyle = "border-gray-800 bg-gray-900/10 text-gray-300 hover:bg-gray-900/30 hover:border-gray-750";
            if (quizSubmitted) {
              if (isCorrect) {
                optStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
              } else if (isSelected) {
                optStyle = "border-rose-500/30 bg-rose-500/10 text-rose-400";
              } else {
                optStyle = "border-gray-900 bg-gray-950/20 text-gray-500 pointer-events-none";
              }
            } else if (isSelected) {
              optStyle = "border-indigo-500/40 bg-indigo-500/10 text-indigo-300";
            }

            return (
              <button
                key={oIdx}
                disabled={quizSubmitted}
                onClick={() => handleAnswerClick(oIdx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 cursor-pointer ${optStyle}`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-850 text-[10px] font-bold text-gray-400 border border-gray-700">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Answer justification */}
        {quizSubmitted && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-gray-300 leading-relaxed animate-fadeIn">
            <p className="font-bold text-indigo-400 mb-1">
              {selectedQuizOpt === hotspot.quiz.correctIndex ? '✅ Respuesta Correcta' : '❌ Respuesta Incorrecta'}
            </p>
            <p>{hotspot.quiz.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default QuizComponent;
