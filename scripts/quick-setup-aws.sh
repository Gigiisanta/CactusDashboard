#!/bin/bash

# 🚀 Configuración Rápida para AWS EC2 - Cactus Dashboard
# Este script automatiza la configuración inicial en una instancia EC2 nueva

set -euo pipefail

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Verificar que estamos en Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    error "Este script está diseñado para Ubuntu. Detectado: $(lsb_release -d | cut -f2)"
fi

log "🚀 Iniciando configuración rápida de Cactus Dashboard en AWS EC2"
log "Instancia: $(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'No detectada')"

# 1. Actualizar sistema
log "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Git
log "📥 Instalando Git..."
sudo apt install -y git curl wget

# 3. Clonar repositorio
log "📂 Clonando repositorio..."
cd /home/ubuntu
if [ ! -d "CactusDashboard" ]; then
    git clone https://github.com/tu-usuario/CactusDashboard.git
    cd CactusDashboard
else
    cd CactusDashboard
    git pull origin main
fi

# 4. Hacer ejecutable el script de despliegue
chmod +x scripts/deploy-aws.sh

# 5. Ejecutar configuración inicial
log "⚙️ Ejecutando configuración inicial..."
./scripts/deploy-aws.sh setup

# 6. Desplegar aplicación
log "🚀 Desplegando aplicación..."
./scripts/deploy-aws.sh deploy

# 7. Mostrar información final
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🎉 DESPLIEGUE COMPLETADO                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Cactus Dashboard está funcionando!${NC}"
echo ""
echo "📍 URLs de acceso:"
echo "   • Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "   • Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "   • Documentación API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/docs"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver estado: ./scripts/deploy-aws.sh status"
echo "   • Ver logs: ./scripts/deploy-aws.sh logs"
echo "   • Crear backup: ./scripts/deploy-aws.sh backup"
echo "   • Configurar SSL: ./scripts/deploy-aws.sh ssl tu-dominio.com"
echo ""
echo "📚 Para más información, consulta README_DEPLOY_AWS.md"
echo ""
echo -e "${YELLOW}⚠️  Próximos pasos recomendados:${NC}"
echo "   1. Configurar un dominio y SSL: ./scripts/deploy-aws.sh ssl tu-dominio.com"
echo "   2. Configurar alertas de monitoreo"
echo "   3. Programar backups automáticos"
echo "   4. Revisar configuración de seguridad"