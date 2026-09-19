#!/bin/sh
# ============================================
# Nexova — Arranque de interfaces web
# ============================================
# Inicia website (puerto 3000) y backoffice (puerto 3001)
# en segundo plano y mantiene el contenedor vivo.

set -e

echo "==> Iniciando Website (puerto 3000)..."
cd /app/website
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000/api/v1}" \
  node node_modules/.bin/next start -p 3000 &
WEBSITE_PID=$!

echo "==> Iniciando Backoffice (puerto 3001)..."
cd /app/backoffice
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-http://localhost:8000/api/v1}" \
  node node_modules/.bin/next start -p 3001 &
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

echo "==> Nexova interfaces iniciadas (website:3000, backoffice:3001)"
echo "==> Esperando señales de parada..."

# Esperar a que cualquiera de los dos procesos termine
wait