# HANDOFF.md - Bitácora de Sesión

## Sesión: 2026-08-16 (5ª) - Lanzamiento de Fase 3: Pipeline de Audio TTS & Renderizador de Estudio TV

### Objetivo
Lanzar la **Fase 3** bajo OpenSpec (`003-tts-audio-and-video-studio`), especificando el pipeline de síntesis de voz multi-voz con interrupciones y el motor de composición visual en 1080p para televisión.

### Hecho por Antigravity (Gemini 3.7 Flash - Arquitectura & Layouts)
- **OpenSpec Propuesta `003-tts-audio-and-video-studio`:**
  - Creados `proposal.md`, `design.md`, `tasks.md`, `specs/audio-pipeline/spec.md` y `specs/video-studio/spec.md`.
  - Especificado el archivo principal `openspec/specs/debate-engine/spec.md`.
- **Tipos de Dominio Media (`src/types/media.ts`):**
  - Interfaces `VoiceProfileConfig`, `AudioStemInfo`, `AudioTimeline`, `VideoRenderConfig` y `VideoFrameState`.
- **Catálogo de Voces Neuronales (`src/config/voices.json`):**
  - Mapeo de los 15 personajes con voces neuronales (chileno matinal, venezolano caudillo, mexicano punitivo, argentino ancap, español peninsular, etc.) con offsets de pitch y rate.
- **Motor de Composición Visual de Estudio TV (`src/services/video-composer.ts`):**
  - Compositor 1080p (1920x1080) con fondos de estudio, luces dinámicas, modo `SPEAKER_FOCUS`, modo `SPLIT_SCREEN_VERSUS` con alertas de interrupción, Generador de Caracteres (GC) rojo escandaloso, barra de noticias rodante (*ticker*) y termómetro de tensión en tiempo real.
- **Commits (push OK a origin/master):**
  - `e005bf7`: feat(phase3): create OpenSpec proposal 003, media types, neural voices catalog, and VideoComposer layout engine.
  - `b312cd2`: feat(personas): adjust all 15 personas and voices to 100% authentic Chilean archetypes and sociocultural registers.

### Repositorio Remoto
- **URL:** [https://github.com/geoidegeoidal/political_deathmatch](https://github.com/geoidegeoidal/political_deathmatch)
- **Branch:** `master` (Pushed & Tracked)

---

## 🚦 AVISO DE RELEVO / HANDOFF INTER-MODELOS (FASE 3)

> [!IMPORTANT]
> **Tareas de Antigravity (Arquitectura, Voces y Layouts Visuales) COMPLETADAS.**
>
> **RELEVO HACIA:** **OpenCode Go (Suscripción OpenCode: DeepSeek-V3 / Qwen 2.5 Coder 32B)**
>
> **Instrucciones para OpenCode Go:**
> 1. Leer [`openspec/changes/003-tts-audio-and-video-studio/tasks.md`](file:///c:/Users/Tokyotech/sideprojects/political_deathmatch/openspec/changes/003-tts-audio-and-video-studio/tasks.md).
> 2. Implementar el sintetizador de audio `src/services/tts-pipeline.ts` para generar los stems `.mp3` de cada turno usando `edge-tts` (o librería/CLI de síntesis compatible) basándose en `voices.json` y `debate_transcript.json`.
> 3. Implementar el mezclador de audio `src/services/audio-mixer.ts` con ducking/overlap para interrupciones y exportación de `audio_timeline.json`.
> 4. Crear el comando CLI `src/cli/render-audio.ts` para correr la generación de audio completa.
> 5. Implementar el comando CLI `src/cli/render-video.ts` para componer el video 1080p final.
> 6. Marcar tareas completadas en `tasks.md`, actualizar `HANDOFF.md` y hacer commit & push.

---

## Sesión: 2026-08-16 (3ª) - Prompt Engineering de Turnos: Registro TV Chileno-Latino y Ejemplos Reales

### Objetivo
Corregir turnos de debate demasiado cortos y sin lenguaje real de programas de TV chilena/latina, con argumentos basados en ejemplos históricos y actuales.

### Hecho
- **`src/prompts/persona-debate.prompt.ts` reescrito:**
  - Nuevo banco `EJEMPLOS_POR_CATEGORIA` (SEGURIDAD/POLITICA/FARANDULA/INTERNACIONAL/SOCIEDAD) con ~8 referencias reales cada una (Bukele-CECOT, estallido 2019, caso Ronald Mallea, nacionalización del cobre 1971, plebiscito 4-S 2022, Chicago Boys 1975, éxodo venezolano, caída del Muro, crisis de los misiles, Plan Cóndor, revolución pingüina, isapres, migración, etc.).
  - Nuevo `MODISMOS_ESTUDIO` (~14 modismos/frases hechas de matinal: "po", "cachai", "compadre", "al tiro", "quedó la escoba", "no me venga con cuentos"...).
  - Longitud mínima exigida: 5-8 oraciones (80-140 palabras) en system prompt y formato JSON.
  - Estructura de réplica televisiva: 1) descartar punto rival con ironía, 2) ejemplo histórico/actual, 3) cifra/dato, 4) remate al aire. Interpelación a conductor, cámara y rival.
- **Simulación completa regenerada con modelo real:** `debate_transcript.json` = 24 turnos, 4 bloques, **15m49s** estimados (target 15-20 min). Turnos de 150-220 palabras con modismos y ejemplos reales.
- **Observación:** T11 (Brayan, Bloque 2) cayó al fallback `getFallbackSpeech` del orquestador (55 palabras, texto genérico) — solo 1 de 24 turnos; la causa es el parseo JSON del LLM, no el prompt.

### Decidido
- Los prompts de turno viven en `src/prompts/persona-debate.prompt.ts` y se pueden seguir ajustando sin tocar el orquestador.
- Umbral de tensión para interrupciones ajustado después (sesión 4ª: base 55, umbral `>=75`) → 6 interrupciones en la corrida siguiente.

---

## Sesión: 2026-08-16 (4ª) - Tuning de Interrupciones, Commit & Push

### Hecho
- **Tuning de tensión en `src/services/debate-orchestrator.ts`:** base por bloque 35→55; umbral de interrupción `>=70` → `>=75` (alineado con design.md y spec delta `specs/debate-engine/spec.md` corregido a `>= 75`).
- **Verificado con modelo real:** simulación completa = 24 turnos, 4 bloques, 12m22s, **6 interrupciones** (2+1+3) con emoción OUTRAGED y tensión hasta 100 (ej: "¡Pare ahí, Capitán!", "¡qué hueá!"). Turnos cortos restantes: solo plantillas del moderador + 1 turno con fallback heurístico (T11 Brayan) y 2 turnos de ~40 palabras.
- **Commits (push OK a origin/master):**
  - `e18966a` feat(debate-runtime): implement Ollama-only runtime and simulate-debate CLI, disable OpenRouter
  - `1639b8e` feat(debate-prompts): TV chilean-latino register, historical examples per category, longer turns, tension tuning for interruptions
  - `f3b3ad5` docs(debate): update AGENTS/README/HANDOFF and OpenSpec artifacts, track debate_transcript.json
- `debate_transcript.json` ahora trackeado en git (consistente con `weekly_agenda.json`).

### Próxima sesión
- **Fase 3 — Pipeline TTS**: síntesis de voz local (Kokoro / Edge-TTS / XTTS v2) con los `voiceProfileId` de `personas.json`; pistas separadas para pisadas de palabra. **Requiere propuesta OpenSpec** (`/opsx-propose`, diseño según matriz → Antigravity).
- **Fase 3 — Render de estudio TV**: avatares reactivos, switch de cámaras (`cameraCue`), GC animado. (Antigravity: diseño/layouts.)
- Archivar cambio 002 cuando Fase 3 esté lista.

---

## Sesión: 2026-08-16 (2ª) - Ollama Instalado & OpenRouter Desactivado (100% Local)

### Objetivo
1. Desactivar OpenRouter del runtime de debate y de la pauta editorial.
2. Instalar Ollama, descargar el modelo uncensored y verificar la simulación con generación local real.

### Hecho
- **Ollama instalado** vía winget (`Ollama.Ollama` v0.32.13, en `%LOCALAPPDATA%\Programs\Ollama\`). Servidor corriendo en `http://localhost:11434`.
- **Modelo descargado:** `ollama pull hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M` (7.4 GB).
  - ⚠️ **Trampa resuelta:** `ollama pull HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced` NO existe en el registry de Ollama (`pull model manifest: file does not exist`). El nombre correcto lleva el prefijo `hf.co/` y el tag `:Q4_K_M` (documentado en el model card de Hugging Face).
- **`src/services/debate-runtime.ts`:** eliminado OpenRouter → cadena ahora `Ollama → heurístico local`. Modelo default actualizado a `hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M`.
- **`src/services/llm-client.ts` (pauta editorial):** eliminado OpenRouter → cadena `Gemini → Ollama → heurístico` (consistente con la decisión).
- **Simulación verificada con el modelo real:** `npx tsx src/cli/simulate-debate.ts` → 24 turnos, 4 bloques, 12m26s estimados, 0 speechText vacíos, diálogos generados por Gemma4 local (e.g. Sotomayor vs Moncada en Bloque 1; Brayan vs Moncada en Farándula).
- **Docs actualizados:** `AGENTS.md` (matriz runtime), `README.md` (matriz, .env, pull, fallback chain), `openspec/changes/002/.../{tasks.md, design.md}`, `openspec/changes/001/.../design.md`.

### Decidido
- **OpenRouter desactivado en todo el proyecto.** Debate y pauta corren 100% local: Ollama (primario) → sintetizador heurístico (fallback). Cero dependencia de nube para generación de contenido.
- Nombre canónico del modelo en el repo: `hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M`.

### Bloqueantes / pendientes
- **Commit/push pendientes** de ambas sesiones del 2026-08-16 (runtime + CLI, y este cambio). No commiteado por no estar solicitado explícitamente.
- Interrupciones (`isInterruption`) siguen siendo escasas con el modelo real (0 en esta corrida) — posible tuning de umbrales de tensión en `debate-orchestrator.ts` en una próxima sesión.

### Próxima sesión
- Commitear y pushear ambos cambios (registrar hashes aquí).
- Ajustar FSM/tensión para más interrupciones, y evaluar duración vs. target de 15-20 min.
- Pipeline TTS + render visual (Fase 3).

---

## Sesión: 2026-08-16 - Runtime de Debate (Ollama/OpenRouter) & CLI de Simulación

### Objetivo
1. Implementar el driver `src/services/debate-runtime.ts` (Ollama local → OpenRouter → heurístico local).
2. Crear y probar el CLI `src/cli/simulate-debate.ts` (4 bloques, incluye Farándula) exportando `debate_transcript.json`.

### Hecho
- **Runtime implementado:** `src/services/debate-runtime.ts` con `completeText()` de cadena triple:
  1. Ollama local `http://localhost:11434` (`/v1/chat/completions`, modelo `HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced`, timeout 180s).
  2. OpenRouter (`OPENROUTER_API_KEY`, modelo default `deepseek/deepseek-chat`, timeout 60s).
  3. Heurístico local: devuelve JSON válido con `speechText` vacío para que `DebateOrchestrator.getFallbackSpeech` rellene con las muletillas del personaje.
- **Wiring:** `debate-orchestrator.ts` ahora importa `completeText` desde `debate-runtime.js` (antes `llm-client.js`, que sigue usándose solo para la pauta editorial).
- **CLI:** `src/cli/simulate-debate.ts` lee `weekly_agenda.json` + `src/config/personas.json`, instancia `DebateOrchestrator`, guarda `debate_transcript.json` y muestra resumen por bloque (turnos/interrupciones).
- **Script npm:** agregado `"debate": "tsx src/cli/simulate-debate.ts"`.
- **Prueba:** `npx tsx src/cli/simulate-debate.ts` OK (24 turnos, 4 bloques, 1 interrupción, 6m31s estimados). Ollama no estaba corriendo y no hay `OPENROUTER_API_KEY` → cayó al fallback heurístico (correcto por diseño).
- **Nota:** `npm install` ejecutado (no existía `node_modules`); `npm run build` (tsc) pasa sin errores.

### Decidido
- El runtime de debate NO usa Gemini (la pauta sí): el debate va exclusivamente por Ollama → OpenRouter → heurístico, cumpliendo la matriz de $0 tokens.
- Fallback heurístico delega el texto al `getFallbackSpeech` del orquestador (con contexto de personaje) en vez de generar texto genérico.

### Bloqueantes / pendientes
- **Commit/push pendientes:** los cambios (runtime, CLI, package.json, tasks.md, HANDOFF.md) NO fueron commiteados (no solicitado explícitamente).
- Validación con Ollama real: falta que el usuario levante Ollama y haga pull del modelo `HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced` (o `ollama pull HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced`) para probar la generación real sin censura.
- El bloque 4 de `weekly_agenda.json` (mock heurístico de la pauta) tiene `blockNumber: 3` duplicado y `category: undefined` (dato de origen de `llm-client.ts`).
- Interrupciones con runtime real: hoy solo 1/24 turnos con `isInterruption` (tensión raramente ≥70 con deltas heurísticos); con LLM real subirá.

### Próxima sesión
- Probar con Ollama activo y ajustar prompts/pipeline TTS + render visual (Fase 3, asignada a Antigravity o según matriz).
- Commitear y pushear (registrar hashes aquí).

---

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
- `6bf55bb`: docs: update HANDOFF.md with OpenCode Go handoff instructions
- `52599bc`: feat(personas): add complete roster of 15 creative characters including Latin Left & Latin Right icons
- `dea299d`: docs: update HANDOFF.md with 15 personas commit reference
- `421a160`: feat(legal): replace all character names with 100% fictional satirical parodies to prevent copyright/defamation issues

### Repositorio Remoto
- **URL:** [https://github.com/geoidegeoidal/political_deathmatch](https://github.com/geoidegeoidal/political_deathmatch)
- **Branch:** `master` (Tracked & Pushed)

> [!NOTE]
> El aviso de relevo hacia OpenCode Go (sesión 2026-08-15) quedó **cumplido** en la sesión 2026-08-16: runtime + CLI implementados y probados.
