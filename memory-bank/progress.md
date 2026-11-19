# Progress — Estado del desarrollo

> Actualiza este archivo en cada PR: lo hecho, lo que está en curso y los problemas conocidos.
> Última actualización: 2026-11-19 (rama `feature/agent-memory-bank`).

## Hitos completados

| Hito / proyecto | Rama | Resultado |
|---|---|---|
| Hito 0 — Elección de empresa | `main` | `CONTEXT.md`, `company-choice.md` |
| Hito 1 — Web y formulario | `main` | Landing y formulario de aplicación con validación |
| Hito 2 — Programación (TS) | `feature/domain-models` | Modelos y utilidades en `src/` |
| Hito 3 — Talent Pipeline Tracker | `feature/hito3` | Lista con filtros, detalle, CRUD y notas internas |
| Auth backend (FastAPI + JWT) | `feature/Auth` | Registro, login y rutas protegidas |
| Auth frontend | `feature/Frontend` | Login/registro, guard y manejo de 401 |
| Restablecer contraseña | `feature/password-reset` | Forgot/reset/change con email (Resend) |
| Gestor de incidencias | `feature/GestorIncidencias` | API `/api/incidents` y página `/incidents` |
| Manejo de errores y tests | `feature/error-handling-audit` | `lib/errors.ts`, 58 tests pytest y 232 Jest |
| Hito 5 — Backend ORM con doble BD | `feature/Mile05-back` | SQLModel + Supabase, módulo `/inventory` |
| Hito 5 — Backoffice de inventario | `feature/mile05-front` | Productos y órdenes de entrada/salida |
| Contenerización | `feature/contenedorizacion` | Docker Compose (⚠️ rechazado, ver abajo) |

## En curso

- **Hito 4 — AI-driven Engineering** (`feature/agent-memory-bank`): `BRIEFING.md`, `memory-bank/`, `AGENTS.md`, `.agents/rules` y `.agents/skills`.

## Problemas conocidos / deuda técnica

1. **Contenerización rechazada:** el frontend llama a la API por `localhost` en `uis/start-dev.sh`, `uis/start.sh` y `uis/backoffice/lib/inventory.ts`. Hay que usar el nombre del servicio (`http://backend:8000`) y definir la URL en `.env`. Además, falta el despliegue en el VPS.
2. **`main` desactualizado:** termina en el Hito 3. Las ramas posteriores no se mergearon; hay que integrarlas en orden mediante PR.
3. **Duplicado `uis/talent-pipeline-tracker`**: su `app/` es igual a la de `uis/backoffice`. Hay que decidir si se elimina.
4. **Artefactos versionados en el historial:** `node_modules`, `.venv` y `coverage/`.
5. **`uis/website`** es solo un esqueleto: falta migrar la landing del Hito 1 (SEO, schema.org, accesibilidad).
6. **Fallbacks de `API_BASE`** inconsistentes: `lib/api.ts` apunta al playground de 4Geeks y `lib/inventory.ts` a `localhost:8000`.
7. **Cobertura de tests:** faltan tests de `records`, `incidents` (en `tests/`), `profiles`, `users` e `inventory`.

## Próximos pasos

1. Cerrar el Hito 4 con un PR a `main` y hacer el merge.
2. Corregir la contenerización (puntos 1 y 6) y desplegar en el VPS.
3. Hito 6 — Telemetría: logging centralizado y pipeline de datos para los dashboards.
4. Hito 7 — RAG: búsqueda semántica sobre candidatos y base de conocimiento de soporte.
