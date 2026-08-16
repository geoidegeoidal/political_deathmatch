# HANDOFF.md - Bitácora de Sesión

## Sesión: 2026-08-15 - Farándula en Pauta & Arquitectura del Motor de Debate (FSM)

### Objetivo
1. Integrar noticias y bloque obligatorio de **Farándula / Cultura Pop** en la pauta editorial semanal.
2. Diseñar e implementar la arquitectura base del **Motor Multi-Agente de Debate & Orquestador de TV (Fase 2)** asignada a **Antigravity (Gemini 3.7 Flash - Thinking High)**.
3. Ejecutar el relevo (*handoff*) hacia **OpenCode Go** para la implementación de drivers de runtime y CLI de simulación.

### Trabajo Completado por Antigravity (Gemini 3.7 Flash)
- **Modificación de Pauta (Farándula / Showbiz):**
  - Actualizado [`src/config/feeds.json`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/config/feeds.json) con fuentes de espectáculos.
  - Actualizado [`src/services/noise-filter.ts`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/services/noise-filter.ts) para capturar y puntuar escándalos de famosos, realities e influencers.
  - Actualizado [`src/prompts/editorial-pauta.prompt.ts`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/prompts/editorial-pauta.prompt.ts) para exigir obligatoriamente un bloque de farándula con opiniones de Marx, Incel, etc.
  - Comprobado en vivo con `npm run pauta` generando el Bloque 2 de Farándula en [`weekly_agenda.json`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/weekly_agenda.json).
- **Arquitectura del Motor de Debate (Fase 2):**
  - Creado catálogo de personajes en [`src/config/personas.json`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/config/personas.json) (*Karl Marx, Joven Incel, Pastor Ezequiel, Diputado Chamorro y Conductor Gonzalo*).
  - Creados tipos de dominio en [`src/types/debate.ts`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/types/debate.ts) (`PersonaProfile`, `DebateTurn`, `DebateTranscript`, `EmotionState`, `CameraCue`).
  - Creados system prompts y plantillas de turnos en [`src/prompts/persona-debate.prompt.ts`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/prompts/persona-debate.prompt.ts).
  - Diseñado el orquestador y máquina de estados FSM con cálculo de tensión e interrupciones en [`src/services/debate-orchestrator.ts`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/src/services/debate-orchestrator.ts).

### Commits Relevantes
- `2edda56`: feat: initialize OpenSpec SDD setup with Antigravity and OpenCode support
- `0ffad6e`: docs: update HANDOFF.md with initial commit reference
- `a6b10fd`: feat(editorial): implement 7-day multi-region RSS news scraper and weekly agenda engine
- `b8dfb61`: docs: update HANDOFF.md with completed milestone and GitHub repo reference
- `1d62642`: feat(spec): add OpenSpec proposal for 002-multi-agent-debate-orchestrator
- `8d0ebaf`: docs: update HANDOFF.md with proposal 002 handoff notice
- `2e7572f`: feat(debate-engine): implement FSM orchestrator, personas catalog, farandula pauta support, and debate prompts

### Repositorio Remoto
- **URL:** [https://github.com/geoidegeoidal/political_deathmatch](https://github.com/geoidegeoidal/political_deathmatch)
- **Branch:** `master` (Tracked & Pushed)

---

## 🚦 AVISO DE RELEVO / HANDOFF INTER-MODELOS

> [!IMPORTANT]
> **Tareas de Antigravity (Gemini 3.7 Flash - Arquitectura & Prompts) FINALIZADAS.**
>
> **RELEVO HACIA:** **OpenCode Go (Suscripción OpenCode: DeepSeek-V3 / Qwen 2.5 Coder 32B)**
>
> **Instrucciones para OpenCode Go:**
> 1. Leer [`openspec/changes/002-multi-agent-debate-orchestrator/tasks.md`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/openspec/changes/002-multi-agent-debate-orchestrator/tasks.md).
> 2. Implementar `src/services/debate-runtime.ts` con soporte para Ollama local (`HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced`) y fallback a OpenRouter.
> 3. Crear el CLI de simulación `src/cli/simulate-debate.ts` que consuma `weekly_agenda.json` y `personas.json` usando `DebateOrchestrator`.
> 4. Ejecutar `npx tsx src/cli/simulate-debate.ts` para verificar la generación de `debate_transcript.json` con diálogos e interrupciones.
> 5. Al concluir, realizar commit, push y actualizar `HANDOFF.md`.
