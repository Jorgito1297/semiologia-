'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '@/services/supabase';
import { calculateFatigue } from '@/utils/cognitive_metrics';

// ── OSCE Stations Data ──────────────────────────────────────────────────────
interface ChecklistItem {
  id: string;
  text: string;
  competency: 'CG6' | 'CG8';
  points: number;
}

interface Station {
  id: string;
  name: string;
  week: string;
  description: string;
  competencies: string[];
  items: ChecklistItem[];
}

const OSCE_STATIONS: Station[] = [
  {
    id: 'st1',
    name: '1. Medición de Signos Vitales',
    week: 'Semana 4',
    description: 'Técnica correcta de control de temperatura, pulso radial y frecuencia respiratoria.',
    competencies: ['CG6', 'CG8'],
    items: [
      { id: 'st1_1', text: 'Realiza higiene de manos antes del contacto con el paciente.', competency: 'CG6', points: 10 },
      { id: 'st1_2', text: 'Se presenta al paciente explicando el procedimiento de forma clara y obtiene consentimiento.', competency: 'CG6', points: 10 },
      { id: 'st1_3', text: 'Coloca el termómetro axilar correctamente y espera el tiempo normado.', competency: 'CG8', points: 20 },
      { id: 'st1_4', text: 'Controla el pulso radial palpando con los dedos índice y medio durante 60 segundos completos.', competency: 'CG8', points: 20 },
      { id: 'st1_5', text: 'Mide la frecuencia respiratoria disimuladamente (sin avisar para no alterar patrón) durante 30s o 60s.', competency: 'CG8', points: 20 },
      { id: 'st1_6', text: 'Registra los valores e interpreta correctamente los rangos (taquicardia, bradipnea, fiebre, etc.).', competency: 'CG8', points: 20 },
    ]
  },
  {
    id: 'st2',
    name: '2. Examen de Cabeza y Cuello',
    week: 'Semanas 5–6',
    description: 'Exploración física sistemática de facies, senos paranasales, reflejos pupilares, tiroides y ganglios.',
    competencies: ['CG6', 'CG8'],
    items: [
      { id: 'st2_1', text: 'Inspecciona simetría facial, implantación pilosa, coloración y presencia de lesiones.', competency: 'CG6', points: 15 },
      { id: 'st2_2', text: 'Realiza palpación de puntos dolorosos de senos paranasales (frontal, maxilar).', competency: 'CG8', points: 15 },
      { id: 'st2_3', text: 'Evalúa reflejos pupilares (reflejo fotomotor directo y reflejo consensual) usando linterna.', competency: 'CG8', points: 20 },
      { id: 'st2_4', text: 'Realiza examen de agudeza visual de forma adecuada (distancia y oclusión ocular).', competency: 'CG8', points: 15 },
      { id: 'st2_5', text: 'Palpa la glándula tiroides desde atrás del paciente (Maniobra de Quervain) indicando que trague.', competency: 'CG6', points: 20 },
      { id: 'st2_6', text: 'Explora sistemáticamente las cadenas ganglionares cervicales (preauricular, submaxilar, cervical profunda).', competency: 'CG6', points: 15 },
    ]
  },
  {
    id: 'st3',
    name: '3. Auscultación Cardiorrespiratoria',
    week: 'Semanas 7–8',
    description: 'Ubicación anatómica de focos de auscultación cardíaca e identificación de ruidos pulmonares.',
    competencies: ['CG6', 'CG8'],
    items: [
      { id: 'st3_1', text: 'Coloca al paciente en posición correcta y expone el tórax respetando el pudor.', competency: 'CG6', points: 10 },
      { id: 'st3_2', text: 'Identifica y ausculta correctamente los 4 focos cardíacos clásicos (Aórtico, Pulmonar, Tricúspide, Mitral).', competency: 'CG8', points: 25 },
      { id: 'st3_3', text: 'Diferencia R1 y R2 y busca la presencia de R3, R4 o soplos sistólicos/diastólicos.', competency: 'CG8', points: 25 },
      { id: 'st3_4', text: 'Ausculta campos pulmonares de forma simétrica y comparativa (en escalera) en tórax anterior y posterior.', competency: 'CG6', points: 20 },
      { id: 'st3_5', text: 'Describe la presencia de murmullo vesicular normal o ruidos agregados (crepitantes, sibilancias, roncus).', competency: 'CG8', points: 20 },
    ]
  },
  {
    id: 'st4',
    name: '4. Toma de Presión Arterial',
    week: 'Semana 9',
    description: 'Protocolo de medición auscultatoria según guías internacionales.',
    competencies: ['CG6', 'CG8'],
    items: [
      { id: 'st4_1', text: 'Asegura reposo previo del paciente (5 min sentado, brazo apoyado a nivel del corazón).', competency: 'CG6', points: 15 },
      { id: 'st4_2', text: 'Coloca el brazalete del tamaño adecuado 2.5 cm arriba del pliegue del codo, sin ropa opresiva.', competency: 'CG6', points: 15 },
      { id: 'st4_3', text: 'Estima la presión sistólica por palpación del pulso radial antes de colocar el estetoscopio.', competency: 'CG8', points: 15 },
      { id: 'st4_4', text: 'Infla el brazalete hasta 20-30 mmHg por encima de la desaparición del pulso palpatorio.', competency: 'CG8', points: 15 },
      { id: 'st4_5', text: 'Desinfla el brazalete de forma lenta y constante (2 a 3 mmHg por segundo).', competency: 'CG6', points: 15 },
      { id: 'st4_6', text: 'Identifica la Fase I de Korotkoff (Sistólica) y la Fase V de Korotkoff (Diastólica).', competency: 'CG8', points: 25 },
    ]
  },
  {
    id: 'st5',
    name: '5. Palpación y Percusión Abdominal',
    week: 'Semana 12',
    description: 'Técnica correcta de exploración física del abdomen por cuadrantes y maniobras específicas.',
    competencies: ['CG6', 'CG8'],
    items: [
      { id: 'st5_1', text: 'Posiciona al paciente en decúbito dorsal con rodillas levemente flexionadas y abdomen expuesto.', competency: 'CG6', points: 10 },
      { id: 'st5_2', text: 'Realiza la inspección de la forma del abdomen (plano, globoso, excavado) y cicatrices.', competency: 'CG6', points: 15 },
      { id: 'st5_3', text: 'Ausculta los ruidos hidroaéreos (RHA) ANTES de realizar la percusión o la palpación.', competency: 'CG8', points: 20 },
      { id: 'st5_4', text: 'Realiza palpación superficial sistemática evaluando tensión y puntos de dolor.', competency: 'CG6', points: 15 },
      { id: 'st5_5', text: 'Realiza palpación profunda del borde hepático (maniobra de enganche) y esplénico.', competency: 'CG8', points: 20 },
      { id: 'st5_6', text: 'Busca signos peritoneales específicos como el signo de Blumberg (rebote) o signo de Murphy.', competency: 'CG8', points: 20 },
    ]
  }
];

export default function OSCEPage() {
  const [activeStationId, setActiveStationId] = useState<string>('st1');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(480); // 8 minutes in seconds
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  
  // Database / Sync States
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline'>('offline');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [studentId, setStudentId] = useState<string>('');

  // --- CAPA EMOCIONAL (MOTIVATIONAL COGNITION LAYER) ---
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStation = OSCE_STATIONS.find(s => s.id === activeStationId) || OSCE_STATIONS[0];
  const audioContextRef = useRef<AudioContext | null>(null);

  // Helper to handle client-side JSON parsing safely
  function jsonParse(str: string) {
    return JSON.parse(str);
  }

  // Check connection status — retorna el nuevo status para uso inmediato
  async function checkConnection(): Promise<'online' | 'offline'> {
    try {
      const { error } = await supabaseClient.from('courses').select('id').limit(1);
      if (error) throw error;
      setSyncStatus('online');
      return 'online';
    } catch {
      setSyncStatus('offline');
      return 'offline';
    }
  }

  // Web Audio API Synth Alarm (Premium fallback - no external audio file required)
  function playAlarmSound() {
    try {
      if (!audioContextRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Play 3 pulses
      const startTime = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, startTime + i * 0.4); // A5 note
        
        gainNode.gain.setValueAtTime(0, startTime + i * 0.4);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + i * 0.4 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + i * 0.4 + 0.35);
        
        osc.start(startTime + i * 0.4);
        osc.stop(startTime + i * 0.4 + 0.4);
      }
    } catch {
      console.warn('Fallo al reproducir alarma de audio');
    }
  }

  // 1. Initial Load: Hydrate from localStorage and identify user
  useEffect(() => {
    // Restore checklist states
    const savedChecks = localStorage.getItem('osce_checklist_states');
    if (savedChecks) {
      try {
        const parsed = jsonParse(savedChecks);
        setTimeout(() => {
          setCheckedItems(parsed);
        }, 0);
      } catch (e) {
        console.error('Error parsing saved checklist states', e);
      }
    }

    // Restore timer if it was running
    const savedTime = localStorage.getItem('osce_timer_value');
    if (savedTime) {
      setTimeout(() => {
        setTimeLeft(parseInt(savedTime, 10));
      }, 0);
    }

    // Check online status and retrieve/create mock user
    setTimeout(() => {
      checkConnection();
    }, 0);
    
    // Check local student session
    const localSession = localStorage.getItem('student_session');
    if (localSession) {
      try {
        const sessionObj = jsonParse(localSession);
        setTimeout(() => {
          setStudentId(sessionObj.id || 'demo_student');
        }, 0);
      } catch {
        setTimeout(() => {
          setStudentId('demo_student');
        }, 0);
      }
    } else {
      setTimeout(() => {
        setStudentId('demo_student');
      }, 0);
    }
  }, []);

  // 2. Save checklist state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('osce_checklist_states', JSON.stringify(checkedItems));
  }, [checkedItems]);

  // 3. Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const nextVal = prev - 1;
          localStorage.setItem('osce_timer_value', nextVal.toString());
          if (nextVal <= 0) {
            playAlarmSound();
            setTimerRunning(false);
          }
          return nextVal;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  // 4. Score Calculation logic
  const calculateStationProgress = (station: Station) => {
    const totalPoints = station.items.reduce((acc, it) => acc + it.points, 0);
    const earnedPoints = station.items
      .filter(it => checkedItems[it.id])
      .reduce((acc, it) => acc + it.points, 0);
    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  };

  const getCompetencyPercentage = (comp: 'CG6' | 'CG8') => {
    let totalItems = 0;
    let checkedCount = 0;
    
    OSCE_STATIONS.forEach(st => {
      st.items.forEach(it => {
        if (it.competency === comp) {
          totalItems++;
          if (checkedItems[it.id]) {
            checkedCount++;
          }
        }
      });
    });
    
    return totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  };

  const cg6Progress = getCompetencyPercentage('CG6');
  const cg8Progress = getCompetencyPercentage('CG8');

  // Checkbox change handler
  const handleItemToggle = (itemId: string) => {
    setResponseCount(prev => prev + 1);
    if (checkedItems[itemId]) {
      setErrorCount(prev => prev + 1);
    }

    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Sync to database
  const handleSyncToDatabase = async () => {
    setSyncing(true);
    const currentStatus = await checkConnection(); // usa el valor retornado, no el state

    if (currentStatus === 'offline') {
      alert('⚠️ No se pudo conectar con Supabase. Tu progreso permanece guardado localmente.');
      setSyncing(false);
      return;
    }

    try {
      // 1. Get or create student details
      let finalStudentId = studentId;
      if (finalStudentId === 'demo_student' || !finalStudentId) {
        // Query database for a student
        const { data: stData } = await supabaseClient.from('students').select('id').limit(1);
        if (stData && stData.length > 0) {
          finalStudentId = stData[0].id;
        } else {
          // Create a mock student
          const newId = crypto.randomUUID();
          const { error: insErr } = await supabaseClient.from('students').insert({
            id: newId,
            full_name: 'Dr. Ángel Tusen (Estudiante Evaluado)',
            email: 'angel.tusen@uce.edu.do',
            completed_med224: true
          });
          if (!insErr) finalStudentId = newId;
        }
        setStudentId(finalStudentId);
      }

      // Get Course ID
      const { data: cData } = await supabaseClient.from('courses').select('id').eq('code', 'MED-228').limit(1);
      const courseId = cData && cData.length > 0 ? cData[0].id : null;

      if (!courseId || !finalStudentId) {
        throw new Error('Falta Course ID o Student ID en Supabase');
      }

      // Upsert Competencies progress
      const { error: err6 } = await supabaseClient.from('student_competency_progress').upsert({
        student_id: finalStudentId,
        course_id: courseId,
        competency: 'CG6',
        mastery_pct: cg6Progress,
        items_attempted: OSCE_STATIONS.reduce((a, st) => a + st.items.filter(it => it.competency === 'CG6').length, 0),
        items_correct: OSCE_STATIONS.reduce((a, st) => a + st.items.filter(it => it.competency === 'CG6' && checkedItems[it.id]).length, 0),
        last_updated: new Date().toISOString()
      }, { onConflict: 'student_id,course_id,competency' });

      const { error: err8 } = await supabaseClient.from('student_competency_progress').upsert({
        student_id: finalStudentId,
        course_id: courseId,
        competency: 'CG8',
        mastery_pct: cg8Progress,
        items_attempted: OSCE_STATIONS.reduce((a, st) => a + st.items.filter(it => it.competency === 'CG8').length, 0),
        items_correct: OSCE_STATIONS.reduce((a, st) => a + st.items.filter(it => it.competency === 'CG8' && checkedItems[it.id]).length, 0),
        last_updated: new Date().toISOString()
      }, { onConflict: 'student_id,course_id,competency' });

      if (err6 || err8) throw new Error((err6?.message || '') + ' ' + (err8?.message || ''));

      alert('🎉 ¡Progreso sincronizado exitosamente con la base de datos de Supabase!');
    } catch (err) {
      console.error('Error syncing:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`⚠️ Fallo al sincronizar datos: ${errorMsg}`);
    } finally {
      setSyncing(false);
    }
  };

  // Reset checklist
  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restablecer todo el checklist del OSCE?')) {
      setCheckedItems({});
      localStorage.removeItem('osce_checklist_states');
    }
  };

  // Format Time representation
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased bg-radial-at-t from-slate-900 via-slate-950 to-black">
      {/* GLOW DECORATIONS */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="border-b border-slate-900 bg-slate-900/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">OSCE Simulator</h1>
              <p className="text-xs text-slate-400">MED-228 NeuroAdaptive Platform • UCE</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
              syncStatus === 'online' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {syncStatus === 'online' ? 'Supabase Online' : 'Modo Demo (Local)'}
            </div>

            <button
              onClick={handleSyncToDatabase}
              disabled={syncing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 transition-all text-sm font-semibold rounded-lg shadow-md shadow-indigo-600/15 disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <button
              onClick={handleReset}
              className="p-2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900/40 rounded-lg transition-all"
              title="Restablecer Checklist"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT PANEL: Stations & Timer */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* TIMER CARD */}
          <div className={`bg-slate-900/40 border backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center transition-all ${
            timeLeft < 60 && timerRunning 
              ? 'border-red-500/30 bg-red-950/10 shadow-red-950/10' 
              : 'border-slate-800/80 shadow-slate-950/20'
          }`}>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">CRONÓMETRO DE ESTACIÓN</span>
            <div className={`text-4xl font-extrabold tabular-nums tracking-wider ${
              timeLeft < 60 && timerRunning ? 'text-red-500 animate-pulse' : 'text-cyan-400'
            }`}>
              {formatTime(timeLeft)}
            </div>
            
            {/* Timer Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timerRunning 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-750' 
                    : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20'
                }`}
              >
                {timerRunning ? 'PAUSAR' : 'INICIAR'}
              </button>
              <button
                onClick={() => { setTimeLeft(480); setTimerRunning(false); }}
                className="px-4 py-1.5 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 rounded-lg text-xs font-semibold transition-all"
              >
                REINICIAR
              </button>
            </div>
          </div>

          {/* ROTATING STATIONS SELECTOR */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Rotación de Estaciones (8 min)</span>
            
            {OSCE_STATIONS.map((station) => {
              const progress = calculateStationProgress(station);
              return (
                <button
                  key={station.id}
                  onClick={() => setActiveStationId(station.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between gap-3 ${
                    activeStationId === station.id
                      ? 'bg-gradient-to-r from-indigo-950/60 to-slate-900/60 border-indigo-500/50 shadow-md shadow-indigo-950/40 text-white'
                      : 'bg-transparent border-transparent hover:bg-slate-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs text-indigo-400 font-semibold mb-0.5">{station.week}</div>
                    <div className="text-sm font-bold truncate">{station.name}</div>
                  </div>
                  {/* Progress Bubble */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    progress === 100 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : progress > 0 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {progress}%
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* CENTER PANEL: Checklist Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* ACTIVE STATION DETAIL */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-bold tracking-wider uppercase">{activeStation.week} • OSCE EVALUATION</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Competencias: {activeStation.competencies.join(', ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{activeStation.name}</h2>
              <p className="text-sm text-slate-400 mt-1">{activeStation.description}</p>
            </div>

            {/* Checklist Items */}
            <div className="flex flex-col gap-2 mt-2">
              {activeStation.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemToggle(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    checkedItems[item.id]
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-100 shadow-sm shadow-emerald-950/30'
                      : 'bg-slate-950/30 border-slate-900 hover:border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      checkedItems[item.id]
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}>
                      {checkedItems[item.id] && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm leading-relaxed">{item.text}</span>
                  </div>
                  {/* points/competency badge */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      item.competency === 'CG6' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {item.competency}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{item.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Competency Mastery & Feedback */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* FATIGUE METER CARD */}
          {(() => {
            const fatigue = calculateFatigue(sessionSeconds, responseCount, errorCount);
            let barColor = "from-green-500 to-emerald-500";
            let textColor = "text-green-400";
            let label = "Óptimo (Foco Alto)";
            if (fatigue > 75) {
              barColor = "from-red-500 to-rose-500";
              textColor = "text-red-400";
              label = "Crítico (Toma un Descanso)";
            } else if (fatigue > 40) {
              barColor = "from-yellow-500 to-amber-500";
              textColor = "text-yellow-400";
              label = "Moderado (Fatiga Leve)";
            }
            return (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>FATIGA COGNITIVA</span>
                  <span className={`font-mono font-bold ${textColor}`}>{fatigue}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div
                    className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${fatigue}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Estado: <span className={`font-bold ${textColor}`}>{label}</span>
                </div>
              </div>
            );
          })()}

          {/* COMPETENCY MASTERY METRICS */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Maestría por Competencias</h3>
            
            {/* CG6 Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">CG6: Historia Clínica Completa</span>
                <span className="font-extrabold text-indigo-400 tabular-nums">{cg6Progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${cg6Progress}%` }}
                />
              </div>
            </div>

            {/* CG8 Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">CG8: Procedimiento Diagnóstico</span>
                <span className="font-extrabold text-cyan-400 tabular-nums">{cg8Progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500" 
                  style={{ width: `${cg8Progress}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-900 pt-4">
              📌 **CG6** se evalúa en base a la técnica de inspección, palpación e higiene. **CG8** se enfoca en las mediciones correctas e interpretación del diagnóstico.
            </div>
          </div>

          {/* CLINICAL SUMMARY & COMPLIANCE */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Resumen del Examen</h3>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                <span className="text-slate-400">Total ítems evaluados:</span>
                <span className="font-semibold text-white">
                  {Object.keys(checkedItems).filter(k => checkedItems[k]).length} / {OSCE_STATIONS.reduce((acc, st) => acc + st.items.length, 0)}
                </span>
              </div>

              <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                <span className="text-slate-400">Puntaje Global Estimado:</span>
                <span className="font-bold text-emerald-400">
                  {Math.round((cg6Progress + cg8Progress) / 2)} / 100
                </span>
              </div>

              <div className="flex justify-between text-xs pb-1">
                <span className="text-slate-400">Estado de Aprobación:</span>
                <span className={`font-semibold ${
                  (cg6Progress + cg8Progress) / 2 >= 70 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {((cg6Progress + cg8Progress) / 2) >= 70 ? 'Aprobado (≥70%)' : 'Reprobado (<70%)'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
