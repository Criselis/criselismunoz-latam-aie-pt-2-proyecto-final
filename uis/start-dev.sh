#!/bin/sh
# ============================================
# Nexova — Arranque en modo desarrollo
# ============================================
# Inicia website (port 3000) y backoffice (port 3001)
# con next dev (recarga en caliente).

set -e

echo "==> Iniciando Website (puerto 3000, dev)..."
cd /app/website
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000/api/v1}" \
  npm run dev -- -p 3000 &
WEBSITE_PID=$!

echo "==> Iniciando Backoffice (puerto 3001, dev)..."
cd /app/backoffice
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000/api/v1}" \
  npm run dev -- -p 3001 &
BACKOFFICE_PID=$!

# Manejo de señal para parar procesos hijos limpiamente
cleanup() {
    echo "==> Deteniendo servicios..."
    kill -TERM "$WEBSITE_PID" "$BACKOFFICE_PID" 2>/dev/null
    wait "$WEBSITE_PID" "$BACKOFFICE_PID" 2>/dev/null
    echo "==> Todos los servicios detenidos."
    exit 0
}
trap cleanup TERM INT

echo "==> Nexova interfaces iniciadas (dev — website:3000, backoffice:3001)"
echo "==> Esperando señales de parada..."

wait