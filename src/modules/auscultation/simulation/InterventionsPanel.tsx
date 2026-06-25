'use client';

import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../stores/simulation.store';
import { useAudioStore } from '../stores/audio.store';
import { InterventionType } from '../types';

export const InterventionsPanel: React.FC = () => {
  const currentVitals = useSimulationStore((state) => state.currentVitals);
  const appliedInterventions = useSimulationStore((state) => state.appliedInterventions);
  const lastInterventionMessage = useSimulationStore((state) => state.lastInterventionMessage);
  const applyIntervention = useSimulationStore((state) => state.applyIntervention);
  const resetInterventions = useSimulationStore((state) => state.resetInterventions);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  
  const [isCharging, setIsCharging] = useState(false);
  const [isCharged, setIsCharged] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);

  // Handle Defibrillator Charge sequence simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isCharging) {
      interval = setInterval(() => {
        setChargeLevel((prev) => {
          if (prev >= 100) {
            setIsCharging(false);
            setIsCharged(true);
            return 100;
          }
          return prev + 20; // 5 steps to charge
        });
      }, 300); // 1.5 seconds total charge time
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  const handleCharge = () => {
    if (isCharging || isCharged) return;
    setIsCharging(true);
    setChargeLevel(0);
  };

  const handleShock = () => {
    if (!isCharged) return;
    applyIntervention('defib');
    setIsCharged(false);
    setChargeLevel(0);
  };

  if (!currentVitals) {
    return (
      <div className="glass rounded-2xl p-4 border border-gray-800 bg-[#080d16]/30 flex items-center justify-center h-48 select-none">
        <span className="text-xs text-gray-500 font-mono">Seleccione un escenario clínico para activar el panel.</span>
      </div>
    );
  }

  const hasOxygen = appliedInterventions.includes('oxygen');

  return (
    <div className="w-full glass rounded-2xl p-5 border border-gray-800 bg-[#080d16]/30 flex flex-col gap-5">
      
      {/* Panel Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Panel de Intervenciones Médicas</h3>
        <button
          onClick={resetInterventions}
          className="text-[9px] font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer"
        >
          Reiniciar Paciente
        </button>
      </div>

      {/* Grid of Interventions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Box 1: Respiratory / Oxygen Support */}
        <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-gray-850 bg-gray-950/20">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Soporte Respiratorio</span>
          <button
            onClick={() => applyIntervention('oxygen')}
            className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              hasOxygen
                ? 'bg-cyan-600 text-white border border-cyan-500 shadow-md shadow-cyan-950/20'
                : 'bg-gray-900 hover:bg-gray-850 text-gray-300 border border-gray-850 hover:border-gray-800'
            }`}
          >
            💨 {hasOxygen ? 'Oxigenoterapia Activa' : 'Aplicar O2 (50%)'}
          </button>
          <div className="text-[8px] text-gray-500 font-mono leading-relaxed mt-1">
            Recomendado en SpO2 &lt; 92%. Aumenta el aporte alveolar y normaliza FC de compensación.
          </div>
        </div>

        {/* Box 2: Pharmacology */}
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-gray-850 bg-gray-950/20">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Carro de Paro / Fármacos</span>
          
          <button
            onClick={() => applyIntervention('atropine')}
            className="w-full py-1.5 rounded-lg text-xs font-bold font-mono bg-gray-900 hover:bg-gray-850 text-emerald-400 border border-gray-850 hover:border-gray-800 transition-all cursor-pointer"
          >
            💉 Atropina 1mg IV
          </button>

          <button
            onClick={() => applyIntervention('amiodarone')}
            className="w-full py-1.5 rounded-lg text-xs font-bold font-mono bg-gray-900 hover:bg-gray-850 text-yellow-400 border border-gray-850 hover:border-gray-800 transition-all cursor-pointer"
          >
            💉 Amiodarona 150mg IV
          </button>

          <div className="text-[8px] text-gray-500 font-mono leading-relaxed mt-0.5">
            Atropina: indicado para bradicardias. Amiodarona: antiarrítmico de elección para taquicardias supraventriculares/ventriculares.
          </div>
        </div>

        {/* Box 3: Defibrillator */}
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-gray-850 bg-gray-950/20">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Desfibrilador Monofásico</span>
          
          <div className="flex gap-2">
            {/* Charge Button */}
            <button
              onClick={handleCharge}
              disabled={isCharging || isCharged}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                isCharged
                  ? 'bg-gray-800 text-gray-500 border border-gray-850'
                  : isCharging
                  ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500 animate-pulse'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md shadow-yellow-950/25'
              }`}
            >
              {isCharging ? `Cargando ${chargeLevel}%` : isCharged ? 'Cargado 200J' : 'Cargar 200J'}
            </button>

            {/* Shock Button */}
            <button
              onClick={handleShock}
              disabled={!isCharged}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                isCharged
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-bounce shadow-md shadow-red-950/25'
                  : 'bg-gray-900 text-gray-500 border border-gray-850'
              }`}
            >
              ⚡ CHOQUE
            </button>
          </div>

          <div className="text-[8px] text-gray-500 font-mono leading-relaxed mt-1">
            Solo administrar descargas sobre ritmos desfibrilables (VTac / VFib). ¡NO desfibrilar Asistolia o Ritmo Sinusal!
          </div>
        </div>

      </div>

      {/* Terminal Log Output */}
      <div className="w-full rounded-xl bg-gray-950 border border-gray-850 p-3.5 font-mono text-[10px] text-emerald-400 flex flex-col gap-1.5 shadow-inner">
        <div className="flex justify-between items-center border-b border-gray-900 pb-1 text-gray-500 font-bold">
          <span>CONSOLE FEEDBACK</span>
          <span>SYSTEM READY</span>
        </div>
        
        {/* Render live updates */}
        <div className="flex gap-2">
          <span className="text-emerald-600 font-bold select-none">[{new Date().toLocaleTimeString()}]</span>
          <span className="text-emerald-300 whitespace-pre-wrap">{lastInterventionMessage || 'Esperando inicio de simulación...'}</span>
        </div>

        {appliedInterventions.length > 0 && (
          <div className="text-gray-500 mt-1 flex flex-wrap gap-1.5 items-center">
            <span className="font-bold">Intervenciones realizadas:</span>
            {appliedInterventions.map((intv, idx) => (
              <span key={idx} className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-850 text-gray-400 font-mono capitalize">
                {intv === 'oxygen' ? 'Oxígeno' : intv === 'atropine' ? 'Atropina' : intv === 'amiodarone' ? 'Amiodarona' : 'Desfibrilación'}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default InterventionsPanel;
