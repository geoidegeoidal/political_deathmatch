import fs from 'fs/promises';
import path from 'path';
import { FeedSource, RawArticle, WeeklyAgenda } from '../types/editorial.js';
import { fetchAllFeeds } from './rss-fetcher.js';
import { filterAndScoreArticles } from './noise-filter.js';
import { buildEditorialPrompt } from '../prompts/editorial-pauta.prompt.js';
import { completeText } from './llm-client.js';

export async function generateWeeklyAgenda(
  feedsFilePath?: string,
  outputPath?: string
): Promise<WeeklyAgenda> {
  const rootDir = process.cwd();
  const feedsPath = feedsFilePath || path.join(rootDir, 'src', 'config', 'feeds.json');
  const outPath = outputPath || path.join(rootDir, 'weekly_agenda.json');

  console.log(`[PAUTA] 1. Leyendo catálogo de feeds desde: ${feedsPath}`);
  const feedsData = await fs.readFile(feedsPath, 'utf-8');
  const feeds: FeedSource[] = JSON.parse(feedsData);

  console.log(`[PAUTA] 2. Descargando noticias de ${feeds.length} fuentes (Chile, LATAM, Mundo)...`);
  const rawArticles = await fetchAllFeeds(feeds);
  console.log(`[PAUTA] -> Se descargaron ${rawArticles.length} noticias en total.`);

  console.log(`[PAUTA] 3. Aplicando filtro de ruido y ventana temporal (últimos 7 días)...`);
  const filteredArticles = filterAndScoreArticles(rawArticles, 7);
  console.log(`[PAUTA] -> ${filteredArticles.length} noticias seleccionadas de alta relevancia política/social.`);

  console.log(`[PAUTA] 4. Generando pauta semanal con Director Editorial LLM (Gemini 2.5 Flash / Reasoning)...`);
  const prompt = buildEditorialPrompt(filteredArticles);
  const llmResponse = await completeText(prompt, {
    model: 'gemini-2.5-flash',
    temperature: 0.3
  });

  let agenda: WeeklyAgenda;
  try {
    const cleanedJson = llmResponse
      .replace(/^```json/gm, '')
      .replace(/^```/gm, '')
      .trim();
    agenda = JSON.parse(cleanedJson);
  } catch (err: any) {
    console.warn(`[WARN] Falló el parseo de JSON del LLM, estructurando fallback: ${err.message}`);
    throw new Error(`Respuesta inválida del LLM: ${llmResponse}`);
  }

  agenda.totalArticlesScanned = rawArticles.length;

  console.log(`[PAUTA] 5. Guardando pauta generada en: ${outPath}`);
  await fs.writeFile(outPath, JSON.stringify(agenda, null, 2), 'utf-8');

  return agenda;
}
