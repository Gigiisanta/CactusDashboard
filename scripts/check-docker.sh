#!/bin/bash

# Script para verificar y asegurar que Docker esté ejecutándose
# Uso: ./scripts/check-docker.sh

echo "🔍 Verificando estado de Docker..."

# Función para verificar si Docker está ejecutándose
check_docker() {
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker está ejecutándose correctamente"
        return 0
    else
        echo "❌ Docker no está ejecutándose"
        return 1
    fi
}

# Función para iniciar Docker Desktop
start_docker() {
    echo "🚀 Iniciando Docker Desktop..."
    open -a Docker
    
    # Esperar hasta que Docker esté listo (máximo 60 segundos)
    echo "⏳ Esperando que Docker esté listo..."
    for i in {1..60}; do
        if check_docker; then
            echo "✅ Docker iniciado exitosamente"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo "❌ Timeout: Docker no se pudo iniciar en 60 segundos"
    return 1
}

# Verificar Docker
if ! check_docker; then
    echo "🔄 Intentando iniciar Docker..."
    if start_docker; then
        echo "🎉 Docker está listo para usar"
    else
        echo "💥 Error: No se pudo iniciar Docker"
        echo "💡 Sugerencias:"
        echo "   1. Verifica que Docker Desktop esté instalado"
        echo "   2. Abre Docker Desktop manualmente desde Applications"
        echo "   3. Reinicia tu Mac si el problema persiste"
        exit 1
    fi
fi

echo "🎯 Docker verificado y listo" 