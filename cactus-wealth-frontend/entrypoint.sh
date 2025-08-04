#!/bin/sh

# Script de entrypoint con reintentos automáticos para el frontend
set -e

echo "🚀 Iniciando frontend de CactusDashboard..."

# Función para verificar si el servidor está funcionando
check_server() {
    curl -f http://localhost:3000 >/dev/null 2>&1
}

# Función para iniciar el servidor con reintentos
start_server() {
    local attempt=1
    local max_attempts=5
    
    while [ $attempt -le $max_attempts ]; do
        echo "📡 Intento $attempt de $max_attempts: Iniciando servidor Next.js..."
        
        # Iniciar el servidor en segundo plano
        node server.js &
        SERVER_PID=$!
        
        # Esperar un momento para que el servidor se inicie
        sleep 10
        
        # Verificar si el servidor está funcionando
        if check_server; then
            echo "✅ Servidor iniciado correctamente en el puerto 3000"
            # Esperar a que el proceso termine
            wait $SERVER_PID
            exit_code=$?
            
            if [ $exit_code -eq 0 ]; then
                echo "✅ Servidor terminó normalmente"
                exit 0
            else
                echo "❌ Servidor terminó con código de error: $exit_code"
            fi
        else
            echo "❌ Servidor no responde en el puerto 3000"
            # Matar el proceso si aún está corriendo
            if kill -0 $SERVER_PID 2>/dev/null; then
                kill $SERVER_PID
                wait $SERVER_PID 2>/dev/null || true
            fi
        fi
        
        echo "⚠️ Reintentando en 5 segundos..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "💥 No se pudo iniciar el servidor después de $max_attempts intentos"
    exit 1
}

# Verificar que el archivo server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js no encontrado"
    exit 1
fi

# Mostrar información del entorno
echo "📋 Información del entorno:"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-not set}"
echo "   HOSTNAME: ${HOSTNAME:-not set}"
echo "   NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-not set}"

# Iniciar el servidor con reintentos
start_server