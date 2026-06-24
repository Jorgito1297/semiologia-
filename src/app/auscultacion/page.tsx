'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

// Stores
import { useAnatomyStore } from '@/modules/auscultation/stores/anatomy.store';
import { useAudioStore } from '@/modules/auscultation/stores/audio.store';
import { useQuizStore } from '@/modules/auscultation/stores/quiz.store';
import { useSimulationStore } from '@/modules/auscultation/stores/simulation.store';

// Constants & Scenarios
import { HOTSPOTS } from '@/modules/auscultation/constants';
import { CLINICAL_SCENARIOS } from '@/modules/auscultation/simulation/scenarios';

// Core Engine Services
import { AudioEngine } from '@/modules/auscultation/audio/AudioEngine';
import { PersistenceManager } from '@/modules/auscultation/persistence/PersistenceManager';

// Modular Components
import { TorsoAnterior } from '@/modules/auscultation/anatomy/TorsoAnterior';
import { TorsoPosterior } from '@/modules/auscultation/anatomy/TorsoPosterior';
import { AnatomyLegend } from '@/modules/auscultation/anatomy/AnatomyLegend';
import { OscilloscopeCanvas } from '@/modules/auscultation/waveform/OscilloscopeCanvas';
import { QuizComponent } from '@/modules/auscultation/quizzes/QuizComponent';
import { TutorFeedback } from '@/modules/auscultation/ai/TutorFeedback';

export default function AuscultacionPage() {
  // Anatomy Store
  const view = useAnatomyStore((state) => state.view);
  const selectedLayer = useAnatomyStore((state) => state.selectedLayer);
  const selectedHotspotId = useAnatomyStore((state) => state.selectedHotspotId);
  const setView = useAnatomyStore((state) => state.setView);
  const setSelectedLayer = useAnatomyStore((state) => state.setSelectedLayer);
  const setSelectedHotspotId = useAnatomyStore((state) => state.setSelectedHotspotId);

  // Audio Store
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const soundMode = useAudioStore((state) => state.soundMode);
  const volume = useAudioStore((state) => state.volume);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setSoundMode = useAudioStore((state) => state.setSoundMode);
  const setVolume = useAudioStore((state) => state.setVolume);

  // Quiz Store
  const resetQuizState = useQuizStore((state) => state.resetQuizState);

  // Simulation Store
  const simulationMode = useSimulationStore((state) => state.simulationMode);
  const activeScenarioId = useSimulationStore((state) => state.activeScenarioId);
  const setSimulationMode = useSimulationStore((state) => state.setSimulationMode);
  const setActiveScenarioId = useSimulationStore((state) => state.setActiveScenarioId);

  // Register network sync listeners
  useEffect(() => {
    PersistenceManager.registerSyncListeners();
    return () => {
      // Cleanup audio engine when component unmounts
      AudioEngine.getInstance().close();
    };
  }, []);

  // Handle active focus selections
  useEffect(() => {
    // When hotspot changes, stop audio playback and reset quiz choice
    const audioEngine = AudioEngine.getInstance();
    audioEngine.stop();
    setIsPlaying(false);
    resetQuizState();
  }, [selectedHotspotId, resetQuizState, setIsPlaying]);

  // Handle live updates to volume and sound mode in the engine
  useEffect(() => {
    AudioEngine.getInstance().setVolume(volume);
  }, [volume]);

  useEffect(() => {
    AudioEngine.getInstance().setSoundMode(soundMode);
  }, [soundMode]);

  // Play/Pause Action
  const togglePlay = () => {
    if (!selectedHotspotId) return;
    const hs = HOTSPOTS[selectedHotspotId];
    if (!hs) return;

    const audioEngine = AudioEngine.getInstance();
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      const success = audioEngine.start(hs.id, hs.type, soundMode);
      if (success) {
        setIsPlaying(true);
      }
    }
  };

  // Scenario Selection Action
  const handleSelectScenario = (scId: string) => {
    const sc = CLINICAL_SCENARIOS.find((s) => s.id === scId);
    if (!sc) {
      setActiveScenarioId(null);
      return;
    }

    setActiveScenarioId(scId);
    setSoundMode(sc.soundModeOverride);
    setSelectedHotspotId(sc.activeHotspotId);

    const hs = HOTSPOTS[sc.activeHotspotId];
    if (hs) {
      setView(hs.view);
      setSelectedLayer(hs.type);
    }
  };

  const activeHotspot = selectedHotspotId ? HOTSPOTS[selectedHotspotId] : null;
  const activeScenario = CLINICAL_SCENARIOS.find((s) => s.id === activeScenarioId);

  return (
    <div className="min-h-screen pb-16 relative overflow-x-hidden bg-[#070b13] text-gray-100 font-sans">
      
      {/* Background clinical glowing decorative gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl -z-10 opacity-[0.04] bg-emerald-500 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl -z-10 opacity-[0.03] bg-cyan-500"></div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Medical Header */}
        <header className="glass rounded-3xl p-6 mb-8 border-l-4 border-l-emerald-500 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/10 backdrop-blur-md border border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                MED-228 — LAB
              </span>
              <span className="text-[10px] text-gray-400 font-medium">• Clinical Simulation Engine</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold mt-2 tracking-tight text-white">
              Laboratorio de Auscultación Interactivo
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Entrenamiento semiológico e interactivo de focos cardíacos y campos pulmonares mediante simulación sonora y persistencia offline.
            </p>
          </div>
          <Link
            href="/"
            onClick={() => AudioEngine.getInstance().stop()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-850 text-gray-200 text-xs font-bold rounded-xl border border-gray-800 hover:border-gray-750 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            ➔ Volver al Portal
          </Link>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: TORSO E INDICADORES (5/12) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            
            {/* Configuración de Simulación */}
            <div className="w-full glass rounded-2xl p-4 flex flex-col gap-4 border border-gray-800/80 bg-gray-950/20">
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modo de Simulación</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Active Settings</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Selector de Modo (Entrenamiento vs Examen) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Tipo de Sesión</label>
                  <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setSimulationMode('training')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        simulationMode === 'training' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Práctica
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('exam');
                        setActiveScenarioId(null); // Clear active scenario in free exam mode
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        simulationMode === 'exam' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Examen
                    </button>
                  </div>
                </div>

                {/* Capa Anatómica (solo disponible en anterior view / no examen) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Capa Activa</label>
                  <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                    <button
                      disabled={view === 'posterior'}
                      onClick={() => setSelectedLayer('heart')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                        selectedLayer === 'heart' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title={view === 'posterior' ? 'Solo campos pulmonares visibles en la espalda' : ''}
                    >
                      🫀 Corazón
                    </button>
                    <button
                      onClick={() => setSelectedLayer('lung')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedLayer === 'lung' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      🫁 Pulmones
                    </button>
                  </div>
                </div>
              </div>

              {/* Orientación y Escenarios */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Orientación</label>
                  <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setView('anterior')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        view === 'anterior' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => {
                        setView('posterior');
                        setSelectedLayer('lung'); // Force lung on back
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        view === 'posterior' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Posterior
                    </button>
                  </div>
                </div>

                {/* Dropdown de Pacientes Virtuales */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Caso Clínico</label>
                  <select
                    value={activeScenarioId || ''}
                    onChange={(e) => handleSelectScenario(e.target.value)}
                    className="w-full bg-gray-900/60 text-[10px] font-semibold text-gray-200 rounded-xl border border-gray-800 p-2 focus:outline-none cursor-pointer hover:border-gray-700"
                  >
                    <option value="">-- Práctica Libre --</option>
                    {CLINICAL_SCENARIOS.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Maniquí Interactivo SVG */}
            <div className="w-full aspect-[4/5] glass border border-gray-800 rounded-3xl relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-[#0a1120] to-[#070b13] shadow-inner">
              
              <div className="absolute top-3 left-3 text-[10px] uppercase font-mono font-bold text-gray-500 tracking-widest">
                {view === 'anterior' ? 'Pecho (Anterior)' : 'Espalda (Posterior)'}
              </div>

              {/* Patient breathing visual feedback effect */}
              <div className={`w-full h-full flex items-center justify-center ${isPlaying ? 'scale-101 transition-transform duration-2000 ease-in-out' : ''}`}>
                {view === 'anterior' ? <TorsoAnterior /> : <TorsoPosterior />}
              </div>

              {/* Watermark Logo */}
              <div className="absolute bottom-3 right-3 text-[8px] font-mono text-gray-600">
                UCE CLINICAL ENGINE v1.0
              </div>
            </div>

            {/* Anatomy Legend */}
            <AnatomyLegend />

          </div>

          {/* COLUMNA DERECHA: AUDIO, DETALLES CLÍNICOS Y QUIZ (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Monitor de Sonido y Osciloscopio */}
            <div className="glass rounded-3xl p-6 border border-gray-800 bg-gray-950/10 shadow-2xl space-y-5">
              
              {/* Patient Vitals Card (if scenario is selected) */}
              {activeScenario && (
                <div className="grid grid-cols-4 gap-2 bg-[#090d16]/80 p-3 rounded-2xl border border-emerald-500/10 text-center select-none font-mono">
                  <div className="p-1">
                    <span className="text-[8px] text-gray-500 block">F.C. (HR)</span>
                    <span className="text-xs font-bold text-emerald-400 animate-pulse">{activeScenario.vitalSigns.hr} lpm</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-gray-500 block">F.R. (RR)</span>
                    <span className="text-xs font-bold text-cyan-400">{activeScenario.vitalSigns.rr} rpm</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-gray-500 block">P.A. (BP)</span>
                    <span className="text-xs font-bold text-emerald-400">{activeScenario.vitalSigns.bp} mmHg</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-gray-500 block">SpO2</span>
                    <span className="text-xs font-bold text-cyan-400">{activeScenario.vitalSigns.spo2}%</span>
                  </div>
                </div>
              )}

              {/* Osciloscopio de Onda en Canvas */}
              <OscilloscopeCanvas />

              {/* Controles de Reproducción y Sonido */}
              {activeHotspot ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-900/40 border border-gray-800/80 p-4 rounded-2xl">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-gray-200">
                      {simulationMode === 'exam' ? 'Punto de Auscultación Activo' : activeHotspot.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {simulationMode === 'exam' ? 'Escucha atentamente para deducir los hallazgos.' : activeHotspot.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
                    {/* Modo normal vs patológico (hidden in exam mode / scenarios) */}
                    {simulationMode !== 'exam' && !activeScenarioId && (
                      <div className="flex bg-gray-950/40 p-1 rounded-xl border border-gray-800 text-[10px] font-bold">
                        <button
                          onClick={() => setSoundMode('normal')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            soundMode === 'normal' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => setSoundMode('pathological')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            soundMode === 'pathological' ? 'bg-rose-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Patología
                        </button>
                      </div>
                    )}

                    {/* Control de Volumen */}
                    <div className="flex items-center gap-2 bg-gray-950/40 px-2.5 py-1.5 rounded-xl border border-gray-800 text-[10px] font-bold">
                      <span className="text-gray-400 select-none text-[11px]">🔊</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 sm:w-20 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                      />
                      <span className="text-[9px] font-mono text-gray-400 w-7 text-right select-none">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Botón de reproducción */}
                    <button
                      onClick={togglePlay}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md transform active:scale-95 flex items-center gap-2 cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                      }`}
                    >
                      <span>{isPlaying ? '⏸️ Pausar' : '🔊 Auscultar'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl text-xs text-gray-500 leading-relaxed font-medium">
                  {activeScenario 
                    ? `Paciente ${activeScenario.patientName} (${activeScenario.gender}, ${activeScenario.age} años) acostado. Selecciona un punto interactivo para auscultar.`
                    : 'Selecciona un foco anatómico (🫀 o 🫁) en el maniquí para activar la simulación de auscultación.'
                  }
                </div>
              )}

              {/* Consejo para móviles en iOS/Android */}
              <div className="mt-3 p-3 bg-amber-550/5 rounded-2xl border border-amber-500/10 text-[10px] text-gray-400 leading-relaxed flex items-start gap-2">
                <span className="text-amber-400 text-xs select-none">💡</span>
                <div>
                  <span className="text-amber-300 font-bold block mb-0.5">Nota para dispositivos móviles:</span>
                  Si estás en un celular o tablet (especialmente iPhone o iPad) y no escuchas el sonido, asegúrate de <strong className="text-gray-200">desactivar el modo silencio (interruptor físico lateral)</strong> y subir el volumen de multimedia.
                </div>
              </div>
            </div>

            {/* Ficha Clínica y Retroalimentación RAG */}
            {activeHotspot && simulationMode === 'training' && (
              <TutorFeedback />
            )}

            {/* Cuestionario Evaluativo */}
            {activeHotspot && (
              <QuizComponent />
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
