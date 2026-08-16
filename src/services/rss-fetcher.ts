import { FeedSource, RawArticle } from '../types/editorial.js';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  description?: string;
  summary?: string;
}

/**
 * Parser ligero de RSS/Atom usando XML/Regex nativo de Node.js (resiliente, sin cuelgues).
 */
function parseRSSXml(xmlText: string, source: FeedSource): RawArticle[] {
  const articles: RawArticle[] = [];
  
  // Buscar items estándar <item> o <entry>
  const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
  const items = xmlText.match(itemRegex) || [];

  for (const itemXml of items) {
    const titleMatch = itemXml.match(/<title(?:[^>]*)><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
                       itemXml.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link(?:[^>]*)href="([^"]+)"/i) ||
                      itemXml.match(/<link(?:[^>]*)>([\s\S]*?)<\/link>/i);
    const contentMatch = itemXml.match(/<content:encoded(?:[^>]*)><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i) ||
                         itemXml.match(/<content:encoded(?:[^>]*)>([\s\S]*?)<\/content:encoded>/i);
    const descMatch = itemXml.match(/<description(?:[^>]*)><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                      itemXml.match(/<description(?:[^>]*)>([\s\S]*?)<\/description>/i) ||
                      itemXml.match(/<summary(?:[^>]*)><!\[CDATA\[([\s\S]*?)\]\]><\/summary>/i) ||
                      itemXml.match(/<summary(?:[^>]*)>([\s\S]*?)<\/summary>/i);
    const dateMatch = itemXml.match(/<pubDate(?:[^>]*)>([\s\S]*?)<\/pubDate>/i) ||
                      itemXml.match(/<published(?:[^>]*)>([\s\S]*?)<\/published>/i) ||
                      itemXml.match(/<updated(?:[^>]*)>([\s\S]*?)<\/updated>/i);

    const title = cleanHtml(titleMatch ? titleMatch[1] : '');
    const url = (linkMatch ? (linkMatch[1] || linkMatch[2]) : '').trim();
    const summary = cleanHtml(descMatch ? descMatch[1] : '');
    const fullContent = cleanHtml(contentMatch ? contentMatch[1] : '');
    const publishedAt = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

    if (title && url) {
      articles.push({
        id: `${source.id}-${Buffer.from(url).toString('base64').substring(0, 16)}`,
        title,
        summary: summary.substring(0, 400),
        contentSnippet: fullContent.substring(0, 900),
        url,
        source: source.name,
        region: source.region,
        publishedAt
      });
    }
  }

  return articles;
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Descarga y extrae artículos de una lista de fuentes con timeout, reintento y dedupe por URL.
 */
export async function fetchAllFeeds(sources: FeedSource[], timeoutMs: number = 10000): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const response = await fetch(source.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
              'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`[WARN] Feed ${source.name} respondió con status: ${response.status}`);
            return [];
          }

          const xmlText = await response.text();
          const parsed = parseRSSXml(xmlText, source);
          if (parsed.length > 0 || attempt === 1) {
            return parsed;
          }
          console.warn(`[WARN] Feed ${source.name} sin items, reintentando...`);
        } catch (err: any) {
          if (attempt === 1) {
            console.warn(`[WARN] Error al consultar feed ${source.name}: ${err.message}`);
          }
        }
      }
      return [];
    })
  );

  const allArticles: RawArticle[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      allArticles.push(...res.value);
    }
  }

  return dedupeByUrl(allArticles);
}

/** Elimina artículos duplicados por URL normalizada (query ignorada en la comparación). */
export function dedupeByUrl(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  const out: RawArticle[] = [];
  for (const a of articles) {
    const key = a.url.replace(/[?#].*$/, '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}
