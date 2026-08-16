# AGENTS.md - Political Deathmatch

## Proyecto
Political Deathmatch: Sistema y plataforma interactiva de debate / simulación política orientada a Spec-Driven Development (SDD).

## Stack y Herramientas Globales
- **Spec Framework:** OpenSpec CLI (`@fission-ai/openspec`) instalado globalmente.
- **SDD Workflows:** `/opsx-propose`, `/opsx-explore`, `/opsx-apply`, `/opsx-update`, `/opsx-sync`, `/opsx-archive`.
- **Integraciones:** Antigravity (`.agent/`) y OpenCode (`.opencode/`).
- **Node.js / Python / Go:** v22.15.1+ / npm / pnpm / Python 3.11+.

## Matriz de Asignación de Modelos y Control de Tokens
1. **Módulo Scraper & Pauta Semanal:**
   - *Parsing RSS/HTML:* Código nativo (0 tokens).
   - *Scoring de Controversia y Síntesis de Pauta:* Gemini 2.5 Flash / Codex (ultra-económico y contexto largo).
2. **Módulo Orquestador de Debate:**
   - *Diseño de Arquitectura y Máquina de Estados:* Antigravity (Gemini 3.7 / Claude 3.7).
   - *Lógica de Turnos y Parsers:* OpenCode / Codex / DeepSeek-V3.
3. **Runtime de Simulación (Generación de Debate Sin Censura):**
   - *Primario ($0 tokens):* Modelo local cuantizado sin censura (`Gemma4-12B-QAT-Uncensored` / `Llama-3-8B-Uncensored`) vía Ollama/vLLM.
   - *Backup Nube:* OpenRouter API con modelos abiertos sin censura.
4. **Módulo de Audio (TTS) & Video Studio Renderer:**
   - *Audio / TTS / Audio Stems:* OpenCode / Codex.
   - *Render Visual (Remotion / Canvas / FFmpeg):* Antigravity para diseño y layouts.

## Convenciones Arquitectónicas y Guardrails
1. **Spec-Driven First:** Cualquier nueva feature o cambio de requerimiento debe pasar por una propuesta en `openspec/changes/` o usar `/opsx-propose` antes de implementar cambios destructivos de arquitectura.
2. **RSS-First Scraper:** Priorizar RSS/Atom feeds oficiales de medios de comunicación para evitar bloqueos por Cloudflare/bot detectors; fallback a scrapers HTTP ligeros.
3. **Type-Safe Strictness:** Sin tipos flexibles (`any`). Tipado estricto en interfaces y modelos de dominio.
4. **Handoff Inter-Modelos Estricto:** Cuando un modelo/entorno finaliza una tarea o hito, debe verificar a quién corresponde la siguiente tarea según la Matriz. Si la siguiente tarea pertenece a otro modelo (ej. pasar de Antigravity a OpenCode con DeepSeek-V3 o viceversa), **debe detenerse de inmediato**, emitir el aviso explícito de relevo con las instrucciones claras para el siguiente modelo y actualizar `HANDOFF.md` sin ejecutar código fuera de su asignación.
5. **No Fluff & High Signal:** Decisiones documentadas en las especificaciones vivas (`openspec/specs/`).
6. **Continuidad de Sesión:** Actualizar `HANDOFF.md` al finalizar cada sesión de trabajo.
