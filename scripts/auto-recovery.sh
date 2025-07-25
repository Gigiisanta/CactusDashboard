#!/bin/bash

# 🚀 AUTO-RECOVERY - CactusDashboard
# Script de recuperación automática con múltiples estrategias

set -euo pipefail

# Configuración
SERVER_IP="18.218.252.174"
SSH_KEY="cactus-key.pem"
SSH_USER="ubuntu"
REMOTE_DIR="~/apps/CactusDashboard"
MAX_ATTEMPTS=10
WAIT_BETWEEN_ATTEMPTS=30

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Función para intentar conexión SSH con retry
try_ssh_connection() {
    local attempt="$1"
    local max_attempts="$2"
    
    log "🔄 Intento $attempt/$max_attempts - Probando conexión SSH..."
    
    if timeout 45 ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=5 "$SSH_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
        success "✅ Conexión SSH exitosa en intento $attempt"
        return 0
    else
        warn "❌ Intento $attempt falló"
        return 1
    fi
}

# Función para esperar recuperación del servidor
wait_for_server_recovery() {
    log "⏳ ESPERANDO RECUPERACIÓN DEL SERVIDOR"
    log "Esto puede tomar varios minutos si el servidor está sobrecargado..."
    echo
    
    for attempt in $(seq 1 $MAX_ATTEMPTS); do
        log "🔍 Intento $attempt/$MAX_ATTEMPTS"
        
        # Verificar puerto SSH primero
        if timeout 10 bash -c "echo >/dev/tcp/$SERVER_IP/22" 2>/dev/null; then
            log "✅ Puerto SSH accesible"
            
            # Intentar conexión SSH
            if try_ssh_connection "$attempt" "$MAX_ATTEMPTS"; then
                return 0
            fi
        else
            warn "❌ Puerto SSH no accesible"
        fi
        
        if [[ $attempt -lt $MAX_ATTEMPTS ]]; then
            log "⏱️ Esperando ${WAIT_BETWEEN_ATTEMPTS}s antes del siguiente intento..."
            sleep $WAIT_BETWEEN_ATTEMPTS
        fi
    done
    
    error "❌ No se pudo establecer conexión después de $MAX_ATTEMPTS intentos"
    return 1
}

# Función para limpiar procesos colgados de forma agresiva
aggressive_cleanup() {
    log "🧹 LIMPIEZA AGRESIVA DEL SERVIDOR"
    
    # Detener todos los contenedores Docker
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        echo '=== DETENIENDO TODOS LOS CONTENEDORES ==='
        docker stop \$(docker ps -aq) 2>/dev/null || echo 'No hay contenedores corriendo'
        
        echo '=== ELIMINANDO CONTENEDORES ==='
        docker rm \$(docker ps -aq) 2>/dev/null || echo 'No hay contenedores para eliminar'
        
        echo '=== LIMPIANDO SISTEMA DOCKER ==='
        docker system prune -af --volumes 2>/dev/null || echo 'Error en limpieza Docker'
        
        echo '=== LIBERANDO MEMORIA ==='
        sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || echo 'No se pudo limpiar cache'
        
        echo '=== VERIFICANDO PROCESOS PESADOS ==='
        ps aux --sort=-%mem | head -10
        
        echo '=== ESTADO ACTUAL ==='
        free -h
        df -h /
    " 2>/dev/null || {
        error "❌ Error durante la limpieza agresiva"
        return 1
    }
    
    success "✅ Limpieza agresiva completada"
}

# Función para despliegue ultra-optimizado
ultra_optimized_deploy() {
    log "🚀 DESPLIEGUE ULTRA-OPTIMIZADO"
    
    # Actualizar código
    log "📥 Actualizando código..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR && git pull origin main
    " || {
        error "❌ Error actualizando código"
        return 1
    }
    
    # Crear docker-compose ultra-minimal
    log "📝 Creando configuración ultra-minimal..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        cat > docker-compose.minimal.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cactus_wealth
      POSTGRES_USER: cactus_user
      POSTGRES_PASSWORD: cactus_secure_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M
    healthcheck:
      test: [\"CMD-SHELL\", \"pg_isready -U cactus_user -d cactus_wealth\"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 128M
        reservations:
          memory: 64M
    healthcheck:
      test: [\"CMD\", \"redis-cli\", \"ping\"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./cactus-wealth-backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://cactus_user:cactus_secure_2024@db:5432/cactus_wealth
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=ultra-secure-secret-key-2024-cactus
      - DEBUG=false
      - ENVIRONMENT=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - \"8000:8000\"
    deploy:
      resources:
        limits:
          memory: 384M
        reservations:
          memory: 256M
    healthcheck:
      test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:8000/health\"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./cactus-wealth-frontend:/app
    command: sh -c \"npm ci --only=production && npm run build && npm start\"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://18.218.252.174:8000
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - \"3000:3000\"
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: cactus_minimal
EOF
    " || {
        error "❌ Error creando configuración minimal"
        return 1
    }
    
    # Construir solo backend primero
    log "🔨 Construyendo backend..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        docker-compose -f docker-compose.minimal.yml build backend
    " || {
        error "❌ Error construyendo backend"
        return 1
    }
    
    # Iniciar servicios de base de datos
    log "🗄️ Iniciando bases de datos..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        docker-compose -f docker-compose.minimal.yml up -d db redis
    " || {
        error "❌ Error iniciando bases de datos"
        return 1
    }
    
    # Esperar que las bases de datos estén listas
    log "⏳ Esperando bases de datos..."
    sleep 45
    
    # Iniciar backend
    log "🔧 Iniciando backend..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        docker-compose -f docker-compose.minimal.yml up -d backend
    " || {
        error "❌ Error iniciando backend"
        return 1
    }
    
    # Esperar backend
    log "⏳ Esperando backend..."
    sleep 30
    
    # Iniciar frontend
    log "🎨 Iniciando frontend..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        docker-compose -f docker-compose.minimal.yml up -d frontend
    " || {
        error "❌ Error iniciando frontend"
        return 1
    }
    
    success "✅ Despliegue ultra-optimizado completado"
}

# Función para verificar el resultado final
verify_final_result() {
    log "🔍 VERIFICACIÓN FINAL"
    
    # Verificar contenedores
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "
        cd $REMOTE_DIR
        echo '=== CONTENEDORES ==='
        docker-compose -f docker-compose.minimal.yml ps
        echo
        echo '=== PUERTOS ==='
        netstat -tlnp | grep -E ':(3000|8000|5432|6379)' || echo 'Puertos no encontrados'
        echo
        echo '=== RECURSOS ==='
        free -h
        df -h /
    " || {
        warn "⚠️ Error en verificación"
        return 1
    }
    
    # Test de conectividad
    log "🌐 Probando conectividad web..."
    sleep 30
    
    if curl -s -o /dev/null -w '%{http_code}' "http://$SERVER_IP:8000/health" | grep -q "200"; then
        success "✅ Backend accesible"
    else
        warn "⚠️ Backend no responde"
    fi
    
    if curl -s -o /dev/null -w '%{http_code}' "http://$SERVER_IP:3000" | grep -q "200"; then
        success "✅ Frontend accesible"
    else
        warn "⚠️ Frontend no responde"
    fi
}

# Función principal
main() {
    log "🚀 INICIANDO RECUPERACIÓN AUTOMÁTICA"
    log "Servidor: $SERVER_IP"
    log "Máximo intentos: $MAX_ATTEMPTS"
    log "Espera entre intentos: ${WAIT_BETWEEN_ATTEMPTS}s"
    echo
    
    # Esperar recuperación del servidor
    if ! wait_for_server_recovery; then
        error "❌ No se pudo establecer conexión con el servidor"
        log "💡 RECOMENDACIÓN: Reinicia el servidor EC2 desde AWS Console"
        exit 1
    fi
    
    echo
    # Limpieza agresiva
    aggressive_cleanup
    
    echo
    # Despliegue ultra-optimizado
    ultra_optimized_deploy
    
    echo
    # Verificación final
    verify_final_result
    
    echo
    success "🎉 RECUPERACIÓN AUTOMÁTICA COMPLETADA"
    log "URLs de verificación:"
    log "  Frontend: http://$SERVER_IP:3000"
    log "  Backend:  http://$SERVER_IP:8000/docs"
    echo
    log "Para monitoreo continuo:"
    log "  ./scripts/quick-status.sh"
}

# Ejecutar si es llamado directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi