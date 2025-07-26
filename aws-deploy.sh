#!/bin/bash

# =============================================================================
# 🌵 CACTUS WEALTH - AWS DEPLOYMENT SCRIPT
# =============================================================================
# Comprehensive AWS deployment script for CactusDashboard
# Author: Principal Platform Architect
# Version: 2.0.0 - Production Ready
# =============================================================================

set -euo pipefail

# Configuration
AWS_IP="${AWS_IP:-3.141.107.33}"
AWS_USER="${AWS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-./cactus-key.pem}"
PROJECT_NAME="cactus-wealth"
GITHUB_REPO="https://github.com/Gigiisanta/CactusDashboard.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Verificando prerequisitos..."
    
    if [ ! -f "$SSH_KEY" ]; then
        error "SSH key no encontrada: $SSH_KEY"
    fi
    
    chmod 600 "$SSH_KEY"
    
    # Test SSH connection
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        error "No se puede conectar al servidor AWS: $AWS_IP"
    fi
    
    success "Prerequisitos verificados"
}

# Setup AWS server
setup_aws_server() {
    log "🚀 Configurando servidor AWS..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" << 'EOF'
        set -e
        
        # Update system
        sudo apt-get update -y
        sudo apt-get upgrade -y
        
        # Install Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Install Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Install Git
        if ! command -v git &> /dev/null; then
            sudo apt-get install -y git
        fi
        
        # Install Node.js and npm
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install Python and pip
        if ! command -v python3 &> /dev/null; then
            sudo apt-get install -y python3 python3-pip python3-venv
        fi
        
        # Install nginx
        if ! command -v nginx &> /dev/null; then
            sudo apt-get install -y nginx
        fi
        
        # Configure firewall
        sudo ufw allow 22
        sudo ufw allow 80
        sudo ufw allow 443
        sudo ufw allow 3000
        sudo ufw allow 8000
        sudo ufw --force enable
        
        echo "✅ Servidor AWS configurado exitosamente"
EOF
    
    success "Servidor AWS configurado"
}

# Deploy application
deploy_application() {
    log "🚀 Desplegando aplicación..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" << EOF
        set -e
        
        # Create project directory
        mkdir -p /home/$AWS_USER/$PROJECT_NAME
        cd /home/$AWS_USER/$PROJECT_NAME
        
        # Clone or update repository
        if [ -d ".git" ]; then
            echo "📥 Actualizando repositorio..."
            git fetch origin
            git reset --hard origin/main
            git clean -fd
        else
            echo "📥 Clonando repositorio..."
            git clone $GITHUB_REPO .
        fi
        
        # Create environment file
        if [ ! -f ".env" ]; then
            cp .env.example .env
            echo "⚠️  Archivo .env creado desde .env.example"
            echo "⚠️  Por favor, configura las variables de entorno necesarias"
        fi
        
        # Stop existing services
        if [ -f "docker-compose.yml" ]; then
            docker-compose down || true
        fi
        
        # Build and start services
        echo "🔨 Construyendo y iniciando servicios..."
        docker-compose up -d --build
        
        # Wait for services to be ready
        echo "⏳ Esperando que los servicios estén listos..."
        sleep 30
        
        # Check service status
        docker-compose ps
        
        echo "✅ Aplicación desplegada exitosamente"
EOF
    
    success "Aplicación desplegada"
}

# Configure nginx
configure_nginx() {
    log "🔧 Configurando nginx..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" << 'EOF'
        set -e
        
        # Create nginx configuration
        sudo tee /etc/nginx/sites-available/cactus-wealth << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/cactus-wealth /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload nginx
        sudo nginx -t
        sudo systemctl reload nginx
        sudo systemctl enable nginx
        
        echo "✅ Nginx configurado exitosamente"
EOF
    
    success "Nginx configurado"
}

# Check deployment status
check_deployment() {
    log "🔍 Verificando estado del despliegue..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" << 'EOF'
        set -e
        
        cd /home/ubuntu/cactus-wealth
        
        echo "📊 Estado de los contenedores:"
        docker-compose ps
        
        echo ""
        echo "📊 Estado de nginx:"
        sudo systemctl status nginx --no-pager -l
        
        echo ""
        echo "🔍 Verificando conectividad:"
        
        # Check backend health
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            echo "✅ Backend: OK"
        else
            echo "❌ Backend: ERROR"
        fi
        
        # Check frontend
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            echo "✅ Frontend: OK"
        else
            echo "❌ Frontend: ERROR"
        fi
        
        # Check nginx
        if curl -f http://localhost >/dev/null 2>&1; then
            echo "✅ Nginx: OK"
        else
            echo "❌ Nginx: ERROR"
        fi
        
        echo ""
        echo "🌐 URLs de acceso:"
        echo "  Frontend: http://$(curl -s ifconfig.me)"
        echo "  Backend API: http://$(curl -s ifconfig.me)/api"
        echo "  Health Check: http://$(curl -s ifconfig.me)/health"
EOF
    
    success "Verificación completada"
}

# Show logs
show_logs() {
    log "📋 Mostrando logs..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_IP" << 'EOF'
        cd /home/ubuntu/cactus-wealth
        
        echo "📋 Logs del backend:"
        docker-compose logs --tail=20 backend
        
        echo ""
        echo "📋 Logs del frontend:"
        docker-compose logs --tail=20 frontend
        
        echo ""
        echo "📋 Logs de nginx:"
        sudo tail -20 /var/log/nginx/access.log
        sudo tail -20 /var/log/nginx/error.log
EOF
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "setup")
            check_prerequisites
            setup_aws_server
            ;;
        "deploy")
            check_prerequisites
            deploy_application
            configure_nginx
            check_deployment
            ;;
        "status")
            check_deployment
            ;;
        "logs")
            show_logs
            ;;
        "full")
            check_prerequisites
            setup_aws_server
            deploy_application
            configure_nginx
            check_deployment
            ;;
        *)
            echo "Uso: $0 {setup|deploy|status|logs|full}"
            echo ""
            echo "Comandos:"
            echo "  setup  - Configurar servidor AWS"
            echo "  deploy - Desplegar aplicación"
            echo "  status - Verificar estado"
            echo "  logs   - Mostrar logs"
            echo "  full   - Configuración completa + despliegue"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"