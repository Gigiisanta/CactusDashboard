#!/usr/bin/env bash

# 🔍 VERIFICACIÓN RÁPIDA DEL ESTADO DEL DESPLIEGUE
# Script para verificar el estado actual del despliegue

set -euo pipefail

# Configuración
SERVER_IP="18.218.252.174"
SSH_KEY="~/Downloads/cactus-key.pem"
SSH_USER="ubuntu"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

# Expandir ruta de la clave SSH
SSH_KEY="${SSH_KEY/#\~/$HOME}"

echo "🔍 VERIFICACIÓN RÁPIDA DEL ESTADO"
echo "================================="

# 1. Verificar si los contenedores están ejecutándose
log "1. Verificando contenedores Docker..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
    cd ~/apps/CactusDashboard 2>/dev/null || { echo 'Directorio no existe aún'; exit 0; }
    if [ -f docker-compose.simple.yml ]; then
        echo 'Estado de contenedores:'
        docker-compose -f docker-compose.simple.yml ps 2>/dev/null || echo 'Contenedores aún no iniciados'
        echo ''
        echo 'Procesos Docker activos:'
        docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo 'Sin contenedores activos'
    else
        echo 'Archivo docker-compose.simple.yml no encontrado'
    fi
"

echo ""

# 2. Verificar puertos
log "2. Verificando puertos..."
for port in 3000 8000 5432 6379; do
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "netstat -tuln 2>/dev/null | grep :$port" >/dev/null 2>&1; then
        echo "✅ Puerto $port: ACTIVO"
    else
        echo "❌ Puerto $port: INACTIVO"
    fi
done

echo ""

# 3. Verificar conectividad web
log "3. Verificando conectividad web..."
if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    echo "✅ Frontend (puerto 3000): ACCESIBLE"
else
    echo "❌ Frontend (puerto 3000): NO ACCESIBLE"
fi

if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/health" >/dev/null 2>&1; then
    echo "✅ Backend (puerto 8000): ACCESIBLE"
else
    echo "❌ Backend (puerto 8000): NO ACCESIBLE"
fi

echo ""

# 4. Verificar logs recientes
log "4. Últimos logs del despliegue..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
    cd ~/apps/CactusDashboard 2>/dev/null || exit 0
    if [ -f docker-compose.simple.yml ]; then
        echo 'Últimos 5 logs de cada servicio:'
        docker-compose -f docker-compose.simple.yml logs --tail=5 2>/dev/null || echo 'Sin logs disponibles'
    fi
"

echo ""
echo "🎯 RESUMEN"
echo "=========="
echo "Para monitorear en tiempo real:"
echo "  ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
echo "  cd ~/apps/CactusDashboard"
echo "  docker-compose -f docker-compose.simple.yml logs -f"
echo ""
echo "URLs de verificación:"
echo "  Frontend: http://$SERVER_IP:3000"
echo "  Backend:  http://$SERVER_IP:8000/docs"