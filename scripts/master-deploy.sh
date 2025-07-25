#!/bin/bash

# 🚀 Script Maestro de Despliegue AWS - Cactus Dashboard
# Orquesta todo el proceso de despliegue en AWS Free Tier

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/tmp/cactus-deploy"
DEPLOY_LOG="$LOG_DIR/master-deploy.log"

# Variables de entorno
AWS_REGION="${AWS_REGION:-us-east-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
KEY_NAME="${KEY_NAME:-cactus-dashboard-key}"
DOMAIN_NAME="${DOMAIN_NAME:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Crear directorio de logs
mkdir -p "$LOG_DIR"

# Funciones de logging
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$DEPLOY_LOG"
}

warn() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}$message${NC}"
    echo "$message" >> "$DEPLOY_LOG"
}

error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}$message${NC}"
    echo "$message" >> "$DEPLOY_LOG"
}

success() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$DEPLOY_LOG"
}

info() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1"
    echo -e "${BLUE}$message${NC}"
    echo "$message" >> "$DEPLOY_LOG"
}

# Función para mostrar banner
show_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🌵 CACTUS DASHBOARD - DESPLIEGUE MAESTRO AWS 🚀           ║
║                                                              ║
║   Despliegue automatizado en AWS Free Tier                  ║
║   ✓ Infraestructura con Terraform                           ║
║   ✓ Aplicación con Docker Compose                           ║
║   ✓ Seguridad y monitoreo completo                          ║
║   ✓ SSL automático con Let's Encrypt                        ║
║   ✓ Optimización de rendimiento                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Verificar dependencias locales
check_local_dependencies() {
    log "Verificando dependencias locales..."
    
    local missing_deps=()
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        missing_deps+=("aws-cli")
    fi
    
    # Verificar Terraform
    if ! command -v terraform &> /dev/null; then
        missing_deps+=("terraform")
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Verificar ssh-keygen
    if ! command -v ssh-keygen &> /dev/null; then
        missing_deps+=("openssh-client")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Dependencias faltantes: ${missing_deps[*]}"
        echo ""
        echo "Instala las dependencias faltantes:"
        echo "  AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        echo "  Terraform: https://developer.hashicorp.com/terraform/downloads"
        echo "  Docker: https://docs.docker.com/get-docker/"
        echo ""
        return 1
    fi
    
    success "Todas las dependencias locales están disponibles"
}

# Verificar configuración AWS
check_aws_configuration() {
    log "Verificando configuración AWS..."
    
    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        error "Credenciales AWS no configuradas"
        echo ""
        echo "Configura AWS CLI:"
        echo "  aws configure"
        echo ""
        return 1
    fi
    
    # Obtener información de la cuenta
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    
    info "Cuenta AWS: $account_id"
    info "Usuario: $user_arn"
    
    success "Configuración AWS verificada"
}

# Configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."
    
    # Archivo de configuración
    local env_file="$PROJECT_ROOT/.env.deploy"
    
    # Crear archivo de configuración si no existe
    if [ ! -f "$env_file" ]; then
        log "Creando archivo de configuración..."
        
        cat > "$env_file" << EOF
# Configuración de despliegue AWS - Cactus Dashboard
AWS_REGION=$AWS_REGION
INSTANCE_TYPE=$INSTANCE_TYPE
KEY_NAME=$KEY_NAME
DOMAIN_NAME=$DOMAIN_NAME
ALERT_EMAIL=$ALERT_EMAIL
SLACK_WEBHOOK=$SLACK_WEBHOOK

# Configuración de aplicación
PROJECT_NAME=cactus-dashboard
ENVIRONMENT=production
DEBUG=false

# Base de datos
DB_NAME=cactus_dashboard
DB_USER=cactus_user
DB_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Claves secretas
SECRET_KEY=$(openssl rand -base64 64)
JWT_SECRET=$(openssl rand -base64 64)

# Configuración de backup
BACKUP_RETENTION_DAYS=7
BACKUP_S3_BUCKET=cactus-dashboard-backups-$(date +%s)

# Configuración de monitoreo
HEALTH_CHECK_INTERVAL=300
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85
ALERT_DISK_THRESHOLD=90
EOF
        
        success "Archivo de configuración creado: $env_file"
    else
        log "Usando archivo de configuración existente: $env_file"
    fi
    
    # Cargar variables
    source "$env_file"
    
    success "Variables de entorno configuradas"
}

# Paso 1: Configuración inicial
step_1_initial_setup() {
    echo -e "${PURPLE}📋 PASO 1: CONFIGURACIÓN INICIAL${NC}"
    echo "================================="
    echo ""
    
    # Ejecutar script de configuración inicial
    if [ -f "$SCRIPT_DIR/setup-aws.sh" ]; then
        log "Ejecutando configuración inicial..."
        bash "$SCRIPT_DIR/setup-aws.sh"
        success "Configuración inicial completada"
    else
        warn "Script setup-aws.sh no encontrado, saltando..."
    fi
    
    echo ""
}

# Paso 2: Despliegue de infraestructura
step_2_infrastructure() {
    echo -e "${PURPLE}🏗️ PASO 2: DESPLIEGUE DE INFRAESTRUCTURA${NC}"
    echo "=========================================="
    echo ""
    
    log "Desplegando infraestructura con Terraform..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # Inicializar Terraform
    log "Inicializando Terraform..."
    terraform init
    
    # Planificar despliegue
    log "Planificando despliegue..."
    terraform plan -out=tfplan
    
    # Aplicar cambios
    log "Aplicando cambios de infraestructura..."
    terraform apply tfplan
    
    # Obtener outputs
    local instance_ip=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
    local instance_id=$(terraform output -raw instance_id 2>/dev/null || echo "")
    
    if [ -n "$instance_ip" ]; then
        success "Infraestructura desplegada exitosamente"
        info "IP pública: $instance_ip"
        info "Instance ID: $instance_id"
        
        # Guardar información de la instancia
        echo "INSTANCE_IP=$instance_ip" >> "$PROJECT_ROOT/.env.deploy"
        echo "INSTANCE_ID=$instance_id" >> "$PROJECT_ROOT/.env.deploy"
    else
        error "Error obteniendo información de la instancia"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Paso 3: Esperar que la instancia esté lista
step_3_wait_for_instance() {
    echo -e "${PURPLE}⏳ PASO 3: ESPERANDO INSTANCIA${NC}"
    echo "==============================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Esperando que la instancia esté lista..."
    log "IP: $INSTANCE_IP"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Intento $attempt/$max_attempts - Verificando conectividad SSH..."
        
        if ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" "echo 'SSH conectado'" &> /dev/null; then
            success "Instancia lista y accesible por SSH"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Timeout esperando que la instancia esté lista"
            return 1
        fi
        
        log "Esperando 30 segundos antes del siguiente intento..."
        sleep 30
        ((attempt++))
    done
    
    echo ""
}

# Paso 4: Configuración de seguridad
step_4_security() {
    echo -e "${PURPLE}🔒 PASO 4: CONFIGURACIÓN DE SEGURIDAD${NC}"
    echo "======================================"
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Configurando seguridad en la instancia..."
    
    # Copiar script de seguridad
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/security-setup.sh" ubuntu@"$INSTANCE_IP":/tmp/
    
    # Ejecutar configuración de seguridad
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "chmod +x /tmp/security-setup.sh && sudo /tmp/security-setup.sh setup"
    
    success "Configuración de seguridad completada"
    echo ""
}

# Paso 5: Optimización de rendimiento
step_5_performance() {
    echo -e "${PURPLE}⚡ PASO 5: OPTIMIZACIÓN DE RENDIMIENTO${NC}"
    echo "======================================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Optimizando rendimiento del sistema..."
    
    # Copiar script de rendimiento
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/performance-setup.sh" ubuntu@"$INSTANCE_IP":/tmp/
    
    # Ejecutar optimización
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "chmod +x /tmp/performance-setup.sh && sudo /tmp/performance-setup.sh setup"
    
    success "Optimización de rendimiento completada"
    echo ""
}

# Paso 6: Despliegue de aplicación
step_6_application() {
    echo -e "${PURPLE}🚀 PASO 6: DESPLIEGUE DE APLICACIÓN${NC}"
    echo "==================================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Desplegando aplicación Cactus Dashboard..."
    
    # Copiar archivos de la aplicación
    log "Copiando archivos de aplicación..."
    
    # Crear directorio remoto
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "mkdir -p /home/ubuntu/cactus-dashboard"
    
    # Copiar docker-compose y configuración
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$PROJECT_ROOT/docker-compose.prod.yml" ubuntu@"$INSTANCE_IP":/home/ubuntu/cactus-dashboard/
    
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$PROJECT_ROOT/.env.aws.example" ubuntu@"$INSTANCE_IP":/home/ubuntu/cactus-dashboard/.env
    
    # Copiar scripts de despliegue
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/deploy-aws.sh" ubuntu@"$INSTANCE_IP":/home/ubuntu/cactus-dashboard/
    
    # Ejecutar despliegue
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "cd /home/ubuntu/cactus-dashboard && chmod +x deploy-aws.sh && ./deploy-aws.sh deploy"
    
    success "Aplicación desplegada exitosamente"
    echo ""
}

# Paso 7: Configuración SSL
step_7_ssl() {
    echo -e "${PURPLE}🔐 PASO 7: CONFIGURACIÓN SSL${NC}"
    echo "============================="
    echo ""
    
    if [ -z "$DOMAIN_NAME" ]; then
        warn "Dominio no configurado, saltando configuración SSL"
        echo ""
        return 0
    fi
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Configurando SSL para dominio: $DOMAIN_NAME"
    
    # Copiar script SSL
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/ssl-setup.sh" ubuntu@"$INSTANCE_IP":/tmp/
    
    # Ejecutar configuración SSL
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "chmod +x /tmp/ssl-setup.sh && sudo DOMAIN_NAME=$DOMAIN_NAME /tmp/ssl-setup.sh setup"
    
    success "Configuración SSL completada"
    echo ""
}

# Paso 8: Configuración de alertas
step_8_alerts() {
    echo -e "${PURPLE}🚨 PASO 8: CONFIGURACIÓN DE ALERTAS${NC}"
    echo "==================================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Configurando sistema de alertas..."
    
    # Copiar script de alertas
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/alerts-setup.sh" ubuntu@"$INSTANCE_IP":/tmp/
    
    # Ejecutar configuración de alertas
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "chmod +x /tmp/alerts-setup.sh && sudo ALERT_EMAIL='$ALERT_EMAIL' SLACK_WEBHOOK='$SLACK_WEBHOOK' /tmp/alerts-setup.sh setup"
    
    success "Sistema de alertas configurado"
    echo ""
}

# Paso 9: Configuración de backups
step_9_backups() {
    echo -e "${PURPLE}💾 PASO 9: CONFIGURACIÓN DE BACKUPS${NC}"
    echo "==================================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Configurando sistema de backups..."
    
    # Copiar script de backups
    scp -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/backup-aws.sh" ubuntu@"$INSTANCE_IP":/tmp/
    
    # Ejecutar configuración de backups
    ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
        "chmod +x /tmp/backup-aws.sh && sudo /tmp/backup-aws.sh setup"
    
    success "Sistema de backups configurado"
    echo ""
}

# Paso 10: Verificación final
step_10_verification() {
    echo -e "${PURPLE}✅ PASO 10: VERIFICACIÓN FINAL${NC}"
    echo "==============================="
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    log "Verificando despliegue..."
    
    # Verificar servicios
    log "Verificando servicios de la aplicación..."
    
    local services_ok=true
    
    # Verificar backend
    if curl -s --max-time 10 "http://$INSTANCE_IP:8000/health" > /dev/null; then
        success "✓ Backend respondiendo"
    else
        error "✗ Backend no responde"
        services_ok=false
    fi
    
    # Verificar frontend
    if curl -s --max-time 10 "http://$INSTANCE_IP:3000" > /dev/null; then
        success "✓ Frontend respondiendo"
    else
        error "✗ Frontend no responde"
        services_ok=false
    fi
    
    # Verificar Nginx
    if curl -s --max-time 10 "http://$INSTANCE_IP" > /dev/null; then
        success "✓ Nginx respondiendo"
    else
        warn "⚠ Nginx no responde (puede ser normal si no está configurado)"
    fi
    
    if [ "$services_ok" = true ]; then
        success "Todos los servicios principales están funcionando"
    else
        warn "Algunos servicios no están respondiendo correctamente"
    fi
    
    echo ""
}

# Mostrar resumen final
show_final_summary() {
    echo -e "${CYAN}🎉 DESPLIEGUE COMPLETADO${NC}"
    echo "========================"
    echo ""
    
    source "$PROJECT_ROOT/.env.deploy"
    
    echo -e "${GREEN}✅ Cactus Dashboard desplegado exitosamente en AWS${NC}"
    echo ""
    echo -e "${BLUE}📋 Información del despliegue:${NC}"
    echo "  🌐 IP pública: $INSTANCE_IP"
    echo "  🔧 Instance ID: $INSTANCE_ID"
    echo "  🌍 Región: $AWS_REGION"
    echo "  💻 Tipo de instancia: $INSTANCE_TYPE"
    echo ""
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "  📱 Frontend: http://$INSTANCE_IP:3000"
    echo "  🔧 Backend API: http://$INSTANCE_IP:8000"
    echo "  📊 Health Check: http://$INSTANCE_IP:8000/health"
    
    if [ -n "$DOMAIN_NAME" ]; then
        echo "  🌐 Dominio: https://$DOMAIN_NAME"
    fi
    
    echo ""
    echo -e "${BLUE}🔐 Acceso SSH:${NC}"
    echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$INSTANCE_IP"
    echo ""
    echo -e "${BLUE}📊 Comandos útiles:${NC}"
    echo "  # Ver estado de servicios"
    echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$INSTANCE_IP 'cd cactus-dashboard && ./deploy-aws.sh status'"
    echo ""
    echo "  # Ver logs"
    echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$INSTANCE_IP 'cd cactus-dashboard && ./deploy-aws.sh logs'"
    echo ""
    echo "  # Crear backup"
    echo "  ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$INSTANCE_IP 'sudo /tmp/backup-aws.sh backup'"
    echo ""
    echo -e "${YELLOW}⚠️  Notas importantes:${NC}"
    echo "  • La aplicación puede tardar unos minutos en estar completamente lista"
    echo "  • Los backups automáticos están configurados diariamente"
    echo "  • Las alertas están configuradas para monitoreo 24/7"
    echo "  • Revisa los logs si algún servicio no responde"
    echo ""
    echo -e "${GREEN}🎊 ¡Disfruta tu Cactus Dashboard en AWS!${NC}"
    echo ""
}

# Función de limpieza en caso de error
cleanup_on_error() {
    error "Error durante el despliegue"
    echo ""
    echo "Para limpiar recursos creados:"
    echo "  cd $PROJECT_ROOT/terraform && terraform destroy"
    echo ""
    echo "Logs disponibles en: $DEPLOY_LOG"
}

# Función principal de despliegue
deploy_complete() {
    # Configurar trap para limpieza en caso de error
    trap cleanup_on_error ERR
    
    show_banner
    
    # Verificaciones iniciales
    check_local_dependencies
    check_aws_configuration
    setup_environment
    
    # Pasos de despliegue
    step_1_initial_setup
    step_2_infrastructure
    step_3_wait_for_instance
    step_4_security
    step_5_performance
    step_6_application
    step_7_ssl
    step_8_alerts
    step_9_backups
    step_10_verification
    
    # Resumen final
    show_final_summary
    
    # Remover trap
    trap - ERR
}

# Función para mostrar estado
show_status() {
    echo -e "${CYAN}📊 ESTADO DEL DESPLIEGUE${NC}"
    echo "========================"
    echo ""
    
    if [ ! -f "$PROJECT_ROOT/.env.deploy" ]; then
        warn "No se encontró configuración de despliegue"
        return 1
    fi
    
    source "$PROJECT_ROOT/.env.deploy"
    
    echo -e "${BLUE}Información básica:${NC}"
    echo "  IP: ${INSTANCE_IP:-'No disponible'}"
    echo "  Instance ID: ${INSTANCE_ID:-'No disponible'}"
    echo "  Región: $AWS_REGION"
    echo ""
    
    if [ -n "${INSTANCE_IP:-}" ]; then
        echo -e "${BLUE}Estado de servicios:${NC}"
        
        # Verificar conectividad
        if ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" "echo 'OK'" &> /dev/null; then
            echo "  ✓ SSH conectado"
            
            # Verificar servicios remotos
            ssh -i "$HOME/.ssh/${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@"$INSTANCE_IP" \
                "cd cactus-dashboard && ./deploy-aws.sh status" 2>/dev/null || echo "  ⚠ Error obteniendo estado remoto"
        else
            echo "  ✗ SSH no disponible"
        fi
    fi
}

# Función para destruir infraestructura
destroy_infrastructure() {
    echo -e "${RED}💥 DESTRUIR INFRAESTRUCTURA${NC}"
    echo "============================"
    echo ""
    
    warn "Esta acción eliminará TODA la infraestructura AWS"
    read -p "¿Estás seguro? (escribe 'DESTROY' para confirmar): " confirm
    
    if [ "$confirm" != "DESTROY" ]; then
        log "Operación cancelada"
        return 0
    fi
    
    log "Destruyendo infraestructura..."
    
    cd "$PROJECT_ROOT/terraform"
    terraform destroy -auto-approve
    
    # Limpiar archivos locales
    rm -f "$PROJECT_ROOT/.env.deploy"
    rm -rf "$LOG_DIR"
    
    success "Infraestructura destruida"
}

# Función principal
main() {
    case "${1:-deploy}" in
        "deploy"|"install")
            deploy_complete
            ;;
        "status")
            show_status
            ;;
        "destroy")
            destroy_infrastructure
            ;;
        "logs")
            if [ -f "$DEPLOY_LOG" ]; then
                tail -f "$DEPLOY_LOG"
            else
                warn "No hay logs disponibles"
            fi
            ;;
        *)
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos:"
            echo "  deploy   - Despliegue completo (por defecto)"
            echo "  status   - Mostrar estado del despliegue"
            echo "  destroy  - Destruir infraestructura"
            echo "  logs     - Ver logs de despliegue"
            echo ""
            echo "Variables de entorno:"
            echo "  AWS_REGION     - Región AWS (default: us-east-1)"
            echo "  INSTANCE_TYPE  - Tipo de instancia (default: t3.micro)"
            echo "  KEY_NAME       - Nombre del key pair (default: cactus-dashboard-key)"
            echo "  DOMAIN_NAME    - Dominio para SSL (opcional)"
            echo "  ALERT_EMAIL    - Email para alertas (opcional)"
            echo "  SLACK_WEBHOOK  - Webhook de Slack (opcional)"
            echo ""
            ;;
    esac
}

# Ejecutar función principal
main "$@"