# Plan de Pruebas — Nexova Talent Pipeline API

> **Estado actual:** ✅ 58 pruebas Python + **232 pruebas TypeScript** = **290 total**, todas **pasando**.
> **Cobertura Python (auth):** `app/auth.py` **88%**, `app/routers/auth.py` **89%**, `app/crud/reset_tokens.py` **81%**.
> **Cobertura TypeScript (utilidades):** **99.4%** statements, **100%** funciones.
> **Cobertura global del proyecto (Python):** 63% (pendientes: records, incidents, profiles, users).

---

## 1. Cómo ejecutar las pruebas

### Requisitos previos

```bash
cd services/backend
pip install -r requirements.txt
```

### Ejecutar todas las pruebas

```bash
cd services/backend
python -m pytest tests/ -v
```

### Ejecutar pruebas TypeScript (utilidades)

```bash
# Desde la raíz del proyecto
npx jest --coverage
```

### Ejecutar una suite específica (Python)

```bash
python -m pytest tests/test_register.py -v               # Registro de usuarios
python -m pytest tests/test_login.py -v                  # Login / autenticación
python -m pytest tests/test_token.py -v                  # Validación de token (GET /auth/me)
python -m pytest tests/test_forgot_password.py -v        # Solicitud de reset
python -m pytest tests/test_reset_password.py -v         # Ejecución de reset
python -m pytest tests/test_change_password.py -v        # Cambio de contraseña
```

### Ejecutar con cobertura

```bash
cd services/backend
python -m pytest tests/ --cov=app --cov-report=term-missing
```

---

## 2. Estructura de pruebas

```
services/backend/tests/
├── __init__.py                   # Marcador de módulo Python
├── conftest.py                   # Fixtures compartidos (client, tokens, usuarios de prueba)
├── test_register.py              # POST /users — registro de usuarios (12 pruebas)
├── test_login.py                 # POST /auth/login — autenticación (10 pruebas)
├── test_token.py                 # GET /auth/me — validación de token JWT (8 pruebas)
├── test_forgot_password.py       # POST /auth/forgot-password — solicitud de reset (7 pruebas)
├── test_reset_password.py        # POST /auth/reset-password — ejecución de reset (7 pruebas)
└── test_change_password.py       # POST /auth/change-password — cambio de contraseña (11 pruebas)
```

**Total: 55 pruebas** (las 3 pruebas extra son de suites externas de incidencias).

---

## 3. Fixtures compartidos (`conftest.py`)

| Fixture | Descripción |
|---------|-------------|
| `client` | Cliente HTTP síncrono (`TestClient(app, raise_server_exceptions=False)`) |
| `registered_user` | Usuario creado vía `POST /users` (email: alice@example.com, password: secret123) |
| `auth_token` | JWT obtenido de `POST /auth/login` con las credenciales de `registered_user` |
| `auth_headers` | Dict `{"Authorization": "Bearer <token>"}` para requests autenticados |
| `_clean_db` (autouse) | Limpia todas las tablas de TinyDB después de cada test |

**Detalles técnicos:**
- Base de datos TinyDB aislada via `tempfile.NamedTemporaryFile` — nunca toca datos reales
- `raise_server_exceptions=False` permite probar respuestas 500 sin que TestClient las convierta en excepciones
- Las tablas se limpian automáticamente entre pruebas con `_clean_db`

---

## 4. Suite: Autenticación

### 4.1 POST `/auth/login` — `test_login.py` (10 tests ✅)

| # | Caso | Tipo | Clase | Descripción |
|---|------|------|-------|-------------|
| 1 | Login exitoso | ✅ Camino feliz | `TestLoginHappyPath` | Credenciales válidas → 200 + token JWT |
| 2 | Login retorna JWT | ✅ Camino feliz | `TestLoginHappyPath` | Body contiene `access_token` y `token_type: "bearer"` |
| 3 | Email case-insensitive | ✅ Camino feliz | `TestLoginHappyPath` | "Alice@Example.COM" funciona igual |
| 4 | Caracteres especiales en password | 🔸 Límite | `TestLoginEdgeCases` | "P@$$w0rd!" es aceptado |
| 5 | Password incorrecto | ❌ Fallo | `TestLoginFailure` | 401 "Credenciales inválidas" |
| 6 | Email inexistente | ❌ Fallo | `TestLoginFailure` | 401 (mismo mensaje, no revela existencia) |
| 7 | Usuario inactivo | ❌ Fallo | `TestLoginFailure` | 401 "Usuario inactivo" |
| 8 | Body vacío | 🔸 Límite | `TestLoginFailure` | 400 |
| 9 | Sin password | 🔸 Límite | `TestLoginFailure` | 400 |
| 10 | Email valido + password incorrecto | ❌ Fallo | `TestLoginFailure` | 401 |

**Por qué:** Login es la puerta de entrada; debe rechazar credenciales inválidas sin revelar si el email existe (seguridad). Mensajes genéricos "Credenciales inválidas" en lugar de "email no encontrado" vs "password incorrecto".

### 4.2 POST `/auth/forgot-password` — `test_forgot_password.py` (7 tests ✅)

| # | Caso | Tipo | Clase | Descripción |
|---|------|------|-------|-------------|
| 1 | Email existente → 200 | ✅ Camino feliz | `TestForgotPasswordHappyPath` | Siempre retorna 200 + mensaje |
| 2 | Mensaje genérico | ✅ Camino feliz | `TestForgotPasswordHappyPath` | Contiene "correo" o "restablecer" |
| 3 | Email inexistente → 200 | ✅ Seguridad | `TestForgotPasswordEdgeCases` | Retorna 200 igualmente (anti-enumeración) |
| 4 | Mismo mensaje ambos casos | ✅ Seguridad | `TestForgotPasswordEdgeCases` | Mensaje idéntico para email existente/inexistente |
| 5 | Token creado en BD | ✅ Verificación | `TestForgotPasswordEdgeCases` | Token almacenado en `reset_tokens_table` |
| 6 | Body vacío | 🔸 Límite | `TestForgotPasswordEdgeCases` | 400 |
| 7 | Email malformado | ❌ Fallo | `TestForgotPasswordFailure` | 200 (el endpoint no valida formato, solo busca) |

**Por qué:** Endpoint diseñado para ser **anti-enumeración** — siempre responde 200 con el mismo mensaje. El caso #4 verifica exactamente que el string sea idéntico.

### 4.3 POST `/auth/reset-password` — `test_reset_password.py` (7 tests ✅)

| # | Caso | Tipo | Clase | Descripción |
|---|------|------|-------|-------------|
| 1 | Token válido + password válido | ✅ Camino feliz | `TestResetPasswordHappyPath` | 200 "Contraseña actualizada" |
| 2 | Login con nueva password | ✅ Camino feliz | `TestResetPasswordHappyPath` | 200 después del reset |
| 3 | Old password ya no funciona | ✅ Camino feliz | `TestResetPasswordHappyPath` | 401 con la contraseña anterior |
| 4 | Token es de un solo uso | 🔸 Seguridad | `TestResetPasswordEdgeCases` | Segundo uso → 400 |
| 5 | Password > 72 chars | 🔸 Límite | `TestResetPasswordEdgeCases` | 400 (validación Pydantic pre-bcrypt) |
| 6 | Token inválido | ❌ Fallo | `TestResetPasswordFailure` | 400 "Token inválido o expirado" |
| 7 | Password < 6 chars | 🔸 Límite | `TestResetPasswordFailure` | 400 (validación Pydantic) |

**Por qué:** Tokens de un solo uso y expiración son críticos para la seguridad del flujo de recuperación.

### 4.4 POST `/auth/change-password` — `test_change_password.py` (11 tests ✅)

| # | Caso | Tipo | Clase | Descripción |
|---|------|------|-------|-------------|
| 1 | Cambio exitoso | ✅ Camino feliz | `TestChangePasswordHappyPath` | 200 "Contraseña cambiada" |
| 2 | Login con nueva password | ✅ Camino feliz | `TestChangePasswordHappyPath` | 200 después del cambio |
| 3 | Old password ya no funciona | ✅ Camino feliz | `TestChangePasswordHappyPath` | 401 con contraseña anterior |
| 4 | Password mínimo 6 caracteres | 🔸 Límite | `TestChangePasswordEdgeCases` | "123456" → 200 |
| 5 | Password 72 caracteres | 🔸 Límite | `TestChangePasswordEdgeCases` | "a"*72 → 200 (límite bcrypt) |
| 6 | Password > 72 caracteres | 🔸 Límite | `TestChangePasswordEdgeCases` | "a"*200 → 400 (validación Pydantic) |
| 7 | Current password incorrecto | ❌ Fallo | `TestChangePasswordFailure` | 401 "La contraseña actual es incorrecta" |
| 8 | Sin token JWT | ❌ Fallo | `TestChangePasswordFailure` | 401 |
| 9 | New password < 6 chars | 🔸 Límite | `TestChangePasswordFailure` | 400 |
| 10 | Body vacío | 🔸 Límite | `TestChangePasswordFailure` | 400 |

**Por qué:** Verificar la contraseña actual previene que tokens comprometidos permitan cambio de contraseña sin control.

### 4.5 GET `/auth/me` — `test_token.py` (8 tests ✅)

| # | Caso | Tipo | Clase | Descripción |
|---|------|------|-------|-------------|
| 1 | Token válido → 200 | ✅ Camino feliz | `TestAuthMeHappyPath` | 200 con datos del usuario |
| 2 | Retorna datos correctos | ✅ Camino feliz | `TestAuthMeHappyPath` | email, id, role coinciden |
| 3 | Incluye campos de perfil | ✅ Camino feliz | `TestAuthMeHappyPath` | name, phone, address del perfil vinculado |
| 4 | Perfil mínimo (sin name) | 🔸 Límite | `TestAuthMeEdgeCases` | name=None es válido |
| 5 | Sin token | ❌ Fallo | `TestAuthMeFailure` | 401 |
| 6 | Token inválido (jwt falso) | ❌ Fallo | `TestAuthMeFailure` | 401 |
| 7 | Token expirado | ❌ Fallo | `TestAuthMeFailure` | Creado manualmente con `exp` en el pasado → 401 |
| 8 | Header malformado (sin Bearer) | ❌ Fallo | `TestAuthMeFailure` | 401 |

**Por qué:** Endpoint usado por el frontend para cargar datos del usuario logueado.

---

## 5. Suite: Usuarios (`test_users.py`)

### 5.1 POST `/users` (registro)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Registro exitoso | ✅ Camino feliz | 201 + UserOut (sin password en respuesta) |
| 2 | Email duplicado | ❌ Fallo | 409 "Ya existe un usuario con ese email" |
| 3 | Email formato inválido | 🔸 Límite | 400 "email inválido" |
| 4 | Password < 6 caracteres | 🔸 Límite | 400 validación Pydantic |
| 5 | Campos opcionales (name, phone, address) | 🔸 Límite | 201 solo con email y password |
| 6 | Email con mayúsculas | 🔸 Límite | Se normaliza a minúsculas |

**Por qué:** El registro crea automáticamente un perfil vinculado; verificar que la creación sea atómica.

### 5.2 GET `/users` (listar)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Listar con token válido | ✅ Camino feliz | 200 + array de UserOut |
| 2 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** Solo usuarios autenticados pueden ver la lista.

### 5.3 GET `/users/{user_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | ID existente | ✅ Camino feliz | 200 + UserOut |
| 2 | ID inexistente | ❌ Fallo | 404 "Usuario no encontrado" |
| 3 | ID formato inválido (no UUID) | 🔸 Límite | 404 o 400 según TinyDB |

**Por qué:** Endpoint usado para gestión administrativa.

### 5.4 PUT `/users/{user_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Actualizar propio perfil | ✅ Camino feliz | 200 + UserOut actualizado |
| 2 | Admin actualiza otro usuario | ✅ Camino feliz | 200 (permiso concedido) |
| 3 | Usuario normal actualiza a otro | ❌ Fallo | 403 "No tienes permiso" |
| 4 | Cambiar rol sin ser admin | ❌ Fallo | 403 (solo admin puede cambiar roles) |
| 5 | ID inexistente | ❌ Fallo | 404 "Usuario no encontrado" |
| 6 | Email duplicado en actualización | ❌ Fallo | 409 Conflicto |

**Por qué:** Control de acceso por roles es fundamental; un usuario no debe poder elevar sus privilegios.

---

## 6. Suite: Perfiles (`test_profiles.py`)

### 6.1 GET `/profiles/me`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Token válido, perfil existe | ✅ Camino feliz | 200 + ProfileOut |
| 2 | Token válido, sin perfil | ❌ Fallo | 404 "Perfil no encontrado" |
| 3 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** El perfil se crea con el registro; verificar consistencia.

### 6.2 PUT `/profiles/me`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Actualizar name | ✅ Camino feliz | 200 + campos actualizados |
| 2 | Actualizar phone y address | ✅ Camino feliz | 200 + múltiples campos |
| 3 | Body vacío (sin cambios) | 🔸 Límite | 200 sin cambios (idempotente) |
| 4 | Sin token | ❌ Fallo | 403 No autenticado |
| 5 | Perfil inexistente | ❌ Fallo | 404 "Perfil no encontrado" |

**Por qué:** Permite al usuario gestionar su información personal.

---

## 7. Suite: Registros de Candidatos (`test_records.py`)

### 7.1 GET `/records` (listar)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Listar todos | ✅ Camino feliz | 200 + array de RecordOut |
| 2 | Filtrar por status | 🔸 Límite | 200 + solo registros con ese status |
| 3 | Filtrar por stage | 🔸 Límite | 200 + solo registros con ese stage |
| 4 | Filtrar por search (nombre) | 🔸 Límite | 200 + registros que coinciden |
| 5 | Combinar filtros | 🔸 Límite | 200 + intersección de filtros |
| 6 | Sin resultados | 🔸 Límite | 200 + array vacío |
| 7 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** El frontend necesita filtros flexibles para la vista de candidatos.

### 7.2 GET `/records/{record_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | ID existente | ✅ Camino feliz | 200 + RecordOut |
| 2 | ID inexistente | ❌ Fallo | 404 "Registro no encontrado" |

### 7.3 POST `/records` (crear)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Creación exitosa | ✅ Camino feliz | 201 + RecordOut con status/stage por defecto |
| 2 | Campos obligatorios faltantes | 🔸 Límite | 400 error de validación |
| 3 | Campos opcionales ausentes | 🔸 Límite | 201 con nulls en linkedin_url, cv_url |
| 4 | experience_years = 0 | 🔸 Límite | 201 (valor por defecto) |
| 5 | experience_years negativo | 🔸 Límite | 400 o 422 error de validación |
| 6 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** Crear registros es la acción principal del recruiter; debe validar datos esenciales.

### 7.4 PUT `/records/{record_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Actualización exitosa | ✅ Camino feliz | 200 + RecordOut actualizado |
| 2 | ID inexistente | ❌ Fallo | 404 "Registro no encontrado" |
| 3 | Status inválido | ❌ Fallo | 422 ValueError de validación |
| 4 | Stage inválido | ❌ Fallo | 422 ValueError de validación |

### 7.5 PATCH `/records/{record_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Patch parcial (solo status) | ✅ Camino feliz | 200 + solo status cambiado |
| 2 | Patch múltiples campos | ✅ Camino feliz | 200 + campos actualizados |
| 3 | ID inexistente | ❌ Fallo | 404 "Registro no encontrado" |

**Por qué:** PATCH permite actualizaciones parciales sin reenviar todo el objeto.

### 7.6 DELETE `/records/{record_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Eliminación exitosa | ✅ Camino feliz | 204 No Content |
| 2 | ID inexistente | ❌ Fallo | 404 "Registro no encontrado" |
| 3 | Eliminar y verificar notas eliminadas | 🔸 Límite | Las notas asociadas también se eliminan |

**Por qué:** La eliminación en cascada de notas es un requisito de integridad referencial.

### 7.7 GET `/records/{record_id}/notes`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Record con notas | ✅ Camino feliz | 200 + array de notas |
| 2 | Record sin notas | 🔸 Límite | 200 + array vacío |
| 3 | Record inexistente | ❌ Fallo | 404 "Registro no encontrado" |
| 4 | Sin token | ❌ Fallo | 403 No autenticado |

### 7.8 POST `/records/{record_id}/notes`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Crear nota exitosa | ✅ Camino feliz | 201 + nota con id y created_at |
| 2 | Content vacío | 🔸 Límite | 400 "El contenido es obligatorio" |
| 3 | Record inexistente | ❌ Fallo | 404 "Registro no encontrado" |
| 4 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** Las notas permiten documentar interacciones con candidatos; la validación de content vacío evita basura.

---

## 8. Suite: Incidencias (`test_incidents.py`)

### 8.1 GET `/api/incidents` (listar)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Listar todas | ✅ Camino feliz | 200 + array de IncidentOut |
| 2 | Filtrar por status | 🔸 Límite | 200 + solo incidents con ese status |
| 3 | Filtrar por category | 🔸 Límite | 200 + solo incidents con esa categoría |
| 4 | Filtrar por origin | 🔸 Límite | 200 + solo incidents con ese origen |
| 5 | Filtrar por branch | 🔸 Límite | 200 + solo incidents de esa sucursal |
| 6 | Filtrar por search (título) | 🔸 Límite | 200 + incidents que coinciden |
| 7 | Combinar filtros | 🔸 Límite | 200 + intersección |
| 8 | Sin resultados | 🔸 Límite | 200 + array vacío |
| 9 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** El dashboard necesita filtros para mostrar métricas por dimensión.

### 8.2 GET `/api/incidents/summary`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Métricas exitosas | ✅ Camino feliz | 200 + IncidentsMetrics (total, by_status) |
| 2 | Sin incidencias | 🔸 Límite | 200 + total=0, by_status vacío |
| 3 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** Endpoint usado por el dashboard para mostrar métricas agregadas.

### 8.3 GET `/api/incidents/{incident_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | ID existente | ✅ Camino feliz | 200 + IncidentOut |
| 2 | ID inexistente | ❌ Fallo | 404 "Incidencia no encontrada" |

### 8.4 POST `/api/incidents` (crear)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Creación exitosa | ✅ Camino feliz | 201 + IncidentOut con status="open" |
| 2 | Título vacío | 🔸 Límite | 400 "este campo es obligatorio" |
| 3 | Título > 140 caracteres | 🔸 Límite | 400 validación max_length |
| 4 | Descripción vacía | 🔸 Límite | 400 "este campo es obligatorio" |
| 5 | Categoría inválida | ❌ Fallo | 400/422 valor no válido en enum |
| 6 | Origen inválido | ❌ Fallo | 400/422 valor no válido en enum |
| 7 | Branch inválido | ❌ Fallo | 400/422 valor no válido en enum |
| 8 | Campos faltantes | 🔸 Límite | 400 error de validación |
| 9 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** Las incidencias tienen reglas de dominio estrictas (categorías, sucursales, estados).

### 8.5 PATCH `/api/incidents/{incident_id}/status` (transición)

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | open → in_progress | ✅ Camino feliz | 200 + status="in_progress" |
| 2 | open → discarded | ✅ Camino feliz | 200 + status="discarded" |
| 3 | in_progress → resolved | ✅ Camino feliz | 200 + status="resolved" |
| 4 | in_progress → discarded | ✅ Camino feliz | 200 + status="discarded" |
| 5 | resolved → in_progress | ❌ Fallo | 400 "No se puede transicionar..." (estado terminal) |
| 6 | discarded → open | ❌ Fallo | 400 "No se puede transicionar..." (estado terminal) |
| 7 | open → resolved | ❌ Fallo | 400 transición no permitida |
| 8 | ID inexistente | ❌ Fallo | 404 "Incidencia no encontrada" |
| 9 | Sin token | ❌ Fallo | 403 No autenticado |

**Por qué:** La máquina de estados de incidencias es la regla de negocio más crítica; transiciones inválidas deben rechazarse.

### 8.6 PUT `/api/incidents/{incident_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Actualización exitosa | ✅ Camino feliz | 200 + IncidentOut actualizado |
| 2 | ID inexistente | ❌ Fallo | 404 "Incidencia no encontrada" |
| 3 | Campo title vacío | 🔸 Límite | 400 "este campo no puede estar vacío" |

### 8.7 PATCH `/api/incidents/{incident_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Patch parcial (solo description) | ✅ Camino feliz | 200 + solo description cambiada |
| 2 | Patch múltiples campos | ✅ Camino feliz | 200 + campos actualizados |
| 3 | ID inexistente | ❌ Fallo | 404 "Incidencia no encontrada" |

### 8.8 DELETE `/api/incidents/{incident_id}`

| # | Caso | Tipo | Descripción |
|---|------|------|-------------|
| 1 | Eliminación exitosa | ✅ Camino feliz | 204 No Content |
| 2 | ID inexistente | ❌ Fallo | 404 "Incidencia no encontrada" |
| 3 | Sin token | ❌ Fallo | 403 No autenticado |

---

## 9. Resumen de cobertura (resultados reales)

### Suite implementada: Auth (55 + 3 tests = 58 total, todos pasan ✅)

| Archivo | Endpoints | Tests | Estado |
|---------|-----------|-------|--------|
| test_register.py | POST /users | 12 | ✅ Todos pasan |
| test_login.py | POST /auth/login | 10 | ✅ Todos pasan |
| test_token.py | GET /auth/me | 8 | ✅ Todos pasan |
| test_forgot_password.py | POST /auth/forgot-password | 7 | ✅ Todos pasan |
| test_reset_password.py | POST /auth/reset-password | 7 | ✅ Todos pasan |
| test_change_password.py | POST /auth/change-password | 11 | ✅ Todos pasan |
| **Subtotal auth** | **6 endpoints** | **55** | ✅ **100% passing** |

### Cobertura por módulo (auth)

| Módulo | Stmts | Miss | Cobertura | Resultado |
|--------|-------|------|-----------|-----------|
| `app/auth.py` | 40 | 5 | **88%** | ✅ ≥ 70% |
| `app/routers/auth.py` | 64 | 7 | **89%** | ✅ ≥ 70% |
| `app/crud/reset_tokens.py` | 27 | 5 | **81%** | ✅ ≥ 70% |
| `app/schemas.py` | 220 | 18 | **92%** | ✅ ≥ 70% |
| `app/main.py` | 46 | 4 | **96%** | ✅ ≥ 70% |
| `app/config.py` | 19 | 1 | **95%** | ✅ ≥ 70% |
| `app/database.py` | 12 | 0 | **100%** | ✅ ≥ 70% |

### Cobertura global del proyecto

| Métrica | Valor |
|---------|-------|
| Total statements | 870 |
| Statements cubiertas | 552 |
| **Cobertura global** | **63%** |
| **Cobertura auth** | **88-89%** ✅ |

> **Nota:** La cobertura global (63%) está por debajo del 80% porque faltan tests para los módulos `app/routers/incidents.py` (43%), `app/routers/records.py` (37%), `app/routers/profiles.py` (53%), `app/routers/users.py` (51%) y sus CRUD asociados. Estos están planificados en las secciones 5-8.

---

## 10. Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| Tests contra TinyDB en archivo temporal (`tempfile`) | Aislamiento completo, sin riesgo a datos reales |
| Fixtures compartidos en `conftest.py` | Evita duplicación, facilita mantenimiento |
| Un archivo de test por endpoint | Organización clara, ejecución selectiva |
| Tokens JWT generados desde fixtures | No dependen de servicio externo |
| `raise_server_exceptions=False` | Permite testear errores 500 (ej: bcrypt > 72 bytes) |
| `_clean_db` con `autouse=True` | Limpieza automática entre tests |
| Tests de contraseña > 72 chars | Validación Pydantic pre-bcrypt (bcrypt lanza `ValueError` con >72 bytes) |
| Forgot-password: mismo mensaje para existente/inexistente | Prevención de enumeración de usuarios |
| Tokens de un solo uso en reset-password | Seguridad: evitar reuso de tokens comprometidos |
| TestClient síncrono en lugar de AsyncClient | Evita problemas de `coroutine` con fixtures asíncronas |

---

## 11. TypeScript — Pruebas unitarias (Jest)

> **Estado actual:** ✅ 4 suites, **232 pruebas**, todas **pasando**.
> **Cobertura global:** **94.91%** de statements, **93.14%** de branches, **100%** de funciones.

### Cómo ejecutar

```bash
# Desde la raíz del proyecto
npx jest --coverage
```

### Suites de prueba

| Archivo | Tests | Funciones cubiertas |
|---------|-------|---------------------|
| `src/utils/__tests__/validations.test.ts` | ~99 | validateCandidate, validateJobVacancy, validateTrainingProgram, validateEnrollment, validateSupportTicket, validateSalesOpportunity, validateEmployee, validateAll |
| `src/utils/__tests__/collections.test.ts` | ~46 | filterItems, filterByRange, filterBySet, sortBy, sortByMultiple, groupBy, countBy, paginate, uniqueBy, take, chunk |
| `src/utils/__tests__/search.test.ts` | ~51 | linearSearch, linearSearchAll, binarySearch, binarySearchWithInsertionIndex, isSorted, smartSearch |
| `src/utils/__tests__/transformations.test.ts` | ~31 | numericSummary, sumBy, averageBy, maxBy, minBy, countByCategory, categoryDistribution |
| **Total** | **232** | **~32 funciones** |

### Cobertura por archivo

| Archivo | % Statements | % Branches | % Funciones | % Lines |
|---------|-------------|-----------|------------|---------|
| `collections.ts` | 100 | 100 | 100 | 100 |
| `search.ts` | 100 | 100 | 100 | 100 |
| `transformations.ts` | 100 | 100 | 100 | 100 |
| `validations.ts` | 98.90 | 99.07 | 100 | 100 |
| **Global** | **99.40** | **99.27** | **100** | **100** |

### Tipos de prueba por función (232 totales)

Cada función de utilidad se prueba con los tres enfoques:

- **✅ Happy path** — Entradas válidas típicas, se verifica el resultado esperado
- **🔸 Edge case** — Arrays vacíos, un solo elemento, valores frontera (0, 100, negativos), duplicados, `null`/`undefined`
- **❌ Failure mode** — Elemento no encontrado, rutas alternativas (binary vs linear), array vacío, argumentos inválidos
