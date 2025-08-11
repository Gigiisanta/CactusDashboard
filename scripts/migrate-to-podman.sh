#!/bin/bash

# ================================
# 🐳 MIGRACIÓN COMPLETA A PODMAN
# ================================

set -e

echo "🌵 Iniciando migración completa a Podman..."

# ===== VERIFICAR PODMAN =====
echo "🔍 Verificando Podman..."
if ! command -v podman &> /dev/null; then
    echo "❌ Podman no está instalado. Instalando..."
    brew install podman
fi

if ! command -v podman-compose &> /dev/null; then
    echo "❌ podman-compose no está instalado. Instalando..."
    pip3 install podman-compose
fi

# ===== CONFIGURAR MÁQUINA PODMAN =====
echo "🔧 Configurando máquina Podman..."
if ! podman machine list | grep -q "cactus-dashboard"; then
    echo "📦 Creando máquina Podman..."
    podman machine init --cpus 4 --memory 8192 --disk-size 50 cactus-dashboard
fi

if ! podman machine list | grep -q "cactus-dashboard.*Currently running"; then
    echo "🚀 Iniciando máquina Podman..."
    podman machine start cactus-dashboard
fi

# ===== LIMPIAR RECURSOS EXISTENTES =====
echo "🧹 Limpiando recursos existentes..."
podman-compose -f docker-compose.yml down 2>/dev/null || true
podman system prune -f 2>/dev/null || true

# ===== CONSTRUIR IMÁGENES =====
echo "🔨 Construyendo imágenes..."
echo "📦 Construyendo backend..."
podman-compose -f docker-compose.yml build backend

echo "📦 Construyendo frontend..."
podman-compose -f docker-compose.yml build frontend

# ===== INICIAR SERVICIOS =====
echo "🚀 Iniciando servicios..."
podman-compose -f docker-compose.yml up -d

# ===== VERIFICAR ESTADO =====
echo "⏳ Esperando que los servicios estén listos..."
sleep 30

echo "🔍 Verificando estado de servicios..."
podman-compose -f docker-compose.yml ps

echo "🏥 Verificando salud de servicios..."
if curl -s http://localhost:8000/api/v1/health > /dev/null; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ Backend no responde"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend funcionando correctamente"
else
    echo "❌ Frontend no responde"
fi

# ===== MOSTRAR INFORMACIÓN =====
echo ""
echo "🎉 Migración a Podman completada!"
echo ""
echo "📊 Estado del sistema:"
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Health: http://localhost:8000/api/v1/health"
echo ""
echo "🔧 Comandos útiles:"
echo "  task status:local    - Ver estado de servicios"
echo "  task logs            - Ver logs en vivo"
echo "  task dev:stop        - Detener servicios"
echo "  task dev:restart     - Reiniciar servicios"
echo ""

