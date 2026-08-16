# AGENTS.md - Political Deathmatch

## Proyecto
Political Deathmatch: Sistema y plataforma interactiva de debate / simulación política orientada a Spec-Driven Development (SDD).

## Stack y Herramientas Globales
- **Spec Framework:** OpenSpec CLI (`@fission-ai/openspec`) instalado globalmente.
- **SDD Workflows:** `/opsx-propose`, `/opsx-explore`, `/opsx-apply`, `/opsx-update`, `/opsx-sync`, `/opsx-archive`.
- **Integraciones:** Antigravity (`.agent/`) y OpenCode (`.opencode/`).
- **Node.js / Python / Go:** v22.15.1+ / npm / pnpm / Python 3.11+.

## Matriz de Asignación por Suscripción Real y Control de Tokens
1. **Antigravity (Gemini 3.7 Flash - Thinking High / Extended):**
   - *Rol:* Arquitecto Técnico Lead, Diseño de Máquinas de Estado, Coordinación OpenSpec SDD, Prompt Engineering de Personajes y Layouts Visuales.
   - *Ventaja:* Razonamiento híbrido profundo, velocidad instantánea y ventana de contexto masiva.
2. **OpenCode Go (Suscripción OpenCode: DeepSeek-V3/V4, Qwen 2.5 Coder, Kimi):**
   - *Rol:* Implementación de código masivo, parsers de datos, drivers de audio/TTS, testing unitario y refactorizaciones I/O.
   - *Ventaja:* Tarifa plana, cero costo por token individual, alta precisión en código TypeScript/Python/Go.
3. **OpenAI Codex (Suscripción Codex / ChatGPT: o3-mini / GPT-4o):**
   - *Rol:* Validación algorítmica de transiciones de estado, optimizaciones matemáticas y backup de razonamiento.
4. **Runtime de Simulación (Generación de Debate Sin Censura - $0 Tokens):**
   - *Primario (único, $0 tokens):* Modelo local cuantizado sin censura (`HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced` :Q4_K_M) vía Ollama (`http://localhost:11434`).
   - *Fallback:* Sintetizador heurístico local (offline). **OpenRouter desactivado** — el debate corre 100% local.

## Convenciones Arquitectónicas y Guardrails
1. **Spec-Driven First:** Cualquier nueva feature o cambio de requerimiento debe pasar por una propuesta en `openspec/changes/` o usar `/opsx-propose` antes de implementar cambios destructivos de arquitectura.
2. **RSS-First Scraper:** Priorizar RSS/Atom feeds oficiales de medios de comunicación para evitar bloqueos por Cloudflare/bot detectors; fallback a scrapers HTTP ligeros.
3. **100% Fictional Parodies (Cero Nombres Reales):** Todos los nombres, personajes, alias y perfiles deben ser parodias satíricas creativas y 100% ficticias para evitar denuncias, demandas de difamación o strikes en YouTube.
4. **Type-Safe Strictness:** Sin tipos flexibles (`any`). Tipado estricto en interfaces y modelos de dominio.
5. **Handoff Inter-Modelos Estricto:** Cuando un modelo/entorno finaliza una tarea o hito, debe verificar a quién corresponde la siguiente tarea según la Matriz. Si la siguiente tarea pertenece a otro modelo (ej. pasar de Antigravity a OpenCode con DeepSeek-V3 o viceversa), **debe detenerse de inmediato**, emitir el aviso explícito de relevo con las instrucciones claras para el siguiente modelo y actualizar `HANDOFF.md` sin ejecutar código fuera de su asignación.
6. **No Fluff & High Signal:** Decisiones documentadas en las especificaciones vivas (`openspec/specs/`).
7. **Continuidad de Sesión:** Actualizar `HANDOFF.md` al finalizar cada sesión de trabajo.
