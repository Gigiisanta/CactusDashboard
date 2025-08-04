#!/bin/bash

# Script de diagnóstico completo para Docker
# Uso: ./scripts/diagnose-docker.sh

echo "🔍 DIAGNÓSTICO COMPLETO DE DOCKER"
echo "═══════════════════════════════════"
echo ""

# 1. Verificar instalación de Docker
echo "📋 1. VERIFICACIÓN DE INSTALACIÓN"
echo "─────────────────────────────────"
if command -v docker &> /dev/null; then
    docker_version=$(docker --version)
    echo "✅ Docker CLI instalado: $docker_version"
else
    echo "❌ Docker CLI no está instalado"
    echo "💡 Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if [ -d "/Applications/Docker.app" ]; then
    echo "✅ Docker Desktop instalado en /Applications/Docker.app"
else
    echo "❌ Docker Desktop no encontrado en /Applications/Docker.app"
fi

echo ""

# 2. Verificar estado del daemon
echo "🐳 2. ESTADO DEL DAEMON DE DOCKER"
echo "─────────────────────────────────"
if docker info >/dev/null 2>&1; then
    echo "✅ Docker daemon está ejecutándose"
    
    # Obtener información del daemon
    docker_info=$(docker info 2>/dev/null | grep -E "(Server Version|Operating System|Kernel Version|Total Memory)" | head -4)
    echo "📊 Información del daemon:"
    echo "$docker_info" | sed 's/^/   /'
else
    echo "❌ Docker daemon no está ejecutándose"
    echo "🔄 Intentando iniciar Docker Desktop..."
    open -a Docker
    
    # Esperar hasta que Docker esté listo
    echo "⏳ Esperando que Docker esté listo..."
    for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
            echo "✅ Docker iniciado exitosamente"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Timeout: Docker no se pudo iniciar en 30 segundos"
        echo "💡 Abre Docker Desktop manualmente desde Applications"
    fi
fi

echo ""

# 3. Verificar configuración de inicio automático
echo "🚀 3. CONFIGURACIÓN DE INICIO AUTOMÁTICO"
echo "────────────────────────────────────────"
login_items=$(osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null || echo "")

if echo "$login_items" | grep -q "Docker"; then
    echo "✅ Docker configurado para inicio automático"
    echo "📋 Elementos de inicio actuales:"
    echo "$login_items" | sed 's/^/   /'
else
    echo "❌ Docker NO está configurado para inicio automático"
    echo "🔧 Ejecuta: ./scripts/setup-docker-autostart.sh"
fi

echo ""

# 4. Verificar contenedores y recursos
echo "📊 4. ESTADO DE CONTENEDORES Y RECURSOS"
echo "────────────────────────────────────────"
if docker info >/dev/null 2>&1; then
    echo "📦 Contenedores en ejecución:"
    running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No hay contenedores ejecutándose")
    echo "$running_containers" | sed 's/^/   /'
    
    echo ""
    echo "💾 Uso de recursos:"
    docker_stats=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "No hay contenedores ejecutándose")
    echo "$docker_stats" | sed 's/^/   /'
else
    echo "❌ No se puede verificar: Docker no está ejecutándose"
fi

echo ""

# 5. Verificar red y puertos
echo "🌐 5. CONFIGURACIÓN DE RED"
echo "──────────────────────────"
if docker info >/dev/null 2>&1; then
    echo "🔌 Puertos en uso por Docker:"
    docker_ports=$(docker ps --format "{{.Ports}}" 2>/dev/null | grep -o '[0-9]*->[0-9]*' || echo "No hay puertos mapeados")
    echo "$docker_ports" | sed 's/^/   /'
    
    echo ""
    echo "🌐 Redes de Docker:"
    docker_networks=$(docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}" 2>/dev/null || echo "No hay redes disponibles")
    echo "$docker_networks" | sed 's/^/   /'
else
    echo "❌ No se puede verificar: Docker no está ejecutándose"
fi

echo ""

# 6. Verificar permisos y configuración
echo "🔐 6. PERMISOS Y CONFIGURACIÓN"
echo "──────────────────────────────"
if [ -S "/Users/$(whoami)/.docker/run/docker.sock" ]; then
    echo "✅ Socket de Docker encontrado"
    socket_perms=$(ls -la /Users/$(whoami)/.docker/run/docker.sock 2>/dev/null || echo "No se puede verificar")
    echo "   $socket_perms"
else
    echo "❌ Socket de Docker no encontrado"
fi

echo ""

# 7. Recomendaciones
echo "💡 7. RECOMENDACIONES"
echo "─────────────────────"
if ! echo "$login_items" | grep -q "Docker"; then
    echo "🔧 Configurar inicio automático:"
    echo "   ./scripts/setup-docker-autostart.sh"
fi

if ! docker info >/dev/null 2>&1; then
    echo "🚀 Iniciar Docker Desktop:"
    echo "   open -a Docker"
fi

echo "🔍 Verificar Docker en cualquier momento:"
echo "   ./scripts/check-docker.sh"

echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO"
echo "═══════════════════════════" 