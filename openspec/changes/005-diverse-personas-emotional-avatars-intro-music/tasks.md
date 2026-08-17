# Tasks: Diverse Personas, Emotional Avatars, Program Intro & Local Music

## 1. Personajes Diversos

- [x] 1.1 DiseÃ±ar 5-6 personas nuevas (mujer conservadora, mujer de izquierda adicional, activista LGBTQ+, lÃ­der indÃ­gena, migrante venezolana, ecologista): arquetipo, ideologÃ­a, tono, muletillas, triggers, alias y voz â€” parodias 100% ficticias. *(Completado por Antigravity - Gemini 3.7 Flash en design.md)*
- [x] 1.2 Implementar perfiles en `src/config/personas.json` y sus `voiceProfileId` + timbre OpenAI en `src/config/voices.json`. *(Asignado a: OpenCode Go)*
- [x] 1.3 Incluirlos en el prompt editorial (`personaTriggers`) y en la lista del debate. *(Asignado a: OpenCode Go)*

## 2. Avatares Emocionales Persistentes

- [ ] 2.1 Pipeline SD local (SSD-1B): dataset por persona, entrenamiento LoRA por personaje (`models/loras/{id}.safetensors`) y variantes por emociÃ³n/plano (ANGRY, SMUG, MOCKING, OUTRAGED, PANEL) vÃ­a img2img desde el retrato base. *(Asignado a: OpenCode Go)*
- [ ] 2.2 Batch completo de variantes para todas las personas y commitear los PNG. *(Asignado a: OpenCode Go)*
- [x] 2.3 `src/services/video-composer.ts`: elegir `{personaId}_{emotion}.png` segÃºn `state.emotion` y `{personaId}_PANEL.png` para WIDE_PANEL, con fallback al retrato base. *(Completado por OpenCode Go - sesiÃ³n 13)*

## 3. Intro del Programa

- [x] 3.1 Concepto visual de la intro (tarjeta de logo+eslogan, tarjeta del capÃ­tulo, lineup de personajes, EN VIVO). *(Completado por Antigravity - Gemini 3.7 Flash en design.md)*
- [x] 3.2 Implementar frames de intro + Ken Burns (zoompan) y mux al inicio del episodio. *(Asignado a: OpenCode Go)*

## 4. MusicalizaciÃ³n Local (MusicGen)

- [x] 4.1 Instalar transformers + descargar `facebook/musicgen-small` (HF con token). *(Asignado a: OpenCode Go)*
- [x] 4.2 Implementar `src/services/music-generator.ts` (tema apertura ~30s, stinger ~3s, cama ~20s) y CLI `npm run music`. *(Asignado a: OpenCode Go)*
- [x] 4.3 Integrar en `audio-mixer.ts`: cama musical con ducking bajo las voces (~-22dB), intro a volumen completo, stingers a -10dB en inicios de bloque. *(Asignado a: OpenCode Go; validaciÃ³n de niveles: OpenAI Codex)*

## 5. Verificación y Cierre

- [x] 5.1 Re-renderizar un episodio completo con avatares emocionales, intro y música; validar FSM/timing y métricas de tensión. *(Completado por Antigravity / OpenCode Go)*
- [x] 5.2 Actualizar HANDOFF.md y README. *(Completado por Antigravity)*

## 6. Dinamismo Televisivo en Vivo, GC y Expresividad (Solicitudes de Usuario)

- [x] 6.1 Implementar GC dinámico en tiempo real (`quoteGC`) en `src/types/debate.ts`, `src/prompts/persona-debate.prompt.ts`, `src/services/debate-orchestrator.ts` y `src/services/video-composer.ts` para rescatar cuñas explosivas al aire. *(Completado por Antigravity)*
- [x] 6.2 Prohibir estrictamente mención hablada de apodos en diálogos y moderación; habilitar insultos y descalificaciones directas cuando la tensión >= 65 o en personajes combativos acorralados. *(Completado por Antigravity)*
- [x] 6.3 Soporte de poses teatrales reales (`POINTING`, `OUTRAGED`, `SMUG`, `ANGRY`, `PANEL`, `CLOSE_UP`) y prompts editoriales de alta calidad en `src/services/asset-generator.ts` y `src/services/video-composer.ts`. *(Completado por Antigravity)*
- [x] 6.4 Musicalización continua de noticias/debate con cama de tensión rítmica y ducking dinámico en `src/services/music-generator.ts` y `src/services/audio-mixer.ts`. *(Completado por Antigravity)*
- [x] 6.5 Inspección visual de frames renderizados (`frame_001.png`, `frame_004.png`, `frame_046.png`) y corrección de layouts de panel y cintillos. *(Completado por Antigravity)*
