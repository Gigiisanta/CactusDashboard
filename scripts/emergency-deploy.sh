#!/bin/bash

# 🚨 EMERGENCY DEPLOY - CactusDashboard
# Script de emergencia para resolver despliegues colgados y reiniciar de forma optimizada

set -euo pipefail

# Configuración
SERVER_IP="18.218.252.174"
SSH_KEY="cactus-key.pem"
SSH_USER="ubuntu"
REMOTE_DIR="~/apps/CactusDashboard"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para ejecutar comandos SSH con timeout
ssh_exec() {
    local cmd="$1"
    local timeout="${2:-30}"
    
    log "Ejecutando: $cmd"
    timeout "$timeout" ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_USER@$SERVER_IP" "$cmd" || {
        error "Comando falló o timeout: $cmd"
        return 1
    }
}

# Función para verificar conectividad
check_connectivity() {
    log "🔍 Verificando conectividad con el servidor..."
    
    if ! ssh_exec "echo 'Servidor accesible'" 10; then
        error "❌ No se puede conectar al servidor"
        return 1
    fi
    
    log "✅ Conectividad OK"
    return 0
}

# Función para limpiar procesos colgados
cleanup_stuck_processes() {
    log "🧹 Limpiando procesos colgados..."
    
    # Detener todos los contenedores Docker
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml down --remove-orphans || true" 60
    
    # Limpiar contenedores huérfanos
    ssh_exec "docker container prune -f || true" 30
    
    # Limpiar imágenes no utilizadas
    ssh_exec "docker image prune -f || true" 30
    
    # Verificar espacio en disco
    ssh_exec "df -h /" 10
    
    log "✅ Limpieza completada"
}

# Función para despliegue optimizado
optimized_deploy() {
    log "🚀 Iniciando despliegue optimizado..."
    
    # Actualizar código
    ssh_exec "cd $REMOTE_DIR && git pull origin main" 30
    
    # Construir solo las imágenes necesarias con límites de memoria
    log "🔨 Construyendo imágenes con límites optimizados..."
    
    # Construir backend primero (más rápido)
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml build --no-cache backend" 300
    
    # Construir frontend con límites de memoria
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml build --no-cache --memory=1g frontend" 600
    
    # Iniciar servicios de base de datos primero
    log "🗄️ Iniciando servicios de base de datos..."
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml up -d db redis" 60
    
    # Esperar que las bases de datos estén listas
    log "⏳ Esperando que las bases de datos estén listas..."
    sleep 30
    
    # Iniciar backend
    log "🔧 Iniciando backend..."
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml up -d backend" 60
    
    # Esperar que el backend esté listo
    sleep 20
    
    # Iniciar frontend
    log "🎨 Iniciando frontend..."
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml up -d frontend" 60
    
    log "✅ Despliegue optimizado completado"
}

# Función para verificar el estado final
verify_deployment() {
    log "🔍 Verificando estado del despliegue..."
    
    # Verificar contenedores
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml ps" 30
    
    # Verificar puertos
    ssh_exec "netstat -tlnp | grep -E ':(3000|8000|5432|6379)'" 10 || warn "Algunos puertos pueden no estar activos aún"
    
    # Verificar logs recientes
    log "📋 Logs recientes:"
    ssh_exec "cd $REMOTE_DIR && docker-compose -f docker-compose.simple.yml logs --tail=10" 30
    
    # Test de conectividad web
    log "🌐 Probando conectividad web..."
    if ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 10 | grep -q "200"; then
        log "✅ Frontend accesible"
    else
        warn "⚠️ Frontend no responde aún"
    fi
    
    if ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health" 10 | grep -q "200"; then
        log "✅ Backend accesible"
    else
        warn "⚠️ Backend no responde aún"
    fi
}

# Función principal
main() {
    log "🚨 INICIANDO DESPLIEGUE DE EMERGENCIA"
    log "Servidor: $SERVER_IP"
    log "Directorio: $REMOTE_DIR"
    echo
    
    # Verificar conectividad
    if ! check_connectivity; then
        error "❌ No se puede continuar sin conectividad"
        exit 1
    fi
    
    # Limpiar procesos colgados
    cleanup_stuck_processes
    
    # Despliegue optimizado
    optimized_deploy
    
    # Verificar resultado
    verify_deployment
    
    echo
    log "🎉 DESPLIEGUE DE EMERGENCIA COMPLETADO"
    log "URLs de verificación:"
    log "  Frontend: http://$SERVER_IP:3000"
    log "  Backend:  http://$SERVER_IP:8000/docs"
    echo
    log "Para monitoreo en tiempo real:"
    log "  ./scripts/quick-status.sh"
}

# Ejecutar si es llamado directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi