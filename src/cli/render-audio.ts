#!/usr/bin/env node
import path from 'path';
import { readFile } from 'fs/promises';
import { DebateTranscript } from '../types/debate.js';
import { synthesizeEpisodeStems } from '../services/tts-pipeline.js';
import { computeTimeline, mixMasterAudio, exportTimeline } from '../services/audio-mixer.js';

const rootDir = process.cwd();

async function main() {
  console.log('================================================================');
  console.log('🎙️  POLITICAL DEATHMATCH - RENDER DE AUDIO TTS (STEMS + MASTER)');
  console.log('================================================================');

  const transcriptPath = path.join(rootDir, 'debate_transcript.json');
  const stemsDir = path.join(rootDir, 'output', 'audio', 'stems');
  const timelinePath = path.join(rootDir, 'output', 'audio', 'audio_timeline.json');

  console.log(`\n[PIPELINE] 1. Leyendo guion: ${transcriptPath}`);
  const transcript = JSON.parse(await readFile(transcriptPath, 'utf-8')) as DebateTranscript;

  console.log(`[PIPELINE] 2. Sintetizando stems de audio (${transcript.turns.length} turnos)...`);
  const stems = await synthesizeEpisodeStems();

  console.log(`\n[PIPELINE] 3. Calculando timeline de audio...`);
  const timeline = computeTimeline(stems);

  const blockStartTurnIds = detectBlockStartTurnIds(transcript);
  console.log(`[PIPELINE] 4. Mezclando master con ducking en ${timeline.stems.filter(s => s.duckingApplied).length} interrupciones...`);
  const masterPath = await mixMasterAudio(timeline, transcript, blockStartTurnIds, { stemsDir });

  await exportTimeline(timeline, timelinePath);

  console.log('\n----------------------------------------------------------------');
  console.log(`⏱️  Duración total del episodio: ${(timeline.totalDurationMs / 1000 / 60).toFixed(1)} min`);
  console.log(`🎧 Stems: ${timeline.totalStems} en ${stemsDir}`);
  console.log(`⚡ Interrupciones con ducking: ${timeline.stems.filter(s => s.duckingApplied).length}`);
  console.log(`📜 Timeline exportado: ${timelinePath}`);
  console.log(`🎵 Master: ${masterPath}`);
  console.log('----------------------------------------------------------------');
  console.log('\n✅ Audio renderizado con éxito.\n');
}

function detectBlockStartTurnIds(transcript: DebateTranscript): number[] {
  const starts: number[] = [];
  for (const turn of transcript.turns) {
    const isIntro = /Cintillo urgente ya mismo, control!/i.test(turn.speechText);
    if (isIntro) starts.push(turn.turnId);
  }
  return starts;
}

main().catch((err) => {
  console.error(`❌ Error en el render de audio: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
