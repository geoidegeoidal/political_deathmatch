## Purpose

Generar y persistir localmente los retratos de los 15 personajes y la escenografía del estudio de televisión con un modelo de difusión (FLUX.1 Schnell vía Ollama), y garantizar que el renderizador de video los consuma con degradación elegante.

## ADDED Requirements

### Requirement: Local Diffusion Asset Generation
El sistema DEBERÁ generar assets visuales (retratos y fondos) con un modelo de difusión local servido por Ollama, sin dependencia de servicios en la nube.

#### Scenario: Persona Portrait Generation
- **GIVEN** un personaje del catálogo `personas.json` con su arquetipo, ideología y registro sociocultural
- **WHEN** se ejecuta la generación de assets
- **THEN** el sistema genera un retrato **caricaturesco satírico semi-realista** tipo estudio TV (busto, iluminación dramática, estilo dibujo satírico — nunca fotorrealista)
- **AND** lo guarda en `src/assets/avatars/{personaId}.png`

#### Scenario: Scenography Background Generation
- **GIVEN** los tres modos de cámara del renderizador (`SPEAKER_FOCUS`, `SPLIT_SCREEN_VERSUS`, `WIDE_PANEL`)
- **WHEN** se ejecuta la generación de assets
- **THEN** el sistema genera un fondo de estudio de debate por cada modo de cámara
- **AND** los guarda en `src/assets/backgrounds/{cameraCue}.png`

#### Scenario: Offline Operation
- **GIVEN** un equipo sin acceso a internet
- **WHEN** se solicita la generación de assets
- **THEN** la generación DEBE completarse usando únicamente el servidor Ollama local (`localhost:11434`)
- **AND** no DEBE requerir ninguna clave de API ni descarga externa.

### Requirement: Persistent and Reproducible Asset Catalog
Los assets generados DEBERÁN persistir en el repositorio y ser reproducibles de forma determinista.

#### Scenario: One-Shot Generation with Skip
- **GIVEN** un asset que ya existe en el catálogo
- **WHEN** se ejecuta la generación sin flag de fuerza
- **THEN** el sistema omite su regeneración y reutiliza el archivo existente

#### Scenario: Deterministic Seed
- **GIVEN** un asset con seed determinista asignado
- **WHEN** se regenera con el flag de fuerza
- **THEN** el resultado es reproducible (mismo seed para el mismo asset).

### Requirement: Video Renderer Asset Consumption
El renderizador de video DEBERÁ usar los retratos y fondos del catálogo en la composición de cada frame, con degradación elegante si faltan.

#### Scenario: Speaker Portrait in Frame
- **GIVEN** un turno con `cameraCue: "SPEAKER_FOCUS"` y un retrato disponible para el orador activo
- **WHEN** se compone el frame
- **THEN** el frame muestra el retrato del orador en el escenario principal en lugar del placeholder genérico

#### Scenario: Versus Split with Opponent Portrait
- **GIVEN** un turno con `cameraCue: "SPLIT_SCREEN_VERSUS"`, retratos disponibles del orador y de su oponente
- **WHEN** se compone el frame
- **THEN** la pantalla dividida muestra el retrato del orador a la izquierda y el del oponente a la derecha

#### Scenario: Scenography by Camera Cue
- **GIVEN** un frame con un `cameraCue` definido y un fondo disponible para ese modo
- **WHEN** se compone el frame
- **THEN** se usa el fondo de estudio correspondiente a ese `cameraCue`

#### Scenario: Graceful Fallback on Missing Asset
- **GIVEN** un asset de retrato o fondo inexistente en el catálogo
- **WHEN** se compone el frame
- **THEN** el renderizador continúa con el placeholder/emisor de emoción actual
- **AND** no interrumpe el renderizado del episodio.

### Requirement: Brand Tagline in Frames
Los frames DEBERÁN mostrar el eslogan de marca del programa en el header o ticker: *"El primer podcast político sin censura con IA"*.

#### Scenario: Tagline Display
- **GIVEN** cualquier frame del episodio
- **WHEN** se compone el header o el ticker
- **THEN** el eslogan "EL PRIMER PODCAST POLÍTICO SIN CENSURA CON IA" aparece en pantalla (header, ticker o ambos)
