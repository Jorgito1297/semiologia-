import { Hotspot } from './types';

export const HOTSPOTS: Record<string, Hotspot> = {
  aortico: {
    id: 'aortico',
    name: 'Foco Aórtico',
    type: 'heart',
    location: '2do espacio intercostal derecho, línea paraesternal derecha',
    view: 'anterior',
    x: 88,
    y: 95,
    ve: 'Habitualmente normal; inspección sin hallazgos patológicos visibles en tórax.',
    toca: 'Frémito sistólico (vibración palpable) palpable en estenosis aórtica severa.',
    oye: 'Soplo mesosistólico eyectivo, de carácter rudo y áspero, con forma in crescendo-decrescendo (romboidal), que se irradia característicamente a las arterias carótidas a ambos lados del cuello.',
    pearl: 'Estenosis Aórtica = Soplo sistólico en diamante irradiado a cuello + Pulso Tardus et Parvus + Frémito palpable.',
    quiz: {
      question: 'Paciente varón de 72 años con antecedentes de síncope al esfuerzo presenta un soplo mesosistólico eyectivo áspero en este foco que se irradia a cuello. ¿Cuál es el diagnóstico más probable?',
      options: [
        'Estenosis Aórtica Valvular',
        'Insuficiencia Mitral Crónica',
        'Persistencia de Conducto Arterioso',
        'Comunicación Interauricular (CIA)',
        'Insuficiencia Aórtica Aguda'
      ],
      correctIndex: 0,
      explanation: 'La estenosis aórtica restringe el flujo del ventrículo izquierdo, produciendo el soplo eyectivo clásico en diamante que viaja a las carótidas y produce bajo gasto cerebral (causa del síncope).'
    }
  },
  pulmonar: {
    id: 'pulmonar',
    name: 'Foco Pulmonar',
    type: 'heart',
    location: '2do espacio intercostal izquierdo, línea paraesternal izquierda',
    view: 'anterior',
    x: 112,
    y: 95,
    ve: 'Latido visible visible solo en casos de dilatación masiva del tronco pulmonar (hipertensión pulmonar).',
    toca: 'Choque de cierre pulmonar palpable en el segundo espacio intercostal izquierdo.',
    oye: 'Desdoblamiento del segundo ruido cardíaco (R2). Soplos de estenosis pulmonar o comunicación interauricular (desdoblamiento amplio y fijo).',
    pearl: 'El desdoblamiento amplio y fijo de R2 que no cambia con la respiración indica Comunicación Interauricular (CIA).',
    quiz: {
      question: 'Durante la auscultación se percibe un desdoblamiento de R2 constante tanto en inspiración como en espiración en una paciente de 19 años. ¿Qué patología congénita sospecha?',
      options: [
        'Comunicación Interauricular (CIA)',
        'Coartación de Aorta',
        'Tetralogía de Fallot',
        'Estenosis Mitral Reumática',
        'Bloqueo de Rama Izquierda Completo'
      ],
      correctIndex: 0,
      explanation: 'La CIA genera un cortocircuito izquierda-derecha que sobrecarga de volumen el ventrículo derecho, prolongando su eyección y fijando el retraso del cierre de la válvula pulmonar de forma independiente a la respiración.'
    }
  },
  erb: {
    id: 'erb',
    name: 'Punto de Botkin-Erb',
    type: 'heart',
    location: '3er espacio intercostal izquierdo, línea paraesternal izquierda',
    view: 'anterior',
    x: 108,
    y: 115,
    ve: 'Generalmente normal a la inspección visual.',
    toca: 'Habitualmente no presenta frémito palpable a menos que el soplo sea muy severo.',
    oye: 'Soplo diastólico de tono alto, aspirativo y decreciente, típico de la insuficiencia aórtica. También es útil para escuchar alteraciones pulmonares.',
    pearl: 'Punto de Botkin-Erb = Foco accesorio donde mejor se ausculta el soplo diastólico aspirativo de la Insuficiencia Aórtica.',
    quiz: {
      question: 'Paciente con disnea presenta un soplo diastólico decreciente de tono alto, aspirativo, auscultable con máxima intensidad en el tercer espacio intercostal izquierdo. ¿Cuál es su sospecha diagnóstica?',
      options: [
        'Insuficiencia Aórtica',
        'Estenosis Aórtica',
        'Insuficiencia Mitral',
        'Estenosis Pulmonar',
        'Ductus Arterioso Persistente'
      ],
      correctIndex: 0,
      explanation: 'El soplo diastólico de la insuficiencia aórtica comienza inmediatamente después de R2, es de tono alto y decreciente, y se ausculta con mayor claridad en el foco accesorio de Botkin-Erb.'
    }
  },
  trico: {
    id: 'trico',
    name: 'Foco Tricúspide',
    type: 'heart',
    location: '4to o 5to espacio intercostal izquierdo, línea paraesternal izquierda',
    view: 'anterior',
    x: 94,
    y: 132,
    ve: 'Plétora facial e ingurgitación yugular pulsátil con onda v gigante sincrónica en insuficiencia tricúspide severa.',
    toca: 'Latido sagital derecho palpable (Signo de Dressler) secundario a hipertrofia del ventrículo derecho.',
    oye: 'Soplo holosistólico en barra. Característicamente aumenta de intensidad durante la inspiración profunda (Signo de Rivero-Carvallo) debido al mayor retorno venoso.',
    pearl: 'Signo de Rivero-Carvallo = Aumento del soplo derecho en inspiración profunda. Clave para diferenciar soplos tricúspides de mitrales.',
    quiz: {
      question: 'Un soplo holosistólico regurgitante en este foco se intensifica visiblemente cuando el paciente inspira profundamente. ¿Cómo se conoce este signo semiológico?',
      options: [
        'Signo de Rivero-Carvallo',
        'Signo de Pemberton',
        'Signo de Kussmaul',
        'Signo de Musset',
        'Signo de Landolfi'
      ],
      correctIndex: 0,
      explanation: 'El Signo de Rivero-Carvallo describe el incremento de la intensidad de los soplos originados en las válvulas derechas (tricúspide/pulmonar) al inspirar, debido a la caída de la presión intratorácica que aumenta el retorno venoso al corazón derecho.'
    }
  },
  mitral: {
    id: 'mitral',
    name: 'Foco Mitral (Apexiano)',
    type: 'heart',
    location: '5to espacio intercostal izquierdo, línea medioclavicular',
    view: 'anterior',
    x: 118,
    y: 145,
    ve: 'Choque de la punta desplazado lateralmente y hacia abajo en miocardiopatía dilatada o insuficiencia mitral grave.',
    toca: 'Choque de la punta palpable, vigoroso y desplazado hacia afuera en hipertrofia ventricular izquierda.',
    oye: 'Soplo holosistólico soplante en chorro de vapor, que se irradia hacia la axila izquierda. Presencia de tercer ruido (R3) en caso de sobrecarga de volumen.',
    pearl: 'Insuficiencia Mitral = Soplo holosistólico en barra en ápex + Irradiación a axila izquierda + R3 de galope.',
    quiz: {
      question: 'Paciente femenina de 65 años con disnea. Se ausculta un soplo holosistólico de tono soplante en la punta que irradia hacia la axila del mismo lado. ¿Qué alteración sospecha?',
      options: [
        'Insuficiencia Mitral',
        'Estenosis Mitral',
        'Insuficiencia Aórtica',
        'Estenosis Aórtica',
        'Pericarditis Aguda'
      ],
      correctIndex: 0,
      explanation: 'El soplo holosistólico apexiano que se proyecta hacia la línea axilar anterior izquierda es la manifestación clásica de la insuficiencia mitral, indicando reflujo sistólico desde el VI hacia la AI.'
    }
  },
  pulmon_ant_sup_der: {
    id: 'pulmon_ant_sup_der',
    name: 'Campo Pulmonar Anterior Superior Derecho',
    type: 'lung',
    location: 'Zona infraclavicular superior derecha',
    view: 'anterior',
    x: 72,
    y: 105,
    ve: 'Expansión torácica normal o ligeramente asimétrica en la inspección general.',
    toca: 'Vibraciones vocales (V.V.) normales al repetir "treinta y tres". Aumentadas en neumonía.',
    oye: 'Murmullo vesicular normal (suave y soplante, audible en inspiración). Sibilancias espiratorias en crisis asmáticas o crepitantes secos iniciales.',
    pearl: 'Las sibilancias son ruidos musicales continuos producidos por el paso del aire a través de bronquios estrechados por broncoespasmo.',
    quiz: {
      question: 'Joven de 17 años con sibilancias espiratorias difusas audibles en toda la auscultación y tos seca. ¿Cuál es la sospecha etiológica primordial?',
      options: [
        'Crisis de Asma Bronquial',
        'Edema Agudo de Pulmón',
        'Neumotórax Espontáneo',
        'Derrame Pleural Masivo',
        'Tromboembolismo Pulmonar'
      ],
      correctIndex: 0,
      explanation: 'Las sibilancias bilaterales and difusas se deben a la reducción del calibre bronquial por inflamación y broncoespasmo, característico de una crisis asmática.'
    }
  },
  pulmon_ant_sup_izq: {
    id: 'pulmon_ant_sup_izq',
    name: 'Campo Pulmonar Anterior Superior Izquierdo',
    type: 'lung',
    location: 'Zona infraclavicular superior izquierda',
    view: 'anterior',
    x: 128,
    y: 105,
    ve: 'Simetría respiratoria normal en la inspección estática y dinámica del tórax anterior.',
    toca: 'Vibraciones vocales simétricas. Abolidas en neumotórax o derrame pleural.',
    oye: 'Murmullo vesicular respiratorio normal. Presencia de estertores crepitantes localizados en caso de foco de condensación inicial.',
    pearl: 'Los estertores crepitantes indican apertura brusca de alvéolos colapsados por líquido o exudado al final de la inspiración.',
    quiz: {
      question: 'En un paciente con fiebre alta se auscultan estertores crepitantes finos y soplo tubárico localizados en esta zona. ¿Qué síndrome clínico sugiere?',
      options: [
        'Síndrome de Condensación Pulmonar (Neumonía)',
        'Síndrome de Derrame Pleural',
        'Neumotórax a Tensión',
        'Enfisema Pulmonar Estable',
        'Espasmo Laríngeo Agudo'
      ],
      correctIndex: 0,
      explanation: 'Los crepitantes fijos acompañados de soplo tubárico y aumento de vibraciones vocales configuran el síndrome de condensación pulmonar, característico de la neumonía lobar.'
    }
  },
  pulmon_ant_inf_der: {
    id: 'pulmon_ant_inf_der',
    name: 'Campo Pulmonar Anterior Inferior Derecho',
    type: 'lung',
    location: 'Región basal anterior derecha (base pulmonar)',
    view: 'anterior',
    x: 70,
    y: 150,
    ve: 'Movimiento costal inferior simétrico visible en la inspiración del paciente.',
    toca: 'Límite superior del hígado palpable por debajo del reborde costal. Vibraciones vocales conservadas.',
    oye: 'Murmullo vesicular normal. Estertores húmedos gruesos (roncus) que disminuyen con la tos, indicando secreciones en bronquios mayores.',
    pearl: 'Los roncus son estertores de burbuja gruesa modificables con la tos, originados por moco móvil en vías aéreas grandes.',
    quiz: {
      question: 'Ausculta un ruido sordo, de tono grave que recuerda a un ronquido y que desaparece o se modifica ostensiblemente tras indicarle al paciente que tosa. ¿Qué ruido es?',
      options: [
        'Roncus (estertores secos gruesos)',
        'Sibilancias espiratorias finas',
        'Estertores crepitantes basales',
        'Frote pleural inflamatorio',
        'Estridor laríngeo alto'
      ],
      correctIndex: 0,
      explanation: 'El roncus es provocado por la vibración del flujo aéreo en presencia de moco denso en los bronquios principales; al toser, el moco se desplaza limpiando el conducto y modificando el sonido.'
    }
  },
  pulmon_ant_inf_izq: {
    id: 'pulmon_ant_inf_izq',
    name: 'Campo Pulmonar Anterior Inferior Izquierdo',
    type: 'lung',
    location: 'Región basal anterior izquierda (base pulmonar)',
    view: 'anterior',
    x: 130,
    y: 150,
    ve: 'Expansión de la base simétrica. Choque de punta auscultado en las inmediaciones.',
    toca: 'Palpación simétrica. Matidez percutoria en área cardíaca colindante.',
    oye: 'Murmullo vesicular normal. Presencia de estertores crepitantes bibasales (en "velcro") en caso de insuficiencia cardíaca congestiva o fibrosis.',
    pearl: 'Crepitantes bibasales finos bilaterales ("en velcro") y disnea progresiva sugieren congestión pulmonar por falla cardíaca izquierda.',
    quiz: {
      question: 'Varón de 68 años con disnea de esfuerzo y edema en pies presenta estertores crepitantes finos en ambas bases pulmonares. ¿Cuál es el diagnóstico de sospecha?',
      options: [
        'Insuficiencia Cardíaca Congestiva (Congestión Pasiva Pulmonar)',
        'Asma Bronquial Extrínseca',
        'Neumotórax Espontáneo Derecho',
        'Bronquitis Crónica Estable',
        'Derrame Pleural Izquierdo Tabicado'
      ],
      correctIndex: 0,
      explanation: 'La falla ventricular izquierda eleva de forma retrógrada las presiones capilares pulmonares, trasudando líquido a los alvéolos de las bases, lo que genera los crepitantes bilaterales.'
    }
  },
  pulmon_post_sup_der: {
    id: 'pulmon_post_sup_der',
    name: 'Campo Pulmonar Posterior Superior Derecho',
    type: 'lung',
    location: 'Zona escapular superior posterior derecha',
    view: 'posterior',
    x: 128,
    y: 105,
    ve: 'Inspección de espalda normal; cifosis o escoliosis pueden alterar la auscultación simétrica.',
    toca: 'Expansibilidad de vértices pulmonares simétrica a la palpación manual.',
    oye: 'Murmullo vesicular nítido y fisiológico. Soplo brónquico transmitido o ruidos de secreciones de la vía aérea superior.',
    pearl: 'Evalúa la expansibilidad de vértices colocando tus manos sobre los hombros del paciente con los pulgares tocándose en la línea media vertebral.',
    quiz: {
      question: '¿Qué maniobra física evalúa la simetría de la expansión respiratoria en los vértices posteriores del tórax?',
      options: [
        'Maniobra de Ruault (palpación de vértices)',
        'Maniobra de Quervain tiroidea',
        'Maniobra de Gerhardt de percusión',
        'Maniobra de Dressler precordial',
        'Maniobra de Pemberton de plétora'
      ],
      correctIndex: 0,
      explanation: 'La maniobra de Ruault se realiza colocando las manos sobre los trapecios del paciente apoyando los pulgares en las apófisis espinosas para observar su separación simétrica al respirar.'
    }
  },
  pulmon_post_sup_izq: {
    id: 'pulmon_post_sup_izq',
    name: 'Campo Pulmonar Posterior Superior Izquierdo',
    type: 'lung',
    location: 'Zona escapular superior posterior izquierda',
    view: 'posterior',
    x: 72,
    y: 105,
    ve: 'Líneas vertebrales rectas, musculatura paravertebral normal e indolora.',
    toca: 'Vibraciones vocales palpables y simétricas en la región interescapular.',
    oye: 'Murmullo vesicular respiratorio normal. Ruidos alveolares fisiológicos sin soplos.',
    pearl: 'La auscultación pulmonar en la espalda debe ser simétrica y comparativa, de un lado al otro en escalera.',
    quiz: {
      question: 'Al realizar la auscultación de la espalda, ¿cuál es el patrón de progresión recomendado semiológicamente?',
      options: [
        'Comparativo en escalera (de arriba a abajo comparando cada nivel contralateral)',
        'Unilateral completo derecho primero y luego izquierdo completo',
        'Ausculte únicamente las bases inferiores y omita los raíces',
        'Percutir antes de auscultar sin orden específico',
        'Ausculte de abajo hacia arriba de forma circular'
      ],
      correctIndex: 0,
      explanation: 'Para detectar asimetrías o focos localizados, la auscultación debe ser siempre comparativa y simétrica en escalera, examinando cada punto contralateral a la misma altura.'
    }
  },
  pulmon_post_inf_der: {
    id: 'pulmon_post_inf_der',
    name: 'Campo Pulmonar Posterior Inferior Derecho',
    type: 'lung',
    location: 'Región infraescapular basal derecha',
    view: 'posterior',
    x: 130,
    y: 155,
    ve: 'Expansibilidad de las bases torácicas normal y simétrica.',
    toca: 'Expansión de bases mediante maniobra de Lasègue/bases. Matidez percutoria por debajo del 10mo espacio intercostal.',
    oye: 'Murmullo vesicular limpio. Abolición del murmullo con matidez hídrica sugiere derrame pleural derecho.',
    pearl: 'El derrame pleural produce matidez hídrica a la percusión, abolición de las vibraciones vocales y silencio auscultatorio.',
    quiz: {
      question: 'Paciente con dolor torácico derecho presenta abolición de vibraciones vocales, silencio respiratorio absoluto y matidez hídrica intensa en esta base. ¿Cuál es su sospecha?',
      options: [
        'Derrame Pleural Derecho',
        'Neumotórax Espontáneo Completo',
        'Neumonía Lobar Aguda',
        'Crisis de Broncoespasmo Severa',
        'Obstrucción Traqueal por Cuerpo Extraño'
      ],
      correctIndex: 0,
      explanation: 'El líquido en el espacio pleural actúa como barrera física aislante, aboliendo la transmisión de las vibraciones de la voz y el paso del aire al murmullo, produciendo matidez hídrica al percutir.'
    }
  },
  pulmon_post_inf_izq: {
    id: 'pulmon_post_inf_izq',
    name: 'Campo Pulmonar Posterior Inferior Izquierdo',
    type: 'lung',
    location: 'Región infraescapular basal izquierda',
    view: 'posterior',
    x: 70,
    y: 155,
    ve: 'Movilidad de la base normal. Escoliosis reactiva por dolor puede ser observable.',
    toca: 'Vibraciones vocales táctiles normales en la base izquierda.',
    oye: 'Murmullo vesicular normal. Ausencia de ruidos con timpanismo percutorio sugiere neumotórax izquierdo.',
    pearl: 'Silencio auscultatorio + Timpanismo marcado a la percusión = Neumotórax.',
    quiz: {
      question: 'Un paciente joven ingresa con disnea y dolor agudo en costado izquierdo. Al percutir esta base se escucha hipersonoridad/timpanismo y el murmullo está abolido. ¿Qué diagnóstico plantea?',
      options: [
        'Neumotórax Espontáneo Izquierdo',
        'Derrame Pleural Masivo Izquierdo',
        'Atelectasia por Tapón de Moco',
        'Neumonía Lobar Basal Izquierda',
        'Hernia Diafragmática Crónica'
      ],
      correctIndex: 0,
      explanation: 'El neumotórax (aire libre en pleura) genera timpanismo y colapsa el pulmón por presión positiva, anulando la auscultación del murmullo vesicular.'
    }
  }
};
