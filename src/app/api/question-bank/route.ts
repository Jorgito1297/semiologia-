import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { SEMIOLOGIA_SEGUNDO_PARCIAL, SEMIOLOGIA_TERCER_PARCIAL } from '@/app/repaso/[curso]/data';

type Competency = 'CG2' | 'CG6' | 'CG8';

interface GeneratedQuestion {
  id: number;
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  justification: string;
  pearl: string;
  competencies: Competency[];
}

interface BankSeedQuestion extends Omit<GeneratedQuestion, 'id' | 'competencies'> {
  minWeek: number;
}

const COMPETENCY_ROTATION: Competency[] = ['CG6', 'CG8', 'CG2'];
const NOISE_PATTERNS = [
  'vicerrector',
  'plantillas de planificacion',
  'evaluacion sumativa',
  'plataforma moodle',
  'microsoft team',
  'semana',
  'horas',
  'tabla',
  'import {',
  'const ',
  'function ',
  'api.anthropic.com',
];

const FIRST_PARTIAL_MARKERS = [
  'sexta semana primer examen parcial',
  'primer examen parcial',
  'primer parcial',
];

function cleanSentence(sentence: string): string {
  return sentence
    .replace(/\s+/g, ' ')
    .replace(/^[-*\d.\s]+/, '')
    .trim();
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractFirstPartialScope(raw: string): string {
  const normalizedRaw = normalize(raw);
  let cutIndex = -1;

  for (const marker of FIRST_PARTIAL_MARKERS) {
    const idx = normalizedRaw.indexOf(marker);
    if (idx !== -1 && (cutIndex === -1 || idx < cutIndex)) {
      cutIndex = idx;
    }
  }

  if (cutIndex === -1) {
    return raw;
  }

  return raw.slice(0, cutIndex).trim();
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function containsAll(text: string, needles: string[]): boolean {
  return needles.every((needle) => text.includes(needle));
}

function isNoiseLine(line: string): boolean {
  const normalized = normalize(line);
  return containsAny(normalized, NOISE_PATTERNS);
}

function splitCandidates(text: string): string[] {
  const sentenceCandidates = text
    .split(/(?<=[.!?])\s+/)
    .map(cleanSentence)
    .filter((line) => line.length >= 30 && line.length <= 260)
    .filter((line) => !line.includes('http'))
    .filter((line) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(line))
    .filter((line) => !isNoiseLine(line));

  const lineCandidates = text
    .split(/\r?\n+/)
    .map((line) =>
      cleanSentence(line)
        .replace(/^\[[^\]]+\]\s*/g, '')
        .replace(/^[-*]\s*/g, '')
    )
    .filter((line) => line.length >= 25 && line.length <= 260)
    .filter((line) => !line.includes('http'))
    .filter((line) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(line))
    .filter((line) => !isNoiseLine(line));

  return [...new Set([...sentenceCandidates, ...lineCandidates])];
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildClinicalQuestionBank(raw: string, qty: number): GeneratedQuestion[] {
  const source = normalize(raw);
  const questions: GeneratedQuestion[] = [];

  const pushQuestion = (
    question: Omit<GeneratedQuestion, 'id' | 'competencies'>,
    idx: number
  ) => {
    questions.push({
      id: idx + 1,
      competencies: [COMPETENCY_ROTATION[idx % COMPETENCY_ROTATION.length]],
      ...question,
    });
  };

  if (containsAll(source, ['anamnesis', 'motivo de consulta', 'historia de la enfermedad actual'])) {
    const options = shuffle([
      'Motivo de consulta y la historia de la enfermedad actual.',
      'Únicamente antecedentes quirúrgicos y alergias.',
      'Solo signos vitales y plan farmacológico inicial.',
      'Exclusivamente interpretación de imágenes diagnósticas.',
    ]);
    pushQuestion(
      {
        scenario:
          'Paciente de 46 años consulta por disnea progresiva; en la entrevista inicial se documenta de forma incompleta el problema actual.',
        question: '¿Qué componente debe priorizarse para completar la anamnesis según el enfoque del curso?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Motivo de consulta')),
        justification:
          'El material enfatiza que la anamnesis inicia con motivo de consulta y se estructura con la historia de la enfermedad actual.',
        pearl: 'Una anamnesis sólida reduce errores diagnósticos desde el primer contacto.',
      },
      questions.length
    );
  }

  if (containsAny(source, ['revision por sistema', 'revision por sistemas y aparatos'])) {
    const options = shuffle([
      'Sistema respiratorio, cardiovascular, gastrointestinal y genitourinario.',
      'Solo sistema osteomuscular y dermatológico.',
      'Únicamente sistema endocrino y hematológico.',
      'No se integra por aparatos en la historia clínica.',
    ]);
    pushQuestion(
      {
        scenario:
          'Durante la entrevista clínica, el estudiante omite apartados de la revisión por aparatos.',
        question: '¿Qué combinación refleja mejor la revisión por sistemas descrita en semiología?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Sistema respiratorio')),
        justification:
          'El programa menciona la revisión sistemática por aparatos, incluyendo respiratorio, cardiovascular y gastrointestinal.',
        pearl: 'Revisión por sistemas completa = menos sesgo de omisión.',
      },
      questions.length
    );
  }

  if (containsAll(source, ['inspeccion', 'palpacion', 'percusion', 'auscultacion'])) {
    const options = shuffle([
      'Inspección, palpación, percusión y auscultación.',
      'Inspección, laboratorio, tomografía y ecocardiograma.',
      'Solo palpación y auscultación.',
      'Historia familiar, genética y biopsia.',
    ]);
    pushQuestion(
      {
        scenario:
          'En una práctica de examen físico general, el docente solicita la secuencia semiológica base.',
        question: '¿Cuál es la secuencia fundamental de métodos de exploración física?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Inspección')),
        justification:
          'Esa es la secuencia clásica explicitada en los contenidos de exploración física del curso.',
        pearl: 'Dominar la técnica evita saltarse hallazgos clínicos relevantes.',
      },
      questions.length
    );
  }

  if (containsAny(source, ['fremito vocal', 'amplitud toracica', 'timpanismo', 'matidez'])) {
    const options = shuffle([
      'Palpación del frémito vocal y percusión para distinguir matidez de timpanismo.',
      'Solo evaluación de reflejos osteotendinosos.',
      'Únicamente inspección de piel y faneras.',
      'Prueba de agudeza visual como método principal.',
    ]);
    pushQuestion(
      {
        scenario:
          'Paciente con dolor torácico pleurítico y asimetría ventilatoria en hemitórax derecho.',
        question:
          'Según los temas del bloque respiratorio, ¿qué maniobra combina mejor palpación y percusión para orientar el diagnóstico?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Palpación del frémito vocal')),
        justification:
          'El contenido del curso integra frémito vocal, amplitud torácica y percusión (matidez/timpanismo) para el examen de tórax.',
        pearl: 'En tórax, combinar métodos mejora la precisión semiológica.',
      },
      questions.length
    );
  }

  if (containsAny(source, ['korotkoff', 'presion arterial', 'pulsos arteriales'])) {
    const options = shuffle([
      'Fenómeno de Korotkoff y técnica correcta de toma de presión arterial.',
      'Test de Romberg y escala de Glasgow.',
      'Auscultación pulmonar aislada sin esfigmomanómetro.',
      'Únicamente medición de perímetro abdominal.',
    ]);
    pushQuestion(
      {
        scenario:
          'Durante una práctica de signos vitales, el alumno reporta cifras tensionales inconsistentes.',
        question: '¿Qué contenido del curso respalda la corrección técnica de esta medición?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Fenómeno de Korotkoff')),
        justification:
          'El plan incluye explícitamente toma de presión arterial, factores determinantes y fenómeno de Korotkoff.',
        pearl: 'Una técnica de PA incorrecta altera decisiones clínicas.',
      },
      questions.length
    );
  }

  if (containsAny(source, ['abdomen', 'ruidos intestinales', 'semiologia gastrointestinal'])) {
    const options = shuffle([
      'Inspección, auscultación de ruidos intestinales, palpación y percusión abdominal.',
      'Electroencefalograma y fondo de ojo.',
      'Exploración de pares craneales únicamente.',
      'Solo interrogatorio sin examen físico.',
    ]);
    pushQuestion(
      {
        scenario:
          'Paciente con dolor abdominal difuso y distensión; se requiere una evaluación estructurada.',
        question: '¿Cuál enfoque coincide con el módulo de semiología gastrointestinal del curso?',
        options,
        correctAnswer: options.findIndex((o) => o.startsWith('Inspección, auscultación')),
        justification:
          'El bloque de abdomen del curso contempla examen físico completo con énfasis en ruidos intestinales y hallazgos de percusión.',
        pearl: 'En abdomen, la auscultación temprana evita perder datos funcionales.',
      },
      questions.length
    );
  }

  if (questions.length >= qty) {
    return questions.slice(0, qty);
  }

  return questions;
}

function buildFallbackQuestionBank(raw: string, qty: number): GeneratedQuestion[] {
  const candidates = splitCandidates(raw).slice(0, Math.max(3, qty));
  const total = Math.max(3, Math.min(qty, 8));

  return Array.from({ length: total }).map((_, idx) => {
    const competency = COMPETENCY_ROTATION[idx % COMPETENCY_ROTATION.length];
    const anchor = candidates[idx % Math.max(1, candidates.length)] ?? 'anamnesis y examen físico por métodos semiológicos';
    const correctOption = `El curso enfatiza: ${anchor}.`;
    const options = shuffle([
      correctOption,
      'La asignatura elimina la exploración física y solo usa estudios complementarios.',
      'El bloque de semiología evita correlacionar hallazgos clínicos con diagnóstico.',
      'La historia clínica no forma parte del entrenamiento del curso.',
    ]);

    return {
      id: idx + 1,
      scenario:
        'Durante una tutoría de regularización, el docente pide identificar la afirmación más coherente con el material fuente disponible.',
      question: `¿Cuál afirmación es más consistente con el contenido cargado (pregunta ${idx + 1})?`,
      options,
      correctAnswer: options.findIndex((opt) => opt === correctOption),
      justification:
        'La opción correcta respeta el contenido efectivamente disponible en el archivo procesado. Las restantes contradicen o sobregeneralizan el material.',
      pearl:
        'Primero evidencia textual, luego inferencia clínica.',
      competencies: [competency],
    };
  });
}

function inferCurrentWeekForFirstPartial(examDateIso: string): number {
  const today = new Date();
  const examDate = new Date(examDateIso);

  if (Number.isNaN(examDate.getTime())) {
    return 5;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((examDate.getTime() - today.getTime()) / msPerDay);
  const weekOffset = Math.max(0, Math.floor(diffDays / 7));
  const inferred = 6 - weekOffset;
  return Math.max(1, Math.min(6, inferred));
}

function buildFirstPartialSimulacroWeek6(qty: number): GeneratedQuestion[] {
  const bank: Array<Omit<GeneratedQuestion, 'id' | 'competencies'>> = [
    {
      scenario:
        'Paciente de 61 años consulta por disnea, tos y dolor pleurítico. Refiere inicio hace 48 horas, fiebre subjetiva y expectoración amarillenta. En el examen: FR 26/min, uso leve de músculos accesorios, frémito vocal aumentado en base derecha, percusión mate y soplo tubárico localizado.',
      question: '¿Cuál integración semiológica es más consistente?',
      options: [
        'Síndrome de condensación pulmonar en base derecha.',
        'Neumotórax derecho a tensión.',
        'Derrame pleural masivo izquierdo.',
        'Examen torácico normal con dolor musculoesquelético.',
      ],
      correctAnswer: 0,
      justification:
        'El aumento de frémito vocal + matidez + soplo tubárico orienta a condensación parenquimatosa.',
      pearl: 'Cuando el parénquima se vuelve más denso, la transmisión vocal suele aumentar.',
    },
    {
      scenario:
        'Paciente de 47 años con dolor epigástrico y distensión. En la valoración inicial del abdomen, el estudiante realiza palpación profunda antes de auscultar y luego no logra interpretar adecuadamente los ruidos intestinales.',
      question: '¿Qué error metodológico principal cometió según semiología básica?',
      options: [
        'Alteró la secuencia del examen abdominal al no auscultar antes de maniobras palpatorias profundas.',
        'Debió iniciar por percusión cardíaca.',
        'La palpación profunda siempre es el primer paso del abdomen.',
        'No era necesario ningún examen físico, solo laboratorio.',
      ],
      correctAnswer: 0,
      justification:
        'En abdomen se recomienda inspección y auscultación temprana antes de maniobras que puedan modificar la actividad intestinal.',
      pearl: 'Primero observar y escuchar; después manipular.',
    },
    {
      scenario:
        'Paciente de 54 años con mareo y cefalea. Dos tomas consecutivas de presión arterial difieren notablemente. El alumno usa manguito pequeño y no espera reposo previo.',
      question: '¿Cuál medida mejora más la validez de la toma en este contexto?',
      options: [
        'Corregir tamaño de manguito y repetir medición con técnica estandarizada basada en Korotkoff.',
        'Cambiar inmediatamente a diagnóstico de hipertensión resistente.',
        'Omitir la toma y usar solo frecuencia cardiaca.',
        'Tomar la presión solo en bipedestación sin reposo.',
      ],
      correctAnswer: 0,
      justification:
        'La técnica correcta de PA (incluyendo manguito y auscultación) es clave para decisiones clínicas válidas.',
      pearl: 'Sin técnica correcta, no hay cifra confiable.',
    },
    {
      scenario:
        'Paciente de 35 años acude por disnea súbita. Examen: disminución de expansibilidad derecha, vibraciones vocales abolidas, hipersonoridad a la percusión y murmullo vesicular ausente en hemitórax derecho.',
      question: '¿Cuál diagnóstico sindrómico es más probable?',
      options: [
        'Neumotórax derecho.',
        'Condensación lobar derecha.',
        'Derrame pleural derecho con matidez.',
        'Bronquitis aguda sin síndrome pleural.',
      ],
      correctAnswer: 0,
      justification:
        'Abolición de VV + hipersonoridad + silencio auscultatorio orientan a neumotórax.',
      pearl: 'Aire pleural desplaza transmisión y genera hipersonoridad.',
    },
  ];

  const total = Math.max(1, Math.min(qty, bank.length));
  return bank.slice(0, total).map((item, idx) => ({
    id: idx + 1,
    competencies: [COMPETENCY_ROTATION[idx % COMPETENCY_ROTATION.length]],
    ...item,
  }));
}

function buildFirstPartialSemiologyBank(qty: number, currentWeek: number): GeneratedQuestion[] {
  const bank: BankSeedQuestion[] = [
    {
      minWeek: 1,
      scenario:
        'Inicio del módulo de propedéutica: paciente de 23 años con cefalea recurrente en consulta ambulatoria.',
      question: '¿Qué define mejor el objetivo inicial de la semiología en esta etapa?',
      options: [
        'Identificar signos y síntomas para orientar hipótesis diagnósticas desde la clínica.',
        'Indicar resonancia magnética a todo paciente antes del interrogatorio.',
        'Sustituir anamnesis por algoritmos de laboratorio.',
        'Usar solo antecedentes familiares como criterio diagnóstico.',
      ],
      correctAnswer: 0,
      justification:
        'En semanas iniciales, semiología se centra en reconocer signos/síntomas y construir razonamiento clínico.',
      pearl: 'Semiología = lenguaje clínico para pensar diagnósticos.',
    },
    {
      minWeek: 2,
      scenario:
        'Paciente de 45 años consulta por dolor torácico; el estudiante solo registra una frase general y omite la cronología del síntoma.',
      question: '¿Qué parte de la historia clínica debe completarse primero para el primer parcial?',
      options: [
        'Historia de la enfermedad actual con cronología y factores modificadores.',
        'Únicamente antecedentes quirúrgicos remotos.',
        'Solo pedido inmediato de estudios de imagen.',
        'Solo examen neurológico segmentario.',
      ],
      correctAnswer: 0,
      justification:
        'En el primer parcial se prioriza anamnesis estructurada, especialmente motivo de consulta e historia de la enfermedad actual.',
      pearl: 'Sin buena anamnesis, el examen físico pierde dirección clínica.',
    },
    {
      minWeek: 3,
      scenario:
        'Durante la revisión clínica inicial, el alumno pregunta qué sistemas no puede omitir en su interrogatorio.',
      question: '¿Cuál opción refleja mejor la revisión por sistemas y aparatos esperada en esta etapa?',
      options: [
        'Respiratorio, cardiovascular, gastrointestinal y genitourinario, entre otros.',
        'Solo sistema osteomuscular.',
        'Solo sistema endocrino.',
        'No se realiza revisión por sistemas en semiología básica.',
      ],
      correctAnswer: 0,
      justification:
        'La revisión por sistemas es parte central de los temas previos al primer parcial.',
      pearl: 'Interrogatorio completo disminuye sesgos de omisión diagnóstica.',
    },
    {
      minWeek: 4,
      scenario:
        'En práctica de laboratorio clínico, te piden ordenar los métodos de exploración física generales.',
      question: '¿Cuál secuencia es correcta según contenidos del primer parcial?',
      options: [
        'Inspección, palpación, percusión y auscultación.',
        'Auscultación, percusión, inspección y palpación.',
        'Palpación y auscultación únicamente.',
        'Inspección y laboratorio únicamente.',
      ],
      correctAnswer: 0,
      justification:
        'El bloque inicial de exploración física enseña la secuencia clásica IPPA.',
      pearl: 'La técnica ordenada mejora reproducibilidad del examen.',
    },
    {
      minWeek: 5,
      scenario:
        'En consulta docente de semana 5, se practica exploración física de cabeza para diferenciar hallazgos normales de patológicos.',
      question: '¿Qué combinación de hallazgos forma parte del examen semiológico de este bloque?',
      options: [
        'Inspección y palpación de cráneo/cara con apoyo de otoscopia y oftalmoscopia según guía docente.',
        'Solo medición de presión arterial y pulsos periféricos.',
        'Únicamente auscultación pulmonar posterior.',
        'Solo maniobras abdominales profundas.',
      ],
      correctAnswer: 0,
      justification:
        'La semana 5 integra semiología de cabeza con métodos de inspección/palpación y exploración dirigida.',
      pearl: 'Inspección cuidadosa detecta hallazgos que no aparecen en paraclínicos tempranos.',
    },
  ];

  const eligible = bank.filter((q) => q.minWeek <= currentWeek);
  const effective = eligible.length > 0 ? eligible : bank.slice(0, 3);
  const total = Math.max(1, Math.min(qty, effective.length));

  return effective.slice(0, total).map((item, idx) => ({
    id: idx + 1,
    competencies: [COMPETENCY_ROTATION[idx % COMPETENCY_ROTATION.length]],
    scenario: item.scenario,
    question: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    justification: item.justification,
    pearl: item.pearl,
  }));
}

async function readQuestionSources(curso: string): Promise<string> {
  // BUG-05 FIX: Sanitize `curso` to prevent path traversal attacks.
  // e.g. curso=../../.env would expose sensitive files. We allow only
  // lowercase alphanumeric, hyphens, and underscores.
  const safeCurso = path.basename(curso.replace(/[^a-z0-9\-_]/g, ''));
  const sourcePaths = [path.join(process.cwd(), 'public', safeCurso, 'notas_clase.txt')];

  if (safeCurso === 'semiologia') {
    sourcePaths.unshift(path.join(process.cwd(), 'scratch', 'banco_preguntas_extraido.txt'));
  }

  const reads = await Promise.allSettled(
    sourcePaths.map((filePath) => fs.readFile(filePath, 'utf-8'))
  );

  const content = reads
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map((result) => result.value.trim())
    .filter(Boolean)
    .join('\n\n');

  return content;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const curso = (url.searchParams.get('curso') ?? 'semiologia').toLowerCase();
  const qtyParam = Number(url.searchParams.get('qty') ?? '8');
  const qty = Number.isFinite(qtyParam) ? Math.min(Math.max(qtyParam, 1), 100) : 8;
  const parcial = Number(url.searchParams.get('parcial') ?? '1');
  const weekRaw = url.searchParams.get('week');
  const weekParam = weekRaw === null ? null : Number(weekRaw);

  try {
    const raw = await readQuestionSources(curso);
    if (!raw) {
      return NextResponse.json(
        {
          curso,
          generatedAt: new Date().toISOString(),
          questions: [],
          warning: `No se encontró material de lectura para el curso '${curso}'.`,
        },
        { status: 200 }
      );
    }

    const scopedRaw = curso === 'semiologia' && parcial === 1 ? extractFirstPartialScope(raw) : raw;

    const firstPartialExamDate = process.env.FIRST_PARTIAL_EXAM_DATE ?? '2026-06-17';
    const inferredWeek = inferCurrentWeekForFirstPartial(firstPartialExamDate);
    const currentWeek = weekParam !== null && Number.isFinite(weekParam)
      ? Math.max(1, Math.min(6, Math.trunc(weekParam)))
      : inferredWeek;

    if (curso === 'semiologia' && parcial === 1) {
      const isSimulacroMode = currentWeek >= 6;
      return NextResponse.json({
        curso,
        scope: 'primer_parcial',
        mode: isSimulacroMode ? 'simulacro_semana_6' : 'progreso_semana_actual',
        currentWeek,
        inferredWeek,
        examDate: firstPartialExamDate,
        generatedAt: new Date().toISOString(),
        questions: isSimulacroMode
          ? buildFirstPartialSimulacroWeek6(qty)
          : buildFirstPartialSemiologyBank(qty, currentWeek),
      });
    }

    if (curso === 'semiologia' && parcial === 2) {
      const shuffledQuiz = shuffle(SEMIOLOGIA_SEGUNDO_PARCIAL.quiz);
      return NextResponse.json({
        curso,
        scope: 'segundo_parcial',
        generatedAt: new Date().toISOString(),
        questions: shuffledQuiz.slice(0, qty),
      });
    }

    if (curso === 'semiologia' && parcial === 3) {
      const shuffledQuiz = shuffle(SEMIOLOGIA_TERCER_PARCIAL.quiz);
      return NextResponse.json({
        curso,
        scope: 'tercer_parcial',
        generatedAt: new Date().toISOString(),
        questions: shuffledQuiz.slice(0, qty),
      });
    }

    const clinicalQuestions = buildClinicalQuestionBank(scopedRaw, qty);
    if (clinicalQuestions.length >= Math.min(4, qty)) {
      return NextResponse.json({
        curso,
        scope: curso === 'semiologia' && parcial === 1 ? 'primer_parcial' : 'general',
        generatedAt: new Date().toISOString(),
        questions: clinicalQuestions.slice(0, qty),
      });
    }

    if (splitCandidates(scopedRaw).length < 2) {
      return NextResponse.json({
        curso,
        scope: curso === 'semiologia' && parcial === 1 ? 'primer_parcial' : 'general',
        generatedAt: new Date().toISOString(),
        questions: buildFallbackQuestionBank(scopedRaw, qty),
        warning:
          'Se generó un banco básico por baja densidad textual del material. Se recomienda ampliar notas_clase.txt para mayor variedad.',
      });
    }

    const questions = buildFallbackQuestionBank(scopedRaw, qty);

    return NextResponse.json({
      curso,
      scope: curso === 'semiologia' && parcial === 1 ? 'primer_parcial' : 'general',
      generatedAt: new Date().toISOString(),
      questions,
    });
  } catch {
    return NextResponse.json(
      {
        curso,
        generatedAt: new Date().toISOString(),
        questions: [],
        warning: `No se pudo leer el archivo de notas para el curso '${curso}'.`,
      },
      { status: 200 }
    );
  }
}
