#!/usr/bin/env node
import { generateProgramMusic } from '../services/music-generator.js';

async function main() {
  console.log('================================================================');
  console.log('🎵  POLITICAL DEATHMATCH - GENERADOR DE MÚSICA LOCAL (MUSICGEN)');
  console.log('================================================================');
  const generated = await generateProgramMusic();
  console.log('\n----------------------------------------------------------------');
  console.log(generated.length
    ? `✅ Pistas generadas: ${generated.map(g => g.split(/[\\/]/).pop()).join(', ')}`
    : '✅ Pistas ya existentes (skip).');
  console.log('----------------------------------------------------------------');
}

main().catch((err) => {
  console.error(`❌ Error generando música: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
