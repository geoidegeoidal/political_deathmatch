#!/usr/bin/env node
import { generateAllAssets } from '../services/asset-generator.js';

const force = process.argv.includes('--force');

async function main() {
  console.log('================================================================');
  console.log('🎨  POLITICAL DEATHMATCH - GENERADOR DE ASSETS (RETRATOS + FONDOS)');
  console.log('================================================================');
  console.log(`\n[ASSETS] Motor: OpenAI gpt-image-1 (1024x1024, one-shot persistente)${force ? ' [--force]' : ''}`);

  const generated = await generateAllAssets({ force });

  console.log('\n----------------------------------------------------------------');
  console.log(`✅ Assets listos: ${generated.length} generados`);
  console.log('   (los existentes se reutilizan; los PNG van commiteados al repo)');
  console.log('----------------------------------------------------------------');
}

main().catch((err) => {
  console.error(`❌ Error generando assets: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
