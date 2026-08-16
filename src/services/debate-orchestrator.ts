import { PersonaProfile, DebateTurn, DebateTranscript, FsmState, EmotionState, CameraCue } from '../types/debate.js';
import { WeeklyAgenda, DebateBlock } from '../types/editorial.js';
import { buildPersonaSystemPrompt, buildTurnPrompt } from '../prompts/persona-debate.prompt.js';
import { completeText } from './debate-runtime.js';
export interface OrchestratorOptions {
  turnsPerBlock?: number;
  maxTension?: number;
}

export class DebateOrchestrator {
  private moderator: PersonaProfile;
  private panelists: PersonaProfile[];
  private currentTension: number = 30; // 0 - 100

  constructor(personas: PersonaProfile[]) {
    const mod = personas.find(p => p.role === 'MODERATOR');
    if (!mod) {
      throw new Error('Debe existir al menos un personaje con rol MODERATOR en el catálogo.');
    }
    this.moderator = mod;
    this.panelists = personas.filter(p => p.role === 'PANELIST');
    if (this.panelists.length < 2) {
      throw new Error('Se requieren al menos 2 panelistas para el debate.');
    }
  }

  public async orchestrateEpisode(agenda: WeeklyAgenda, options: OrchestratorOptions = {}): Promise<DebateTranscript> {
    const turns: DebateTurn[] = [];
    let turnCounter = 1;

    console.log(`\n🎬 [ORCHESTRATOR] Iniciando simulación de debate para: ${agenda.theme}`);

    // 0. APERTURA DEL CAPÍTULO: generada por LLM (nueva en cada episodio)
    const openingTurn = await this.generateEpisodeOpening(turnCounter++, agenda);
    turns.push(openingTurn);

    for (const block of agenda.blocks) {
      console.log(`\n📺 [BLOQUE ${block.blockNumber}] ${block.topic} (${block.category})`);
      this.currentTension = 68; // Reset de tensión base por bloque (estudio al rojo vivo desde el inicio)

      // 1. INTRO_BLOCK: Moderador presenta el tema y lee el cintillo
      const introTurn = this.createModeratorIntroTurn(turnCounter++, block);
      turns.push(introTurn);

      // 1b. BAJADA DE NOTICIAS: el conductor da contexto de los hechos antes del debate de ideas
      const bajadaTurn = this.createModeratorBajadaTurn(turnCounter++, block);
      turns.push(bajadaTurn);

      // 2. MODERATOR_QUESTION: Pregunta provocadora a un panelista inicial
      const targetPanelist = this.selectTargetPanelistForBlock(block);
      const questionTurn = this.createModeratorQuestionTurn(turnCounter++, block, targetPanelist);
      turns.push(questionTurn);

      // 3. Secuencia de debate y réplicas entre panelistas
      const blockTurns = await this.simulateBlockCrossfire(turnCounter, block, targetPanelist, turns);
      turns.push(...blockTurns);
      turnCounter += blockTurns.length;

      // 4. MODERATOR_CUT / BLOCK_SUMMARY (sin comerciales: se fluye al siguiente bloque)
      const cutTurn = this.createModeratorSummaryTurn(turnCounter++, block);
      turns.push(cutTurn);
    }

    // 5. DUELO FINAL: dos panelistas aleatorios se interpelan con preguntas filosas
    const duelTurns = await this.simulateFinalDuel(turnCounter, turns);
    turns.push(...duelTurns);
    turnCounter += duelTurns.length;

    const totalDurationSec = turns.reduce((acc, t) => acc + t.estimatedDurationSec, 0);

    const transcript: DebateTranscript = {
      episodeId: agenda.episodeId,
      title: agenda.theme,
      generatedAt: new Date().toISOString(),
      totalDurationSec,
      participants: [this.moderator, ...this.panelists],
      turns
    };

    return transcript;
  }

  /**
   * DUELO FINAL: elige 2 panelistas al azar y los hace interpelarse con
   * preguntas filosas (A pregunta -> B responde -> B pregunta -> A responde).
   */
  private async simulateFinalDuel(startTurnId: number, previousTurns: DebateTurn[]): Promise<DebateTurn[]> {
    console.log(`\n⚔️ [DUELO FINAL] Eligiendo dos pesos pesados al azar...`);

    const [panelistA, panelistB] = this.pickTwoRandomPanelists();
    console.log(`⚔️ [DUELO FINAL] ${panelistA.name} vs ${panelistB.name}`);

    this.currentTension = 75; // El estudio ya está al rojo para el cara a cara

    const introText = `¡Y AHORA, lo que todos esperaban: EL CARA A CARA FINAL DEL PROGRAMA! ¡Cintillo urgente ya mismo, control! "¡DUELO DE TITANES! ¿QUIÉN SOBREVIVE SIN FILTROS?". Dos pesos pesados, ${panelistA.name} y ${panelistB.name}, se van a interpelar con preguntas filosas, uno a uno, sin anestesia y sin escapatoria. ¡Que comience el duelo!`;
    const introTurn: DebateTurn = {
      turnId: startTurnId,
      blockNumber: 0,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'OUTRAGED',
      speechText: introText,
      cameraCue: 'WIDE_PANEL',
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(introText)
    };
    const duelTurns: DebateTurn[] = [introTurn];

    const historySnippet = previousTurns.slice(-3).map(t => `${t.speakerName}: "${t.speechText}"`).join('\n');

    // Ronda 1: A pregunta -> B responde
    const q1 = await this.generateDuelTurn(startTurnId + 1, panelistA, panelistB, 'DUEL_QUESTION', historySnippet);
    duelTurns.push(q1);
    const a1 = await this.generateDuelTurn(startTurnId + 2, panelistB, panelistA, 'DUEL_ANSWER', historySnippet + '\n' + `${panelistA.name}: "${q1.speechText}"`);
    duelTurns.push(a1);

    // Ronda 2: B pregunta -> A responde
    const q2 = await this.generateDuelTurn(startTurnId + 3, panelistB, panelistA, 'DUEL_QUESTION', historySnippet + `\n${panelistA.name}: "${q1.speechText}"\n${panelistB.name}: "${a1.speechText}"`);
    duelTurns.push(q2);
    const a2 = await this.generateDuelTurn(startTurnId + 4, panelistA, panelistB, 'DUEL_ANSWER', historySnippet + `\n${panelistA.name}: "${q1.speechText}"\n${panelistB.name}: "${a1.speechText}"\n${panelistB.name}: "${q2.speechText}"`);
    duelTurns.push(a2);

    // Cierre del programa: LLM con humor, referenciando las discusiones reales del episodio
    const closing = await this.generateModeratorClosing(startTurnId + 5, [...previousTurns, ...duelTurns]);
    duelTurns.push(closing);

    return duelTurns;
  }

  private pickTwoRandomPanelists(): [PersonaProfile, PersonaProfile] {
    const idxA = Math.floor(Math.random() * this.panelists.length);
    let idxB = Math.floor(Math.random() * this.panelists.length);
    while (idxB === idxA) {
      idxB = Math.floor(Math.random() * this.panelists.length);
    }
    return [this.panelists[idxA], this.panelists[idxB]];
  }

  /**
   * Cierre del programa generado por LLM: resume con humor las discusiones del
   * episodio (choques de alto voltaje), bromea sobre los panelistas y despide.
   */
  private async generateModeratorClosing(turnId: number, episodeTurns: DebateTurn[]): Promise<DebateTurn> {
    const clashes = episodeTurns
      .filter(t => t.speakerId !== this.moderator.id && (t.isInterruption || t.tensionAfterTurn >= 80))
      .slice(-6)
      .map(t => `- ${t.speakerName} (contra ${t.targetSpeakerId ? this.panelists.find(p => p.id === t.targetSpeakerId)?.name || 'la mesa' : 'el conductor'}): "${t.speechText.slice(0, 140)}..."`)
      .join('\n');

    const prompt = `${buildPersonaSystemPrompt(this.moderator)}

Estás cerrando el programa EN VIVO. El episodio terminó y el estudio quedó humeando.

LOS CHOQUES MÁS CALIENTES DE ESTA NOCHE:
${clashes || '- La mesa estuvo tranquila... cosa rara.'}

Escribí el CIERRE del programa (8 a 12 oraciones, estilo matinal sensacionalista):
1. Abrí con un remate gracioso sobre lo que se vio esta noche (usá los choques reales de la lista, no inventes otros).
2. Bromeá sobre 2-3 panelistas (sin ser cruel, con la talla chilena: "po", "cachai", ironía fina).
3. Agradecé al público y prometé la próxima semana con otro tema que va a arder.
4. Cerralo con el eslogan del programa: "Political Deathmatch, el primer podcast político sin censura con IA".
Respondé ÚNICAMENTE con el texto del cierre, sin comillas ni prefijos.`;

    let speechText = '';
    try {
      const response = await completeText(prompt, { temperature: 0.95 });
      speechText = this.extractPlainText(response);
    } catch {
      speechText = '';
    }
    if (!speechText) {
      speechText = `¡Y CON ESO TERMINAMOS! ¡La noche estuvo que ardió! Esto fue ${this.moderator.name} en Political Deathmatch, el primer podcast político sin censura con IA. ¡Nos vemos la próxima semana, país!`;
    }

    return {
      turnId,
      blockNumber: 0,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'TALKING',
      speechText,
      cameraCue: 'WIDE_PANEL',
      tensionAfterTurn: 40,
      estimatedDurationSec: this.estimateDuration(speechText)
    };
  }

  private async generateDuelTurn(
    turnId: number,
    speaker: PersonaProfile,
    opponent: PersonaProfile,
    mode: 'DUEL_QUESTION' | 'DUEL_ANSWER',
    historySummary: string
  ): Promise<DebateTurn> {
    const prompt = buildTurnPrompt({
      persona: speaker,
      block: {
        blockNumber: 0,
        category: 'POLITICA',
        topic: 'El cara a cara final del programa',
        region: 'CL',
        headlineGC: '¡DUELO DE TITANES! ¿QUIÉN SOBREVIVE SIN FILTROS?',
        factsSummary: 'Momento culminante del programa: dos panelistas se interpelan cara a cara.',
        moderatorTriggerQuestion: 'Interpelación directa entre panelistas.',
        personaTriggers: {}
      },
      historySummary,
      isInterruption: false,
      targetOpponent: opponent,
      currentTension: this.currentTension,
      duelMode: mode
    });

    let speechText = '';
    let emotion: EmotionState = mode === 'DUEL_QUESTION' ? 'MOCKING' : 'ANGRY';
    let cameraCue: CameraCue = 'SPLIT_SCREEN_VERSUS';

    try {
      const response = await completeText(prompt, { temperature: 0.9 });
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      speechText = parsed.speechText || this.getFallbackSpeech(speaker, this.buildDuelBlock());
      emotion = parsed.emotion || emotion;
      cameraCue = parsed.cameraCue || cameraCue;
      this.currentTension = Math.min(100, Math.max(0, this.currentTension + (parsed.tensionDelta || 5)));
    } catch {
      speechText = this.getFallbackSpeech(speaker, this.buildDuelBlock());
      this.currentTension = Math.min(100, this.currentTension + 8);
    }

    return {
      turnId,
      blockNumber: 0,
      speakerId: speaker.id,
      speakerName: speaker.name,
      isInterruption: false,
      emotion,
      speechText,
      cameraCue,
      targetSpeakerId: opponent.id,
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(speechText)
    };
  }

  private buildDuelBlock(): DebateBlock {
    return {
      blockNumber: 0,
      category: 'POLITICA',
      topic: 'El cara a cara final del programa',
      region: 'CL',
      headlineGC: '¡DUELO DE TITANES! ¿QUIÉN SOBREVIVE SIN FILTROS?',
      factsSummary: 'Momento culminante del programa: dos panelistas se interpelan cara a cara.',
      moderatorTriggerQuestion: 'Interpelación directa entre panelistas.',
      personaTriggers: {}
    };
  }

  private selectTargetPanelistForBlock(block: DebateBlock): PersonaProfile {
    if (block.category === 'FARANDULA') {
      return this.panelists.find(p => p.id === 'brayan_cyberpunk') || this.panelists[0];
    }
    // Si es seguridad o política, apuntar a Sotomayor o a Von Der Goltz
    if (block.category === 'SEGURIDAD') {
      return this.panelists.find(p => p.id === 'capitan_sotomayor') || this.panelists[0];
    }
    return this.panelists[Math.floor(Math.random() * this.panelists.length)];
  }

  private createModeratorIntroTurn(turnId: number, block: DebateBlock): DebateTurn {
    const variants = [
      (b: DebateBlock) => `¡Atención, atención, Chile y el mundo! ¡Estamos EN VIVO y esto va a arder en pantalla! Entramos al bloque ${b.blockNumber}. ¡Cintillo urgente ya mismo, control! "${b.headlineGC}". Nos vamos a la yugular con ${b.topic}. Que nadie se mueva, que aquí no hay censura, ¡esto recién empieza!`,
      (b: DebateBlock) => `¡Alto ahí, país, que llegó lo que estabas esperando! Bloque ${b.blockNumber} en pantalla. ¡Cintillo urgente ya mismo, control! "${b.headlineGC}". Vamos con ${b.topic}, y les advierto: la mesa está que arde. ¡Esto es Political Deathmatch y aquí nadie se guarda nada!`,
      (b: DebateBlock) => `¡Se prende la tele, se prende el país! Bloque ${b.blockNumber}: ${b.topic}. ¡Cintillo urgente ya mismo, control! "${b.headlineGC}". Sin filtros, sin anestesia y sin contemplaciones. ¡Atención, que esto no se va a poder ver sin indignarse!`
    ];
    const text = variants[(block.blockNumber - 1) % variants.length](block);
    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'TALKING',
      speechText: text,
      cameraCue: 'SPEAKER_FOCUS',
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(text)
    };
  }

  /**
   * Extrae texto plano de la respuesta del LLM: si el modelo devolvió JSON
   * (formato de turno), se rescata el campo speechText; si no, se usa el texto crudo.
   */
  private extractPlainText(raw: string): string {
    const trimmed = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as { speechText?: string; text?: string };
        if (parsed.speechText) return parsed.speechText;
        if (parsed.text) return parsed.text;
      } catch {
        // No era JSON válido: se usa el texto crudo
      }
    }
    return trimmed;
  }

  /**
   * Apertura del capítulo generada por LLM: el conductor presenta el episodio
   * con la energía del programa, adelanta los bloques y el duelo final.
   */
  private async generateEpisodeOpening(turnId: number, agenda: WeeklyAgenda): Promise<DebateTurn> {
    const blocksPreview = agenda.blocks
      .map(b => `- Bloque ${b.blockNumber}: ${b.topic} (${b.category})`)
      .join('\n');

    const prompt = `${buildPersonaSystemPrompt(this.moderator)}

Estás abriendo EN VIVO el episodio de esta semana de tu programa de debate sin filtros.

TEMA DEL CAPÍTULO: ${agenda.theme}
LOS BLOQUES DE ESTA NOCHE:
${blocksPreview}
- Y para el cierre: el CARA A CARA FINAL, donde dos panelistas se interpelan con preguntas filosas.

Escribí la APERTURA del programa (7 a 10 oraciones, estilo matinal sensacionalista tipo Tolerancia Cero / Sin Filtros):
1. Saludá con energía al país ("¡Atención, atención, Chile y el mundo!" o similar).
2. Presentá el tema del capítulo con un titular escandaloso (no uses el cintillo literal de ningún bloque).
3. Adelantá los bloques de la noche con picardía y expectativa.
4. Amenazá con el cara a cara final: "dos pesos pesados se van a interpelar sin anestesia".
5. Cerrá la apertura invitando a quedarse: "esto recién empieza".

Respondé ÚNICAMENTE con el texto de la apertura, sin comillas ni prefijos.`;

    let speechText = '';
    try {
      const response = await completeText(prompt, { temperature: 0.95 });
      speechText = response.replace(/```/g, '').trim();
    } catch {
      speechText = '';
    }
    if (!speechText) {
      speechText = `¡Atención, atención, Chile y el mundo! ¡Estamos EN VIVO y esta noche el estudio va a arder! ${agenda.theme}. ¡Cuatro bloques de pura discusión sin filtros, y al final, el cara a cara entre dos pesos pesados! ¡No se vayan, que esto recién empieza!`;
    }

    return {
      turnId,
      blockNumber: agenda.blocks[0]?.blockNumber ?? 1,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'OUTRAGED',
      speechText,
      cameraCue: 'WIDE_PANEL',
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(speechText)
    };
  }

  private createModeratorBajadaTurn(turnId: number, block: DebateBlock): DebateTurn {
    const facts = block.factsSummary ? block.factsSummary.trim().replace(/\.\s*$/, '') : '';
    const contexto = block.contextoHistorico
      ? ` Para los que vienen llegando: ${block.contextoHistorico.trim().replace(/\.\s*$/, '')}.`
      : '';
    const climax = block.climaxIdea
      ? ` Y la pregunta que tiene al país entero mordiéndose las uñas: ${block.climaxIdea.trim()}`
      : '';
    const datos = block.datosExplosivos?.length
      ? ` Y agárrense, porque los datos hacen explotar: ${block.datosExplosivos.map(d => d.trim().replace(/\.\s*$/, '')).join('; ')}.`
      : '';
    const variants = [
      (b: DebateBlock) => `¡Muy bien! Antes de que estalle la discusión, la BAJADA DE NOTICIAS de la semana: ${facts}.${contexto}${datos}${climax} ¡Eso es lo que está pasando, y de esto vamos a hablar con todo!`,
      (b: DebateBlock) => `¡Escuchen esto, porque no es cualquier cosa! Lo que pasó esta semana, en crudo: ${facts}.${contexto}${datos}${climax} ¡Y esto es lo que vamos a desmenuzar ahora mismo, sin compasión!`,
      (b: DebateBlock) => `¡Tomen nota, país! Los hechos de la semana: ${facts}.${contexto}${datos}${climax} ¡De eso vamos a hablar, y aquí nadie se va a hacer el leso!`
    ];
    const text = variants[(block.blockNumber - 1) % variants.length](block);
    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'TALKING',
      speechText: text,
      cameraCue: 'SPEAKER_FOCUS',
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(text)
    };
  }

  private createModeratorQuestionTurn(turnId: number, block: DebateBlock, target: PersonaProfile): DebateTurn {
    const variants = [
      (b: DebateBlock, t: PersonaProfile) => `${t.name}, se lo pregunto directo, sin anestesia y sin vueltas: ${b.moderatorTriggerQuestion} ¡Y no me venga con evasivas, que el país entero está mirando!`,
      (b: DebateBlock, t: PersonaProfile) => `${t.name}, le toca el turno y le toca duro: ${b.moderatorTriggerQuestion} ¡Responda claro, que aquí no hay guion ni notas!`,
      (b: DebateBlock, t: PersonaProfile) => `${t.name}, usted que es de lengua larga: ${b.moderatorTriggerQuestion} ¡Y cuidado con los rodeos, que a mí no me la hacen!`
    ];
    const text = variants[(block.blockNumber - 1) % variants.length](block, target);
    this.currentTension += 15;
    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'SMUG',
      speechText: text,
      cameraCue: 'SPLIT_SCREEN_VERSUS',
      targetSpeakerId: target.id,
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(text)
    };
  }

  private async simulateBlockCrossfire(
    startTurnId: number,
    block: DebateBlock,
    initialSpeaker: PersonaProfile,
    previousTurns: DebateTurn[]
  ): Promise<DebateTurn[]> {
    const crossfireTurns: DebateTurn[] = [];
    let currentSpeaker = initialSpeaker;
    let targetOpponent = this.panelists.find(p => p.id !== currentSpeaker.id) || this.panelists[1];

    const rounds = 4; // 4 intercambios por bloque: más fuego cruzado

    for (let r = 0; r < rounds; r++) {
      const turnId = startTurnId + crossfireTurns.length;
      const historySnippet = previousTurns.concat(crossfireTurns).slice(-3).map(t => `${t.speakerName}: "${t.speechText}"`).join('\n');

      const isInterruption = this.currentTension >= 70 && r > 0;
      const turn = await this.generateSpeakerTurn(turnId, block, currentSpeaker, targetOpponent, historySnippet, isInterruption);
      crossfireTurns.push(turn);

      // El animador llama a la calma si el tono se desmadra (estilo Sin Filtros)
      if (this.currentTension >= 88 && r < rounds - 1) {
        const calmTurn = this.createModeratorCalmTurn(turnId + 1, block);
        crossfireTurns.push(calmTurn);
        this.currentTension = calmTurn.tensionAfterTurn;
      }

      // Alternar adversarios
      const nextOpponent = currentSpeaker;
      const nextSpeaker = targetOpponent;
      currentSpeaker = nextSpeaker;
      targetOpponent = nextOpponent;
    }

    return crossfireTurns;
  }

  private async generateSpeakerTurn(
    turnId: number,
    block: DebateBlock,
    speaker: PersonaProfile,
    opponent: PersonaProfile,
    historySummary: string,
    isInterruption: boolean
  ): Promise<DebateTurn> {
    const prompt = buildTurnPrompt({
      persona: speaker,
      block,
      historySummary,
      isInterruption,
      targetOpponent: opponent,
      currentTension: this.currentTension
    });

    let speechText = '';
    let emotion: EmotionState = isInterruption ? 'INTERRUPTING' : 'ANGRY';
    let cameraCue: CameraCue = isInterruption ? 'SPLIT_SCREEN_VERSUS' : 'SPEAKER_FOCUS';

    try {
      const response = await completeText(prompt, { temperature: 0.85 });
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      speechText = parsed.speechText || this.getFallbackSpeech(speaker, block);
      emotion = parsed.emotion || emotion;
      cameraCue = parsed.cameraCue || cameraCue;
      this.currentTension = Math.min(100, Math.max(0, this.currentTension + (parsed.tensionDelta || 10)));
    } catch {
      speechText = this.getFallbackSpeech(speaker, block);
      this.currentTension = Math.min(100, this.currentTension + 12);
    }

    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: speaker.id,
      speakerName: speaker.name,
      isInterruption,
      emotion,
      speechText,
      cameraCue,
      targetSpeakerId: opponent.id,
      tensionAfterTurn: this.currentTension,
      estimatedDurationSec: this.estimateDuration(speechText)
    };
  }

  private getFallbackSpeech(speaker: PersonaProfile, block: DebateBlock): string {
    const catchphrase = speaker.catchphrases[Math.floor(Math.random() * speaker.catchphrases.length)];
    const trigger = block.personaTriggers[speaker.id] || `sobre ${block.topic}`;
    return `${catchphrase} ¡Lo que ocurre con ${block.topic} demuestra que ${trigger}!`;
  }

  private createModeratorSummaryTurn(turnId: number, block: DebateBlock): DebateTurn {
    const variants = [
      (b: DebateBlock) => `¡YA BASTA! ¡Corten, corten, corten! ¡Se acabó el tiempo de este bloque, pero esto no termina aquí! ${b.topic} dejó el estudio al rojo vivo. ¡Seguimos de inmediato con más debate sin filtros, que esto se pone cada vez más bueno!`,
      (b: DebateBlock) => `¡Basta, basta, basta! ¡Control, cámara al estudio! Tiempo cumplido para este bloque. La pelea por ${b.topic} sigue y nadie se va a quedar tranquilo. ¡Lo que viene promete y mucho!`,
      (b: DebateBlock) => `¡Paren todo, paren todo! ¡Se nos acabó el reloj para este bloque, pero la mecha sigue encendida! ${b.topic} no se quedó aquí. ¡Al siguiente tema, que esto recién se pone bueno!`
    ];
    const text = variants[(block.blockNumber - 1) % variants.length](block);
    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: false,
      emotion: 'OUTRAGED',
      speechText: text,
      cameraCue: 'WIDE_PANEL',
      tensionAfterTurn: 40,
      estimatedDurationSec: this.estimateDuration(text)
    };
  }

  /**
   * El animador llama a la calma cuando el tono se desmadra (estilo Sin Filtros).
   */
  private createModeratorCalmTurn(turnId: number, block: DebateBlock): DebateTurn {
    const variants = [
      `¡Ya, ya, ya! ¡Paren, paren, paren! ¡Cálmense los dos, que esto es EN VIVO, carajo! Respiren... bien. Ahora sí, sigan con su pelea, pero con un poco de elegancia... o como puedan, ¡pero sigan!`,
      `¡Momento, momento, momento! ¡Se me está descontrolando el estudio! ¡Basta de gritos, que el país los está viendo! Tranquilos, tranquilos... ¡listo, ahora sí, continúen nomás, que esto está quedando buenísimo!`,
      `¡Oigan, oigan, oigan! ¡Cálmense, cálmense! ¡Aquí no se van a agarrar a combos, que esto es tele, no cancha! Respiren hondo... ¡y sigan con la discusión, que el rating está por las nubes!`
    ];
    const text = variants[Math.floor(Math.random() * variants.length)];
    return {
      turnId,
      blockNumber: block.blockNumber,
      speakerId: this.moderator.id,
      speakerName: this.moderator.name,
      isInterruption: true,
      emotion: 'OUTRAGED',
      speechText: text,
      cameraCue: 'WIDE_PANEL',
      tensionAfterTurn: Math.max(40, this.currentTension - 15),
      estimatedDurationSec: this.estimateDuration(text)
    };
  }

  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    return Math.max(2, Math.round(wordCount / 2.6)); // ~2.6 palabras por segundo
  }
}
