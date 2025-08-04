#!/bin/bash

# Script para habilitar la optimización de CSS en Cactus Wealth Frontend
# Uso: ./scripts/enable-css-optimization.sh

set -e

echo "🚀 Habilitando optimización de CSS para Cactus Wealth Frontend"
echo "================================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "next.config.js" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio cactus-wealth-frontend"
    exit 1
fi

# Verificar si hay una alternativa estable a critters
echo "📋 Verificando alternativas a critters..."

# Opción 1: @danielroe/beasties (fork mantenido de critters)
if npm list @danielroe/beasties >/dev/null 2>&1; then
    echo "✅ @danielroe/beasties está instalado"
    BEASTIES_AVAILABLE=true
else
    echo "⚠️  @danielroe/beasties no está instalado"
    echo "   Para instalarlo: npm install @danielroe/beasties"
    BEASTIES_AVAILABLE=false
fi

# Opción 2: Verificar si Next.js tiene optimización CSS nativa
NEXT_VERSION=$(node -p "require('./package.json').dependencies.next")
echo "📦 Versión de Next.js: $NEXT_VERSION"

# Verificar si hay variables de entorno configuradas
if [ -f ".env.local" ]; then
    echo "✅ Archivo .env.local encontrado"
else
    echo "⚠️  Archivo .env.local no encontrado"
fi

echo ""
echo "🔧 Configurando optimización de CSS..."

# Crear o actualizar .env.local
if [ ! -f ".env.local" ]; then
    echo "📝 Creando archivo .env.local..."
    touch .env.local
fi

# Agregar configuración de optimización CSS
if ! grep -q "ENABLE_CSS_OPTIMIZATION" .env.local; then
    echo "ENABLE_CSS_OPTIMIZATION=true" >> .env.local
    echo "✅ Agregada variable ENABLE_CSS_OPTIMIZATION=true"
else
    echo "✅ Variable ENABLE_CSS_OPTIMIZATION ya existe"
fi

echo ""
echo "🧪 Probando build con optimización habilitada..."

# Hacer backup del package.json actual
cp package.json package.json.backup

# Si beasties está disponible, reemplazar critters
if [ "$BEASTIES_AVAILABLE" = true ]; then
    echo "🔄 Reemplazando critters con @danielroe/beasties..."
    
    # Remover critters
    npm uninstall critters
    
    # Instalar beasties
    npm install @danielroe/beasties
    
    echo "✅ @danielroe/beasties instalado como reemplazo de critters"
fi

# Probar build
echo "🔨 Ejecutando build de prueba..."
if npm run build; then
    echo ""
    echo "✅ ¡Optimización de CSS habilitada exitosamente!"
    echo ""
    echo "📋 Resumen de cambios:"
    echo "   • ENABLE_CSS_OPTIMIZATION=true en .env.local"
    echo "   • optimizeCss habilitado en next.config.js"
    if [ "$BEASTIES_AVAILABLE" = true ]; then
        echo "   • critters reemplazado con @danielroe/beasties"
    fi
    echo ""
    echo "🚀 Para deshabilitar: ENABLE_CSS_OPTIMIZATION=false en .env.local"
    echo "🔄 Para revertir: ./scripts/disable-css-optimization.sh"
else
    echo ""
    echo "❌ Error en el build. Revertiendo cambios..."
    
    # Restaurar package.json
    mv package.json.backup package.json
    
    # Remover variable de entorno
    sed -i '' '/ENABLE_CSS_OPTIMIZATION/d' .env.local
    
    echo "✅ Cambios revertidos"
    echo ""
    echo "💡 Sugerencias:"
    echo "   • Verificar compatibilidad de dependencias"
    echo "   • Esperar a una versión más estable de Next.js"
    echo "   • Considerar usar @danielroe/beasties manualmente"
fi

echo ""
echo "📚 Documentación:"
echo "   • TROUBLESHOOTING.md - Guía de solución de problemas"
echo "   • README.md - Documentación del proyecto" 