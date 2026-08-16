# Tasks: News Scraper & Weekly Agenda Engine

## Implementation Phases

- [x] 1. Configuración y Fuentes de Datos <!-- id: feeds-config -->
  - [x] 1.1 Inicializar `package.json` con dependencias mínimas y zero-runtime dependencies nativas de Node.js 22.
  - [x] 1.2 Crear catálogo de feeds en `src/config/feeds.json` con fuentes verificadas de Chile, LATAM y Mundo.
  - [x] 1.3 Definir interfaces TypeScript de dominio en `src/types/editorial.ts`.

- [x] 2. Servicio de Ingesta & Filtro <!-- id: ingestion-service -->
  - [x] 2.1 Implementar `src/services/rss-fetcher.ts` para descarga paralela con límites de timeout.
  - [x] 2.2 Implementar `src/services/noise-filter.ts` con heurísticas de descarte y ventana temporal de los últimos 7 días.
  - [x] 2.3 Probar extracción y normalización de noticias con feeds reales de Chile, LATAM y el Mundo.

- [x] 3. Sintetizador de Pauta & Scoring <!-- id: agenda-synthesizer -->
  - [x] 3.1 Implementar conector de inferencia `src/services/llm-client.ts` configurado para `Gemini 2.5 Flash / DeepSeek` (Thinking: Low) con fallback heurístico.
  - [x] 3.2 Crear prompt de editorialización tipo *Sin Filtros TV* en `src/prompts/editorial-pauta.prompt.ts`.
  - [x] 3.3 Implementar `src/services/agenda-generator.ts` que exporta `weekly_agenda.json`.

- [x] 4. CLI & Automatización <!-- id: cli-runner -->
  - [x] 4.1 Crear comando CLI ejecutable `src/cli/generate-pauta.ts`.
  - [x] 4.2 Probar generación end-to-end con 343 noticias reales de la semana en curso.
