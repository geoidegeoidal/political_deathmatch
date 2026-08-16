# debate-engine Specification (Delta)

## Purpose
Definir los requerimientos de la máquina de estados, el orquestador multi-agente y la simulación de debate televisivo en tiempo real o por lotes.

## Requirements

### Requirement: TV Debate Finite State Machine
El orquestador DEBERÁ gestionar la secuencia de cada bloque de debate mediante una máquina de estados determinista.

#### Scenario: Block Execution Lifecycle
- GIVEN una pauta semanal cargada con al menos 1 bloque de debate
- WHEN el orquestador inicia la simulación del bloque
- THEN transicionar secuencialmente por:
  1. `INTRO_BLOCK`: Presentación del tema y cintillo por el Moderador.
  2. `MODERATOR_QUESTION`: Pregunta provocadora dirigida a un panelista inicial.
  3. `PANEL_INTERVENTION`: Respuesta del panelista con límite de palabras/tiempo.
  4. `CROSSFIRE`: Réplica directa del adversario ideológico con cálculo de tensión.
  5. `MODERATOR_INTERVENTION`: Moderador cortando o azuzando la discusión.
  6. `BLOCK_SUMMARY`: Cierre del bloque y conclusión.

### Requirement: Tension Meter and Interruption Mechanics
El sistema DEBERÁ calcular dinámicamente un valor de `tensionScore` (0 a 100) basado en la agresividad de las intervenciones.

#### Scenario: Crossfire Trigger
- GIVEN una intervención de un panelista con `tensionScore >= 75`
- WHEN el texto contiene un gatillante ideológico de otro panelista
- THEN insertar un evento de tipo `INTERRUPTION` en el guion
- AND asignar la emoción del personaje que interrumpe como `OUTRAGED` o `MOCKING`.

### Requirement: Persona Profile Schema and RAG Injection
Cada personaje DEBERÁ estar definido por un perfil estructurado inyectado en el system prompt.

#### Scenario: Persona Adherence
- GIVEN un personaje con ideología "Marxismo Ortodoxo"
- WHEN responde a un tema de crisis de seguridad
- THEN encuadrar la respuesta bajo la lucha de clases y la crítica al capital
- AND utilizar su léxico y muletillas configuradas.

### Requirement: Production Transcript Export
El sistema DEBERÁ exportar un archivo `debate_transcript.json` listo para el pipeline de audio (TTS) y el renderizador visual.

#### Scenario: Transcript Schema
- GIVEN un debate completado
- WHEN se serializa el guion
- THEN incluir por cada turno: `turnId`, `speakerId`, `speakerName`, `emotion`, `speechText`, `cameraCue`, `estimatedDurationSec`.
