# Design: AI Avatar & Scenography Assets (FLUX vía Ollama)

## Context

Ver proposal.md (Why). El renderizador de la Fase 3 (`src/services/video-composer.ts`) compone frames SVG 1080p con placeholders de emoji. La red bloquea huggingface.co (401) y speech.platform.bing.com (403), pero el registry de Ollama funcionó (Gemma del debate) y la GPU es RTX 3060 12GB. La generación debe ser 100% local, $0 tokens y persistente (commiteada).

## Goals / Non-Goals

**Goals:**
- 15 retratos de personaje + 3 fondos de estudio, generados una sola vez con FLUX.1 Schnell (Q4) vía Ollama.
- Catálogo en `src/assets/{avatars,backgrounds}/` commiteado; regeneración opt-in (`--force`).
- Renderizador embebe los assets en los frames con fallback al placeholder actual.

**Non-Goals:**
- No se generan estados emocionales múltiples por personaje (1 retrato neutral + badge de emoción existente).
- No hay animación/rigging de avatares (boca reactiva, gestos) — queda fuera del alcance.
- No se integra ningún servicio de imágenes en la nube.

## Decisions

### 1. Motor de difusión: Ollama `bmad4t/flux.1-schnell` (cuantizado)
- **Elección:** `ollama pull bmad4t/flux.1-schnell:q4_0` y llamadas HTTP a `POST /api/generate` con `images: []` de salida.
- **Alternativas descartadas:** ComfyUI/A1111 (requieren checkpoints de HF/Civitai — bloqueados), SD 1.5/SDXL vía API local (instalación pesada), kokoro-js (bloqueado por HF).
- **Racional:** mismo infraestructura que el runtime del debate (Ollama ya instalado y operativo en esta red); 12GB VRAM sobran para FLUX Q4 (~5GB). FLUX da calidad de retrato muy superior a SD 1.5.

### 2. Formato de assets, estilo visual y prompt determinista
- **Estilo decidido: caricatura satírica semi-realista** (NO fotorrealismo). Racional: el video es tipo podcast sin lipsync — un rostro fotorrealista congelado genera efecto uncanny; una caricatura estática se lee como intencional, refuerza el género satírico latino y el guardrail de parodias 100% ficticias.
- Retratos: PNG 1024x1024 (nativo FLUX), recortados/centrados por sharp a 800x800 para el stage.
- Cada asset tiene un **seed fijo** (hash corto del `personaId`/`cameraCue`) y un **prompt template** construido desde `persona.archetype + ideology + tone + alias` con prefijo de estilo fijo: `"semi-realistic satirical cartoon caricature, exaggerated features, TV debate studio, dramatic broadcast lighting, stylized illustrated portrait, no text"`.
- Fondos: prompt fijo por `cameraCue` (set de debate rojo/negro, mesa, panel LED), mismo lenguaje visual caricaturesco.
- **Eslogan de marca:** el header y el ticker del renderizador muestran "EL PRIMER PODCAST POLÍTICO SIN CENSURA CON IA" (constante `BRAND_TAGLINE` en el compositor).

### 3. Consumo en `video-composer.ts`
- El compositor carga los PNG al construir el frame y los embebe como **data URI en `<image>` dentro del SVG** — un solo paso sharp, sin compositing extra.
- Resolución: el SVG ya es 1920x1080; el retrato se encaja en el círculo/panel del stage actual (clipPath circular para SPEAKER_FOCUS; rectángulos para SPLIT_SCREEN_VERSUS).
- **Degradación elegante:** `existsSync` por asset; si falta → emoji placeholder actual (spec: Graceful Fallback).

### 4. Generación batch
- `src/cli/generate-assets.ts` recorre `personas.json` (15) + los 3 `cameraCue`, saltea existentes, pide cada asset al servidor Ollama con timeout generoso (FLUX en 3060: ~20-40s/imagen) y guarda PNG.

## Risks / Trade-offs

- **[El modelo FLUX en registry de Ollama cambia de tag] → Mitigación:** validar el pull al inicio del CLI; error claro si no existe.
- **[Generación lenta en CPU si la GPU está ocupada por el debate] → Mitigación:** batch secuencial con log por asset; es one-shot.
- **[Retratos "muy caricaturescos" o inconsistentes entre personajes] → Mitigación:** estilo fijo en el prefijo del prompt (caricatura satírica semi-realista) + seed determinista; iterar el template si hace falta sin tocar el pipeline.
- **[Emoción no visible en el retrato (1 estado por personaje)] → Mitigación:** se conserva el badge de emoción + emoji de estado ya existente en el frame.

## Migration Plan

1. Pull del modelo (`ollama pull bmad4t/flux.1-schnell:q4_0`).
2. `npm run assets` → genera los 18 PNG en `src/assets/`.
3. Commit de los PNG (persistencia).
4. Integrar en `video-composer.ts` (embebido data URI + fallback).
5. `npm run video` → re-render del episodio; inspección de frames.
6. Rollback: quitar la lectura de assets (el fallback deja el render igual que hoy).

## Open Questions

Ninguna bloqueante. (El tag cuantizado exacto del modelo se resuelve al momento del pull; el CLI reporta y sugiere alternativas si falla.)
