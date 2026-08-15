# AGENTS.md - Political Deathmatch

## Proyecto
Political Deathmatch: Sistema y plataforma interactiva de debate / simulación política orientada a Spec-Driven Development (SDD).

## Stack y Herramientas Globales
- **Spec Framework:** OpenSpec CLI (`@fission-ai/openspec`) instalado globalmente.
- **SDD Workflows:** `/opsx-propose`, `/opsx-explore`, `/opsx-apply`, `/opsx-update`, `/opsx-sync`, `/opsx-archive`.
- **Integraciones:** Antigravity (`.agent/`) y OpenCode (`.opencode/`).
- **Node.js:** v22.15.1+ / npm / pnpm.

## Convenciones Arquitectónicas y Guardrails
1. **Spec-Driven First:** Cualquier nueva feature o cambio de requerimiento debe pasar por una propuesta en `openspec/changes/` o usar `/opsx-propose` antes de implementar cambios destructivos de arquitectura.
2. **Type-Safe Strictness:** Sin tipos flexibles (`any`). Tipado estricto en interfaces y modelos de dominio.
3. **No Fluff & High Signal:** Decisiones documentadas en las especificaciones vivas (`openspec/specs/`).
4. **Continuidad de Sesión:** Actualizar `HANDOFF.md` al finalizar cada sesión de trabajo.
