# AGENTS.md — Cómo trabaja un agente de código en el monorepo de Nexova

Este archivo es el protocolo obligatorio para cualquier agente de código (Claude Code, Cursor, Windsurf, Copilot…) que trabaje en este repositorio. Si una instrucción de una sesión lo contradice, detente y pregunta al desarrollador.

## 1. Al iniciar cada sesión (lectura obligatoria)

Lee estos archivos en este orden **antes de proponer o tocar código**:

1. `BRIEFING.md`: la empresa, los departamentos y sus problemas.
2. `memory-bank/projectbrief.md`: el objetivo del proyecto y las prioridades de negocio.
3. `memory-bank/techContext.md`: el stack, el mapa de carpetas, las decisiones y las restricciones.
4. `memory-bank/progress.md`: qué está hecho, qué está en curso y la deuda conocida.
5. `.agents/rules/*.md`: las reglas que aplican a los archivos que vas a tocar (según el `scope` de cada regla).
6. El `README.md` de la carpeta donde vas a trabajar y, en `uis/*`, su `AGENTS.md` local.

Si una tarea encaja con una skill de `.agents/skills/`, sigue su `SKILL.md` paso a paso.

## 2. Dónde va el código (no inventes árboles paralelos)

| Necesitas… | Va en |
|---|---|
| Página o componente de la web pública | `uis/website` |
| Pantalla de la app interna (pipeline, incidencias, formación, inventario, cuenta) | `uis/backoffice` |
| Endpoint o lógica de API | `services/backend/app/` (`routers/`, `crud/`, `schemas.py`, `models.py`) |
| Un servicio backend nuevo e independiente | `services/<nombre-servicio>/` |
| Reglas de negocio compartidas entre servicios | `packages/shared/` |
| Script de mantenimiento o seed | `scripts/` |
| Agente, skill, MCP o workflow **de producto** para Nexova | `agents/`, `skills/`, `mcps/`, `workflows/` |
| Regla o skill para **el agente de código** | `.agents/rules/`, `.agents/skills/` |

`uis/talent-pipeline-tracker` es legacy: no añadas código ahí.

## 3. Flujo obligatorio antes de cada commit

Ejecuta estos pasos **en orden**. Si alguno falla, corrige y vuelve a empezar desde el paso 1. No hagas commit con un paso en rojo.

1. **Revisar el alcance:** `git status` y `git diff`. Confirma que solo cambiaste archivos relacionados con la tarea, que no hay secretos (`.env`, claves, tokens) ni artefactos (`node_modules/`, `.venv/`, `.next/`, `coverage/`, `__pycache__/`, `data/*.json`) y que no tocaste archivos protegidos (sección 4) sin permiso.
2. **Verificar tipos y lint** de cada paquete tocado:
   - `uis/backoffice`: `npx tsc --noEmit` y `npm run lint`
   - `uis/website`: `npx tsc --noEmit`
   - Raíz (`src/`): `npm run typecheck`
3. **Ejecutar los tests** afectados:
   - Backend: `cd services/backend && python -m pytest tests/ -q` (requiere `NEXOVA_SECRET_KEY` y `SUPABASE_DATABASE_URL` en `.env`).
   - Utilidades TS: `npx jest` desde la raíz.
   - Si añadiste lógica nueva, añade también sus tests.
4. **Actualizar el banco de memoria:**
   - `memory-bank/progress.md` cambia siempre (hecho, en curso o deuda).
   - `memory-bank/techContext.md` cambia si cambió el stack, una dependencia, una variable de entorno o una decisión de arquitectura.
   - El `.env.example` correspondiente se actualiza si añadiste variables.
5. **Hacer el commit** en una rama `feature/<tema>` (nunca directamente en `main`), con un mensaje en español, en presente y descriptivo (p. ej. `Se implementa el endpoint de vacantes con tests`).
6. **Abrir un PR hacia `main`** con un resumen de los cambios y cómo probarlos. Haz merge solo cuando el PR esté aprobado.

## 4. No modificar sin confirmación explícita del desarrollador

- `BRIEFING.md` y `CONTEXT.md` (contexto oficial de la empresa).
- `AGENTS.md` y `.agents/` (este protocolo).
- `docker-compose.yml`, `services/Dockerfile`, `uis/Dockerfile`, `uis/start*.sh` (infraestructura compartida).
- `services/backend/app/config.py`, `services/backend/app/auth.py`, `services/backend/app/database.py` (seguridad y conexiones).
- `services/backend/app/models.py`: un cambio afecta al esquema de Supabase.
- `packages/shared/`: lo consumen varios servicios.
- Cualquier `.env` o `.env.example`, `package.json`/`package-lock.json` y `requirements.txt` (dependencias).
- Datos en `data/raw/` y la base de TinyDB (`services/backend/data/`).
- Historial de git: nada de `push --force`, `reset --hard`, rebase de ramas publicadas ni borrar ramas.

## 5. Cuándo detenerse y preguntar

- La tarea exige tocar algo de la sección 4.
- Hay que elegir entre TinyDB y Supabase para un dominio nuevo.
- Los requisitos de `BRIEFING.md` y la petición del desarrollador no coinciden.
- Un test que ya existía empieza a fallar y no es obvio por qué.
