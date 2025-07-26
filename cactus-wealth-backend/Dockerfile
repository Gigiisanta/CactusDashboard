# ================================
# 🚀 ULTRA-OPTIMIZED ALPINE MULTI-STAGE BUILD
# ================================

# ---- Etapa Builder ----
FROM python:3.12-alpine as builder

WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache gcc musl-dev libffi-dev postgresql-dev

# Instalar solo dependencias primero para cache óptimo
COPY ./cactus-wealth-backend/pyproject.toml ./pyproject.toml
COPY ./cactus-wealth-backend/poetry.lock ./poetry.lock
RUN pip install --no-cache-dir poetry poetry-plugin-export
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only=main

# ---- Etapa Final ----
FROM python:3.12-alpine

WORKDIR /app

# Instalar solo librerías esenciales para runtime
RUN apk add --no-cache curl postgresql-libs && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copiar requirements y solo después instalar
COPY --from=builder /app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar solo el código fuente necesario
COPY ./cactus-wealth-backend/src ./src
COPY ./cactus-wealth-backend/main.py ./main.py
COPY ./cactus-wealth-backend/entrypoint.sh ./entrypoint.sh
COPY ./cactus-wealth-backend/entrypoint_worker.sh ./entrypoint_worker.sh
COPY ./cactus-wealth-backend/alembic.ini ./alembic.ini
COPY ./cactus-wealth-backend/alembic ./alembic
COPY cactuscrm ./cactuscrm

RUN chmod +x ./entrypoint.sh ./entrypoint_worker.sh && \
    chown -R appuser:appgroup /app

USER appuser

ENV PYTHONPATH="/app/src:$PYTHONPATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]