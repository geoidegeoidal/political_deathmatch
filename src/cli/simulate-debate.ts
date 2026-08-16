#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { DebateOrchestrator } from '../services/debate-orchestrator.js';
import { PersonaProfile, DebateTranscript } from '../types/debate.js';
import { WeeklyAgenda } from '../types/editorial.js';

async function main() {
  console.log('================================================================');
  console.log('🎬  POLITICAL DEATHMATCH - SIMULADOR DE DEBATE EN VIVO (4 BLOQUES)');
  console.log('================================================================');

  const rootDir = process.cwd();
  const agendaPath = path.join(rootDir, 'weekly_agenda.json');
  const personasPath = path.join(rootDir, 'src', 'config', 'personas.json');
  const outPath = path.join(rootDir, 'debate_transcript.json');

  try {
    console.log(`\n[DEBATE] 1. Leyendo pauta semanal: ${agendaPath}`);
    const agenda = JSON.parse(await fs.readFile(agendaPath, 'utf-8')) as WeeklyAgenda;

    console.log(`[DEBATE] 2. Leyendo catálogo de personajes: ${personasPath}`);
    const personas = JSON.parse(await fs.readFile(personasPath, 'utf-8')) as PersonaProfile[];

    console.log(`[DEBATE] 3. Orquestando ${agenda.blocks.length} bloques de debate con ${personas.length} personajes...`);
    const orchestrator = new DebateOrchestrator(personas);
    const transcript = await orchestrator.orchestrateEpisode(agenda);

    console.log(`\n[DEBATE] 4. Guardando guion de producción en: ${outPath}`);
    await fs.writeFile(outPath, JSON.stringify(transcript, null, 2), 'utf-8');

    printSummary(transcript);
    console.log('\n✅ Simulación completada con éxito.\n');
  } catch (error) {
    console.error(`❌ Error en la simulación: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function printSummary(transcript: DebateTranscript): void {
  const blockNumbers = [...new Set(transcript.turns.map(t => t.blockNumber))];

  console.log('\n----------------------------------------------------------------');
  console.log(`📺 RESUMEN DEL GUION: ${transcript.title}`);
  console.log(`⏱️  Duración estimada: ${Math.round(transcript.totalDurationSec / 60)} min ${transcript.totalDurationSec % 60} s | Turnos: ${transcript.turns.length}`);
  for (const blockNumber of blockNumbers) {
    const blockTurns = transcript.turns.filter(t => t.blockNumber === blockNumber);
    const interruptions = blockTurns.filter(t => t.isInterruption).length;
    console.log(`   • Bloque ${blockNumber}: ${blockTurns.length} turnos (${interruptions} interrupciones)`);
  }
  console.log('----------------------------------------------------------------');
}

main();
