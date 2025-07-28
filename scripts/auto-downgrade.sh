#!/bin/bash

# Script de auto-downgrade para Cactus Dashboard
# Cambia la instancia de t4g.small a t4g.micro el 1 de enero de 2026

set -euo pipefail

# Variables de configuración
PROJECT_NAME="cactus-dashboard"
CURRENT_INSTANCE_TYPE="t4g.small"
NEXT_INSTANCE_TYPE="t4g.micro"
DOWNGRADE_DATE="2026-01-01"
LOG_FILE="/var/log/cactus/auto-downgrade.log"

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar si es el momento de hacer el downgrade
check_downgrade_date() {
    local current_date=$(date +%Y-%m-%d)
    if [[ "$current_date" == "$DOWNGRADE_DATE" ]]; then
        return 0
    else
        return 1
    fi
}

# Obtener información de la instancia actual
get_instance_info() {
    local instance_id=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    local current_type=$(curl -s http://169.254.169.254/latest/meta-data/instance-type)
    
    echo "Instance ID: $instance_id"
    echo "Current Type: $current_type"
    
    if [[ "$current_type" == "$CURRENT_INSTANCE_TYPE" ]]; then
        return 0
    else
        return 1
    fi
}

# Verificar si ya se realizó el downgrade
check_already_downgraded() {
    if [[ -f "/tmp/cactus-downgraded" ]]; then
        return 0
    else
        return 1
    fi
}

# Marcar como downgrade completado
mark_downgraded() {
    echo "$(date)" > /tmp/cactus-downgraded
    log "✅ Downgrade marcado como completado"
}

# Función principal de downgrade
perform_downgrade() {
    log "🚀 Iniciando proceso de auto-downgrade"
    
    # Verificar fecha
    if ! check_downgrade_date; then
        log "❌ No es el momento del downgrade. Fecha actual: $(date +%Y-%m-%d), Fecha objetivo: $DOWNGRADE_DATE"
        exit 0
    fi
    
    # Verificar si ya se realizó
    if check_already_downgraded; then
        log "✅ Downgrade ya fue realizado anteriormente"
        exit 0
    fi
    
    # Verificar tipo de instancia actual
    if ! get_instance_info; then
        log "❌ La instancia ya no es $CURRENT_INSTANCE_TYPE, no se requiere downgrade"
        mark_downgraded
        exit 0
    fi
    
    log "📋 Información de la instancia:"
    get_instance_info
    
    # Crear backup antes del downgrade
    log "💾 Creando backup antes del downgrade..."
    if [[ -f "/opt/cactus/backup-db.sh" ]]; then
        /opt/cactus/backup-db.sh
        log "✅ Backup completado"
    else
        log "⚠️ Script de backup no encontrado"
    fi
    
    # Detener servicios de manera ordenada
    log "🛑 Deteniendo servicios..."
    cd /home/ubuntu/CactusDashboard
    if docker-compose -f docker-compose.prod.yml down; then
        log "✅ Servicios detenidos"
    else
        log "⚠️ Error al detener servicios, continuando..."
    fi
    
    # Notificar que el downgrade debe realizarse manualmente
    log "📢 IMPORTANTE: El downgrade de instancia debe realizarse manualmente"
    log "📢 Pasos a seguir:"
    log "   1. Detener la instancia desde AWS Console"
    log "   2. Cambiar tipo de instancia a $NEXT_INSTANCE_TYPE"
    log "   3. Iniciar la instancia"
    log "   4. Verificar que los servicios se inicien correctamente"
    
    # Crear archivo de instrucciones
    cat << EOF > /home/ubuntu/downgrade-instructions.txt
AUTO-DOWNGRADE INSTRUCTIONS
===========================

Fecha: $(date)
Instancia: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)
Tipo Actual: $CURRENT_INSTANCE_TYPE
Tipo Objetivo: $NEXT_INSTANCE_TYPE

PASOS PARA COMPLETAR EL DOWNGRADE:

1. Acceder a AWS Console > EC2 > Instances
2. Seleccionar la instancia: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)
3. Actions > Instance State > Stop
4. Esperar a que la instancia esté detenida
5. Actions > Instance Settings > Change Instance Type
6. Seleccionar: $NEXT_INSTANCE_TYPE
7. Apply
8. Actions > Instance State > Start
9. Esperar a que la instancia esté ejecutándose
10. Conectarse via SSH y verificar servicios:
    cd /home/ubuntu/CactusDashboard
    docker-compose -f docker-compose.prod.yml up -d
    ./system-info.sh

VERIFICACIÓN:
- Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000
- Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
- Health Check: /opt/cactus/health-check.sh

NOTAS:
- Los datos de PostgreSQL se mantienen en el volumen EBS
- Los backups automáticos continuarán funcionando
- El monitoreo de latencia seguirá activo
- Los tests nocturnos continuarán ejecutándose

EOF
    
    log "📄 Instrucciones guardadas en: /home/ubuntu/downgrade-instructions.txt"
    
    # Enviar notificación por email si está configurado
    if command -v mail &> /dev/null; then
        if [[ -n "${ALERT_EMAIL:-}" ]]; then
            echo "Auto-downgrade requerido para Cactus Dashboard" | mail -s "Cactus Dashboard - Auto-downgrade Required" "$ALERT_EMAIL"
            log "📧 Notificación enviada a: $ALERT_EMAIL"
        fi
    fi
    
    # Marcar como downgrade iniciado
    mark_downgraded
    
    log "✅ Proceso de auto-downgrade completado"
    log "📋 Sigue las instrucciones en: /home/ubuntu/downgrade-instructions.txt"
}

# Función de verificación de estado
check_status() {
    log "📊 Estado del auto-downgrade:"
    echo "Fecha actual: $(date +%Y-%m-%d)"
    echo "Fecha objetivo: $DOWNGRADE_DATE"
    echo "Tipo actual: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)"
    echo "Tipo objetivo: $NEXT_INSTANCE_TYPE"
    
    if check_already_downgraded; then
        echo "Estado: ✅ Downgrade marcado como completado"
    else
        echo "Estado: ⏳ Pendiente de ejecución"
    fi
}

# Función de ayuda
show_help() {
    echo "Script de Auto-Downgrade para Cactus Dashboard"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  downgrade  - Ejecutar el proceso de downgrade"
    echo "  status     - Mostrar estado del downgrade"
    echo "  help       - Mostrar esta ayuda"
    echo ""
    echo "El downgrade automático se ejecuta el $DOWNGRADE_DATE"
    echo "Cambia la instancia de $CURRENT_INSTANCE_TYPE a $NEXT_INSTANCE_TYPE"
}

# Función principal
main() {
    local command="${1:-help}"
    
    case "$command" in
        "downgrade")
            perform_downgrade
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo "Comando desconocido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@" 