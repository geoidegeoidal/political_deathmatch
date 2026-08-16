## Purpose

Ampliar el catálogo de personajes (diversidad de género, orientación y origen), dotar a cada personaje de avatares con variantes emocionales de diseño persistente, y añadir intro y musicalización con volúmenes controlados.

## ADDED Requirements

### Requirement: Diverse Persona Roster
El catálogo DEBERÁ incluir personajes de géneros, orientaciones y orígenes diversos, manteniendo la política de parodias 100% ficticias.

#### Scenario: Expanded Roster
- **GIVEN** el catálogo actual de 17 personajes
- **WHEN** se amplía el roster
- **THEN** se agregan al menos 5 personajes nuevos incluyendo: mujer de derecha, mujer de izquierda adicional, activista LGBTQ+, líder indígena y persona migrante
- **AND** todos siguen siendo parodias satíricas ficticias sin nombres reales

### Requirement: Emotional Avatar Variants
Cada personaje DEBERÁ tener variantes de avatar por emoción con diseño persistente (mismo personaje, expresión distinta).

#### Scenario: Emotion Variant Generation
- **GIVEN** un retrato base de un personaje
- **WHEN** se genera una variante emocional (ANGRY, SMUG, MOCKING, OUTRAGED)
- **THEN** la variante usa el retrato base como imagen de referencia
- **AND** se guarda en `src/assets/avatars/{personaId}_{EMOCION}.png`

#### Scenario: Emotion Variant Rendering
- **GIVEN** un turno con `emotion` definida y su variante de avatar existente
- **WHEN** se compone el frame
- **THEN** se usa la variante emocional del personaje
- **AND** si la variante no existe, se usa el retrato base como fallback

### Requirement: Program Intro Segment
El episodio DEBERÁ comenzar con una intro de programa de ~15 segundos.

#### Scenario: Intro Rendering
- **GIVEN** el inicio del episodio
- **WHEN** se renderiza el video
- **THEN** se incluye un segmento de intro con logo, eslogan y lineup de personajes
- **AND** la intro usa el tema musical de apertura a volumen completo

### Requirement: Local Program Music with Volume Control
El sistema DEBERÁ generar música localmente (tema de apertura, stingers y cama musical) y mezclarla con volúmenes controlados.

#### Scenario: Music Bed with Ducking
- **GIVEN** un episodio con cama musical ambiente
- **WHEN** un panelista habla
- **THEN** la cama musical se atenúa automáticamente (ducking) por debajo de la voz (~-22dB relativo)
- **AND** en silencios vuelve a su nivel base

#### Scenario: Local Generation
- **GIVEN** la generación de música solicitada
- **WHEN** se ejecuta el generador
- **THEN** la música se sintetiza con un modelo local open-source (MusicGen) sin costo por token
- **AND** no requiere servicios de música en la nube.
