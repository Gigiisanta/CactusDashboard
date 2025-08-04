#!/bin/bash

# Script para deshabilitar la optimización de CSS en Cactus Wealth Frontend
# Uso: ./scripts/disable-css-optimization.sh

set -e

echo "🛑 Deshabilitando optimización de CSS para Cactus Wealth Frontend"
echo "================================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "next.config.js" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio cactus-wealth-frontend"
    exit 1
fi

echo "🔧 Deshabilitando optimización de CSS..."

# Actualizar .env.local
if [ -f ".env.local" ]; then
    # Remover variable si existe
    if grep -q "ENABLE_CSS_OPTIMIZATION" .env.local; then
        sed -i '' '/ENABLE_CSS_OPTIMIZATION/d' .env.local
        echo "✅ Variable ENABLE_CSS_OPTIMIZATION removida de .env.local"
    else
        echo "✅ Variable ENABLE_CSS_OPTIMIZATION no encontrada"
    fi
    
    # Agregar variable deshabilitada
    echo "ENABLE_CSS_OPTIMIZATION=false" >> .env.local
    echo "✅ Variable ENABLE_CSS_OPTIMIZATION=false agregada"
else
    echo "📝 Creando archivo .env.local..."
    echo "ENABLE_CSS_OPTIMIZATION=false" > .env.local
    echo "✅ Archivo .env.local creado con optimización deshabilitada"
fi

echo ""
echo "🧪 Probando build con optimización deshabilitada..."

# Probar build
if npm run build; then
    echo ""
    echo "✅ ¡Optimización de CSS deshabilitada exitosamente!"
    echo ""
    echo "📋 Resumen de cambios:"
    echo "   • ENABLE_CSS_OPTIMIZATION=false en .env.local"
    echo "   • optimizeCss deshabilitado en next.config.js"
    echo ""
    echo "🚀 Para habilitar nuevamente: ./scripts/enable-css-optimization.sh"
    echo "📚 Para más información: TROUBLESHOOTING.md"
else
    echo ""
    echo "❌ Error en el build. Verificar configuración manualmente."
    echo "💡 Revisar TROUBLESHOOTING.md para más ayuda"
fi 