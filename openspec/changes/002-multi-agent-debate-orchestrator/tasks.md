# Tasks: Multi-Agent Debate Engine & TV Orchestrator

## Implementation Phases

- [ ] 1. Tipos de Dominio y Perfiles de Personajes <!-- id: personas-types -->
  - [ ] 1.1 Definir interfaces `PersonaProfile`, `DebateTurn`, `DebateTranscript` en `src/types/debate.ts`. *(Asignado a: OpenCode Go)*
  - [ ] 1.2 Crear catálogo de personajes base en `src/config/personas.json` (Karl Marx, Joven Incel, Fanático Religioso, Moderador Tipo Feito). *(Asignado a: Antigravity - Gemini 3.7 Flash)*

- [ ] 2. Conector Runtime Sin Censura (Local Ollama / OpenRouter) <!-- id: runtime-connector -->
  - [ ] 2.1 Implementar driver `src/services/debate-runtime.ts` para Ollama (`Gemma4-12B-QAT-Uncensored`) y fallback OpenRouter. *(Asignado a: OpenCode Go)*
  - [ ] 2.2 Diseñar los system prompts de combate ideológico sin censura en `src/prompts/persona-debate.prompt.ts`. *(Asignado a: Antigravity - Gemini 3.7 Flash)*

- [ ] 3. Orquestador y Máquina de Estados de TV <!-- id: debate-orchestrator -->
  - [ ] 3.1 Implementar `src/services/debate-orchestrator.ts` con la lógica de turnos, réplicas y moderador. *(Asignado a: Antigravity - Gemini 3.7 Flash)*
  - [ ] 3.2 Implementar el calculador de tensión y generador de interrupciones dinámicas. *(Asignado a: Antigravity - Gemini 3.7 Flash)*

- [ ] 4. CLI de Simulación y Exportación de Guion <!-- id: simulation-cli -->
  - [ ] 4.1 Crear comando `src/cli/simulate-debate.ts` para correr un debate completo a partir de `weekly_agenda.json`. *(Asignado a: OpenCode Go)*
  - [ ] 4.2 Probar simulación de 1 bloque con diálogo completo y exportar `debate_transcript.json`. *(Asignado a: OpenCode Go)*
