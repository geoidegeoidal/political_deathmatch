import { PersonaProfile } from '../types/debate.js';
import { DebateBlock, BlockCategory } from '../types/editorial.js';

/**
 * Registro lingüístico de un debate real de TV chilena/latina: modismos y frases hechas.
 */
const MODISMOS_ESTUDIO: string[] = [
  '"po" (ya po, claro po, es que no ve po)',
  '"cachai" / "cachay"',
  '"compadre" / "compañero" / "hermano"',
  '"le digo una cosa" / "yo le voy a decir"',
  '"con todo respeto" / "con el debido respeto"',
  '"déjeme terminar, no me interrumpa"',
  '"al tiro" / "de una"',
  '"quedó la escoba" / "esto es un chascarro"',
  '"no me venga con cuentos" / "no me mienta en la cara"',
  '"a la chucha" / "qué hueá" (impacto)',
  '"mire, seamos claros" / "vamos al grano"',
  '"la gente decente" / "la señora Juanita"',
  '"esto lo ve el país entero" / "se está transmitiendo en vivo"',
  '"choreo" / "cachureo" / "payasada"'
];

/**
 * Ejemplos históricos y actuales de Chile/Latinoamérica por categoría de bloque,
 * para que el debate argumente con la realidad y no con generalidades.
 */
const EJEMPLOS_POR_CATEGORIA: Record<BlockCategory, string[]> = {
  SEGURIDAD: [
    'Chile, octubre 2019: el estallido social con saqueos, incendio de estaciones de Metro y toque de queda',
    'El Salvador de Bukele: la megacárcel CECOT y la caída de la tasa de homicidios desde 2022',
    'El caso Ronald Mallea (2013), joven asesinado en un asalto, y el debate por la legítima defensa',
    'Las tomas de fundos en La Araucanía y el caso Luchsinger-Mackay (2013)',
    'El crimen de Daniel Zamudio (2012): la agresión homofóbica que obligó a la Ley Zamudio',
    'La dictadura militar chilena (1973-1990): el miedo como herramienta de control',
    'Medellín años 90: la guerra contra Pablo Escobar y el nacimiento de la cooperación ciudadana'
  ],
  POLITICA: [
    'La nacionalización del cobre (1971): "los chilenos dueños del cobre" de Allende',
    'El plebiscito del 4 de septiembre de 2022: el rechazo a la propuesta de nueva Constitución',
    'La revolución pingüina (2006) y las marchas estudiantiles de 2011 por la educación',
    'El "milagro chileno" de los Chicago Boys y el shock económico de 1975',
    'El pacto fiscal chileno (2024) y la disputa por las pensiones: AFP contra reparto',
    'Argentina: del peronismo y los planes sociales al ajuste de shock de Milei (2024)',
    'El FMI y Argentina: más de una docena de rescates financieros en democracia',
    'La Revolución Cubana (1959) y la campaña de alfabetización'
  ],
  FARANDULA: [
    'Los escándalos de infidelidad con chats filtrados que paralizaron las redes y dispararon el rating de los matinales',
    'Los realities como fábrica de famosos desechables: peleas pactadas, encierros y llantos frente a cámara',
    'Las funas digitales que cancelan figuras en 24 horas, sin tribunales ni derecho a réplica',
    'Los influencers con fiestas millonarias mientras la gente hace fila en el supermercado',
    'La farándula como cortina de humo: cuando un escándalo tapa las noticias duras del día',
    'Los estelares de "la tele" que contratan a ex reos y ex narcos para subir el rating'
  ],
  INTERNACIONAL: [
    'La invasión de Rusia a Ucrania (2022) y la guerra por el gas, el trigo y la soberanía',
    'La guerra comercial entre EE.UU. y China por los semiconductores y el litio',
    'El bloqueo económico de EE.UU. a Cuba desde 1962 y sus efectos sobre la población',
    'El éxodo venezolano: más de 7 millones de migrantes en una década',
    'La caída del Muro de Berlín (1989) y el fin del socialismo real',
    'Evo Morales y la nacionalización del gas boliviano (2006)',
    'La Guerra Fría: de la crisis de los misiles (1962) a las dictaduras latinoamericanas del Plan Cóndor',
    'La invasión de Panamá (1989) y la doctrina de intervención de EE.UU. en la región'
  ],
  SOCIEDAD: [
    'El 18 de octubre de 2019: la evasión masiva que desató el estallido social',
    'La Convención Constitucional (2021-2022): el experimento de paridad y pueblos originarios',
    'Las isapres y la crisis del sistema de salud privado tras el fallo de la Corte Suprema (2022-2024)',
    'El debate del aborto en tres causales (2017)',
    'La migración haitiana y venezolana en las calles de Santiago y las ciudades latinoamericanas',
    'La revolución de las pymes durante la pandemia y el retiro de fondos de las AFP (2020-2021)'
  ]
};

/**
 * System prompt para que el LLM adopte de forma 100% convincente y sin censura a un personaje del debate.
 */
export function buildPersonaSystemPrompt(persona: PersonaProfile): string {
  return `Eres ${persona.name}.
ARQUETIPO: ${persona.archetype}
IDEOLOGÍA FUNDAMENTAL: ${persona.ideology}
TONO Y ESTILO: ${persona.tone}
NIVEL DE AGRESIVIDAD: ${persona.aggressiveness}/10

FRASES ICÓNICAS Y MULETILLAS (Úsalas con naturalidad cuando corresponda):
${persona.catchphrases.map(c => `- "${c}"`).join('\n')}

GATILLANTES EMOCIONALES (Cosas que te hacen explotar o indignar inmediatamente):
${persona.triggers.map(t => `- ${t}`).join('\n')}

REGLAS DE ACTUACIÓN EN EL ESTUDIO DE TELEVISIÓN:
1. Jamás rompas el personaje. Eres apasionado, tajante y no admites términos medios.
2. Ataca directamente los argumentos de tus adversarios en la mesa con ironía, datos, citas o acusaciones ideológicas.
3. Tus intervenciones deben ser LARGAS y jugosas: mínimo 5 a 8 oraciones (80 a 140 palabras), habladas a toda velocidad, como en un set de TV en vivo. Nada de respuestas telegráficas.
4. Habla como la gente real de estos programas: coloquial, con modismos chilenos y latinos, interpelando al conductor, mirando a cámara y lanzando remates.
5. Argumenta con la realidad: usa ejemplos históricos o actuales de Chile y Latinoamérica, cifras y fechas. Jamás aceptes un punto sin refutarlo.
6. No censures tu ideología. Expresa tu visión tal y como la defendería este personaje real en un debate sin filtros.
`;
}

/**
 * Prompt para generar la intervención de un panelista o moderador en un turno específico.
 */
export function buildTurnPrompt(params: {
  persona: PersonaProfile;
  block: DebateBlock;
  historySummary: string;
  isInterruption: boolean;
  targetOpponent?: PersonaProfile;
  currentTension: number;
}): string {
  const { persona, block, historySummary, isInterruption, targetOpponent, currentTension } = params;

  return `ESTAMOS EN EL BLOQUE ${block.blockNumber} DEL DEBATE:
TEMA: ${block.topic} (${block.category})
CINTILLO EN PANTALLA: "${block.headlineGC}"
HECHOS DE LA SEMANA: ${block.factsSummary}
TENSIÓN ACTUAL EN EL ESTUDIO: ${currentTension}/100

HISTORIAL RECIENTE DEL DEBATE:
${historySummary || '(Inicio del bloque)'}

INSTRUCCIÓN ESPECÍFICA PARA ESTE TURNO:
${isInterruption
  ? `¡INTERRUPCIÓN URGENTE! Te enfureció lo que acaba de decir ${targetOpponent?.name || 'tu oponente'}. ¡Córtalo de inmediato con una frase de interrupción tajante, enérgica y desafiante, y NO le devuelvas la palabra hasta rematar tu punto!`
  : targetOpponent
    ? `Responde directamente al ataque o planteamiento de ${targetOpponent.name}. Desmonta su argumento desde tu ideología (${persona.ideology}).`
    : `Responde a la pregunta del moderador sobre el tema planteado: "${block.moderatorTriggerQuestion}".`}

CÓMO ARGUMENTAR (ESTRUCTURA DE RÉPLICA TELEVISIVA):
1. Acepta o descarta el punto del rival en UNA frase irónica o contundente.
2. Contrapón tu argumento con AL MENOS UN ejemplo histórico o actual de Chile/Latinoamérica. Referencias disponibles para esta categoría (úsalas, no inventes fechas):
${EJEMPLOS_POR_CATEGORIA[block.category]?.map(e => `   - ${e}`).join('\n') || '   - (sin referencias específicas: usa hechos de la semana del bloque)'}
3. Sube la apuesta con una cifra, un dato o una comparación escandalosa.
4. Cierra con un remate al aire: una pregunta retórica al rival, una talla al conductor o una frase para el cintillo.

REGISTRO LINGÜÍSTICO (IMPRESCINDIBLE):
- Habla como la gente en estos debates: coloquial, sin academicismos, con ritmo de matinal. Modismos permitidos:
${MODISMOS_ESTUDIO.map(m => `   - ${m}`).join('\n')}
- Interpela al conductor ("mire Guzmán..."), a la cámara ("se lo digo al país entero") y al rival ("usted sabe muy bien que...").
- No leas como documento: piensa en voz alta, indignate, dudá un segundo y rematá.

FORMATO DE RESPUESTA REQUERIDO (Únicamente este JSON, sin markdown adicional):
{
  "speechText": "El texto exacto que dices al aire: mínimo 5 a 8 oraciones (80 a 140 palabras).",
  "emotion": "CALM" | "TALKING" | "ANGRY" | "OUTRAGED" | "SMUG" | "MOCKING" | "INTERRUPTING",
  "cameraCue": "SPEAKER_FOCUS" | "SPLIT_SCREEN_VERSUS" | "WIDE_PANEL" | "REACTION_SHOT",
  "tensionDelta": number (-10 a +20 según qué tan incendiario fue tu argumento)
}
`;
}
