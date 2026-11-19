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
| Gestor de incidencias | `feature/GestorIncidencias` | API `/api/incidents` y página `/incidents` (rutas del cliente corregidas en `feature/contenedorizacion`) |
| Manejo de errores y tests | `feature/error-handling-audit` | `lib/errors.ts`, 58 tests pytest y 232 Jest |
| Hito 5 — Backend ORM con doble BD | `feature/Mile05-back` | SQLModel + Supabase, módulo `/inventory` |
| Hito 5 — Backoffice de inventario | `feature/mile05-front` | Productos y órdenes de entrada/salida |
| Contenerización | `feature/contenedorizacion` | Docker Compose. Rechazado y corregido (comunicación por nombre de servicio); probado en local con `docker compose up`; pendiente del VPS y del reenvío |

## En curso

- **Hito 4 — AI-driven Engineering** (`feature/agent-memory-bank`): `BRIEFING.md`, `memory-bank/`, `AGENTS.md`, `.agents/rules` y `.agents/skills`.
- **Propuesta de arquitectura del backend** (`feature/backend-architecture-proposal`): `docs/ARCHITECTURE_PROPOSAL.md`. Propone una arquitectura en capas organizada por dominios (`domains/<dominio>/` con router, service, repository, schemas y models), rutas bajo `/api/v1`, `CORS_ORIGINS` por entorno y una migración dominio a dominio. Pendiente de revisión: si se acepta, registrar las decisiones en `techContext.md`.

## Problemas conocidos / deuda técnica

1. **Contenerización:** se corrigió el rechazo; el backoffice usa `/backend-api` y Next lo reenvía a `http://backend:8000` (`API_INTERNAL_URL` en `.env`). Probado en local el 2026-11-19: API, website, backoffice, login, inventario e incidencias funcionan. Falta desplegarlo en el VPS y reenviar el proyecto.
2. **`main` desactualizado:** termina en el Hito 3. Las ramas posteriores no se mergearon; hay que integrarlas en orden mediante PR.
3. **Duplicado `uis/talent-pipeline-tracker`**: su `app/` es igual a la de `uis/backoffice`. Hay que decidir si se elimina.
4. **Artefactos versionados en el historial:** `node_modules`, `.venv` y `coverage/`.
5. **`uis/website`** es solo un esqueleto: falta migrar la landing del Hito 1 (SEO, schema.org, accesibilidad).
6. **Recarga en caliente en Docker sobre Windows:** los cambios hechos desde Windows no llegan a `next dev` dentro del contenedor (bind mount de Docker Desktop). Probar `watchOptions.pollIntervalMs` no lo resolvió. Para desarrollar en Windows, usar el repo dentro de WSL2 o `npm run dev` en local. En Linux (VPS/Codespaces) debería funcionar, pero no está verificado.
7. **Cobertura de tests:** faltan tests de `records`, `incidents` (en `tests/`), `profiles`, `users` e `inventory`.

## Próximos pasos

1. Cerrar el Hito 4 con un PR a `main` y hacer el merge.
2. Desplegar la contenerización en el VPS y reenviar el proyecto.
3. Backend development (proyectos sobre el monorepo): Backend Architecture Proposal (redactada, pendiente de entrega), Analizador de archivo de incidentes y Supplier Directory.
4. Architecture optimization: Frontend Performance Audit, Backend Serialization Audit y Caching.
5. Application telemetry: plan, captura en el frontend, almacenamiento y reporte.
