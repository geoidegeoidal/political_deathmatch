#!/usr/bin/env node
import { mkdirSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import sharp from 'sharp';
import { DebateTranscript, PersonaProfile } from '../types/debate.js';
import { AudioTimeline, AudioStemInfo, VideoFrameState } from '../types/media.js';
import { VideoComposer } from '../services/video-composer.js';
import { ffmpegBin } from '../services/tts-pipeline.js';

const rootDir = process.cwd();

interface BlockContext {
  blockNumber: number;
  topicTitle: string;
  headlineGC: string;
}

interface Interval {
  startMs: number;
  endMs: number;
  turnId: number;
}

async function main() {
  console.log('================================================================');
  console.log('🎬  POLITICAL DEATHMATCH - RENDER DE VIDEO 1080p (ESTUDIO TV)');
  console.log('================================================================');

  const transcriptPath = path.join(rootDir, 'debate_transcript.json');
  const timelinePath = path.join(rootDir, 'output', 'audio', 'audio_timeline.json');
  const personasPath = path.join(rootDir, 'src', 'config', 'personas.json');
  const masterPath = path.join(rootDir, 'output', 'audio', 'master_audio.wav');
  const framesDir = path.join(rootDir, 'output', 'video', 'frames');
  const videoOnlyPath = path.join(rootDir, 'output', 'video', 'video_only.mp4');
  const finalPath = path.join(rootDir, 'output', 'episode_1080p.mp4');

  console.log(`\n[RENDER] 1. Cargando guion, timeline y personajes...`);
  const transcript = JSON.parse(await readFile(transcriptPath, 'utf-8')) as DebateTranscript;
  const timeline = JSON.parse(await readFile(timelinePath, 'utf-8')) as AudioTimeline;
  const personas = JSON.parse(await readFile(personasPath, 'utf-8')) as PersonaProfile[];
  const personasById = new Map(personas.map(p => [p.id, p]));

  if (!existsSync(masterPath)) {
    throw new Error('No existe master_audio.wav. Ejecutá primero: npx tsx src/cli/render-audio.ts');
  }

  console.log(`[RENDER] 2. Generando frames SVG -> PNG por turno (${transcript.turns.length})...`);
  mkdirSync(framesDir, { recursive: true });

  const composer = new VideoComposer(personas);
  const blockContext = buildBlockContexts(transcript);
  const stemByTurn = new Map(timeline.stems.map(s => [s.turnId, s]));
  const framePaths = new Map<number, string>();

  for (const turn of transcript.turns) {
    const stem = stemByTurn.get(turn.turnId);
    if (!stem) continue;
    const ctx = blockContext.get(turn.turnId);
    const persona = personasById.get(turn.speakerId);

    const state: VideoFrameState = {
      currentTurnId: turn.turnId,
      blockNumber: turn.blockNumber,
      topicTitle: ctx?.topicTitle || transcript.title,
      headlineGC: ctx?.headlineGC || 'POLITICAL DEATHMATCH EN VIVO',
      speakerName: turn.speakerName,
      speakerAlias: persona?.alias || '',
      activeSpeakerId: turn.speakerId,
      targetSpeakerId: turn.targetSpeakerId,
      cameraCue: turn.cameraCue,
      emotion: turn.emotion,
      tensionScore: turn.tensionAfterTurn,
      elapsedTimeMs: stem.startMs,
      totalDurationMs: timeline.totalDurationMs,
      isInterruption: turn.isInterruption
    };

    const framePath = path.join(framesDir, `frame_${String(turn.turnId).padStart(3, '0')}.png`);
    const svg = composer.generateFrameSvg(state);
    await sharp(Buffer.from(svg)).png().toFile(framePath);
    framePaths.set(turn.turnId, framePath);
    console.log(`   -> frame_${String(turn.turnId).padStart(3, '0')}.png (${turn.speakerName}, ${turn.cameraCue}, tension ${turn.tensionAfterTurn})`);
  }

  console.log(`\n[RENDER] 3. Generando tarjetas de intro (4, ~15s con Ken Burns)...`);
  const agendaPath = path.join(rootDir, 'weekly_agenda.json');
  let agendaTopics: string[] = [];
  try {
    const agenda = JSON.parse(await readFile(agendaPath, 'utf-8')) as { blocks?: { topic?: string }[] };
    agendaTopics = (agenda.blocks || []).map(b => b.topic || '').filter(Boolean);
  } catch {
    console.warn('[RENDER] weekly_agenda.json no encontrado; intro sin cartelera.');
  }
  const introDurations = [3.5, 4, 3.5, 4]; // 15s
  const introPaths: string[] = [];
  for (let c = 0; c < 4; c++) {
    const svg = composer.renderIntroCardSvg(c, agendaTopics);
    const p = path.join(framesDir, `intro_${c}.png`);
    await sharp(Buffer.from(svg)).png().toFile(p);
    introPaths.push(p);
    console.log(`   -> intro_${c}.png (${introDurations[c]}s)`);
  }

  console.log(`\n[RENDER] 4. Componiendo video (intro + cortes por turno, 30fps, sincronizado al timeline)...`);
  const intervals = buildIntervals(timeline.stems);

  const args: string[] = ['-y'];
  // Inputs de la intro: frame único + zoompan genera exactamente dur*30 frames
  const introInputs: string[] = [];
  introPaths.forEach((p, i) => {
    args.push('-i', p);
    introInputs.push(`[${i}:v]zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(introDurations[i] * 30)}:s=1920x1080:fps=30[intro${i}]`);
  });
  const introRefs = introPaths.map((_, i) => `[intro${i}]`);

  // Inputs de los turnos (desplazados por la intro en el timeline)
  const base = introPaths.length;
  intervals.forEach((iv) => {
    args.push('-loop', '1', '-t', ((iv.endMs - iv.startMs) / 1000).toFixed(3), '-i', framePaths.get(iv.turnId) as string);
  });
  const turnRefs = intervals.map((_, i) => `[${base + i}:v]`);
  const concatFilter = [...introRefs, ...turnRefs].join('') + `concat=n=${introRefs.length + turnRefs.length}:v=1:a=0[vout]`;
  args.push('-filter_complex', `${introInputs.join(';')};${concatFilter}`, '-map', '[vout]', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', videoOnlyPath);

  const renderRes = spawnSync(ffmpegBin(), args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (renderRes.status !== 0) {
    throw new Error(`ffmpeg composición falló:\n${renderRes.stderr}`);
  }

  console.log(`\n[RENDER] 4. Multiplexando video + audio master -> ${finalPath}`);
  const muxArgs = ['-y', '-i', videoOnlyPath, '-i', masterPath, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', finalPath];
  const muxRes = spawnSync(ffmpegBin(), muxArgs, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (muxRes.status !== 0) {
    throw new Error(`ffmpeg mux falló:\n${muxRes.stderr}`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`⏱️  Episodio: ${(timeline.totalDurationMs / 1000 / 60).toFixed(1)} min | Frames: ${framePaths.size} | Cortes: ${intervals.length}`);
  console.log(`📺 Video final: ${finalPath}`);
  console.log('----------------------------------------------------------------');
  console.log('\n✅ Video renderizado con éxito.\n');
}

/**
 * Parsea los turnos intro del moderador ("Cintillo urgente en pantalla: ...")
 * para asignar a cada turno su bloque, titular GC y tema.
 */
function buildBlockContexts(transcript: DebateTranscript): Map<number, BlockContext> {
  const byTurn = new Map<number, BlockContext>();
  let current: BlockContext = { blockNumber: 0, topicTitle: transcript.title, headlineGC: 'EN VIVO' };

  for (const turn of transcript.turns) {
    const m = /Cintillo urgente ya mismo, control! "([^"]+)"\. Nos vamos a la yugular con (.+?)\./.exec(turn.speechText);
    if (m) {
      current = { blockNumber: turn.blockNumber, topicTitle: m[2], headlineGC: m[1] };
    }
    byTurn.set(turn.turnId, current);
  }
  return byTurn;
}

/**
 * Corta el timeline en intervalos en cada inicio/fin de stem; cada intervalo
 * se asigna al turno activo (el que lo contiene). Soporta superposición de
 * interrupciones: el turno que interrumpe toma el control visual 1.5s antes.
 */
function buildIntervals(stems: AudioStemInfo[]): Interval[] {
  const cuts = new Set<number>([0]);
  stems.forEach(s => { cuts.add(s.startMs); cuts.add(s.endMs); });
  const sorted = [...cuts].sort((a, b) => a - b);

  const intervals: Interval[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const startMs = sorted[i];
    const endMs = sorted[i + 1];
    if (endMs - startMs < 10) continue;
    const mid = (startMs + endMs) / 2;
    const active = stems.find(s => mid >= s.startMs && mid < s.endMs);
    if (!active) continue;
    intervals.push({ startMs, endMs, turnId: active.turnId });
  }
  return intervals;
}

main().catch((err) => {
  console.error(`❌ Error en el render de video: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
