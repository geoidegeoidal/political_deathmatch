# Proposal: Multi-Agent Debate Engine & TV Orchestrator

## Overview
Diseñar e implementar el **Motor Multi-Agente de Debate y Orquestador Televisivo** para *Political Deathmatch*, capaz de simular un debate de alta confrontación política (estilo *Sin Filtros TV* / *Tolerancia Cero*) de 15 a 20 minutos entre panelistas arquetípicos extremos (Karl Marx, Joven Incel, Fanático Religioso, Político Populista) moderados por un conductor provocador.

## Problem Statement
Para que un debate entre inteligencias artificiales sea entretenido, verosímil y apto para formato televisivo:
1. **No puede ser un chat secuencial aburrido:** Los panelistas deben interrumpirse, mostrar indignación, subir el tono y reaccionar emocionalmente según un **Medidor de Tensión del Estudio**.
2. **Debe haber un moderador con rol activo:** El conductor (tipo Gonzalo Feito) debe asignar la palabra, cortar discursos largos, picar a los panelistas con preguntas incómodas y mandar a comerciales o cerrar bloques.
3. **Inmunidad a la censura:** Los personajes deben expresar posturas ideológicas crudas y sin filtros, utilizando el modelo local `Gemma4-12B-QAT-Uncensored` para evitar respuestas moralizantes o bloqueos de seguridad.

## Proposed Solution
1. **Máquina de Estados Finitos (FSM) de TV:**
   - Estados: `INTRO_BLOCK` -> `MODERATOR_QUESTION` -> `PANEL_ROUND` -> `OPEN_CROSSFIRE` (Fuego cruzado / Interrupciones) -> `TENSION_CLIMAX` -> `BLOCK_CONCLUSION`.
2. **Sistema de Personalidades & Triggers (Persona Engine):**
   - Configuración YAML por personaje con: ideología, estilo retórico, falacias preferidas, nivel de agresividad (1-10) y frases icónicas / muletillas.
3. **Mecánica de Interrupción Dinámica:**
   - Si un panelista habla más de 45 segundos o toca un "trigger emocional" de un oponente, el oponente tiene una probabilidad de interrumpir (*"¡Oye, pero eso es una falacia!", "¡Déjame hablar!"*).
4. **Exportador de Guion de Producción (`debate_transcript.json`):**
   - Contiene marcas de tiempo relativas, emociones del personaje (`ANGRY`, `SMUG`, `OUTRAGED`, `TALKING`), texto para el TTS y directivas para el switch de cámaras.

## Model Assignment
- **Diseño de Arquitectura y Prompts:** Antigravity (`Gemini 3.7 Flash - Thinking High`).
- **Implementación de FSM, Parsers y CLI:** OpenCode Go (`DeepSeek-V3 / Qwen 2.5 Coder`).
- **Runtime de Debate:** Local `Gemma4-12B-QAT-Uncensored` ($0 tokens).
