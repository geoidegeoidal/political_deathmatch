## Why

El catálogo de personajes está desbalanceado (pocas mujeres, sin diversidad LGBTQ+/indígena/migrante) y los avatares son un retrato neutro por personaje, sin emociones. Además el programa carece de intro y musicalización, que son estándar en cualquier show de TV/YouTube.

## What Changes

- **Nuevos personajes (sin re-diseñar el capítulo actual):** 5-6 personas adicionales en `personas.json` para ampliar el espectro: mujer conservadora (derecha), mujer progresista adicional (izquierda), activista LGBTQ+ (parodia ficticia), líder indígena, migrante venezolana en Chile y/o ecologista. Con voces nuevas en `voices.json` (reutilizando los timbres OpenAI: nova/shimmer femeninas + onyx/echo/alloy masculinos con instrucciones distintas).
- **Avatares emocionales persistentes:** por cada personaje, retrato base + variantes emocionales (ANGRY, SMUG/MOCKING, OUTRAGED) generadas con `gpt-image-1` usando el retrato base como **imagen de referencia** (mismo diseño, expresión distinta). Nombres: `src/assets/avatars/{personaId}_{EMOCION}.png`.
- **VideoComposer:** usa la variante emocional según `emotion` del turno (fallback al retrato base si falta la variante).
- **Intro del programa:** segmento de ~15s al inicio (tarjeta de logo con zoom Ken Burns, eslogan, lineup de personajes) generado con frames SVG + ffmpeg.
- **Musicalización local:** `facebook/musicgen-small` vía transformers (open-source, $0, con token HF): tema de apertura (~30s), stinger de bloque (~3s) y cama musical ambiente. Mezcla con volúmenes controlados: cama a ~-22dB con ducking bajo las voces, intro a volumen completo, stingers a -10dB.

## Capabilities

### New Capabilities
- `program-audio`: musicalización del programa (tema de apertura, stingers y cama musical) generada localmente y mezclada con control de volúmenes y ducking.

### Modified Capabilities
- `ai-assets`: los avatares ahora tienen variantes emocionales persistentes por personaje (retrato base como referencia) además del retrato neutro; la carpeta de assets se extiende con `{personaId}_{EMOCION}.png`.
- `debate-engine`: el transcript/FSM ya provee `emotion` por turno (sin cambios), pero el renderizador la consume para elegir la variante visual.

## Impact

- `src/config/personas.json` (+5-6 personas), `src/config/voices.json` (+5-6 voces), `src/services/asset-generator.ts` (modo emociones con imagen de referencia), `src/services/video-composer.ts` (variante emocional + intro frames), `src/services/audio-mixer.ts` (beds de música con ducking), nuevo `src/services/music-generator.ts` (MusicGen local), nuevo `src/cli/render-intro.ts` o integración en render-video, README/HANDOFF.
- **Costo:** ~$0.07-0.17 por imagen × (~30-40 emociones) ≈ $3-6 one-shot (requiere recarga de saldo OpenAI). Música: $0 local.
- **Disco:** modelo MusicGen ~2.5GB (caché HF, fuera del repo).

## Model Allocation

- **Antigravity (Gemini 3.7 Flash):** diseño de los 6 personajes nuevos (arquetipos, ideologías, tonos, muletillas, triggers, mapeo de voces — parodias 100% ficticias), concepto visual de la intro (tarjeta/logo/layout) y lineamientos de mezcla musical. NO implementa código.
- **OpenCode Go:** implementación completa: perfiles en JSON, variantes emocionales con SD local (img2img + LoRA batch), intro (frames + ffmpeg), MusicGen y mezcla con ducking, re-render.
- **OpenAI Codex (o3-mini):** validación algorítmica: FSM de la intro/duelo, métricas de tensión y sincronización de la mezcla.
