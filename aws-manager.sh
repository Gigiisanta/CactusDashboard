#!/bin/bash

# =============================================================================
# AWS MANAGER UNIFICADO - CACTUS DASHBOARD
# =============================================================================
# Script consolidado que reemplaza múltiples scripts AWS dispersos
# Funcionalidades: setup, deploy, monitor, backup, security, ssl
# =============================================================================

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
AWS_LOG="$LOG_DIR/aws-manager.log"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$AWS_LOG"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$AWS_LOG"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$AWS_LOG"; exit 1; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$AWS_LOG"; }

# =============================================================================
# FUNCIONES COMUNES
# =============================================================================

check_aws_environment() {
    log "🔍 Verificando entorno AWS..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI no está instalado"
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI no está configurado correctamente"
    fi
    
    success "Entorno AWS verificado"
}

check_system_resources() {
    log "📊 Verificando recursos del sistema..."
    
    # Verificar memoria
    local mem_total=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$mem_total" -lt 900 ]; then
        warn "Memoria disponible: ${mem_total}MB (recomendado: >900MB)"
    fi
    
    # Verificar espacio en disco
    local disk_free=$(df / | awk 'NR==2{printf "%.0f", $4/1024}')
    if [ "$disk_free" -lt 2000 ]; then
        warn "Espacio libre: ${disk_free}MB (recomendado: >2GB)"
    fi
    
    success "Recursos del sistema verificados"
}

install_dependencies() {
    log "📦 Instalando dependencias..."
    
    # Actualizar sistema
    sudo apt-get update -y
    sudo apt-get upgrade -y
    
    # Dependencias básicas
    sudo apt-get install -y \
        curl wget git unzip \
        htop tree jq \
        nginx certbot python3-certbot-nginx \
        fail2ban ufw \
        awscli
    
    success "Dependencias instaladas"
}

setup_swap() {
    log "💾 Configurando swap optimizado..."
    
    # Crear swap de 1GB para t3.micro
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 1G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Optimizar configuración
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    success "Swap configurado"
}

install_docker() {
    log "🐳 Instalando Docker..."
    
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Configurar Docker para t3.micro
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2"
}
EOF
    
    sudo systemctl restart docker
    success "Docker instalado y configurado"
}

setup_firewall() {
    log "🔥 Configurando firewall..."
    
    # Configurar UFW
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Puertos necesarios
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    sudo ufw --force enable
    success "Firewall configurado"
}

setup_security() {
    log "🔒 Configurando seguridad..."
    
    # Fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    # SSH seguro
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sudo systemctl restart ssh
    
    success "Seguridad configurada"
}

# =============================================================================
# COMANDOS PRINCIPALES
# =============================================================================

cmd_setup() {
    log "🚀 Iniciando setup completo de AWS..."
    
    check_aws_environment
    check_system_resources
    install_dependencies
    setup_swap
    install_docker
    setup_firewall
    setup_security
    
    success "Setup de AWS completado"
}

cmd_deploy() {
    local domain="${1:-}"
    
    log "🚀 Iniciando deployment..."
    
    if [ -z "$domain" ]; then
        error "Uso: $0 deploy <domain>"
    fi
    
    # Verificar prerrequisitos
    check_aws_environment
    
    # Clonar proyecto si no existe
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        cd "$(dirname "$PROJECT_ROOT")"
        git clone https://github.com/your-repo/CactusDashboard.git
        cd CactusDashboard
    fi
    
    # Configurar variables de entorno
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        warn "Configurar variables en .env antes de continuar"
        return 1
    fi
    
    # Configurar Nginx
    sudo cp "$PROJECT_ROOT/nginx.conf" /etc/nginx/sites-available/cactus-dashboard
    sudo ln -sf /etc/nginx/sites-available/cactus-dashboard /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Reemplazar dominio
    sudo sed -i "s/YOUR_DOMAIN_HERE/$domain/g" /etc/nginx/sites-available/cactus-dashboard
    
    # Iniciar aplicación
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml up -d
    
    # Configurar SSL
    sudo certbot --nginx -d "$domain" --non-interactive --agree-tos --email "admin@$domain"
    
    success "Deployment completado para $domain"
}

cmd_monitor() {
    log "📊 Iniciando monitoreo..."
    
    while true; do
        clear
        echo "=== CACTUS DASHBOARD - MONITOREO ==="
        echo "Fecha: $(date)"
        echo ""
        
        # Estado de servicios
        echo "🐳 DOCKER CONTAINERS:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        # Recursos del sistema
        echo "💾 RECURSOS DEL SISTEMA:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "RAM: $(free -h | awk 'NR==2{printf "%.1f/%.1fGB (%.0f%%)", $3/1024/1024, $2/1024/1024, $3*100/$2}')"
        echo "Disco: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3, $2, $5}')"
        echo ""
        
        # Health checks
        echo "🏥 HEALTH CHECKS:"
        curl -s --max-time 5 http://localhost:8000/health > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: FAIL"
        curl -s --max-time 5 http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: FAIL"
        
        sleep 30
    done
}

cmd_backup() {
    log "💾 Iniciando backup..."
    
    local backup_dir="/tmp/cactus-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup de base de datos
    if docker ps | grep -q "db"; then
        docker exec $(docker ps -qf name=db) pg_dump -U cactus_user cactus_db > "$backup_dir/database.sql"
        success "Base de datos respaldada"
    fi
    
    # Backup de archivos de configuración
    cp "$PROJECT_ROOT/.env" "$backup_dir/"
    cp -r "$PROJECT_ROOT/logs" "$backup_dir/"
    
    # Comprimir
    tar -czf "/tmp/cactus-backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "/tmp" "$(basename "$backup_dir")"
    rm -rf "$backup_dir"
    
    success "Backup completado en /tmp/"
}

cmd_ssl() {
    local domain="${1:-}"
    
    if [ -z "$domain" ]; then
        error "Uso: $0 ssl <domain>"
    fi
    
    log "🔒 Configurando SSL para $domain..."
    
    # Verificar Nginx
    sudo nginx -t || error "Configuración de Nginx inválida"
    
    # Obtener certificado
    sudo certbot --nginx -d "$domain" --non-interactive --agree-tos --email "admin@$domain"
    
    # Configurar renovación automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    success "SSL configurado para $domain"
}

cmd_logs() {
    local service="${1:-all}"
    
    case "$service" in
        "backend")
            docker logs -f $(docker ps -qf name=backend)
            ;;
        "frontend")
            docker logs -f $(docker ps -qf name=frontend)
            ;;
        "db")
            docker logs -f $(docker ps -qf name=db)
            ;;
        "nginx")
            sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
            ;;
        "aws")
            tail -f "$AWS_LOG"
            ;;
        *)
            echo "Logs disponibles: backend, frontend, db, nginx, aws"
            ;;
    esac
}

cmd_status() {
    log "📊 Estado del sistema..."
    
    echo "🐳 Docker Containers:"
    docker ps
    echo ""
    
    echo "🔥 Firewall Status:"
    sudo ufw status
    echo ""
    
    echo "🔒 SSL Certificates:"
    sudo certbot certificates
    echo ""
    
    echo "💾 Disk Usage:"
    df -h
    echo ""
    
    echo "🧠 Memory Usage:"
    free -h
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

show_help() {
    cat << EOF
🌵 AWS Manager - Cactus Dashboard

COMANDOS DISPONIBLES:
  setup                 - Setup completo del servidor AWS
  deploy <domain>       - Deploy de la aplicación
  monitor              - Monitoreo en tiempo real
  backup               - Crear backup de la aplicación
  ssl <domain>         - Configurar SSL para dominio
  logs [service]       - Ver logs (backend|frontend|db|nginx|aws)
  status               - Estado general del sistema
  help                 - Mostrar esta ayuda

EJEMPLOS:
  $0 setup
  $0 deploy mi-dominio.com
  $0 ssl mi-dominio.com
  $0 logs backend
  $0 monitor

EOF
}

# Crear directorio de logs
mkdir -p "$LOG_DIR"

# Procesar comando
case "${1:-help}" in
    "setup")
        cmd_setup
        ;;
    "deploy")
        cmd_deploy "${2:-}"
        ;;
    "monitor")
        cmd_monitor
        ;;
    "backup")
        cmd_backup
        ;;
    "ssl")
        cmd_ssl "${2:-}"
        ;;
    "logs")
        cmd_logs "${2:-all}"
        ;;
    "status")
        cmd_status
        ;;
    "help"|*)
        show_help
        ;;
esac