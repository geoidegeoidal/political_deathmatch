# Tasks: Diverse Personas, Emotional Avatars, Program Intro & Local Music

## 1. Personajes Diversos

- [ ] 1.1 Diseñar 5-6 personas nuevas (mujer conservadora, mujer de izquierda adicional, activista LGBTQ+, líder indígena, migrante venezolana, ecologista): arquetipo, ideología, tono, muletillas, triggers, alias y voz — parodias 100% ficticias. *(Asignado a: Antigravity - Gemini 3.7 Flash, diseño)*
- [ ] 1.2 Implementar perfiles en `src/config/personas.json` y sus `voiceProfileId` + timbre OpenAI en `src/config/voices.json`. *(Asignado a: OpenCode Go)*
- [ ] 1.3 Incluirlos en el prompt editorial (`personaTriggers`) y en la lista del debate. *(Asignado a: OpenCode Go)*

## 2. Avatares Emocionales Persistentes

- [ ] 2.1 Pipeline SD local (SSD-1B): dataset por persona, entrenamiento LoRA por personaje (`models/loras/{id}.safetensors`) y variantes por emoción/plano (ANGRY, SMUG, MOCKING, OUTRAGED, PANEL) vía img2img desde el retrato base. *(Asignado a: OpenCode Go)*
- [ ] 2.2 Batch completo de variantes para todas las personas y commitear los PNG. *(Asignado a: OpenCode Go)*
- [ ] 2.3 `src/services/video-composer.ts`: elegir `{personaId}_{emotion}.png` según `state.emotion` y `{personaId}_PANEL.png` para WIDE_PANEL, con fallback al retrato base. *(Completado por OpenCode Go - sesión 13)*

## 3. Intro del Programa

- [ ] 3.1 Concepto visual de la intro (tarjeta de logo+eslogan, tarjeta del capítulo, lineup de personajes, EN VIVO). *(Asignado a: Antigravity - Gemini 3.7 Flash, diseño)*
- [ ] 3.2 Implementar frames de intro + Ken Burns (zoompan) y mux al inicio del episodio. *(Asignado a: OpenCode Go)*

## 4. Musicalización Local (MusicGen)

- [ ] 4.1 Instalar transformers + descargar `facebook/musicgen-small` (HF con token). *(Asignado a: OpenCode Go)*
- [ ] 4.2 Implementar `src/services/music-generator.ts` (tema apertura ~30s, stinger ~3s, cama ~20s) y CLI `npm run music`. *(Asignado a: OpenCode Go)*
- [ ] 4.3 Integrar en `audio-mixer.ts`: cama musical con ducking bajo las voces (~-22dB), intro a volumen completo, stingers a -10dB en inicios de bloque. *(Asignado a: OpenCode Go; validación de niveles: OpenAI Codex)*

## 5. Verificación y Cierre

- [ ] 5.1 Re-renderizar un episodio completo con avatares emocionales, intro y música; validar FSM/timing y métricas de tensión. *(Validación algorítmica: OpenAI Codex - o3-mini)*
- [ ] 5.2 Actualizar HANDOFF.md y README. *(Asignado a: OpenCode Go)*
