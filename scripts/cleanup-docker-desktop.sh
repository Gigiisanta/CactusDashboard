#!/bin/bash

# ================================
# 🧹 LIMPIEZA DE DOCKER DESKTOP
# ================================

set -e

echo "🧹 Limpiando Docker Desktop para migrar a Podman..."

# Detener Docker Desktop
echo "⏹️ Deteniendo Docker Desktop..."
osascript -e 'quit app "Docker Desktop"' 2>/dev/null || echo "✅ Docker Desktop ya detenido"

# Esperar a que se detenga completamente
sleep 5

# Limpiar contenedores de Docker Desktop
echo "🗑️ Limpiando contenedores..."
docker system prune -a -f 2>/dev/null || echo "✅ No hay contenedores que limpiar"

# Limpiar volúmenes
echo "🗑️ Limpiando volúmenes..."
docker volume prune -f 2>/dev/null || echo "✅ No hay volúmenes que limpiar"

# Limpiar redes
echo "🗑️ Limpiando redes..."
docker network prune -f 2>/dev/null || echo "✅ No hay redes que limpiar"

# Limpiar imágenes
echo "🗑️ Limpiando imágenes..."
docker image prune -a -f 2>/dev/null || echo "✅ No hay imágenes que limpiar"

# Limpiar build cache
echo "🗑️ Limpiando build cache..."
docker builder prune -a -f 2>/dev/null || echo "✅ No hay build cache que limpiar"

# Mostrar espacio liberado
echo "💾 Espacio en disco después de la limpieza:"
df -h /Users

# Desinstalar Docker Desktop (opcional)
read -p "¿Deseas desinstalar Docker Desktop? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Desinstalando Docker Desktop..."
    brew uninstall --cask docker 2>/dev/null || echo "✅ Docker Desktop no instalado via Homebrew"
    
    # Eliminar archivos de configuración
    echo "🗑️ Eliminando archivos de configuración..."
    rm -rf ~/Library/Group\ Containers/group.com.docker 2>/dev/null || echo "✅ Archivos de configuración ya eliminados"
    rm -rf ~/Library/Containers/com.docker.docker 2>/dev/null || echo "✅ Contenedores ya eliminados"
    rm -rf ~/.docker 2>/dev/null || echo "✅ Configuración .docker ya eliminada"
    
    echo "✅ Docker Desktop desinstalado completamente"
else
    echo "ℹ️ Docker Desktop mantenido (puedes desinstalarlo manualmente más tarde)"
fi

echo ""
echo "🎉 Limpieza completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecuta: ./scripts/setup-podman.sh"
echo "2. Ejecuta: task podman:verify"
echo "3. Ejecuta: task dev para probar el nuevo entorno"
echo ""
echo "💡 Consejos:"
echo "- Si no desinstalaste Docker Desktop, puedes desactivarlo en Preferencias del Sistema"
echo "- Los alias de Podman te permitirán usar comandos 'docker' normalmente"
echo "- Podman es más liviano y no requiere un daemon corriendo constantemente"

