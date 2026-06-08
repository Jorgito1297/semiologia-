'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/services/supabase';

interface Question {
  id: number;
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  justification: string;
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 1,
    scenario: "Un paciente de 45 años asiste a consulta refiriendo dolor torácico. Al realizar el interrogatorio, el estudiante de medicina registra detalladamente el motivo de consulta con las palabras textuales del paciente, pero olvida indagar la cronología exacta y los factores que alivian o agravan el síntoma.",
    question: "¿Qué sección fundamental de la Anamnesis de la Historia Clínica se encuentra incompleta y requiere ser ampliada?",
    options: [
      "Los Antecedentes Personales Patológicos (APP)",
      "La Historia de la Enfermedad Actual (HEA)",
      "La Revisión por Sistemas y Aparatos",
      "Los Antecedentes Gineco-obstétricos"
    ],
    correctAnswer: 1,
    justification: "La Historia de la Enfermedad Actual (HEA) es el cuerpo principal de la anamnesis donde se desglosan los atributos del síntoma principal (cronología, localización, intensidad, carácter, irradiación, factores agravantes/atenuantes)."
  },
  {
    id: 2,
    scenario: "Durante la exploración física de un paciente con sospecha de neumonía lobar, el médico coloca firmemente el dedo plexímetro sobre el espacio intercostal y golpea decididamente con el dedo percutor de la mano contralateral.",
    question: "¿Cómo se denomina este método percutorio clásico y qué hallazgo acústico se espera encontrar sobre la zona consolidada pulmonar?",
    options: [
      "Percusión directa de Auenbrugger — Timpanismo",
      "Percusión dígito-digital de Gerhardt — Matidez",
      "Percusión puño-percusión — Sonoridad normal",
      "Percusión auscultatoria — Submatidez"
    ],
    correctAnswer: 1,
    justification: "La percusión dígito-digital (de Gerhardt) es la técnica universal de exploración. Ante un proceso de consolidación lobar (neumonía), el espacio aéreo alveolar es reemplazado por exudado denso, produciendo un sonido de matidez."
  },
  {
    id: 3,
    scenario: "Un estudiante está evaluando a un paciente y observa ictericia marcada en las escleras, temperatura corporal de 38.5°C por termómetro, y el paciente le refiere que siente 'muchas náuseas y debilidad general'.",
    question: "De acuerdo a la clasificación semiológica, ¿cuál de las siguientes opciones describe correctamente los hallazgos?",
    options: [
      "Ictericia y fiebre son síntomas; la náusea es un signo patognomónico.",
      "La ictericia y la fiebre son signos; las náuseas y la debilidad son síntomas.",
      "Todos los elementos descritos son signos clínicos medibles.",
      "Todos los elementos descritos son síntomas subjetivos."
    ],
    correctAnswer: 1,
    justification: "Los signos son manifestaciones objetivas físicas observables y medibles por el explorador (fiebre medida por termómetro, ictericia visible en escleras). Los síntomas son sensaciones subjetivas percibidas únicamente por el paciente (náuseas y debilidad)."
  },
  {
    id: 4,
    scenario: "Para la exploración física sistemática del abdomen, es necesario colocar al paciente en una posición adecuada que relaje al máximo la tensión de la musculatura de la pared abdominal anterior.",
    question: "¿Cuál es la posición de elección recomendada para realizar la palpación profunda del abdomen?",
    options: [
      "Decúbito prono con extremidades extendidas",
      "Decúbito dorsal (supino) con rodillas ligeramente flexionadas",
      "Posición de Trendelenburg invertida",
      "Posición de Sims o lateral izquierda"
    ],
    correctAnswer: 1,
    justification: "El decúbito supino con flexión moderada de las rodillas (y opcionalmente apoyo en los pies) relaja la musculatura del recto anterior del abdomen, permitiendo al clínico profundizar la palpación de vísceras sin resistencia."
  },
  {
    id: 5,
    scenario: "Un paciente acude a urgencias con disnea de esfuerzo severa. Al auscultar el foco mitral, usted percibe un soplo sistólico eyectivo que se irradia hacia la axila izquierda.",
    question: "Para realizar una correcta integración sindrómica, ¿cuál es el paso semiológico final indispensable?",
    options: [
      "Indicar una tomografía computarizada de tórax inmediata",
      "Correlacionar los signos auscultatorios con la anamnesis para estructurar un Síndrome Valvular (ej. Insuficiencia Mitral)",
      "Recetar betabloqueantes y dar el alta médica",
      "Realizar una punción pericárdica exploratoria"
    ],
    correctAnswer: 1,
    justification: "La semiología exige que los hallazgos del examen físico (soplo sistólico mitral irradiado) se integren con la clínica del paciente (disnea) para fundar un Síndrome Clínico congruente, antes de solicitar pruebas complementarias avanzadas."
  }
];

const CLINICAL_PEARLS = [
  "\"La medicina clínica comienza con la atenta observación del paciente; los signos nos revelan la patología silenciosa antes de que el laboratorio hable.\"",
  "\"El arte del diagnóstico radica en saber interrogar; una anamnesis exhaustiva resuelve el 80% de los enigmas clínicos.\"",
  "\"El examen físico no es un procedimiento mecánico, sino un diálogo socrático mediado por el tacto y el oído del explorador.\""
];

export default function OnboardingPage() {
  // Pasos: 1 = Dopamina, 2 = Cortisol, 3 = Serotonina, 4 = Norepinefrina, 5 = Oxitocina, 6 = Finalizado/Procesando
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showJustification, setShowJustification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [score, setScore] = useState(0);
  const [easeFactor, setEaseFactor] = useState(2.5);
  
  // Timer de 2.5 segundos para desbloqueo neurocognitivo
  const [lockCountdown, setLockCountdown] = useState(2.5);
  const [isLocked, setIsLocked] = useState(true);

  // Timer de 90 segundos para preguntas de Cortisol
  const [questionTimeLeft, setQuestionTimeLeft] = useState(90);

  // Particle burst para Dopamine reward button
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  const [studentName] = useState(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('study_email') || '';
      return email.split('@')[0] || 'Estudiante';
    }
    return 'Estudiante';
  });

  const queueTelemetry = (stepName: string, data: { score?: number; easeFactor?: number }) => {
    if (typeof window === 'undefined') return;
    try {
      const queueStr = localStorage.getItem('onboarding_telemetry_queue') || '[]';
      const queue = JSON.parse(queueStr);
      queue.push({ stepName, data, timestamp: new Date().toISOString() });
      localStorage.setItem('onboarding_telemetry_queue', JSON.stringify(queue));
    } catch (err) {
      console.warn('Failed to queue telemetry:', err);
      localStorage.setItem('onboarding_telemetry_queue', JSON.stringify([{ stepName, data, timestamp: new Date().toISOString() }]));
    }
  };

  const syncTelemetryQueue = async () => {
    if (typeof window === 'undefined') return;
    const isDemo = localStorage.getItem('is_demo') === 'true';
    if (isDemo) return;

    const queueStr = localStorage.getItem('onboarding_telemetry_queue');
    if (!queueStr) return;

    let queue;
    try {
      queue = JSON.parse(queueStr);
    } catch (err) {
      console.warn('Corrupted telemetry queue, clearing:', err);
      localStorage.removeItem('onboarding_telemetry_queue');
      return;
    }
    if (queue.length === 0) return;

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: student } = await supabaseClient
        .from('students')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!student) return;

      const remainingQueue = [];
      for (const item of queue) {
        try {
          const { error } = await supabaseClient
            .from('onboarding_telemetry')
            .insert({
              student_id: student.id,
              step_name: item.stepName,
              score: item.data.score || null,
              ease_factor: item.data.easeFactor || null,
              completed_at: item.timestamp
            });
          if (error) throw error;
        } catch (err) {
          console.warn("Retrying telemetry upload failed:", err);
          remainingQueue.push(item);
        }
      }
      localStorage.setItem('onboarding_telemetry_queue', JSON.stringify(remainingQueue));
    } catch (e) {
      console.warn("Failed to sync telemetry queue:", e);
    }
  };

  const saveTelemetryStep = async (stepName: string, scoreValue?: number, efValue?: number) => {
    localStorage.setItem(`onboarding_step_${stepName}_completed`, 'true');
    if (scoreValue !== undefined) localStorage.setItem('med224_baseline_score', scoreValue.toString());
    if (efValue !== undefined) localStorage.setItem('initial_ease_factor', efValue.toString());

    const isDemo = localStorage.getItem('is_demo') === 'true';
    const data = { score: scoreValue, easeFactor: efValue };

    if (isDemo) {
      console.log(`[Demo] Telemetry saved locally for ${stepName}:`, data);
      return;
    }

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("No active Supabase session");

      const { data: student } = await supabaseClient
        .from('students')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!student) throw new Error("No student record found");

      const { error } = await supabaseClient
        .from('onboarding_telemetry')
        .insert({
          student_id: student.id,
          step_name: stepName,
          score: scoreValue || null,
          ease_factor: efValue || null
        });

      if (error) throw error;
      console.log(`[Prod] Telemetry saved to database for ${stepName}`);
      await syncTelemetryQueue();
    } catch (err) {
      console.warn(`Error persisting telemetry for ${stepName}. Queueing offline. Details:`, err);
      queueTelemetry(stepName, data);
    }
  };

  // ── MANEJADORES DE ACCIONES Y TIMERS ──────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (showJustification) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx + 1]: -1 // -1 indica omisión por tiempo
    }));
    setShowJustification(true);
  }, [showJustification, currentQuestionIdx]);

  // ── TIMERS Y BLOQUEOS NEUROCOGNITIVOS ────────────────────────────────────
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, 2.5 - elapsed);
      setLockCountdown(parseFloat(remaining.toFixed(1)));
      if (remaining <= 0) {
        setIsLocked(false);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, currentQuestionIdx]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (currentStep === 2) {
      timer = setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, currentQuestionIdx, handleTimeout]);

  // Sincronizar cola al montar el componente
  useEffect(() => {
    syncTelemetryQueue();
  }, []);

  const triggerDopamineParticles = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: `hsl(${45 + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%)` // HSL Oro / Dorado
    }));
    setParticles(newParticles);
    
    setTimeout(async () => {
      await saveTelemetryStep('Dopamina');
      setLockCountdown(2.5);
      setIsLocked(true);
      setQuestionTimeLeft(90);
      setCurrentStep(2);
    }, 800);
  };

  const handleSelectAnswer = (answerIdx: number) => {
    if (showJustification) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx + 1]: answerIdx
    }));
    setShowJustification(true);
  };

  const handleNextQuestion = () => {
    setShowJustification(false);
    if (currentQuestionIdx < 4) {
      setLockCountdown(2.5);
      setIsLocked(true);
      setQuestionTimeLeft(90);
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      processDiagnosticResults();
    }
  };

  const processDiagnosticResults = async () => {
    setIsLoading(true);
    let correctCount = 0;
    
    DIAGNOSTIC_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = correctCount * 20;
    setScore(finalScore);

    // Mapeo adaptativo del factor de facilidad (EF)
    let calculatedEF = 2.5;
    if (finalScore >= 80) calculatedEF = 2.8;
    else if (finalScore >= 60) calculatedEF = 2.5;
    else calculatedEF = 2.2;

    setEaseFactor(calculatedEF);

    // Persistir telemetría de Cortisol
    await saveTelemetryStep('Cortisol', finalScore, calculatedEF);

    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(3);
    }, 1500);
  };

  const handleSerotoninaNext = async () => {
    await saveTelemetryStep('Serotonina');
    setCurrentStep(4);
  };

  const handleNorepinefrinaNext = async () => {
    await saveTelemetryStep('Norepinefrina');
    setCurrentStep(5);
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    await saveTelemetryStep('Oxitocina');

    // Registrar el completado oficial del onboarding
    localStorage.setItem('med224_completed', 'true');

    const isDemo = localStorage.getItem('is_demo') === 'true';
    if (!isDemo && supabaseClient) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Actualizar el perfil del estudiante a completado en la DB de Supabase
          const { error } = await supabaseClient
            .from('students')
            .update({
              completed_med224: true,
              med224_baseline_score: score
            })
            .eq('auth_id', user.id);
          
          if (error) throw error;
        }
      } catch (err) {
        console.warn("Error finalizando el onboarding en Supabase. Operando en fallback offline:", err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/';
    }, 1200);
  };

  // ── ELEMENTOS DE CÁLCULO DE COMPETENCIAS ────────────────────────────────
  const getCompetencyPercent = (competency: 'CG2' | 'CG6' | 'CG8') => {
    const q1Correct = selectedAnswers[1] === DIAGNOSTIC_QUESTIONS[0].correctAnswer;
    const q2Correct = selectedAnswers[2] === DIAGNOSTIC_QUESTIONS[1].correctAnswer;
    const q3Correct = selectedAnswers[3] === DIAGNOSTIC_QUESTIONS[2].correctAnswer;
    const q4Correct = selectedAnswers[4] === DIAGNOSTIC_QUESTIONS[3].correctAnswer;
    const q5Correct = selectedAnswers[5] === DIAGNOSTIC_QUESTIONS[4].correctAnswer;

    if (competency === 'CG2') {
      return ((q1Correct ? 1 : 0) + (q3Correct ? 1 : 0)) * 50;
    }
    if (competency === 'CG6') {
      return ((q1Correct ? 1 : 0) + (q4Correct ? 1 : 0)) * 50;
    }
    if (competency === 'CG8') {
      return ((q2Correct ? 1 : 0) + (q5Correct ? 1 : 0)) * 50;
    }
    return 0;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-[#0b0f19] text-gray-100 font-sans">
      
      {/* BLOBS DE FONDO CON COLORES DINÁMICOS POR PASO */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl -z-10 transition-all duration-1000 ${
        currentStep === 1 ? 'bg-amber-500/10' :
        currentStep === 2 ? 'bg-blue-500/10' :
        currentStep === 3 ? 'bg-green-500/10' :
        currentStep === 4 ? 'bg-red-500/10' : 'bg-purple-500/10'
      }`}></div>
      
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl -z-10 transition-all duration-1000 ${
        currentStep === 1 ? 'bg-yellow-500/5' :
        currentStep === 2 ? 'bg-indigo-500/5' :
        currentStep === 3 ? 'bg-emerald-500/5' :
        currentStep === 4 ? 'bg-orange-500/5' : 'bg-fuchsia-500/5'
      }`}></div>

      {/* CONTENEDOR CENTRAL */}
      <div className="w-full max-w-2xl z-10 animate-fade-slide">
        
        {/* CARGANDO */}
        {isLoading && (
          <div className="glass rounded-3xl p-10 text-center space-y-6">
            <div className="w-32 h-16 mx-auto relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 100" fill="none">
                <path
                  className="ekg-line stroke-blue-500"
                  d="M 0 50 L 80 50 L 100 20 L 120 80 L 140 45 L 150 55 L 160 50 L 200 50 L 210 10 L 225 90 L 240 40 L 250 55 L 260 50 L 300 50"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-200">Guardando datos telemétricos...</h3>
            <p className="text-xs text-gray-400">Calibrando perfil de red y guardando estado adaptativo.</p>
          </div>
        )}

        {/* PANTALLA 1: DOPAMINA (BIENVENIDA + MOTIVACIÓN) */}
        {!isLoading && currentStep === 1 && (
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center space-y-8 border border-yellow-500/20">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400"></div>
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-3xl mb-1 shadow-lg shadow-yellow-500/10">
              ⚡
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
                Inducción Dopaminérgica Inicial
              </h1>
              <p className="text-xs text-yellow-400 font-mono tracking-widest uppercase">Estimulación de Foco y Motivación</p>
            </div>

            <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
              Bienvenido, <strong className="text-yellow-400">{studentName}</strong>, a la plataforma de autoaprendizaje **MED-228**. 
              Estás a punto de iniciar un viaje clínico adaptativo. Iniciamos este proceso preparando tus receptores dopaminérgicos para el foco cognitivo.
            </p>

            {/* Perla Bates */}
            <div className="p-5 rounded-2xl bg-gray-900/50 border border-yellow-500/10 text-left max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl"></div>
              <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-semibold mb-2">💡 Perla Clínica - Bates (Exploración Física)</p>
              <p className="text-xs text-gray-300 italic leading-relaxed">
                {CLINICAL_PEARLS[0]}
              </p>
            </div>

            {/* Botón con bloqueo y partículas */}
            <div className="relative inline-block">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute pointer-events-none w-2 h-2 rounded-full animate-ping"
                  style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    backgroundColor: p.color,
                    transform: 'translate(-50%, -50%)',
                    animationDuration: '800ms'
                  }}
                />
              ))}
              
              <button
                disabled={isLocked}
                onClick={triggerDopamineParticles}
                className={`px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg shadow-yellow-500/10 transition-all duration-300 transform active:scale-95 flex items-center gap-2 cursor-pointer ${
                  isLocked ? 'opacity-50 cursor-not-allowed border-gray-800' : 'border border-yellow-400/20'
                }`}
              >
                {isLocked ? (
                  <span>🔒 Espere ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>🎁 Reclamar Recompensa Inicial</span> ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 2: CORTISOL (DIAGNÓSTICO CON ESTRÉS / TIEMPO) */}
        {!isLoading && currentStep === 2 && (
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 border border-blue-500/20 animate-fade-slide">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" 
                style={{ width: `${((currentQuestionIdx + 1) / 5) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-blue-400 tracking-wider">
              <span>ESTRÉS COGNITIVO CONTROLADO (CORTISOL)</span>
              <span>PREGUNTA {currentQuestionIdx + 1} DE 5</span>
            </div>

            {/* Contador de Tiempo */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-blue-500/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span className="text-xs text-gray-400">Tiempo restante para responder:</span>
              </div>
              <span className={`font-mono text-sm font-bold px-3 py-1 rounded-md ${
                questionTimeLeft > 30 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              }`}>
                {questionTimeLeft} segundos
              </span>
            </div>

            {/* Caso Clínico */}
            <div className="p-4 rounded-xl bg-gray-950/40 border border-gray-800/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">📖 Caso Clínico Presentado:</p>
              <p className="text-xs text-gray-300 leading-relaxed italic">
                &quot;{DIAGNOSTIC_QUESTIONS[currentQuestionIdx].scenario}&quot;
              </p>
            </div>

            {/* Pregunta */}
            <h3 className="text-sm font-bold text-gray-100 leading-snug">
              {DIAGNOSTIC_QUESTIONS[currentQuestionIdx].question}
            </h3>

            {/* Opciones */}
            <div className="space-y-3">
              {DIAGNOSTIC_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestionIdx + 1] === idx;
                const isCorrect = idx === DIAGNOSTIC_QUESTIONS[currentQuestionIdx].correctAnswer;
                
                let buttonStyle = "border-gray-800 bg-gray-900/20 text-gray-300 hover:bg-gray-900/60 hover:border-gray-700";
                if (showJustification) {
                  if (isCorrect) {
                    buttonStyle = "border-green-500/30 bg-green-500/10 text-green-400";
                  } else if (isSelected) {
                    buttonStyle = "border-red-500/30 bg-red-500/10 text-red-400";
                  } else {
                    buttonStyle = "border-gray-900 bg-gray-950/20 text-gray-500 pointer-events-none";
                  }
                } else if (isSelected) {
                  buttonStyle = "border-blue-500/40 bg-blue-500/10 text-blue-300";
                }

                return (
                  <button
                    key={idx}
                    disabled={showJustification}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${buttonStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-800 text-[10px] font-bold text-gray-400 border border-gray-700 select-none">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Justificación y Siguiente */}
            {showJustification && (
              <div className="space-y-4 pt-4 border-t border-gray-800/60">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-gray-300 leading-relaxed">
                  <p className="font-bold text-blue-400 mb-1">💡 Justificación Médica:</p>
                  <p>{DIAGNOSTIC_QUESTIONS[currentQuestionIdx].justification}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={isLocked}
                    onClick={handleNextQuestion}
                    className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      isLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLocked ? (
                      <span>🔒 ({lockCountdown}s)</span>
                    ) : (
                      <>
                        <span>{currentQuestionIdx === 4 ? "Ver Diagnóstico" : "Siguiente Caso"}</span> ➔
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANTALLA 3: SEROTONINA (RESULTADOS Y CARTA DE BIENVENIDA) */}
        {!isLoading && currentStep === 3 && (
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 border border-green-500/20 animate-fade-slide">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-400"></div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-2xl select-none mb-1">
                🌱
              </div>
              <h2 className="text-2xl font-display font-extrabold text-gray-100">Estabilización y Satisfacción (Serotonina)</h2>
              <p className="text-xs text-green-400 font-mono tracking-widest uppercase">Análisis Curricular y de Competencias</p>
            </div>

            {/* Tarjetas de Calificación */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Calificación MED-224</p>
                <p className="text-2xl font-mono font-bold text-blue-400 mt-1">{score}/100</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Factor de Facilidad (EF)</p>
                <p className="text-2xl font-mono font-bold text-indigo-400 mt-1">{easeFactor.toFixed(2)}</p>
              </div>
            </div>

            {/* Desglose de Competencias Reales */}
            <div className="space-y-4 bg-gray-950/40 p-5 rounded-2xl border border-gray-800">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">📊 Distribución de Competencias Clínicas (MED-224):</p>
              
              {/* CG2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>CG2: Comunicación Efectiva con el Paciente</span>
                  <span className="text-green-400">{getCompetencyPercent('CG2')}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${getCompetencyPercent('CG2')}%` }}></div>
                </div>
              </div>

              {/* CG6 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>CG6: Elaboración de Historia Clínica Integral</span>
                  <span className="text-green-400">{getCompetencyPercent('CG6')}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${getCompetencyPercent('CG6')}%` }}></div>
                </div>
              </div>

              {/* CG8 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>CG8: Métodos y Procedimientos Diagnósticos</span>
                  <span className="text-green-400">{getCompetencyPercent('CG8')}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${getCompetencyPercent('CG8')}%` }}></div>
                </div>
              </div>
            </div>

            {/* Carta del Coordinador */}
            <div className="p-5 rounded-2xl bg-gray-900/30 border border-green-500/10 text-xs text-gray-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
              <p className="font-semibold text-green-400 mb-2 border-b border-gray-800 pb-1.5 uppercase tracking-widest text-[9px]">✉️ Mensaje del Coordinador de Cátedra</p>
              <p className="italic leading-relaxed mb-4">
                &quot;Estimado colega en formación, felicitaciones por completar tu diagnóstico. 
                Los resultados han sido procesados por nuestro motor adaptativo. Tu factor de facilidad ({easeFactor.toFixed(2)}) 
                se ha integrado para balancear la carga cognitiva de tus repasos semanales de Semiología. 
                Mantén la disciplina en tus repasos.&quot;
              </p>
              <p className="text-[10px] font-bold text-right text-gray-400">Dr. Angel Augusto Tusen Madrigal</p>
              <p className="text-[9px] text-right text-gray-500">Coordinador de Semiología UCE</p>
            </div>

            <div className="flex justify-end">
              <button
                disabled={isLocked}
                onClick={handleSerotoninaNext}
                className={`px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer border border-green-400/20 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLocked ? (
                  <span>🔒 ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>Siguiente Etapa</span> ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 4: NOREPINEFRINA (ALERTA / RIESGO CLINICO) */}
        {!isLoading && currentStep === 4 && (
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 border border-red-500/20 animate-fade-slide bg-red-950/5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-600"></div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-2xl select-none mb-1 animate-pulse">
                🚨
              </div>
              <h2 className="text-2xl font-display font-extrabold text-gray-100">Alerta de Desempeño y Emergencia (Norepinefrina)</h2>
              <p className="text-xs text-red-400 font-mono tracking-widest uppercase">Simulación de Urgencia en Sala</p>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed text-center font-semibold animate-pulse">
              ⚠️ ATENCIÓN: Tu primer paciente simulado te espera en la sala de emergencias
            </div>

            {/* Caso de Cefalea (María Rodríguez) */}
            <div className="p-5 rounded-2xl bg-gray-950/60 border border-red-500/10 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-gray-300">Paciente: María Rodríguez, 32 años</span>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 rounded-full border border-red-500/30">Nivel de Emergencia: Alto</span>
              </div>
              
              <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
                <p>👩‍⚕️ **Cuadro Clínico:** Paciente femenina ingresa con cefalea de inicio súbito, descrita como &quot;el peor dolor de cabeza de su vida&quot;, con intensidad 10/10, acompañada de rigidez de nuca y fotofobia moderada.</p>
                <p>📋 **Competencias Evaluadas:** Integración del método clínico, descarte de banderas rojas (Red Flags) en cefalea y razonamiento sindrómico socrático.</p>
                <p>🎯 **Preparación Curricular:** Esta simulación OSCE consolida la competencia **CG6 (Historia Clínica)** y **CG8 (Procedimientos Diagnósticos)** para el Bloque 1 de Semiología.</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed max-w-md mx-auto">
              A partir del Bloque 1, desbloquearás el **Simulador Socrático de Paciente Virtual** y las estaciones **OSCE**. 
              Este entorno evaluará tu toma de decisiones bajo presión controlada de tiempo.
            </p>

            <div className="flex justify-end">
              <button
                disabled={isLocked}
                onClick={handleNorepinefrinaNext}
                className={`px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer border border-red-400/20 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLocked ? (
                  <span>🔒 ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>Siguiente Etapa</span> ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 5: OXITOCINA (PERTENENCIA COHORTE + COMPLETADO) */}
        {!isLoading && currentStep === 5 && (
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 border border-purple-500/20 animate-fade-slide">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600"></div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-2xl select-none mb-1 shadow-lg shadow-purple-500/10">
                👥
              </div>
              <h2 className="text-2xl font-display font-extrabold text-gray-100">Pertenencia de Cohorte (Oxitocina)</h2>
              <p className="text-xs text-purple-400 font-mono tracking-widest uppercase">Comunidad Académica y Redes Colaborativas</p>
            </div>

            <p className="text-xs text-gray-300 text-center leading-relaxed max-w-md mx-auto">
              El aprendizaje médico no se hace de forma aislada. Te encuentras registrado en la cohorte **2026-A** de la UCE. 
              Junto a ti, otros médicos en formación están interactuando y repasando el temario de MED-228.
            </p>

            {/* Grid de Cohorte Simulada */}
            <div className="bg-gray-950/40 p-5 rounded-2xl border border-gray-800 space-y-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none border-b border-gray-800 pb-1.5">👥 Miembros de la cohorte activos ahora:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center gap-3">
                  <span className="text-lg">🧑‍⚕️</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">Dr. José Pérez</p>
                    <p className="text-[9px] text-green-400 font-medium">UASD · Activo ahora</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center gap-3">
                  <span className="text-lg">👩‍⚕️</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">Dra. Altagracia Castillo</p>
                    <p className="text-[9px] text-green-400 font-medium">UCE · Hace 3m</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center gap-3">
                  <span className="text-lg">🩺</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">Dr. Angel Tusen (Docente)</p>
                    <p className="text-[9px] text-indigo-400 font-medium">UCE · En línea (Validador)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center gap-3">
                  <span className="text-lg">👩‍⚕️</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">Dra. María Rodríguez</p>
                    <p className="text-[9px] text-green-400 font-medium">INTEC · Activa ahora</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={isLocked}
                onClick={handleFinishOnboarding}
                className={`px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer border border-purple-400/20 ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLocked ? (
                  <span>🔒 ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>Ingresar al Portal Académico</span> ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
