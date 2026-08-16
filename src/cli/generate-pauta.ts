#!/usr/bin/env node
import { generateWeeklyAgenda } from '../services/agenda-generator.js';

async function main() {
  console.log('================================================================');
  console.log('🏛️  POLITICAL DEATHMATCH - GENERADOR DE PAUTA SEMANAL (7 DÍAS)');
  console.log('================================================================');

  try {
    const agenda = await generateWeeklyAgenda();
    
    console.log('\n================================================================');
    console.log(`🎬 EPISODIO: ${agenda.episodeId}`);
    console.log(`🔥 TEMA CENTRAL: ${agenda.theme}`);
    console.log(`📅 PERIODO: ${agenda.period}`);
    console.log(`📊 TOTAL NOTICIAS ESCANEADAS: ${agenda.totalArticlesScanned}`);
    console.log('================================================================\n');

    agenda.blocks.forEach((block) => {
      console.log(`----------------------------------------------------------------`);
      console.log(`[BLOQUE ${block.blockNumber}] [${block.category || 'POLITICA'}] [${block.region}] ${block.topic}`);
      console.log(`📺 GC: ${block.headlineGC}`);
      console.log(`📰 HECHOS: ${block.factsSummary}`);
      console.log(`🎙️ PREGUNTA MODERADOR: "${block.moderatorTriggerQuestion}"`);
      console.log(`🎭 TRIGGERS POR PERSONAJE:`);
      Object.entries(block.personaTriggers).forEach(([persona, trigger]) => {
        console.log(`   • ${persona.toUpperCase()}: ${trigger}`);
      });
      console.log(`----------------------------------------------------------------\n`);
    });

    console.log('✅ Pauta generada con éxito en weekly_agenda.json\n');
  } catch (error: any) {
    console.error(`❌ Error al generar la pauta: ${error.message}`);
    process.exit(1);
  }
}

main();
