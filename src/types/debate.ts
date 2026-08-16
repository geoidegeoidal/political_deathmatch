export type EmotionState = 'CALM' | 'TALKING' | 'ANGRY' | 'OUTRAGED' | 'SMUG' | 'MOCKING' | 'INTERRUPTING';

export type CameraCue = 'SPEAKER_FOCUS' | 'SPLIT_SCREEN_VERSUS' | 'WIDE_PANEL' | 'REACTION_SHOT';

export interface PersonaProfile {
  id: string;
  name: string;
  role: 'MODERATOR' | 'PANELIST';
  archetype: string;
  ideology: string;
  tone: string;
  aggressiveness: number; // 1-10
  catchphrases: string[];
  triggers: string[];
  avatarAssetId: string;
  voiceProfileId: string;
}

export interface DebateTurn {
  turnId: number;
  blockNumber: number;
  speakerId: string;
  speakerName: string;
  isInterruption: boolean;
  emotion: EmotionState;
  speechText: string;
  cameraCue: CameraCue;
  targetSpeakerId?: string;
  tensionAfterTurn: number;
  estimatedDurationSec: number;
}

export interface DebateTranscript {
  episodeId: string;
  title: string;
  generatedAt: string;
  totalDurationSec: number;
  participants: PersonaProfile[];
  turns: DebateTurn[];
}

export type FsmState =
  | 'INTRO_BLOCK'
  | 'MODERATOR_QUESTION'
  | 'PANEL_INTERVENTION'
  | 'CROSSFIRE'
  | 'INTERRUPTION'
  | 'MODERATOR_CUT'
  | 'BLOCK_SUMMARY';
