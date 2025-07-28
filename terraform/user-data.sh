#!/bin/bash

# User Data Script for Cactus Dashboard AWS EC2
# This script runs automatically when the instance is created

set -euo pipefail

# Configuration variables
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
LOG_FILE="/var/log/cactus-setup.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Redirect all output to log
exec > >(tee -a "$LOG_FILE") 2>&1

log "🌵 Starting Cactus Dashboard setup"
log "Project: $PROJECT_NAME, Environment: $ENVIRONMENT"

# Update system
log "📦 Updating system..."
apt update && apt upgrade -y

# Install basic dependencies
log "🔧 Installing dependencies..."
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

# Configure swap for t4g.nano (Free Tier)
log "💾 Configuring swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo 'vm.swappiness=5' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    log "✅ Swap configured (1GB for Free Tier)"
fi

# Install Docker
log "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    rm get-docker.sh
    
    # Configure Docker
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
    log "✅ Docker installed"
fi

# Install Docker Compose
log "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
    curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "✅ Docker Compose installed"
fi

# Configure firewall
log "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Frontend (temporary)
ufw allow 8000/tcp  # Backend (temporary)
ufw --force enable

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Create directory structure
log "📁 Creating directory structure..."
mkdir -p /var/log/cactus
mkdir -p /opt/cactus/{backups,data,config}
mkdir -p /opt/cactus/data/{postgres,redis,n8n}
chown -R ubuntu:ubuntu /opt/cactus
chown -R ubuntu:ubuntu /var/log/cactus

# Install Nginx
log "🌐 Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# Clone repository as ubuntu user
log "📥 Cloning repository..."
cd /home/ubuntu
if [ ! -d "CactusDashboard" ]; then
    sudo -u ubuntu git clone https://github.com/Gigisanta/CactusDashboard.git
    chown -R ubuntu:ubuntu CactusDashboard
    log "✅ Repository cloned"
else
    log "⚠️ Repository already exists"
fi

# Make scripts executable
cd /home/ubuntu/CactusDashboard
chmod +x scripts/*.sh

# Run application setup as ubuntu user
log "🚀 Running application setup..."
sudo -u ubuntu ./scripts/deploy-aws.sh setup

# Deploy application
log "🚀 Deploying application..."
sudo -u ubuntu ./scripts/deploy-aws.sh deploy

# Install CloudWatch Agent
log "📊 Installing CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch Agent
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

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create health check script
log "🏥 Creating health check script..."
cat << 'EOF' > /opt/cactus/health-check.sh
#!/bin/bash

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

# Check services
check_service "Frontend" "http://localhost:3000"
check_service "Backend" "http://localhost:8000/health"
check_service "Nginx" "http://localhost:80"

# Check Docker containers
if docker-compose -f /home/ubuntu/CactusDashboard/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "[$(date)] ✅ Docker containers: OK" >> "$HEALTH_LOG"
else
    echo "[$(date)] ❌ Docker containers: Some containers are down" >> "$HEALTH_LOG"
fi

# Check system resources
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "[$(date)] 💾 Memory usage: $MEMORY_USAGE%" >> "$HEALTH_LOG"
echo "[$(date)] 💽 Disk usage: $DISK_USAGE%" >> "$HEALTH_LOG"

# Clean old logs
tail -n 1000 "$HEALTH_LOG" > "$HEALTH_LOG.tmp" && mv "$HEALTH_LOG.tmp" "$HEALTH_LOG"
EOF

chmod +x /opt/cactus/health-check.sh

# Configure cron for health checks
echo "*/5 * * * * /opt/cactus/health-check.sh" | crontab -u ubuntu -

# Create system info script
cat << 'EOF' > /home/ubuntu/system-info.sh
#!/bin/bash

echo "🚀 Cactus Dashboard - System Information"
echo "========================================"
echo ""
echo "📍 AWS Instance:"
echo "   ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
echo "   Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)"
echo "   IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "🖥️ System Resources:"
echo "   CPU: $(nproc) cores"
echo "   Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "   Disk: $(df -h / | tail -1 | awk '{print $2}')"
echo ""
echo "🐳 Docker:"
echo "   Version: $(docker --version)"
echo "   Compose: $(docker-compose --version)"
echo ""
echo "📊 Service Status:"
cd /home/ubuntu/CactusDashboard
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "   Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "   API Docs: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/docs"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: ./scripts/deploy-aws.sh logs"
echo "   Status: ./scripts/deploy-aws.sh status"
echo "   Backup: ./scripts/deploy-aws.sh backup"
EOF

chmod +x /home/ubuntu/system-info.sh
chown ubuntu:ubuntu /home/ubuntu/system-info.sh

# Configure logrotate
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

# Welcome message
cat << 'EOF' >> /home/ubuntu/.bashrc

# Cactus Dashboard - Automatic Information
echo ""
echo "🌵 Welcome to Cactus Dashboard!"
echo "Run './system-info.sh' to see system information"
echo ""
EOF

# Final status
log "🎉 Setup completed successfully!"
log "🌐 Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
log "🚀 Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
log "📊 Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"

# Create status file for Terraform
echo "SETUP_COMPLETE=$(date)" > /tmp/cactus-setup-status
echo "PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)" >> /tmp/cactus-setup-status

log "✅ User Data script completed. Application should be available in a few minutes."