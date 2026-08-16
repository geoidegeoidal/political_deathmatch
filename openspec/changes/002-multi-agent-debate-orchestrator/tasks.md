# Tasks: Multi-Agent Debate Engine & TV Orchestrator

## Implementation Phases

- [x] 1. Tipos de Dominio y Perfiles de Personajes <!-- id: personas-types -->
  - [x] 1.1 Definir interfaces `PersonaProfile`, `DebateTurn`, `DebateTranscript` en `src/types/debate.ts`. *(Completado)*
  - [x] 1.2 Crear catálogo de personajes base en `src/config/personas.json` (Karl Marx, Joven Incel, Fanático Religioso, Moderador). *(Completado por Antigravity - Gemini 3.7 Flash)*

- [x] 2. Conector Runtime Sin Censura (Local Ollama) <!-- id: runtime-connector -->
  - [x] 2.1 Implementar driver `src/services/debate-runtime.ts` para Ollama (`hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M`) con fallback heurístico local. **OpenRouter desactivado** (decisión 2026-08-16). *(Completado por OpenCode Go)*
  - [x] 2.2 Diseñar los system prompts de combate ideológico sin censura en `src/prompts/persona-debate.prompt.ts`. *(Completado por Antigravity - Gemini 3.7 Flash)*

- [/] 3. Orquestador y Máquina de Estados de TV <!-- id: debate-orchestrator -->
  - [x] 3.1 Implementar `src/services/debate-orchestrator.ts` con la lógica de turnos, réplicas y moderador. *(Completado por Antigravity - Gemini 3.7 Flash)*
  - [x] 3.2 Implementar el calculador de tensión y generador de interrupciones dinámicas. *(Completado por Antigravity - Gemini 3.7 Flash)*

- [x] 4. CLI de Simulación y Exportación de Guion <!-- id: simulation-cli -->
  - [x] 4.1 Crear comando `src/cli/simulate-debate.ts` para correr un debate completo a partir de `weekly_agenda.json`. *(Completado por OpenCode Go)*
  - [x] 4.2 Probar simulación de 1 bloque con diálogo completo y exportar `debate_transcript.json`. *(Completado por OpenCode Go - 4 bloques)*
