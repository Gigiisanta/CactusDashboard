#!/bin/bash

# Comprehensive System Diagnosis Script
# Checks Docker, ports, services, and provides solutions

echo "🔍 Diagnóstico completo del sistema Cactus Dashboard"
echo "=================================================="

# 1. Docker Status
echo ""
echo "1️⃣ Verificando Docker..."
if docker info >/dev/null 2>&1; then
    echo "   ✅ Docker daemon corriendo"
    DOCKER_VERSION=$(docker --version)
    echo "   📦 $DOCKER_VERSION"
else
    echo "   ❌ Docker daemon no disponible"
    echo "   💡 Solución: ./scripts/docker-healthcheck.sh"
    DOCKER_OK=false
fi

# 2. Socket Check
echo ""
echo "2️⃣ Verificando socket Docker..."
if [ -L "/var/run/docker.sock" ]; then
    echo "   ✅ Socket symlink existe"
    SOCKET_TARGET=$(readlink -f /var/run/docker.sock)
    echo "   🔗 Apunta a: $SOCKET_TARGET"
else
    echo "   ❌ Socket symlink faltante"
    echo "   💡 Solución: sudo ln -sf ~/.docker/run/docker.sock /var/run/docker.sock"
fi

# 3. Port Check
echo ""
echo "3️⃣ Verificando puertos de desarrollo..."
PORTS=(3000 8000 5432 6379)
PORT_ISSUES=false

for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        # Check if the process is a Docker container by checking if Docker is using this port
        if docker ps --format "{{.Ports}}" | grep -q ":$port->" 2>/dev/null; then
            echo "   ✅ Puerto $port ocupado por contenedor Docker (normal)"
        else
            echo "   ⚠️  Puerto $port ocupado por proceso externo PID $PID"
            PORT_ISSUES=true
        fi
    else
        echo "   ✅ Puerto $port libre"
    fi
done

if [ "$PORT_ISSUES" = true ]; then
    echo "   💡 Solución: ./scripts/cleanup-ports.sh"
fi

# 4. Container Status
echo ""
echo "4️⃣ Verificando contenedores..."
if docker ps >/dev/null 2>&1; then
    CONTAINER_COUNT=$(docker ps --format "table {{.Names}}" | wc -l)
    if [ "$CONTAINER_COUNT" -gt 1 ]; then
        echo "   ✅ $((CONTAINER_COUNT - 1)) contenedores corriendo"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -5
    else
        echo "   ⚠️  No hay contenedores corriendo"
        echo "   💡 Solución: task dev"
    fi
else
    echo "   ❌ No se pueden listar contenedores"
fi

# 5. Service Health
echo ""
echo "5️⃣ Verificando salud de servicios..."

# Backend
if curl -s http://localhost:8000/api/v1/health >/dev/null 2>&1; then
    echo "   ✅ Backend API: http://localhost:8000"
else
    echo "   ❌ Backend API: No responde"
fi

# Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ Frontend: http://localhost:3000"
else
    echo "   ❌ Frontend: No responde"
fi

# Database
if nc -z localhost 5432 2>/dev/null; then
    echo "   ✅ PostgreSQL: localhost:5432"
else
    echo "   ❌ PostgreSQL: No accesible"
fi

# Redis
if nc -z localhost 6379 2>/dev/null; then
    echo "   ✅ Redis: localhost:6379"
else
    echo "   ❌ Redis: No accesible"
fi

# 6. Docker Compose
echo ""
echo "6️⃣ Verificando Docker Compose..."
if docker-compose --version >/dev/null 2>&1; then
    echo "   ✅ Docker Compose disponible"
    COMPOSE_VERSION=$(docker-compose --version)
    echo "   📦 $COMPOSE_VERSION"
else
    echo "   ❌ Docker Compose no disponible"
fi

# 7. Autostart Configuration
echo ""
echo "7️⃣ Verificando configuración de autostart..."
AUTOSTART=$(defaults read com.docker.docker "StartDockerOnLogin" 2>/dev/null || echo "false")
if [ "$AUTOSTART" = "1" ]; then
    echo "   ✅ Docker Desktop configurado para autostart"
else
    echo "   ⚠️  Docker Desktop no configurado para autostart"
    echo "   💡 Solución: defaults write com.docker.docker 'StartDockerOnLogin' -bool true"
fi

# Summary
echo ""
echo "=================================================="
echo "📋 Resumen del diagnóstico:"

if [ "$DOCKER_OK" = false ]; then
    echo "❌ Docker no está funcionando"
    echo "💡 Ejecutar: ./scripts/docker-healthcheck.sh"
elif [ "$PORT_ISSUES" = true ]; then
    echo "⚠️  Hay puertos ocupados"
    echo "💡 Ejecutar: ./scripts/cleanup-ports.sh"
else
    echo "✅ Sistema funcionando correctamente"
fi

echo ""
echo "🔧 Scripts disponibles:"
echo "   • ./scripts/docker-healthcheck.sh - Health check básico"
echo "   • ./scripts/cleanup-ports.sh - Limpiar puertos"
echo "   • ./scripts/verify-docker-setup.sh - Verificación completa"
echo "   • ./scripts/diagnose-system.sh - Diagnóstico completo (este script)"

echo ""
echo "🚀 Comandos útiles:"
echo "   • task dev - Iniciar desarrollo"
echo "   • task dev:stop - Detener desarrollo"
echo "   • task status - Estado del sistema" 