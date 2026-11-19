---
name: monorepo-structure
description: Ubicación del código de producto y separación entre .agents/ y las carpetas de producto
scope: always            # siempre activa, en cualquier sesión y archivo
---

# Regla: estructura del monorepo de Nexova

**Alcance:** siempre activa.

1. El código de producto solo vive en las carpetas que mapea la plantilla:
   - `uis/website`: web pública (ruta `/`, puerto 3000).
   - `uis/backoffice`: app interna (vista de entrada en `/`, puerto 3001, con un layout propio separado del sitio público).
   - `services/<servicio>`: APIs y workers. La API central es `services/backend`.
   - `packages/<paquete>`: código compartido entre varias apps o servicios.
2. No crees carpetas de app nuevas en la raíz (`frontend/`, `api/`, `apps/`, `backend/`…). Un frontend nuevo va en `uis/<nombre>` y un servicio nuevo en `services/<nombre>`, y se documenta en el README de la carpeta padre.
3. No añadas código en `uis/talent-pipeline-tracker` (legacy, duplicado de `uis/backoffice`).
4. `.agents/` configura **al agente de código**. `agents/`, `skills/`, `mcps/` y `workflows/` son **producto de Nexova** (los agentes de soporte, formación, RR. HH., etc.). No mezcles su contenido.
5. Antes de crear una carpeta, lee el `README.md` de la carpeta padre y respeta su propósito.
6. Si una tarea cambia la estructura, actualiza la tabla "Mapa del monorepo" de `memory-bank/techContext.md`.
