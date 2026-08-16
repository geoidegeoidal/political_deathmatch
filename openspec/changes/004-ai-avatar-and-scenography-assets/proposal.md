## Why

El renderizador de estudio TV (Fase 3) usa placeholders de emoji (🗣️/😠) como avatares y un fondo genérico de gradiente. Para un producto listo para YouTube se necesitan retratos persistentes de los 15 personajes y escenografía de estudio reales, generables localmente y sin costo: la red bloquea HuggingFace y edge-tts, pero el registry de Ollama ya funcionó (modelo Gemma del debate), y la RTX 3060 12GB puede correr FLUX.1 Schnell cuantizado (~5GB VRAM) en un solo `ollama pull`.

## What Changes

- **Nuevo generador de assets por IA local** (`src/services/asset-generator.ts` + CLI `src/cli/generate-assets.ts`):
  - Genera **15 retratos de personaje** en estilo **caricatura satírica semi-realista** (busto tipo estudio TV, estilo dibujo satírico — decisión de producto: el video es tipo podcast sin lipsync y un rostro fotorrealista congelado genera uncanny valley) usando `bmad4t/flux.1-schnell` vía Ollama (`/api/generate`).
  - Genera **3 fondos de escenografía** (uno por `cameraCue`: SPEAKER_FOCUS, SPLIT_SCREEN_VERSUS, WIDE_PANEL).
  - Seed determinista por asset para reproducibilidad; skip si el archivo ya existe (generación one-shot persistente).
- **Eslogan de marca:** header y ticker del renderizador muestran "EL PRIMER PODCAST POLÍTICO SIN CENSURA CON IA".
- **Catálogo de assets persistente y commiteado** en `src/assets/avatars/{personaId}.png` y `src/assets/backgrounds/{cameraCue}.png` (ya no se regeneran nunca).
- **Integración en `src/services/video-composer.ts`:** los frames SVG embeben el retrato del personaje activo (y del oponente en split-screen) y el fondo según `cameraCue`. Degradación elegante: si falta el asset, se mantiene el emoji/placeholder actual. La emoción sigue expresándose con el badge existente (1 retrato neutral por personaje).
- **Re-render del episodio** con los nuevos assets (`npm run video`).

## Capabilities

### New Capabilities
- `ai-assets`: Generación local de retratos de personajes y escenografía de estudio con modelo de difusión vía Ollama, catálogo persistente y reproducible, y su consumo por el renderizador de video (retratos/fondos en los frames con fallback al placeholder actual).

### Modified Capabilities
<!-- Ninguna: `video-studio` no existe aún como spec viva (solo delta de 003 sin archivar); el comportamiento del renderizador se especifica dentro de `ai-assets`. -->

## Impact

- **Código:** `src/services/asset-generator.ts` (nuevo), `src/cli/generate-assets.ts` (nuevo), `src/services/video-composer.ts` (modificado), `src/cli/render-video.ts` (sin cambios o mínimos).
- **Dependencias:** ninguna nueva — usa `fetch` nativo + Ollama local (modelo `bmad4t/flux.1-schnell` a descargar, ~4-5GB).
- **Assets:** `src/assets/avatars/*.png` (15) + `src/assets/backgrounds/*.png` (3), commiteados al repo.
- **Runtime:** 100% local y $0 tokens (FLUX vía Ollama, mismo principio que el debate).
