---
name: nexova-api-resource
description: Añade un recurso REST protegido a la API central de Nexova (schemas, crud, router, registro y tests), siguiendo el patrón de incidents
---

# Skill: añadir un recurso a la API de Nexova

## Objetivo (único)
Añadir **un** recurso de negocio nuevo a `services/backend` (p. ej. `vacancies` para Selección, `enrollments` para Formación o `leave_requests` para RR. HH.). El resultado es un CRUD protegido con JWT, con tests en verde y documentado en el banco de memoria.

Es una tarea recurrente: cada departamento de `BRIEFING.md` necesita sus propias entidades en la API.

**Fuera de alcance:** la UI del backoffice, los cambios de auth y las migraciones de dominios existentes. Para eso, usa otra tarea.

## Inputs (pídelos si faltan; no los inventes)

| Input | Ejemplo | Obligatorio |
|---|---|---|
| `resource` (snake_case, plural) | `vacancies` | Sí |
| `department` (área de `BRIEFING.md` a la que sirve) | Operaciones de Selección | Sí |
| `fields` (nombre, tipo, obligatorio, validación) | `title: str (3–120)`, `client: str`, `status: open\|closed`, `seniority: str` | Sí |
| `storage` | `tinydb` o `supabase` (ver la regla `backend-fastapi`) | Sí, confirmado por el desarrollador |
| `filters` (query params del listado) | `status`, `search` | No |
| `enum_values` compartidos | estados de la vacante, que van a `packages/shared/` | No |

## Pasos
1. Lee `memory-bank/techContext.md` y `.agents/rules/backend-fastapi.md`, y usa como modelo `app/routers/incidents.py` y `app/crud/incidents.py`.
2. Si el recurso tiene estados o catálogos que también usará otra capa, defínelos en `packages/shared/<resource>_rules.py`.
3. En `app/schemas.py`, añade `<Resource>Create`, `<Resource>Update` (todos los campos opcionales) y `<Resource>Out` (con `id`, `created_at` y `updated_at`).
4. Crea la persistencia:
   - `tinydb`: añade `<resource>_table = _db.table("<resource>")` en `app/database.py` (archivo protegido: pide confirmación) y crea `app/crud/<resource>.py` con `create`, `get_all(filters)`, `get_by_id`, `update` y `delete`, usando `new_uuid()` y `now_iso()`.
   - `supabase`: añade el modelo SQLModel `table=True` en `app/models.py` (archivo protegido: pide confirmación) y usa `Depends(get_db)` en el router.
5. Crea `app/routers/<resource>.py` con `APIRouter(prefix="/<resource>", tags=["<resource>"])`, un conversor `to_<resource>_out` y las rutas `GET ""`, `GET "/{id}"`, `POST ""` (201), `PATCH "/{id}"` y `DELETE "/{id}"` (204). Todas llevan `Depends(get_current_user)`.
6. Registra el router en `app/main.py` con `app.include_router(<resource>_router.router)`.
7. Crea `tests/test_<resource>.py` usando las fixtures `client` y `auth_headers`. Limpia la tabla nueva entre tests (TinyDB) o usa una sesión aislada (Supabase).
8. Ejecuta `cd services/backend && python -m pytest tests/ -q`.
9. Actualiza `memory-bank/techContext.md` (lista de routers y tablas) y `memory-bank/progress.md`.

## Criterios de aceptación (todos verificables)
- [ ] Existen `app/crud/<resource>.py` (o el modelo en `models.py`), `app/routers/<resource>.py` y `tests/test_<resource>.py`.
- [ ] `grep -n "<resource>_router" services/backend/app/main.py` devuelve la línea de `include_router`.
- [ ] Los 5 endpoints aparecen en `GET /openapi.json` bajo `/<resource>`.
- [ ] Toda petición sin `Authorization` a esos endpoints responde **401** (cubierto por un test).
- [ ] `POST` con un payload válido responde **201** y el cuerpo valida contra `<Resource>Out`; con un campo obligatorio ausente responde **400/422**.
- [ ] `GET /<resource>/{id}` con un id inexistente responde **404**.
- [ ] `python -m pytest tests/ -q` termina con 0 fallos, incluidos los tests anteriores.
- [ ] `memory-bank/progress.md` menciona el recurso nuevo y `techContext.md` lo incluye en la lista de routers y tablas.
- [ ] No se añadieron secretos ni URLs fijas, y `git status` no muestra la base de datos de TinyDB ni `.env`.
