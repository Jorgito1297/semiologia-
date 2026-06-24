'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Medical definitions and cases for the third midterm according to UCE curriculum
interface AbdomenCase {
  id: string;
  title: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  complaint: string;
  vitalSigns: {
    hr: number;
    rr: number;
    bp: string;
    spo2: number;
  };
  inspectionDesc: string;
  findings: Record<string, {
    inspeccion: string;
    auscultacion: string;
    percusion: string;
    palpacion: string;
    timpanismoType: 'timpanico' | 'mate';
    rhaVolume: number; // 0 = silent, 0.5 = diminished, 1 = normal, 1.8 = metallic/fight
    maneuvers?: Record<string, { positive: boolean; message: string }>;
  }>;
  generalManeuvers?: {
    quervain: string;
    mamas: string;
    giordano_der: string;
    giordano_izq: string;
  };
}

const CLINICAL_CASES: AbdomenCase[] = [
  {
    id: 'case_colecistitis',
    title: 'Colecistitis Aguda Calculosa',
    patientName: 'Mercedes Almonte',
    age: 54,
    gender: 'F',
    complaint: 'Dolor cólico intenso en hipocondrio derecho que se irradia a escápula homónima, náuseas y fiebre.',
    vitalSigns: { hr: 94, rr: 18, bp: '135/85', spo2: 97 },
    inspectionDesc: 'Abdomen plano, simétrico. Respiración de predominio costal debido a dolor al descender diafragma.',
    findings: {
      hipocondrio_der: {
        inspeccion: 'Piel indemne, sin cicatrices de colecistectomía.',
        auscultacion: 'RHA normoactivos (12 lpm).',
        percusion: 'Matidez hepática dolorosa.',
        palpacion: 'Dolor severo a la palpación profunda, con resistencia muscular involuntaria (defensa).',
        timpanismoType: 'mate',
        rhaVolume: 1.0,
        maneuvers: {
          murphy: {
            positive: true,
            message: 'Al presionar el punto cístico durante la inspiración profunda, la paciente interrumpe la entrada de aire bruscamente con un quejido de dolor. ¡Signo de Murphy Positivo!'
          }
        }
      },
      epigastrio: {
        inspeccion: 'Ligeramente distendido.',
        auscultacion: 'RHA presentes.',
        percusion: 'Timpanismo normal.',
        palpacion: 'Dolor moderado a la palpación profunda.',
        timpanismoType: 'timpanico',
        rhaVolume: 1.0
      }
    },
    generalManeuvers: {
      quervain: 'Tiroides de tamaño, superficie y consistencia normales. Deslizamiento suave sin nódulos.',
      mamas: 'Inspección simétrica, sin retracciones ni secreciones. Palpación sin nódulos ni adenopatías axilares.',
      giordano_der: 'Puñopercusión renal derecha negativa (no dolorosa).',
      giordano_izq: 'Puñopercusión renal izquierda negativa.'
    }
  },
  {
    id: 'case_apendicitis',
    title: 'Apendicitis Aguda (Fase Peritoneal)',
    patientName: 'José Miguel Vargas',
    age: 22,
    gender: 'M',
    complaint: 'Dolor inicialmente epigástrico que migró a fosa ilíaca derecha hace 12 horas, acompañado de anorexia y febrícula.',
    vitalSigns: { hr: 102, rr: 20, bp: '115/70', spo2: 99 },
    inspectionDesc: 'Abdomen plano, sutil limitación de la movilidad respiratoria en fosa ilíaca derecha.',
    findings: {
      fosa_iliaca_der: {
        inspeccion: 'Sin cicatrices (no apendicectomizado). Sin hernias visibles.',
        auscultacion: 'RHA muy disminuidos localmente (2 lpm).',
        percusion: 'Dolor exquisito a la percusión, timpanismo apagado.',
        palpacion: 'Dolor severo en punto de McBurney. Defensa muscular localizada y rigidez abdominal.',
        timpanismoType: 'timpanico',
        rhaVolume: 0.3,
        maneuvers: {
          mcburney: {
            positive: true,
            message: 'Dolor agudo y localizado en la unión del tercio externo con los dos tercios internos de la línea umbilico-espinosa. ¡Punto de McBurney Altamente Positivo!'
          },
          blumberg: {
            positive: true,
            message: 'Al presionar la fosa ilíaca derecha de forma sostenida y retirar la mano súbitamente, el paciente grita de dolor debido a la irritación peritoneal. ¡Signo de Blumberg (Rebote) Positivo!'
          }
        }
      },
      flanco_der: {
        inspeccion: 'Normal.',
        auscultacion: 'RHA disminuidos.',
        percusion: 'Timpánico.',
        palpacion: 'Dolor moderado que se propaga desde la fosa ilíaca.',
        timpanismoType: 'timpanico',
        rhaVolume: 0.5
      },
      hipogastrio: {
        inspeccion: 'Normal.',
        auscultacion: 'RHA escasos.',
        percusion: 'Timpánico.',
        palpacion: 'Sensibilidad y dolor a la palpación profunda.',
        timpanismoType: 'timpanico',
        rhaVolume: 0.5
      }
    },
    generalManeuvers: {
      quervain: 'Lóbulos tiroideos palpables y normales. Sin bocio.',
      mamas: 'Ginecomastia fisiológica ausente. Examen mamario normal y simétrico.',
      giordano_der: 'Puñopercusión lumbar derecha negativa.',
      giordano_izq: 'Puñopercusión lumbar izquierda negativa.'
    }
  },
  {
    id: 'case_obstruccion',
    title: 'Obstrucción Intestinal Mecánica',
    patientName: 'Humberto Mejía',
    age: 63,
    gender: 'M',
    complaint: 'Dolor abdominal cólico difuso, distensión abdominal marcada, vómitos de aspecto porráceo y ausencia de expulsión de gases y heces de 48 horas de evolución.',
    vitalSigns: { hr: 110, rr: 24, bp: '100/60', spo2: 94 },
    inspectionDesc: 'Abdomen marcadamente globoso y distendido. Ondas peristálticas visibles (ondas de lucha de Kussmaul) en la pared abdominal.',
    findings: {
      umbilical: {
        inspeccion: 'Cicatriz umbilical evertida, abdomen muy distendido.',
        auscultacion: 'RHA de lucha muy aumentados, de tono metálico alto, tintineos de goteo y borborigmos audibles sin fonendoscopio.',
        percusion: 'Timpanismo generalizado de tono alto.',
        palpacion: 'Abdomen tenso, doloroso a la palpación difusa, con sensación de plenitud y meteorismo.',
        timpanismoType: 'timpanico',
        rhaVolume: 1.8
      },
      flanco_izq: {
        inspeccion: 'Distensión asimétrica.',
        auscultacion: 'Borborigmos intensos.',
        percusion: 'Timpanismo generalizado.',
        palpacion: 'Sensibilidad difusa.',
        timpanismoType: 'timpanico',
        rhaVolume: 1.8
      },
      flanco_der: {
        inspeccion: 'Distensión asimétrica.',
        auscultacion: 'Gorgoteos continuos de lucha.',
        percusion: 'Timpánico.',
        palpacion: 'Resistencia elástica aumentada por gas acumulado.',
        timpanismoType: 'timpanico',
        rhaVolume: 1.8
      }
    },
    generalManeuvers: {
      quervain: 'Tiroides sin alteraciones.',
      mamas: 'Examen normal.',
      giordano_der: 'Puñopercusión lumbar derecha negativa.',
      giordano_izq: 'Puñopercusión lumbar izquierda negativa.'
    }
  },
  {
    id: 'case_normal',
    title: 'Examen Físico Abdominal Normal',
    patientName: 'Clara Mercedes Ruiz',
    age: 30,
    gender: 'F',
    complaint: 'Chequeo de rutina pre-empleo. Niega dolor abdominal, estreñimiento o alteraciones del tránsito.',
    vitalSigns: { hr: 72, rr: 16, bp: '120/80', spo2: 99 },
    inspectionDesc: 'Abdomen plano, simétrico, sin cicatrices ni circulación colateral. Movilidad respiratoria conservada.',
    findings: {},
    generalManeuvers: {
      quervain: 'Glándula tiroides no palpable (lo cual es normal en adultos delgados), o palpable como un istmo blando, liso, móvil y no doloroso.',
      mamas: 'Mamas simétricas, sin masas, retracción cutánea ni secreciones por pezón. Axilas y regiones supraclaviculares sin adenomegalias.',
      giordano_der: 'Giordano negativo. No hay dolor lumbar.',
      giordano_izq: 'Giordano negativo. No hay dolor lumbar.'
    }
  }
];

export function AbdomenPage() {
  const [activeCaseId, setActiveCaseId] = useState<string>('case_normal');
  const [layoutMode, setLayoutMode] = useState<'4_quadrants' | '9_regions'>('9_regions');
  const [activeTool, setActiveTool] = useState<'inspeccion' | 'auscultacion' | 'percusion' | 'palpacion' | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [score, setScore] = useState<number>(100);
  const [sequenceLogs, setSequenceLogs] = useState<string[]>([]);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [currentSystem, setCurrentSystem] = useState<'abdomen' | 'cuello' | 'mamas' | 'lumbar'>('abdomen');

  // Interactive maneuvers and visual animations state
  const [isSwallowing, setIsSwallowing] = useState(false);
  const [murphyState, setMurphyState] = useState<'none' | 'inhaling' | 'pain'>('none');
  const [blumbergPressed, setBlumbergPressed] = useState<string | null>(null);

  // States to keep track of exam steps performed per region
  // To strictly enforce: Inspección -> Auscultación -> Percusión -> Palpación
  const [regionExamState, setRegionExamState] = useState<Record<string, {
    inspected: boolean;
    auscultated: boolean;
    percussed: boolean;
    palpated: boolean;
  }>>({});

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);

  const activeCase = CLINICAL_CASES.find((c) => c.id === activeCaseId) || CLINICAL_CASES[3];

  useEffect(() => {
    // Reset state when case changes
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on case change: standard pattern for derived state
    setRegionExamState({});
    setSelectedRegion(null);
    setScore(100);
    setSequenceLogs([]);
    setWarningMsg(null);
    setMurphyState('none');
    setBlumbergPressed(null);
  }, [activeCaseId]);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- webkitAudioContext not in Window typedef (Safari legacy)
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    mainGainRef.current = gain;
  };

  // Synthesize RHA Sound (Gas & Liquid bubbles)
  const playRHA = (volumeFactor: number = 1.0) => {
    initAudio();
    const ctx = audioCtxRef.current;
    const destination = mainGainRef.current;
    if (!ctx || !destination) return;

    if (volumeFactor === 0) return; // Silent abdomen

    const now = ctx.currentTime;
    // eslint-disable-next-line react-hooks/purity -- Math.random() intentional: audio synthesis, only called in event handlers, not during render
    const numBubbles = Math.max(2, Math.floor((3 + Math.random() * 5) * volumeFactor));
    let bubbleTime = now;

    for (let i = 0; i < numBubbles; i++) {
      // eslint-disable-next-line react-hooks/purity -- Math.random() intentional: audio synthesis timing randomization
      bubbleTime += 0.08 + Math.random() * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      // Obstrucción intestinal causes metallic high pitch
      /* eslint-disable react-hooks/purity -- Math.random() intentional: audio synthesis, only called from event handlers */
      const startFreq = volumeFactor > 1.5 
        ? 350 + Math.random() * 250 
        : 140 + Math.random() * 160;
      /* eslint-enable react-hooks/purity */

      // eslint-disable-next-line react-hooks/purity -- Math.random() intentional: audio frequency sweep randomization
      const endFreq = startFreq - (60 + Math.random() * 80);
      osc.frequency.setValueAtTime(startFreq, bubbleTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(45, endFreq), bubbleTime + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFreq, bubbleTime);
      filter.Q.setValueAtTime(volumeFactor > 1.5 ? 5.0 : 2.5, bubbleTime); // sharper Q for metallic clicks

      gain.gain.setValueAtTime(0.001, bubbleTime);
      gain.gain.linearRampToValueAtTime(0.12 * volumeFactor, bubbleTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, bubbleTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(bubbleTime);
      osc.stop(bubbleTime + 0.15);
    }
  };

  // Synthesize Percussion Sounds
  const playPercussion = (type: 'timpanico' | 'mate') => {
    initAudio();
    const ctx = audioCtxRef.current;
    const destination = mainGainRef.current;
    if (!ctx || !destination) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'timpanico') {
      // Drum-like resonant low-frequency sweep
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      // Dull dry low-frequency thud (liver, masses)
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.20, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    }

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.25);
  };

  // Trigger Thyroid Swallowing Animation
  const triggerSwallow = () => {
    if (isSwallowing) return;
    setIsSwallowing(true);
    setTimeout(() => {
      setIsSwallowing(false);
    }, 1800);
  };

  // Handle Abdominal Grid Click
  const handleRegionClick = (regionId: string, regionName: string) => {
    if (!activeTool) {
      setSelectedRegion(regionId);
      return;
    }

    // Initialize or get the exam state of this region
    const currentState = regionExamState[regionId] || {
      inspected: false,
      auscultated: false,
      percussed: false,
      palpated: false
    };

    // SEQUENCE VALIDATION: Inspección -> Auscultación -> Percusión -> Palpación
    if (activeTool === 'inspeccion') {
      // Create immutable copy — never mutate state objects directly
      const nextState = { ...currentState, inspected: true };
      setRegionExamState({ ...regionExamState, [regionId]: nextState });
      setSelectedRegion(regionId);
      setSequenceLogs((prev) => [
        `[Inspección] Realizada en ${regionName}.`,
        ...prev
      ]);
    } 
    else if (activeTool === 'auscultacion') {
      if (!currentState.inspected) {
        // Not inspected yet warning
        applyPenalty(`Intentó auscultar ${regionName} sin realizar la Inspección primero.`, 10);
      }
      // Create immutable copy — never mutate state objects directly
      const nextState = { ...currentState, auscultated: true };
      setRegionExamState({ ...regionExamState, [regionId]: nextState });
      setSelectedRegion(regionId);

      // Play synthesized bowel sounds (RHA)
      const caseFinding = activeCase.findings[regionId];
      const rhaVol = caseFinding ? caseFinding.rhaVolume : 1.0; // default 1.0 (normal)
      playRHA(rhaVol);

      setSequenceLogs((prev) => [
        `[Auscultación] RHA auscultados en ${regionName}.`,
        ...prev
      ]);
    } 
    else if (activeTool === 'percusion') {
      // Must do inspections and auscultations first!
      if (!currentState.auscultated) {
        applyPenalty(`¡Secuencia incorrecta! Realizó Percusión en ${regionName} antes de Auscultar. Esto altera los ruidos hidroaéreos (RHA).`, 15);
      } else if (!currentState.inspected) {
        applyPenalty(`Realizó Percusión en ${regionName} sin Inspección previa.`, 10);
      }

      // Create immutable copy — never mutate state objects directly
      const nextState = { ...currentState, percussed: true };
      setRegionExamState({ ...regionExamState, [regionId]: nextState });
      setSelectedRegion(regionId);

      // Play percussion sound
      const caseFinding = activeCase.findings[regionId];
      const percType = caseFinding ? caseFinding.timpanismoType : 'timpanico';
      playPercussion(percType);

      setSequenceLogs((prev) => [
        `[Percusión] Realizada en ${regionName}. Sonido obtenido: ${percType === 'timpanico' ? 'Timpanismo' : 'Matidez'}.`,
        ...prev
      ]);
    } 
    else if (activeTool === 'palpacion') {
      // Must do auscultation first!
      if (!currentState.auscultated) {
        applyPenalty(`¡Secuencia incorrecta! Realizó Palpación en ${regionName} antes de Auscultar. La palpación estimula el peristaltismo intestinal y falsea los ruidos.`, 15);
      } else if (!currentState.inspected) {
        applyPenalty(`Realizó Palpación en ${regionName} sin Inspección previa.`, 10);
      }

      // Create immutable copy — never mutate state objects directly
      const nextState = { ...currentState, palpated: true };
      setRegionExamState({ ...regionExamState, [regionId]: nextState });
      setSelectedRegion(regionId);

      // Check for special maneuvers
      const caseFinding = activeCase.findings[regionId];
      if (regionId === 'hipocondrio_der' && caseFinding?.maneuvers?.murphy) {
        // Trigger Murphy's Sign interactive flow
        setMurphyState('inhaling');
        setWarningMsg('⚠️ Maniobra de Murphy: Pidiendo al paciente inspirar profundamente...');
        setTimeout(() => {
          setMurphyState('pain');
          setWarningMsg(null);
        }, 1500);
      }

      setSequenceLogs((prev) => [
        `[Palpación] Profunda y superficial realizada en ${regionName}.`,
        ...prev
      ]);
    }
  };

  const applyPenalty = (msg: string, points: number) => {
    setWarningMsg(`⚠️ ERROR CLÍNICO: ${msg} (-${points} pts en Readiness Score)`);
    setScore((prev) => Math.max(20, prev - points));
    setTimeout(() => {
      setWarningMsg(null);
    }, 4500);
  };

  const getRegionExamIcon = (regionId: string) => {
    const s = regionExamState[regionId];
    if (!s) return null;
    return (
      <div className="absolute bottom-1 right-1 flex gap-0.5 scale-90">
        {s.inspected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" title="Inspeccionado" />}
        {s.auscultated && <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-slate-900" title="Auscultado" />}
        {s.percussed && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-900" title="Percutido" />}
        {s.palpated && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900" title="Palpado" />}
      </div>
    );
  };

  // Coordinates mapping for 9 regions in 200x250 SVG grid
  const Regions9 = [
    { id: 'hipocondrio_der', name: 'Hipocondrio Derecho', x: 40, y: 40, w: 40, h: 60 },
    { id: 'epigastrio', name: 'Epigastrio', x: 80, y: 40, w: 40, h: 60 },
    { id: 'hipocondrio_izq', name: 'Hipocondrio Izquierdo', x: 120, y: 40, w: 40, h: 60 },
    { id: 'flanco_der', name: 'Flanco Derecho', x: 40, y: 100, w: 40, h: 60 },
    { id: 'umbilical', name: 'Umbilical / Mesogastrio', x: 80, y: 100, w: 40, h: 60 },
    { id: 'flanco_izq', name: 'Flanco Izquierdo', x: 120, y: 100, w: 40, h: 60 },
    { id: 'fosa_iliaca_der', name: 'Fosa Ilíaca Derecha', x: 40, y: 160, w: 40, h: 60 },
    { id: 'hipogastrio', name: 'Hipogastrio', x: 80, y: 160, w: 40, h: 60 },
    { id: 'fosa_iliaca_izq', name: 'Fosa Ilíaca Izquierda', x: 120, y: 160, w: 40, h: 60 }
  ];

  // Coordinates mapping for 4 quadrants in 200x250 SVG grid
  const Quadrants4 = [
    { id: 'quad_sup_der', name: 'Cuadrante Superior Derecho', x: 40, y: 40, w: 60, h: 90 },
    { id: 'quad_sup_izq', name: 'Cuadrante Superior Izquierdo', x: 100, y: 40, w: 60, h: 90 },
    { id: 'quad_inf_der', name: 'Cuadrante Inferior Derecho', x: 40, y: 130, w: 60, h: 90 },
    { id: 'quad_inf_izq', name: 'Cuadrante Inferior Izquierdo', x: 100, y: 130, w: 60, h: 90 }
  ];

  const activeRegions = layoutMode === '9_regions' ? Regions9 : Quadrants4;
  const currentRegionDetails = selectedRegion ? activeRegions.find((r) => r.id === selectedRegion) : null;
  const currentFinding = selectedRegion ? activeCase.findings[selectedRegion] : null;

  return (
    <div className="min-h-screen pb-16 relative overflow-x-hidden bg-[#070b13] text-gray-100 font-sans">
      
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl -z-10 opacity-[0.03] bg-emerald-500"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl -z-10 opacity-[0.03] bg-purple-500"></div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <header className="glass rounded-3xl p-6 mb-8 border-l-4 border-l-purple-500 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/10 backdrop-blur-md border border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                MED-228 — LAB PARCIAL III
              </span>
              <span className="text-[10px] text-gray-400 font-medium">• Exploración Cuello, Tórax y Abdomen</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold mt-2 tracking-tight text-white">
              Simulador Clínico de Semiología
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Practica la secuencia clínica correcta (I-A-P-Pa) y evalúa maniobras diagnósticas específicas.
            </p>
          </div>
          <Link
            href="/auscultacion"
            className="px-4 py-2 bg-gray-900 hover:bg-gray-850 text-gray-200 text-xs font-bold rounded-xl border border-gray-800 hover:border-gray-750 transition-all cursor-pointer shadow"
          >
            🫁 Focos Pulmonares y Cardíacos
          </Link>
        </header>

        {/* Global Warnings/Toasts */}
        {warningMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs font-bold animate-bounce shadow-xl flex items-center gap-3">
            <span className="text-base">🚨</span>
            <div>{warningMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: CASE DETAILS & TOOLS (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Case Selector Card */}
            <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20">
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Escenario Clínico</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">Bates / Llanio</span>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-gray-400 uppercase font-semibold block">Paciente Virtual</label>
                <select
                  value={activeCaseId}
                  onChange={(e) => setActiveCaseId(e.target.value)}
                  className="w-full bg-gray-900 text-xs font-bold text-gray-200 rounded-xl border border-gray-800 p-2.5 focus:outline-none cursor-pointer hover:border-gray-750 transition-all"
                >
                  {CLINICAL_CASES.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>

                <div className="bg-[#090d16]/80 p-3.5 rounded-xl border border-gray-850 text-xs space-y-2 mt-2 leading-relaxed text-gray-300">
                  <div><strong>Paciente:</strong> {activeCase.patientName} ({activeCase.gender === 'M' ? 'Masculino' : 'Femenino'}, {activeCase.age} años)</div>
                  <div><strong>Motivo:</strong> {activeCase.complaint}</div>
                </div>
              </div>
            </div>

            {/* System Explorer Tab (Abdomen / Neck / Breast / Lumbar) */}
            <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20">
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Foco del Tercer Parcial</span>
                <span className="text-[9px] font-mono text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">UCE Curriculo</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                <button
                  onClick={() => setCurrentSystem('abdomen')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    currentSystem === 'abdomen' ? 'bg-purple-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  腹 Abdomen
                </button>
                <button
                  onClick={() => setCurrentSystem('cuello')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    currentSystem === 'cuello' ? 'bg-purple-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  🧣 Cuello / Tiroides
                </button>
                <button
                  onClick={() => setCurrentSystem('mamas')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    currentSystem === 'mamas' ? 'bg-purple-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  🎀 Examen de Mamas
                </button>
                <button
                  onClick={() => setCurrentSystem('lumbar')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    currentSystem === 'lumbar' ? 'bg-purple-600 text-white shadow' : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  🪵 Fosa Lumbar
                </button>
              </div>
            </div>

            {/* Abdomen Clinical Tools */}
            {currentSystem === 'abdomen' && (
              <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20">
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Maletín de Herramientas</span>
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">Selección de Método</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTool(activeTool === 'inspeccion' ? null : 'inspeccion')}
                    className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      activeTool === 'inspeccion'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/15'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <span>🔍 Inspección (Lupa)</span>
                    <span className="text-[9px] font-mono opacity-80">Paso 1</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'auscultacion' ? null : 'auscultacion')}
                    className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      activeTool === 'auscultacion'
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/15'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <span>🔊 Auscultación (Estetoscopio)</span>
                    <span className="text-[9px] font-mono opacity-80">Paso 2</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'percusion' ? null : 'percusion')}
                    className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      activeTool === 'percusion'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/15'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <span>叩 Percusión (Dedos Percutores)</span>
                    <span className="text-[9px] font-mono opacity-80">Paso 3</span>
                  </button>

                  <button
                    onClick={() => setActiveTool(activeTool === 'palpacion' ? null : 'palpacion')}
                    className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      activeTool === 'palpacion'
                        ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/15'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <span>✋ Palpación (Manos del Explorador)</span>
                    <span className="text-[9px] font-mono opacity-80">Paso 4</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MAIN INTERACTIVE VISUAL DISPLAY: (5/12) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            
            {/* Abdomen Simulator */}
            {currentSystem === 'abdomen' && (
              <div className="w-full aspect-[4/5] glass border border-gray-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1120] to-[#070b13] shadow-inner select-none">
                
                {/* Visual grid selectors */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <button
                    onClick={() => setLayoutMode('4_quadrants')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                      layoutMode === '4_quadrants'
                        ? 'bg-purple-600 border-purple-500 text-white shadow'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    4 Cuadrantes
                  </button>
                  <button
                    onClick={() => setLayoutMode('9_regions')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                      layoutMode === '9_regions'
                        ? 'bg-purple-600 border-purple-500 text-white shadow'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    9 Regiones
                  </button>
                </div>

                <div className="absolute top-3 right-3 text-[9px] font-mono text-gray-500">
                  {activeTool ? `Herramienta Activa: ${activeTool.toUpperCase()}` : 'Modo Libre'}
                </div>

                {/* Murphy sign animation feedback */}
                {murphyState === 'inhaling' && (
                  <div className="absolute top-12 px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-200 font-mono text-[10px] animate-pulse shadow-lg z-10">
                    Paciente inspirando... 💨
                  </div>
                )}
                {murphyState === 'pain' && (
                  <div className="absolute top-12 px-4 py-1.5 rounded-full bg-rose-950 border border-rose-500 text-rose-200 font-mono text-[10px] animate-bounce shadow-lg z-10 flex items-center gap-1.5">
                    <span>😣 ¡Ah! (Inspiración cortada por dolor)</span>
                    <button
                      onClick={() => setMurphyState('none')}
                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold"
                    >
                      Ok
                    </button>
                  </div>
                )}

                {/* SVG Torso Container */}
                <svg
                  viewBox="0 0 200 250"
                  className="w-full h-full max-w-[340px]"
                >
                  <defs>
                    <radialGradient id="abdomen-glow" cx="50%" cy="50%" r="65%">
                      <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#070b13" stopOpacity="0.0" />
                    </radialGradient>
                  </defs>

                  {/* Body Back Glow */}
                  <circle cx="100" cy="130" r="80" fill="url(#abdomen-glow)" />

                  {/* 1. OUTLINE DE CADERA Y ABDOMEN */}
                  <path
                    d="M 55 20 C 58 20, 142 20, 145 20 L 145 40 Q 155 120, 148 230 L 52 230 Q 45 120, 55 40 Z"
                    fill="rgba(15, 23, 42, 0.45)"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1.5"
                  />

                  {/* Costillas / Reborde Costal Inferior */}
                  <path
                    d="M 53 45 Q 100 85 147 45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth="2.2"
                  />

                  {/* Línea Alba */}
                  <line
                    x1="100" y1="20" x2="100" y2="230"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="1"
                    strokeDasharray="4,6"
                  />

                  {/* Ombligo */}
                  <ellipse
                    cx="100" cy="135" rx="3.5" ry="2.5"
                    fill="rgba(255, 255, 255, 0.22)"
                    stroke="rgba(0, 0, 0, 0.4)"
                    strokeWidth="0.5"
                  />

                  {/* Crestas Ilíacas / Inguinales */}
                  <path
                    d="M 52 205 C 65 215, 75 230, 75 230"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 148 205 C 135 215, 125 230, 125 230"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1.2"
                  />

                  {/* Special McBurney Marker Visual Indicator */}
                  {layoutMode === '9_regions' && (
                    <circle
                      cx="67" cy="178" r="3.5"
                      fill="none"
                      stroke="rgba(239, 68, 68, 0.45)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      className="animate-pulse"
                    >
                      <title>Punto de McBurney</title>
                    </circle>
                  )}

                  {/* 2. DYNAMIC REGIONS INTERACTIVE GRID */}
                  {activeRegions.map((reg) => {
                    const isSelected = selectedRegion === reg.id;
                    const exam = regionExamState[reg.id] || { inspected: false, auscultated: false, percussed: false, palpated: false };
                    
                    // Determine fill overlay based on region status
                    let fillOverlay = 'fill-transparent';
                    if (isSelected) {
                      fillOverlay = 'fill-purple-500/15';
                    } else if (exam.palpated) {
                      fillOverlay = 'fill-rose-500/5';
                    } else if (exam.auscultated) {
                      fillOverlay = 'fill-cyan-500/5';
                    }

                    return (
                      <g key={reg.id}>
                        {/* Interactive cell */}
                        <rect
                          x={reg.x}
                          y={reg.y}
                          width={reg.w}
                          height={reg.h}
                          stroke="rgba(255, 255, 255, 0.06)"
                          strokeWidth="0.8"
                          className={`${fillOverlay} hover:fill-purple-500/10 transition-colors duration-250 cursor-pointer`}
                          onClick={() => handleRegionClick(reg.id, reg.name)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Grid Overlay Icons */}
                {activeRegions.map((reg) => (
                  <div
                    key={reg.id}
                    style={{
                      position: 'absolute',
                      left: `${(reg.x / 200) * 100}%`,
                      top: `${(reg.y / 250) * 100}%`,
                      width: `${(reg.w / 200) * 100}%`,
                      height: `${(reg.h / 250) * 100}%`,
                      pointerEvents: 'none'
                    }}
                    className="relative"
                  >
                    {getRegionExamIcon(reg.id)}
                  </div>
                ))}
              </div>
            )}

            {/* Thyroid/Neck Simulator view */}
            {currentSystem === 'cuello' && (
              <div className="w-full aspect-[4/5] glass border border-gray-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1120] to-[#070b13] shadow-inner select-none">
                <div className="absolute top-3 left-3 text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">
                  Exploración de Cuello
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-[10px] text-gray-400 text-center leading-relaxed">
                  <strong>Maniobra de Quervain:</strong> Coloque sus dedos a ambos lados de la tráquea por detrás del paciente y haga clic en &quot;Deglutir&quot; para sentir el ascenso glandular.
                </div>

                {/* Swallow Button */}
                <button
                  onClick={triggerSwallow}
                  className="absolute top-12 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transform active:scale-95 transition-all"
                >
                  💧 Pedir al Paciente Deglutir
                </button>

                {/* Neck SVG */}
                <svg viewBox="0 0 200 250" className="w-full h-full max-w-[280px]">
                  {/* Neck Outline */}
                  <path
                    d="M 60 40 L 60 210 Q 100 230 140 210 L 140 40 Z"
                    fill="rgba(15, 23, 42, 0.4)"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1.5"
                  />
                  {/* Mandible */}
                  <path
                    d="M 50 40 Q 100 65 150 40"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="2.5"
                  />

                  {/* Trachea (Cartilages) */}
                  <g stroke="rgba(255, 255, 255, 0.12)" fill="none" strokeWidth="2.5">
                    <line x1="85" y1="100" x2="115" y2="100" />
                    <line x1="85" y1="110" x2="115" y2="110" />
                    <line x1="85" y1="120" x2="115" y2="120" />
                    <line x1="85" y1="130" x2="115" y2="130" />
                    <line x1="85" y1="140" x2="115" y2="140" />
                  </g>

                  {/* Thyroid Gland (Animate on swallow) */}
                  <path
                    d="M 80 120 C 80 120, 85 105, 100 115 C 115 105, 120 120, 120 120 C 122 145, 115 150, 100 145 C 85 150, 78 145, 80 120 Z"
                    fill="rgba(190, 24, 74, 0.15)"
                    stroke="rgba(190, 24, 74, 0.45)"
                    strokeWidth="1.5"
                    style={{
                      transform: isSwallowing ? 'translateY(-12px)' : 'translateY(0px)',
                      transition: 'transform 0.8s ease-in-out'
                    }}
                  />
                  
                  {/* Sternocleidomastoid muscle shadows */}
                  <path d="M 64 50 L 52 200" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="8" fill="none" />
                  <path d="M 136 50 L 148 200" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="8" fill="none" />
                </svg>

                {isSwallowing && (
                  <div className="absolute top-1/2 text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-500/20 shadow-xl animate-pulse">
                    Palpando ascenso de la glándula...
                  </div>
                )}
              </div>
            )}

            {/* Breast / Mamas Simulator view */}
            {currentSystem === 'mamas' && (
              <div className="w-full aspect-[4/5] glass border border-gray-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1120] to-[#070b13] shadow-inner select-none">
                <div className="absolute top-3 left-3 text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">
                  Examen Clínico de Mamas
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-[10px] text-gray-400 text-center leading-relaxed">
                  <strong>Puntos Clave UCE:</strong> Inspección estática y dinámica (brazos arriba/caderas). Palpación espiral por cuadrantes y evaluación de ganglios de la cola de Spence y fosa axilar.
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Simétrico</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">Sin masas</span>
                </div>

                {/* Breast outline mock drawing */}
                <svg viewBox="0 0 200 250" className="w-full h-full max-w-[280px]">
                  {/* Chest outline */}
                  <path d="M 40 40 L 160 40 Q 170 140, 160 220 L 40 220 Z" fill="rgba(15, 23, 42, 0.3)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
                  
                  {/* Left breast outline */}
                  <circle cx="75" cy="120" r="28" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
                  <circle cx="75" cy="120" r="3.5" fill="rgba(255,255,255,0.3)" />

                  {/* Right breast outline */}
                  <circle cx="125" cy="120" r="28" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
                  <circle cx="125" cy="120" r="3.5" fill="rgba(255,255,255,0.3)" />

                  {/* Axillary nodes lines */}
                  <line x1="45" y1="80" x2="60" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
                  <line x1="155" y1="80" x2="140" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
                </svg>
              </div>
            )}

            {/* Fosa Lumbar / Giordano view */}
            {currentSystem === 'lumbar' && (
              <div className="w-full aspect-[4/5] glass border border-gray-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a1120] to-[#070b13] shadow-inner select-none">
                <div className="absolute top-3 left-3 text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">
                  Espalda / Puñopercusión Renal (Giordano)
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/60 p-3 rounded-2xl border border-gray-800 text-[10px] text-gray-400 text-center leading-relaxed">
                  Haga clic sobre las fosas renales lumbares izquierda o derecha para realizar la percusión con el borde cubital. Si hay pielonefritis, el paciente tendrá dolor intenso.
                </div>

                {/* Back outlines with kidneys highlighted */}
                <svg viewBox="0 0 200 250" className="w-full h-full max-w-[280px]">
                  {/* Back outline */}
                  <path d="M 50 30 L 150 30 L 140 220 L 60 220 Z" fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
                  
                  {/* Spine line */}
                  <line x1="100" y1="30" x2="100" y2="220" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="3" strokeDasharray="5,8" />

                  {/* Left Kidney (Viewer left, anatomical Left) */}
                  <g
                    className="cursor-pointer group fill-transparent hover:fill-red-500/10 transition-colors"
                    onClick={() => {
                      playPercussion('mate');
                      alert(`Puñopercusión lumbar Izquierda: ${activeCase.generalManeuvers?.giordano_izq}`);
                    }}
                  >
                    <path d="M 72 100 C 62 105, 62 125, 72 130 Z" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" />
                    <rect x="62" y="90" width="25" height="50" fill="transparent" />
                  </g>

                  {/* Right Kidney (Viewer right, anatomical Right) */}
                  <g
                    className="cursor-pointer group fill-transparent hover:fill-red-500/10 transition-colors"
                    onClick={() => {
                      playPercussion('mate');
                      alert(`Puñopercusión lumbar Derecha: ${activeCase.generalManeuvers?.giordano_der}`);
                    }}
                  >
                    <path d="M 128 105 C 138 110, 138 130, 128 135 Z" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" />
                    <rect x="112" y="95" width="25" height="50" fill="transparent" />
                  </g>
                </svg>
              </div>
            )}

            {/* Score indicators */}
            <div className="w-full glass rounded-2xl p-4 bg-[#090d16]/90 border border-gray-800 flex justify-between items-center text-center font-mono">
              <div className="flex-1 border-r border-gray-800">
                <span className="text-[9px] text-gray-500 block">SCORE DE EXAMEN</span>
                <span className={`text-lg font-bold ${score >= 85 ? 'text-green-400 animate-pulse' : score >= 60 ? 'text-amber-400' : 'text-rose-500'}`}>
                  {score} / 100
                </span>
              </div>
              <div className="flex-1">
                <span className="text-[9px] text-gray-500 block">UCE COMPROBACIÓN</span>
                <span className="text-[10px] font-bold text-purple-400">
                  Semiólogía UCE V1
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COL: WORKSTATION PANEL & SEQUENCE LOGS (3/12) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Examination Findings Log */}
            <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20 min-h-[140px] flex flex-col">
              <div className="border-b border-gray-800/60 pb-2 mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ficha de Hallazgos</span>
                <span className="text-[9px] font-mono text-cyan-400">
                  {currentRegionDetails ? currentRegionDetails.name : 'Seleccione una Región'}
                </span>
              </div>

              {currentRegionDetails ? (
                <div className="text-xs space-y-3.5 flex-1 overflow-y-auto leading-relaxed">
                  <div>
                    <h5 className="font-bold text-emerald-400 text-[10px] uppercase">👁️ Inspección:</h5>
                    <p className="text-gray-300 text-[11px] mt-0.5">
                      {currentFinding?.inspeccion || activeCase.inspectionDesc}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-cyan-400 text-[10px] uppercase">🔊 Auscultación (RHA):</h5>
                    <p className="text-gray-300 text-[11px] mt-0.5">
                      {currentFinding?.auscultacion || 'RHA presentes y normales (aproximadamente 12 ruidos por minuto).'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-indigo-400 text-[10px] uppercase">叩 Percusión:</h5>
                    <p className="text-gray-300 text-[11px] mt-0.5">
                      {currentFinding?.percusion || 'Timpánico en general.'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-rose-400 text-[10px] uppercase">✋ Palpación:</h5>
                    <p className="text-gray-300 text-[11px] mt-0.5">
                      {currentFinding?.palpacion || 'Abdomen blando, depresible, no doloroso.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-[10px] text-gray-500 leading-relaxed font-medium p-4 border border-dashed border-gray-800 rounded-xl">
                  {currentSystem === 'abdomen'
                    ? 'Haga clic en una región del abdomen del maniquí para explorar y registrar hallazgos.'
                    : `Simulación de ${currentSystem.toUpperCase()} activa. Utilice los controles correspondientes.`
                  }
                </div>
              )}
            </div>

            {/* General System Findings (Neck / Mamas) details */}
            {currentSystem !== 'abdomen' && (
              <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20">
                <div className="border-b border-gray-800/60 pb-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ficha Clínica de Sistema</span>
                  <span className="text-[9px] font-mono text-amber-400">{currentSystem.toUpperCase()}</span>
                </div>

                <div className="text-xs text-gray-300 leading-relaxed space-y-3">
                  {currentSystem === 'cuello' && (
                    <div>
                      <h6 className="font-bold text-[10px] text-rose-400 uppercase">Hallazgos Quervain:</h6>
                      <p className="mt-1">{activeCase.generalManeuvers?.quervain}</p>
                    </div>
                  )}
                  {currentSystem === 'mamas' && (
                    <div>
                      <h6 className="font-bold text-[10px] text-rose-400 uppercase">Hallazgos Mamarios:</h6>
                      <p className="mt-1">{activeCase.generalManeuvers?.mamas}</p>
                    </div>
                  )}
                  {currentSystem === 'lumbar' && (
                    <div className="space-y-2">
                      <h6 className="font-bold text-[10px] text-rose-400 uppercase">Puñopercusión Renal (Giordano):</h6>
                      <p><strong>Derecha:</strong> {activeCase.generalManeuvers?.giordano_der}</p>
                      <p><strong>Izquierda:</strong> {activeCase.generalManeuvers?.giordano_izq}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sequence & Checklist Logs */}
            <div className="glass rounded-2xl p-5 border border-gray-800/80 bg-gray-950/20 max-h-[220px] flex flex-col">
              <div className="border-b border-gray-800/60 pb-2 mb-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bitácora de Secuencia</span>
                <button
                  onClick={() => setSequenceLogs([])}
                  className="text-[8px] font-bold text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[9px] text-gray-400 space-y-1.5 pr-1">
                {sequenceLogs.length === 0 ? (
                  <div className="text-gray-600 italic py-2">Ningún procedimiento registrado.</div>
                ) : (
                  sequenceLogs.map((log, idx) => (
                    <div key={idx} className="border-l-2 border-purple-500/40 pl-1.5 py-0.5 leading-snug">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AbdomenPage;
