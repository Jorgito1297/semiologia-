'use client';

import React, { useState, use, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/services/supabase';
import { calculateSM2, SM2State } from '@/utils/sm2';
import { getMemoryRiskStatus } from '@/utils/cognitive_metrics';
import { trackPrivateMetric } from '@/utils/private_metrics';
import { SEMIOLOGIA_SEGUNDO_PARCIAL, SEMIOLOGIA_TERCER_PARCIAL } from './data';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  domain: 'semantic' | 'procedural' | 'executive' | 'perceptual';
  reference?: string;
}

interface QuizQuestion {
  id: number;
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  justification: string;
  pearl: string;
  competencies: string[];
  reference?: string;
}

interface QuestionBankResponse {
  questions: QuizQuestion[];
  warning?: string;
}

// Datos de simulación locales por materia para Doble Modo
const COURSE_REVIEWS_MOCK: Record<string, {
  title: string;
  code: string;
  color: string;
  syllabusObjective: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}> = {
  semiologia: {
    title: "Semiología Médica",
    code: "MED-228",
    color: "blue",
    syllabusObjective: "Integrar anamnesis y exploración física pulmonar para discriminar síndromes pleuropulmonares clásicos.",
    flashcards: [
      { id: 1, question: "¿Cuál es el hallazgo percutorio característico en el neumotórax y qué lo diferencia del derrame pleural?", answer: "En el neumotórax hay timpanismo (aire en el espacio pleural). En el derrame pleural hay matidez (líquido en el espacio pleural).", domain: "semantic" },
      { id: 2, question: "Describa la maniobra correcta de palpación para evaluar las vibraciones vocales (V.V.).", answer: "Colocar la mano plana (o borde cubital) sobre la pared torácica mientras el paciente repite 'treinta y tres'. Se recorren ambos campos de forma simétrica.", domain: "procedural" },
      { id: 3, question: "¿Qué sucede con el murmullo vesicular (M.V.) y las vibraciones vocales en el síndrome de condensación?", answer: "En el síndrome de condensación pulmonar (ej. neumonía), el M.V. está abolido o reemplazado por soplo tubárico, pero las vibraciones vocales están AUMENTADAS debido a la mayor densidad del tejido sólido.", domain: "executive" },
      { id: 4, question: "Identifique el hallazgo auscultatorio de un frote pleural y cómo distinguirlo de los estertores crepitantes.", answer: "El frote pleural se asemeja al crujido de cuero nuevo, se oye en ambas fases respiratorias y no cambia con la tos. Los crepitantes son ruidos discontinuos burbujeantes principalmente al final de la integración.", domain: "perceptual" }
    ],
    quiz: [
      {
        id: 1,
        scenario: "Varón de 28 años ingresa por disnea súbita y dolor pleurítico derecho. Al examen: inspección con disminución de expansión pulmonar derecha; palpación con abolición de vibraciones vocales; percusión con timpanismo marcado; auscultación con murmullo vesicular ausente.",
        question: "¿Cuál es el síndrome clínico más probable?",
        options: [
          "Derrame Pleural Masivo",
          "Neumotórax Espontáneo",
          "Síndrome de Condensación Lobar",
          "Atelectasia obstructiva",
          "Tromboembolismo Pulmonar"
        ],
        correctAnswer: 1,
        justification: "La tríada clásica de abolición de vibraciones vocales, timpanismo y ausencia de ruidos respiratorios es altamente patognomónica de aire en cavidad pleural (neumotórax). El derrame pleural cursaría con matidez en lugar de timpanismo.",
        pearl: "Mnemotecnia del Neumotórax: Aire = Timbal (Timpanismo) + Silencio (Abolición).",
        competencies: ["CG6", "CG8"]
      },
      {
        id: 2,
        scenario: "Durante la auscultación pulmonar de un paciente con disnea, usted percibe un ruido continuo, de tono bajo y grave, similar a un ronquido, que modifica o disminuye notablemente tras indicarle al paciente que tosa.",
        question: "¿Qué tipo de estertor está describiendo y cuál es su origen fisiopatológico?",
        options: [
          "Estertor sibilante - broncoespasmo de pequeños bronquios",
          "Estertor roncus - presencia de secreciones espesas en grandes bronquios",
          "Estertor crepitante - distensión de alvéolos con líquido",
          "Frote pleural - roce de las hojas pleurales inflamadas",
          "Estridor laríngeo - obstrucción de la vía aérea alta"
        ],
        correctAnswer: 1,
        justification: "El roncus es un ruido húmedo continuo provocado por la vibración de aire a través de conductos estenosados por secreciones densas. Su característica clínica clave es que disminuye o desaparece con la movilización de secreciones al toser.",
        pearl: "Perla de la Cátedra: El roncus viaja en los grandes bronquios; la tos los despeja.",
        competencies: ["CG2", "CG8"]
      }
    ]
  },
  farmacologia: {
    title: "Farmacología Clínica",
    code: "FAR-301",
    color: "red",
    syllabusObjective: "Analizar el perfil farmacocinético y farmacodinámico de los betabloqueadores e inhibidores del eje RAA.",
    flashcards: [
      { id: 1, question: "¿Qué diferencia el mecanismo de acción de un IECA frente a un ARA-II?", answer: "El IECA inhibe la enzima convertidora evitando la formación de Angiotensina II y acumulando bradicinina (causa tos). El ARA-II bloquea directamente el receptor AT1 de la Angiotensina II.", domain: "semantic" },
      { id: 2, question: "¿Cuál es la principal contraindicación para prescribir un betabloqueador no selectivo como el Propranolol?", answer: "Pacientes con asma o EPOC activo, debido a que el bloqueo de receptores beta-2 provoca broncoespasmo severo.", domain: "executive" }
    ],
    quiz: [
      {
        id: 1,
        scenario: "Paciente de 62 años hipertenso y diabético inicia tratamiento antihipertensivo. A las pocas semanas desarrolla tos seca persistente, molesta, sin otros síntomas respiratorios.",
        question: "¿Cuál de los siguientes fármacos es responsable directo de este efecto secundario?",
        options: [
          "Losartán",
          "Amlodipina",
          "Enalapril",
          "Hidroclorotiazida",
          "Metoprolol"
        ],
        correctAnswer: 2,
        justification: "El Enalapril es un IECA que inhibe la degradación de bradicininas en el tracto respiratorio. La acumulación de bradicininas estimula terminales nerviosas del reflejo de la tos, provocando tos seca típica en un 10-15% de pacientes.",
        pearl: "IECA = Tos por Bradicinina. Sustituir siempre por ARA-II (Losartán).",
        competencies: ["CG8"]
      }
    ]
  },
  fisiopatologia: {
    title: "Fisiopatología",
    code: "FIS-302",
    color: "purple",
    syllabusObjective: "Discriminar los mecanismos de edema sistémico y la fisiopatología del shock cardiogénico.",
    flashcards: [
      { id: 1, question: "¿Cuáles son las 4 fuerzas de Starling que determinan el movimiento de líquidos?", answer: "Presión hidrostática capilar, presión hidrostática intersticial, presión oncótica capilar y presión oncótica intersticial.", domain: "semantic" },
      { id: 2, question: "Explique la fisiopatología del edema en la insuficiencia cardíaca congestiva.", answer: "La caída del gasto cardíaco reduce el flujo renal, activando el eje RAA. Esto produce retención de agua y sodio, aumentando la presión hidrostática capilar.", domain: "executive" }
    ],
    quiz: [
      {
        id: 1,
        scenario: "Paciente con cirrosis hepática avanzada presenta distensión abdominal marcada (ascitis) y edema bilateral en miembros inferiores. Laboratorio muestra Albúmina sérica de 2.1 g/dL (normal > 3.5).",
        question: "¿Qué alteración de las fuerzas de Starling es el mecanismo iniciador principal del edema?",
        options: [
          "Aumento de la presión hidrostática capilar",
          "Disminución de la presión coloidoncótica capilar",
          "Aumento de la permeabilidad capilar",
          "Obstrucción del drenaje linfático",
          "Disminución de la presión intersticial"
        ],
        correctAnswer: 1,
        justification: "La hipoalbuminemia severa debida a la falla de síntesis hepática reduce la presión coloidoncótica (oncótica) intravascular, perdiendo la capacidad de retener el agua dentro del capilar, promoviendo su trasudación.",
        pearl: "Albúmina baja = Presión oncótica deficiente. El agua se escapa al intersticio.",
        competencies: ["CG8"]
      }
    ]
  }
};

export default function RepasoCursoPage({ params }: { params: Promise<{ curso: string }> }) {
  const resolvedParams = use(params);
  const cursoKey = resolvedParams.curso.toLowerCase();
  
  return <RepasoCursoContent key={cursoKey} cursoKey={cursoKey} />;
}

function RepasoCursoContent({ cursoKey }: { cursoKey: string }) {
  const [selectedParcial, setSelectedParcial] = useState<1 | 2 | 3>(3);
  
  const courseData = (cursoKey === 'semiologia' && selectedParcial === 2)
    ? {
        title: SEMIOLOGIA_SEGUNDO_PARCIAL.title,
        code: SEMIOLOGIA_SEGUNDO_PARCIAL.code,
        color: "blue",
        syllabusObjective: SEMIOLOGIA_SEGUNDO_PARCIAL.syllabusObjective,
        flashcards: SEMIOLOGIA_SEGUNDO_PARCIAL.flashcards,
        quiz: SEMIOLOGIA_SEGUNDO_PARCIAL.quiz,
      }
    : (cursoKey === 'semiologia' && selectedParcial === 3)
    ? {
        title: SEMIOLOGIA_TERCER_PARCIAL.title,
        code: SEMIOLOGIA_TERCER_PARCIAL.code,
        color: "purple",
        syllabusObjective: SEMIOLOGIA_TERCER_PARCIAL.syllabusObjective,
        flashcards: SEMIOLOGIA_TERCER_PARCIAL.flashcards,
        quiz: SEMIOLOGIA_TERCER_PARCIAL.quiz,
      }
    : (COURSE_REVIEWS_MOCK[cursoKey] || COURSE_REVIEWS_MOCK.semiologia);

  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  // Estado de Flashcards
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<Record<number, SM2State>>({});
  const [cardMessage, setCardMessage] = useState('');
  const [isRatingInProgress, setIsRatingInProgress] = useState(false);
  const ratingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado de Quiz
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizGenerationError, setQuizGenerationError] = useState('');

  const activeCard = courseData.flashcards[currentCardIdx];
  const quizItems = generatedQuiz && generatedQuiz.length > 0 ? generatedQuiz : courseData.quiz;
  const activeQuiz = quizItems[currentQuizIdx];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read demo mode flag from localStorage on mount
    setIsDemoMode(localStorage.getItem('is_demo') !== 'false');
    trackPrivateMetric({ event: 'page_view_repaso', course: cursoKey, userType: 'student' });

    const savedStates = localStorage.getItem(`sm2_states_${cursoKey}_p${selectedParcial}`);
    if (!savedStates) {
      setCardStates({});
      return;
    }

    try {
      setCardStates(JSON.parse(savedStates));
    } catch {
      setCardStates({});
    }
  }, [cursoKey, selectedParcial]);

  useEffect(() => {
    trackPrivateMetric({ event: 'repaso_tab_changed', course: cursoKey, meta: { tab: activeTab } });
  }, [activeTab, cursoKey]);

  useEffect(() => {
    let cancelled = false;

    const loadQuestionBank = async () => {
      setIsGeneratingQuiz(true);
      setQuizGenerationError('');

      try {
        const qty = (cursoKey === 'semiologia' && (selectedParcial === 2 || selectedParcial === 3)) ? 50 : 8;
        const parcialParam = cursoKey === 'semiologia' ? `&parcial=${selectedParcial}` : '';
        const response = await fetch(
          `/api/question-bank?curso=${encodeURIComponent(cursoKey)}&qty=${qty}${parcialParam}`
        );
        if (!response.ok) {
          throw new Error('No se pudo generar banco dinámico de preguntas.');
        }

        const data: QuestionBankResponse = await response.json();
        if (cancelled) return;

        if (data.warning) {
          setQuizGenerationError(data.warning);
          trackPrivateMetric({
            event: 'quiz_bank_warning',
            course: cursoKey,
            meta: { warning: data.warning.slice(0, 180) },
          });
        }

        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setGeneratedQuiz(data.questions);
          trackPrivateMetric({
            event: 'quiz_bank_dynamic_loaded',
            course: cursoKey,
            meta: { questions: data.questions.length },
          });
        } else {
          setGeneratedQuiz(null);
          trackPrivateMetric({ event: 'quiz_bank_empty_fallback_local', course: cursoKey });
        }
      } catch {
        if (!cancelled) {
          setGeneratedQuiz(null);
          setQuizGenerationError('Usando banco local por falta de generación dinámica.');
          trackPrivateMetric({ event: 'quiz_bank_error_fallback_local', course: cursoKey });
        }
      } finally {
        if (!cancelled) {
          setCurrentQuizIdx(0);
          setSelectedOption(null);
          setQuizSubmitted(false);
          setQuizScore(0);
          setQuizCompleted(false);
          setQuizAnswers({});
          setIsGeneratingQuiz(false);
        }
      }
    };

    loadQuestionBank();

    return () => {
      cancelled = true;
    };
  }, [cursoKey, selectedParcial]);

  useEffect(() => {
    return () => {
      if (ratingTimeoutRef.current) {
        clearTimeout(ratingTimeoutRef.current);
      }
    };
  }, []);

  // Lógica de calificación de Flashcard (SM-2)
  const handleRateCard = async (quality: number) => {
    if (!activeCard || isRatingInProgress) return;
    setIsRatingInProgress(true);
    
    const currentState = cardStates[activeCard.id] || {
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.5
    };

    const nextState = calculateSM2(
      quality, 
      currentState.repetitions, 
      currentState.intervalDays, 
      currentState.easeFactor
    );

    const updatedStates = {
      ...cardStates,
      [activeCard.id]: nextState
    };

    setCardStates(updatedStates);
    localStorage.setItem(`sm2_states_${cursoKey}_p${selectedParcial}`, JSON.stringify(updatedStates));

    const nextReviewDate = new Date(Date.now() + nextState.intervalDays * 24 * 60 * 60 * 1000).toISOString();
    const riskInfo = getMemoryRiskStatus(nextReviewDate, nextState.easeFactor);
    setCardMessage(`${riskInfo.label}: ${riskInfo.copywriting}`);

    // Sincronizar con Supabase si está en modo producción
    if (!isDemoMode && supabaseClient) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Buscamos el ID del estudiante
          const { data: student } = await supabaseClient
            .from('students')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (student) {
            // Buscamos el ID del chunk correspondiente en content_chunks (si existe)
            const { data: chunk } = await supabaseClient
              .from('content_chunks')
              .select('id')
              .eq('source_book', courseData.title)
              .limit(1)
              .single();

            if (chunk) {
              await supabaseClient
                .from('student_memory_states')
                .upsert({
                  student_id: student.id,
                  chunk_id: chunk.id,
                  memory_domain: activeCard.domain,
                  accuracy_pct: quality * 20,
                  interval_days: nextState.intervalDays,
                  ease_factor: nextState.easeFactor,
                  next_review_at: new Date(Date.now() + nextState.intervalDays * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'student_id, chunk_id, memory_domain' });
            }
          }
        }
      } catch (err) {
        console.warn("Fallo en sincronización RAG Supabase, operando localmente:", err);
      }
    }

    ratingTimeoutRef.current = setTimeout(() => {
      setCardMessage('');
      setIsFlipped(false);
      setCurrentCardIdx((prev) => {
        if (prev < courseData.flashcards.length - 1) {
          return prev + 1;
        }
        return 0; // Reiniciar ciclo
      });
      setIsRatingInProgress(false);
    }, 1500);
  };

  // Lógica de Quiz
  const handleSelectOption = (idx: number) => {
    if (quizSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubimitQuizAnswer = () => {
    if (selectedOption === null || quizSubmitted) return;
    setQuizSubmitted(true);

    trackPrivateMetric({
      event: 'quiz_answer_validated',
      course: cursoKey,
      meta: {
        questionIndex: currentQuizIdx,
        selectedOption,
        correctOption: activeQuiz.correctAnswer,
        isCorrect: selectedOption === activeQuiz.correctAnswer,
      },
    });
    
    setQuizAnswers({
      ...quizAnswers,
      [currentQuizIdx]: selectedOption
    });

    if (selectedOption === activeQuiz.correctAnswer) {
      setQuizScore(quizScore + 1);
    }
  };

  const handleNextQuiz = async () => {
    setSelectedOption(null);
    setQuizSubmitted(false);

    if (currentQuizIdx < quizItems.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
    } else {
      setQuizCompleted(true);
      trackPrivateMetric({
        event: 'quiz_completed',
        course: cursoKey,
        score: quizScore,
        meta: { totalQuestions: quizItems.length },
      });
      
      // BUG-FIX: quizAnswers[currentQuizIdx] is still empty for the last question
      // because setQuizAnswers (called in handleSubimitQuizAnswer) is async.
      // Build finalAnswers merging the committed state with the current answer.
      const finalAnswers = { ...quizAnswers, [currentQuizIdx]: selectedOption };

      // Calcular progreso por competencias (CG)
      const competencyStats: Record<string, { attempted: number, correct: number }> = {};
      quizItems.forEach((q: QuizQuestion, idx: number) => {
        const answer = finalAnswers[idx];
        const isCorrect = answer !== undefined && answer === q.correctAnswer;
        q.competencies.forEach((comp: string) => {
          if (!competencyStats[comp]) {
            competencyStats[comp] = { attempted: 0, correct: 0 };
          }
          competencyStats[comp].attempted += 1;
          if (isCorrect) {
            competencyStats[comp].correct += 1;
          }
        });
      });

      // Guardar localmente para Doble Modo
      localStorage.setItem(`competency_stats_${cursoKey}`, JSON.stringify(competencyStats));

      // Sincronizar con Supabase
      if (!isDemoMode && supabaseClient) {
        try {
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
            const { data: student } = await supabaseClient
              .from('students')
              .select('id')
              .eq('auth_id', user.id)
              .single();

            const { data: course } = await supabaseClient
              .from('courses')
              .select('id')
              .eq('code', courseData.code)
              .single();

            if (student && course) {
              for (const [comp, stats] of Object.entries(competencyStats)) {
                const mastery = Math.round((stats.correct / stats.attempted) * 100);
                await supabaseClient
                  .from('student_competency_progress')
                  .upsert({
                    student_id: student.id,
                    course_id: course.id,
                    competency: comp,
                    mastery_pct: mastery,
                    items_attempted: stats.attempted,
                    items_correct: stats.correct
                  }, { onConflict: 'student_id, course_id, competency' });
              }
              console.log("[QUIZ]: Progreso de competencias sincronizado en Supabase.");
            }
          }
        } catch (err) {
          console.warn("Fallo en sincronización de competencias en Supabase:", err);
        }
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const activeCardState = activeCard ? cardStates[activeCard.id] : null;

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-gray-100 pb-16 relative overflow-x-hidden">
      
      {/* BACKGROUND DECORATIONS */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl -z-10 opacity-10 ${
        cursoKey === 'farmacologia' ? 'bg-red-500' : cursoKey === 'fisiopatologia' ? 'bg-purple-500' : 'bg-blue-500'
      }`}></div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* ENCABEZADO */}
        <header className="glass rounded-3xl p-6 mb-8 relative border-l-4 border-l-blue-500 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                  {courseData.code}
                </span>
                <span className="text-xs text-gray-400">• Bloque 2 Activo</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold mt-2 tracking-tight">
                Repaso Interactivo: {courseData.title}
              </h1>
              <p className="text-gray-400 text-xs mt-1">
                Objetivo: {courseData.syllabusObjective}
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ➔ Volver al Portal
            </Link>
          </div>
        </header>

        {/* SELECTOR DE PARCIAL (Solo para Semiología Médica) */}
        {cursoKey === 'semiologia' && (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-900/50 p-1.5 rounded-full border border-gray-800/80 flex gap-1 shadow-inner">
              <button
                onClick={() => {
                  setSelectedParcial(1);
                  restartQuiz();
                  setCurrentCardIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedParcial === 1
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                1er Parcial (Semanas 1-6)
              </button>
              <button
                onClick={() => {
                  setSelectedParcial(2);
                  restartQuiz();
                  setCurrentCardIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedParcial === 2
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                2do Parcial (Semanas 7-10)
              </button>
              <button
                onClick={() => {
                  setSelectedParcial(3);
                  restartQuiz();
                  setCurrentCardIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedParcial === 3
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                3er Parcial (Semanas 11-15)
              </button>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN TABS */}
        <div className="flex gap-4 mb-8 bg-gray-900/40 p-1.5 rounded-2xl border border-gray-800/80 max-w-sm">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flashcards' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📇 Flashcards (SM-2)
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quiz' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📋 Simulador de Quiz
          </button>
        </div>

        {/* CONTENIDOS DE TAB 1: FLASHCARDS */}
        {activeTab === 'flashcards' && activeCard && (
          <div className="space-y-6">
            
            {/* Visualizador de Repetición Espaciada */}
            <div className="flex justify-between items-center bg-gray-900/30 border border-gray-800/60 p-4 rounded-2xl text-xs">
              <div className="text-gray-400">
                Tarjeta {currentCardIdx + 1} de {courseData.flashcards.length}
                <span className="mx-2 text-gray-600">|</span>
                Dominio: <strong className="text-blue-400 uppercase font-mono">{activeCard.domain}</strong>
              </div>
              <div className="text-gray-400 flex gap-3">
                <span>Repeticiones: <strong className="text-gray-200">{activeCardState?.repetitions || 0}</strong></span>
                <span>Intervalo: <strong className="text-gray-200">{activeCardState?.intervalDays || 1}d</strong></span>
                <span>EF: <strong className="text-gray-200">{activeCardState?.easeFactor?.toFixed(2) || "2.50"}</strong></span>
              </div>
            </div>

            {/* Flashcard Flip-Card Container */}
            <div 
              onClick={() => {
                if (isRatingInProgress) return;
                setIsFlipped(!isFlipped);
              }}
              className="h-80 w-full relative cursor-pointer"
              style={{ perspective: '1000px' }}
            >
              <div
                className="w-full h-full duration-500 relative"
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 500ms',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                
                {/* LADO FRONTAL (Pregunta) */}
                <div
                  className="absolute inset-0 w-full h-full glass border border-gray-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl bg-[#0f1424]/90"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">❓ Pregunta de Memorización Activa</div>
                  <div 
                    className="text-lg md:text-xl font-bold text-gray-100 leading-relaxed text-center my-auto"
                    dangerouslySetInnerHTML={{ __html: activeCard.question }}
                  />
                  <div className="text-center text-xs text-gray-400 animate-pulse select-none">Haz clic para ver respuesta</div>
                </div>

                {/* LADO POSTERIOR (Respuesta) */}
                <div
                  className="absolute inset-0 w-full h-full glass border border-gray-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl bg-[#0b1b36]/90"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">✅ Respuesta de la Cátedra</span>
                    {activeCard.reference && (
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 max-w-[70%] truncate" title={activeCard.reference}>
                        📚 {activeCard.reference}
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-base md:text-lg text-gray-200 leading-relaxed text-center my-auto"
                    dangerouslySetInnerHTML={{ __html: activeCard.answer }}
                  />
                  <div className="text-center text-xs text-gray-400 select-none">Haz clic para ocultar</div>
                </div>

              </div>
            </div>

            {/* Calificación SM-2 */}
            {isFlipped && (
              <div className="glass border border-gray-800 p-6 rounded-3xl space-y-4 animate-fadeIn">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                  ¿Qué tan bien recordaste esta tarjeta?
                </h4>
                <div className="grid grid-cols-6 gap-2.5 max-w-xl mx-auto">
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(0)}
                    className="py-2.5 bg-red-950/20 hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-red-900/30 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Olvido total"
                  >
                    Olvido (0)
                  </button>
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(1)}
                    className="py-2.5 bg-orange-950/20 hover:bg-orange-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-900/30 text-orange-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Incorrecto, pero recordado"
                  >
                    Incorrecto (1)
                  </button>
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(2)}
                    className="py-2.5 bg-amber-950/20 hover:bg-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-900/30 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Incorrecto, fácil de recordar"
                  >
                    Dudoso (2)
                  </button>
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(3)}
                    className="py-2.5 bg-yellow-950/20 hover:bg-yellow-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-900/30 text-yellow-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Recuerdo con dificultad"
                  >
                    Regular (3)
                  </button>
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(4)}
                    className="py-2.5 bg-blue-950/20 hover:bg-blue-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-900/30 text-blue-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Buen recuerdo"
                  >
                    Bien (4)
                  </button>
                  <button
                    disabled={isRatingInProgress}
                    onClick={() => handleRateCard(5)}
                    className="py-2.5 bg-green-950/20 hover:bg-green-950/40 disabled:opacity-50 disabled:cursor-not-allowed border border-green-900/30 text-green-400 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    title="Perfecto"
                  >
                    Fácil (5)
                  </button>
                </div>
              </div>
            )}

            {/* Mensajes de actualización */}
            {cardMessage && (
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-center text-xs text-blue-300 font-mono animate-pulse">
                {cardMessage}
              </div>
            )}

          </div>
        )}

        {/* CONTENIDOS DE TAB 2: QUIZZES */}
        {activeTab === 'quiz' && activeQuiz && (
          <div className="space-y-6">
            <div className="text-[11px] text-gray-400 bg-gray-900/30 border border-gray-800/70 rounded-xl px-3 py-2">
              {isGeneratingQuiz
                ? 'Generando banco dinámico desde notas del curso...'
                : generatedQuiz && generatedQuiz.length > 0
                  ? `Banco dinámico activo (${generatedQuiz.length} preguntas).`
                  : 'Banco local activo.'}
              {quizGenerationError ? ` ${quizGenerationError}` : ''}
            </div>
            
            {!quizCompleted ? (
              <div className="glass rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-2xl space-y-6">
                
                {/* Cabecera de Pregunta */}
                <div className="flex justify-between items-center text-[10px] font-bold text-blue-400 tracking-wider">
                  <span>VIÑETA CLÍNICA ESTILO USMLE</span>
                  <span>PREGUNTA {currentQuizIdx + 1} DE {quizItems.length}</span>
                </div>

                {/* Caso Clínico */}
                <div 
                  className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/60 text-xs text-gray-300 leading-relaxed italic"
                  dangerouslySetInnerHTML={{ __html: `"${activeQuiz.scenario}"` }}
                />

                {/* Pregunta */}
                <h3 
                  className="text-sm md:text-base font-bold text-gray-100 leading-snug"
                  dangerouslySetInnerHTML={{ __html: activeQuiz.question }}
                />

                {/* Opciones */}
                <div className="space-y-3">
                  {activeQuiz.options.map((option: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === activeQuiz.correctAnswer;
                    
                    let buttonStyle = "border-gray-800 bg-gray-900/20 text-gray-300 hover:bg-gray-900/60 hover:border-gray-700";
                    if (quizSubmitted) {
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
                        disabled={quizSubmitted}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${buttonStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-800 text-[10px] font-bold text-gray-400 border border-gray-700 select-none">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: option }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Botón de Enviar */}
                {!quizSubmitted ? (
                  <button
                    disabled={selectedOption === null}
                    onClick={handleSubimitQuizAnswer}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-800 disabled:to-gray-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Validar Respuesta
                  </button>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-gray-800/60">
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-gray-300 leading-relaxed">
                      <p className="font-bold text-blue-400 mb-1">💡 Justificación Médica UCE:</p>
                      <p dangerouslySetInnerHTML={{ __html: activeQuiz.justification }} />
                      <p 
                        className="mt-2 text-green-400 font-semibold italic"
                        dangerouslySetInnerHTML={{ __html: `⭐ Perla: ${activeQuiz.pearl}` }}
                      />
                      {activeQuiz.reference && (
                        <p className="mt-2 text-blue-300/90 font-mono text-[10px] border-t border-gray-800/50 pt-2 flex items-center gap-1">
                          <span>📚 Referencia oficial:</span>
                          <span className="font-semibold">{activeQuiz.reference}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleNextQuiz}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        {currentQuizIdx === quizItems.length - 1 ? "Completar Quiz" : "Siguiente Caso"} ➔
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // RESULTADOS DEL QUIZ
              <div className="glass rounded-3xl p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 text-3xl select-none">
                  🎓
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-100">Evaluación Completada</h2>
                  <p className="text-xs text-gray-400 mt-1">Simulador Clínico MED-228</p>
                </div>
                <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 max-w-xs mx-auto">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Casos Correctos</p>
                  <p className="text-3xl font-mono font-bold text-blue-400 mt-1">
                    {quizScore} / {quizItems.length}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Tu memoria clínica mejora más rápido que tu fatiga cognitiva: <strong className="text-gray-300">{Math.round((quizScore / quizItems.length) * 100)}%</strong>
                  </p>
                </div>
                <div className="flex gap-3 justify-center max-w-sm mx-auto">
                  <button
                    onClick={restartQuiz}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl border border-gray-700 transition-colors cursor-pointer"
                  >
                    Reiniciar
                  </button>
                  <Link
                    href="/"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all text-center flex items-center justify-center cursor-pointer"
                  >
                    Salir
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
