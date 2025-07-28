#!/bin/bash

# User Data Script para configuración automática de Cactus Dashboard en AWS EC2
# Este script se ejecuta automáticamente cuando se crea la instancia

set -euo pipefail

# Variables de configuración
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
LOG_FILE="/var/log/cactus-setup.log"

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Redirigir toda la salida al log
exec > >(tee -a "$LOG_FILE")
exec 2>&1

log "🚀 Iniciando configuración automática de Cactus Dashboard"
log "Proyecto: $PROJECT_NAME, Entorno: $ENVIRONMENT"

# Actualizar sistema
log "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
log "📥 Instalando dependencias básicas..."
apt install -y \
    curl \
    wget \
    git \
    htop \
    nano \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    bc \
    fail2ban \
    ufw

# Configurar swap para t3.micro
log "💾 Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    log "✅ Swap configurado"
fi

# Instalar Docker
log "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    rm get-docker.sh
    
    # Configurar Docker
    mkdir -p /etc/docker
    cat << 'EOF' > /etc/docker/daemon.json
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2"
}
EOF
    
    systemctl restart docker
    systemctl enable docker
    log "✅ Docker instalado"
fi

# Instalar Docker Compose
log "🔧 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
    curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "✅ Docker Compose instalado"
fi

# Configurar firewall
log "🔒 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Frontend (temporal)
ufw allow 8000/tcp  # Backend (temporal)
ufw --force enable

# Configurar fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Crear estructura de directorios
log "📁 Creando estructura de directorios..."
mkdir -p /var/log/cactus
mkdir -p /opt/cactus/{backups,data,config}
mkdir -p /opt/cactus/data/{postgres,redis,n8n}
chown -R ubuntu:ubuntu /opt/cactus
chown -R ubuntu:ubuntu /var/log/cactus

# Instalar Nginx
log "🌐 Instalando Nginx..."
apt install -y nginx
systemctl enable nginx

# Clonar repositorio como usuario ubuntu
log "📂 Clonando repositorio..."
cd /home/ubuntu
if [ ! -d "CactusDashboard" ]; then
    # Clonar desde el repositorio correcto
    sudo -u ubuntu git clone https://github.com/Gigiisanta/CactusDashboard.git
    chown -R ubuntu:ubuntu CactusDashboard
    log "✅ Repositorio clonado"
else
    log "ℹ️ Repositorio ya existe"
fi

# Configurar aplicación
log "⚙️ Configurando aplicación..."
cd /home/ubuntu/CactusDashboard

# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# Ejecutar configuración como usuario ubuntu
log "🚀 Ejecutando configuración de aplicación..."
sudo -u ubuntu ./scripts/deploy-aws.sh setup

# Desplegar aplicación
log "🚀 Desplegando aplicación..."
sudo -u ubuntu ./scripts/deploy-aws.sh deploy

# Instalar CloudWatch Agent
log "📊 Instalando CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configurar CloudWatch Agent
cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "agent": {
        "metrics_collection_interval": 300,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "namespace": "CactusDashboard/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 300
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 300,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 300,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 300
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 300
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 300
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/cactus/*.log",
                        "log_group_name": "cactus-dashboard",
                        "log_stream_name": "{instance_id}/application"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "cactus-dashboard",
                        "log_stream_name": "{instance_id}/nginx-access"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "cactus-dashboard",
                        "log_stream_name": "{instance_id}/nginx-error"
                    }
                ]
            }
        }
    }
}
EOF

# Iniciar CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Crear script de verificación de salud
log "🏥 Configurando verificación de salud..."
cat << 'EOF' > /opt/cactus/health-check.sh
#!/bin/bash

# Script de verificación de salud para Cactus Dashboard

HEALTH_LOG="/var/log/cactus/health.log"

check_service() {
    local service_name="$1"
    local url="$2"
    
    if curl -f -s "$url" >/dev/null 2>&1; then
        echo "[$(date)] ✅ $service_name: OK" >> "$HEALTH_LOG"
        return 0
    else
        echo "[$(date)] ❌ $service_name: FAIL" >> "$HEALTH_LOG"
        return 1
    fi
}

# Verificar servicios
check_service "Frontend" "http://localhost:3000"
check_service "Backend" "http://localhost:8000/health"
check_service "Nginx" "http://localhost:80"

# Verificar Docker containers
if docker-compose -f /home/ubuntu/CactusDashboard/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "[$(date)] ✅ Docker containers: OK" >> "$HEALTH_LOG"
else
    echo "[$(date)] ❌ Docker containers: Some containers are down" >> "$HEALTH_LOG"
fi

# Verificar recursos del sistema
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "[$(date)] 📊 Memory usage: $MEMORY_USAGE%" >> "$HEALTH_LOG"
echo "[$(date)] 📊 Disk usage: $DISK_USAGE%" >> "$HEALTH_LOG"

# Limpiar logs antiguos (mantener últimos 1000 líneas)
tail -n 1000 "$HEALTH_LOG" > "$HEALTH_LOG.tmp" && mv "$HEALTH_LOG.tmp" "$HEALTH_LOG"
EOF

chmod +x /opt/cactus/health-check.sh

# Configurar cron para verificación de salud
echo "*/5 * * * * /opt/cactus/health-check.sh" | crontab -u ubuntu -

# Crear script de información del sistema
cat << 'EOF' > /home/ubuntu/system-info.sh
#!/bin/bash

echo "🚀 Cactus Dashboard - Información del Sistema"
echo "=============================================="
echo ""
echo "📍 Instancia AWS:"
echo "   ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
echo "   Tipo: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)"
echo "   IP Pública: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "🖥️ Recursos del Sistema:"
echo "   CPU: $(nproc) cores"
echo "   Memoria: $(free -h | grep Mem | awk '{print $2}')"
echo "   Disco: $(df -h / | tail -1 | awk '{print $2}')"
echo ""
echo "🐳 Docker:"
echo "   Versión: $(docker --version)"
echo "   Compose: $(docker-compose --version)"
echo ""
echo "📊 Estado de Servicios:"
cd /home/ubuntu/CactusDashboard
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 URLs de Acceso:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "   Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "   API Docs: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/docs"
echo ""
echo "🔧 Comandos Útiles:"
echo "   Ver logs: ./scripts/deploy-aws.sh logs"
echo "   Estado: ./scripts/deploy-aws.sh status"
echo "   Backup: ./scripts/deploy-aws.sh backup"
echo "   SSL: ./scripts/deploy-aws.sh ssl tu-dominio.com"
EOF

chmod +x /home/ubuntu/system-info.sh
chown ubuntu:ubuntu /home/ubuntu/system-info.sh

# Configurar mensaje de bienvenida
cat << 'EOF' >> /home/ubuntu/.bashrc

# Cactus Dashboard - Información automática
echo ""
echo "🌵 Bienvenido a Cactus Dashboard!"
echo "Ejecuta './system-info.sh' para ver información del sistema"
echo ""
EOF

# Configurar logrotate para logs de aplicación
cat << 'EOF' > /etc/logrotate.d/cactus-dashboard
/var/log/cactus/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

# Señal de finalización exitosa
log "🎉 Configuración automática completada exitosamente!"
log "📍 IP Pública: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
log "🌐 Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
log "🔧 Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"

# Crear archivo de estado para Terraform
echo "SETUP_COMPLETE=$(date)" > /tmp/cactus-setup-status
echo "PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)" >> /tmp/cactus-setup-status

log "✅ User Data script completado. La aplicación debería estar disponible en unos minutos."