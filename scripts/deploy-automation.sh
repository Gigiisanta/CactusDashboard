#!/usr/bin/env bash

# 🚀 CACTUS DASHBOARD - AUTOMATIZACIÓN DEVOPS
# Script de automatización para despliegue y mantenimiento en EC2
# Servidor: Ubuntu 22.04 (3.137.157.34)
# Clave SSH: ~/Downloads/cactus-key.pem

set -euo pipefail

# Configuración
SERVER_IP="3.137.157.34"
SSH_KEY="~/Downloads/cactus-key.pem"
SSH_USER="ubuntu"
REPO_URL="https://github.com/Gigiisanta/CactusDashboard.git"
REMOTE_APP_DIR="/home/ubuntu/apps/CactusDashboard"
REMOTE_SCRIPTS_DIR="/home/ubuntu/scripts"
REMOTE_BACKUPS_DIR="/home/ubuntu/backups"

# Colores para output
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

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Función para ejecutar comandos remotos
ssh_exec() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

# Función para copiar archivos al servidor
scp_copy() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$@"
}

# 1. Conexión inicial y preparación
setup_server() {
    log "🔧 Configurando servidor inicial..."
    
    # Verificar conexión SSH
    if ! ssh_exec "echo 'Conexión SSH exitosa'"; then
        error "No se puede conectar al servidor. Verifica la clave SSH y la IP."
        exit 1
    fi
    
    # Verificar Docker
    log "Verificando Docker..."
    if ! ssh_exec "docker --version && docker-compose --version"; then
        error "Docker o Docker Compose no están instalados en el servidor"
        exit 1
    fi
    
    # Crear directorios base
    log "Creando directorios base..."
    ssh_exec "mkdir -p ~/apps/CactusDashboard ~/scripts ~/backups"
    
    success "Servidor configurado correctamente"
}

# 2. Clonación y primer despliegue
initial_deploy() {
    log "🚀 Realizando despliegue inicial..."
    
    # Verificar si el repositorio ya existe
    if ssh_exec "[ -d '$REMOTE_APP_DIR/.git' ]"; then
        warn "El repositorio ya existe. Actualizando..."
        ssh_exec "cd $REMOTE_APP_DIR && git fetch origin main && git reset --hard origin/main"
    else
        log "Clonando repositorio..."
        ssh_exec "git clone $REPO_URL $REMOTE_APP_DIR"
    fi
    
    # Crear archivo .env si no existe
    log "Configurando archivo .env..."
    if ! ssh_exec "[ -f '$REMOTE_APP_DIR/.env' ]"; then
        log "Creando archivo .env desde .env.example..."
        ssh_exec "cd $REMOTE_APP_DIR && cp .env.example .env"
        
        # Configurar variables específicas para producción
        ssh_exec "cd $REMOTE_APP_DIR && sed -i 's/ENVIRONMENT=development/ENVIRONMENT=production/' .env"
        ssh_exec "cd $REMOTE_APP_DIR && sed -i 's/DEBUG=true/DEBUG=false/' .env"
    fi
    
    # Primer despliegue con Docker Compose
    log "Desplegando con Docker Compose..."
    ssh_exec "cd $REMOTE_APP_DIR && docker-compose -f docker-compose.simple.yml down || true"
    ssh_exec "cd $REMOTE_APP_DIR && docker-compose -f docker-compose.simple.yml up -d --build"
    
    success "Despliegue inicial completado"
}

# 3. Crear scripts de automatización
create_automation_scripts() {
    log "📝 Creando scripts de automatización..."
    
    # Script de backup
    cat > /tmp/backup.sh << 'EOF'
#!/usr/bin/env bash
set -e

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Iniciando backup..."
ts=$(date +'%Y-%m-%d_%H-%M')
tgt=~/backups/CactusDashboard_$ts.tar.gz

# Crear backup excluyendo directorios innecesarios
tar --exclude='backups' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='*.log' \
    -czf "$tgt" ~/apps/CactusDashboard

# Mantener solo los últimos 5 backups
ls -t ~/backups/CactusDashboard_* | tail -n +6 | xargs -r rm -f

log "Backup completado: $tgt"
log "Backups disponibles: $(ls -1 ~/backups/CactusDashboard_* | wc -l)"
EOF

    # Script de actualización
    cat > /tmp/update.sh << 'EOF'
#!/usr/bin/env bash
set -e

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR $(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "=== INICIANDO ACTUALIZACIÓN AUTOMÁTICA ==="

# Backup previo
log "Creando backup previo..."
bash ~/scripts/backup.sh

# Verificar si hay cambios en el repositorio
cd ~/apps/CactusDashboard
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "No hay cambios nuevos. Saliendo..."
    exit 0
fi

log "Nuevos cambios detectados. Actualizando..."

# Actualizar código
log "Actualizando código desde GitHub..."
git reset --hard origin/main

# Verificar si hay cambios en docker-compose.simple.yml
if git diff HEAD~1 HEAD --name-only | grep -q "docker-compose.simple.yml\|Dockerfile"; then
    log "Cambios en Docker detectados. Rebuild completo..."
    docker-compose -f docker-compose.simple.yml down
    docker-compose -f docker-compose.simple.yml up -d --build
else
    log "Sin cambios en Docker. Restart rápido..."
    docker-compose -f docker-compose.simple.yml restart
fi

# Verificar que los servicios estén funcionando
sleep 30
if docker-compose -f docker-compose.simple.yml ps | grep -q "Up"; then
    log "✅ Servicios funcionando correctamente"
else
    error "❌ Error en los servicios. Revisar logs."
    docker-compose -f docker-compose.simple.yml logs --tail=50
    exit 1
fi

log "=== ACTUALIZACIÓN COMPLETADA ==="
EOF

    # Script de monitoreo
    cat > /tmp/monitor.sh << 'EOF'
#!/usr/bin/env bash

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar servicios Docker
cd ~/apps/CactusDashboard

log "=== ESTADO DE SERVICIOS ==="
docker-compose -f docker-compose.simple.yml ps

log "=== SALUD DE CONTENEDORES ==="
for service in db redis backend frontend; do
    if docker-compose -f docker-compose.simple.yml ps $service | grep -q "Up"; then
        echo "✅ $service: OK"
    else
        echo "❌ $service: ERROR"
    fi
done

log "=== USO DE RECURSOS ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

log "=== ESPACIO EN DISCO ==="
df -h /

log "=== ÚLTIMOS LOGS ==="
docker-compose -f docker-compose.simple.yml logs --tail=10
EOF

    # Copiar scripts al servidor
    scp_copy /tmp/backup.sh "$SSH_USER@$SERVER_IP:$REMOTE_SCRIPTS_DIR/"
    scp_copy /tmp/update.sh "$SSH_USER@$SERVER_IP:$REMOTE_SCRIPTS_DIR/"
    scp_copy /tmp/monitor.sh "$SSH_USER@$SERVER_IP:$REMOTE_SCRIPTS_DIR/"
    
    # Dar permisos de ejecución
    ssh_exec "chmod +x $REMOTE_SCRIPTS_DIR/*.sh"
    
    # Probar el script de actualización
    log "Probando script de actualización..."
    ssh_exec "$REMOTE_SCRIPTS_DIR/update.sh"
    
    # Limpiar archivos temporales
    rm -f /tmp/backup.sh /tmp/update.sh /tmp/monitor.sh
    
    success "Scripts de automatización creados y probados"
}

# 4. Configurar automatización con cron
setup_cron() {
    log "⏰ Configurando automatización con cron..."
    
    # Crear entrada de cron
    cat > /tmp/crontab_entry << 'EOF'
# Actualización automática cada hora desde GitHub
0 * * * * /bin/bash /home/ubuntu/scripts/update.sh >> /home/ubuntu/update.log 2>&1

# Backup diario a las 2:00 AM
0 2 * * * /bin/bash /home/ubuntu/scripts/backup.sh >> /home/ubuntu/backup.log 2>&1

# Monitoreo cada 30 minutos
*/30 * * * * /bin/bash /home/ubuntu/scripts/monitor.sh >> /home/ubuntu/monitor.log 2>&1
EOF
    
    # Instalar crontab
    scp_copy /tmp/crontab_entry "$SSH_USER@$SERVER_IP:/tmp/"
    ssh_exec "crontab /tmp/crontab_entry && rm /tmp/crontab_entry"
    
    # Limpiar archivo temporal
    rm -f /tmp/crontab_entry
    
    success "Cron configurado para automatización continua"
}

# 5. Verificar despliegue
verify_deployment() {
    log "🔍 Verificando despliegue..."
    
    # Verificar servicios Docker
    log "Verificando servicios Docker..."
    ssh_exec "cd $REMOTE_APP_DIR && docker-compose -f docker-compose.simple.yml ps"
    
    # Verificar conectividad de servicios
    log "Verificando conectividad..."
    
    # Frontend
    if ssh_exec "curl -f http://localhost:3000 > /dev/null 2>&1"; then
        success "✅ Frontend (puerto 3000): OK"
    else
        warn "❌ Frontend (puerto 3000): No responde"
    fi
    
    # Backend
    if ssh_exec "curl -f http://localhost:8000/health > /dev/null 2>&1"; then
        success "✅ Backend (puerto 8000): OK"
    else
        warn "❌ Backend (puerto 8000): No responde"
    fi
    
    # Mostrar URLs públicas
    log "🌐 URLs de acceso:"
    echo "   Frontend: http://$SERVER_IP:3000"
    echo "   Backend API: http://$SERVER_IP:8000/docs"
    
    success "Verificación completada"
}

# Función principal
main() {
    case "${1:-deploy}" in
        "setup")
            setup_server
            ;;
        "deploy")
            setup_server
            initial_deploy
            create_automation_scripts
            setup_cron
            verify_deployment
            ;;
        "update")
            ssh_exec "$REMOTE_SCRIPTS_DIR/update.sh"
            ;;
        "backup")
            ssh_exec "$REMOTE_SCRIPTS_DIR/backup.sh"
            ;;
        "monitor")
            ssh_exec "$REMOTE_SCRIPTS_DIR/monitor.sh"
            ;;
        "status")
            verify_deployment
            ;;
        "logs")
            ssh_exec "cd $REMOTE_APP_DIR && docker-compose -f docker-compose.simple.yml logs --tail=50"
            ;;
        "ssh")
            ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP"
            ;;
        *)
            echo "Uso: $0 {setup|deploy|update|backup|monitor|status|logs|ssh}"
            echo ""
            echo "Comandos:"
            echo "  setup   - Configuración inicial del servidor"
            echo "  deploy  - Despliegue completo (setup + deploy + automation)"
            echo "  update  - Actualizar aplicación desde GitHub"
            echo "  backup  - Crear backup manual"
            echo "  monitor - Ver estado de servicios"
            echo "  status  - Verificar estado del despliegue"
            echo "  logs    - Ver logs de la aplicación"
            echo "  ssh     - Conectar por SSH al servidor"
            exit 1
            ;;
    esac
}

# Verificar dependencias locales
if ! command -v ssh >/dev/null 2>&1; then
    error "SSH no está disponible"
    exit 1
fi

if ! command -v scp >/dev/null 2>&1; then
    error "SCP no está disponible"
    exit 1
fi

# Expandir ruta de la clave SSH
SSH_KEY="${SSH_KEY/#\~/$HOME}"

if [ ! -f "$SSH_KEY" ]; then
    error "Clave SSH no encontrada: $SSH_KEY"
    exit 1
fi

# Ejecutar función principal
main "$@"