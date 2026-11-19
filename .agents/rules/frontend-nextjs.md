---
name: frontend-nextjs
description: Convenciones de los frontends Next.js 16 de Nexova (website y backoffice)
scope: glob
globs:
  - "uis/website/**"
  - "uis/backoffice/**"
---

# Regla: frontends Next.js

**Alcance:** por patrón de archivo; se aplica al tocar `uis/website/**` o `uis/backoffice/**`.

1. **Next.js 16 no es el Next que conoces.** Antes de usar una API de Next (routing, metadata, data fetching, `next/font`…), consulta `node_modules/next/dist/docs/` y respeta los avisos de deprecación.
2. **URL de la API solo por entorno:** usa `process.env.NEXT_PUBLIC_API_BASE` (`/backend-api`), que `next.config.ts` reenvía a `API_INTERNAL_URL` (`http://backend:8000`, el nombre del servicio). No escribas URLs directamente en el código ni uses `localhost` como fallback.
3. **Llamadas HTTP centralizadas** en `lib/` (`api.ts`, `auth-api.ts`, `inventory.ts`…). Los componentes y las páginas no llaman a `fetch` directamente.
4. **Errores:** normaliza con `lib/errors.ts` y muestra mensajes en español. Una respuesta `401` cierra la sesión y redirige a `/login`.
5. **Rutas privadas** del backoffice: envuélvelas con `lib/auth-guard.tsx`. Ninguna pantalla interna puede ir en `uis/website`.
6. **Tipos** del dominio en `lib/types.ts`, alineados con los `schemas.py` del backend.
7. **UI:** Tailwind CSS 4, HTML semántico y atributos ARIA en formularios, con el copy en español. El sitio público incluye metadatos SEO y schema.org (`Organization`) de Nexova.
