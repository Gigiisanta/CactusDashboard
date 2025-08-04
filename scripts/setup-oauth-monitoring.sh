#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURACIÓN DE MONITOREO OAUTH AUTOMÁTICO
# =============================================================================
# Configura monitoreo automático de OAuth con cron jobs
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para configurar cron job
setup_cron_monitoring() {
    log "🔧 Configurando monitoreo automático de OAuth..."
    
    # Obtener ruta absoluta del script
    local script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/monitor-oauth.sh"
    
    # Crear cron job para verificar cada hora
    local cron_job="0 * * * * $script_path >> /tmp/oauth-monitor-cron.log 2>&1"
    
    # Verificar si el cron job ya existe
    if crontab -l 2>/dev/null | grep -q "monitor-oauth.sh"; then
        warning "Cron job ya existe. Actualizando..."
        # Remover cron job existente
        crontab -l 2>/dev/null | grep -v "monitor-oauth.sh" | crontab -
    fi
    
    # Agregar nuevo cron job
    (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
    
    success "✅ Cron job configurado para verificar OAuth cada hora"
    log "📝 Logs disponibles en: /tmp/oauth-monitor-cron.log"
}

# Función para configurar alertas
setup_alerts() {
    log "🔔 Configurando alertas..."
    
    # Solicitar email para alertas
    read -p "📧 Email para alertas (dejar vacío para saltar): " alert_email
    
    if [ -n "$alert_email" ]; then
        # Actualizar script con email
        sed -i.bak "s/ALERT_EMAIL=\"tu-email@dominio.com\"/ALERT_EMAIL=\"$alert_email\"/" scripts/monitor-oauth.sh
        success "✅ Email de alertas configurado: $alert_email"
    fi
    
    # Solicitar webhook de Discord
    read -p "🎮 Discord webhook (dejar vacío para saltar): " discord_webhook
    
    if [ -n "$discord_webhook" ]; then
        sed -i.bak "s/DISCORD_WEBHOOK=\"tu-webhook-discord\"/DISCORD_WEBHOOK=\"$discord_webhook\"/" scripts/monitor-oauth.sh
        success "✅ Discord webhook configurado"
    fi
    
    # Solicitar webhook de Slack
    read -p "💬 Slack webhook (dejar vacío para saltar): " slack_webhook
    
    if [ -n "$slack_webhook" ]; then
        sed -i.bak "s/SLACK_WEBHOOK=\"tu-webhook-slack\"/SLACK_WEBHOOK=\"$slack_webhook\"/" scripts/monitor-oauth.sh
        success "✅ Slack webhook configurado"
    fi
}

# Función para configurar backup automático
setup_backup() {
    log "💾 Configurando backup automático..."
    
    # Crear directorio de backup
    local backup_dir="$HOME/.cactus-oauth-backup"
    mkdir -p "$backup_dir"
    
    # Crear script de backup
    cat > scripts/backup-oauth.sh << 'EOF'
#!/bin/bash

# Script de backup automático de OAuth
BACKUP_DIR="$HOME/.cactus-oauth-backup"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR/$DATE"

# Backup de archivos importantes
cp .env "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp docker-compose.prod.yml "$BACKUP_DIR/$DATE/" 2>/dev/null || true
cp cactus-wealth-frontend/app/api/auth/[...nextauth]/route.ts "$BACKUP_DIR/$DATE/" 2>/dev/null || true

# Limpiar backups antiguos (mantener solo los últimos 7 días)
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "Backup completado: $BACKUP_DIR/$DATE"
EOF
    
    chmod +x scripts/backup-oauth.sh
    
    # Agregar cron job para backup diario
    local backup_cron="0 2 * * * $(pwd)/scripts/backup-oauth.sh >> /tmp/oauth-backup.log 2>&1"
    (crontab -l 2>/dev/null; echo "$backup_cron") | crontab -
    
    success "✅ Backup automático configurado (diario a las 2:00 AM)"
}

# Función para verificar dependencias
check_dependencies() {
    log "🔍 Verificando dependencias..."
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        error "❌ curl no está instalado"
        exit 1
    fi
    
    # Verificar docker
    if ! command -v docker &> /dev/null; then
        error "❌ docker no está instalado"
        exit 1
    fi
    
    # Verificar crontab
    if ! command -v crontab &> /dev/null; then
        error "❌ crontab no está disponible"
        exit 1
    fi
    
    success "✅ Todas las dependencias están instaladas"
}

# Función para mostrar estado actual
show_status() {
    log "📊 Estado actual del monitoreo:"
    
    echo ""
    echo "🕐 Cron jobs activos:"
    crontab -l 2>/dev/null | grep -E "(monitor-oauth|backup-oauth)" || echo "   No hay cron jobs configurados"
    
    echo ""
    echo "📁 Logs disponibles:"
    echo "   - Monitoreo: /tmp/oauth-monitor-cron.log"
    echo "   - Backup: /tmp/oauth-backup.log"
    
    echo ""
    echo "🔧 Scripts disponibles:"
    echo "   - Monitoreo: scripts/monitor-oauth.sh"
    echo "   - Backup: scripts/backup-oauth.sh"
    echo "   - Diagnóstico: ./diagnose-oauth.sh"
}

# Función principal
main() {
    echo ""
    echo "🛡️ CONFIGURACIÓN DE MONITOREO OAUTH PERMANENTE"
    echo "=============================================="
    echo ""
    
    # Verificar dependencias
    check_dependencies
    
    # Configurar alertas
    setup_alerts
    
    # Configurar monitoreo
    setup_cron_monitoring
    
    # Configurar backup
    setup_backup
    
    echo ""
    success "🎉 Configuración completada exitosamente!"
    echo ""
    
    # Mostrar estado
    show_status
    
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "   1. Configurar OAuth permanente siguiendo OAUTH_SETUP_PERMANENT.md"
    echo "   2. Probar monitoreo: ./scripts/monitor-oauth.sh"
    echo "   3. Verificar cron jobs: crontab -l"
    echo "   4. Revisar logs: tail -f /tmp/oauth-monitor-cron.log"
    echo ""
    echo "🔗 Enlaces útiles:"
    echo "   - Google Cloud Console: https://console.cloud.google.com/"
    echo "   - Documentación: OAUTH_SETUP_PERMANENT.md"
    echo "   - Monitoreo manual: task oauth:monitor"
    echo ""
}

# Ejecutar función principal
main "$@" 