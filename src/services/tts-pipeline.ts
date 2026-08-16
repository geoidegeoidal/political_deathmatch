try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { AudioStemInfo, VoiceProfileConfig } from '../types/media.js';
import { PersonaProfile, DebateTranscript, EmotionState } from '../types/debate.js';

const require = createRequire(import.meta.url);
const ffmpegStatic: string | null = require('ffmpeg-static');
const ffprobeStatic: { path: string } = require('ffprobe-static');

export interface TtsPipelineOptions {
  transcriptPath?: string;
  voicesPath?: string;
  personasPath?: string;
  stemsDir?: string;
  force?: boolean;
}

const rootDir = process.cwd();

type TtsEngine = 'openai' | 'natural' | 'gtts' | 'sapi' | 'kokoro';

const SAPI_VOICE = 'Microsoft Sabina Desktop';
const SAPI_BASE_PITCH_PERCENT = -6; // Sabina es femenina: los personajes masculinos bajan de tono
const GTTS_TL = 'es-cl';
const GTTS_CHUNK_MAX = 170; // translate_tts falla con textos largos

/** Persona sintética del locutor de comerciales (no está en personas.json: no debate). */
const LOCUTOR_PERSONA: PersonaProfile = {
  id: 'locutor_televentas',
  name: 'Locutor de Televentas',
  alias: 'La Voz de la Oferta',
  role: 'PANELIST',
  tier: 'COMBATIVE_EXTREME',
  archetype: 'Vendedor de Infomercial de Televentas Nocturna',
  ideology: 'El consumo lo arregla todo',
  tone: 'Acelerado, entusiasmado, estridente, imperativo',
  aggressiveness: 9,
  catchphrases: ['¡LLAME YA!', '¡PERO ESPERE, HAY MÁS!'],
  triggers: [],
  avatarAssetId: 'avatar_locutor',
  voiceProfileId: 'voice_es_cl_locutor'
};

/**
 * Sintetiza un stem de audio (.mp3) por cada turno mapeando el voiceProfileId
 * al catálogo de voces, con cadena de motores (el primero disponible gana):
 * 1. natural   - Voz neural de Windows 11 (si está instalada, ej. "Sabina Natural" es-MX)
 * 2. gtts      - Google Translate TTS (es-cl) vía curl + pitch/rate por personaje (ffmpeg)
 * 3. sapi      - Sintetizador de sistema (Microsoft Sabina es-MX)
 * 4. kokoro    - Kokoro-82M local (último recurso: sus voces es suenan extranjeras)
 */
export async function synthesizeEpisodeStems(options: TtsPipelineOptions = {}): Promise<AudioStemInfo[]> {
  const transcriptPath = options.transcriptPath || path.join(rootDir, 'debate_transcript.json');
  const voicesPath = options.voicesPath || path.join(rootDir, 'src', 'config', 'voices.json');
  const personasPath = options.personasPath || path.join(rootDir, 'src', 'config', 'personas.json');
  const stemsDir = options.stemsDir || path.join(rootDir, 'output', 'audio', 'stems');

  const transcript = JSON.parse(await readFile(transcriptPath, 'utf-8')) as DebateTranscript;
  const voices = JSON.parse(await readFile(voicesPath, 'utf-8')) as VoiceProfileConfig[];
  const personas = JSON.parse(await readFile(personasPath, 'utf-8')) as PersonaProfile[];

  const voicesById = new Map(voices.map(v => [v.voiceProfileId, v]));
  const personasById = new Map(personas.map(p => [p.id, p]));

  mkdirSync(stemsDir, { recursive: true });

  const engineChain = detectEngineChain();
  console.log(`[TTS] Cadena de motores: ${engineChain.join(' -> ')}`);
  let engineIdx = 0;

  const stems: AudioStemInfo[] = [];
  for (const turn of transcript.turns) {
    // El locutor de comerciales no está en personas.json: se usa su persona sintética.
    const persona = personasById.get(turn.speakerId) ?? LOCUTOR_PERSONA;
    const voice = voicesById.get(persona.voiceProfileId);
    if (!voice) {
      throw new Error(`Voz no configurada para voiceProfileId "${persona.voiceProfileId}" (turno ${turn.turnId}).`);
    }

    const fileName = `turn_${String(turn.turnId).padStart(3, '0')}.mp3`;
    const filePath = path.join(stemsDir, fileName);

    if (!options.force && existsSync(filePath)) {
      console.log(`[TTS] ${fileName} ya existe, reutilizando (${probeDurationMs(filePath)}ms).`);
      stems.push(buildStem(turn, persona, fileName, filePath, probeDurationMs(filePath)));
      continue;
    }

    console.log(`[TTS] Sintetizando turno ${turn.turnId}/${transcript.turns.length} (${turn.speakerName})...`);
    let synthesized = false;

    while (engineIdx < engineChain.length) {
      const engine = engineChain[engineIdx];
      try {
        await synthesizeWithEngine(engine, turn.speechText, filePath, voice, persona, turn.emotion);
        synthesized = true;
        break;
      } catch (err) {
        console.warn(`[TTS] Motor "${engine}" falló (${err instanceof Error ? err.message : String(err)}). Probando siguiente...`);
        engineIdx++;
      }
    }

    if (!synthesized) {
      throw new Error(`Ningún motor TTS pudo sintetizar el turno ${turn.turnId}.`);
    }

    const durationMs = probeDurationMs(filePath);
    console.log(`[TTS] -> ${fileName} listo (${(durationMs / 1000).toFixed(1)}s).`);

    stems.push(buildStem(turn, persona, fileName, filePath, durationMs));
  }

  return stems;
}

function buildStem(
  turn: DebateTranscript['turns'][number],
  persona: PersonaProfile,
  fileName: string,
  filePath: string,
  durationMs: number
): AudioStemInfo {
  return {
    turnId: turn.turnId,
    blockNumber: turn.blockNumber,
    speakerId: turn.speakerId,
    speakerName: turn.speakerName,
    voiceProfileId: persona.voiceProfileId,
    audioFileName: fileName,
    audioFilePath: filePath,
    durationMs,
    startMs: 0,
    endMs: 0,
    isInterruption: turn.isInterruption,
    duckingApplied: false,
    tensionAfterTurn: turn.tensionAfterTurn
  };
}

function detectEngineChain(): TtsEngine[] {
  const chain: TtsEngine[] = [];
  if (process.env.OPENAI_API_KEY) chain.push('openai');
  if (detectNaturalVoice()) chain.push('natural');
  chain.push('gtts', 'sapi', 'kokoro');
  return chain;
}

/** Busca una voz natural (neural) de Windows con español, ej. "Sabina Online (Natural) - Spanish (Mexico)". */
function detectNaturalVoice(): string | null {
  const res = spawnSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    'Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ($s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -match "Natural" -and ($_.VoiceInfo.Culture -match "^es") } | ForEach-Object { $_.VoiceInfo.Name }) -join "|"'
  ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const names = (res.stdout || '').trim();
  return names || null;
}

async function synthesizeWithEngine(engine: TtsEngine, text: string, mp3Path: string, voice: VoiceProfileConfig, persona: PersonaProfile, emotion: EmotionState): Promise<void> {
  switch (engine) {
    case 'openai':
      return synthesizeWithOpenai(text, mp3Path, voice, persona, emotion);
    case 'natural':
      return synthesizeWithNatural(text, mp3Path, voice);
    case 'gtts':
      return synthesizeWithGtts(text, mp3Path, voice);
    case 'sapi':
      return synthesizeWithSystemTts(text, mp3Path, voice);
    case 'kokoro':
      return synthesizeWithKokoro(text, mp3Path, voice);
  }
}

/** Directiva de emoción en español para las instrucciones del TTS (varía cadencia y tono por turno). */
const EMOTION_DIRECTIVES: Record<EmotionState, string> = {
  CALM: 'Habla con calma y seguridad, pausado.',
  TALKING: 'Habla con energía y entusiasmo, ritmo vivo.',
  ANGRY: 'Habla con furia contenida, mordiendo las palabras, subiendo el volumen.',
  OUTRAGED: 'Habla INDIGNADO, casi gritando, con el tono al borde de estallar.',
  SMUG: 'Habla con arrogancia burlona, lentamente, saboreando cada palabra.',
  MOCKING: 'Habla con sarcasmo y burla abierta, riéndote del contrincante entre frases.',
  INTERRUPTING: 'Habla cortante, impaciente y a toda velocidad, pisando la palabra del otro.'
};

const OPENAI_TTS_MODEL = 'gpt-4o-mini-tts';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

function openaiVoiceFor(persona: PersonaProfile, voice: VoiceProfileConfig): string {
  if (voice.openaiVoice) return voice.openaiVoice;
  if (voice.gender === 'FEMALE') return 'nova';
  if (persona.aggressiveness >= 9) return 'onyx';
  if (persona.aggressiveness >= 7) return 'echo';
  return 'alloy';
}

function openaiInstructionsFor(persona: PersonaProfile, voice: VoiceProfileConfig, emotion: EmotionState): string {
  const cadence =
    persona.tier === 'INTELLECTUAL_SERIOUS'
      ? 'Habla con cadencia pausada, sobria y reflexiva, sin apresurarte.'
      : persona.aggressiveness >= 8
        ? 'Habla con ritmo vivo y agresivo, sube el tono cuando te indignas, remata las frases con energía y sin ceder.'
        : 'Habla con ritmo natural de conversación, enérgico pero controlado.';
  const rateHint = (() => {
    const pct = parseInt(voice.rateOffset || '0', 10);
    if (pct > 5) return 'Habla un poco más rápido de lo normal.';
    if (pct < -5) return 'Habla un poco más lento de lo normal.';
    return '';
  })();
  return `Habla en español con acento chileno. ${persona.tone} ${cadence} ${rateHint} EMOCIÓN DE ESTE TURNO: ${EMOTION_DIRECTIVES[emotion]} Eres ${persona.archetype}, no lo olvides en la entonación.`;
}

/** OpenAI gpt-4o-mini-tts: voz por personaje + instrucciones de cadencia (calidad YouTube). */
async function synthesizeWithOpenai(text: string, mp3Path: string, voice: VoiceProfileConfig, persona: PersonaProfile, emotion: EmotionState): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada.');

  // Se sintetiza a un temporal y se post-procesa pitch/rate por personaje
  // (los offsets de voices.json dan identidad física a cada voz).
  const rawPath = mp3Path.replace(/\.mp3$/, '.openai_raw.mp3');

  const res = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      input: text,
      voice: openaiVoiceFor(persona, voice),
      instructions: openaiInstructionsFor(persona, voice, emotion),
      response_format: 'mp3'
    }),
    signal: AbortSignal.timeout(120_000)
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`OpenAI TTS error ${res.status}: ${body}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('OpenAI TTS devolvió audio vacío.');
  await writeFile(rawPath, buf);
  applyPitchAndRate(rawPath, mp3Path, voice);
}

/** Voz neural de Windows 11: rate nativo + pitch shift leve por ffmpeg. */
function synthesizeWithNatural(text: string, mp3Path: string, voice: VoiceProfileConfig): void {
  const voiceName = detectNaturalVoice();
  if (!voiceName) throw new Error('No hay voz natural es instalada.');
  const wavPath = mp3Path.replace(/\.mp3$/, '.natural.wav');
  const script = [
    'Add-Type -AssemblyName System.Speech;',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
    `$s.SelectVoice('${voiceName}');`,
    `$s.Rate = ${sapiRate(voice.rateOffset)};`,
    `$s.SetOutputToWaveFile('${wavPath}');`,
    '$s.Speak([Console]::In.ReadToEnd());'
  ].join(' ');

  const res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    input: text,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  if (res.status !== 0) {
    throw new Error(`Natural voice falló: ${res.stderr}`);
  }

  applyPitchAndRate(wavPath, mp3Path, voice);
}

/** Google Translate TTS (es-cl): texto en chunks <=170 chars, concat + pitch/rate. */
function synthesizeWithGtts(text: string, mp3Path: string, voice: VoiceProfileConfig): void {
  const chunks = splitForGtts(text, GTTS_CHUNK_MAX);
  const chunkPaths = chunks.map((chunk, i) => mp3Path.replace(/\.mp3$/, `.gtts_${i}.mp3`));

  chunks.forEach((chunk, i) => {
    downloadGttsChunk(chunk, chunkPaths[i], GTTS_CHUNK_MAX);
  });

  if (chunks.length === 1) {
    applyPitchAndRate(chunkPaths[0], mp3Path, voice);
  } else {
    const concatPath = mp3Path.replace(/\.mp3$/, '.concat.mp3');
    const inputs: string[] = [];
    const parts: string[] = [];
    chunkPaths.forEach((c, i) => {
      inputs.push('-i', c);
      parts.push(`[${i}:a]`);
    });
    const concat = spawnSync(ffmpegBin(), [
      '-y', ...inputs,
      '-filter_complex', `${parts.join('')}concat=n=${chunks.length}:v=0:a=1[out]`,
      '-map', '[out]', '-c:a', 'libmp3lame', '-qscale:a', '4', concatPath
    ], { encoding: 'utf8' });
    if (concat.status !== 0) {
      throw new Error(`gTTS concat falló: ${concat.stderr}`);
    }
    applyPitchAndRate(concatPath, mp3Path, voice);
    chunkPaths.forEach(c => spawnSync('cmd', ['/c', 'del', '/q', c]));
  }
}

function splitForGtts(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current) {
      chunks.push(current);
      current = '';
    }
    current += s;
    if (current.length > maxLen) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Descarga un chunk de gTTS con reintentos: si el mp3 llega inválido, se divide el chunk a la mitad. */
function downloadGttsChunk(chunk: string, outPath: string, maxLen: number, depth = 0): void {
  if (chunk.length > maxLen) {
    const mid = Math.ceil(chunk.length / 2);
    downloadGttsChunk(chunk.slice(0, mid), outPath.replace(/\.mp3$/, '_a.mp3'), maxLen, depth + 1);
    downloadGttsChunk(chunk.slice(mid), outPath.replace(/\.mp3$/, '_b.mp3'), maxLen, depth + 1);
    mergeChunks([outPath.replace(/\.mp3$/, '_a.mp3'), outPath.replace(/\.mp3$/, '_b.mp3')], outPath);
    return;
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${GTTS_TL}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
  const res = spawnSync('curl.exe', ['-s', '-o', outPath, '--max-time', '60', url], { encoding: 'utf8' });
  const valid = res.status === 0 && existsSync(outPath) && fileSize(outPath) >= 500 && isValidMp3(outPath);

  if (!valid) {
    if (depth < 2) {
      const mid = Math.ceil(chunk.length / 2);
      downloadGttsChunk(chunk.slice(0, mid), outPath.replace(/\.mp3$/, '_a.mp3'), maxLen, depth + 1);
      downloadGttsChunk(chunk.slice(mid), outPath.replace(/\.mp3$/, '_b.mp3'), maxLen, depth + 1);
      mergeChunks([outPath.replace(/\.mp3$/, '_a.mp3'), outPath.replace(/\.mp3$/, '_b.mp3')], outPath);
      return;
    }
    throw new Error(`gTTS falló tras reintentos (${res.status}).`);
  }
}

function mergeChunks(srcPaths: string[], outPath: string): void {
  const inputs: string[] = [];
  const parts: string[] = [];
  srcPaths.forEach((c, i) => {
    inputs.push('-i', c);
    parts.push(`[${i}:a]`);
  });
  const concat = spawnSync(ffmpegBin(), [
    '-y', ...inputs,
    '-filter_complex', `${parts.join('')}concat=n=${srcPaths.length}:v=0:a=1[out]`,
    '-map', '[out]', '-c:a', 'libmp3lame', '-qscale:a', '4', outPath
  ], { encoding: 'utf8' });
  if (concat.status !== 0) {
    throw new Error(`concat falló: ${concat.stderr}`);
  }
  srcPaths.forEach(c => spawnSync('cmd', ['/c', 'del', '/q', c]));
}

function isValidMp3(mp3Path: string): boolean {
  const res = spawnSync(ffprobeStatic.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', mp3Path], { encoding: 'utf8' });
  if (res.status !== 0) return false;
  try {
    const parsed = JSON.parse(res.stdout) as { format?: { duration?: string } };
    return parseFloat(parsed?.format?.duration || '0') > 0.3;
  } catch {
    return false;
  }
}

/** SAPI de sistema (Microsoft Sabina es-MX). */
function synthesizeWithSystemTts(text: string, mp3Path: string, voice: VoiceProfileConfig): void {
  const wavPath = mp3Path.replace(/\.mp3$/, '.sapi.wav');
  const script = [
    'Add-Type -AssemblyName System.Speech;',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
    `$s.SelectVoice('${SAPI_VOICE}');`,
    `$s.Rate = ${sapiRate(voice.rateOffset)};`,
    `$s.SetOutputToWaveFile('${wavPath}');`,
    '$s.Speak([Console]::In.ReadToEnd());'
  ].join(' ');

  const res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    input: text,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  if (res.status !== 0) {
    throw new Error(`SAPI falló: ${res.stderr}`);
  }

  applyPitchAndRate(wavPath, mp3Path, voice);
}

/** Kokoro-82M local (último recurso): voces es = em_alex/em_santa (M), ef_dora (F). */
let kokoroInstance: unknown = null;

async function synthesizeWithKokoro(text: string, mp3Path: string, voice: VoiceProfileConfig): Promise<void> {
  const { KokoroTTS } = await import('kokoro-js');
  const { env } = await import('@huggingface/transformers');
  if (!kokoroInstance) {
    env.cacheDir = path.join(rootDir, 'models', 'kokoro-cache');
    const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
    // kokoro-js solo valida voces en inglés (map Object.freeze): saltamos la validación.
    (tts as { _validate_voice?: (v: string) => string })._validate_voice = (v: string) => v;
    kokoroInstance = tts;
  }
  const kokoroVoice = voice.gender === 'FEMALE' ? 'ef_dora' : 'em_alex';
  const speed = 1 + (parseInt(voice.rateOffset || '0', 10) || 0) / 100;
  const wavPath = mp3Path.replace(/\.mp3$/, '.kokoro.wav');
  const audio = await (kokoroInstance as { generate: (t: string, o: { voice: string; speed: number }) => Promise<{ toWav: () => ArrayBuffer }> })
    .generate(text, { voice: kokoroVoice, speed });
  const wavDir = path.dirname(wavPath);
  mkdirSync(wavDir, { recursive: true });
  const { writeFileSync } = await import('fs');
  writeFileSync(wavPath, Buffer.from(audio.toWav()));
  applyPitchAndRate(wavPath, mp3Path, voice);
}

/** Pitch (asetrate) + rate (atempo) por personaje, aplicado sobre audio 44100Hz. */
function applyPitchAndRate(srcPath: string, mp3Path: string, voice: VoiceProfileConfig): void {
  const pitchHz = parseInt(voice.pitchOffset || '0', 10);
  const pitchPercent = Math.round(pitchHz * 0.75);
  const k = Math.min(1.25, Math.max(0.8, 1 + pitchPercent / 100)).toFixed(4);
  const ratePct = parseInt(voice.rateOffset || '0', 10);
  const r = Math.min(1.5, Math.max(0.67, 1 + ratePct / 100)).toFixed(4);

  const conv = spawnSync(ffmpegBin(), [
    '-y', '-i', srcPath,
    '-af', `aresample=44100,asetrate=44100*${k},aresample=44100,atempo=${(1 / parseFloat(k)).toFixed(4)},atempo=${r}`,
    '-codec:a', 'libmp3lame', '-qscale:a', '4', mp3Path
  ], { encoding: 'utf8' });
  if (conv.status !== 0) {
    throw new Error(`ffmpeg post-proceso falló: ${conv.stderr}`);
  }
  spawnSync('cmd', ['/c', 'del', '/q', srcPath]);
}

function sapiRate(rateOffset: string | undefined): number {
  const pct = parseInt(rateOffset || '0', 10);
  return Math.max(-10, Math.min(10, Math.round(pct / 10)));
}

function fileSize(filePath: string): number {
  const { statSync } = require('fs') as typeof import('fs');
  return statSync(filePath).size;
}

export function probeDurationMs(audioPath: string): number {
  const res = spawnSync(ffprobeStatic.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', audioPath], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`ffprobe falló para ${audioPath}: ${res.stderr}`);
  }
  const parsed = JSON.parse(res.stdout) as { format?: { duration?: string } };
  return Math.round(parseFloat(parsed?.format?.duration || '0') * 1000);
}

export function ffmpegBin(): string {
  if (!ffmpegStatic) throw new Error('ffmpeg-static no resolvió un binario.');
  return ffmpegStatic;
}
