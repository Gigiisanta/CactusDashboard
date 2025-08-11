#!/bin/bash

# ================================
# 🚀 CONFIGURACIÓN DE PODMAN PARA CACTUSDASHBOARD
# ================================

set -e

echo "🌵 Configurando Podman para CactusDashboard..."

# Verificar si Homebrew está instalado
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew no está instalado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Instalar Podman
echo "📦 Instalando Podman..."
brew install podman

# Instalar podman-compose
echo "📦 Instalando podman-compose..."
pip3 install podman-compose

# Crear máquina Podman con recursos optimizados
echo "🔧 Configurando máquina Podman..."
podman machine init --cpus 4 --memory 8192 --disk-size 50 cactus-dashboard

# Iniciar máquina
echo "🚀 Iniciando máquina Podman..."
podman machine start cactus-dashboard

echo "🔗 Skipping shell alias injection; using explicit podman/podman-compose commands."
echo "📄 Exporta manualmente si lo deseas: PODMAN_MACHINE_NAME=cactus-dashboard, COMPOSE_DOCKER_CLI_BUILD=1, DOCKER_BUILDKIT=1"

# Verificar instalación
echo "✅ Verificando instalación..."
podman --version
podman-compose --version

echo "🎉 Podman configurado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Reinicia tu terminal o ejecuta: source ~/.zshrc"
echo "2. Ejecuta: task podman:verify"
echo "3. Ejecuta: task dev para iniciar el desarrollo"
echo ""
echo "🔧 Comandos útiles:"
echo "  task podman:status    - Ver estado de la máquina"
echo "  task podman:stop      - Detener máquina"
echo "  task podman:start     - Iniciar máquina"
echo "  task podman:cleanup   - Limpiar recursos"

