#!/bin/bash

# Script para limpiar puertos y asegurar que el frontend funcione en localhost:3000
# Uso: ./cleanup-ports.sh [puerto]

PORT=${1:-3000}
FRONTEND_DIR="/Users/prueba/Desktop/CactusDashboard/cactus-wealth-frontend"

echo "🧹 Limpiando puerto $PORT..."

# Función para limpiar un puerto específico
cleanup_port() {
    local port=$1
    echo "Verificando puerto $port..."
    
    # Buscar procesos en el puerto
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "⚠️  Puerto $port ocupado por proceso(s): $pids"
        echo "🔄 Terminando proceso(s)..."
        
        # Intentar terminar gracefully primero
        for pid in $pids; do
            echo "Terminando proceso $pid..."
            kill $pid 2>/dev/null
        done
        
        # Esperar un momento
        sleep 2
        
        # Verificar si aún están corriendo y forzar terminación
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            echo "🔨 Forzando terminación de procesos restantes..."
            for pid in $remaining_pids; do
                kill -9 $pid 2>/dev/null
            done
        fi
        
        echo "✅ Puerto $port liberado"
    else
        echo "✅ Puerto $port ya está libre"
    fi
}

# Limpiar puertos comunes del desarrollo
cleanup_port 3000
cleanup_port 3001
cleanup_port 8000
cleanup_port 8080

# Verificar que el puerto objetivo esté libre
echo ""
echo "🔍 Verificación final del puerto $PORT..."
if lsof -ti:$PORT >/dev/null 2>&1; then
    echo "❌ Error: Puerto $PORT aún está ocupado"
    exit 1
else
    echo "✅ Puerto $PORT está libre y listo para usar"
fi

echo ""
echo "🚀 Puertos limpiados exitosamente. Listo para iniciar el servidor en puerto $PORT"