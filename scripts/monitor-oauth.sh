#!/bin/bash

# =============================================================================
# SCRIPT DE MONITOREO OAUTH AUTOMÁTICO - CACTUS DASHBOARD
# =============================================================================
# Verifica automáticamente el estado de OAuth y envía alertas
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
LOG_FILE="/tmp/oauth-monitor.log"
ALERT_EMAIL="tu-email@dominio.com"
DISCORD_WEBHOOK="tu-webhook-discord"
SLACK_WEBHOOK="tu-webhook-slack"

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Función para enviar alerta por email
send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        log "Alerta enviada por email a $ALERT_EMAIL"
    else
        warning "Comando 'mail' no disponible. Instala: brew install mailutils"
    fi
}

# Función para enviar alerta por Discord
send_discord_alert() {
    local message="$1"
    
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{\"content\":\"🚨 **OAuth Alert**: $message\"}" \
             "$DISCORD_WEBHOOK" &>/dev/null
        log "Alerta enviada a Discord"
    fi
}

# Función para enviar alerta por Slack
send_slack_alert() {
    local message="$1"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST \
             -H 'Content-type: application/json' \
             --data "{\"text\":\"🚨 OAuth Alert: $message\"}" \
             "$SLACK_WEBHOOK" &>/dev/null
        log "Alerta enviada a Slack"
    fi
}

# Función para verificar OAuth
check_oauth() {
    log "🔍 Verificando estado de OAuth..."
    
    # Verificar si el frontend está ejecutándose
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        error "Frontend no está ejecutándose en localhost:3000"
        return 1
    fi
    
    # Verificar endpoint de OAuth
    local oauth_response=$(curl -s -w "%{http_code}" http://localhost:3000/api/auth/providers -o /dev/null)
    
    if [ "$oauth_response" = "200" ]; then
        success "OAuth está funcionando correctamente"
        return 0
    elif [ "$oauth_response" = "404" ]; then
        error "OAuth no está configurado (404)"
        return 1
    else
        error "OAuth devolvió código de estado: $oauth_response"
        return 1
    fi
}

# Función para verificar credenciales
check_credentials() {
    log "🔐 Verificando credenciales OAuth..."
    
    # Verificar variables de entorno
    if ! docker exec cactusdashboard-frontend-1 env | grep -q "GOOGLE_CLIENT_ID"; then
        error "GOOGLE_CLIENT_ID no está configurado"
        return 1
    fi
    
    if ! docker exec cactusdashboard-frontend-1 env | grep -q "GOOGLE_CLIENT_SECRET"; then
        error "GOOGLE_CLIENT_SECRET no está configurado"
        return 1
    fi
    
    if ! docker exec cactusdashboard-frontend-1 env | grep -q "NEXTAUTH_SECRET"; then
        error "NEXTAUTH_SECRET no está configurado"
        return 1
    fi
    
    success "Todas las credenciales están configuradas"
    return 0
}

# Función para verificar Google Cloud Project
check_google_cloud() {
    log "☁️ Verificando Google Cloud Project..."
    
    # Verificar si gcloud está instalado
    if ! command -v gcloud &> /dev/null; then
        warning "gcloud CLI no está instalado. Instala: brew install google-cloud-sdk"
        return 0
    fi
    
    # Verificar proyecto activo
    local project=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$project" ]; then
        log "Proyecto activo: $project"
        
        # Verificar APIs habilitadas
        if gcloud services list --enabled --filter="name:googleapis.com/oauth2" &>/dev/null; then
            success "OAuth2 API está habilitada"
        else
            warning "OAuth2 API no está habilitada"
        fi
    else
        warning "No hay proyecto de Google Cloud configurado"
    fi
}

# Función para crear backup de configuración
create_backup() {
    log "💾 Creando backup de configuración..."
    
    local backup_dir="/tmp/oauth-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup de variables de entorno
    if [ -f ".env" ]; then
        cp .env "$backup_dir/"
        log "Backup de .env creado en $backup_dir"
    fi
    
    # Backup de configuración de Docker
    if [ -f "docker-compose.prod.yml" ]; then
        cp docker-compose.prod.yml "$backup_dir/"
        log "Backup de docker-compose.prod.yml creado en $backup_dir"
    fi
    
    # Backup de configuración de NextAuth
    if [ -f "cactus-wealth-frontend/app/api/auth/[...nextauth]/route.ts" ]; then
        cp cactus-wealth-frontend/app/api/auth/[...nextauth]/route.ts "$backup_dir/"
        log "Backup de NextAuth config creado en $backup_dir"
    fi
    
    success "Backup completado en $backup_dir"
}

# Función principal
main() {
    log "🚀 Iniciando monitoreo OAuth..."
    
    local oauth_ok=false
    local credentials_ok=false
    
    # Verificar OAuth
    if check_oauth; then
        oauth_ok=true
    fi
    
    # Verificar credenciales
    if check_credentials; then
        credentials_ok=true
    fi
    
    # Verificar Google Cloud
    check_google_cloud
    
    # Crear backup
    create_backup
    
    # Evaluar resultados
    if [ "$oauth_ok" = true ] && [ "$credentials_ok" = true ]; then
        success "✅ OAuth está funcionando correctamente"
        exit 0
    else
        error "❌ OAuth tiene problemas"
        
        # Enviar alertas
        local alert_message="OAuth no está funcionando correctamente. Revisar configuración."
        send_email_alert "OAuth Alert - Cactus Dashboard" "$alert_message"
        send_discord_alert "$alert_message"
        send_slack_alert "$alert_message"
        
        exit 1
    fi
}

# Ejecutar función principal
main "$@" 