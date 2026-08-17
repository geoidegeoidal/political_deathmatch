# HANDOFF.md - Bitácora de Sesión

## Sesión: 2026-08-16 (16ª) - GC Dinámico con Cuñas en Vivo, Poses Expresivas, Insultos Edgys y Cama Musical de Debate

### Objetivo
Cumplir integralmente con las directivas del usuario:
1. Poses expresivas y variantes de tiro de cámara (`POINTING`, `OUTRAGED`, `SMUG`, `ANGRY`, `PANEL`, `CLOSE_UP`).
2. Subir la calidad y dramatismo del generador de imágenes de estudio y avatares.
3. Prohibir mención hablada de sobrenombres (conservarlos solo para uso interno de prompt).
4. Insultos y descalificaciones directas chilenas en perfiles edgys cuando se agotan los argumentos o la tensión >= 65.
5. Generador de Caracteres (GC) dinámico en tiempo real que rescata cuñas explosivas del debate (`quoteGC`).
6. Musicalización de fondo típica de noticias y programas de debate político con tensión dinámica y ducking.
7. Inspección visual obligatoria de los frames de video (`output/video/frames/*.png`).
8. Registro y sincronización en OpenSpec `005-diverse-personas-emotional-avatars-intro-music`.

### Hecho por Antigravity (Gemini 3.7 Flash - Arquitecto Técnico Lead)
- **1. Generador de Caracteres Dinámico (GC) con Cuñas en Vivo:**
  - Añadido `quoteGC?: string;` a `DebateTurn` (`src/types/debate.ts`) y `VideoFrameState` (`src/types/media.ts`).
  - `persona-debate.prompt.ts`: El LLM genera cuñas en mayúsculas de 8-10 palabras para el cintillo de TV.
  - `debate-orchestrator.ts`: Helper `extractQuoteGC` para extraer automáticamente cuñas explosivas y asignarlas a cada turno.
  - `video-composer.ts`: Lower Third renderiza badge `🔴 CUÑA EN VIVO` con la frase destacada en amarillo/blanco o el titular del bloque si no hay cuña.
- **2. Prohibición de Sobrenombres Hablados & Activación de Insultos Edgys:**
  - `persona-debate.prompt.ts`: Regla estricta "CERO SOBRENOMBRES AL HABLAR" (los panelistas y moderador solo usan nombres formales: "Lautaro", "Capitán Sotomayor", "Dr. Errázuriz", "Guzmán", etc.).
  - Directiva de desmadre televisivo: En tensión >= 65 o panelistas combativos, se exigen insultos directos chilenos de debate ("¡hipócrita!", "¡sinvergüenza mentiroso!", "¡vendido de mierda!", "¡facho miserable!", "¡comunista de cartón!", "¡chanta!").
- **3. Sistema de Poses Visuales y Tiro de Cámara:**
  - `asset-generator.ts`: Prompts de calidad cinematográfica editorial con descriptores de poses (`BASE`, `POINTING`, `OUTRAGED`, `SMUG`, `ANGRY`, `PANEL`, `CLOSE_UP`).
  - `video-composer.ts`: Método `resolveAvatarUri` que resuelve dinámicamente la pose/emoción adecuada (`{id}_{EMOTION}.png`, `{id}_{POSE}.png`) en lugar de caer siempre a la imagen neutra.
  - Rediseño de `WIDE_PANEL`: Cuadrícula limpia de 2x3 con círculos de avatar ampliados y badges sin truncamiento.
- **4. Musicalización de Noticias y Debate:**
  - `music-generator.ts`: Sintetizador broadcast de camas de noticias (drone 65Hz en Re menor + pulso rítmico de reloj a 115 BPM + fanfarria de inicio + stingers de impacto).
  - `render-audio.ts`: Invoca automáticamente `generateProgramMusic()` antes de la mezcla master con ducking.
- **5. Inspección Visual de Frames Renderizados:**
  - Inspeccionados `frame_001.png` (intro con panel 2x3 limpio), `frame_004.png` (Split Screen Versus con Guzmán y Lautaro furiosos), `frame_046.png` (Duelo Final con Washington Chamorro y Camila Ñuñoa) y comprobada la legibilidad de cintillos y gráficos.
- **6. OpenSpec & Sincronización:**
  - Actualizados `spec.md`, `design.md` y `tasks.md` en `openspec/changes/005-diverse-personas-emotional-avatars-intro-music/`.

---

## Sesión: 2026-08-16 (15ª) - Implementación Fase 005: Personas Diversas, Música MusicGen e Intro

### Objetivo
Implementar las tareas técnicas de la Fase 005 asignadas a OpenCode: 6 personas nuevas (diseño de Antigravity), inclusión en editorial/debate, música local con MusicGen, mezcla con ducking e intro del programa.

### Hecho por OpenCode Go
- **6 personas nuevas en `personas.json`** (23 total) con sus voces en `voices.json` (24): Sra. Patricia Maturana (derecha tradicional, shimmer), Gladis Recabarren (sindicalista, nova), Alexis Valderrama (queer, shimmer), Lonko Cayupán (mapuche, sage), Coromoto Rondón (migrante venezolana, coral), Pascual Huenupe (ecologista, alloy). Incluidas en el prompt editorial (lista + personaTriggers).
- **Música local (MusicGen):** `scripts/musicgen-worker.py` + `src/services/music-generator.ts` + CLI `npm run music`. Generadas con `facebook/musicgen-small`: `intro_theme.wav` (30s), `bed_ambient.wav` (25s), `stinger_block.wav` (3s), `stinger_duel.wav` (4s). $0, local.
- **Mezcla con ducking (matriz design 005):** `INTRO_OFFSET_MS=15000` desplaza todos los stems; intro a 0dB con fade out en 13-14.5s; cama ambiental en loop con volumen por tramos (0.04 con voz, 0.12 en tensión >=75, 0.08 base) vía `volume='if(between(t,...))'`; stinger de bloque (-10dB) en cada intro de bloque y stinger de duelo (-8dB) al inicio del cara a cara. `AudioStemInfo` ganó `tensionAfterTurn`.
- **Intro del programa:** 4 tarjetas SVG (`renderIntroCardSvg`) — señal en vivo+logo+eslogan, lineup triple split (popular/conductor/punitivo con avatares), cartelera del episodio con bloques de `weekly_agenda`, set de Guzmán con GC — renderizadas con Ken Burns (zoompan, frame único sin loop) y antepuestas (15s) en `render-video.ts`, sincronizadas con el audio.
- **Fixes:** escape XML (`&` en "CONDUCTOR Y ÁRBITRO" rompía librsvg → helper `xmlEscape` en textos dinámicos); zoompan duplicaba duración con `-loop` (corregido a frame único).
- **Episodio final:** 30.0 min exactos (15s intro + debate), `episode_1080p.mp4` + `output/preview_intro20s.mp4` para revisar intro+música.

### Pendiente (005)
- 1.1 y 3.1: completadas por Antigravity (diseño).
- 2.1/2.2: variantes emocionales SD + LoRA batch — parcial: 17 personas tienen variantes; faltan las 6 nuevas y el batch LoRA.
- 5.1: validación algorítmica (FSM/timing/métricas) → OpenAI Codex.
- Commit/push: pendiente de esta sesión.

---

## Sesión: 2026-08-16 (14ª) - Arquitectura de Diversidad, Concepto Visual de Intro & Matriz de Mezcla Musical (Fase 005)

### Objetivo
Diseñar la propuesta OpenSpec `005-diverse-personas-emotional-avatars-intro-music`: 6 personajes nuevos diversos 100% ficticios chilenos, storyboard visual de la intro de televisión y especificación de mezcla musical con ducking dinámico para MusicGen.

### Hecho por Antigravity (Gemini 3.7 Flash - Arquitecto Técnico Lead)
- **Diseño Completo de 6 Personas Nuevas Diversas (`design.md`):**
  1. `senora_patricia_maturana`: Sra. Patricia "Familia y Patria" Maturana-Valdés (*La Matriarca de Vitacura* - Derecha tradicional, familia y colegios subvencionados).
  2. `gladis_recabarren`: Gladis "Poder Obrero" Recabarren-Pinto (*La Voz de la Chimba* - Sindicalista combativa, ollas comunes y vivienda popular).
  3. `alexis_disidencia`: Alexis "Furia Marica" Valderrama-Le-Flores (*El Performer de la Disidencia* - Activismo queer anticapitalista y performance).
  4. `lonko_cayupan`: Lonko Millaray "Wallmapu Libre" Cayupán-Antilef (*La Guardiana del Pillán* - Soberanía ancestral mapuche y anti-extractivismo).
  5. `coromoto_libertad`: Ing. Coromoto "Sin Socialismo" Rondón-Pacheco (*El Testimonio del Éxodo* - Migrante venezolana profesional, anti-chavismo y libre empresa).
  6. `pascual_aguaslibres`: Pascual "Cero Emisiones" Huenupe-Pacheco (*El Guardián de la Patagonia* - Ecología profunda y bio-defensa de glaciares).
- **Storyboard Visual de la Intro de Televisión (~15s):**
  - Secuencia de 4 tarjetas SVG (Alerta de Transmisión -> Lineup Triple Split Screen -> Cartelera del Episodio -> Set de Guzmán Falcón).
- **Matriz de Audio & Ducking Dinámico:**
  - Definidos niveles exactos dB FS: Intro (0dB), Cama Ambiente (-22dB ducking a -28dB con voz activa y -18dB en clímax), Stingers (-10dB / -8dB).
- **OpenSpec Estado:** `004-ai-avatar-and-scenography-assets` marcado como `✓ Complete`. `005` avanzado a 3/13 tasks.

---

## 🚦 AVISO DE RELEVO / HANDOFF INTER-MODELOS (FASE 005)

> [!IMPORTANT]
> **Tareas de Diseño y Arquitectura de Antigravity COMPLETADAS.**
>
> **RELEVO HACIA:** **OpenCode Go (Suscripción OpenCode: DeepSeek-V3 / Qwen 2.5 Coder 32B)**
>
> **Instrucciones para OpenCode Go:**
> 1. Leer `openspec/changes/005-diverse-personas-emotional-avatars-intro-music/design.md` y `tasks.md`.
> 2. Implementar los 6 nuevos perfiles en `src/config/personas.json` y sus voces en `src/config/voices.json`.
> 3. Entrenar / generar las variantes emocionales con SD local (`models/loras/` + `src/assets/avatars/`).
> 4. Implementar `src/services/music-generator.ts` (MusicGen) y el renderizador de la intro en `render-video.ts`.
> 5. Probar el pipeline completo con audio y video integrado.

---



## Sesión: 2026-08-16 (12ª) - Sin Filtros: Desmadre, Insultos por Tensión y Calmas del Animador

### Objetivo
Hacer el debate más acalorado y con estética Sin Filtros: sacarse en cara contradicciones, desmadre con insultos cuando sube el tono, y el animador llamando a la calma. Además: eliminar los comerciales y variar las frases del animador.

### Hecho por OpenCode Go
- **Comerciales eliminados:** se quitaron los infomerciales (generateCommercial, LOCUTOR, DYSTOPIAN_PRODUCTS) y el anuncio de "vamos a publicidad" del resumen de bloque. Flujo directo entre bloques.
- **Animador con variantes:** pools de 3 plantillas para intro, bajada, pregunta y resumen (sin repeticiones entre bloques). Intro/bajada/pregunta conservan el patrón de cintillo para el parsing de GC.
- **Debate Sin Filtros:**
  - Prompt: "sacarle EN CARA al rival sus contradicciones" + directiva de insultos condicionada a la tensión (`insultDirective`: >=70 permite "hipócrita", "mentiroso", "cínico", "farsante", "demagogo"...).
  - Orquestador: tensión base 55→68, pregunta +10→+15, umbral de interrupción 75→70, crossfire 3→4 rondas, tensionDelta +5 a +25.
  - **Nuevo turno "calma del animador"**: si la tensión llega a >=88 en medio del fuego cruzado, el conductor interviene ("¡Ya, ya, ya! ¡Cálmense, que esto es EN VIVO!") y baja la tensión 15 puntos.
- **Verificado:** 50 turnos, **23 interrupciones** (antes ~7), 29.8 min, 50 frames/73 cortes, `episode_1080p.mp4` + preview 120s. Push `6a43464`.
- **Trampa:** ternario con comillas dentro de una interpolación de template literal rompió el parseo (esbuild: "Expected } but found )") — resuelto moviendo la directiva a una variable precalculada `insultDirective`. Regla: evitar ternarios largos con strings anidados dentro de `${...}`.

### Pendiente
- Commit/push de docs (esta entrada). Fase 004 (avatares) y Fase 4 (distribución) pendientes. Rotar token HF (expuesto en chat).

---

## Sesión: 2026-08-16 (10ª) - Mayoría de Bloques Chilenos + Validación Editorial con Feedback

### Objetivo
La pauta debe priorizar SIEMPRE la discusión política nacional chilena: mínimo 3 de 4 bloques con región CL.

### Hecho por OpenCode Go
- **Prompt editorial reforzado:** bloques 1 y 2 = CHILE obligatorio, bloque 3 = CL preferente, bloque 4 = único foráneo (WORLD/LATAM). Criterio: priorizar temas chilenos con más noticias.
- **Validación con feedback en `agenda-generator.ts`:** tras parsear, si <3 bloques CL se reintenta (hasta 4 intentos) enviando al LLM el error de validación y la orden de corregir usando la sección === CHILE === de las noticias.
- **Verificado:** pauta final 3/4 bloques chilenos (crisis vivienda, violencia/seguridad, riña fatal) + 1 internacional (Colombia). 806 noticias seleccionadas.
- **Episodio final re-renderizado:** 39 turnos, 28m22s (debate) → 29.0 min (audio/video), 7 interrupciones, `episode_1080p.mp4` + `preview_episodio120s.mp4`.

### Pendiente
- Commit/push acumulado (sesiones 6ª-10ª). Fase 004 (avatares) y Fase 4 (distribución) pendientes.

---

## Sesión: 2026-08-16 (9ª) - Formato Final del Capítulo: Apertura LLM, Bajada, Comerciales Distópicos, Duelo Final, Cierre con Humor

### Objetivo
Rediseñar el formato del capítulo según nuevas reglas: sin farándula, bajada de noticias del conductor, apertura/cierre/comerciales regenerados en cada episodio, duelo final entre 2 panelistas aleatorios, comerciales distópicos con voz de infomercial, y 2 personajes intelectuales nuevos.

### Hecho por OpenCode Go
- **Pauta sin farándula:** prompt editorial con 4 bloques (POLITICA/SEGURIDAD, INTERNACIONAL, SOCIEDAD, fricción restante) y prohibición explícita de farándula/espectáculos. Mock heurístico actualizado (bloque 2 → SOCIEDAD institucional).
- **Bajada de noticias:** nuevo turno del conductor tras el intro de cada bloque ("¡Antes de que estalle la discusión, la BAJADA DE NOTICIAS...") con factsSummary + contextoHistorico + climaxIdea.
- **Apertura de capítulo (LLM):** nuevo turno inicial generado por el modelo con la persona del conductor (tema, bloques, duelo, hype). Se regenera en cada episodio.
- **Comerciales distópicos (LLM + voz de infomercial):** un infomercial por bloque con producto distópico aleatorio (Sirena Ciudadano 3000, App VigilanteVecino, Muro de Emergencia Rápida...). Locutor = `locutor_televentas` (persona sintética, NO debatiente; voz `voice_es_cl_locutor` rate +12%).
- **Duelo final:** 2 panelistas aleatorios se interpelan (pregunta filosa → respuesta → pregunta → respuesta) + cierre del programa generado por LLM que **bromea citando los choques reales del episodio** y cierra con el eslogan.
- **2 personajes intelectuales nuevos:** Dra. Javiera Astorga-Vicuña (postkeynesiana, historia económica, izquierda) y Prof. Raimundo Errázuriz-Parada (liberal-conservador, historia de las ideas, derecha) — tier INTELLECTUAL_SERIOUS, con muletillas metodológicas. Incluidos en pauta (personaTriggers) y voces.
- **Fix JSON crudo:** `extractPlainText()` rescata `speechText` cuando el modelo devuelve JSON en las generaciones libres (apertura/comercial/cierre).
- **Nombres sin sobrenombres en visuales:** `stripNickname()` en VideoComposer (solo guiones conservan los sobrenombres). Header "DUELO FINAL" para blockNumber 0.
- **Emoción en TTS OpenAI:** instrucciones por turno con directiva emocional (ANGRY→furioso, OUTRAGED→indignado gritando, SMUG→arrogante...).
- **⚠️ Trampa de encoding:** los intentos de reemplazo con PowerShell (Get-Content/Set-Content) corrompieron `debate-orchestrator.ts` (UTF-8→ANSI mojibake). Reparado invirtiendo la codificación (cp1252→UTF-8). **Regla: nunca editar TS con PowerShell; usar edit tool.**
- **Render final:** 39 turnos, 30m47s, 6 interrupciones, episodio 57.6MB (`episode_1080p.mp4`), preview 120s.

### Decidido
- Formato de capítulo final: APERTURA LLM → 4 bloques (intro+bajada+debate+comercial) → DUELO FINAL → CIERRE LLM con humor.
- Los comerciales, apertura y cierre se regeneran con cada capítulo (LLM, no plantillas).

### Bloqueantes / pendientes
- Commit/push acumulado de sesiones 6ª-9ª (grande).
- Fase 004 (avatares FLUX + eslogan) sigue pendiente de aplicar.
- El cierre LLM puede tardar (historial del episodio) — timeout de Ollama ya en 300s.

### Próxima sesión
- Commitear. Aplicar 004. Fase 4 distribución.

---

## Sesión: 2026-08-16 (8ª) - Captura de Noticias, Pauta Profunda y Guion Televisivo + Pipeline OpenAI

### Objetivo
Antes del lanzamiento: (1) más noticias capturadas, (2) pauta más profunda, (3) guion más natural y televisivo (estilo Tolerancia Cero / Sin Filtros), y (4) voces OpenAI como motor final.

### Hecho por OpenCode Go
- **Captura (feeds.json 9→18 fuentes verificadas en vivo):** +La Cuarta Portada (100 items), The Clinic, Ciper, Ex-Ante, Infobae Último, Clarín, La Nación AR, El Comercio PE, El País Internacional, Euronews. Se descartaron por Cloudflare: Emol, La Tercera, Bío-Bío, CNN Chile, T13, Publimetro, CNN Español. **721 noticias / 649 seleccionadas** (antes ~100). Feeds de farándula corregidos (variante `arc/outboundfeeds/rss/category/...`).
- **Fetcher:** timeout 6s→10s, reintento por feed, parseo de `content:encoded` (detalle 900 chars), dedupe por URL y por título (en noise-filter).
- **Pauta profunda:** prompt reescrito — 5 bloques, `factsSummary` 4-6 oraciones con datos/cifras/fechas, nuevo `contextoHistorico` y `climaxIdea` (tipos extendidos), `personaTriggers` de 2 oraciones para 7 personajes, hasta 120 noticias inyectadas agrupadas por región.
- **Guion televisivo:** plantillas del moderador reescritas estilo Tolerancia Cero/Sin Filtros ("¡Atención, atención, país en vivo!", "¡YA BASTA! ¡Corten!", "se lo pregunto sin anestesia"); prompt de turno con ambientación televisiva (estamos en vivo, olla a presión, frases para cintillo). Regex de intro actualizado en render-audio/render-video.
- **Runtime debate:** reintento único en Ollama + timeout 180s→300s (fallo transitorio diagnosticado; la corrida siguiente pasó 100% limpia).
- **Voces OpenAI:** motor `openai` PRIMERO en la cadena (key en `.env` gitignored; nunca al repo). `gpt-4o-mini-tts` con voz por personaje (onyx/echo/alloy/nova) + instrucciones de cadencia ("habla con ritmo vivo y agresivo, sube el tono..."). Costo ~$0.02/episodio.
- **Pipeline completo re-renderizado:** pauta (5 bloques, OpenAI) → debate (30 turnos, 20m50s, **9 interrupciones** — Gemma local) → audio (30 stems OpenAI + master 19.5 min) → video (30 frames, 39 cortes, `episode_1080p.mp4`). Preview: `output/preview_episodio90s.mp4`.

### Decidido
- La pauta editorial usa OpenAI (gpt-4o-mini, centavos) porque el mock heurístico era la causa de la superficialidad; el DEBATE sigue 100% local (Ollama, $0) — Matriz respetada en runtime.
- Voces finales: OpenAI (calidad YouTube). Fallbacks: natural (WinRT), gtts, sapi, kokoro.

### Bloqueantes / pendientes
- **Commit/push pendientes** de sesiones 6ª-8ª (pipeline Fase 3 completo, mejora editorial, runtime OpenAI).
- Fase 4 (distribución/thumbnail) y avatares 004 (FLUX caricatura + eslogan) siguen pendientes.
- Algunas cifras de la pauta pueden ser aproximadas por el LLM (validar en edición final si es para publicar).

### Próxima sesión
- Commitear y pushear. Aplicar 004 (avatares FLUX + eslogan). Fase 4: distribución.

---

## Sesión: 2026-08-16 (7ª) - Debug del Mix de Audio: adelay en ms y velocidad SAPI

### Problema reportado
El master sonaba a "bullicio constante sin voz" y los stems se escuchaban ~2x rápidos.

### Causa raíz (2 bugs)
1. **`adelay` toma MILISEGUNDOS, no segundos:** se pasaban segundos decimales (`adelay=7.811|7.811` → 7.8ms ≈ 0) → los 24 stems se apilaban en t=0 → "bullicio" y master de solo ~33s (duración del stem más largo). Fix en `audio-mixer.ts`: pasar `startMs` como entero.
2. **Pitch-shift SAPI asumía 44100Hz pero SAPI emite 22050Hz:** `asetrate=44100*K` sobre un WAV de 22050Hz → voz 1.88x rápida. Fix en `tts-pipeline.ts`: `aresample=44100` ANTES del `asetrate` (luego aresample + atempo para preservar duración).

### Verificado
- Master = 722.6s (12.0 min), coincide con el timeline, gaps de silencio naturales entre turnos.
- Stems regenerados a velocidad real (turn_003: 27.2s → 54.4s; el doble = correcto).
- `episode_1080p.mp4` re-renderizado: 12 min, 22.4MB. `preview_60s.mp4` regenerado.

### Pendiente
- Commit/push del fix (audio-mixer.ts, tts-pipeline.ts) + trabajos anteriores no commiteados de la sesión 6ª.
- Sigue pendiente: aplicar cambio 004 (FLUX avatares caricatura + eslogan).

---

## Sesión: 2026-08-16 (6ª) - Fase 3 Implementada: Pipeline TTS + Mezclador + Render 1080p

### Objetivo
Implementar la Fase 3 del pipeline audiovisual: síntesis de voz por turno, mezcla con ducking para interrupciones y composición del video final 1080p.

### Hecho por OpenCode Go
- **`src/services/tts-pipeline.ts`:** síntesis batch de stems por turno (24) mapeando `voiceProfileId` → `voices.json`. Motor primario **edge-tts** (es-CL-LorenzoNeural/CatalinaNeural); **fallback automático a Windows SAPI** (Microsoft Sabina es-MX) con shift de pitch por ffmpeg para voces masculinas.
  - ⚠️ **Trampa de red:** `edge-tts` devuelve 403 persistente en esta red (speech.platform.bing.com bloqueado) y `huggingface.co` devuelve 401 (kokoro-js instalado y descartado — sin acceso HF). La corrida completa usó SAPI; con red libre, edge-tts se auto-selecciona.
- **`src/services/audio-mixer.ts`:** `computeTimeline()` coloca stems con entrada adelantada de interrupciones (`isInterruption` → inicia 1.5s antes del fin del turno previo), marca ducking (volumen 40% en el solapamiento), exporta `audio_timeline.json` y mezcla master WAV vía ffmpeg filter_complex (`adelay` + `volume eval=frame` + `amix normalize=0`) con **gong de apertura por bloque** (aevalsrc, 392Hz).
- **`src/cli/render-audio.ts`:** end-to-end stems + timeline + master. **`src/cli/render-video.ts`:** frames SVG→PNG por turno (VideoComposer de Antigravity) vía sharp, cortes sincronizados al timeline (30 intervalos con solape de interrupciones), concat ffmpeg → mux con master → `output/episode_1080p.mp4`.
- **Deps agregadas:** `edge-tts`, `sharp`, `ffmpeg-static`, `ffprobe-static` (binarios embebidos, sin ffmpeg del sistema).
- **Verificado:** `npm run audio` → 24 stems, 6 duckings, master 347s. `npm run video` → **episode_1080p.mp4** 1920x1080@30fps h264+aac, 5m47s, 4.4MB. Build OK.
- **Scripts npm:** `audio` y `video`.

### Decidido
- Motor TTS con conmutación automática: edge-tts (calidad neural es-CL) → SAPI (offline garantizado). Se prefieren voces es-CL cuando haya red.
- Los frames del video son estáticos por turno (ponytail: la reactividad audio→boca real se delega a una mejora futura con avatares animados).

### Bloqueantes / pendientes
- **Commit/push pendientes** (no solicitado explícitamente): tts-pipeline, audio-mixer, render-audio, render-video, package.json, package-lock, output/ (o solo stems+timeline+mp4 a criterio), tasks.md, HANDOFF, README.
- Con red libre: re-correr `npm run audio` para stems es-CL neurales (borrar `output/audio/stems/*.mp3` primero).
- **Handoff de salida:** todo lo de la propuesta 003 completado → corresponde **archivar el cambio** (`/opsx-archive`) y pasar a optimización de avatares reactivos/animación (Antigravity para diseño) o validación FSM (Codex).

---

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
