# ============================================
# Nexova — Dockerfile para backend API
# ============================================
# Usa uv para instalación rápida de dependencias.
# Arranca Uvicorn con --reload para recarga automática en desarrollo.

FROM python:3.12-slim AS base

WORKDIR /app

# ── Dependencias del sistema ─────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Instalar uv ─────────────────────────────────────────────────────
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# ── Dependencias de Python (con uv) ────────────────────────────────
COPY backend/requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# ── Código de la aplicación ─────────────────────────────────────────
COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]