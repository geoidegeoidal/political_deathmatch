import { CameraCue, EmotionState } from './debate.js';

export interface VoiceProfileConfig {
  voiceProfileId: string;
  provider: 'edge-tts' | 'kokoro' | 'piper' | 'system';
  voiceName: string; // e.g. "es-CL-LorenzoNeural", "es-VE-SebastianNeural"
  locale: string;
  gender: 'MALE' | 'FEMALE';
  rateOffset?: string; // e.g. "+10%", "-5%"
  pitchOffset?: string; // e.g. "+5Hz", "-10Hz"
  volumeOffset?: string;
  openaiVoice?: string; // Timbre OpenAI (alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse)
  description: string;
}

export interface AudioStemInfo {
  turnId: number;
  blockNumber: number;
  speakerId: string;
  speakerName: string;
  voiceProfileId: string;
  audioFileName: string;
  audioFilePath: string;
  durationMs: number;
  startMs: number;
  endMs: number;
  isInterruption: boolean;
  duckingApplied: boolean;
}

export interface AudioTimeline {
  episodeId: string;
  title: string;
  totalDurationMs: number;
  totalStems: number;
  stems: AudioStemInfo[];
  masterAudioPath: string;
  generatedAt: string;
}

export interface VideoRenderConfig {
  width: number; // 1920
  height: number; // 1080
  fps: number; // 30
  backgroundColor: string;
  primaryColor: string; // Red / Sensationalist TV
  accentColor: string;
  fontFamily: string;
  showTensionMeter: boolean;
  showTicker: boolean;
  outputDir: string;
}

export interface VideoFrameState {
  currentTurnId: number;
  blockNumber: number;
  topicTitle: string;
  headlineGC: string;
  speakerName: string;
  speakerAlias: string;
  activeSpeakerId: string;
  targetSpeakerId?: string;
  cameraCue: CameraCue;
  emotion: EmotionState;
  tensionScore: number;
  elapsedTimeMs: number;
  totalDurationMs: number;
  isInterruption: boolean;
}
