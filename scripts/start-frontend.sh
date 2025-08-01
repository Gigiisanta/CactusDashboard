#!/bin/bash

# Script para iniciar el frontend siempre en localhost:3000
# Este script asegura que el puerto esté libre y configura las variables correctamente

set -e

FRONTEND_DIR="/Users/prueba/Desktop/CactusDashboard/cactus-wealth-frontend"
TARGET_PORT=3000

echo "🚀 Iniciando Cactus Wealth Frontend en localhost:$TARGET_PORT"
echo "📁 Directorio: $FRONTEND_DIR"

# Cambiar al directorio del frontend
cd "$FRONTEND_DIR"

# Ejecutar limpieza de puertos
echo "🧹 Limpiando puertos..."
../scripts/cleanup-ports.sh $TARGET_PORT

# Verificar que las variables de entorno estén configuradas
echo "🔍 Verificando configuración..."

if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local no encontrado"
    exit 1
fi

# Verificar variables críticas
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env.local | cut -d'=' -f2 | tr -d '"' || echo "")
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env.local | cut -d'=' -f2 | tr -d '"' || echo "")
NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2 | tr -d '"' || echo "")

if [ -z "$GOOGLE_CLIENT_ID" ] || [ "$GOOGLE_CLIENT_ID" = "TU_NUEVO_GOOGLE_CLIENT_ID_AQUI" ]; then
    echo "❌ Error: GOOGLE_CLIENT_ID no configurado correctamente"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ] || [ "$GOOGLE_CLIENT_SECRET" = "TU_NUEVO_GOOGLE_CLIENT_SECRET_AQUI" ]; then
    echo "❌ Error: GOOGLE_CLIENT_SECRET no configurado correctamente"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ Error: NEXTAUTH_SECRET no configurado"
    exit 1
fi

echo "✅ Configuración verificada"
echo "✅ Google Client ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "✅ Google Client Secret: ${GOOGLE_CLIENT_SECRET:0:10}..."
echo "✅ NextAuth Secret: Configurado"

# Asegurar que las variables de entorno estén disponibles
export PORT=$TARGET_PORT
export NEXT_PUBLIC_FRONTEND_URL="http://localhost:$TARGET_PORT"

echo ""
echo "🌐 URLs disponibles:"
echo "   - Frontend: http://localhost:$TARGET_PORT"
echo "   - Debug: http://localhost:$TARGET_PORT/debug"
echo "   - Login: http://localhost:$TARGET_PORT/login"
echo "   - Dashboard: http://localhost:$TARGET_PORT/dashboard"
echo ""

# Iniciar el servidor
echo "🚀 Iniciando servidor Next.js..."
npm run dev

echo "✅ Servidor iniciado exitosamente en puerto $TARGET_PORT"