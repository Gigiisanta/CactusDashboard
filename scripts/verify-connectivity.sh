#!/usr/bin/env bash

# 🔍 VERIFICACIÓN DE CONECTIVIDAD Y PREPARACIÓN
# Script para verificar la conectividad SSH y preparar el despliegue

set -euo pipefail

# Configuración
SERVER_IP="3.137.157.34"
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

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Expandir ruta de la clave SSH
SSH_KEY="${SSH_KEY/#\~/$HOME}"

echo "🚀 VERIFICACIÓN DE CONECTIVIDAD CACTUS DASHBOARD"
echo "================================================"
echo "Servidor: $SERVER_IP"
echo "Usuario: $SSH_USER"
echo "Clave SSH: $SSH_KEY"
echo ""

# 1. Verificar que la clave SSH existe
log "1. Verificando clave SSH..."
if [ ! -f "$SSH_KEY" ]; then
    error "❌ Clave SSH no encontrada: $SSH_KEY"
    echo "   Asegúrate de que la clave esté en la ubicación correcta."
    exit 1
fi

# Verificar permisos de la clave
if [ "$(stat -f %A "$SSH_KEY" 2>/dev/null || stat -c %a "$SSH_KEY" 2>/dev/null)" != "400" ]; then
    warn "⚠️  Permisos de clave SSH no son 400. Corrigiendo..."
    chmod 400 "$SSH_KEY"
fi

success "✅ Clave SSH encontrada y permisos correctos"

# 2. Verificar conectividad de red
log "2. Verificando conectividad de red..."
if ping -c 3 "$SERVER_IP" >/dev/null 2>&1; then
    success "✅ Servidor responde a ping"
else
    warn "⚠️  Servidor no responde a ping (puede estar bloqueado por firewall)"
fi

# 3. Verificar conexión SSH
log "3. Verificando conexión SSH..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "echo 'SSH OK'" >/dev/null 2>&1; then
    success "✅ Conexión SSH exitosa"
else
    error "❌ No se puede conectar por SSH"
    echo "   Verifica:"
    echo "   - La IP del servidor: $SERVER_IP"
    echo "   - La clave SSH: $SSH_KEY"
    echo "   - Los grupos de seguridad de EC2 (puerto 22 abierto)"
    echo "   - Que la instancia EC2 esté ejecutándose"
    exit 1
fi

# 4. Verificar información del servidor
log "4. Obteniendo información del servidor..."
echo "   Sistema operativo:"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "cat /etc/os-release | grep PRETTY_NAME" | sed 's/^/     /'

echo "   Espacio en disco:"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "df -h /" | sed 's/^/     /'

echo "   Memoria disponible:"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "free -h" | sed 's/^/     /'

# 5. Verificar Docker
log "5. Verificando Docker en el servidor..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "docker --version" >/dev/null 2>&1; then
    DOCKER_VERSION=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "docker --version")
    success "✅ Docker instalado: $DOCKER_VERSION"
else
    error "❌ Docker no está instalado"
    echo "   Instala Docker con:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# 6. Verificar Docker Compose
log "6. Verificando Docker Compose..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "docker-compose --version" >/dev/null 2>&1; then
    COMPOSE_VERSION=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "docker-compose --version")
    success "✅ Docker Compose instalado: $COMPOSE_VERSION"
else
    error "❌ Docker Compose no está instalado"
    echo "   Instala Docker Compose con:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# 7. Verificar Git
log "7. Verificando Git..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "git --version" >/dev/null 2>&1; then
    GIT_VERSION=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "git --version")
    success "✅ Git instalado: $GIT_VERSION"
else
    warn "⚠️  Git no está instalado. Instalando..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "sudo apt update && sudo apt install -y git"
    success "✅ Git instalado"
fi

# 8. Verificar puertos disponibles
log "8. Verificando puertos disponibles..."
PORTS_TO_CHECK="3000 8000 5432 6379"
for port in $PORTS_TO_CHECK; do
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "netstat -tuln | grep :$port" >/dev/null 2>&1; then
        warn "⚠️  Puerto $port ya está en uso"
    else
        success "✅ Puerto $port disponible"
    fi
done

echo ""
echo "🎉 VERIFICACIÓN COMPLETADA"
echo "=========================="
success "✅ El servidor está listo para el despliegue"
echo ""
echo "Próximos pasos:"
echo "1. Ejecutar despliegue completo:"
echo "   ./scripts/deploy-automation.sh deploy"
echo ""
echo "2. O ejecutar paso a paso:"
echo "   ./scripts/deploy-automation.sh setup"
echo "   ./scripts/deploy-automation.sh deploy"
echo ""
echo "3. Verificar estado después del despliegue:"
echo "   ./scripts/deploy-automation.sh status"