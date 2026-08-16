import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { AudioStemInfo, AudioTimeline } from '../types/media.js';
import { DebateTranscript } from '../types/debate.js';
import { ffmpegBin } from './tts-pipeline.js';

export interface AudioMixerOptions {
  stemsDir?: string;
  timelinePath?: string;
  masterPath?: string;
  sfxDir?: string;
  musicDir?: string;
  overlapMs?: number;
  duckVolume?: number;
}

const rootDir = process.cwd();
const BLOCK_GONG_FREQ = 392; // Sol4 - cortinilla tipo gong televisivo

/** Duración de la intro del programa (según design 005: 4 tarjetas = 15s). */
export const INTRO_OFFSET_MS = 15000;

/** Volúmenes de la matriz de mezcla del design 005 (dB FS -> factor lineal). */
const BED_VOL_BASE = 0.08; // -22dB
const BED_VOL_DUCK = 0.04; // -28dB con voz activa
const BED_VOL_CLIMAX = 0.12; // -18dB en tensión alta (>=75)
const STINGER_BLOCK_VOL = 0.31; // -10dB
const STINGER_DUEL_VOL = 0.4; // -8dB

/**
 * Calcula la línea de tiempo exacta: coloca cada stem en orden; si el turno es
 * una interrupción, entra `overlapMs` antes de que termine el turno anterior
 * (pisada de palabra) y ese turno queda marcado para ducking.
 * Todos los stems se desplazan `INTRO_OFFSET_MS` para dejar espacio a la intro.
 */
export function computeTimeline(stems: AudioStemInfo[], options: AudioMixerOptions = {}): AudioTimeline {
  const overlapMs = options.overlapMs ?? 1500;
  const ordered = [...stems].sort((a, b) => a.turnId - b.turnId);

  let cursorMs = INTRO_OFFSET_MS;
  let previous: AudioStemInfo | null = null;

  for (const stem of ordered) {
    if (stem.isInterruption && previous) {
      stem.startMs = Math.max(previous.startMs + 200, previous.endMs - overlapMs);
      previous.duckingApplied = true;
    } else {
      stem.startMs = cursorMs;
    }
    stem.endMs = stem.startMs + stem.durationMs;
    cursorMs = Math.max(cursorMs, stem.endMs);
    previous = stem;
  }

  return {
    episodeId: '',
    title: '',
    totalDurationMs: cursorMs,
    totalStems: ordered.length,
    stems: ordered,
    masterAudioPath: '',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Mezcla todos los stems (con ducking y adelanto de interrupciones) y efectos
 * de estudio (gong de apertura de bloque) en una pista master WAV.
 */
export async function mixMasterAudio(
  timeline: AudioTimeline,
  transcript: DebateTranscript,
  blockStartTurnIds: number[],
  options: AudioMixerOptions = {}
): Promise<string> {
  const stemsDir = options.stemsDir || path.join(rootDir, 'output', 'audio', 'stems');
  const sfxDir = options.sfxDir || path.join(rootDir, 'output', 'audio', 'sfx');
  const masterPath = options.masterPath || path.join(rootDir, 'output', 'audio', 'master_audio.wav');

  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(path.dirname(masterPath), { recursive: true });

  const gongPath = path.join(sfxDir, 'gong.wav');
  generateGong(gongPath);

  const stems = timeline.stems;
  const overlapMs = options.overlapMs ?? 1500;
  const duckVolume = options.duckVolume ?? 0.4;

  const inputs: string[] = [];
  const filterParts: string[] = [];

  stems.forEach((stem, i) => {
    inputs.push('-i', stem.audioFilePath);
    // adelay toma MILISEGUNDOS (adelay=7811 = 7.811s). Los segundos decimales rompen la sincronización.
    const startMsArg = String(stem.startMs);
    let chain = `aresample=44100,aformat=channel_layouts=stereo,adelay=${startMsArg}|${startMsArg}`;
    if (stem.duckingApplied) {
      const duckStartSec = ((stem.endMs - overlapMs) / 1000).toFixed(3);
      const endSec = (stem.endMs / 1000).toFixed(3);
      chain += `,volume='if(lt(t,${duckStartSec}),1,${duckVolume})':eval=frame`;
    }
    filterParts.push(`[${i}:a]${chain}[stem${i}]`);
  });

  const gongRefs: string[] = [];
  let gongCounter = 0;
  stems.forEach((stem) => {
    if (!blockStartTurnIds.includes(stem.turnId)) return;
    const idx = stems.length + gongCounter;
    gongCounter++;
    inputs.push('-i', gongPath);
    const startMsArg = String(stem.startMs);
    filterParts.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${startMsArg}|${startMsArg}[gong${gongCounter - 1}]`);
    gongRefs.push(`[gong${gongCounter - 1}]`);
  });

  // ---- MÚSICA (design 005): intro, cama ambiental con ducking, stingers ----
  const musicDir = options.musicDir || path.join(rootDir, 'output', 'audio', 'music');
  const musicRefs: string[] = [];
  const nextInput = () => stems.length + gongCounter + musicRefs.length;

  // 1. Tema de apertura: 0-14.5s a volumen completo, fade out 1.5s
  const introPath = path.join(musicDir, 'intro_theme.wav');
  if (existsSync(introPath)) {
    inputs.push('-i', introPath);
    filterParts.push(
      `[${nextInput()}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.0,afade=t=out:st=13:d=1.5[intro]`
    );
    musicRefs.push('[intro]');
  }

  // 2. Cama ambiental: loop continuo, volumen por tramos (0.04 con voz, 0.12 en clímax, 0.08 base)
  const bedPath = path.join(musicDir, 'bed_ambient.wav');
  if (existsSync(bedPath)) {
    const totalSec = (timeline.totalDurationMs / 1000).toFixed(3);
    inputs.push('-stream_loop', '-1', '-t', totalSec, '-i', bedPath);
    let bedExpr = String(BED_VOL_BASE);
    const tensionStems = stems.filter(s => (s.tensionAfterTurn ?? 0) >= 75);
    const duckStems = stems.filter(s => (s.tensionAfterTurn ?? 0) < 75);
    for (const s of [...tensionStems, ...duckStems].sort((a, b) => b.startMs - a.startMs)) {
      bedExpr = `if(between(t,${(s.startMs / 1000).toFixed(3)},${(s.endMs / 1000).toFixed(3)}),${(s.tensionAfterTurn ?? 0) >= 75 ? BED_VOL_CLIMAX : BED_VOL_DUCK},${bedExpr})`;
    }
    filterParts.push(
      `[${nextInput()}:a]aresample=44100,aformat=channel_layouts=stereo,volume='${bedExpr}':eval=frame[bed]`
    );
    musicRefs.push('[bed]');
  }

  // 3. Stinger de bloque: al inicio de cada bloque (-10dB)
  const stingerPath = path.join(musicDir, 'stinger_block.wav');
  if (existsSync(stingerPath)) {
    stems.forEach((stem) => {
      if (!blockStartTurnIds.includes(stem.turnId)) return;
      inputs.push('-i', stingerPath);
      const idx = nextInput();
      filterParts.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${STINGER_BLOCK_VOL},adelay=${stem.startMs}|${stem.startMs}[stb${idx}]`);
      musicRefs.push(`[stb${idx}]`);
    });
  }

  // 4. Stinger del duelo final: al inicio del cara a cara (blockNumber 0) (-8dB)
  const duelPath = path.join(musicDir, 'stinger_duel.wav');
  const duelStart = stems.find(s => s.blockNumber === 0);
  if (existsSync(duelPath) && duelStart) {
    inputs.push('-i', duelPath);
    const idx = nextInput();
    filterParts.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${STINGER_DUEL_VOL},adelay=${duelStart.startMs}|${duelStart.startMs}[stduel]`);
    musicRefs.push('[stduel]');
  }

  const mixInputs = stems.map((_, i) => `[stem${i}]`).concat(gongRefs, musicRefs).join('');
  filterParts.push(`${mixInputs}amix=inputs=${stems.length + gongRefs.length + musicRefs.length}:normalize=0:duration=longest[out]`);

  const args = ['-y', ...inputs, '-filter_complex', filterParts.join(';'), '-map', '[out]', masterPath];

  console.log('[MIX] Mezclando pista master con ffmpeg...');
  const res = spawnSync(ffmpegBin(), args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(`ffmpeg mix falló:\n${res.stderr}`);
  }

  timeline.masterAudioPath = masterPath;
  return masterPath;
}

function generateGong(gongPath: string): void {
  if (existsSync(gongPath)) return;
  const expr = `aevalsrc=0.45*sin(2*PI*${BLOCK_GONG_FREQ}*t)*exp(-2.2*t):s=44100:d=2.5`;
  const res = spawnSync(ffmpegBin(), ['-y', '-f', 'lavfi', '-i', expr, '-c:a', 'pcm_s16le', gongPath], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`ffmpeg gong falló:\n${res.stderr}`);
  }
}

export async function exportTimeline(timeline: AudioTimeline, timelinePath: string): Promise<void> {
  await writeFile(timelinePath, JSON.stringify(timeline, null, 2), 'utf-8');
}
