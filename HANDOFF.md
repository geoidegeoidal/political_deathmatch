# HANDOFF.md - Bitácora de Sesión

## Sesión: 2026-08-15 - Setup Global, Scraper 7 Días & Publicación en GitHub

### Objetivo
1. Instalar y configurar OpenSpec de forma transversal para Antigravity y OpenCode.
2. Establecer la matriz de asignación de modelos, control de tokens y protocolo estricto de handoff inter-modelos.
3. Especificar e implementar el motor de ingesta de noticias de los **últimos 7 días** (Chile, LATAM, Mundo) y generador de pauta editorial semanal.
4. Crear el repositorio en GitHub y publicar el código con documentación de primer nivel.

### Trabajo Completado
- **OpenSpec Setup:**
  - Instalado globalmente `@fission-ai/openspec@latest`.
  - Configurado en el repo con soporte para Antigravity (`.agent/`) y OpenCode (`.opencode/`).
- **Guardrails y Matriz de Modelos (`AGENTS.md`):**
  - Definida la matriz exacta de modelos para Build-Time y Runtime (Local Uncensored `Gemma4-12B-QAT` a $0 tokens).
  - Agregada la regla obligatoria de **Handoff Inter-Modelos Estricto**.
- **Propuesta OpenSpec `001-news-scraper-and-weekly-agenda`:**
  - Redactados y aprobados: `proposal.md`, `design.md`, `tasks.md` y `specs/editorial-desk/spec.md`.
  - Ajustado el rango temporal a **los últimos 7 días completos**.
- **Implementación del Scraper & Editorial Desk:**
  - `src/config/feeds.json`: Feeds RSS activos de Chile (Cooperativa, El País Chile), LATAM (El País América, France 24) y Mundo (BBC Mundo, DW, RT, France 24).
  - `src/services/rss-fetcher.ts`: Fetcher nativo multicanal con timeout y zero runtime dependencies.
  - `src/services/noise-filter.ts`: Filtro heurístico de ruido (descarta deportes/farándula) y ventana temporal de 7 días.
  - `src/services/llm-client.ts`: Conector Gemini 2.5 Flash / OpenRouter / Fallback heurístico.
  - `src/services/agenda-generator.ts` & `src/cli/generate-pauta.ts`: CLI ejecutable que procesó 343 noticias reales en vivo y exportó `weekly_agenda.json`.
- **Publicación en GitHub:**
  - Creado y configurado repositorio público: [https://github.com/geoidegeoidal/political_deathmatch](https://github.com/geoidegeoidal/political_deathmatch).
  - Creado `README.md` exhaustivo con arquitectura visual en Mermaid, matriz de tokens y guías de uso.

### Commits Relevantes
- `2edda56`: feat: initialize OpenSpec SDD setup with Antigravity and OpenCode support
- `0ffad6e`: docs: update HANDOFF.md with initial commit reference
- `a6b10fd`: feat(editorial): implement 7-day multi-region RSS news scraper and weekly agenda engine
- `b8dfb61`: docs: update HANDOFF.md with completed milestone and GitHub repo reference
- `1d62642`: feat(spec): add OpenSpec proposal for 002-multi-agent-debate-orchestrator

### Repositorio Remoto
- **URL:** [https://github.com/geoidegeoidal/political_deathmatch](https://github.com/geoidegeoidal/political_deathmatch)
- **Branch:** `master` (Tracked & Pushed)

---

## 🚦 AVISO DE RELEVO / HANDOFF INTER-MODELOS

> [!IMPORTANT]
> **Propuesta `002-multi-agent-debate-orchestrator` CREADA y SINCRONIZADA.**
>
> **Próxima Tarea: Implementación de la Fase 2 (Motor de Debate & FSM):**
> 1. **Antigravity (Gemini 3.7 Flash - Thinking High):**
>    - Diseñar el catálogo de personalidades `src/config/personas.json` (Marx, Incel, Fanático, Moderador).
>    - Diseñar los system prompts de debate sin censura `src/prompts/persona-debate.prompt.ts`.
>    - Diseñar la máquina de estados e interrupciones en `src/services/debate-orchestrator.ts`.
> 2. **OpenCode Go (DeepSeek-V3 / Qwen 2.5 Coder):**
>    - Implementar los tipos `src/types/debate.ts`.
>    - Implementar el driver de Ollama `src/services/debate-runtime.ts` y CLI `src/cli/simulate-debate.ts`.
