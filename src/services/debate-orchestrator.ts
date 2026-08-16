import { PersonaProfile, DebateTurn, DebateTranscript, FsmState, EmotionState, CameraCue } from '../types/debate.js';
import { WeeklyAgenda, DebateBlock } from '../types/editorial.js';
import { buildPersonaSystemPrompt, buildTurnPrompt } from '../prompts/persona-debate.prompt.js';
import { completeText } from './llm-client.js';

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

    for (const block of agenda.blocks) {
      console.log(`\n📺 [BLOQUE ${block.blockNumber}] ${block.topic} (${block.category})`);
      this.currentTension = 35; // Reset de tensión base por bloque

      // 1. INTRO_BLOCK: Moderador presenta el tema y lee el cintillo
      const introTurn = this.createModeratorIntroTurn(turnCounter++, block);
      turns.push(introTurn);

      // 2. MODERATOR_QUESTION: Pregunta provocadora a un panelista inicial
      const targetPanelist = this.selectTargetPanelistForBlock(block);
      const questionTurn = this.createModeratorQuestionTurn(turnCounter++, block, targetPanelist);
      turns.push(questionTurn);

      // 3. Secuencia de debate y réplicas entre panelistas
      const blockTurns = await this.simulateBlockCrossfire(turnCounter, block, targetPanelist, turns);
      turns.push(...blockTurns);
      turnCounter += blockTurns.length;

      // 4. MODERATOR_CUT / BLOCK_SUMMARY
      const cutTurn = this.createModeratorSummaryTurn(turnCounter++, block);
      turns.push(cutTurn);
    }

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

  private selectTargetPanelistForBlock(block: DebateBlock): PersonaProfile {
    // Si el bloque es Farándula, apuntar primero a Brayan o a Kaspar Mork
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
    const text = `¡Atención a todos en sus casas! Entramos al bloque ${block.blockNumber}. Cintillo urgente en pantalla: "${block.headlineGC}". Vamos a hablar de ${block.topic}.`;
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
    const text = `${target.name}, la pregunta es directa y sin rodeos: ${block.moderatorTriggerQuestion}`;
    this.currentTension += 10;
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

    const rounds = 3; // 3 intercambios por bloque

    for (let r = 0; r < rounds; r++) {
      const turnId = startTurnId + crossfireTurns.length;
      const historySnippet = previousTurns.concat(crossfireTurns).slice(-3).map(t => `${t.speakerName}: "${t.speechText}"`).join('\n');

      const isInterruption = this.currentTension >= 70 && r > 0;
      const turn = await this.generateSpeakerTurn(turnId, block, currentSpeaker, targetOpponent, historySnippet, isInterruption);
      crossfireTurns.push(turn);

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
    const text = `¡Señores, por favor, mantengamos la calma! Se nos acaba el tiempo de este bloque. ¡Vamos a una breve pausa y ya volvemos con más debate sin filtros!`;
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

  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    return Math.max(2, Math.round(wordCount / 2.6)); // ~2.6 palabras por segundo
  }
}
