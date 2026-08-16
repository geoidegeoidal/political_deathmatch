# Tasks: AI Avatar & Scenography Assets (FLUX vía Ollama)

## 1. Modelo y Verificación

- [ ] 1.1 Descargar modelo de difusión: `ollama pull bmad4t/flux.1-schnell:q4_0` y verificar con una generación de prueba vía `POST /api/generate`.
- [ ] 1.2 Definir y validar el prompt template de retratos (estilo **caricatura satírica semi-realista**: "semi-realistic satirical cartoon caricature, exaggerated features, TV debate studio, dramatic broadcast lighting, stylized illustrated portrait, no text") con 1 personaje de prueba.

## 2. Generador de Assets

- [ ] 2.1 Implementar `src/services/asset-generator.ts`: build de prompts desde `personas.json` (arquetipo/ideología/tono/alias) y fondos por `cameraCue`; llamada HTTP a Ollama `/api/generate` con seed determinista por asset; guardado PNG en `src/assets/avatars/{personaId}.png` y `src/assets/backgrounds/{cameraCue}.png`; skip si existe.
- [ ] 2.2 Crear CLI `src/cli/generate-assets.ts` (script npm `assets`) que genera los 15 retratos + 3 fondos con log por asset y flag `--force`.
- [ ] 2.3 Ejecutar la generación completa y commitear los 18 PNG al repo (catálogo persistente).

## 3. Integración en el Renderizador

- [ ] 3.1 Modificar `src/services/video-composer.ts`: cargar retrato del orador activo (y del oponente en `SPLIT_SCREEN_VERSUS`) y fondo según `cameraCue`; embebido como data URI en el SVG (clip circular para `SPEAKER_FOCUS`, rects para split); mantener badge de emoción.
- [ ] 3.2 Agregar el eslogan de marca al header y al ticker: "EL PRIMER PODCAST POLÍTICO SIN CENSURA CON IA".
- [ ] 3.3 Implementar degradación elegante: si falta el asset, usar placeholder/emoji actual sin abortar el render.

## 4. Verificación y Cierre

- [ ] 4.1 Re-renderizar el episodio completo (`npm run video`) e inspeccionar frames con retratos/fondos reales.
- [ ] 4.2 Actualizar `HANDOFF.md` y README (comando `npm run assets`).
