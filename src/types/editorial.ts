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

export type BlockCategory = 'POLITICA' | 'SEGURIDAD' | 'FARANDULA' | 'INTERNACIONAL' | 'SOCIEDAD';

export interface DebateBlock {
  blockNumber: number;
  category: BlockCategory;
  topic: string;
  region: Region;
  headlineGC: string; // Cintillo para Generador de Caracteres tipo Sin Filtros
  factsSummary: string;
  contextoHistorico?: string; // Contexto político/histórico para profundidad del debate
  climaxIdea?: string; // Momento de mayor conflicto planificado del bloque
  datosExplosivos?: string[]; // 2-3 datos/cifras escandalosos para subir la apuesta
  viralHook?: string; // El momento de 10s diseñado para clips virales (quién dice qué, con qué cintillo)
  confrontacion?: string; // Qué panelistas chocan y con qué acusación concreta
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
