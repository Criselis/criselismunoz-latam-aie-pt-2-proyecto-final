# Propuesta de Arquitectura del Backend — Nexova Solutions

> **Para:** CTO (Sergio Molina) y equipo de ingeniería
> **Estado:** borrador para revisión antes del próximo sprint
> **Alcance:** API central en `services/backend` (FastAPI) que da servicio al sitio público (`uis/website`) y al backoffice interno (`uis/backoffice`).
> **Contexto de negocio:** [`BRIEFING.md`](../BRIEFING.md) · **Contexto técnico:** [`memory-bank/techContext.md`](../memory-bank/techContext.md)

---

## 1. Resumen

Propongo una **arquitectura en capas organizada por dominios de negocio** (un *monolito modular*): una sola aplicación FastAPI, desplegada como un único servicio, en la que el código se agrupa primero por **dominio** (Selección, Formación, Soporte, RR. HH., Ventas, Identidad) y dentro de cada dominio por **capa** (router → servicio → repositorio → modelos/esquemas).

Descarto MVC clásico, serverless y microservicios para esta etapa; las razones están en la sección 3. El objetivo es que el backend sea el **punto único donde se centralizan los datos** de Nexova, que es exactamente el problema de fondo del briefing: hoy cada área vive en su propia herramienta desconectada.

---

## 2. Qué necesita el sistema (características que condicionan la arquitectura)

| Característica de Nexova | Fuente | Consecuencia para el backend |
|---|---|---|
| Cinco áreas muy distintas (Selección, Formación, Soporte, Ventas, RR. HH.) más Dirección, con datos, usuarios y reglas propios | `BRIEFING.md` → "Los departamentos y sus problemas" | El código debe separarse **por dominio**, para que cada área evolucione sin romper a las demás |
| El problema raíz es la fragmentación: HubSpot, Zendesk legacy, ATS de 2010 y hojas de cálculo sin conexión | `BRIEFING.md` → Tecnología e Infraestructura | Una **única API** que concentre los datos; partirla en muchos servicios repetiría la fragmentación |
| Dirección quiere KPIs de todas las áreas en tiempo real en vez de un PDF semanal | `BRIEFING.md` → Dirección Ejecutiva | Los dominios deben poder **consultarse entre sí** de forma sencilla (agregaciones transversales) |
| Equipo técnico de 6 personas, sin despliegues automáticos ni telemetría todavía | `BRIEFING.md` → Tecnología e Infraestructura | La operación tiene que ser **simple**: un servicio, un despliegue, un lugar donde mirar logs |
| La IA es el núcleo del negocio: scoring de CV, RAG sobre candidatos, chatbots, agentes | `BRIEFING.md` → "¿Por qué elegir Nexova?" | Procesos **largos y con estado** (indexación, embeddings, colas): necesitan un servidor persistente y una capa de servicios donde enchufar esa lógica |
| Usuarios B2B profesionales; SLA de soporte de 24 h | `BRIEFING.md` → Atención al Cliente | Se necesitan **reglas de negocio explícitas y testeables** (estados, transiciones, plazos), separadas de HTTP |
| Dos frontends separados (público e interno) | `memory-bank/techContext.md` | La API se diseña como **servicio independiente** que habla JSON, con CORS y configuración por entorno |

---

## 3. Patrón arquitectónico elegido y por qué

### 3.1 Elegido: arquitectura en capas, organizada por dominios (monolito modular)

Cada petición atraviesa siempre las mismas capas, cada una con una sola responsabilidad:

```text
HTTP ──► Router (FastAPI)      valida entrada/salida con Pydantic, aplica auth, traduce errores a HTTP
           │
           ▼
         Service (dominio)     reglas de negocio: estados, transiciones, cálculos, orquestación
           │
           ▼
         Repository            acceso a datos: TinyDB o PostgreSQL (SQLModel); nada de reglas aquí
           │
           ▼
         Models / Schemas      tablas (SQLModel) y contratos de entrada/salida (Pydantic)
```

**Por qué encaja con Nexova:**

1. **Separa lo que cambia por razones distintas.** Las reglas del pipeline de selección (etapas de un candidato) cambian cuando cambia el proceso de Javier Almeida; las de soporte (SLA, escalado) cuando cambia el contrato de un cliente. Si viven en su propio dominio y en la capa de servicio, un cambio en una no toca la otra.
2. **Las reglas de negocio quedan testeables sin HTTP ni base de datos.** Con un SLA de 24 h y scoring de CV que debe ser explicable, necesitamos tests sobre la lógica pura (servicio) y no solo sobre endpoints.
3. **Permite cambiar el almacenamiento sin tocar las reglas.** Hoy Nexova usa TinyDB para selección/auth/incidencias y PostgreSQL (Supabase) para formación e inventario. Con un repositorio por dominio, migrar un dominio de TinyDB a PostgreSQL solo cambia esa capa.
4. **Un solo despliegue para un equipo de 6.** Mantiene la operación al alcance del equipo actual y deja la puerta abierta a extraer un dominio a su propio servicio más adelante (por ejemplo, el procesamiento de CV con IA) sin rediseñar todo.

### 3.2 Alternativas descartadas

| Patrón | Por qué no ahora |
|---|---|
| **MVC clásico** | Su "V" son vistas renderizadas por el servidor. En Nexova las vistas las renderiza Next.js en `uis/`; el backend solo devuelve JSON. Además, MVC no dice cómo separar cinco áreas de negocio: terminaríamos con un `controllers/` gigante. Sí tomamos su idea útil: separar modelo y controlador (router). |
| **Serverless (funciones)** | Las funcionalidades de IA del roadmap (indexar CV, generar embeddings, RAG, agentes) son procesos largos y con estado que chocan con los límites de tiempo y el arranque en frío de las funciones. También multiplica las piezas a operar para un equipo de 6 sin telemetría. |
| **Microservicios** | Repetiría el problema que Nexova quiere resolver: datos repartidos en sistemas que no se hablan. Exige red, contratos entre servicios, despliegues coordinados y observabilidad que hoy no existen. El monolito modular deja preparada la separación por si un dominio lo necesita en el futuro. |

---

## 4. Estructura de carpetas y módulos propuesta

Criterio: **primero por dominio de negocio, después por responsabilidad (capa)**. Lo transversal (configuración, seguridad, base de datos) va en `core/`.

```text
services/backend/
├── app/
│   ├── main.py                  # crea la app, CORS, handlers de error, incluye api_router. Sin endpoints propios
│   ├── api/
│   │   ├── router.py            # api_router con prefix="/api/v1"; incluye el router de cada dominio
│   │   └── deps.py              # dependencias compartidas: get_current_user, get_db, require_role
│   ├── core/
│   │   ├── config.py            # Settings desde variables de entorno (.env), sin valores secretos por defecto
│   │   ├── security.py          # hash de contraseñas, creación/validación de JWT
│   │   ├── database.py          # conexiones TinyDB y PostgreSQL (SQLModel)
│   │   └── errors.py            # excepciones de dominio → respuestas HTTP homogéneas
│   ├── domains/
│   │   ├── identity/            # usuarios, perfiles, login, reset de contraseña
│   │   ├── talent/              # Operaciones de Selección: candidatos, notas, vacantes, scoring (IA)
│   │   ├── training/            # Formación Corporativa: programas, cupos, inscripciones
│   │   ├── support/             # Soporte al Cliente: incidencias, SLA, base de conocimiento
│   │   ├── hr/                  # RR. HH. interno: empleados, ausencias, onboarding
│   │   ├── sales/               # Ventas: prospectos, pipeline, alertas de seguimiento
│   │   └── analytics/           # KPIs agregados para Dirección (solo lee de otros dominios)
│   │       # Cada dominio repite la misma estructura:
│   │       #   router.py      endpoints del dominio (APIRouter)
│   │       #   schemas.py     modelos Pydantic de entrada/salida
│   │       #   service.py     reglas de negocio
│   │       #   repository.py  acceso a datos
│   │       #   models.py      tablas SQLModel (si el dominio usa PostgreSQL)
│   └── shared/                  # utilidades sin dominio: paginación, fechas, ids
├── tests/
│   ├── conftest.py
│   └── domains/<dominio>/test_*.py   # misma forma que app/domains
├── requirements.txt
└── .env.example
```

Reglas de la estructura:

- **Un dominio no importa el `repository` de otro.** Si `analytics` necesita datos de `talent`, llama al `service` de `talent`. Así cada dominio controla sus propias reglas.
- **Reglas compartidas entre servicios del monorepo** (no solo del backend), como las transiciones de estado de incidencias, siguen en `packages/shared/` tal como hoy.
- **Inventario** pertenece a `training`: lo que Nexova "inventaría" son cupos de programas formativos (`TrainingProgram`, `StockEntry`, `StockExit`).

### 4.1 De dónde partimos (estado actual) y cómo llegar

El backend ya existe (Hitos de autenticación, incidencias e inventario) con una estructura por **tipo de archivo**: `routers/`, `crud/`, un único `schemas.py` y un único `models.py`. La propuesta no exige reescribirlo; se migra dominio a dominio:

| Hoy | Propuesta |
|---|---|
| `app/routers/auth.py`, `users.py`, `profiles.py` + `GET /auth/me` en `main.py` | `domains/identity/router.py` |
| `app/routers/records.py` (candidatos y notas) | `domains/talent/router.py` |
| `app/routers/incidents.py` | `domains/support/router.py` |
| `app/routers/inventory.py`, `app/models.py`, `seed_inventory.py` | `domains/training/` |
| `app/crud/*.py` | `domains/<dominio>/repository.py` |
| Lógica de negocio dentro de routers (p. ej. `_update_or_404` en `records.py`) | `domains/<dominio>/service.py` |
| `app/schemas.py` (418 líneas, 34 clases de todos los dominios) | `domains/<dominio>/schemas.py` |
| `app/config.py`, `auth.py`, `database.py` | `core/config.py`, `core/security.py`, `core/database.py` |

Orden sugerido: `support` (el más autocontenido) → `talent` → `identity` → `training`. Cada paso es un PR con los tests en verde.

---

## 5. Organización de routers y endpoints

Todos los endpoints de negocio cuelgan de **`/api/v1`**, un `APIRouter` por dominio, y cada router agrupa sus recursos. Fuera del prefijo solo queda `GET /health`.

| Dominio (router) | Prefijo | Rutas principales | Quién la usa |
|---|---|---|---|
| `identity` | `/api/v1/auth` | `POST /login`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `POST /change-password` | Ambos frontends |
| `identity` | `/api/v1/users` | `POST /` (registro), `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`; `GET /me/profile`, `PUT /me/profile` | Backoffice |
| `talent` | `/api/v1/candidates` | `GET /` (filtros: estado, etapa, búsqueda), `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`; `GET/POST /{id}/notes`, `DELETE /{id}/notes/{note_id}` | Backoffice (consultores) |
| `talent` | `/api/v1/vacancies` | `GET /`, `POST /`, `GET /{id}/candidates` (ranking), `POST /{id}/screening` (scoring IA) | Backoffice |
| `talent` | `/api/v1/applications` | `POST /` (formulario público), `GET /{id}/status` (portal del candidato) | Sitio público |
| `training` | `/api/v1/training` | `GET /programs`, `GET /programs/{id}`, `POST /programs`; `POST /orders/inbound`, `POST /orders/outbound`, `GET /orders`; `POST /enrollments` | Backoffice y sitio público (catálogo) |
| `support` | `/api/v1/incidents` | `GET /`, `GET /summary`, `GET /{id}`, `POST /`, `PATCH /{id}`, `PATCH /{id}/status`, `DELETE /{id}` | Backoffice (agentes de soporte) |
| `hr` | `/api/v1/hr` | `GET/POST /employees`, `GET/POST /leave-requests`, `PATCH /leave-requests/{id}`, `GET /onboarding/{employee_id}` | Backoffice (RR. HH.) |
| `sales` | `/api/v1/sales` | `GET/POST /prospects`, `PATCH /prospects/{id}/stage`, `GET /alerts/stale` | Backoffice (Ventas) |
| `analytics` | `/api/v1/analytics` | `GET /kpis` (resumen ejecutivo), `GET /kpis/{area}` | Backoffice (Dirección) |

Criterios de agrupación:

- **Un router por dominio**, nunca un único archivo con todas las rutas, y **sustantivos en plural** para los recursos (`/candidates`, `/incidents`).
- **Recursos anidados solo cuando dependen del padre** (`/candidates/{id}/notes`); si un recurso tiene vida propia, va en la raíz de su dominio.
- **Acciones que no son CRUD como sub-recurso explícito** (`/incidents/{id}/status`, `/vacancies/{id}/screening`) para que la transición quede visible en la API y en la documentación.
- **`tags=[dominio]` en cada router** para que `/docs` (OpenAPI) quede agrupado por área.
- Hoy los prefijos son **inconsistentes** (`/records` y `/inventory` en la raíz, incidencias en `/api/incidents`); unificar en `/api/v1` es parte de la migración (ver riesgo R1).

---

## 6. Qué tomamos de la estructura estándar de FastAPI

Antes de redactar revisé cómo se estructuran habitualmente los proyectos FastAPI:

| Convención | Origen | Cómo se refleja en la propuesta |
|---|---|---|
| Dividir la app en varios archivos con `APIRouter`, incluir cada router con `prefix` y `tags`, y dejar `main.py` solo para crear la app | Documentación oficial de FastAPI, *Bigger Applications - Multiple Files* (<https://fastapi.tiangolo.com/tutorial/bigger-applications/>) | Un `router.py` por dominio; `api/router.py` los agrega con `prefix="/api/v1"`; `main.py` sin endpoints |
| Dependencias reutilizables declaradas una vez y aplicadas por router o ruta (`Depends`) | FastAPI, *Dependencies* (<https://fastapi.tiangolo.com/tutorial/dependencies/>) | `api/deps.py` con `get_current_user`, `get_db`, `require_role` |
| Configuración con una clase `Settings` leída de variables de entorno | FastAPI, *Settings and Environment Variables* (<https://fastapi.tiangolo.com/advanced/settings/>) | `core/config.py`; nada de secretos ni URLs en el código |
| Separar `core/` (config, seguridad, db), `api/` (rutas), modelos y CRUD, y prefijo de versión `/api/v1` | Plantilla oficial *Full Stack FastAPI Template* (<https://github.com/fastapi/full-stack-fastapi-template>, carpeta `backend/app`) | `core/`, `api/`, `repository.py` (su `crud`) y `/api/v1` |
| Modelos de tabla con SQLModel separados de los esquemas de entrada/salida | Misma plantilla y documentación de SQLModel (<https://sqlmodel.tiangolo.com/>) | `models.py` y `schemas.py` separados dentro de cada dominio |
| `CORSMiddleware` con lista explícita de orígenes | FastAPI, *CORS* (<https://fastapi.tiangolo.com/tutorial/cors/>) | Sección 7 |

**Dónde me aparto de la plantilla:** la plantilla oficial agrupa por tipo de archivo (`api/routes/`, `crud.py`, `models.py` globales). Funciona bien con pocas entidades, pero Nexova tendrá cinco áreas con decenas de entidades: un único `models.py` o `schemas.py` crecería sin control (el `schemas.py` actual ya tiene 418 líneas). Por eso conservo sus capas y convenciones, pero las organizo **por dominio** dentro de `domains/`.

---

## 7. Frontend y backend como sistemas separados

### 7.1 Repositorio: monorepo con fronteras claras
Frontend y backend viven en el **mismo repositorio** (`uis/` y `services/`) pero son **aplicaciones independientes**: cada una tiene sus dependencias, su Dockerfile y su proceso. Se elige monorepo porque un mismo cambio de negocio suele tocar API y pantalla a la vez (un PR, una revisión) y porque el equipo es pequeño. La frontera se respeta así: **el frontend nunca importa código de `services/`** y solo se comunica por HTTP.

### 7.2 Comunicación por API
- **REST + JSON** con contratos definidos por los esquemas Pydantic. FastAPI publica el contrato en `/docs` y `/openapi.json`, y los tipos de `uis/*/lib/types.ts` deben coincidir con él.
- **Versionado en la URL (`/api/v1`)**: el sitio público y el backoffice se despliegan por separado; un cambio incompatible se publica como `/api/v2` sin romper al frontend que aún no se actualizó.
- **Autenticación sin estado** con JWT en la cabecera `Authorization: Bearer`. El backend no guarda sesión; cualquier instancia puede atender cualquier petición.
- **Errores homogéneos**: siempre `{"detail": ...}` con el código HTTP correcto (401 cierra la sesión en el frontend, 404, 422/400 de validación). Nunca trazas internas.

### 7.3 Variables de entorno
| Variable | Dónde | Para qué |
|---|---|---|
| `NEXOVA_SECRET_KEY`, `NEXOVA_ACCESS_TOKEN_EXPIRE_MINUTES` | backend | Firma de JWT |
| `SUPABASE_DATABASE_URL`, `NEXOVA_TINYDB_PATH` | backend | Conexiones a datos |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXOVA_FRONTEND_URL` | backend | Emails de restablecimiento con enlace al frontend |
| `CORS_ORIGINS` (propuesta nueva) | backend | Orígenes permitidos por entorno |
| `NEXT_PUBLIC_API_BASE` | frontends | URL de la API vista por el navegador (`/backend-api`) |
| `API_INTERNAL_URL` | frontends | Destino del proxy de Next dentro de Docker (`http://backend:8000`) |

Regla: los valores reales viven en `.env` (ignorado por Git) y en el servidor; en el repo solo hay `.env.example`. Las variables `NEXT_PUBLIC_*` se exponen al navegador, así que **nunca** llevan secretos.

### 7.4 CORS
El navegador bloquea peticiones de un origen (`http://localhost:3001`, el backoffice) a otro (`http://localhost:8000`, la API) salvo que la API lo permita con `CORSMiddleware`. Propuesta:
- Lista **explícita** de orígenes leída de `CORS_ORIGINS` (sitio público, backoffice y sus dominios de producción). Nunca `"*"` junto con credenciales.
- Hoy la lista está fija en el código y solo incluye `http://localhost:3000`, no el backoffice (3001). En Docker no se nota porque el backoffice llama a su propio origen (`/backend-api`) y Next reenvía la petición, pero cualquier llamada directa del navegador fallaría (ver riesgo R4).

---

## 8. Decisiones técnicas iniciales

1. **FastAPI + Pydantic** para validación y documentación automática del contrato (ya en uso).
2. **Python 3.12** fijado en `services/Dockerfile`; dependencias en `requirements.txt` instaladas en un entorno virtual o con `uv` dentro de Docker.
3. **Persistencia híbrida mientras dure la transición**: TinyDB para identidad, selección e incidencias; PostgreSQL (Supabase) con SQLModel para formación e inventario. Todo dominio nuevo va a PostgreSQL; los de TinyDB migran cuando la carga lo justifique. El acceso siempre pasa por `repository.py`.
4. **Prefijo `/api/v1`** para todas las rutas de negocio y `GET /health` para el healthcheck de Docker.
5. **Autorización por roles** (`consultant`, `support_agent`, `hr`, `sales`, `executive`, `admin`) con una dependencia `require_role(...)`, porque cada área solo debe ver sus datos.
6. **Tests con pytest** por dominio, con la base de datos aislada en cada test (como hace hoy `tests/conftest.py`).
7. **Procesos de IA largos fuera del ciclo de la petición**: el endpoint encola o registra la tarea y devuelve `202`; el procesamiento (scoring de CV, embeddings) se ejecuta aparte. El mecanismo concreto se decidirá en el módulo de procesamiento asíncrono.

---

## 9. Riesgos y puntos de atención

| # | Riesgo si no se sigue la estructura | Señal de que está pasando | Mitigación |
|---|---|---|---|
| R1 | **Rutas inconsistentes**: cada desarrollador elige su prefijo y el frontend acumula excepciones | Ya ocurre: incidencias en `/api/incidents` y el resto en la raíz; el cliente llamaba a `/incidents` y la página devolvía 404 hasta que se corrigió | Todas las rutas bajo `/api/v1`, agregadas en `api/router.py`; revisar `/openapi.json` en cada PR |
| R2 | **Lógica de negocio en los routers**: reglas duplicadas e imposibles de testear sin HTTP | Funciones auxiliares con lógica de negocio dentro del router, como `_update_or_404` en `records.py` | Los routers solo traducen HTTP ↔ servicio; las reglas van a `service.py` con tests unitarios |
| R3 | **Archivos "cajón de sastre"** que crecen sin dueño y generan conflictos de merge | `schemas.py` con 418 líneas y 34 clases de todos los dominios; `GET /auth/me` definido en `main.py` en lugar de en su router | Esquemas y rutas dentro de su dominio; `main.py` sin endpoints |
| R4 | **CORS y URLs mal configurados** según el entorno: funciona en un portátil y falla en el VPS | Orígenes fijos en `config.py` que no incluyen el backoffice; URLs con `localhost` (motivo del rechazo de la entrega de Docker) | `CORS_ORIGINS` y URLs de la API siempre por variables de entorno, documentadas en `.env.example` |
| R5 | **Confusión entre las dos bases de datos**: un dominio guarda la mitad de sus datos en cada una | Consultas que cruzan TinyDB y PostgreSQL para un mismo recurso | Una base por dominio, decidida y anotada en `memory-bank/techContext.md`; el acceso solo por `repository.py` |
| R6 | **Dependencias circulares entre dominios** (p. ej. `talent` importa `training` y viceversa) | Errores de importación al arrancar o al ejecutar tests | Un dominio solo usa el `service` de otro, nunca su repositorio; `analytics` solo lee |
| R7 | **Secretos en el código o en Git** | Valores por defecto con claves reales o `.env` versionado | `Settings` sin valores secretos por defecto (la app no arranca si faltan, como hoy); `.env` en `.gitignore` |

---

## 10. Próximos pasos

1. Revisar esta propuesta con el CTO y registrar las decisiones aceptadas en `memory-bank/techContext.md`.
2. Crear `core/` y `api/router.py` con `/api/v1`, manteniendo temporalmente las rutas actuales para no romper los frontends.
3. Migrar el dominio `support` como piloto y ajustar `uis/backoffice/lib/api.ts`.
4. Repetir con `talent`, `identity` y `training`; abrir los nuevos dominios (`hr`, `sales`, `analytics`) ya con la estructura propuesta.
