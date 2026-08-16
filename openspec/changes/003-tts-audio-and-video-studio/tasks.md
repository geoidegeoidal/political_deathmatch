# Tasks: Multi-Voice TTS Audio Pipeline & TV Video Studio Renderer

## Implementation Phases

- [x] 1. Tipos de Dominio y Mapeo de Voces <!-- id: media-types -->
  - [x] 1.1 Definir interfaces `AudioStemInfo`, `AudioTimeline`, `VideoRenderConfig` en `src/types/media.ts`. *(Completado por Antigravity - Gemini 3.7 Flash)*
  - [x] 1.2 Crear catálogo de configuración de voces neuronales en `src/config/voices.json`. *(Completado por Antigravity - Gemini 3.7 Flash)*

- [ ] 2. Pipeline de Síntesis de Audio (TTS) <!-- id: tts-pipeline -->
  - [ ] 2.1 Implementar `src/services/tts-pipeline.ts` para generación batch de stems de audio por turno a partir de `debate_transcript.json`. *(Asignado a: OpenCode Go)*
  - [ ] 2.2 Implementar `src/services/audio-mixer.ts` para superposición de interrupciones, cálculo de timeline y mezcla master. *(Asignado a: OpenCode Go)*
  - [ ] 2.3 Crear comando CLI `src/cli/render-audio.ts` para generar todos los audios y exportar `audio_timeline.json`. *(Asignado a: OpenCode Go)*

- [x] 3. Motor de Composición Visual de Estudio TV <!-- id: video-composer -->
  - [x] 3.1 Diseñar el generador de layouts de estudio TV (Header, Main Stage, Lower Thirds GC, Ticker) en `src/services/video-composer.ts`. *(Completado por Antigravity - Gemini 3.7 Flash)*
  - [x] 3.2 Implementar lógica de conmutación de cámaras (`SPEAKER_FOCUS`, `SPLIT_SCREEN_VERSUS`, `WIDE_PANEL`) y termómetro de tensión. *(Completado por Antigravity - Gemini 3.7 Flash)*

- [ ] 4. CLI de Renderizado de Video & Exportación MP4 <!-- id: video-cli -->
  - [ ] 4.1 Implementar comando `src/cli/render-video.ts` para componer el video final 1080p con audio master. *(Asignado a: OpenCode Go)*
  - [ ] 4.2 Probar renderizado de 1 bloque y del episodio completo exportando `output/episode_1080p.mp4`. *(Asignado a: OpenCode Go)*
