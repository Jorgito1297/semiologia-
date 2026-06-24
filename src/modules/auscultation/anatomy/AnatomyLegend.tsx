import React from 'react';

export const AnatomyLegend: React.FC = () => {
  return (
    <div className="w-full glass rounded-2xl p-4 space-y-3 border border-gray-800/60">
      <div className="flex justify-between items-center border-b border-gray-800/40 pb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Leyenda de Simulación</span>
        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">Guía Clínica</span>
      </div>

      <div className="space-y-2.5 text-xs text-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-red-950/40 border border-red-500/50 flex items-center justify-center text-[9px] font-bold text-red-400 font-mono">
            H
          </div>
          <div>
            <span className="font-semibold text-gray-200 block">Foco de Auscultación Cardíaco (🫀)</span>
            <span className="text-[10px] text-gray-400">Evalúa soplos, R1/R2, clicks y desdoblamientos.</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center text-[9px] font-bold text-cyan-400 font-mono">
            L
          </div>
          <div>
            <span className="font-semibold text-gray-200 block">Campo Pulmonar (🫁)</span>
            <span className="text-[10px] text-gray-400">Evalúa murmullo vesicular, crepitantes, sibilancias y roncus.</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800/40 text-[10px] text-gray-400 leading-relaxed italic">
        💡 <strong>Recomendación:</strong> Utiliza auriculares para percibir correctamente las frecuencias bajas de los ruidos cardíacos (S1/S2) y soplos.
      </div>
    </div>
  );
};
export default AnatomyLegend;
