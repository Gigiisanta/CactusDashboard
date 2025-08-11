#!/bin/bash

# ================================
# 🔧 MANTENIMIENTO DE PODMAN
# ================================

set -e

echo "🔧 Mantenimiento de Podman para CactusDashboard..."

# Función para mostrar uso de espacio
show_space_usage() {
    echo "💾 Uso actual de espacio:"
    echo "📊 Contenedores:"
    podman ps -a --size 2>/dev/null || echo "No hay contenedores"
    echo ""
    echo "📦 Imágenes:"
    podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "No hay imágenes"
    echo ""
    echo "💿 Volúmenes:"
    podman volume ls 2>/dev/null || echo "No hay volúmenes"
    echo ""
    echo "🔧 Redes:"
    podman network ls 2>/dev/null || echo "No hay redes"
    echo ""
    echo "💾 Resumen del sistema:"
    podman system df 2>/dev/null || echo "No hay datos del sistema"
}

# Función para limpieza automática
auto_cleanup() {
    echo "🧹 Limpieza automática..."
    
    # Detener contenedores no utilizados
    echo "⏹️ Deteniendo contenedores no utilizados..."
    podman container prune -f 2>/dev/null || echo "✅ No hay contenedores que limpiar"
    
    # Eliminar imágenes no utilizadas
    echo "🗑️ Eliminando imágenes no utilizadas..."
    podman image prune -f 2>/dev/null || echo "✅ No hay imágenes que limpiar"
    
    # Eliminar volúmenes no utilizados
    echo "🗑️ Eliminando volúmenes no utilizados..."
    podman volume prune -f 2>/dev/null || echo "✅ No hay volúmenes que limpiar"
    
    # Eliminar redes no utilizadas
    echo "🗑️ Eliminando redes no utilizadas..."
    podman network prune -f 2>/dev/null || echo "✅ No hay redes que limpiar"
    
    # Limpieza completa del sistema
    echo "🧹 Limpieza completa del sistema..."
    podman system prune -f 2>/dev/null || echo "✅ Sistema ya limpio"
}

# Función para limpieza agresiva
aggressive_cleanup() {
    echo "🔥 Limpieza agresiva (eliminará TODO excepto contenedores corriendo)..."
    
    read -p "¿Estás seguro? Esto eliminará todas las imágenes, volúmenes y redes no utilizadas (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔥 Ejecutando limpieza agresiva..."
        
        # Eliminar todas las imágenes no utilizadas
        podman image prune -a -f 2>/dev/null || echo "✅ No hay imágenes que eliminar"
        
        # Eliminar todos los volúmenes no utilizados
        podman volume prune -f 2>/dev/null || echo "✅ No hay volúmenes que eliminar"
        
        # Eliminar todas las redes no utilizadas
        podman network prune -f 2>/dev/null || echo "✅ No hay redes que eliminar"
        
        # Limpieza completa del sistema
        podman system prune -a -f 2>/dev/null || echo "✅ Sistema ya limpio"
        
        echo "✅ Limpieza agresiva completada"
    else
        echo "❌ Limpieza agresiva cancelada"
    fi
}

# Función para optimizar máquina
optimize_machine() {
    echo "⚡ Optimizando máquina Podman..."
    
    # Verificar estado de la máquina
    echo "📊 Estado actual de la máquina:"
    podman machine list
    
    # Reiniciar máquina si es necesario
    read -p "¿Deseas reiniciar la máquina Podman? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Reiniciando máquina Podman..."
        podman machine stop cactus-dashboard 2>/dev/null || echo "✅ Máquina ya detenida"
        podman machine start cactus-dashboard
        echo "✅ Máquina reiniciada"
    fi
    
    # Mostrar configuración actual
    echo "🔧 Configuración actual:"
    podman machine inspect cactus-dashboard 2>/dev/null || echo "❌ No se pudo obtener información de la máquina"
}

# Función para backup de volúmenes
backup_volumes() {
    echo "💾 Creando backup de volúmenes..."
    
    BACKUP_DIR="./backups/podman-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo "📦 Listando volúmenes para backup:"
    podman volume ls --format "table {{.Name}}\t{{.Driver}}"
    
    # Backup de volúmenes específicos de CactusDashboard
    VOLUMES=("postgres_data" "redis_data" "backend_logs" "frontend_logs")
    
    for volume in "${VOLUMES[@]}"; do
        if podman volume exists "$volume" 2>/dev/null; then
            echo "💾 Haciendo backup de $volume..."
            podman run --rm -v "$volume":/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/$volume.tar.gz" -C /data . 2>/dev/null || echo "⚠️ No se pudo hacer backup de $volume"
        else
            echo "ℹ️ Volumen $volume no existe"
        fi
    done
    
    echo "✅ Backup completado en $BACKUP_DIR"
}

# Función para restaurar volúmenes
restore_volumes() {
    echo "🔄 Restaurando volúmenes desde backup..."
    
    if [ -z "$1" ]; then
        echo "❌ Debes especificar el directorio de backup"
        echo "Uso: $0 restore /path/to/backup"
        exit 1
    fi
    
    BACKUP_DIR="$1"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ Directorio de backup no encontrado: $BACKUP_DIR"
        exit 1
    fi
    
    echo "📦 Restaurando desde: $BACKUP_DIR"
    
    for backup_file in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup_file" ]; then
            volume_name=$(basename "$backup_file" .tar.gz)
            echo "🔄 Restaurando $volume_name..."
            
            # Crear volumen si no existe
            podman volume create "$volume_name" 2>/dev/null || echo "✅ Volumen $volume_name ya existe"
            
            # Restaurar datos
            podman run --rm -v "$volume_name":/data -v "$backup_file":/backup.tar.gz alpine sh -c "cd /data && tar xzf /backup.tar.gz" 2>/dev/null || echo "⚠️ No se pudo restaurar $volume_name"
        fi
    done
    
    echo "✅ Restauración completada"
}

# Menú principal
case "${1:-}" in
    "status")
        show_space_usage
        ;;
    "cleanup")
        auto_cleanup
        show_space_usage
        ;;
    "aggressive")
        aggressive_cleanup
        show_space_usage
        ;;
    "optimize")
        optimize_machine
        ;;
    "backup")
        backup_volumes
        ;;
    "restore")
        restore_volumes "$2"
        ;;
    *)
        echo "🔧 Mantenimiento de Podman - CactusDashboard"
        echo ""
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  status      - Mostrar uso de espacio y recursos"
        echo "  cleanup     - Limpieza automática (segura)"
        echo "  aggressive  - Limpieza agresiva (elimina todo no utilizado)"
        echo "  optimize    - Optimizar máquina Podman"
        echo "  backup      - Crear backup de volúmenes"
        echo "  restore     - Restaurar volúmenes desde backup"
        echo ""
        echo "Ejemplos:"
        echo "  $0 status"
        echo "  $0 cleanup"
        echo "  $0 backup"
        echo "  $0 restore ./backups/podman-20241201_120000"
        echo ""
        echo "💡 Consejos:"
        echo "- Ejecuta 'cleanup' semanalmente para mantener el sistema limpio"
        echo "- Usa 'backup' antes de actualizaciones importantes"
        echo "- 'aggressive' libera más espacio pero elimina todo el cache"
        ;;
esac

