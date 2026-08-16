import { RawArticle } from '../types/editorial.js';

const DISCARD_KEYWORDS = [
  'fútbol', 'futbol', 'champions league', 'copa libertadores', 'colo colo', 'universidad de chile',
  'partido', 'gol', 'goles', 'dt', 'tenis', 'nba', 'fórmula 1', 'formula 1',
  'horóscopo', 'horoscopo', 'zodiaco', 'astrología', 'astros',
  'clima', 'pronóstico del tiempo', 'lluvia en santiago', 'temperaturas',
  'receta', 'cocina', 'nutrición', 'dietas', 'lotería', 'kino', 'loto'
];

const POLITICAL_HOT_KEYWORDS = [
  'gobierno', 'presidente', 'congreso', 'diputado', 'senador', 'ministro', 'partido',
  'reforma', 'constitución', 'seguridad', 'delincuencia', 'crimen', 'estado de sitio',
  'militares', 'carabineros', 'justicia', 'fiscalía', 'corrupción', 'fraude', 'corte suprema',
  'elecciones', 'candidato', 'votación', 'oposición', 'izquierda', 'derecha', 'comunismo',
  'capitalismo', 'libertario', 'impuestos', 'inflación', 'sueldo', 'paro', 'huelga',
  'migración', 'frontera', 'venezuela', 'argentina', 'eeuu', 'china', 'guerra', 'conflicto',
  'onu', 'derechos humanos', 'aborto', 'feminismo', 'ideología', 'escándalo', 'denuncia'
];

const FARANDULA_HOT_KEYWORDS = [
  'farándula', 'farandula', 'reality', 'infidelidad', 'quiebre', 'romance', 'animador',
  'animadora', 'televisión', 'tv', 'tiktoker', 'influencer', 'polemica', 'polémica',
  'concierto', 'cantante', 'actor', 'actriz', 'demanda', 'estafa', 'viral', 'escándalo sexual',
  'redes sociales', 'streamer', 'onlyfans', 'funada', 'funa'
];

/**
 * Filtra artículos irrelevantes y prioriza noticias de fricción política/social y farándula de los últimos 7 días.
 */
export function filterAndScoreArticles(
  articles: RawArticle[],
  maxDaysAgo: number = 7
): RawArticle[] {
  const now = Date.now();
  const maxAgeMs = maxDaysAgo * 24 * 60 * 60 * 1000;

  const filtered = articles.filter(article => {
    // 1. Filtro temporal (últimos 7 días)
    if (article.publishedAt) {
      const pubDate = new Date(article.publishedAt).getTime();
      if (!isNaN(pubDate) && (now - pubDate) > maxAgeMs) {
        return false;
      }
    }

    const textToAnalyze = `${article.title} ${article.summary}`.toLowerCase();

    // 2. Descartar si coincide con keywords de ruido (deportes, clima, horóscopo)
    const hasDiscardKeyword = DISCARD_KEYWORDS.some(kw => textToAnalyze.includes(kw));
    const hasPoliticalKeyword = POLITICAL_HOT_KEYWORDS.some(kw => textToAnalyze.includes(kw));
    const hasFarandulaKeyword = FARANDULA_HOT_KEYWORDS.some(kw => textToAnalyze.includes(kw));

    if (hasDiscardKeyword && !hasPoliticalKeyword && !hasFarandulaKeyword) {
      return false;
    }

    // 3. Requerir longitud mínima de título
    if (article.title.trim().length < 10) {
      return false;
    }

    return true;
  });

  return dedupeByTitle(filtered);
}

/** Elimina duplicados por título normalizado (misma noticia cubierta por varios medios). */
export function dedupeByTitle(articles: RawArticle[]): RawArticle[] {
  const seen = new Map<string, RawArticle>();
  for (const a of articles) {
    const normalized = a.title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
    if (!normalized) continue;
    const key = normalized.length > 40 ? normalized.slice(0, 40) : normalized;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, a);
    } else if ((a.summary || '').length > (existing.summary || '').length) {
      seen.set(key, a);
    }
  }
  return [...seen.values()];
}
