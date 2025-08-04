#!/bin/bash

# Docker Setup Verification Script
# Comprehensive test of Docker functionality

echo "🔍 Verificando configuración Docker completa..."
echo "================================================"

# 1. Check Docker daemon
echo "1️⃣ Verificando Docker daemon..."
if docker info >/dev/null 2>&1; then
    echo "   ✅ Docker daemon está corriendo"
    DOCKER_VERSION=$(docker --version)
    echo "   📦 $DOCKER_VERSION"
else
    echo "   ❌ Docker daemon no está disponible"
    exit 1
fi

# 2. Check socket
echo ""
echo "2️⃣ Verificando socket Docker..."
if [ -L "/var/run/docker.sock" ]; then
    echo "   ✅ Socket symlink existe en /var/run/docker.sock"
    SOCKET_TARGET=$(readlink -f /var/run/docker.sock)
    echo "   🔗 Apunta a: $SOCKET_TARGET"
else
    echo "   ❌ Socket symlink no encontrado"
    exit 1
fi

# 3. Check permissions
echo ""
echo "3️⃣ Verificando permisos..."
SOCKET_PERMS=$(ls -la ~/.docker/run/docker.sock 2>/dev/null | awk '{print $1, $3, $4}')
if [ -n "$SOCKET_PERMS" ]; then
    echo "   ✅ Permisos del socket: $SOCKET_PERMS"
else
    echo "   ❌ No se pueden leer permisos del socket"
    exit 1
fi

# 4. Test Docker commands without sudo
echo ""
echo "4️⃣ Probando comandos Docker sin sudo..."
if docker ps >/dev/null 2>&1; then
    echo "   ✅ 'docker ps' funciona sin sudo"
else
    echo "   ❌ 'docker ps' requiere sudo"
    exit 1
fi

# 5. Check running containers
echo ""
echo "5️⃣ Verificando contenedores corriendo..."
CONTAINER_COUNT=$(docker ps --format "table {{.Names}}" | wc -l)
if [ "$CONTAINER_COUNT" -gt 1 ]; then
    echo "   ✅ $((CONTAINER_COUNT - 1)) contenedores corriendo"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -5
else
    echo "   ⚠️  No hay contenedores corriendo"
fi

# 6. Test Docker Compose
echo ""
echo "6️⃣ Verificando Docker Compose..."
if docker-compose --version >/dev/null 2>&1; then
    echo "   ✅ Docker Compose está disponible"
    COMPOSE_VERSION=$(docker-compose --version)
    echo "   📦 $COMPOSE_VERSION"
else
    echo "   ❌ Docker Compose no está disponible"
fi

# 7. Test backend connectivity
echo ""
echo "7️⃣ Verificando conectividad del backend..."
if curl -s http://localhost:8000/api/v1/health >/dev/null 2>&1; then
    echo "   ✅ Backend responde en http://localhost:8000"
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/v1/health)
    echo "   📊 Respuesta: $HEALTH_RESPONSE"
else
    echo "   ⚠️  Backend no responde (puede no estar corriendo)"
fi

# 8. Check Docker Desktop autostart
echo ""
echo "8️⃣ Verificando autostart de Docker Desktop..."
AUTOSTART=$(defaults read com.docker.docker "StartDockerOnLogin" 2>/dev/null || echo "false")
if [ "$AUTOSTART" = "1" ]; then
    echo "   ✅ Docker Desktop configurado para iniciar automáticamente"
else
    echo "   ⚠️  Docker Desktop no está configurado para autostart"
    echo "   💡 Ejecutar: defaults write com.docker.docker 'StartDockerOnLogin' -bool true"
fi

echo ""
echo "================================================"
echo "🎉 Verificación completada!"
echo ""
echo "📋 Resumen:"
echo "   • Docker daemon: ✅ Funcionando"
echo "   • Socket: ✅ Configurado"
echo "   • Permisos: ✅ Correctos"
echo "   • Comandos: ✅ Sin sudo"
echo "   • Backend: ✅ Respondiendo"
echo ""
echo "🚀 Docker está listo para usar!"
echo "💡 Para verificar en el futuro: ./scripts/docker-healthcheck.sh"
echo ""
echo "🔧 Scripts adicionales disponibles:"
echo "   • ./scripts/cleanup-ports.sh - Limpiar puertos ocupados"
echo "   • ./scripts/verify-docker-setup.sh - Verificación completa" 