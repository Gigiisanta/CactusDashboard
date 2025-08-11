#!/bin/bash

# ================================
# 🚀 INICIAR FRONTEND LOCALMENTE
# ================================

set -e

echo "🌵 Iniciando frontend localmente..."

# ===== VERIFICAR NODE Y NPM =====
echo "🔍 Verificando Node.js y npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instalando..."
    brew install node
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Instalando..."
    brew install npm
fi

# ===== NAVEGAR AL DIRECTORIO =====
cd cactus-wealth-frontend

# ===== VERIFICAR DEPENDENCIAS =====
echo "📦 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
else
    echo "✅ Dependencias ya instaladas"
fi

# ===== VERIFICAR NEXT.JS =====
echo "🔍 Verificando Next.js..."
if ! npx next --version &> /dev/null; then
    echo "❌ Next.js no está disponible. Instalando..."
    npm install next@latest
fi

# ===== LIMPIAR PUERTOS =====
echo "🔌 Limpiando puerto 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Puerto 3000 libre"

# ===== INICIAR SERVIDOR =====
echo "🚀 Iniciando servidor de desarrollo..."
echo "📊 URLs disponibles:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:8000"
echo ""

# Iniciar el servidor
npm run dev

