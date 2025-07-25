#!/bin/bash

# 🔍 DIAGNÓSTICO AVANZADO - CactusDashboard
# Script para diagnosticar problemas de conectividad y estado del servidor

set -euo pipefail

# Configuración
SERVER_IP="3.137.157.34"
SSH_KEY="cactus-key.pem"
SSH_USER="ubuntu"

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para verificar conectividad básica
check_basic_connectivity() {
    log "🔍 DIAGNÓSTICO DE CONECTIVIDAD BÁSICA"
    echo
    
    # 1. Verificar si la clave SSH existe y tiene permisos correctos
    if [[ ! -f "$SSH_KEY" ]]; then
        error "❌ Clave SSH no encontrada: $SSH_KEY"
        return 1
    fi
    
    local key_perms=$(stat -c %a "$SSH_KEY" 2>/dev/null || stat -f %A "$SSH_KEY" 2>/dev/null)
    if [[ "$key_perms" != "600" ]]; then
        warn "⚠️ Permisos de clave SSH incorrectos: $key_perms (debería ser 600)"
        chmod 600 "$SSH_KEY"
        log "✅ Permisos corregidos"
    else
        log "✅ Permisos de clave SSH correctos"
    fi
    
    # 2. Ping básico
    log "🏓 Probando ping al servidor..."
    if ping -c 3 -W 5 "$SERVER_IP" >/dev/null 2>&1; then
        log "✅ Ping exitoso"
    else
        warn "⚠️ Ping falló (puede estar bloqueado por firewall)"
    fi
    
    # 3. Verificar puerto SSH
    log "🔌 Verificando puerto SSH (22)..."
    if timeout 10 bash -c "echo >/dev/tcp/$SERVER_IP/22" 2>/dev/null; then
        log "✅ Puerto SSH accesible"
    else
        error "❌ Puerto SSH no accesible"
        return 1
    fi
    
    # 4. Probar conexión SSH básica
    log "🔐 Probando conexión SSH básica..."
    if timeout 15 ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes "$SSH_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
        log "✅ Conexión SSH exitosa"
        return 0
    else
        error "❌ Conexión SSH falló"
        return 1
    fi
}

# Función para diagnóstico del servidor
diagnose_server() {
    log "🖥️ DIAGNÓSTICO DEL SERVIDOR"
    echo
    
    # Información del sistema
    log "📊 Información del sistema:"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        echo '=== SISTEMA ==='
        uname -a
        echo
        echo '=== MEMORIA ==='
        free -h
        echo
        echo '=== DISCO ==='
        df -h /
        echo
        echo '=== CARGA DEL SISTEMA ==='
        uptime
        echo
        echo '=== PROCESOS DOCKER ==='
        ps aux | grep docker | head -10
        echo
        echo '=== CONTENEDORES DOCKER ==='
        docker ps -a || echo 'Docker no disponible'
        echo
        echo '=== PUERTOS EN USO ==='
        netstat -tlnp | grep -E ':(22|3000|8000|5432|6379)' || echo 'Puertos no encontrados'
    " 2>/dev/null || {
        error "❌ No se pudo obtener información del servidor"
        return 1
    }
}

# Función para diagnóstico de Docker
diagnose_docker() {
    log "🐳 DIAGNÓSTICO DE DOCKER"
    echo
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        echo '=== VERSIÓN DOCKER ==='
        docker --version || echo 'Docker no instalado'
        echo
        echo '=== VERSIÓN DOCKER COMPOSE ==='
        docker-compose --version || echo 'Docker Compose no instalado'
        echo
        echo '=== ESTADO DEL SERVICIO DOCKER ==='
        sudo systemctl status docker --no-pager || echo 'Systemctl no disponible'
        echo
        echo '=== ESPACIO DOCKER ==='
        docker system df || echo 'Docker no disponible'
        echo
        echo '=== LOGS DOCKER RECIENTES ==='
        sudo journalctl -u docker --no-pager --lines=10 || echo 'Journalctl no disponible'
    " 2>/dev/null || {
        error "❌ No se pudo obtener información de Docker"
        return 1
    }
}

# Función para diagnóstico del proyecto
diagnose_project() {
    log "📁 DIAGNÓSTICO DEL PROYECTO"
    echo
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        echo '=== DIRECTORIO DEL PROYECTO ==='
        ls -la ~/apps/CactusDashboard/ || echo 'Directorio no encontrado'
        echo
        echo '=== ESTADO GIT ==='
        cd ~/apps/CactusDashboard && git status || echo 'Git no disponible'
        echo
        echo '=== ARCHIVOS DOCKER COMPOSE ==='
        cd ~/apps/CactusDashboard && ls -la docker-compose*.yml || echo 'Archivos no encontrados'
        echo
        echo '=== ARCHIVO .ENV ==='
        cd ~/apps/CactusDashboard && ls -la .env || echo 'Archivo .env no encontrado'
        echo
        echo '=== LOGS DEL PROYECTO ==='
        cd ~/apps/CactusDashboard && ls -la logs/ || echo 'Directorio logs no encontrado'
    " 2>/dev/null || {
        error "❌ No se pudo obtener información del proyecto"
        return 1
    }
}

# Función para limpiar recursos si es necesario
cleanup_resources() {
    log "🧹 LIMPIEZA DE RECURSOS"
    echo
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        echo '=== DETENIENDO CONTENEDORES ==='
        cd ~/apps/CactusDashboard && docker-compose -f docker-compose.simple.yml down --remove-orphans || echo 'No se pudieron detener contenedores'
        echo
        echo '=== LIMPIANDO CONTENEDORES HUÉRFANOS ==='
        docker container prune -f || echo 'No se pudieron limpiar contenedores'
        echo
        echo '=== LIMPIANDO IMÁGENES NO UTILIZADAS ==='
        docker image prune -f || echo 'No se pudieron limpiar imágenes'
        echo
        echo '=== VERIFICANDO ESPACIO LIBERADO ==='
        df -h /
    " 2>/dev/null || {
        warn "⚠️ Algunos comandos de limpieza fallaron"
    }
}

# Función principal
main() {
    log "🔍 INICIANDO DIAGNÓSTICO COMPLETO"
    log "Servidor: $SERVER_IP"
    echo
    
    # Verificar conectividad básica
    if ! check_basic_connectivity; then
        error "❌ Fallo en conectividad básica. No se puede continuar."
        exit 1
    fi
    
    echo
    # Diagnóstico del servidor
    diagnose_server
    
    echo
    # Diagnóstico de Docker
    diagnose_docker
    
    echo
    # Diagnóstico del proyecto
    diagnose_project
    
    echo
    # Preguntar si limpiar recursos
    log "¿Deseas limpiar recursos Docker? (esto detendrá contenedores actuales)"
    read -p "Continuar con limpieza? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_resources
    fi
    
    echo
    log "🎯 RECOMENDACIONES:"
    log "1. Si Docker está funcionando, ejecuta: ./scripts/emergency-deploy.sh"
    log "2. Si hay problemas de espacio, ejecuta limpieza de Docker"
    log "3. Si hay procesos colgados, reinicia el servidor EC2"
    log "4. Verifica los logs del sistema para errores específicos"
    echo
    log "✅ DIAGNÓSTICO COMPLETADO"
}

# Ejecutar si es llamado directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi