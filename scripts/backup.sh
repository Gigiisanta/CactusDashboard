#!/bin/bash

set -euo pipefail

BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/home/ubuntu/apps/CactusDashboard"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="cactus_backup_${TIMESTAMP}.tar.gz"
MAX_BACKUPS=7

echo "🔄 Iniciando backup de CactusDashboard..."

mkdir -p "$BACKUP_DIR"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: Directorio de aplicación no encontrado: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "📦 Creando backup: $BACKUP_NAME"

docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "${POSTGRES_USER:-cactus_user}" "${POSTGRES_DB:-cactus_db}" > "${BACKUP_DIR}/db_${TIMESTAMP}.sql" 2>/dev/null || echo "⚠️  Warning: No se pudo hacer backup de la base de datos"

tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='*.log' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    . 2>/dev/null

if [ -f "${BACKUP_DIR}/db_${TIMESTAMP}.sql" ]; then
    gzip "${BACKUP_DIR}/db_${TIMESTAMP}.sql"
fi

echo "✅ Backup creado: ${BACKUP_DIR}/${BACKUP_NAME}"

BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/cactus_backup_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    echo "🧹 Limpiando backups antiguos (manteniendo últimos $MAX_BACKUPS)..."
    ls -1t "${BACKUP_DIR}"/cactus_backup_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    ls -1t "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
echo "📊 Tamaño del backup: $BACKUP_SIZE"
echo "📁 Backups disponibles: $(ls -1 "${BACKUP_DIR}"/cactus_backup_*.tar.gz | wc -l)"

echo "✅ Backup completado exitosamente"