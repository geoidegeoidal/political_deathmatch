# video-studio Specification (Delta)

## Purpose
Definir los requerimientos para la composición visual en 1080p, layouts de estudio de televisión, conmutador de cámaras, avatares reactivos y cintillos informativos (GC).

## Requirements

### Requirement: Broadcast TV Layout Composition
El sistema DEBERÁ componer un marco de video en resolución Full HD (1920x1080 a 30fps) con estética de estudio de televisión de debate.

#### Scenario: Visual Studio Elements
- GIVEN un episodio en renderizado
- WHEN se genera el video
- THEN incluir:
  1. Fondo de estudio con panel LED y mesa de debate.
  2. Generador de Caracteres (GC / Lower Thirds) con el titular del bloque en mayúsculas y nombre del orador activo.
  3. Cintillo inferior con barra de noticias rodante (*ticker*).
  4. Termómetro de tensión del estudio en tiempo real (0 a 100).
  5. Marca de agua / logo de *Political Deathmatch*.

### Requirement: Dynamic Camera Switching
El sistema DEBERÁ cambiar el plano visual en sincronía con el campo `cameraCue` de cada turno.

#### Scenario: Split-Screen Versus
- GIVEN un turno con `cameraCue: "SPLIT_SCREEN_VERSUS"` y `targetSpeakerId` definido
- WHEN el turno entra en reproducción
- THEN renderizar una pantalla dividida mostrando al orador activo a la izquierda y al adversario a la derecha con animación de réplica.

#### Scenario: Speaker Focus
- GIVEN un turno con `cameraCue: "SPEAKER_FOCUS"`
- WHEN el personaje habla
- THEN enfocar en primer plano al personaje activo con su nombre y alias en el GC.

### Requirement: Audio-Reactive Character Avatars
Los avatares DEBERÁN alternar sus estados visuales según la actividad de audio y el campo `emotion`.

#### Scenario: Talking State
- GIVEN un personaje con audio activo
- WHEN se reproduce su voz
- THEN animar la boca/expresión en estado `TALKING` o `OUTRAGED` según su emoción.
- AND los demás panelistas deben permanecer en estado `IDLE` o `LISTENING`.
