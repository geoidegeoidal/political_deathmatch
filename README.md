# Political Deathmatch

Proyecto desarrollado bajo la metodología **Spec-Driven Development (SDD)** utilizando **OpenSpec** integrado con **Antigravity** y **OpenCode**.

## 🚀 Instalación Global de OpenSpec

OpenSpec ya quedó instalado globalmente en el entorno del sistema.

```powershell
npm install -g @fission-ai/openspec@latest
```

## 🛠️ Inicializar OpenSpec en Cualquier Proyecto

Para habilitar OpenSpec de forma transversal en cualquier nuevo proyecto, ejecuta dentro del directorio raíz del proyecto:

```powershell
openspec init --tools "antigravity,opencode"
```

Esto generará automáticamente:
- `.agent/`: Workflows y Skills para **Antigravity**.
- `.opencode/`: Comandos y Skills para **OpenCode**.
- `openspec/`: Directorio de especificaciones (`specs/`) y propuestas de cambio (`changes/`).

## ⚡ Comandos Disponibles (Slash Commands)

Tanto en el chat de **Antigravity** como en **OpenCode**:

| Comando | Descripción |
| :--- | :--- |
| `/opsx-explore` | Explora ideas y requerimientos antes de formalizar la propuesta. |
| `/opsx-propose [idea]` | Crea una nueva propuesta de cambio con diseño, tareas y deltas de specs. |
| `/opsx-apply [change-id]` | Implementa las tareas definidas en una propuesta aprobada. |
| `/opsx-update [change-id]` | Actualiza o refina una propuesta de cambio existente. |
| `/opsx-sync` | Sincroniza especificaciones entre cambios y specs principales. |
| `/opsx-archive [change-id]` | Archiva un cambio completado y actualiza las especificaciones vivas. |

## 📊 Comandos CLI de Terminal

- `openspec list`: Lista cambios activos y specs (`--specs`).
- `openspec view`: Abre un panel interactivo con el estado de las especificaciones.
- `openspec validate`: Valida consistencia de especificaciones.
- `openspec doctor`: Diagnóstico de salud de OpenSpec en el repo.
