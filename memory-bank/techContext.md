# Tech Context — Monorepo Nexova

## Mapa del monorepo (dónde va cada cosa)

| Ruta | Contenido | Estado |
|---|---|---|
| `uis/website` | Web corporativa pública (Next.js, puerto 3000, ruta `/`; marca y copy alineados con `BRIEFING.md`) | Esqueleto mínimo |
| `uis/backoffice` | App interna de Nexova (Next.js, puerto 3001, layout propio y vista de entrada en `/`) | Activa |
| `uis/talent-pipeline-tracker` | **Legacy.** Copia anterior al split; su `app/` es idéntica a la de `uis/backoffice` | No añadir código; candidata a eliminarse |
| `services/backend` | API central FastAPI (`app/` con `routers/`, `crud/`, `schemas.py`, `models.py`) | Activa |
| `packages/shared` | Código compartido entre servicios (p. ej. `incident_rules.py` y tipos) | Activa |
| `src/` | Utilidades TypeScript de datos del Hito 2 (modelos, colecciones, búsqueda y validaciones) con tests Jest | Estable |
| `scripts/` | Scripts de soporte (p. ej. `seed_incidents.py`) | Activa |
| `data/` | `raw/`, `process/`, `pipelines/`, `eval/` (p. ej. `raw/incidents_historical.csv`) | Parcial |
| `agents/`, `skills/`, `mcps/`, `workflows/` | **Código de producto** para los agentes, skills, MCP y workflows de Nexova (hitos 7–10). No confundir con `.agents/` | Vacías (solo README) |
| `.agents/` | Configuración de los agentes de código (reglas y skills de desarrollo) | Hito 4 |
| `memory-bank/` | Contexto persistente para los agentes de código | Hito 4 |
| `infra/`, `docker-compose.yml` | Docker Compose de desarrollo | Activa |

No crees árboles paralelos: un frontend nuevo va en `uis/<nombre>` y un servicio nuevo en `services/<nombre>`. Antes de crear una carpeta, lee el `README.md` de la carpeta padre.

## Stack

**Frontend (`uis/*`)**
- Next.js **16.2** (App Router), React 19.2, TypeScript 5 y Tailwind CSS 4.
- ⚠️ Next 16 trae cambios incompatibles: consulta `node_modules/next/dist/docs/` antes de usar una API (ver `uis/backoffice/AGENTS.md`).
- Cliente HTTP propio en `lib/api.ts`, `lib/auth-api.ts` y `lib/inventory.ts`; errores normalizados en `lib/errors.ts`.
- Sesión: JWT guardado en `localStorage` (`lib/auth.tsx`); las rutas privadas usan `lib/auth-guard.tsx` y una respuesta 401 fuerza el logout.
- Base de la API: `NEXT_PUBLIC_API_BASE` (nunca escribas la URL directamente en el código). En el backoffice vale `/backend-api`, una ruta del mismo origen que `next.config.ts` reenvía (rewrite) a `API_INTERNAL_URL`.

**Backend (`services/backend`)**
- Python 3.12, FastAPI 0.115, Pydantic 2 y Uvicorn.
- Autenticación con JWT (`python-jose`, HS256) y contraseñas con bcrypt (`libpass`). La dependencia `get_current_user` protege las rutas.
- **Doble base de datos** (`app/database.py`):
  - **TinyDB** (documental, local): `users`, `profiles`, `records`, `incidents`, `notes`, `reset_tokens`.
  - **Supabase/PostgreSQL** con SQLModel: `trainingprograms`, `stockentries`, `stockexits` (catálogo de formación e inventario).
- Email transaccional con Resend (restablecimiento de contraseña).
- Routers: `/auth`, `/users`, `/profiles`, `/records`, `/api/incidents`, `/inventory`.
- Configuración en `app/config.py` a partir de variables de entorno. `NEXOVA_SECRET_KEY` y `SUPABASE_DATABASE_URL` son **obligatorias**: si faltan, la app no arranca.

**Testing**
- Backend: `pytest` en `services/backend/tests/` (auth: registro, login, token, forgot/reset/change password). `conftest.py` aísla TinyDB en un archivo temporal.
- Utilidades TS: Jest en la raíz (`npx jest --coverage`, umbral del 70 %).
- Plan y estado completos en `TESTING.md`.

**Infraestructura**
- `docker-compose.yml`: el servicio `backend` (8000) y el servicio `uis` (website 3000 + backoffice 3001) comparten la red `nexova-network`, con bind mounts y recarga en caliente.
- Dentro de Docker, los servicios se comunican **por nombre de servicio** (`http://backend:8000`), nunca por `localhost`. El navegador no resuelve ese nombre, por eso llama a `/backend-api` y el servidor de Next hace de proxy.
- Variables en el `.env` de la raíz (plantilla: `.env.example`). `NEXT_PUBLIC_API_BASE` y `API_INTERNAL_URL` son obligatorias para el servicio `uis`. En el build de producción se pasan como `--build-arg`.

## Decisiones de arquitectura vigentes

1. **Monorepo único**: todo el producto de Nexova vive aquí y se organiza según los README de la plantilla.
2. **Una sola API central** (`services/backend`) para ambos frontends, hasta que haga falta otro servicio.
3. **Persistencia híbrida**: TinyDB para el dominio de selección, auth e incidencias; PostgreSQL (Supabase) para formación e inventario. Si se migra un dominio, se documenta aquí.
4. **Reglas de negocio compartidas** en `packages/shared` (p. ej. las transiciones de estado de las incidencias), no duplicadas en cada capa.
5. **Configuración solo por variables de entorno**: los `.env` nunca se versionan; se documentan en `.env.example`.

## Restricciones técnicas

- Nunca versionar `.env`, `node_modules/`, `.venv/`, `.next/`, `__pycache__/`, `coverage/` ni la base de datos de TinyDB.
- Las respuestas de error al cliente no exponen trazas: usar el handler global de `app/main.py`.
- CORS limitado a los orígenes de los frontends (`settings.CORS_ORIGINS`).
- Copy y UI en **español**; los identificadores de código, en inglés.
