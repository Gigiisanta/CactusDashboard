#!/bin/bash

set -euo pipefail

APP_DIR="/home/ubuntu/apps/CactusDashboard"
BACKUP_SCRIPT="/home/ubuntu/scripts/backup.sh"
LOG_FILE="/home/ubuntu/update.log"

echo "🚀 Iniciando actualización de CactusDashboard - $(date)"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: Directorio de aplicación no encontrado: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "📦 Ejecutando backup antes de la actualización..."
if [ -f "$BACKUP_SCRIPT" ]; then
    bash "$BACKUP_SCRIPT"
else
    echo "⚠️  Warning: Script de backup no encontrado en $BACKUP_SCRIPT"
fi

echo "🔄 Deteniendo servicios..."
docker compose -f docker-compose.prod.yml down --remove-orphans

echo "📥 Actualizando código desde GitHub..."
git fetch origin
git reset --hard origin/main
git clean -fd

echo "🏗️  Construyendo imágenes actualizadas..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🧹 Limpiando imágenes no utilizadas..."
docker image prune -f

echo "🚀 Iniciando servicios actualizados..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "⏳ Esperando que los servicios estén listos..."
sleep 30

echo "🔍 Verificando estado de los servicios..."
docker compose -f docker-compose.prod.yml ps

BACKEND_HEALTH=$(docker compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:8000/health 2>/dev/null && echo "✅ OK" || echo "❌ FAIL")
FRONTEND_HEALTH=$(docker compose -f docker-compose.prod.yml exec -T frontend curl -f http://localhost:3000 2>/dev/null && echo "✅ OK" || echo "❌ FAIL")

echo "📊 Estado de servicios:"
echo "  Backend: $BACKEND_HEALTH"
echo "  Frontend: $FRONTEND_HEALTH"

if [[ "$BACKEND_HEALTH" == *"FAIL"* ]] || [[ "$FRONTEND_HEALTH" == *"FAIL"* ]]; then
    echo "❌ Error: Algunos servicios no están funcionando correctamente"
    echo "📋 Logs del backend:"
    docker compose -f docker-compose.prod.yml logs --tail=20 backend
    echo "📋 Logs del frontend:"
    docker compose -f docker-compose.prod.yml logs --tail=20 frontend
    exit 1
fi

echo "🎉 Actualización completada exitosamente - $(date)"
echo "🌐 Servicios disponibles:"
echo "  Frontend: http://$(curl -s ifconfig.me):3000"
echo "  Backend API: http://$(curl -s ifconfig.me):8000/docs"
echo "  n8n: http://$(curl -s ifconfig.me):5678"