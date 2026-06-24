// BANCO DE DATOS DE REPASO OFICIAL - SEMIOLOGÍA MÉDICA (MED-228) UCE
// Contiene: 50 Flashcards y 50 Preguntas tipo Quiz (Segunda Parcial - Semanas 7 a 10)
// Bibliografía: Argente-Álvarez, Bickley (Bates), Surós.

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  domain: 'semantic' | 'procedural' | 'executive' | 'perceptual';
  reference?: string;
}

export interface QuizQuestion {
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

export const SEMIOLOGIA_SEGUNDO_PARCIAL = {
  title: "Semiología Médica (Segundo Parcial)",
  code: "MED-228",
  syllabusObjective: "Integrar el examen físico pulmonar, precordial, de presión arterial y pulsos para discriminar patologías cardiorrespiratorias.",
  flashcards: [
    {
      id: 1,
      question: "¿Cuáles son las principales líneas de referencia vertical que se utilizan en la exploración del tórax anterior?",
      answer: "La <strong>línea medioesternal</strong> (en el centro del esternón), las <strong>líneas paraesternales</strong> (a ambos lados del esternón) y las <strong>líneas medioclaviculares</strong> (que pasan por el punto medio de la clavícula bilateral).",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 2,
      question: "¿Qué líneas delimitan las regiones laterales del tórax?",
      answer: "La <strong>línea axilar anterior</strong> (que baja desde el pliegue axilar anterior), la <strong>línea axilar media</strong> (que baja desde el vértice de la axila) y la <strong>línea axilar posterior</strong> (que baja desde el pliegue axilar posterior).",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 3,
      question: "¿Cuál es el tipo respiratorio normal en hombres adultos y qué músculos predomina?",
      answer: "El tipo respiratorio normal en hombres es <strong>costoabdominal</strong>, donde predomina la acción del diafragma y los músculos abdominales.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 4,
      question: "¿Cuál es el tipo respiratorio normal en mujeres adultas?",
      answer: "El tipo respiratorio normal en mujeres es <strong>costal superior</strong>, donde predomina el uso de los músculos intercostales y accesorios superiores.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 5,
      question: "¿Cómo se define la eupnea y cuál es su rango normal en reposo?",
      answer: "La <strong>eupnea</strong> es la respiración normal, caracterizada por movimientos rítmicos, simétricos y sin esfuerzo. Su frecuencia normal en reposo es de <strong>12 a 20 respiraciones por minuto</strong>.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 6,
      question: "¿Cuál es la diferencia semiológica entre taquipnea y polipnea?",
      answer: "La <strong>taquipnea</strong> es el aumento de la frecuencia respiratoria manteniendo una profundidad normal o superficial. La <strong>polipnea</strong> o hiperpnea es el aumento tanto de la frecuencia como de la profundidad respiratoria.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 7,
      question: "¿Cómo se realiza correctamente la maniobra de amplexación en el examen físico de tórax?",
      answer: "Se coloca una mano en la cara anterior del tórax y la otra en la posterior a nivel de las bases y se le pide al paciente que inspire profundamente. Evalúa la <strong>elasticidad y expansión torácica anteroposterior</strong>.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 8,
      question: "¿Qué evalúa la maniobra de amplexión y cómo se sitúan las manos?",
      answer: "Evalúa la <strong>expansión lateral y simétrica</strong> del tórax. Para las bases, el examinador coloca ambas manos en la espalda rodeando los campos inferiores con los pulgares tocándose en la línea media y pide inspirar. Los pulgares deben separarse simétricamente.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 9,
      question: "¿Qué son las vibraciones vocales (V.V.) y cómo se transmiten?",
      answer: "Son las vibraciones de las cuerdas vocales transmitidas a través de la tráquea, bronquios y parénquima pulmonar hasta la pared torácica. Se exploran colocando la palma de la mano sobre el tórax mientras el paciente repite 'treinta y tres'.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 10,
      question: "¿Por qué aumentan las vibraciones vocales en el síndrome de condensación (ej. neumonía)?",
      answer: "Porque el parénquima pulmonar se vuelve denso y homogéneo (sólido), lo cual transmite las vibraciones mecánicas del sonido con <strong>mayor velocidad y menor disipación</strong> que el parénquima aireado normal.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 11,
      question: "¿Por qué están disminuidas o abolidas las vibraciones vocales en el derrame pleural?",
      answer: "Porque el líquido acumulado en el espacio pleural actúa como una <strong>barrera física que refleja e interrumpe</strong> la propagación de las ondas sonoras desde el parénquima a la pared del tórax.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 12,
      question: "¿Cuál es el hallazgo percutorio clásico sobre un pulmón normal?",
      answer: "La <strong>sonoridad pulmonar</strong>, un sonido claro, fuerte, de tono bajo y duración prolongada, que se produce al percutir tejido que contiene aire elástico.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 13,
      question: "¿Qué indica una matidez percutoria en la región pulmonar posterior?",
      answer: "Indica la <strong>ausencia de aire elástico</strong> en el parénquima (reemplazado por líquido, tejido sólido o colapso), característico de neumonía, atelectasia o derrame pleural.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 14,
      question: "¿Qué indica la hipersonoridad o el timpanismo a la percusión torácica?",
      answer: "Indica un <strong>exceso de aire</strong> en el tórax. La hipersonoridad es típica del enfisema pulmonar (atrapamiento de aire), y el timpanismo es típico del neumotórax (aire libre en espacio pleural).",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 15,
      question: "¿Qué es el murmullo vesicular (M.V.) y dónde se ausculta normalmente?",
      answer: "Es el ruido respiratorio normal de tono bajo y carácter suave, producido por la entrada de aire en los alvéolos. Se ausculta en toda el área pulmonar sana, predominantemente en la fase inspiratoria.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 16,
      question: "¿Qué es el soplo tubárico y cuándo aparece?",
      answer: "Es la transmisión del ruido laringotraqueal (soplo glótico) a la pared torácica. Aparece en el <strong>síndrome de condensación</strong>, siempre que el bronquio que ventila la zona esté permeable y la condensación esté en contacto con la pared.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 17,
      question: "¿Qué son los estertores crepitantes y qué mecanismo los produce?",
      answer: "Son ruidos discontinuos, cortos y agudos (como frotar cabello). Se producen por la <strong>apertura brusca de alvéolos colapsados</strong> por líquido o exudado al final de la inspiración. No cambian con la tos.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 18,
      question: "¿Qué son los estertores roncus y cómo se diferencian de los crepitantes?",
      answer: "Son ruidos continuos, graves y roncos producidos por el paso de aire a través de bronquios grandes obstruidos por moco. Se diferencian de los crepitantes porque <strong>se modifican o desaparecen tras indicarle al paciente que tosa</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 19,
      question: "¿Qué representan las sibilancias a la auscultación y en qué patologías se oyen?",
      answer: "Representan la <strong>estenosis de los bronquios pequeños</strong> por broncoespasmo o edema de la mucosa. Son ruidos continuos y musicales, típicos de crisis asmática y EPOC agudizado.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 20,
      question: "¿Qué es el frote pleural y cómo se distingue de otros ruidos?",
      answer: "Es el ruido áspero provocado por la fricción de las hojas visceral y parietal de la pleura inflamadas. Se escucha en <strong>ambas fases respiratorias (inspiración y espiración)</strong>, no cambia con la tos y aumenta al presionar el estetoscopio.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 21,
      question: "¿En qué consiste la egofonía (voz de cabra) y qué patología indica?",
      answer: "Es la auscultación de la voz del paciente con un timbre nasal y trémulo (como un balido). Es típica de la **zona superior o límite de un derrame pleural** de moderada cuantía.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 22,
      question: "¿Qué diferencia hay entre pectoriloquia y pectoriloquia áfona?",
      answer: "La <strong>pectoriloquia</strong> es la auscultación nítida de la voz articulada. La <strong>pectoriloquia áfona</strong> es la auscultación clara de la voz cuchicheada (hablada en secreto). Ambas indican condensación pulmonar.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 23,
      question: "¿Cuál es la tríada de Galliard típica del neumotórax?",
      answer: "1. <strong>Abolición del murmullo vesicular</strong> (silencio respiratorio).<br>2. <strong>Abolición de las vibraciones vocales</strong>.<br>3. <strong>Hipersonoridad o timpanismo</strong> a la percusión.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 24,
      question: "¿Cuáles son las 4 características del examen físico en un derrame pleural típico?",
      answer: "Inspección: menos expansión de la base afectada. Palpación: V.V. disminuidas o abolidas. Percusión: <strong>matidez hídrica</strong> (curva de Damoiseau). Auscultación: M.V. ausente, con egofonía en el límite superior.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
    },
    {
      id: 25,
      question: "¿Dónde se localiza anatómicamente el Foco Aórtico cardíaco?",
      answer: "En el <strong>segundo espacio intercostal derecho</strong>, inmediatamente al lado de la línea paraesternal derecha.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 26,
      question: "¿Dónde se localiza anatómicamente el Foco Pulmonar cardíaco?",
      answer: "En el <strong>segundo espacio intercostal izquierdo</strong>, junto a la línea paraesternal izquierda.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 27,
      question: "¿Dónde se palpa y ausculta el Foco Mitral (o apexiano)?",
      answer: "En el <strong>quinto espacio intercostal izquierdo, en la línea medioclavicular izquierda</strong> (coincide con el ápex del ventrículo izquierdo).",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 28,
      question: "¿Qué es el foco aórtico accesorio o foco de Erb y dónde está?",
      answer: "Es el foco donde se auscultan mejor los soplos de insuficiencia aórtica. Se localiza en el <strong>tercer espacio intercostal izquierdo</strong>, junto a la línea paraesternal izquierda.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 29,
      question: "¿Qué fenómeno mecánico valvular produce el Primer Ruido Cardíaco (R1)?",
      answer: "El <strong>cierre simultáneo de las válvulas auriculoventriculares</strong>: la mitral (M1) y la tricúspide (T1), que marca el inicio de la sístole ventricular.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 30,
      question: "¿Qué fenómeno produce el Segundo Ruido Cardíaco (R2)?",
      answer: "El <strong>cierre de las válvulas semilunares o sigmoideas</strong>: la aórtica (A2) y la pulmonar (P2), marcando el inicio de la diástole ventricular.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 31,
      question: "¿En qué consiste el desdoblamiento fisiológico del segundo ruido (R2)?",
      answer: "Es el retraso en el cierre de la válvula pulmonar provocado por el aumento del retorno venoso al ventrículo derecho durante la <strong>inspiración profunda</strong>. Desaparece durante la espiración.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 32,
      question: "¿Qué es el Tercer Ruido (R3) y cuándo indica patología?",
      answer: "Es un ruido diastólico temprano provocado por el llenado ventricular rápido pasivo. Es fisiológico en niños y embarazadas, pero en mayores de 40 años indica **insuficiencia cardíaca sistólica o sobrecarga de volumen**.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 33,
      question: "¿Qué es el Cuarto Ruido (R4) y cuál es su causa fisiopatológica?",
      answer: "Es un ruido presistólico producido por la contracción de la aurícula contra un ventrículo rígido (con distensibilidad disminuida), debido a hipertrofia por HTA o estenosis aórtica.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 34,
      question: "¿Por qué es imposible auscultar un R4 en un paciente con Fibrilación Auricular?",
      answer: "Porque el R4 requiere obligatoriamente una <strong>sístole auricular mecánica coordinada y efectiva</strong> para empujar la sangre hacia el ventrículo. En la fibrilación auricular no hay contracción auricular organizada.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 35,
      question: "¿Qué características tiene el soplo de la Estenosis Aórtica?",
      answer: "Es un soplo <strong>mesosistólico eyectivo, de forma romboidal (crescendo-decrescendo)</strong>, áspero, audible en foco aórtico y que típicamente <strong>se irradia a las arterias carótidas</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 36,
      question: "¿Qué características tiene el soplo de la Insuficiencia Mitral?",
      answer: "Es un soplo <strong>holosistólico (pancardíaco) en barra</strong>, de tono constante, audible en el foco mitral y que <strong>se irradia a la axila izquierda</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 37,
      question: "¿Qué maniobra magnifica los soplos izquierdos de foco mitral y cómo se realiza?",
      answer: "La <strong>maniobra de Pachón</strong>. Consiste en colocar al paciente en decúbito lateral izquierdo, lo que acerca el ventrículo izquierdo a la pared torácica, facilitando la auscultación.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 38,
      question: "¿Cómo se define la Maniobra de Harvey y para qué sirve?",
      answer: "Consiste en sentar al paciente e inclinarlo hacia adelante. Sirve para magnificar los soplos diastólicos de la <strong>insuficiencia aórtica e insuficiencia pulmonar</strong> al acercar la base del corazón a la pared torácica.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 39,
      question: "¿Qué cifras definen una Presión Arterial normal y una elevada según las guías AHA/ACC?",
      answer: "PA Normal: <strong>sistólica < 120 y diastólica < 80 mmHg</strong>. PA Elevada: <strong>sistólica entre 120-129 y diastólica < 80 mmHg</strong>.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 40,
      question: "¿Cuáles son los límites de presión para la Hipertensión Estadio 1 según AHA/ACC?",
      answer: "Presión sistólica de <strong>130 a 139 mmHg</strong> o diastólica de <strong>80 a 89 mmHg</strong>.",
      domain: "semantic",
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 41,
      question: "¿Qué fase de Korotkoff indica la presión arterial sistólica y cuál la diastólica?",
      answer: "La <strong>Fase I</strong> (primer ruido sordo, repetitivo) indica la presión arterial sistólica. La <strong>Fase V</strong> (silencio, desaparición de ruidos) indica la presión arterial diastólica en adultos.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 42,
      question: "¿Qué es el agujero o brecha auscultatoria (Auscultatory Gap) y cómo se evita subestimar la PA?",
      answer: "Es un silencio temporal entre los ruidos de la Fase I y II de Korotkoff, común en ancianos hipertensos. Se evita inflando el manguito 20-30 mmHg por encima del nivel de la <strong>presión sistólica determinada previamente por el método palpatorio</strong>.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 43,
      question: "¿Cuáles son las características clínicas que deben evaluarse en el pulso arterial?",
      answer: "Frecuencia, <strong>regularidad</strong> (ritmo), <strong>amplitud</strong> (fuerza), <strong>tensión</strong> (dureza), forma (velocidad de ascenso) y simetría.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 44,
      question: "¿Qué es el pulso Tardus et Parvus y con qué valvulopatía se asocia?",
      answer: "Es un pulso de baja amplitud (parvus) y ascenso lento (tardus). Es característico de la <strong>estenosis valvular aórtica severa</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 45,
      question: "¿Qué es el pulso Celer o en martillo de agua y en qué patología es típico?",
      answer: "Es un pulso de ascenso muy rápido y colapso súbito (amplitud aumentada). Es típico de la <strong>insuficiencia valvular aórtica</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 46,
      question: "¿Qué caracteriza al pulso alternante y de qué es signo?",
      answer: "Se caracteriza por la alternancia de un latido fuerte y uno débil con ritmo regular. Es un signo clásico de <strong>insuficiencia cardíaca izquierda grave</strong>.",
      domain: "perceptual",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 47,
      question: "¿Qué es el pulso paradójico y qué patología de urgencia sugiere?",
      answer: "Es la disminución patológica de la presión sistólica (> 10 mmHg) durante la inspiración. Sugiere fuertemente <strong>taponamiento cardíaco</strong>.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 48,
      question: "¿A cuántos grados de torso debe colocarse al paciente para evaluar la Presión Venosa Yugular (PVY)?",
      answer: "Debe estar en decúbito dorsal con la cabecera sobreelevada a <strong>45 grados</strong>, rotando ligeramente la cabeza al lado contrario.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 49,
      question: "¿Cómo se realiza y qué evalúa el Reflujo Hepatojugular (RHJ)?",
      answer: "Se presiona firmemente el hipocondrio derecho durante 10-15 segundos. Es positivo si la ingurgitación venosa cervical aumenta y persiste >3 cm. Indica **insuficiencia cardíaca derecha**.",
      domain: "procedural",
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 50,
      question: "¿Qué es el Signo de Kussmaul en la evaluación venosa yugular?",
      answer: "Es el aumento patológico de la ingurgitación yugular durante la <strong>inspiración profunda</strong> (normalmente debería disminuir). Es típico de pericarditis constrictiva.",
      domain: "executive",
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    }
  ],
  quiz: [
    {
      id: 1,
      scenario: "Varón de 23 años acude a emergencias tras un traumatismo cerrado de tórax en un juego de béisbol. Presenta disnea severa súbita y dolor torácico lancinante derecho. Al examen: FR 28/min. Inspección: asimetría torácica con hipomovilidad del hemitórax derecho. Palpación: abolición de las vibraciones vocales en el lado derecho. Percusión: hipersonoridad marcada. Auscultación: abolición del murmullo vesicular derecho.",
      question: "¿Cuál integración semiológica es más correcta para este paciente?",
      options: [
        "Síndrome de condensación pulmonar derecho.",
        "Derrame pleural derecho masivo.",
        "Neumotórax traumático derecho.",
        "Atelectasia obstructiva derecha.",
        "Tromboembolismo pulmonar masivo."
      ],
      correctAnswer: 2,
      justification: "El caso presenta la tríada clásica de Galliard para neumotórax: hipomovilidad/asimetría, abolición de vibraciones vocales, hipersonoridad/timpanismo a la percusión, y abolición del murmullo vesicular. El derrame pleural daría matidez a la percusión en lugar de hipersonoridad. La condensación daría matidez y vibraciones vocales aumentadas.",
      pearl: "Mnemotecnia de Neumotórax: Aire = Timbal (timpanismo) + Silencio (ausencia de VV y MV).",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 2,
      scenario: "Mujer de 72 años con antecedentes de insuficiencia cardíaca congestiva crónica acude por disnea progresiva hasta mínimos esfuerzos. A la auscultación pulmonar en ambas bases posteriores, se perciben ruidos discontinuos, cortos, que suenan como frotar cabello o despegar un velcro, que ocurren exclusivamente durante la fase final de la inspiración y no cambian tras inducirle tos.",
      question: "¿Qué tipo de ruido adventicio presenta y cuál es su causa fisiopatológica?",
      options: [
        "Estertor roncus; obstrucción por secreciones densas en bronquios principales.",
        "Estertor sibilante; broncoespasmo de la pequeña vía aérea.",
        "Estertor crepitante; despegamiento de alvéolos colapsados por líquido intersticial.",
        "Frote pleural; roce de las pleuras inflamadas.",
        "Estridor laríngeo; obstrucción de la glotis."
      ],
      correctAnswer: 2,
      justification: "Los crepitantes son ruidos respiratorios discontinuos que ocurren al final de la inspiración debido a la apertura brusca de alvéolos que se habían colapsado por la presencia de transudado o líquido en el espacio alveolar, típico de la congestión pulmonar por falla cardíaca izquierda. Su carácter fijo (no cambia con la tos) los diferencia de los roncus.",
      pearl: "Los crepitantes son alveolares (no cambian con la tos); los roncus son bronquiales (sí cambian con la tos).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 3,
      scenario: "Paciente asmático de 19 años ingresa con dificultad respiratoria marcada, cianosis labial y tiraje intercostal. Al auscultar el tórax se perciben ruidos continuos, de carácter musical y tono agudo, distribuidos de forma difusa en ambos campos pulmonares tanto en inspiración como en espiración.",
      question: "¿Cómo se clasifican estos ruidos y qué indica su presencia generalizada?",
      options: [
        "Estertores húmedos subcrepitantes; neumonía lobar.",
        "Sibilancias diseminadas; broncoespasmo difuso y estenosis de la vía aérea pequeña.",
        "Roncus localizados; secreciones abundantes en tráquea.",
        "Soplo tubárico; condensación parenquimatosa.",
        "Frote pleural; derrame pleural incipiente."
      ],
      correctAnswer: 1,
      justification: "Las sibilancias son ruidos musicales continuos producidos por el paso de aire a alta velocidad a través de bronquios pequeños estenosados por broncoespasmo y edema. Son típicos de la crisis de asma bronquial.",
      pearl: "Sibilancias = Música de bronquios estrechos. En el asma, el broncoespasmo cierra el conducto y genera silbidos.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 4,
      scenario: "Varón de 64 años acude por dolor torácico lancinante de 3 días de evolución que aumenta al respirar profundo y al toser. Refiere que el dolor disminuye significativamente cuando se recuesta sobre su lado derecho en la cama. A la auscultación, se percibe un ruido áspero, similar a frotar cuero nuevo, audible en foco axilar derecho durante la inspiración y la espiración, que no se modifica con la tos.",
      question: "¿Cuál es el diagnóstico sindrómico más probable?",
      options: [
        "Neumonía bacteriana derecha.",
        "Pleuresía seca (inflamación pleural) con frote pleural.",
        "Derrame pleural derecho masivo.",
        "Neumotórax espontáneo derecho.",
        "Infarto agudo de miocardio."
      ],
      correctAnswer: 1,
      justification: "El frote pleural es patognomónico de la inflamación de las hojas pleurales (pleuresía seca). Se escucha en ambas fases, no cambia con la tos y se asocia a dolor pleurítico que alivia al ferular el hemitórax afectado (decúbito lateral derecho).",
      pearl: "El roce pleural suena en dos tiempos (in y ex) y duele al respirar; acostarse sobre el dolor lo calma.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 5,
      scenario: "Varón de 50 años ingresa por fiebre, tos con expectoración herrumbrosa y disnea. Al examen físico: taquipnea (24/min). Tórax: vibraciones vocales aumentadas en el campo medio e inferior derecho, matidez localizada a la percusión, y auscultación con ausencia del murmullo vesicular reemplazado por un ruido soplante áspero y pectoriloquia áfona.",
      question: "¿Cuál es el síndrome respiratorio clásico documentado?",
      options: [
        "Síndrome de derrame pleural derecho.",
        "Síndrome de neumotórax derecho.",
        "Síndrome de condensación pulmonar (neumonía).",
        "Síndrome de enfisema pulmonar.",
        "Síndrome de atelectasia obstructiva."
      ],
      correctAnswer: 2,
      justification: "El aumento de vibraciones vocales, la matidez, el soplo tubárico (ruido soplante transmitido) y la pectoriloquia áfona son los hallazgos típicos del síndrome de condensación pulmonar con bronquio permeable (neumonía bacteriana). En la atelectasia obstructiva las vibraciones vocales estarían abolidas.",
      pearl: "Condensación = Parénquima lleno de exudado que transmite mejor la voz y apaga el murmullo vesicular.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 6,
      scenario: "Durante la auscultación torácica posterior de un paciente con disnea, el examinador pide al paciente que diga 'treinta y tres' en voz baja (cuchicheada). El examinador percibe las palabras con extrema nitidez y claridad a través del diafragma del estetoscopio sobre la base pulmonar izquierda.",
      question: "¿Qué término define este hallazgo semiológico y qué indica?",
      options: [
        "Egofonía; presencia de líquido pleural libre.",
        "Pectoriloquia áfona; condensación pulmonar.",
        "Broncofonía simple; pulmón normal y aireado.",
        "Resonancia vocal normal; ausencia de patología.",
        "Soplo anfórico; gran cavidad pulmonar vacía."
      ],
      correctAnswer: 1,
      justification: "La pectoriloquia áfona (pecho que habla sin voz) es la auscultación clara de la voz cuchicheada. Ocurre porque el parénquima condensado (sólido) transmite las frecuencias altas del habla sin distorsión, indicando condensación pulmonar.",
      pearl: "El cuchicheo nítido es señal de condensación pulmonar sólida.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 7,
      scenario: "Paciente de 58 años con EPOC e historia de tabaquismo severo consulta por disnea de esfuerzo. Al examen: tórax hiperinsuflado ('en tonel'). Palpación: expansión y vibraciones vocales disminuidas globalmente. Percusión: hipersonoridad difusa bilateral con descenso de las bases pulmonares. Auscultación: murmullo vesicular muy disminuido de forma generalizada.",
      question: "¿Cuál es el diagnóstico sindrómico más consistente con estos hallazgos?",
      options: [
        "Derrame pleural bilateral de baja cuantía.",
        "Síndrome de rarefacción pulmonar (enfisema pulmonar).",
        "Condensación lobar bilateral.",
        "Atelectasia masiva izquierda.",
        "Neumotórax bilateral a tensión."
      ],
      correctAnswer: 1,
      justification: "El enfisema pulmonar se caracteriza por la destrucción de septos alveolares y atrapamiento aéreo crónico, lo que causa un tórax en tonel, hipersonoridad percutoria bilateral, descenso de bases y abolición/disminución difusa del MV y las vibraciones vocales.",
      pearl: "Rarefacción (Enfisema) = Tórax inflado de aire atrapado que apaga la auscultación.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 8,
      scenario: "Varón de 45 años consulta por fiebre de 39°C y dolor pungitivo en base izquierda. Al examen: FR 22/min. Tórax posterior izquierdo: matidez percutoria que asciende lateralmente formando una curva (línea de Damoiseau-Ellis). Al auscultar en el límite superior de esta zona, se percibe la voz del paciente con un timbre nasal y trémulo.",
      question: "¿Cómo se llama este hallazgo de la voz auscultada y qué confirma?",
      options: [
        "Pectoriloquia; neumonía lobar izquierda.",
        "Egofonía; límite superior de un derrame pleural izquierdo.",
        "Broncofonía; bronquitis aguda obstructiva.",
        "Resonancia anfórica; neumotórax a tensión.",
        "Soplo pleurítico; atelectasia compresiva."
      ],
      correctAnswer: 1,
      justification: "La egofonía (voz de cabra) es la transmisión nasal y temblorosa de la voz, característica de la zona de compresión pulmonar en el límite superior de un derrame pleural.",
      pearl: "Egofonía = Balido de cabra en el límite de agua del derrame pleural.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 9,
      scenario: "Paciente mujer de 38 años consulta por disnea progresiva de 2 semanas. Al examen físico se aprecia matidez en la base pulmonar derecha. Las vibraciones vocales están completamente ausentes en esa misma zona y el murmullo vesicular está abolido.",
      question: "¿Qué maniobra o hallazgo adicional nos ayuda a diferenciar semiológicamente una atelectasia obstructiva de un derrame pleural derecho en esta paciente?",
      options: [
        "Percusión del hipocondrio derecho.",
        "Desviación de la tráquea hacia el lado afectado (atelectasia) vs. desviación hacia el lado sano (derrame pleural grande).",
        "Auscultación de sibilancias localizadas.",
        "Toma de presión arterial yugular.",
        "Evaluación de la maniobra de Quervain."
      ],
      correctAnswer: 1,
      justification: "Tanto la atelectasia obstructiva como el derrame pleural cursan con matidez, abolición de VV y MV. La diferencia radica en los cambios de volumen: la atelectasia es un colapso que retrae las estructuras mediastínicas (traquea) hacia el lado afectado, mientras que un derrame pleural grande las desplaza hacia el lado contralateral (sano).",
      pearl: "Atelectasia tira la tráquea hacia sí (colapso); el Derrame pleural grande la empuja al lado sano (presión).",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 10,
      scenario: "Un estudiante de medicina examina a un paciente con tos persistente. Al auscultar, percibe un soplo áspero de tono bajo en la región anterior del tórax, sobre el esternón, que ocurre de manera simétrica tanto en inspiración como en espiración. El parénquima pulmonar periférico muestra murmullo vesicular conservado.",
      question: "¿Cuál es la interpretación de este ruido auscultado?",
      options: [
        "Es un soplo tubárico patológico por condensación.",
        "Es el ruido laringotraqueal (soplo glótico) normal auscultado en su localización anatómica correspondiente.",
        "Representa una sibilancia espiratoria aislada.",
        "Es un frote pleural anterior de origen pericárdico.",
        "Indica una estenosis bronquial localizada."
      ],
      correctAnswer: 1,
      justification: "El ruido laringotraqueal (soplo glótico) es un ruido respiratorio fisiológico soplante producido por el flujo de aire en la vía aérea superior. Es normal auscultarlo sobre la tráquea, el esternón y la zona interescapular superior.",
      pearl: "El soplo traqueal es normal en el centro del pecho; en la periferia indica neumonía.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 11,
      scenario: "Durante el examen físico cardíaco de un paciente de 76 años hipertenso de larga data, usted identifica el choque de punta o ápex cardíaco en el 6to espacio intercostal izquierdo, a 3 cm a la izquierda de la línea medioclavicular, con un carácter sostenido y enérgico.",
      question: "¿Cómo se interpreta este hallazgo de la palpación precordial?",
      options: [
        "Examen precordial completamente normal en el anciano.",
        "Desviación del ápex por hipertrofia y dilatación del ventrículo izquierdo.",
        "Dextrocardia congénita no diagnosticada.",
        "Estenosis mitral severa con dilatación de aurícula izquierda.",
        "Enfisema pulmonar que desplaza el corazón hacia abajo."
      ],
      correctAnswer: 1,
      justification: "El choque de punta normal se localiza en el 5to espacio intercostal izquierdo en la línea medioclavicular. Su desplazamiento hacia abajo (6to espacio) y a la izquierda (fuera de la LMC) sostenido indica cardiomegalia por hipertrofia y dilatación del ventrículo izquierdo, común en HTA crónica.",
      pearl: "Ápex desplazado y sostenido = Ventrículo Izquierdo crecido y sobrecargado.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 12,
      scenario: "Al realizar la palpación del área precordial de un paciente de 45 años con antecedentes de fiebre reumática, usted percibe una sensación vibratoria táctil, similar al ronroneo de un gato, localizada sobre el ápex cardíaco durante la diástole.",
      question: "¿Cómo se denomina este hallazgo y qué indica?",
      options: [
        "Signo de Kussmaul; pericarditis constrictiva.",
        "Frémito (o thrill) diastólico en foco mitral; sugiere estenosis mitral.",
        "Choque en cúpula de Bard; insuficiencia aórtica severa.",
        "Latido sagital; insuficiencia tricúspide.",
        "Frote pericárdico palpable; pericarditis seca."
      ],
      correctAnswer: 1,
      justification: "El frémito o thrill es la expresión palpable de un soplo cardíaco intenso (generalmente grado IV/VI o superior). La presencia de un frémito diastólico en el ápex (foco mitral) es patognomónico de estenosis mitral reumática.",
      pearl: "Frémito = Soplo que se toca. Indica turbulencia severa de la sangre.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 13,
      scenario: "Paciente varón de 14 años deportista acude para evaluación de rutina. A la auscultación cardíaca en el foco pulmonar se percibe un desdoblamiento del segundo ruido (R2) durante la inspiración profunda que desaparece por completo durante la espiración tranquila. El paciente está asintomático.",
      question: "¿Cuál es la conducta y el significado de este hallazgo?",
      options: [
        "Indica comunicación interauricular y requiere ecocardiograma urgente.",
        "Es un desdoblamiento fisiológico del segundo ruido y representa una variante normal en jóvenes.",
        "Es un R2 desdoblado paradójico por estenosis aórtica.",
        "Es un frote pericárdico intermitente.",
        "Se trata de un R3 patológico que simula desdoblamiento."
      ],
      correctAnswer: 1,
      justification: "El desdoblamiento fisiológico del segundo ruido (R2) es normal en niños y adultos jóvenes. Se debe al aumento del retorno venoso durante la inspiración, lo que retrasa el cierre de la válvula pulmonar (P2) respecto a la aórtica (A2). Si el desdoblamiento fuera fijo (en inspiración y espiración), sugeriría comunicación interauricular (CIA).",
      pearl: "Desdoblamiento de R2 que varía con la respiración = Fisiológico y benigno.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 14,
      scenario: "Paciente varón de 65 años con insuficiencia cardíaca por miocardiopatía dilatada acude por aumento de disnea. A la auscultación en el ápex, se detecta un ritmo de tres tiempos debido a la presencia de un ruido diastólico temprano, de tono grave, que ocurre durante la fase de llenado ventricular rápido pasivo.",
      question: "¿Cómo se clasifica este ruido y cuál es su correlación fisiopatológica?",
      options: [
        "Cuarto ruido (R4) patológico; rigidez del ventrículo izquierdo.",
        "Tercer ruido (R3) patológico (galope ventricular); disfunción sistólica severa del ventrículo izquierdo.",
        "Chasquido de apertura mitral; estenosis mitral reumática.",
        "Clic de eyección telesistólico; prolapso de la válvula mitral.",
        "R2 desdoblado fijo; bloqueo de rama derecha."
      ],
      correctAnswer: 1,
      justification: "El tercer ruido patológico (R3 o galope ventricular) en un adulto mayor indica sobrecarga de volumen diastólico e insuficiencia cardíaca sistólica. Se produce por la vibración de las paredes ventriculares laxas y dilatadas durante el llenado rápido pasivo.",
      pearl: "R3 es el galope del ventrículo dilatado y fallido (insuficiencia cardíaca sistólica).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 15,
      scenario: "Paciente de 58 años acude por dolor torácico de esfuerzo. Al examen físico cardíaco se ausculta un soplo sistólico en el segundo espacio intercostal derecho, rudo, que inicia después del R1, alcanza su máxima intensidad a la mitad de la sístole y termina antes del R2. Al palpar el cuello, se nota irradiación bilateral del soplo a carótidas.",
      question: "¿Cuál es la valvulopatía y las características del soplo?",
      options: [
        "Insuficiencia mitral; soplo holosistólico en barra.",
        "Estenosis aórtica; soplo mesosistólico eyectivo en diamante.",
        "Estenosis mitral; soplo diastólico con arrastre.",
        "Insuficiencia aórtica; soplo holodiastólico aspirativo.",
        "Prolapso mitral; clic mesosistólico con soplo telesistólico."
      ],
      correctAnswer: 1,
      justification: "La estenosis valvular aórtica produce un soplo mesosistólico eyectivo, de forma romboidal (crescendo-decrescendo o en diamante) que se ausculta mejor en el foco aórtico e irradia característicamente a las carótidas en el cuello.",
      pearl: "Estenosis Aórtica = Soplo sistólico eyectivo romboidal que viaja al cuello.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 16,
      scenario: "Varón de 48 años con disnea de esfuerzo progresiva. Al examen: soplo sistólico en el ápex cardíaco de carácter holosistólico (ocupa toda la sístole desde el R1 al R2), de tono alto y soplante ('en chorro de vapor'), que se irradia hacia la axila izquierda.",
      question: "¿Cuál es el diagnóstico valvular más probable?",
      options: [
        "Estenosis valvular mitral.",
        "Estenosis valvular aórtica.",
        "Insuficiencia valvular mitral.",
        "Insuficiencia valvular aórtica.",
        "Comunicación interventricular."
      ],
      correctAnswer: 2,
      justification: "La insuficiencia mitral genera un soplo holosistólico en barra (pancardíaco, de intensidad constante) que refluye sangre del ventrículo a la aurícula izquierda. Su irradiación clásica es a la axila izquierda.",
      pearl: "Insuficiencia Mitral = Soplo sistólico constante en el ápex que se va a la axila.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 17,
      scenario: "Durante el examen físico de una mujer de 32 años con antecedentes de disnea de esfuerzo y palpitaciones, usted ausculta en el foco mitral un primer ruido (R1) muy brillante y fuerte, seguido en la diástole por un ruido seco de tono alto posterior al R2, y finalmente un retumbo o arrastre de tono grave con reforzamiento presistólico.",
      question: "¿Qué conjunto de signos auscultatorios presenta la paciente y qué patología indica?",
      options: [
        "Tríada de la estenosis aórtica severa.",
        "R1 brillante, chasquido de apertura y retumbo diastólico; estenosis mitral.",
        "R3, R4 y soplo en barra; insuficiencia cardíaca congestiva.",
        "Clic diastólico y soplo aspirativo; insuficiencia aórtica reumática.",
        "Desdoblamiento amplio de R2 y soplo pulmonar; CIA."
      ],
      correctAnswer: 1,
      justification: "La estenosis mitral reumática se caracteriza por la tríada auscultatoria clásica de R1 brillante (por cierre brusco de las valvas mitrales engrosadas pero móviles), chasquido de apertura diastólica (apertura de la válvula estenosada) y el retumbo o arrastre diastólico (flujo a través de la estenosis).",
      pearl: "Estenosis Mitral = R1 brillante + Chasquido de apertura + Retumbo diastólico.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 18,
      scenario: "Varón de 60 años acude por disnea y palpitaciones. Al examen físico general: presión arterial diferencial muy amplia (150/50 mmHg). Examen precordial: soplo diastólico de carácter aspirativo, de tono alto, que se ausculta mejor en el foco aórtico accesorio (foco de Erb) con el paciente inclinado hacia adelante en espiración forzada.",
      question: "¿Cuál es el diagnóstico valvular y qué maniobra se usó?",
      options: [
        "Estenosis aórtica; maniobra de Pachón.",
        "Insuficiencia aórtica; maniobra de Harvey.",
        "Estenosis mitral; maniobra de Valsalva.",
        "Insuficiencia mitral; maniobra de Azoulay.",
        "Coartación de aorta; maniobra de Rivero-Carvallo."
      ],
      correctAnswer: 1,
      justification: "La insuficiencia valvular aórtica genera un soplo diastólico aspirativo de alta frecuencia que se oye mejor en el foco de Erb. La maniobra de Harvey (inclinar al paciente hacia adelante) acerca la base del corazón a la pared torácica, magnificando este soplo. La presión de pulso amplia (sistólica alta, diastólica baja) es típica de esta valvulopatía.",
      pearl: "Insuficiencia Aórtica = Soplo diastólico aspirativo + Maniobra de Harvey positiva + Pulso amplio.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 19,
      scenario: "Al auscultar el tórax de un paciente de 25 años con sospecha de miocarditis aguda, usted percibe un ruido rudo y raspante, similar al frotar de dos trozos de lija, audible en el mesocardio de forma constante en sístole y diástole, que se hace más intenso cuando presiona firmemente el estetoscopio contra la pared y le pide al paciente que contenga la respiración.",
      question: "¿Cómo se clasifica este ruido y cuál es su origen?",
      options: [
        "Frote pleural pulmonar; pleuresía seca derecha.",
        "Frote pericárdico; inflamación del pericardio visceral y parietal.",
        "Soplo doble carotídeo; estenosis e insuficiencia aórtica concomitante.",
        "Estertor crepitante precordial; enfisema mediastínico.",
        "Tercer y cuarto ruido cardíaco en sucesión rápida."
      ],
      correctAnswer: 1,
      justification: "El frote pericárdico es un ruido áspero, de lija, producido por la fricción de las capas pericárdicas inflamadas. Se diferencia del frote pleural porque persiste cuando el paciente detiene su respiración (apnea).",
      pearl: "Frote pericárdico: no desaparece con la apnea (el corazón sigue latiendo).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 20,
      scenario: "Un médico evalúa a un paciente con sospecha de valvulopatía tricúspide. Al auscultar en el foco tricúspide, detecta un soplo sistólico. Le pide al paciente que realice una inspiración profunda sostenida y nota que la intensidad del soplo aumenta significativamente durante la inspiración.",
      question: "¿Cómo se denomina esta maniobra y qué fenómeno representa?",
      options: [
        "Maniobra de Valsalva; disminución del retorno venoso izquierdo.",
        "Signo de Rivero-Carvallo positivo; aumento de soplos del corazón derecho en la inspiración.",
        "Maniobra de Müller; colapso de venas pulmonares.",
        "Signo de Pemberton; obstrucción de la cava superior.",
        "Maniobra de Pachón; acercamiento mitral a la pared."
      ],
      correctAnswer: 1,
      justification: "La maniobra o signo de Rivero-Carvallo consiste en el aumento de la intensidad de los soplos originados en el corazón derecho (tricúspide y pulmonar) durante la inspiración, debido al aumento del retorno venoso al ventrículo derecho por la presión intratorácica negativa.",
      pearl: "Rivero-Carvallo = Inspiración magnifica soplos derechos (tricúspide/pulmonar).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 21,
      scenario: "Durante una práctica clínica, el estudiante mide la presión arterial de un paciente en reposo usando la técnica auscultatoria. Registra el primer sonido claro, sordo y repetitivo como presión sistólica de 136 mmHg, nota un periodo de silencio a los 110 mmHg, luego los ruidos reaparecen y finalmente desaparecen por completo a los 86 mmHg, lo cual registra como presión diastólica.",
      question: "¿Qué fenómeno auscultatorio se presentó y cuál es la clasificación de este paciente según las guías AHA/ACC?",
      options: [
        "Desdoblamiento auscultatorio; Presión Arterial Elevada.",
        "Brecha o agujero auscultatorio (Auscultatory Gap); Hipertensión Estadio 1.",
        "Fase IV de Korotkoff prolongada; Hipertensión Estadio 2.",
        "Taponamiento auscultatorio; Presión Arterial Normal.",
        "Brecha auscultatoria; Hipertensión Estadio 2."
      ],
      correctAnswer: 1,
      justification: "El silencio temporal entre ruidos de Fase I y II se denomina brecha auscultatoria. Con una PA de 136/86 mmHg, el paciente se clasifica en Hipertensión Estadio 1 según la AHA/ACC (sistólica entre 130-139 o diastólica entre 80-89 mmHg).",
      pearl: "Brecha auscultatoria = Silencio traicionero en HTA. Evítala tomando siempre la presión palpatoria primero.",
      competencies: ["CG8", "CG11"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 22,
      scenario: "Un varón de 42 años acude a consulta de medicina preventiva. Su presión arterial promedio en tres visitas diferentes en semanas consecutivas es de 126/78 mmHg. El paciente no tiene antecedentes mórbidos ni factores de riesgo cardiovascular identificados.",
      question: "¿Cuál es la clasificación diagnóstica de este paciente según las guías conjuntas de presión arterial ACC/AHA?",
      options: [
        "Presión Arterial Normal.",
        "Presión Arterial Elevada.",
        "Hipertensión Estadio 1.",
        "Hipertensión Estadio 2.",
        "Crisis Hipertensiva."
      ],
      correctAnswer: 1,
      justification: "Según la guía AHA/ACC, la presión elevada se define como una presión sistólica entre 120 y 129 mmHg con una presión diastólica menor de 80 mmHg. Las cifras de este paciente (126/78) entran exactamente en este rango.",
      pearl: "PA Elevada = Sistólica 120-129 Y Diastólica < 80 mmHg. No es hipertensión, pero indica necesidad de cambios en el estilo de vida.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 23,
      scenario: "Usted evalúa a un paciente con sospecha de hipertensión arterial. Al aplicar el manguito del esfigmomanómetro en el brazo del paciente, usted infla el manguito directamente hasta 200 mmHg sin realizar el método palpatorio previo. Al desinflar, percibe ruidos de Korotkoff desde los 142 mmHg.",
      question: "¿Qué error metodológico cometió y qué riesgo clínico plantea en pacientes con brecha auscultatoria?",
      options: [
        "Ninguno, inflar a 200 mmHg es la técnica estandarizada universal.",
        "No haber determinado la sistólica palpatoria previa, lo que arriesga subestimar severamente la presión sistólica real en caso de existir brecha auscultatoria.",
        "Haber inflado el manguito muy lento, provocando congestión venosa.",
        "Haber colocado el estetoscopio debajo del manguito.",
        "Haber realizado la toma en el brazo izquierdo en vez de derecho."
      ],
      correctAnswer: 1,
      justification: "El método palpatorio previo determina la presión de obliteración del pulso radial. Esto nos dice hasta dónde inflar el manguito (20-30 mmHg por encima). Si se omite, y el paciente tiene una brecha auscultatoria, el examinador puede empezar a escuchar ruidos en un rango inferior al real, subestimando la verdadera presión sistólica.",
      pearl: "Palpa antes de escuchar. Determinar la sistólica palpable es el escudo contra el error de la brecha auscultatoria.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 24,
      scenario: "Paciente diabético de 55 años presenta en la consulta docente una presión arterial promedio de 142/92 mmHg, confirmada en dos tomas separadas por 5 minutos tras reposo adecuado.",
      question: "¿Cuál es la clasificación de hipertensión de este paciente según las guías AHA/ACC?",
      options: [
        "Presión Arterial Elevada.",
        "Hipertensión Estadio 1.",
        "Hipertensión Estadio 2.",
        "Emergencia Hipertensiva.",
        "Hipertensión Sistólica Aislada."
      ],
      correctAnswer: 2,
      justification: "La hipertensión Estadio 2 se define como una presión sistólica de 140 mmHg o superior, O una presión diastólica de 90 mmHg o superior. Al tener 142/92, califica como Estadio 2 por ambos parámetros.",
      pearl: "HTA Estadio 2 = Sistólica >= 140 O Diastólica >= 90 mmHg.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 25,
      scenario: "Un paciente obeso de 40 años acude a control. El estudiante de medicina utiliza un manguito de tamaño estándar para adultos en el brazo del paciente, el cual es muy grueso (circunferencia de 44 cm). El estudiante reporta una presión arterial de 154/96 mmHg.",
      question: "¿Qué sesgo en la medición introduce el uso de un manguito de tamaño inadecuadamente pequeño en un brazo grueso?",
      options: [
        "Subestima la presión real (da cifras falsamente bajas).",
        "Sobreevalúa la presión real (da cifras falsamente altas por requerir mayor presión para ocluir la arteria).",
        "No altera la medición de presión sistólica, solo la diastólica.",
        "Produce ruidos de Korotkoff apagados inaudibles.",
        "Provoca una brecha auscultatoria artificial."
      ],
      correctAnswer: 1,
      justification: "Usar un manguito demasiado estrecho o corto para el diámetro del brazo requiere inflar a presiones más altas para lograr colapsar la arteria braquial profunda. Esto genera una lectura falsamente elevada de la presión arterial (sobreestimación).",
      pearl: "Brazo gordo + Manguito chico = Hipertensión falsa (PA sobreestimada). Asegura siempre el tamaño correcto del brazalete.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 26,
      scenario: "Durante la auscultación de la arteria braquial para la medición de la presión arterial, el examinador infla el manguito y al desinflar escucha un murmullo soplante o rítmico que dura hasta que el sonido cambia bruscamente a un tono sordo y algodonoso (Fase IV), para luego desaparecer por completo 4 mmHg después (Fase V).",
      question: "¿Qué fase de Korotkoff corresponde al cambio de tono sordo (Fase IV) y cuál se registra como presión diastólica de elección en adultos?",
      options: [
        "Fase III; se registra la Fase III.",
        "Fase IV; se registra la Fase V (desaparición de ruidos).",
        "Fase II; se registra la Fase IV.",
        "Fase I; se registra la Fase V.",
        "Fase IV; se registra la Fase IV en todos los casos."
      ],
      correctAnswer: 1,
      justification: "La Fase IV de Korotkoff es el amortiguamiento o cambio de tono a sordo/algodonoso. La Fase V es la desaparición de los ruidos. En adultos, la Fase V se registra como la presión diastólica. En niños y embarazadas, donde la Fase V puede llegar a cero, se prefiere registrar la Fase IV.",
      pearl: "Sistólica = Inicio de Fase I. Diastólica = Inicio de Fase V (silencio absoluto).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 27,
      scenario: "Un paciente hipertenso acude a su consulta. Al medir la presión arterial, usted infla el manguito a una velocidad excesivamente lenta y desinfla también de manera extremadamente lenta, demorando más de 2 minutos en todo el proceso. El paciente refiere dolor e incomodidad y usted nota congestión venosa distal.",
      question: "¿Cómo afecta esta técnica incorrecta a las cifras de presión arterial y la experiencia del paciente?",
      options: [
        "Mejora la precisión de la presión diastólica.",
        "Provoca una falsa lectura de presión sistólica baja y eleva falsamente la diastólica debido a la congestión y vasoconstricción venosa refleja por isquemia prolongada.",
        "Omitirá por completo la brecha auscultatoria.",
        "No afecta las cifras de presión, solo la comodidad del paciente.",
        "Reduce artificialmente la presión diastólica a cero."
      ],
      correctAnswer: 1,
      justification: "El inflado y desinflado extremadamente lentos provocan una estasis venosa prolongada en la extremidad, lo que causa dolor y vasoconstricción venosa refleja. Esto puede distorsionar las cifras, elevando falsamente la diastólica y afectando la reproducibilidad.",
      pearl: "Desinfla el manguito a un ritmo de 2 a 3 mmHg por segundo. La velocidad correcta previene la isquemia y el error en la lectura.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 28,
      scenario: "Paciente varón de 75 años acude por mareos al ponerse de pie de forma rápida. Usted mide la presión arterial con el paciente acostado boca arriba, obteniendo 142/86 mmHg. Luego, le pide que se ponga de pie y vuelve a medir a los 2 minutos, registrando 118/74 mmHg, acompañado de mareos leves.",
      question: "¿Qué síndrome semiológico presenta el paciente y cuál es el criterio diagnóstico?",
      options: [
        "Hipertensión resistente descompensada.",
        "Hipotensión ortostática; caída de la presión sistólica >= 20 mmHg o diastólica >= 10 mmHg dentro de los 3 minutos de bipedestación.",
        "Síncope vasovagal; caída de frecuencia cardíaca por debajo de 50 lpm.",
        "Hipertensión de bata blanca.",
        "Hipotensión ortostática; caída de presión sistólica > 5 mmHg."
      ],
      correctAnswer: 1,
      justification: "La hipotensión ortostática se diagnostica por la disminución de al menos 20 mmHg en la presión sistólica o de al menos 10 mmHg en la presión diastólica en los primeros 3 minutos tras ponerse de pie. La caída en este caso fue de 24 mmHg en la sistólica (142 a 118) e indica disfunción autonómica o hipovolemia.",
      pearl: "Hipotensión Ortostática = Caída sistólica >= 20 mmHg o diastólica >= 10 mmHg al pararse. Causa clásica de caídas en ancianos.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 4 (Signos Vitales) / Argente-Álvarez 3.ª Ed. Cap. 22"
    },
    {
      id: 29,
      scenario: "Varón de 68 años con diagnóstico de estenosis valvular aórtica severa acude por disnea. Al palpar el pulso carotídeo y radial, usted percibe una onda de pulso que tarda notablemente en ascender a su pico máximo y cuya fuerza o amplitud es sumamente pequeña, sintiéndose 'débil y retrasado'.",
      question: "¿Cómo se denomina este tipo de pulso patológico?",
      options: [
        "Pulso celer o en martillo de agua.",
        "Pulso tardus et parvus.",
        "Pulso alternante.",
        "Pulso dicroto.",
        "Pulso bisferiens."
      ],
      correctAnswer: 1,
      justification: "El pulso 'tardus et parvus' es característico de la estenosis aórtica. Se explica por la obstrucción al flujo de salida del ventrículo izquierdo, lo que hace que el llenado arterial sea lento (tardus) y con menor volumen/amplitud (parvus).",
      pearl: "Pulso Tardus et Parvus = Flujo lento y pequeño por salida estrecha (Estenosis Aórtica).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 30,
      scenario: "Al explorar el pulso radial de una paciente de 35 años con insuficiencia aórtica severa, usted percibe un latido que asciende de forma sumamente rápida, con una amplitud exagerada que golpea sus dedos de manera brusca, para luego colapsar o desaparecer instantáneamente.",
      question: "¿Cómo se clasifica este pulso y qué otro nombre recibe?",
      options: [
        "Pulso filiforme o de choque.",
        "Pulso celer, en martillo de agua o de Corrigan.",
        "Pulso paradójico de Kussmaul.",
        "Pulso alternante de Traube.",
        "Pulso bisferiens."
      ],
      correctAnswer: 1,
      justification: "El pulso celer, también llamado en martillo de agua o de Corrigan, es típico de la insuficiencia aórtica. Se debe a que el gran volumen de sangre eyectado con fuerza se vacía rápidamente en diástole hacia atrás (al ventrículo) y hacia adelante (periferia), causando un colapso rápido.",
      pearl: "Pulso Celer = Salto y colapso de agua. La marca de la Insuficiencia Aórtica.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 31,
      scenario: "Un paciente de 72 años con antecedentes de infarto de miocardio extenso ingresa por disnea en reposo. Al palpar de forma sostenida el pulso radial, usted detecta una secuencia regular de latidos donde se alternan de forma sucesiva un pulso fuerte y uno débil, sin variaciones en el ritmo.",
      question: "¿Cómo se denomina este pulso y de qué es signo?",
      options: [
        "Pulso dícroto; fiebre tifoidea.",
        "Pulso alternante; insuficiencia ventricular izquierda grave.",
        "Pulso bigeminado; intoxicación digitálica.",
        "Pulso paradójico; taponamiento cardíaco.",
        "Pulso celer; insuficiencia aórtica."
      ],
      correctAnswer: 1,
      justification: "El pulso alternante consiste en la alternancia regular de ondas de gran amplitud y pequeña amplitud. Es un signo de disfunción miocárdica severa y falla ventricular izquierda (insuficiencia cardíaca). Refleja la variación en la fuerza de contracción ventricular latido a latido.",
      pearl: "Pulso alternante = Corazón cansado que alterna latidos fuertes y débiles. Mal pronóstico.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 32,
      scenario: "Durante la evaluación de un paciente con disnea sibilante y taquicardia, el examinador infla el manguito de PA. Al desinflar lentamente, el examinador nota que el primer ruido de Korotkoff desaparece durante la inspiración profunda y reaparece durante la espiración. Al medir la diferencia, nota que los sonidos sistólicos desaparecen en inspiración a una cifra 15 mmHg menor que en espiración.",
      question: "¿Cómo se llama este hallazgo y qué emergencia sugiere?",
      options: [
        "Brecha auscultatoria; crisis hipertensiva.",
        "Pulso paradójico; taponamiento cardíaco o asma severa.",
        "Pulso dicroto; shock séptico.",
        "Signo de Kussmaul; bocio intratorácico.",
        "Hipotensión ortostática; deshidratación grave."
      ],
      correctAnswer: 1,
      justification: "El pulso paradójico es la exageración de la caída fisiológica de la presión sistólica durante la inspiración (>10 mmHg). Es típico del taponamiento cardíaco, donde la interdependencia ventricular impide el llenado adecuado del VI durante la inspiración.",
      pearl: "Pulso paradójico = Caída sistólica inspiratoria > 10 mmHg. Alerta de taponamiento cardíaco.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 33,
      scenario: "Paciente de 25 años ingresa al área de trauma tras un accidente en motocicleta. Se encuentra pálido, frío, sudoroso, con pulso radial de frecuencia 120/min, sumamente débil, rápido y difícil de palpar, describiéndose como un 'hilo delgado'.",
      question: "¿Cómo se clasifica este pulso y qué condición sugiere?",
      options: [
        "Pulso celer; insuficiencia cardíaca congestiva.",
        "Pulso filiforme; estado de shock o hipovolemia grave.",
        "Pulso alternante; miocarditis aguda.",
        "Pulso tardus; estenosis aórtica.",
        "Pulso bigeminado; arritmia extrasistólica."
      ],
      correctAnswer: 1,
      justification: "El pulso filiforme (rápido, de amplitud muy pequeña y débil) refleja un volumen sistólico bajo y una vasoconstricción periférica compensatoria, característico de estados de shock circulatorio (hipovolémico, cardiogénico, etc.).",
      pearl: "Pulso Filiforme = Hilo rápido y débil. El pulso del Shock.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 34,
      scenario: "Durante la exploración física de un paciente de 52 años en decúbito supino a 45 grados, usted nota que las venas yugulares externas e internas se encuentran dilatadas hasta el ángulo de la mandíbula. Al realizar la inspiración profunda, la ingurgitación yugular aumenta notablemente en lugar de colapsar.",
      question: "¿Cómo se llama este signo y en qué patologías se observa clásicamente?",
      options: [
        "Reflujo hepatojugular; insuficiencia cardíaca izquierda.",
        "Signo de Kussmaul; pericarditis constrictiva o taponamiento.",
        "Signo de Pemberton; bocio intratorácico.",
        "Signo de Rivero-Carvallo; insuficiencia tricúspide.",
        "Signo de Musset; insuficiencia aórtica."
      ],
      correctAnswer: 1,
      justification: "El signo de Kussmaul es el aumento patológico de la ingurgitación venosa yugular durante la inspiración. Ocurre por la restricción al llenado del ventrículo derecho, que impide que acepte el aumento de retorno venoso inspiratorio, típico en pericarditis constrictiva.",
      pearl: "Signo de Kussmaul = Venas del cuello que se inflan al inspirar (pericardio rígido).",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 35,
      scenario: "Paciente varón de 48 años con disnea y sospecha de insuficiencia cardíaca. Al evaluarlo semiológicamente a 45 grados de inclinación, usted presiona firmemente con su mano el cuadrante superior derecho del abdomen por 15 segundos. Se observa un aumento de la ingurgitación yugular de 4 cm que se mantiene elevado durante toda la maniobra.",
      question: "¿Cuál es la interpretación de este signo?",
      options: [
        "Reflujo hepatojugular negativo, lo que descarta falla cardíaca.",
        "Reflujo hepatojugular positivo, indicativo de congestión venosa y falla del ventrículo derecho.",
        "Signo de Pemberton positivo por bocio intratorácico.",
        "Pulso venoso yugular normal por maniobra refleja.",
        "Signo de Rivero-Carvallo por insuficiencia mitral."
      ],
      correctAnswer: 1,
      justification: "El reflujo hepatojugular es positivo cuando la presión sobre el hígado aumenta el nivel de ingurgitación yugular >3 cm de forma sostenida (>10 segundos). Confirma la incapacidad del ventrículo derecho para manejar un aumento transitorio del retorno venoso, indicando falla ventricular derecha.",
      pearl: "Reflujo hepatojugular = Sobrecarga de volumen en el Ventrículo Derecho.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 36,
      scenario: "Durante la auscultación pulmonar de un paciente de 48 años con dolor pleurítico, usted ausculta un ruido discontinuo y áspero, similar al crujido de pisar nieve fresca, localizado en la base axilar izquierda. El ruido se percibe tanto en la inspiración como en la espiración. Al pedirle al paciente que contenga la respiración en apnea, el ruido desaparece por completo.",
      question: "¿Cuál es la naturaleza y clasificación de este ruido adventicio?",
      options: [
        "Frote pericárdico por miocarditis.",
        "Frote pleural por pleuresía seca.",
        "Estertor crepitante por condensación alveolar.",
        "Roncus localizado por tapón mucoso.",
        "Estridor transmitido de vía aérea superior."
      ],
      correctAnswer: 1,
      justification: "El frote pleural se origina en el roce de las hojas pleurales inflamadas durante la respiración. Desaparece durante la apnea voluntaria (ya que cesan los movimientos respiratorios), lo que permite diferenciarlo del frote pericárdico que persiste con los latidos cardíacos.",
      pearl: "Frote pleural desaparece en apnea; frote pericárdico sigue sonando.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 37,
      scenario: "Un paciente de 60 años consulta por fatiga. Al examen físico pulmonar: percusión con sonoridad pulmonar normal. Palpación con vibraciones vocales normales. Auscultación pulmonar con ruidos respiratorios continuos, musicales, de tono agudo (sibilancias) localizados únicamente en la base pulmonar derecha. No tiene antecedentes de asma.",
      question: "¿Qué sospecha plantea la localización fija y unilateral de sibilancias en este paciente?",
      options: [
        "Crisis asmática leve generalizada.",
        "Obstrucción bronquial localizada (ej. cuerpo extraño o tumor bronquial).",
        "Derrame pleural derecho tabicado.",
        "Enfisema pulmonar bilateral.",
        "Neumonía lobar bacteriana típica."
      ],
      correctAnswer: 1,
      justification: "Las sibilancias generalizadas sugieren broncoespasmo difuso (asma, EPOC). Sin embargo, una sibilancia fija, persistente y unilateral (localizada en un solo punto) sugiere fuertemente una obstrucción mecánica fija del bronquio en esa zona, como un tumor bronquial o un cuerpo extraño aspirado.",
      pearl: "Silbido en un solo lado y fijo = Alarma de obstrucción mecánica (tumor o cuerpo extraño).",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 38,
      scenario: "Paciente varón de 62 años acude por dolor retroesternal opresivo de 15 minutos de duración irradiado a hombro izquierdo. Al examen físico: sudoroso, pálido. Al auscultar el ápex, se percibe un soplo sistólico eyectivo leve. En la percusión del tórax posterior se obtiene sonoridad pulmonar conservada y el murmullo vesicular es normal.",
      question: "¿Cuál síntoma o signo de este paciente es prioritario para el diagnóstico diferencial del dolor coronario?",
      options: [
        "El soplo sistólico precordial.",
        "El dolor retroesternal de carácter opresivo y su duración menor a 20 minutos.",
        "La sonoridad pulmonar conservada.",
        "La palidez mucocutánea.",
        "La frecuencia respiratoria."
      ],
      correctAnswer: 1,
      justification: "El dolor opresivo retroesternal con irradiación típica a miembro superior izquierdo y duración menor a 20 minutos orienta fuertemente a angina de pecho (isquemia miocárdica reversible). Si superara los 20 minutos, sugeriría infarto agudo de miocardio.",
      pearl: "Dolor anginoso típico = Opresión retroesternal que dura minutos y alivia con reposo. Más de 20 min = Sospecha de Infarto.",
      competencies: ["CG6"],
      reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
    },
    {
      id: 39,
      scenario: "Durante la auscultación cardíaca en un lactante hiperactivo de 6 meses, usted percibe un soplo sistólico continuo en la región subclavicular izquierda que ocupa toda la sístole y diástole, con un tono rudo similar al de una maquinaria (soplo de Gibson).",
      question: "¿Cuál es la anomalía congénita característica de este soplo?",
      options: [
        "Comunicación interventricular.",
        "Persistencia del conducto arterioso (PCA).",
        "Estenosis pulmonar congénita.",
        "Tetralogía de Fallot.",
        "Coartación de aorta."
      ],
      correctAnswer: 1,
      justification: "El soplo continuo en maquinaria (soplo de Gibson) auscultado en la región subclavicular izquierda es característico de la persistencia del conducto arterioso, debido al cortocircuito continuo de izquierda a derecha desde la aorta a la arteria pulmonar durante todo el ciclo cardíaco.",
      pearl: "Soplo continuo en maquinaria = Conducto Arterioso Persistente.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 40,
      scenario: "Paciente de 40 años presenta dolor torácico severo que alivia al sentarse e inclinarse hacia adelante. A la auscultación se percibe un ruido raspante precordial. A la percusión, la sonoridad pulmonar es normal bilateral y las bases desplazan adecuadamente.",
      question: "¿Cuál es el diagnóstico más probable y qué maniobra diagnóstica confirma la causa del alivio del dolor?",
      options: [
        "Neumonía lobar; percusión pulmonar.",
        "Pericarditis aguda; cambio de posición corporal (posición genupectoral o inclinación anterior).",
        "Derrame pleural; maniobra de amplexación.",
        "Neumotórax a tensión; punción descompresiva.",
        "Estenosis mitral; maniobra de Pachón."
      ],
      correctAnswer: 1,
      justification: "El dolor de la pericarditis aguda alivia característicamente con la inclinación del torso hacia adelante (posición genupectoral) porque reduce la fricción del pericardio inflamado con la pleura y el esternón. El ruido raspante es el frote pericárdico.",
      pearl: "Dolor que calma al inclinarse hacia adelante = Pericarditis aguda (Signo de la plegaria mahometana).",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 41,
      scenario: "Un médico realiza la percusión del tórax de un paciente con sospecha de enfisema pulmonar. Percute los espacios intercostales bilateralmente de arriba hacia abajo y nota que el tono claro pulmonar normal está reemplazado por un sonido de mayor volumen, tono más bajo y resonancia exagerada (hipersonoridad) generalizada.",
      question: "¿Qué alteración física del parénquima pulmonar produce este sonido?",
      options: [
        "Presencia de líquido libre en la pleura.",
        "Consolidación alveolar por exudado.",
        "Atrapamiento de aire crónico con hiperinsuflación alveolar.",
        "Colapso pulmonar pasivo por aire a presión.",
        "Obstrucción completa del bronquio principal."
      ],
      correctAnswer: 2,
      justification: "La hipersonoridad se debe a un aumento patológico del volumen de aire dentro de los alvéolos elásticos (hiperinsuflación), típico del enfisema pulmonar. Se diferencia del timpanismo porque este último ocurre por aire libre en una cavidad no elástica (neumotórax).",
      pearl: "Hipersonoridad = Alvéolos sobreinflados (EPOC/Enfisema); Timpanismo = Aire en cavidad libre (Neumotórax).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    },
    {
      id: 42,
      scenario: "Durante la auscultación pulmonar en un paciente con fiebre alta, usted percibe que el murmullo vesicular en el lóbulo inferior derecho está disminuido, y en su lugar se escucha un soplo rudo, de tono alto y carácter soplante durante toda la inspiración y parte de la espiración, similar al sonido de soplar a través de un tubo.",
      question: "¿Cómo se clasifica este soplo y qué indica?",
      options: [
        "Soplo pleurítico; derrame pleural izquierdo.",
        "Soplo tubárico; condensación del parénquima pulmonar con bronquio permeable.",
        "Soplo anfórico; neumotórax a tensión.",
        "Soplo vesicular; pulmón normal y sano.",
        "Estridor laríngeo transmitido; obstrucción traqueal."
      ],
      correctAnswer: 1,
      justification: "El soplo tubárico es la transmisión del ruido laringotraqueal a través de un tejido pulmonar consolidado (condensado), que actúa como un buen conductor acústico, siempre que la vía aérea (bronquio) esté permeable.",
      pearl: "Soplo tubárico = Sonido de tubo que sopla. Confirma neumonía o condensación pulmonar.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 43,
      scenario: "Varón de 22 años acude por dolor precordial agudo tras un cuadro viral. Al auscultar, se detecta un ruido raspante y rítmico en el borde esternal izquierdo. El médico sospecha pericarditis. Le pide al paciente que contenga la respiración durante la inspiración profunda (apnea) y nota que el ruido persiste rítmicamente.",
      question: "¿Cuál es el significado de la persistencia del ruido durante la apnea?",
      options: [
        "Confirma que el ruido es un frote pleural.",
        "Confirma que el ruido es un frote pericárdico, ya que depende del latido cardíaco y no del ciclo respiratorio.",
        "Indica que el paciente no realizó la apnea correctamente.",
        "Es indicativo de un soplo de estenosis aórtica.",
        "Sugiere la presencia de estertores crepitantes asociados."
      ],
      correctAnswer: 1,
      justification: "El frote pericárdico se produce por la fricción del pericardio con cada latido del corazón. Por lo tanto, persiste durante la apnea. Si fuera un frote pleural, desaparecería de inmediato al detener los movimientos respiratorios.",
      pearl: "Frote pericárdico = Rítmico con el latido, sigue sonando en apnea.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 44,
      scenario: "Paciente hipertenso de 68 años acude por chequeo. Al palpar el pulso radial, usted detecta un latido regular pero de amplitud débil. Al presionar con el esfigmomanómetro para medir la presión arterial, usted nota que las cifras varían cíclicamente latido a latido entre 130 y 110 mmHg, manteniendo un ritmo estrictamente regular.",
      question: "¿Qué alteración de la onda de pulso presenta el paciente y de qué es indicador clásico?",
      options: [
        "Pulso paradójico; taponamiento cardíaco.",
        "Pulso alternante; insuficiencia ventricular izquierda severa.",
        "Pulso dicroto; shock séptico.",
        "Pulso filiforme; hemorragia oculta.",
        "Pulso bisferiens; doble lesión aórtica."
      ],
      correctAnswer: 1,
      justification: "El pulso alternante se caracteriza por la alternancia de ondas de pulso de mayor y menor amplitud con un ritmo regular. Es un signo clásico de insuficiencia cardíaca izquierda severa con disfunción sistólica del ventrículo izquierdo.",
      pearl: "Pulso alternante = Alterna fuerte y débil con ritmo regular. Alerta de ventrículo izquierdo cansado.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 45,
      scenario: "Durante la auscultación cardíaca en un paciente hipertenso de 58 años, usted percibe un desdoblamiento del segundo ruido (R2). Sin embargo, a diferencia de lo normal, el desdoblamiento es claramente audible durante la espiración y desaparece por completo durante la inspiración profunda.",
      question: "¿Cómo se clasifica este desdoblamiento de R2 y qué patología suele indicarlo?",
      options: [
        "Desdoblamiento fisiológico; variante benigna normal.",
        "Desdoblamiento paradójico o invertido de R2; estenosis aórtica severa o bloqueo de rama izquierda (BRI).",
        "Desdoblamiento fijo de R2; comunicación interauricular (CIA).",
        "Ritmo de galope diastólico.",
        "Falso desdoblamiento por R3."
      ],
      correctAnswer: 1,
      justification: "El desdoblamiento paradójico o invertido de R2 se caracteriza por ocurrir en espiración y desaparecer en inspiración. Ocurre por un retraso marcado en el cierre de la válvula aórtica (A2), retrasándolo por detrás del cierre pulmonar (P2). Sus causas principales son el bloqueo de rama izquierda y la estenosis aórtica severa.",
      pearl: "Desdoblamiento paradójico = Suena en espiración y calla en inspiración. Indica retraso del ventrículo izquierdo (BRI o Estenosis Aórtica).",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 46,
      scenario: "Durante la evaluación de la Presión Venosa Yugular (PVY) en un paciente de 67 años con insuficiencia cardíaca congestiva, usted observa que las oscilaciones yugulares en el cuello muestran una onda 'a' gigante muy prominente y un colapso 'x' profundo.",
      question: "¿Qué fenómeno hemodinámico produce la onda 'a' gigante en el pulso venoso?",
      options: [
        "El llenado rápido pasivo del ventrículo derecho.",
        "La contracción auricular derecha enérgica contra una válvula tricúspide estrecha o un ventrículo derecho rígido (hipertrofiado).",
        "El reflujo de sangre al vaciarse la aurícula derecha.",
        "El cierre de la válvula tricúspide.",
        "El flujo retrógrado de sangre durante la sístole ventricular."
      ],
      correctAnswer: 1,
      justification: "La onda 'a' del pulso venoso corresponde a la sístole auricular. Una onda 'a' gigante refleja una contracción auricular derecha muy vigorosa contra una resistencia aumentada, como ocurre en la estenosis tricúspide, hipertensión pulmonar o estenosis pulmonar (ventrículo derecho rígido).",
      pearl: "Onda 'a' gigante = Contracción auricular derecha de lucha contra obstrucción o rigidez.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 47,
      scenario: "Varón de 52 años hipertenso acude a control. El estudiante de medicina mide la PA y reporta 148/94 mmHg. Al interrogar sobre la técnica, el estudiante menciona: 'El paciente acababa de llegar corriendo de la parada de autobús, lo senté de inmediato, le coloqué el brazo colgando sin apoyo y crucé sus piernas para que estuviera cómodo durante la toma'.",
      question: "¿Qué factores metodológicos introdujeron un sesgo de sobreestimación (elevación falsa) en esta toma de PA?",
      options: [
        "Ninguno, cruzar las piernas y dejar el brazo colgando mejora el retorno venoso y la precisión.",
        "La falta de reposo (ejercicio previo), el brazo colgando por debajo del nivel del corazón y las piernas cruzadas durante la toma.",
        "Únicamente haber realizado la toma de forma muy rápida.",
        "Haber usado un esfigmomanómetro aneroide en vez de uno de mercurio.",
        "Haber realizado la toma en el brazo derecho en lugar del izquierdo."
      ],
      correctAnswer: 1,
      justification: "Varios factores elevan falsamente la presión arterial: 1. Falta de reposo (mínimo 5 min). 2. Brazo sin soporte por debajo del nivel del corazón (aumenta presión hidrostática). 3. Piernas cruzadas (aumenta retorno venoso y presión intratorácica). Todos estos factores sobreevalúan la verdadera presión basal del paciente.",
      pearl: "Técnica correcta de PA = 5 min de reposo, brazo apoyado a nivel del corazón, pies planos sobre el suelo sin cruzar piernas.",
      competencies: ["CG8", "CG11"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 48,
      scenario: "Un examinador evalúa el pulso de un paciente y describe una onda de pulso que tiene un pico sistólico doble ('bífido') perceptible por palpación digital táctil durante la sístole.",
      question: "¿Cómo se denomina este tipo de pulso patológico y en qué condiciones se observa?",
      options: [
        "Pulso alternante; insuficiencia cardíaca terminal.",
        "Pulso bisferiens; doble lesión valvular aórtica (estenosis e insuficiencia) o miocardiopatía hipertrófica obstructiva.",
        "Pulso dicroto; fiebre tifoidea y deshidratación.",
        "Pulso bigeminado; arritmia extrasistólica.",
        "Pulso celer; insuficiencia aórtica pura."
      ],
      correctAnswer: 1,
      justification: "El pulso bisferiens se caracteriza por dos picos sistólicos. Ocurre clásicamente en pacientes con doble lesión aórtica (estenosis e insuficiencia aórtica combinadas) o en la miocardiopatía hipertrófica obstructiva, debido a la eyección rápida seguida de una obstrucción dinámica media.",
      pearl: "Pulso Bisferiens = Doble pico en sístole. Firma de la doble lesión aórtica.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Sistema Cardiovascular) / Argente-Álvarez 3.ª Ed. Cap. 30"
    },
    {
      id: 49,
      scenario: "Paciente varón de 72 años con insuficiencia cardíaca derecha grave. Al examinar el cuello, usted observa una ingurgitación venosa yugular muy severa. Al presionar firmemente sobre el cuadrante superior derecho del abdomen por 15 segundos, la ingurgitación venosa cervical se eleva 4 cm y permanece elevada durante toda la maniobra, colapsando inmediatamente al soltar.",
      question: "¿Qué signo clínico confirma este hallazgo y qué indica fisiopatológicamente?",
      options: [
        "Signo de Kussmaul positivo; obstrucción de la vena cava superior.",
        "Reflujo hepatojugular positivo; incapacidad del ventrículo derecho para manejar una sobrecarga aguda de volumen de retorno venoso.",
        "Reflujo hepatojugular negativo; taponamiento pericárdico agudo.",
        "Signo de Pemberton positivo; bocio retroesternal.",
        "Signo de Rivero-Carvallo positivo; insuficiencia tricúspide."
      ],
      correctAnswer: 1,
      justification: "El reflujo hepatojugular positivo (aumento sostenido de la ingurgitación yugular >3 cm durante >10 segundos de compresión hepática) indica congestión pasiva y falla ventricular derecha. Refleja que el ventrículo derecho no puede acelerar su bombeo para manejar el retorno venoso incrementado por la presión hepática.",
      pearl: "El reflujo hepatojugular sostenido es la prueba física directa de que el Ventrículo Derecho está saturado y fallando.",
      competencies: ["CG8"],
      reference: "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
    },
    {
      id: 50,
      scenario: "Un paciente acude por disnea progresiva. Al examen físico pulmonar posterior derecho se percute matidez en la base. Las vibraciones vocales están ausentes y el murmullo vesicular está abolido. A la auscultación en el borde superior de la matidez se percibe egofonía y pectoriloquia áfona.",
      question: "¿Cuál es el diagnóstico sindrómico respiratorio de este paciente?",
      options: [
        "Síndrome de condensación pulmonar derecho.",
        "Síndrome de derrame pleural derecho.",
        "Síndrome de neumotórax derecho.",
        "Síndrome de atelectasia obstructiva derecha.",
        "Enfisema pulmonar compensatorio."
      ],
      correctAnswer: 1,
      justification: "La presencia de matidez hídrica, abolición de vibraciones vocales y abolición de murmullo vesicular son la tríada del derrame pleural. La auscultación de egofonía (voz temblorosa) y pectoriloquia áfona en el límite superior (por colapso y compresión del parénquima subyacente por el líquido) es característica del derrame pleural de moderada cuantía.",
      pearl: "Derrame pleural = Matidez + Silencio (VV y MV abolidos) + Egofonía en la frontera superior del líquido.",
      competencies: ["CG6", "CG8"],
      reference: "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
    }
  ],
  reference: "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
};

export const SEMIOLOGIA_TERCER_PARCIAL = {
  title: "Semiología Médica (Tercer Parcial)",
  code: "MED-228",
  syllabusObjective: "Integrar el examen físico de cuello, mamas y abdomen, dominando la secuencia clínica correcta y la interpretación de maniobras específicas.",
  flashcards: [
    {
        "id": 1,
        "question": "¿Cuáles son los límites superficiales que dividen el abdomen en 9 regiones?",
        "answer": "Dos líneas verticales (líneas medioclaviculares) y dos líneas horizontales (la línea subcostal, que pasa por el límite inferior del reborde costal, y la línea intertubercular, que conecta las espinas ilíacas anterosuperiores).",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 2,
        "question": "¿Qué órganos principales se localizan en el Hipocondrio Derecho?",
        "answer": "El lóbulo derecho del hígado, la vesícula biliar, el polo superior del riñón derecho, la glándula suprarrenal derecha y la flexura hepática del colon.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 3,
        "question": "¿Qué órganos principales se proyectan en el Epigastrio?",
        "answer": "El estómago, el lóbulo izquierdo del hígado, el cuerpo del páncreas, el duodeno (porciones 1 y 2), la aorta abdominal y la vena cava inferior.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 4,
        "question": "¿Qué órganos principales se proyectan en el Hipocondrio Izquierdo?",
        "answer": "El bazo, la cola del páncreas, el polo superior del riñón izquierdo, la glándula suprarrenal izquierda, el estómago (cuerpo y fundus) y la flexura esplénica del colon.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 5,
        "question": "¿Qué órganos principales se localizan en el Flanco Derecho?",
        "answer": "El colon ascendente, el polo inferior del riñón derecho y porciones del yeyuno.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 6,
        "question": "¿Qué órganos principales se encuentran en la Región Umbilical (Mesogastrio)?",
        "answer": "El yeyuno, el íleon, la porción inferior del duodeno, el colon transverso y la aorta abdominal.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 7,
        "question": "¿Qué órganos principales se localizan en el Flanco Izquierdo?",
        "answer": "El colon descendente, el polo inferior del riñón izquierdo y asas del yeyuno.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 8,
        "question": "¿Qué órganos principales se proyectan en la Fosa Ilíaca Derecha?",
        "answer": "El ciego, el apéndice cecal, el íleon terminal y, en la mujer, el ovario derecho y la trompa de Falopio derecha.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 9,
        "question": "¿Qué órganos principales se proyectan en el Hipogastrio?",
        "answer": "La vejiga urinaria (cuando está llena/globo vesical), el colon sigmoides, el útero (en mujeres) y la próstata (en hombres).",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 10,
        "question": "¿Qué órganos principales se proyectan en la Fosa Ilíaca Izquierda?",
        "answer": "El colon sigmoides y, en la mujer, el ovario izquierdo y la trompa de Falopio izquierda.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 11,
        "question": "¿Cuáles son las divisiones del abdomen en 4 cuadrantes y qué órgano de alarma se asocia al Cuadrante Superior Derecho?",
        "answer": "Cuadrante Superior Derecho (CSD), Superior Izquierdo (CSI), Inferior Derecho (CID) e Inferior Izquierdo (CII). En el CSD se proyecta la vesícula biliar y el lóbulo hepático derecho (punto clave en colecistitis).",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 12,
        "question": "¿Por qué la Auscultación abdominal precede a la Palpación y Percusión?",
        "answer": "Porque la palpación y percusión físicas **estimulan mecánicamente la motilidad del músculo liso intestinal**, pudiendo aumentar o alterar artificialmente los ruidos hidroaéreos (RHA).",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 13,
        "question": "¿Cuál es la frecuencia normal de los ruidos hidroaéreos (RHA) en reposo?",
        "answer": "La frecuencia fisiológica es de **5 a 30 ruidos hidroaéreos por minuto**, con un tono de gorgojeo regular y no doloroso.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 14,
        "question": "¿Qué indican los RHA hiperactivos de tono metálico alto (ruidos de lucha)?",
        "answer": "Indican la presencia de una **obstrucción intestinal mecánica**, donde el intestino intenta vencer el obstáculo contrayéndose con fuerza aumentada.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 15,
        "question": "¿Qué traduce un abdomen silencioso (RHA ausentes durante 2 minutos o más)?",
        "answer": "Traduce un **íleo paralítico** o una **peritonitis generalizada**, donde la inflamación peritoneal o la falta de inervación abolieron el peristaltismo intestinal.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 16,
        "question": "¿Cuál es el sonido percutorio normal predominante en el abdomen?",
        "answer": "El **timpanismo**, debido al gas contenido en el estómago, colon e intestino delgado.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 17,
        "question": "¿Dónde se ausculta y localiza la matidez hepática normal?",
        "answer": "Se localiza en el tórax anterior derecho. La matidez inicia en el **5to o 6to espacio intercostal derecho** (límite superior) y se extiende hacia abajo hasta el borde costal.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 8 (Tórax y Pulmones) / Argente-Álvarez 3.ª Ed. Cap. 29"
      },
    {
        "id": 18,
        "question": "¿Qué es el espacio de Traube, cuáles son sus límites y qué indica su matidez?",
        "answer": "Es un área semilunar en el tórax anterior izquierdo delimitada por el reborde costal, el bazo, el corazón y el límite inferior del pulmón. Normalmente es **timpánico** (burbuja gástrica); su matidez sugiere **esplenomegalia**.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 19,
        "question": "¿Cómo se evalúa el signo de Castell para detectar esplenomegalia temprana?",
        "answer": "Se percute en el **último espacio intercostal izquierdo en la línea axilar anterior** (punto de Castell). Si el sonido cambia de timpánico a mate durante la inspiración profunda, el signo es positivo.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 20,
        "question": "¿En qué consiste la maniobra de la mano de escultor de Merlo en palpación abdominal?",
        "answer": "Consiste en pasar la mano derecha plana sobre la superficie del abdomen para relajar la pared, evaluar la temperatura, la sensibilidad táctil, la elasticidad y buscar tumores superficiales.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 21,
        "question": "¿Cómo se diferencia la defensa muscular de la rigidez (abdomen en tabla)?",
        "answer": "La **defensa** es una contracción voluntaria por dolor al palpar que cede al pedirle al paciente que respire hondo. La **rigidez (abdomen en tabla)** es una contracción refleja involuntaria y constante debida a peritonitis.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 22,
        "question": "¿Cómo se realiza y qué significa el Signo de Murphy positivo?",
        "answer": "Se colocan los dedos bajo el reborde costal derecho en el punto cístico y se le pide al paciente inspirar. Si la inspiración se corta bruscamente por dolor agudo, es positivo e indica **colecistitis aguda**.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 23,
        "question": "¿Dónde se localiza exactamente el punto de McBurney y qué sugiere dolor selectivo allí?",
        "answer": "Se ubica en la unión del **tercio externo con los dos tercios internos** de una línea trazada desde la espina ilíaca anterosuperior derecha hasta el ombligo. Dolor selectivo sugiere **apendicitis aguda**.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 24,
        "question": "¿Qué es el Signo de Blumberg (o de rebote) y qué afección fisiopatológica indica?",
        "answer": "Es el dolor agudo desencadenado al descomprimir bruscamente un punto del abdomen previamente presionado. Indica **irritación peritoneal** o peritonitis localizada.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 25,
        "question": "¿Qué es el Signo de Rovsing y cómo se realiza?",
        "answer": "Es la aparición de dolor en la fosa ilíaca derecha al presionar profundamente la fosa ilíaca izquierda. Ocurre por el desplazamiento retrógrado de gas que distiende el ciego inflamado.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 26,
        "question": "¿Cómo se realiza el Signo del Psoas y qué tipo de apéndice inflamado sugiere?",
        "answer": "Con el paciente en decúbito lateral izquierdo, se extiende la cadera derecha hacia atrás (o se eleva la pierna contra resistencia). Si despierta dolor en el CID, sugiere un **apéndice retrocecal**.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 27,
        "question": "¿Cómo se realiza el Signo del Obturador y qué indica?",
        "answer": "Con el paciente en decúbito supino, se flexiona la cadera y la rodilla a 90 grados y se realiza rotación interna del muslo. Si hay dolor, indica un **apéndice pélvico** irritando el músculo obturador.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 28,
        "question": "¿En qué consiste el Signo de Giordano y qué patología renal sugiere?",
        "answer": "Consiste en realizar una puñopercusión suave con el borde cubital de la mano en la fosa lumbar (región costovertebral). Dolor agudo sugiere **pielonefritis aguda** o litiasis renal obstructiva.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 29,
        "question": "¿Cómo se realiza la maniobra de la ola ascítica para evaluar líquido libre?",
        "answer": "El explorador coloca una mano en un flanco y da un golpe suave en el flanco opuesto. Un ayudante debe presionar la línea media abdominal con el borde de su mano para evitar la transmisión por grasa subcutánea. Se siente un choque de ola.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 30,
        "question": "¿Qué es el signo del témpano (o de la tecla de piano) en ascites?",
        "answer": "Al presionar de forma rápida y profunda sobre un órgano grande (como el hígado) en un abdomen con ascitis, este se hunde y rebota chocando contra la punta de los dedos del examinador.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 31,
        "question": "¿Cuáles son los límites del Triángulo Anterior del cuello?",
        "answer": "El borde anterior del músculo esternocleidomastoideo, la línea media anterior del cuello y el borde inferior del maxilar inferior.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 32,
        "question": "¿Cómo se realiza la maniobra de Quervain para palpar la glándula tiroides?",
        "answer": "El examinador se coloca **detrás del paciente**, coloca los pulgares en la nuca y los dedos índice y medio en los lóbulos tiroideos por delante, palpando mientras el paciente traga.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 33,
        "question": "¿En qué consiste la maniobra de Crile para palpación tiroidea?",
        "answer": "Es un abordaje **anterior**. El examinador usa el pulgar de una mano para desplazar la tráquea hacia un lado, mientras la otra mano palpa el lóbulo tiroideo contralateral.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 34,
        "question": "¿Qué caracteriza a la maniobra de Lahey para explorar la tiroides?",
        "answer": "Abordaje anterior. Se coloca el pulgar sobre el cartílago tiroides presionando lateralmente para luxar el lóbulo opuesto, facilitando su palpación con la otra mano.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 35,
        "question": "¿Cuál es el tamaño y consistencia normal de la glándula tiroides palpable?",
        "answer": "Normalmente no es palpable o es apenas palpable como un istmo blando, liso, móvil con la deglución y totalmente indoloro.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 36,
        "question": "¿Qué indica el ascenso incompleto o la inmovilidad de la tiroides al deglutir?",
        "answer": "Suele sugerir **fijación neoplásica** o procesos inflamatorios severos (como tiroiditis de Riedel) que anclan la glándula a tejidos vecinos.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 37,
        "question": "¿Por qué se deben auscultar las arterias carótidas en el cuello?",
        "answer": "Para buscar **soplos carotídeos**, que indican estenosis arterial por placas ateroescleróticas o soplos irradiados de estenosis aórtica.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 38,
        "question": "¿Cómo se mide la presión venosa yugular (PVY) y cuál es su valor normal sobre el ángulo esternal?",
        "answer": "Con el paciente a 45 grados, se mide la distancia vertical entre la oscilación yugular superior y el ángulo de Louis. Lo normal es **menor a 3-4 cm** (u 8-9 cm de H2O totales).",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 39,
        "question": "¿Cuáles son las 10 estaciones ganglionares cervicales que se exploran en cuello?",
        "answer": "Submentonianos, submandibulares, amigdalinos, cervicales superficiales, cervicales profundos, cervicales posteriores, occipitales, mastoideos, preauriculares y supraclaviculares.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 40,
        "question": "¿Qué es el Signo de Pemberton y qué patología de cuello confirma?",
        "answer": "Al elevar ambos brazos sobre la cabeza por 1 minuto, el paciente presenta plétora facial, cianosis e ingurgitación yugular por **bocio intratorácico** comprimiendo el estrecho torácico superior.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 41,
        "question": "¿En qué cuadrante de la mama se localiza la mayor proporción de cánceres?",
        "answer": "En el **Cuadrante Superior Externo (CSE)** de la mama, que contiene la mayor masa de tejido glandular.",
        "domain": "semantic",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 42,
        "question": "¿Qué es la cola de Spence y por qué es importante examinarla?",
        "answer": "Es la prolongación axilar del tejido mamario. Es fundamental palparla porque en ella pueden desarrollarse neoplasias y adenopatías axilares.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 43,
        "question": "¿Cuál es la utilidad de la inspección dinámica en el examen de mamas?",
        "answer": "Pedir a la paciente apoyar manos en caderas o alzar brazos tensiona el músculo pectoral mayor, haciendo evidente cualquier **retracción de piel o asimetría** sugestiva de invasión tumoral profunda.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 44,
        "question": "¿Cuáles son los 3 patrones comunes de palpación de la mama?",
        "answer": "El patrón **radial** (de la periferia al pezón), el patrón **espiral** o circular (de afuera hacia adentro) y el de **franjas verticales** (arriba y abajo).",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 45,
        "question": "¿Qué traduce semiológicamente el hallazgo de 'piel de naranja' en la mama?",
        "answer": "Traduce edema cutáneo debido al bloqueo del drenaje linfático por invasión neoplásica (carcinoma inflamatorio de mama).",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 46,
        "question": "¿Cómo se debe colocar el brazo de la paciente para palpar adecuadamente la fosa axilar?",
        "answer": "El brazo de la paciente debe estar **relajado y apoyado sobre el antebrazo del examinador**, lo que relaja los músculos pectorales y permite palpar profundamente el ápex axilar.",
        "domain": "procedural",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 47,
        "question": "¿Qué diferencia la secreción mamaria serohemática de la galactorrea?",
        "answer": "La secreción serohemática (sangre) unilateral es un signo de alarma (ej. papiloma o cáncer). La galactorrea es secreción lechosa bilateral, generalmente asociada a hiperprolactinemia.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 48,
        "question": "¿Qué es el Ganglio de Virchow y qué sospecha diagnóstica plantea?",
        "answer": "Es un ganglio palpable en la **fosa supraclavicular izquierda**. Sugiere metástasis de un tumor maligno intraabdominal (típicamente cáncer gástrico).",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 49,
        "question": "¿Qué es el Signo de Courvoisier-Terrier y qué patología indica?",
        "answer": "Es la palpación de una **vesícula biliar distendida e indolora** en presencia de ictericia progresiva. Indica obstrucción del colédoco por tumor de cabeza de páncreas.",
        "domain": "executive",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 50,
        "question": "¿Qué indican los signos de Grey Turner y Cullen en el examen de abdomen?",
        "answer": "Equimosis en los flancos (Grey Turner) o periumbilical (Cullen), que indican **hemoperitoneo** secundario a pancreatitis necrohemorrágica o embarazo ectópico roto.",
        "domain": "perceptual",
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      }
],
  quiz: [
    {
        "id": 1,
        "scenario": "Mujer de 48 años con sobrepeso consulta por dolor abdominal cólico intenso en cuadrante superior derecho posterior a comer alimentos grasos, acompañado de náuseas. Al examinar el abdomen, usted presiona firmemente debajo del reborde costal derecho y le pide que inspire profundamente; a mitad de la inspiración, la paciente suspende la respiración debido a dolor exquisito.",
        "question": "¿Cómo se denomina esta maniobra y cuál es el diagnóstico más probable?",
        "options": [
            "Signo de Blumberg; pancreatitis aguda.",
            "Signo de Murphy; colecistitis aguda.",
            "Punto de McBurney; apendicitis retrocecal.",
            "Signo de Rovsing; hernia estrangulada.",
            "Puñopercusión de Giordano; pielonefritis."
        ],
        "correctAnswer": 1,
        "justification": "La interrupción abrupta de la inspiración profunda al palpar el punto cístico es el Signo de Murphy positivo, patognomónico de colecistitis aguda. Blumberg es para rebote generalizado.",
        "pearl": "Murphy positivo = Vesícula inflamada que choca contra los dedos al bajar el diafragma.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 2,
        "scenario": "Paciente de 19 años es llevado a urgencias por dolor en fosa ilíaca derecha que comenzó en la región periumbilical. Al examen: abdomen con dolor exquisito a la palpación en la unión del tercio externo y medio de la línea espino-umbilical. Al presionar fijamente en la fosa ilíaca izquierda, refiere dolor reflejo agudo en el lado derecho.",
        "question": "¿Cuáles son los signos y puntos explorados que confirman esta sospecha diagnóstica?",
        "options": [
            "Punto de Murphy y signo de Blumberg.",
            "Punto de McBurney y signo de Rovsing.",
            "Maniobra de Quervain y signo de Giordano.",
            "Maniobra de Merlo y signo del Psoas.",
            "Maniobra de Glenard y signo de Cullen."
        ],
        "correctAnswer": 1,
        "justification": "El dolor localizado en el punto de McBurney y el dolor contralateral inducido en el CID por presión en el CII (signo de Rovsing) son característicos de apendicitis aguda.",
        "pearl": "McBurney + Rovsing = Clásica presentación de irritación cecal / apendicular.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 3,
        "scenario": "Varón de 21 años presenta fiebre, anorexia y dolor en fosa ilíaca derecha. El examinador le pide colocarse en decúbito lateral izquierdo y extiende pasivamente el muslo derecho hacia atrás, lo que despierta un dolor intolerable en el cuadrante inferior derecho.",
        "question": "¿Cómo se llama este signo y qué variante de posición apendicular sugiere?",
        "options": [
            "Signo del Psoas; apéndice retrocecal.",
            "Signo del Obturador; apéndice pélvico.",
            "Signo de Rovsing; apéndice retroperitoneal.",
            "Signo de Blumberg; peritonitis difusa.",
            "Signo de Giordano; litiasis renal."
        ],
        "correctAnswer": 0,
        "justification": "El signo del psoas positivo (dolor al estirar el psoas) sugiere una localización retrocecal del apéndice inflamado que contacta con la fascia del músculo psoas.",
        "pearl": "Psoas positivo = Apéndice oculto detrás del ciego rozando el músculo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 4,
        "scenario": "Mujer de 25 años acude por dolor abdominal bajo. Al realizar la rotación interna del muslo derecho flexionado a 90 grados en decúbito supino, se produce dolor intenso en el hipogastrio y fosa ilíaca derecha.",
        "question": "¿Qué maniobra se ha ejecutado y qué diagnóstico apendicular apoya?",
        "options": [
            "Signo del Psoas; apéndice retrocecal.",
            "Signo del Obturador; apéndice pélvico inflamado.",
            "Signo de McBurney; apéndice subhepático.",
            "Maniobra de Mathieu; bazo accesorio.",
            "Signo de Giordano; cólico nefrítico."
        ],
        "correctAnswer": 1,
        "justification": "La rotación interna del muslo flexionado estira el músculo obturador interno. Si el apéndice inflamado está en la pelvis (apéndice pélvico) en contacto con el obturador, despierta dolor local.",
        "pearl": "Obturador positivo = Localización pélvica profunda del apéndice.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 5,
        "scenario": "Varón de 34 años con dolor abdominal agudo. Al palpar profundamente el flanco izquierdo y retirar la mano con rapidez, el paciente se queja de un dolor punzante e insoportable en el punto de compresión.",
        "question": "¿Cómo se clasifica este hallazgo y qué indica clínicamente?",
        "options": [
            "Signo de Murphy; inflamación vesicular.",
            "Signo de Blumberg (rebote); peritonitis o irritación peritoneal.",
            "Signo de Rovsing; apendicitis pélvica.",
            "Defensa voluntaria; nerviosismo del paciente.",
            "Signo de Giordano; afectación de uréter."
        ],
        "correctAnswer": 1,
        "justification": "El dolor al retirar bruscamente la mano palpatoria es el Signo de Blumberg (rebote), indicador de peritonitis localizada por irritación de la hoja peritoneal parietal.",
        "pearl": "Descompresión dolorosa = Alarma de irritación de las hojas peritoneales.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 6,
        "scenario": "Paciente de 55 años con diagnóstico de cirrosis alcohólica acude por distensión abdominal. En la percusión, se encuentra una zona central de timpanismo periumbilical rodeada por matidez en los flancos. Al recostar al paciente sobre su lado izquierdo, la matidez se desplaza hacia la zona declive izquierda, mientras el flanco derecho se vuelve timpánico.",
        "question": "¿Cómo se define este hallazgo percutorio y qué confirma?",
        "options": [
            "Matidez fija; tumor abdominal masivo.",
            "Matidez desplazable; presencia de líquido libre (ascitis) intraabdominal.",
            "Timpanismo generalizado; meteorismo y distensión gaseosa.",
            "Espacio de Traube ocupado; bazo palpable.",
            "Signo de Giordano positivo; quiste renal."
        ],
        "correctAnswer": 1,
        "justification": "La matidez que cambia de posición al variar el decúbito del paciente (matidez desplazable) es indicativo inequívoco de líquido libre en la cavidad peritoneal (ascitis).",
        "pearl": "El líquido obedece a la gravedad: la matidez viaja siempre a la zona declive.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 7,
        "scenario": "Paciente femenina de 45 años con antecedentes de cáncer gástrico acude por fatiga. Durante el examen físico físico de cuello, usted palpa un ganglio linfático pétreo, indoloro y adherido de 1.5 cm en la fosa supraclavicular izquierda.",
        "question": "¿Cómo se llama este ganglio y qué sospecha diagnóstica plantea?",
        "options": [
            "Ganglio de Aschoff; cardiopatía reumática.",
            "Ganglio de Virchow (o Troisier); metástasis de adenocarcinoma abdominal (cáncer gástrico).",
            "Ganglio centinela axilar; linfoma de Hodgkin.",
            "Bocio nodular; hipotiroidismo primario.",
            "Ganglio de Osler; endocarditis bacteriana."
        ],
        "correctAnswer": 1,
        "justification": "El ganglio supraclavicular izquierdo palpable (Ganglio de Virchow) recibe linfa de los conductos del abdomen. Su afectación tumoral es metástasis típica de neoplasias gastrointestinales.",
        "pearl": "Virchow en fosa supraclavicular izquierda = Centinela de cáncer intraabdominal.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 8,
        "scenario": "Mujer de 68 años consulta por disfagia y ronquera. Al palpar el cuello desde una posición posterior, colocando las manos alrededor del cuello del paciente con los pulpejos en los lóbulos tiroideos, usted percibe una masa nodular firme en el lóbulo derecho que asciende junto a la laringe durante la deglución.",
        "question": "¿Qué maniobra realizó y qué indica la movilidad de la masa?",
        "options": [
            "Maniobra de Harvey; bocio fijo.",
            "Maniobra de Quervain; nódulo tiroideo móvil con la deglución (característica normal de la tiroides).",
            "Maniobra de Crile; quiste tirogloso fijo.",
            "Maniobra de Pemberton; compresión mediastínica.",
            "Maniobra de Lahey; parálisis de cuerda vocal."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra de Quervain (bimanual posterior) es clásica para palpar tiroides. El movimiento ascendente con la deglución confirma que la masa pertenece a la tiroides, ya que la glándula está unida a la tráquea.",
        "pearl": "Si es tiroides, sube al tragar saliva. Si se queda fija, puede ser cáncer invasivo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 9,
        "scenario": "Un estudiante de medicina examina el abdomen de un paciente que ingresó con sospecha de abdomen agudo. Realiza palpación profunda y percusión en primer lugar, y por último ausculta el abdomen reportando silencio RHA.",
        "question": "¿Por qué esta secuencia invalida la interpretación del silencio abdominal en este paciente?",
        "options": [
            "La palpación no afecta los RHA.",
            "La percusión y la palpación estimulan la motilidad intestinal, lo que puede elevar o suprimir de forma refleja los RHA, falseando la auscultación.",
            "Debió realizarse la palpación con el paciente de pie.",
            "La auscultación siempre da silencio si el paciente está en ayunas.",
            "No se altera la semiología por el orden."
        ],
        "correctAnswer": 1,
        "justification": "El estímulo mecánico sobre la pared y las vísceras altera el ritmo peristáltico. Auscultar al final impide saber si el silencio es patológico o inducido.",
        "pearl": "Orden en abdomen: Inspección -> Auscultación -> Percusión -> Palpación.",
        "competencies": [
            "CG8",
            "CG11"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 10,
        "scenario": "Varón de 50 años acude por dolor lumbar sordo y fiebre. Al realizar un golpe leve con el borde cubital de la mano empuñada en la fosa costovertebral lumbar derecha, el paciente salta de la camilla con dolor intenso.",
        "question": "¿Cómo se llama este signo y qué diagnóstico sugiere?",
        "options": [
            "Signo de Murphy; colecistitis.",
            "Signo de Giordano (puñopercusión); pielonefritis aguda derecha.",
            "Signo de McBurney; apendicitis.",
            "Signo de Blumberg; diverticulitis.",
            "Signo de Cullen; pancreatitis."
        ],
        "correctAnswer": 1,
        "justification": "La puñopercusión renal dolorosa es el Signo de Giordano positivo, indicador clásico de inflamación parenquimatosa del riñón (pielonefritis aguda).",
        "pearl": "Giordano positivo = El golpe lumbar despierta dolor de cápsula renal estirada por inflamación.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 11,
        "scenario": "Durante un examen de control de una paciente de 62 años, se realiza inspección dinámica de las mamas solicitándole colocar las manos sobre las caderas presionando con fuerza hacia adentro.",
        "question": "¿Cuál es el objetivo clínico de esta maniobra dinámica?",
        "options": [
            "Facilitar la palpación linfática supraclavicular.",
            "Contraer los músculos pectorales mayores para evidenciar retracciones cutáneas o fijación tumoral profunda.",
            "Identificar bocio intratorácico (Pemberton).",
            "Medir la presión venosa yugular.",
            "Comprimir el pezón para buscar secreciones."
        ],
        "correctAnswer": 1,
        "justification": "La contracción de los pectorales jala las fascias profundas de la mama. Si hay un tumor infiltrante, este ancla la piel y genera una retracción visible al hacer la maniobra.",
        "pearl": "Presionar caderas = Pectoral tenso. Si la piel se retrae o se arruga, sospecha tumor invasivo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 12,
        "scenario": "Mujer de 58 años consulta por un nódulo indoloro en su mama izquierda. Al examinarla, se detecta piel engrosada con poros prominentes en la zona del tumor, descrita clásicamente como 'piel de naranja'.",
        "question": "¿Cuál es el mecanismo fisiopatológico de este hallazgo dermatológico?",
        "options": [
            "Infección bacteriana por estafilococo (celulitis).",
            "Obstrucción del drenaje linfático de la dermis por células tumorales.",
            "Hiposecreción sebácea mamaria.",
            "Edema provocado por falla cardíaca derecha.",
            "Compresión venosa de la cava superior."
        ],
        "correctAnswer": 1,
        "justification": "El carcinoma inflamatorio o infiltrante de mama invade los linfáticos cutáneos, bloqueando el retorno linfático. Esto causa edema de la dermis que se hernia alrededor de los folículos pilosos fijos, creando poros hundidos.",
        "pearl": "Piel de naranja = Bloqueo linfático cutáneo por invasión neoplásica.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 13,
        "scenario": "Hombre de 70 años con ictericia conjuntival severa progresiva de 3 semanas. Niega dolor abdominal. A la palpación de cuadrante superior derecho, se encuentra una masa redondeada, elástica, indolora y móvil que desciende con la respiración, identificada como la vesícula biliar.",
        "question": "¿Cómo se denomina este signo y con qué patología se asocia prioritariamente?",
        "options": [
            "Signo de Murphy positivo; colecistitis calculosa.",
            "Signo de Courvoisier-Terrier; tumor periampular o de cabeza de páncreas obstruyendo el colédoco.",
            "Signo de Cullen; hemoperitoneo.",
            "Signo de Blumberg; perforación de úlcera gástrica.",
            "Signo de Rovsing; hernia inguinal."
        ],
        "correctAnswer": 1,
        "justification": "La vesícula palpable e indolora con ictericia es el Signo de Courvoisier-Terrier. Indica obstrucción biliar mecánica no calculosa (generalmente neoplásica, tumor de páncreas o colangiocarcinoma) donde la vesícula se dilata lentamente sin inflamación aguda.",
        "pearl": "Vesícula palpable + Hielo (ictericia) - Dolor = Cáncer de Páncreas hasta demostrar lo contrario.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 14,
        "scenario": "Paciente de 40 años con dolor abdominal súbito y shock. En el examen del abdomen, se aprecian manchas equimóticas azuladas alrededor del ombligo (signo de Cullen) y en los flancos (signo de Grey Turner).",
        "question": "¿Qué proceso patológico subyacente sugieren estos signos?",
        "options": [
            "Cirrosis hepática con hipertensión portal.",
            "Pancreatitis necrohemorrágica o embarazo ectópico roto con hemoperitoneo posterior.",
            "Obstrucción intestinal alta.",
            "Colecistitis aguda no perforada.",
            "Cáncer de colon derecho."
        ],
        "correctAnswer": 1,
        "justification": "Las equimosis periumbilical y en flancos representan la difusión de sangre retroperitoneal o intraperitoneal hacia el tejido subcutáneo de la pared abdominal, clásico de pancreatitis hemorrágica.",
        "pearl": "Cullen y Grey Turner = Sangre libre digerida tiñendo la piel del abdomen.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 15,
        "scenario": "Durante el examen físico abdominal de un paciente con sospecha de ascitis masiva, se coloca la mano izquierda sobre el flanco derecho del paciente, mientras se da un golpe seco en el flanco izquierdo con los dedos de la mano derecha. Un asistente presiona la línea media con el borde de su mano.",
        "question": "¿Qué maniobra se realiza y cuál es el papel de la presión en la línea media?",
        "options": [
            "Signo del témpano; detectar el bazo.",
            "Maniobra de la ola ascítica; bloquear la transmisión de la onda de vibración a través de la grasa de la pared abdominal.",
            "Maniobra de Glenard; delimitar el riñón.",
            "Signo de Castell; identificar matidez gástrica.",
            "Signo de Blumberg; descartar peritonitis."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra de la ola ascítica confirma líquido libre al sentir el impulso hidráulico. Apoyar la mano del asistente en la línea media detiene las vibraciones que viajan por el tejido adiposo subcutáneo.",
        "pearl": "Ola ascítica = Vibración líquida. Detener la grasa es clave para no dar un falso positivo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 16,
        "scenario": "Un paciente con bocio visible acude a consulta. Al pedirle levantar ambos brazos por encima del nivel de la cabeza durante 60 segundos, el paciente desarrolla plétora facial marcada, ingurgitación venosa yugular severa y dificultad respiratoria leve.",
        "question": "¿Cómo se llama este signo y qué mecanismo lo produce?",
        "options": [
            "Signo de Rivero-Carvallo; retorno venoso aumentado al VD.",
            "Signo de Pemberton; estrechamiento del opérculo torácico superior por bocio endotorácico.",
            "Signo de Giordano; obstrucción de la vena renal.",
            "Maniobra de Quervain; luxación del lóbulo tiroideo.",
            "Maniobra de Harvey; insuficiencia aórtica."
        ],
        "correctAnswer": 1,
        "justification": "El signo de Pemberton es positivo cuando levantar los brazos introduce el bocio dentro del estrecho torácico superior, obstruyendo el retorno venoso de la vena cava superior.",
        "pearl": "Pemberton positivo = El bocio actúa como un tapón en la entrada del tórax al alzar los brazos.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 17,
        "scenario": "Durante la percusión del tórax anterior izquierdo de un paciente con disnea, el examinador encuentra una zona de matidez localizada en el espacio comprendido entre la línea axilar anterior, el reborde costal y el corazón (espacio de Traube). El paciente presenta dolor sordo en dicho flanco.",
        "question": "¿Cuál es el bazo o víscera alterada sugerida y qué signo complementario se debe buscar?",
        "options": [
            "Afectación vesicular; Signo de Murphy.",
            "Esplenomegalia (ocupación del bazo); buscar bazo palpable en decúbito lateral (posición de Schuster).",
            "Derrame pleural derecho; desviación traqueal.",
            "Lóbulo hepático izquierdo agrandado; maniobra de Mathieu.",
            "Globo vesical; percusión hipogástrica."
        ],
        "correctAnswer": 1,
        "justification": "El bazo agrandado (esplenomegalia) invade el espacio de Traube, reemplazando el timpanismo de la burbuja gástrica por matidez. Se complementa palpándolo en decúbito lateral derecho (Schuster).",
        "pearl": "Espacio de Traube mate = Sospecha fuerte de esplenomegalia.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 18,
        "scenario": "Al realizar la percusión en el hipogastrio de un paciente postquirúrgico que no ha orinado en 12 horas, usted obtiene una matidez de contorno convexo superior que se extiende hasta el mesogastrio.",
        "question": "¿Cuál es la causa más probable de este hallazgo y cómo se confirma?",
        "options": [
            "Ascitis libre; matidez desplazable.",
            "Globo vesical (retención urinaria); colocación de sonda vesical o palpación de masa elástica dolorosa.",
            "Meteorismo difuso; timpanismo.",
            "Fecaloma en sigmoides; tacto rectal.",
            "Embarazo; latidos fetales."
        ],
        "correctAnswer": 1,
        "justification": "El globo vesical genera matidez percutoria en hipogastrio con límite superior convexo (útero o vejiga llena). La evacuación de orina al sondar confirma el diagnóstico.",
        "pearl": "Matidez convexa en hipogastrio = Vejiga llena (Globo Vesical).",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 19,
        "scenario": "Mujer de 32 años con nódulo tiroideo móvil. El examinador se coloca al frente del paciente, apoya su pulgar izquierdo sobre el cartílago tiroides empujando la tráquea hacia la derecha, y con los dedos de la mano derecha palpa el lóbulo tiroideo derecho expuesto.",
        "question": "¿Qué maniobra de abordaje anterior se ha realizado?",
        "options": [
            "Maniobra de Quervain.",
            "Maniobra de Crile (o de la palpación anterior).",
            "Maniobra de Lahey.",
            "Maniobra de Pemberton.",
            "Maniobra de Rivero-Carvallo."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra de Crile consiste en desplazar la tráquea con el pulgar para exponer y palpar el lóbulo tiroideo del lado opuesto desde el frente del paciente.",
        "pearl": "Crile = Desplazar la tráquea con el pulgar y palpar con la otra mano.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 20,
        "scenario": "Durante el examen físico de mamas de una paciente de 40 años, usted encuentra una retracción profunda de la piel del cuadrante superior externo izquierdo. Al realizar la palpación, detecta una masa dura de 2 cm fija y no dolorosa.",
        "question": "¿Qué sospecha plantea y cuál es el siguiente paso clínico?",
        "options": [
            "Fibroadenoma mamario; control en 6 meses.",
            "Carcinoma de mama invasivo; referir para mamografía y biopsia.",
            "Mastitis crónica; indicar antibióticos.",
            "Quiste mamario benigno; realizar aspiración.",
            "Ginecomastia atípica; perfil hormonal."
        ],
        "correctAnswer": 1,
        "justification": "La presencia de una masa dura, fija, indolora y acompañada de retracción cutánea es altamente sospechosa de neoplasia maligna (carcinoma invasivo de mama). Requiere estudio urgente.",
        "pearl": "Masa dura + Fija + Retracción de piel = Alarma máxima de Cáncer de Mama.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 21,
        "scenario": "Al evaluar un paciente con sospecha de ascitis de baja cuantía, se realiza la percusión del abdomen desde el ombligo hacia los flancos. Se encuentra timpanismo central y matidez en flancos. Al colocar al paciente en decúbito lateral derecho, la zona de matidez en el flanco izquierdo desaparece y se vuelve timpánica.",
        "question": "¿Cómo se interpreta este hallazgo?",
        "options": [
            "Matidez fija, que sugiere quiste gigante de ovario.",
            "Matidez desplazable positiva, confirmando líquido libre (ascitis).",
            "Timpanismo difuso por distensión gaseosa.",
            "Signo de la ola ascítica negativo.",
            "Fecaloma sigmoideo móvil."
        ],
        "correctAnswer": 1,
        "justification": "El cambio en el límite de la matidez al variar la posición del paciente (matidez desplazable) es característico de ascitis libre.",
        "pearl": "El agua cae al lado que se apoya; el aire sube al lado libre.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 22,
        "scenario": "Hombre de 65 años acude por dolor abdominal bajo y distensión. Refiere estreñimiento crónico. A la palpación de la fosa ilíaca izquierda, se palpa una masa alargada, cordonal, dura y poco móvil de unos 6 cm. Al presionar firmemente con el pulgar, queda una marca hundida que desaparece lentamente.",
        "question": "¿Cuál es la causa más probable de esta masa y qué maniobra la sugiere?",
        "options": [
            "Diverticulitis aguda; signo de Blumberg.",
            "Fecaloma en colon sigmoides; signo del godet (o fóvea palpable) en la masa.",
            "Cáncer de colon izquierdo; signo de la ola.",
            "Apendicitis pélvica; signo del obturador.",
            "Riñón supernumerario; signo de Giordano."
        ],
        "correctAnswer": 1,
        "justification": "La palpación de una masa cordonal dura en la fosa ilíaca izquierda con signo de godet (fóvea palpable al presionar) es típica de heces impactadas (fecaloma) en el colon sigmoides.",
        "pearl": "Masa en FII + Heces duras palpables con moldeamiento = Fecaloma.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 23,
        "scenario": "Paciente asmático de 25 años acude por bocio. Al elevar ambos brazos y colocarlos a los lados de las orejas por un minuto, la cara del paciente se torna roja y congestiva (plétora), y las venas cervicales se dilatan con marcada dificultad para respirar.",
        "question": "¿Qué signo se obtuvo y qué complicación anatomoclínica indica?",
        "options": [
            "Signo de Rivero-Carvallo; regurgitación tricúspide.",
            "Signo de Pemberton positivo; bocio sumergido o intratorácico comprimiendo el mediastino superior.",
            "Signo de Kussmaul; taponamiento pericárdico.",
            "Maniobra de Quervain; cáncer anaplásico.",
            "Signo de Blumberg; peritonitis torácica."
        ],
        "correctAnswer": 1,
        "justification": "El signo de Pemberton evalúa la obstrucción del estrecho torácico por masas como el bocio retroesternal. Levantar los brazos actúa como cuña, comprimiendo el retorno yugular y la vía aérea.",
        "pearl": "Brazos arriba = Cuello atascado por bocio intratorácico.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 24,
        "scenario": "Mujer de 30 años en lactancia materna presenta fiebre de 38.5°C, escalofríos y dolor severo en cuadrante superior interno de la mama derecha. Al examen: zona eritematosa, caliente, indurada y dolorosa al tacto, sin fluctuación.",
        "question": "¿Cuál es la patología mamaria más probable?",
        "options": [
            "Fibroadenoma gigante.",
            "Mastitis puerperal aguda.",
            "Carcinoma lobulillar invasivo.",
            "Necrosis grasa de la mama.",
            "Ectasia ductal benigna."
        ],
        "correctAnswer": 1,
        "justification": "La inflamación localizada con signos de celulitis (eritema, calor, dolor) acompañada de fiebre en una mujer lactante es típica de mastitis aguda, generalmente por fisuras en el pezón.",
        "pearl": "Mastitis = Fiebre + Dolor local en mama durante lactancia.",
        "competencies": [
            "CG6"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 25,
        "scenario": "Durante el examen de cuello de un varón de 72 años con antecedentes de tabaquismo e hipertensión, usted ausculta un ruido rudo soplante sobre la bifurcación carotídea derecha, sincrónico con el pulso arterial.",
        "question": "¿Qué indica este hallazgo y qué riesgo clínico asocia?",
        "options": [
            "Bocio hiperfuncionante; hipertiroidismo.",
            "Soplo carotídeo por estenosis arterial; riesgo de evento cerebrovascular isquémico.",
            "Soplo venoso yugular normal por ejercicio.",
            "Frote pleural transmitido; neumonía.",
            "Foco carotídeo normal."
        ],
        "correctAnswer": 1,
        "justification": "Un soplo carotídeo indica flujo turbulento debido a una estenosis parcial de la arteria carótida por placa ateromatosa. Asocia alto riesgo de embolia cerebral y EVC.",
        "pearl": "Soplo en cuello = Alerta de obstrucción en autopista al cerebro.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 26,
        "scenario": "En la evaluación de una paciente de 18 años con bocio difuso, usted coloca la tráquea entre sus dedos índice y medio empujándola lateralmente para luxarla y palpar con la otra mano el lóbulo tiroideo opuesto.",
        "question": "¿Cómo se denomina esta maniobra?",
        "options": [
            "Maniobra de Quervain.",
            "Maniobra de Lahey.",
            "Maniobra de Crile.",
            "Maniobra de Pemberton.",
            "Maniobra de Harvey."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra de Lahey es de abordaje anterior y consiste en luxar lateralmente el cartílago tiroides para palpar el lóbulo opuesto con la mano libre.",
        "pearl": "Lahey = Luxar la tráquea hacia un lado para palpar el lóbulo expuesto.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 27,
        "scenario": "Paciente de 40 años presenta dolor lumbar tipo cólico insoportable irradiado a testículo derecho. En el examen lumbar, la puñopercusión con el borde cubital despierta un dolor agudo e intolerable.",
        "question": "¿Cómo se llama este signo y qué indica?",
        "options": [
            "Signo de Giordano positivo; indica obstrucción ureteral (ej. litiasis renal) o pielonefritis.",
            "Signo de Murphy positivo; colecistitis.",
            "Signo de McBurney; apendicitis.",
            "Signo de Blumberg; diverticulitis.",
            "Signo de Cullen; pancreatitis."
        ],
        "correctAnswer": 0,
        "justification": "La puñopercusión lumbar dolorosa (Giordano positivo) indica distensión de la cápsula renal, común en litiasis ureteral obstructiva o pielonefritis.",
        "pearl": "Giordano positivo = Afectación de vía urinaria alta (riñón / uréter).",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 28,
        "scenario": "Mujer de 50 años acude por secreción hemática por el pezón izquierdo de 1 semana de evolución. Al examen físico no se palpan nódulos ni adenopatías axilares.",
        "question": "¿Qué sospecha diagnóstica prioritaria plantea esta secreción hemática (telorrea hemorrágica)?",
        "options": [
            "Galactorrea por hiperprolactinemia.",
            "Papiloma intraductal o carcinoma ductal.",
            "Fibroadenoma mamario simple.",
            "Mastitis puerperal atípica.",
            "Quiste mamario roto."
        ],
        "correctAnswer": 1,
        "justification": "La secreción de sangre por un solo pezón (unilateral y hemática) es un signo de alarma importante que obliga a descartar neoplasias como papiloma intraductal o cáncer.",
        "pearl": "Secreción de sangre por pezón = Alerta de lesión intraductal sospechosa.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 29,
        "scenario": "Durante un examen de rutina de una paciente de 25 años, palpa una masa redondeada de 2 cm en el cuadrante superior externo de la mama derecha. Es móvil, de consistencia gomosa elástica, límites precisos y totalmente indolora.",
        "question": "¿Cuál es la neoplasia benigna más probable en esta paciente?",
        "options": [
            "Carcinoma ductal in situ.",
            "Fibroadenoma mamario.",
            "Quiste mamario simple.",
            "Necrosis grasa de la mama.",
            "Mastitis periductal."
        ],
        "correctAnswer": 1,
        "justification": "Un nódulo móvil, gomoso, indoloro y bien delimitado en una mujer joven es altamente sugestivo de fibroadenoma mamario, el tumor benigno más común en esta edad.",
        "pearl": "Fibroadenoma = Masa móvil como canica en mama de mujer joven.",
        "competencies": [
            "CG6"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 30,
        "scenario": "Paciente de 42 años con cirrosis hepática avanzada. Al inspeccionar el abdomen, usted observa venas dilatadas que irradian desde el ombligo hacia la periferia en forma de cabeza de medusa.",
        "question": "¿Qué alteración circulatoria indica este hallazgo?",
        "options": [
            "Obstrucción de la vena cava superior.",
            "Hipertensión portal con recanalización de la vena umbilical.",
            "Insuficiencia cardíaca congestiva severa.",
            "Trombosis de la arteria mesentérica.",
            "Aneurisma de la aorta abdominal."
        ],
        "correctAnswer": 1,
        "justification": "La circulación colateral portocava (cabeza de medusa) es consecuencia del aumento de presión en el sistema porta que recanaliza la vena umbilical remanente.",
        "pearl": "Cabeza de Medusa = Circulación colateral umbilical por hipertensión portal.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 31,
        "scenario": "Durante el examen físico abdominal, se palpa el polo inferior del riñón derecho al final de la inspiración profunda mediante la colocación de una mano en la fosa lumbar y la otra en el flanco anterior derecho presionando activamente.",
        "question": "¿Cómo se llama este método de palpación bimanual de riñón?",
        "options": [
            "Maniobra de Quervain.",
            "Maniobra de Guyon (palpación bimanual del riñón).",
            "Maniobra de Mathieu.",
            "Maniobra de Glenard.",
            "Signo de Giordano."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra de Guyon es la técnica bimanual clásica para palpar riñones colocando una mano posterior (peloteo) y otra anterior.",
        "pearl": "Guyon = Palpación bimanual renal con peloteo posterior.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 32,
        "scenario": "Varón de 23 años acude por dolor abdominal bajo. Al examen, se sospecha apendicitis. Para confirmar, se presiona profundamente la fosa ilíaca izquierda, lo que desencadena de inmediato un dolor agudo en la fosa ilíaca derecha.",
        "question": "¿Cómo se llama este signo y qué lo explica fisiopatológicamente?",
        "options": [
            "Signo de Blumberg; peritonitis generalizada.",
            "Signo de Rovsing; distensión cecal retrógrada de gases al presionar el colon izquierdo.",
            "Signo del Psoas; estiramiento muscular.",
            "Punto de McBurney positivo; inflamación local.",
            "Signo de Giordano; cólico nefrítico."
        ],
        "correctAnswer": 1,
        "justification": "La presión retrógrada sobre el sigmoides y descendente empuja gas hacia el ciego, distendiéndolo y estimulando los receptores de dolor del apéndice inflamado (Rovsing).",
        "pearl": "Rovsing = Presión en izquierda duele en derecha. Tránsito de gas retrógrado.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 33,
        "scenario": "Al realizar la percusión del tórax anterior izquierdo de un paciente obeso, usted nota que la zona timpánica normal gástrica se encuentra reemplazada por matidez. El paciente no tiene esplenomegalia. Al indagar, el paciente menciona haber comido abundantemente hace 20 minutos.",
        "question": "¿Cuál es la causa fisiológica de la ocupación del espacio de Traube en este caso?",
        "options": [
            "Derrame pleural izquierdo.",
            "Estómago lleno de contenido alimentario sólido.",
            "Hepatomegalia del lóbulo izquierdo.",
            "Aneurisma de la aorta.",
            "Dextrocardia."
        ],
        "correctAnswer": 1,
        "justification": "El espacio de Traube normalmente contiene aire del estómago (timpánico). Si el estómago está lleno de comida sólida, se percutirá matidez de forma transitoria fisiológica.",
        "pearl": "Traube ocupado fisiológico = Estómago lleno después de comer.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 34,
        "scenario": "Paciente femenina de 70 años con bocio visible. Al levantar los brazos por encima de la cabeza, su rostro se congestiona (cianosis leve) y comienza a toser por estridor traqueal.",
        "question": "¿Cuál es el diagnóstico clínico y qué maniobra se realizó?",
        "options": [
            "Bocio simple; maniobra de Crile.",
            "Bocio intratorácico obstructivo; Signo de Pemberton positivo.",
            "Taponamiento cardíaco; Signo de Kussmaul.",
            "Tiroiditis subaguda; maniobra de Quervain.",
            "Insuficiencia mitral; maniobra de Harvey."
        ],
        "correctAnswer": 1,
        "justification": "El signo de Pemberton positivo demuestra la obstrucción y compresión mediastínica superior por el bocio al invadir el opérculo torácico.",
        "pearl": "Pemberton = Congestión facial al levantar brazos. Diagnóstico de bocio sumergido.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 35,
        "scenario": "Paciente varón de 48 años con dolor abdominal en cuadrante inferior derecho. Al elevar activamente su pierna derecha recta contra la resistencia de la mano del examinador en decúbito supino, refiere dolor severo en el CID.",
        "question": "¿Qué signo se obtuvo y qué sugiere?",
        "options": [
            "Signo del Psoas positivo; apendicitis aguda (apéndice en contacto con el músculo psoas).",
            "Signo del Obturador; apendicitis pélvica.",
            "Signo de Blumberg; peritonitis generalizada.",
            "Maniobra de Guyon; quiste renal.",
            "Signo de Giordano; litiasis renal."
        ],
        "correctAnswer": 0,
        "justification": "El dolor al contraer activamente el psoas contra resistencia es el Signo del Psoas positivo, sugestivo de apendicitis retrocecal.",
        "pearl": "Psoas = Dolor en CID al alzar pierna contra resistencia.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 36,
        "scenario": "Durante la palpación profunda de un abdomen blando y depresible en un paciente sin síntomas, usted palpa una estructura pulsátil, de límites precisos, en la línea media del epigastrio, ligeramente desviada a la izquierda.",
        "question": "¿Cuál es la estructura anatómica normal palpable y qué alteración se debe descartar si el pulso es muy amplio o expansivo?",
        "options": [
            "Páncreas; pancreatitis crónica.",
            "Aorta abdominal; descartar aneurisma de aorta abdominal (AAA).",
            "Vena cava inferior; descartar trombosis.",
            "Estómago; descartar estenosis pilórica.",
            "Lóbulo hepático izquierdo; descartar cirrosis."
        ],
        "correctAnswer": 1,
        "justification": "Las pulsaciones de la aorta abdominal son palpables en personas delgadas. Un pulso expansivo anormal y masa pulsátil obliga a descartar aneurisma aórtico abdominal.",
        "pearl": "Pulsación epigástrica = Aorta abdominal palpable normal o patológica (Aneurisma).",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 37,
        "scenario": "Mujer de 48 años acude por dolor abdominal severo. Al examen se aprecia distensión simétrica y un ombligo evertido con tinte azulado violáceo.",
        "question": "¿Cómo se denomina este signo periumbilical y qué sugiere?",
        "options": [
            "Signo de Grey Turner; hemorragia retroperitoneal.",
            "Signo de Cullen; hemoperitoneo (típicamente pancreatitis necrohemorrágica).",
            "Signo de Courvoisier; cáncer pancreático.",
            "Signo de Blumberg; peritonitis bacteriana espontánea.",
            "Signo del tempano; cirrosis avanzada."
        ],
        "correctAnswer": 1,
        "justification": "La coloración azulada periumbilical es el Signo de Cullen, indicador de sangre acumulada en el peritoneo que difunde por el ligamento redondo.",
        "pearl": "Cullen = Ombligo azul por hemoperitoneo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 38,
        "scenario": "Durante el examen físico de mamas de una paciente de 45 años, usted encuentra que la piel de la mama derecha tiene poros hundidos prominentes con edema generalizado, asemejando una piel de naranja. No hay masas claras al tacto.",
        "question": "¿Cuál es la sospecha diagnóstica prioritaria?",
        "options": [
            "Mastitis aguda bacteriana.",
            "Carcinoma mamario inflamatorio (cáncer de mama con invasión linfática dérmica).",
            "Ectasia ductal benigna.",
            "Fibroadenoma calcificado.",
            "Ginecomastia local."
        ],
        "correctAnswer": 1,
        "justification": "La piel de naranja sin masa palpable es la presentación clásica del carcinoma inflamatorio de mama, que infiltra y bloquea los conductos linfáticos dérmicos.",
        "pearl": "Piel de naranja = Bloqueo linfático por cáncer de mama inflamatorio.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 39,
        "scenario": "Paciente femenina de 24 años consulta por un nódulo mamario izquierdo. Al examen físico se encuentra una masa esferoide de 2.5 cm, firme, con movilidad libre sobre los planos adyacentes, límites netos y totalmente indolora.",
        "question": "¿Cuál es el tumor benigno de la mama más frecuente compatible con esta descripción?",
        "options": [
            "Quiste simple.",
            "Fibroadenoma de mama.",
            "Papiloma intraductal.",
            "Ectasia ductal.",
            "Linfoma mamario."
        ],
        "correctAnswer": 1,
        "justification": "El fibroadenoma mamario es el tumor benigno más frecuente en mujeres jóvenes, caracterizado por su movilidad y consistencia firme-elástica.",
        "pearl": "Fibroadenoma = Canica de goma móvil en mama joven.",
        "competencies": [
            "CG6"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 40,
        "scenario": "Paciente varón de 65 años acude por dolor abdominal bajo. Al presionar firmemente la fosa ilíaca izquierda, usted palpa una estructura cordonal dura moldeable a la presión (signo del godet).",
        "question": "¿Cuál es el origen de esta masa sigmoidea y qué maniobra la confirma?",
        "options": [
            "Diverticulosis; signo de Rovsing.",
            "Fecaloma; palpación profunda revelando signo de fóvea (o godet) en la masa fecal.",
            "Cáncer colorrectal; percusión.",
            "Hernia inguinal; maniobra de Landivar.",
            "Riñón flotante; maniobra de Guyon."
        ],
        "correctAnswer": 1,
        "justification": "El fecaloma genera una masa palpable en el sigmoides (FII). La capacidad de modelar la masa con los dedos (signo de godet positivo) confirma su contenido fecal duro.",
        "pearl": "Masa en FII que retiene la marca de la presión = Fecaloma.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 41,
        "scenario": "Durante el examen físico de cuello, usted le pide al paciente que trague agua mientras observa de perfil. Se observa una elevación simétrica de una masa bilobulada en la parte anterior e inferior del cuello.",
        "question": "¿Qué estructura anatómica normal produce esta movilidad durante la deglución?",
        "options": [
            "Glándula submandibular.",
            "Glándula tiroides (istmo y lóbulos).",
            "Quiste branquial posterior.",
            "Linfadenopatía cervical profunda.",
            "Aorta ascendente."
        ],
        "correctAnswer": 1,
        "justification": "La tiroides está rodeada por la fascia pretraqueal que se une a la laringe. Al tragar, la laringe sube jalar a la tiroides, confirmando su naturaleza glandular tiroidea.",
        "pearl": "La tiroides es la única glándula anterior que sube al deglutir.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 42,
        "scenario": "Paciente de 40 años presenta dolor en cuadrante inferior derecho del abdomen. Al realizar la flexión de la cadera derecha y rodilla a 90 grados, seguido de la rotación interna del muslo, el paciente refiere dolor severo en el hipogastrio.",
        "question": "¿Cómo se llama este signo y qué localización apendicular confirma?",
        "options": [
            "Signo del Psoas; apéndice retrocecal.",
            "Signo del Obturador positivo; apendicitis en localización pélvica.",
            "Signo de Rovsing; apéndice subhepático.",
            "Signo de Blumberg; diverticulitis del ciego.",
            "Signo de Giordano; cálculo renal."
        ],
        "correctAnswer": 1,
        "justification": "El signo del obturador estira el obturador interno. Dolor pélvico al realizar la maniobra apoya apendicitis pélvica.",
        "pearl": "Obturador positivo = Apendicitis pélvica profunda.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 43,
        "scenario": "Durante la percusión del cuadrante superior izquierdo en la línea axilar anterior (punto de Castell) en inspiración profunda, el sonido cambia de timpánico a mate.",
        "question": "¿Cuál es la interpretación de este hallazgo percutorio?",
        "options": [
            "Neumotórax izquierdo.",
            "Signo de Castell positivo, indicando esplenomegalia temprana.",
            "Traube normal gástrico.",
            "Hepatomegalia del lóbulo derecho.",
            "Vejiga urinaria llena."
        ],
        "correctAnswer": 1,
        "justification": "El signo de Castell positivo (matidez inspiratoria en el último espacio intercostal izquierdo LAA) es un indicador de esplenomegalia subclínica.",
        "pearl": "Castell positivo = Bazo agrandado que choca con la pared al inspirar.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 44,
        "scenario": "Al palpar el abdomen de un paciente de 75 años con dolor epigástrico persistente, usted identifica una masa pulsátil de 6 cm en la línea media supraumbilical. Al palpar con dos manos a ambos lados de la masa, nota que estas se separan en cada latido.",
        "question": "¿Cuál es el origen más probable de la masa y qué tipo de pulsación la caracteriza?",
        "options": [
            "Carcinoma gástrico; pulsación transmitida.",
            "Aneurisma de la aorta abdominal (AAA); pulsación expansiva propia.",
            "Quiste de páncreas; pulsación transmitida.",
            "Hepatomegalia del lóbulo izquierdo; pulsación venosa.",
            "Hernia epigástrica; sin pulsación."
        ],
        "correctAnswer": 1,
        "justification": "La expansión lateral (las manos se separan en cada latido) indica pulsación expansiva propia de un aneurisma de aorta abdominal (AAA). Las masas no vasculares solo transmiten el pulso hacia arriba.",
        "pearl": "Pulsación expansiva (las manos se abren a los lados) = Aneurisma de Aorta abdominal.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 45,
        "scenario": "Paciente femenina de 32 años acude por dolor abdominal bajo. Durante la palpación profunda en la fosa ilíaca derecha, usted presiona la pared y la descomprime bruscamente, provocando un grito de dolor en la paciente.",
        "question": "¿Cómo se documenta este signo y qué sospecha?",
        "options": [
            "Signo de Murphy positivo; colecistitis.",
            "Signo de Blumberg (rebote) positivo; irritación peritoneal por apendicitis o anexitis.",
            "Signo de Rovsing positivo; litiasis renal.",
            "Signo de Giordano positivo; pielonefritis.",
            "Ola ascítica positiva; ascitis."
        ],
        "correctAnswer": 1,
        "justification": "El dolor al rebote (descompresión) es el signo de Blumberg positivo, indicando irritación del peritoneo en esa zona.",
        "pearl": "Blumberg positivo = Irritación peritoneal aguda (cirugía de urgencia).",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 46,
        "scenario": "Varón de 67 años ingresa con disnea y fatiga. Al examen se observa aumento de la ingurgitación venosa cervical durante la inspiración profunda, en lugar de colapsar como ocurre fisiológicamente.",
        "question": "¿Cómo se llama este signo y qué alteración hemodinámica indica?",
        "options": [
            "Reflujo hepatojugular; falla del ventrículo izquierdo.",
            "Signo de Kussmaul; restricción al llenado diastólico del ventrículo derecho (pericarditis constrictiva).",
            "Signo de Pemberton; bocio intratorácico.",
            "Signo de Rivero-Carvallo; estenosis mitral.",
            "Pulso carotídeo celer; insuficiencia aórtica."
        ],
        "correctAnswer": 1,
        "justification": "El signo de Kussmaul es el aumento de la ingurgitación yugular al inspirar, debido a la rigidez del pericardio o del miocardio del ventrículo derecho que no puede recibir el aumento de retorno venoso.",
        "pearl": "Kussmaul yugular = Corazón derecho rígido que se desborda al inspirar.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 9 (Cabeza y Cuello) / Argente-Álvarez 3.ª Ed. Cap. 27"
      },
    {
        "id": 47,
        "scenario": "Mujer de 54 años consulta por dolor en fosa lumbar izquierda y fiebre. Al realizar un golpe seco con el borde cubital de la mano en la región costovertebral izquierda, la paciente salta de dolor.",
        "question": "¿Cuál es el signo clínico positivo y qué diagnóstico apoya?",
        "options": [
            "Signo de Murphy; colecistitis aguda.",
            "Signo de Giordano positivo; pielonefritis aguda izquierda.",
            "Signo de McBurney; apendicitis retrocecal.",
            "Signo de Cullen; pancreatitis.",
            "Signo de Blumberg; diverticulitis."
        ],
        "correctAnswer": 1,
        "justification": "La puñopercusión lumbar dolorosa es el Signo de Giordano positivo, indicando inflamación de la pelvis renal o parénquima renal izquierdo.",
        "pearl": "Giordano izquierdo = Riñón izquierdo inflamado y sensible.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      },
    {
        "id": 48,
        "scenario": "Durante el autoexamen de mamas, una paciente de 35 años nota una masa móvil de límites claros e indolora en su mama derecha. Niega retracciones de piel.",
        "question": "¿Qué sospecha clínica plantea y cuál es el tumor benigno más común compatible?",
        "options": [
            "Carcinoma inflamatorio.",
            "Fibroadenoma mamario.",
            "Quiste simple.",
            "Ectasia ductal.",
            "Linfadenitis axilar."
        ],
        "correctAnswer": 1,
        "justification": "Masa móvil, elástica e indolora en mujer joven es típica de fibroadenoma mamario.",
        "pearl": "Fibroadenoma = Masa benigna de límites claros y muy móvil.",
        "competencies": [
            "CG6"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 49,
        "scenario": "Al examinar el tórax de una mujer de 46 años, usted solicita al paciente colocar las manos firmemente en las caderas. Al hacerlo, se hace evidente una sutil zona de piel hundida en el cuadrante inferior interno de la mama derecha.",
        "question": "¿Cuál es la importancia semiológica de esta maniobra dinámica de mamas?",
        "options": [
            "Detectar ganglios supraclaviculares.",
            "Evidenciar retracción cutánea por infiltración del ligamento de Cooper por tumor maligno profundo.",
            "Buscar bocios intratorácicos.",
            "Evaluar el pulso venoso de la yugular.",
            "Descartar mastitis aguda."
        ],
        "correctAnswer": 1,
        "justification": "La maniobra tensa el músculo pectoral. Si hay infiltración tumoral del ligamento suspensorio (Cooper), tracciona la piel generando el hundimiento patognomónico.",
        "pearl": "Maniobra dinámica de pectoral = Revela invasión tumoral profunda que no se ve en reposo.",
        "competencies": [
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
      },
    {
        "id": 50,
        "scenario": "Paciente de 54 años con ictericia severa progresiva y prurito generalizado. Niega dolor en abdomen. Al palpar el cuadrante superior derecho, se encuentra una vesícula biliar distendida y palpable, totalmente indolora.",
        "question": "¿Cómo se llama este signo y qué diagnóstico diferencial plantea?",
        "options": [
            "Signo de Murphy; colecistitis aguda.",
            "Signo de Courvoisier-Terrier; obstrucción biliar neoplásica (tumor de páncreas o de vía biliar).",
            "Signo de Blumberg; peritonitis localizada.",
            "Signo de Cullen; pancreatitis hemorrágica.",
            "Signo de Giordano; pielonefritis."
        ],
        "correctAnswer": 1,
        "justification": "Vesícula palpable indolora en ictericia es el Signo de Courvoisier-Terrier. Diferencia la obstrucción litiásica (donde la vesícula se esclerosa y no se distiende) de la neoplásica.",
        "pearl": "Vesícula palpable + Indolora + Ictericia = Alerta de Neoplasia obstructiva de colédoco.",
        "competencies": [
            "CG6",
            "CG8"
        ],
        "reference": "Bates 12.ª Ed. Cap. 16 (Abdomen) / Argente-Álvarez 3.ª Ed. Cap. 47"
      }
],
"reference": "Bates 12.ª Ed. Cap. 14 (Mamas y axilas) / Argente-Álvarez 3.ª Ed. Cap. 33"
};
