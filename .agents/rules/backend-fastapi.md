---
name: backend-fastapi
description: Convenciones de la API central de Nexova (FastAPI, doble base de datos y auth)
scope: glob
globs:
  - "services/**/*.py"
  - "services/**/requirements.txt"
---

# Regla: backend FastAPI

**Alcance:** por patrón de archivo; se aplica al tocar `services/**/*.py` o `requirements.txt`.

## Estructura por recurso
Cada recurso del dominio (candidatos, incidencias, programas de formación…) se reparte así:
- `app/schemas.py`: modelos Pydantic `<Recurso>Create`, `<Recurso>Update` y `<Recurso>Out`.
- `app/crud/<recurso>.py`: acceso a datos; sin lógica HTTP.
- `app/routers/<recurso>.py`: `APIRouter(prefix="/<recurso>", tags=["<recurso>"])` con un conversor `to_<recurso>_out`.
- `app/main.py`: registra el router con `app.include_router(...)`.

## Seguridad
- Todas las rutas de negocio llevan `_current_user: dict = Depends(get_current_user)`. Solo `/auth/*`, `POST /users` y el flujo de reset de contraseña son públicos.
- Los secretos y URLs se leen de `settings` (`app/config.py`). Nunca escribas claves, contraseñas ni cadenas de conexión en el código.
- No devuelvas trazas ni mensajes internos al cliente: lanza `HTTPException` con un `detail` en español y deja el resto al handler global.

## Persistencia (doble base de datos)
- **TinyDB** (`app/database.py`, `*_table`): selección (`records`, `notes`), auth (`users`, `profiles`, `reset_tokens`) e incidencias.
- **Supabase/PostgreSQL** (SQLModel, `get_db`): formación e inventario (`TrainingProgram`, `StockEntry`, `StockExit`).
- Un dominio nuevo no elige su base de datos por su cuenta: pregunta al desarrollador y registra la decisión en `memory-bank/techContext.md`.
- Las reglas de negocio que comparten varias capas (estados, transiciones, catálogos de valores) van en `packages/shared/`, no se duplican.

## Tests
- Cada endpoint nuevo tiene tests en `services/backend/tests/test_<recurso>.py` con las fixtures de `conftest.py` (`client`, `auth_headers`).
- Mínimo por endpoint: el caso feliz, `401` sin token y `422`/`400` con payload inválido (y `404` si recibe un id).
