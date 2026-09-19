# ============================================
# Nexova — Dockerfile para interfaces web
# ============================================
# Construye y sirve dos aplicaciones Next.js:
#   - website    → puerto 3000
#   - backoffice → puerto 3001
#
# En desarrollo (por defecto) usa next dev con recarga en caliente.
# Para producción, construir con --target=production.

FROM node:22-alpine AS base

WORKDIR /app

# ── Dependencias para desarrollo (instalación local) ────────────────
FROM base AS development

# Instala dependencias de website como proyecto independiente
COPY website/ /app/website/
WORKDIR /app/website
RUN npm install --no-audit --no-fund

# Instala dependencias de backoffice como proyecto independiente
COPY backoffice/ /app/backoffice/
WORKDIR /app/backoffice
RUN npm install --no-audit --no-fund

WORKDIR /app
EXPOSE 3000 3001

# En desarrollo usa start-dev.sh (next dev)
COPY start-dev.sh /usr/local/bin/start-dev.sh
RUN chmod +x /usr/local/bin/start-dev.sh
CMD ["start-dev.sh"]

# ── Fase de producción ──────────────────────────────────────────────
FROM base AS production

# Construir website como proyecto independiente
COPY website/ /app/website/
WORKDIR /app/website
RUN npm install --no-audit --no-fund
RUN npm run build

# Construir backoffice como proyecto independiente
COPY backoffice/ /app/backoffice/
WORKDIR /app/backoffice
RUN npm install --no-audit --no-fund
RUN npm run build

# Volver al directorio raíz para el script de arranque
WORKDIR /app

# Instalar tini
RUN apk add --no-cache tini

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 3000 3001
ENTRYPOINT ["tini", "--"]
CMD ["start.sh"]