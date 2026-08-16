# Tasks: Diverse Personas, Emotional Avatars, Program Intro & Local Music

## 1. Personajes Diversos

- [ ] 1.1 Agregar 5-6 personas nuevas a `src/config/personas.json` (mujer conservadora, mujer de izquierda adicional, activista LGBTQ+, líder indígena, migrante venezolana, ecologista) — parodias 100% ficticias.
- [ ] 1.2 Agregar sus `voiceProfileId` en `src/config/voices.json` (timbres OpenAI existentes + instrucciones distintas).
- [ ] 1.3 Incluirlos en el prompt editorial (`personaTriggers`) y en la lista del debate.

## 2. Avatares Emocionales Persistentes

- [ ] 2.1 Extender `src/services/asset-generator.ts`: modo `--emotions` que genera variantes (ANGRY, SMUG, MOCKING, OUTRAGED) usando el retrato base como imagen de referencia de gpt-image-1.
- [ ] 2.2 Generar variantes emocionales para los personajes aprobados (según saldo) y commitear los PNG.
- [ ] 2.3 `src/services/video-composer.ts`: elegir `{personaId}_{emotion}.png` según `state.emotion` con fallback al retrato base.

## 3. Intro del Programa

- [ ] 3.1 Crear frames de intro (logo+eslogan, tarjeta del capítulo, lineup de personajes, EN VIVO) como SVG en el compositor.
- [ ] 3.2 Renderizar intro ~15s con Ken Burns (zoompan) y mux al inicio del episodio.

## 4. Musicalización Local (MusicGen)

- [ ] 4.1 Instalar transformers + descargar `facebook/musicgen-small` (HF con token).
- [ ] 4.2 Implementar `src/services/music-generator.ts` (tema apertura ~30s, stinger ~3s, cama ~20s) y CLI `npm run music`.
- [ ] 4.3 Integrar en `audio-mixer.ts`: cama musical con ducking bajo las voces (~-22dB), intro a volumen completo, stingers a -10dB en inicios de bloque.

## 5. Verificación y Cierre

- [ ] 5.1 Re-renderizar un episodio de prueba (nuevo, no el actual) con avatares emocionales, intro y música.
- [ ] 5.2 Actualizar HANDOFF.md y README.
