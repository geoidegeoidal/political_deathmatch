# Proposal: Multi-Voice TTS Audio Pipeline & TV Video Studio Renderer

## Overview
Implementar la **Fase 3** de *Political Deathmatch*, transformando el guion estructurado (`debate_transcript.json`) en una experiencia audiovisual completa lista para YouTube:
1. **Pipeline de Audio & TTS Multi-Voz:** Generación de voces sintéticas diferenciadas para cada uno de los 15 personajes (`voiceProfileId`), soporte para interrupciones con audio superpuesto (*pisadas de palabra*) y efectos sonoros de TV (gongs, cortinilla, murmullos de estudio).
2. **Renderizador de Estudio de TV (Video Studio Renderer):** Composición visual en 1080p estilo programa de debate (*Sin Filtros / Tolerancia Cero*), con avatares reactivos al audio, generador de caracteres (GC / cintillos escandalosos), termómetro de tensión en vivo y conmutación automática de cámaras.

## Why
El guion generado por la IA en la Fase 2 (`debate_transcript.json`, ~15 minutos) necesita convertirse en un producto de video real y automatizado. Sin este pipeline:
- No existe salida audiovisual para publicar en canales de YouTube o redes sociales.
- La experiencia perdería el dinamismo televisivo sin voces con acentos característicos ni el caos de las interrupciones donde dos panelistas se pisan la palabra.

## What Changes
1. **Audio Synthesis Service (`src/services/tts-pipeline.ts`):**
   - Mapeo de perfiles de voz (`voice_es_cl_moderator`, `voice_es_ve_caudillo`, `voice_es_ar_ancap`, etc.) utilizando motores locales o `edge-tts` de alta calidad sin costo por token.
   - Generación de stems individuales por turno y cálculo exacto de duraciones en milisegundos (`audio_timeline.json`).
   - Mezcla de pistas de audio (audio ducking + overlay) cuando ocurre una interrupción (`isInterruption: true`).
2. **Generador de Assets & Avatares:**
   - Sistema de sprites / avatares 2D con estados emocionales (`TALKING`, `IDLE`, `OUTRAGED`, `MOCKING`, `INTERRUPTING`).
3. **Motor de Renderizado Visual (`src/services/video-renderer.ts`):**
   - Composición de escena TV: fondo de estudio, mesa de debate, cintillos inferiores (GC) con titulares sensacionalistas y barra de noticias rodante (*ticker*).
   - Conmutación dinámica de planos según `cameraCue`:
     - `SPEAKER_FOCUS`: Primer plano del panelista que habla.
     - `SPLIT_SCREEN_VERSUS`: Pantalla dividida cuando hay fuego cruzado o interrupción.
     - `WIDE_PANEL`: Plano general de los 4 panelistas y el moderador.
4. **Comando CLI Unificado (`src/cli/render-episode.ts`):**
   - Ejecución end-to-end: `debate_transcript.json` -> Audio Stems -> Video Composición -> `episode_output.mp4`.

## Model Allocation
- **Antigravity (Gemini 3.7 Flash - Thinking High):** Diseño de la arquitectura visual, timeline de audio, plantillas de GC / cintillos y layouts de cámara.
- **OpenCode Go (DeepSeek-V3 / Qwen 2.5 Coder):** Implementación de drivers de audio TTS, sincronización de stems, binding de FFmpeg y scripts de renderizado CLI.
