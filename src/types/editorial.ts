export type Region = 'CL' | 'LATAM' | 'WORLD';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  region: Region;
  categoryDefault?: string;
}

export interface RawArticle {
  id: string;
  title: string;
  summary: string;
  contentSnippet?: string;
  url: string;
  source: string;
  region: Region;
  publishedAt: string;
}

export interface DebateBlock {
  blockNumber: number;
  topic: string;
  region: Region;
  headlineGC: string; // Cintillo para Generador de Caracteres tipo Sin Filtros
  factsSummary: string;
  moderatorTriggerQuestion: string;
  personaTriggers: Record<string, string>; // e.g. { karl_marx: "...", joven_incel: "..." }
}

export interface WeeklyAgenda {
  episodeId: string;
  theme: string;
  period: string; // e.g. "Semana 33 - Agosto 2026 (Últimos 7 días)"
  generatedAt: string;
  totalArticlesScanned: number;
  blocks: DebateBlock[];
}
