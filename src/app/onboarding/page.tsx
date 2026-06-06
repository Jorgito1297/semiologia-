'use client';

import React, { useState } from 'react';
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = bienvenida, 1-5 = preguntas, 6 = resultados
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showJustification, setShowJustification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [initialEF, setInitialEF] = useState(2.5);
  const [studentName] = useState(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('study_email') || '';
      return email.split('@')[0] || 'Estudiante';
    }
    return 'Estudiante';
  });

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleSelectAnswer = (answerIdx: number) => {
    if (showJustification) return; // Bloquear selección tras responder
    setSelectedAnswers({
      ...selectedAnswers,
      [currentStep]: answerIdx
    });
    setShowJustification(true);
  };

  const handleNext = () => {
    setShowJustification(false);
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    setIsLoading(true);
    let correctCount = 0;
    
    DIAGNOSTIC_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = correctCount * 20;
    setScore(finalScore);

    // Ajuste de Ease Factor inicial según el rendimiento
    let calculatedEF = 2.5;
    if (finalScore >= 80) calculatedEF = 2.8; // Excelente base
    else if (finalScore >= 60) calculatedEF = 2.5; // Base regular
    else calculatedEF = 2.2; // Requiere repasos más frecuentes

    setInitialEF(calculatedEF);

    // Guardar estado local
    localStorage.setItem('med224_baseline_score', finalScore.toString());
    localStorage.setItem('med224_completed', 'true');
    localStorage.setItem('initial_ease_factor', calculatedEF.toString());

    // Guardar en Supabase si no es modo demo
    const isDemo = localStorage.getItem('is_demo') === 'true';
    if (!isDemo && supabaseClient) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Upsert en la tabla de estudiantes
          const { error } = await supabaseClient
            .from('students')
            .upsert({
              auth_id: user.id,
              full_name: user.user_metadata?.full_name || studentName,
              email: user.email || '',
              completed_med224: true,
              med224_baseline_score: finalScore
            }, { onConflict: 'auth_id' });
          
          if (error) throw error;
        }
      } catch (err) {
        console.warn("Fallo al persistir onboarding en Supabase. Operando en modo offline local:", err);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(6);
    }, 1500);
  };

  const handleFinish = () => {
    window.location.href = '/';
  };

  const activeQuestion = DIAGNOSTIC_QUESTIONS[currentStep - 1];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-[#0b0f19] text-gray-100">
      
      {/* BLOBS DECORATIVOS */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* CONTENEDOR */}
      <div className="w-full max-w-2xl z-10">
        
        {/* PASO 0: BIENVENIDA Y EXPLICACIÓN */}
        {currentStep === 0 && (
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"></div>
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-3xl mb-2">
              🩺
            </div>
            
            <h1 className="text-3xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              Evaluación Diagnóstica Inicial
            </h1>
            <p className="text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
              Hola, <strong className="text-blue-400">{studentName}</strong>. Antes de ingresar a la clínica y repasar el temario de **Semiología Médica (MED-228)**, debemos calibrar tu nivel de conocimientos previos en **Propedéutica I (MED-224)**.
            </p>

            <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800 text-left text-xs text-gray-400 space-y-2">
              <p>🎯 **Objetivo:** Calibrar tu *Ease Factor* inicial para el algoritmo de repetición espaciada (SM-2).</p>
              <p>📋 **Formato:** 5 viñetas clínicas de opción múltiple basadas en el manual UCE.</p>
              <p>⚠️ **Importante:** Responde honestamente para asegurar una frecuencia de repaso adaptada a tus necesidades reales.</p>
            </div>

            <button
              onClick={handleStart}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Comenzar Diagnóstico ➔
            </button>
          </div>
        )}

        {/* PASO 1-5: PREGUNTAS */}
        {currentStep >= 1 && currentStep <= 5 && activeQuestion && (
          <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" 
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-blue-400 tracking-wider">
              <span>PRERREQUISITO UCE MED-224</span>
              <span>PREGUNTA {currentStep} DE 5</span>
            </div>

            {/* Caso Clínico / Viñeta */}
            <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">📖 Caso Clínico Presentado:</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">
                &quot;{activeQuestion.scenario}&quot;
              </p>
            </div>

            {/* Pregunta */}
            <h3 className="text-base font-bold text-gray-100 leading-snug">
              {activeQuestion.question}
            </h3>

            {/* Opciones */}
            <div className="space-y-3">
              {activeQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentStep] === idx;
                const isCorrect = idx === activeQuestion.correctAnswer;
                
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

            {/* Justificación y Botón Siguiente */}
            {showJustification && (
              <div className="space-y-4 pt-4 border-t border-gray-800/60">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-gray-300 leading-relaxed">
                  <p className="font-bold text-blue-400 mb-1">💡 Justificación de la Cátedra:</p>
                  <p>{activeQuestion.justification}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    {currentStep === 5 ? "Ver Calificación" : "Siguiente Pregunta"} ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="glass rounded-3xl p-10 text-center space-y-6">
            {/* ECG SVG */}
            <div className="w-32 h-16 mx-auto relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 100" fill="none">
                <path
                  className="ekg-line"
                  d="M 0 50 L 80 50 L 100 20 L 120 80 L 140 45 L 150 55 L 160 50 L 200 50 L 210 10 L 225 90 L 240 40 L 250 55 L 260 50 L 300 50"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-200">Procesando respuestas del estudiante...</h3>
            <p className="text-xs text-gray-400">Calculando perfiles de dificultad y calibrando Ease Factor.</p>
          </div>
        )}

        {/* PASO 6: RESULTADOS Y RENDIMIENTO */}
        {currentStep === 6 && (
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-center space-y-8">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500"></div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 text-3xl select-none">
              🏆
            </div>

            <div>
              <h1 className="text-2xl font-display font-extrabold text-gray-100">
                ¡Diagnóstico Completado!
              </h1>
              <p className="text-xs text-gray-400 mt-1">Perfil de Aprendizaje NeuroAdaptativo Calibrado</p>
            </div>

            {/* Métrica de Puntuación */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Calificación MED-224</p>
                <p className="text-2xl font-mono font-bold text-blue-400 mt-1">{score}/100</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Factor de Facilidad (EF)</p>
                <p className="text-2xl font-mono font-bold text-indigo-400 mt-1">{initialEF.toFixed(2)}</p>
              </div>
            </div>

            {/* Perfil del Estudiante */}
            <div className="p-4 rounded-2xl bg-gray-900/20 border border-gray-800/60 max-w-md mx-auto text-xs text-gray-300 space-y-2 leading-relaxed text-left">
              <p className="font-bold text-blue-400 uppercase tracking-wide text-[10px] border-b border-gray-800 pb-1.5 mb-2 select-none">📋 Diagnóstico de Competencias:</p>
              {score >= 80 ? (
                <p>🌟 **Excelente Base (Nivel Avanzado):** Demuestras un gran dominio de las técnicas del examen físico e historia clínica de Propedéutica I. Tu frecuencia de repaso inicial será espaciada, permitiéndote avanzar más rápido.</p>
              ) : score >= 60 ? (
                <p>👍 **Base Regular (Nivel Intermedio):** Tienes los conocimientos básicos correctos, pero debes repasar las bases de percusión y redacción de HEA. Tu factor de facilidad se calibra en el valor estándar (2.5).</p>
              ) : (
                <p>⚠️ **Refuerzo Requerido (Nivel Inicial):** Se detectan debilidades en maniobras clínicas e integración del examen abdominal/torácico. El sistema programará repasos más frecuentes (EF=2.2) en estas áreas para asegurar tu retención a largo plazo.</p>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Ingresar al Portal de Estudio ➔
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
