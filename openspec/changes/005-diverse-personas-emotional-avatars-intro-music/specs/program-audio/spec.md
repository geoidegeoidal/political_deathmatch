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

### Requirement: Dynamic GC with Live Cuñas
El sistema DEBERÁ extraer o generar en cada turno una cuña polémica en mayúsculas (`quoteGC`) y renderizarla en el cintillo GC de la transmisión televisiva en vivo.

#### Scenario: Dynamic Quote Display
- **GIVEN** una intervención donde el orador lanza una frase impactante o descalificación
- **WHEN** el generador de caracteres (GC) compone el Lower Third
- **THEN** se muestra la cuña entre comillas en amarillo/blanco con el badge `🔴 CUÑA EN VIVO` y el nombre del orador
- **AND** si no hay cuña específica, muestra el titular del bloque correspondiente.

### Requirement: Strict No-Nicknames & Edgy Insults in High Tension
Los personajes y el moderador DEBERÁN llamarse únicamente por su nombre formal o cargo sin pronunciar apodos en voz alta, y DEBERÁN desmadrarse con insultos y descalificaciones directas cuando la tensión sea alta (>= 65) o cuando se agoten los argumentos.

#### Scenario: No Spoken Nicknames
- **GIVEN** cualquier intervención o pregunta
- **WHEN** un personaje interpela a otro
- **THEN** usa el nombre formal ("Lautaro", "Capitán Sotomayor", "Dr. Errázuriz", "Guzmán", etc.)
- **AND** jamás pronuncia los apodos o alias entre comillas.

#### Scenario: Edgy Outrage & Direct Insults
- **GIVEN** un momento de tensión elevada (>= 65) o un personaje de tier COMBATIVE_EXTREME acorralado
- **WHEN** formula su respuesta o réplica
- **THEN** pierde la paciencia y emplea descalificaciones directas ("hipócrita", "sinvergüenza mentiroso", "vendido", "facho miserable", "comunista de cartón", "chanta") sin tapujos.

### Requirement: Character Poses & Camera Shot Variants
El compositor visual DEBERÁ soportar poses dinámicas (POINTING, OUTRAGED, SMUG, ANGRY, PANEL, CLOSE_UP) y tiros de cámara reales con alta calidad gráfica editorial.

#### Scenario: Dynamic Pose Resolution
- **GIVEN** un turno con emoción o tiro de cámara específico
- **WHEN** el compositor visual busca el asset del avatar
- **THEN** prioriza la pose/emoción correspondiente (`{id}_{EMOTION}.png` o `{id}_{POSE}.png`)
- **AND** aplica fallback inteligente al retrato base si no existe la variante.
