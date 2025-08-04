#!/bin/bash

# Script para configurar Docker Desktop para inicio automático
# Uso: ./scripts/setup-docker-autostart.sh

echo "🐳 Configurando Docker Desktop para inicio automático..."

# Verificar si Docker Desktop está instalado
if [ ! -d "/Applications/Docker.app" ]; then
    echo "❌ Docker Desktop no está instalado en /Applications/Docker.app"
    echo "💡 Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker Desktop encontrado en /Applications/Docker.app"

# Verificar si ya está configurado para inicio automático
current_login_items=$(osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null || echo "")

if echo "$current_login_items" | grep -q "Docker"; then
    echo "✅ Docker ya está configurado para inicio automático"
    echo "📋 Elementos de inicio actuales:"
    echo "$current_login_items"
else
    echo "🔧 Configurando Docker para inicio automático..."
    
    # Agregar Docker a los elementos de inicio
    osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Docker.app", hidden:false}' > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker configurado exitosamente para inicio automático"
        
        # Verificar que se agregó correctamente
        updated_login_items=$(osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null || echo "")
        if echo "$updated_login_items" | grep -q "Docker"; then
            echo "✅ Verificación exitosa: Docker está en la lista de inicio automático"
        else
            echo "⚠️ Advertencia: No se pudo verificar la configuración automáticamente"
        fi
    else
        echo "❌ Error al configurar Docker para inicio automático"
        echo "💡 Puedes configurarlo manualmente:"
        echo "   1. Ve a System Preferences > Users & Groups"
        echo "   2. Selecciona tu usuario"
        echo "   3. Ve a Login Items"
        echo "   4. Haz clic en '+' y agrega Docker.app"
    fi
fi

echo ""
echo "🎯 Configuración completada"
echo "💡 Docker se iniciará automáticamente la próxima vez que reinicies tu Mac"
echo "🔧 Para cambiar esta configuración: System Preferences > Users & Groups > Login Items" 