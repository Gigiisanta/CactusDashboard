#!/bin/bash

# AWS Production Deployment Script for Cactus Dashboard
# This script deploys the application on the EC2 instance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}🌵 $1${NC}"
    echo "================================================"
}

# Function to setup the application
setup() {
    print_header "Setting up Cactus Dashboard"
    
    cd /home/ubuntu
    
    # Create project directory if it doesn't exist
    if [ ! -d "CactusDashboard" ]; then
        mkdir -p CactusDashboard
        print_success "Created project directory"
    fi
    
    cd CactusDashboard
    
    # Create production docker-compose file
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: cactus-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: cactus_user
      POSTGRES_PASSWORD: cactus_password
      POSTGRES_DB: cactus_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cactus-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cactus_user -d cactus_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: cactus-redis
    restart: unless-stopped
    command: redis-server --requirepass cactus_redis_secure_2024
    volumes:
      - redis_data:/data
    networks:
      - cactus-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./cactus-wealth-backend
      dockerfile: Dockerfile
    container_name: cactus-backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://cactus_user:cactus_password@db:5432/cactus_db
      - REDIS_URL=redis://:cactus_redis_secure_2024@redis:6379/0
      - GOOGLE_CLIENT_ID=1019817697031-9r8asaktdl106l4nt0a15v9k5l1vi6ek.apps.googleusercontent.com
      - GOOGLE_CLIENT_SECRET=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
      - SECRET_KEY=your_secret_key_here_production
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
    volumes:
      - ./cactus-wealth-backend:/app
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - cactus-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./cactus-wealth-frontend
      dockerfile: Dockerfile
    container_name: cactus-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
      - NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=1019817697031-9r8asaktdl106l4nt0a15v9k5l1vi6ek.apps.googleusercontent.com
      - NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - cactus-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: cactus-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - cactus-network

volumes:
  postgres_data:
  redis_data:

networks:
  cactus-network:
    driver: bridge
EOF

    # Create nginx configuration
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API docs
        location /docs {
            proxy_pass http://backend/docs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

    # Create SSL directory
    mkdir -p ssl
    
    print_success "Setup completed"
}

# Function to deploy the application
deploy() {
    print_header "Deploying Cactus Dashboard"
    
    cd /home/ubuntu/CactusDashboard
    
    # Copy project files
    if [ -d "/tmp/CactusDashboard" ]; then
        cp -r /tmp/CactusDashboard/* .
        print_success "Copied project files"
    fi
    
    # Build and start services
    print_status "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build
    
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose -f docker-compose.prod.yml ps
    
    print_success "Deployment completed"
}

# Function to show logs
logs() {
    print_header "Application Logs"
    cd /home/ubuntu/CactusDashboard
    docker-compose -f docker-compose.prod.yml logs -f
}

# Function to show status
status() {
    print_header "Service Status"
    cd /home/ubuntu/CactusDashboard
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    print_status "Health checks:"
    curl -f http://localhost/health || print_error "Health check failed"
    curl -f http://localhost:3000 || print_error "Frontend check failed"
}

# Function to backup data
backup() {
    print_header "Creating Backup"
    cd /home/ubuntu/CactusDashboard
    
    BACKUP_DIR="/opt/cactus/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U cactus_user cactus_db > "$BACKUP_DIR/database.sql"
    
    # Backup redis
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb /data/dump.rdb
    docker cp cactus-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"
    
    print_success "Backup created in $BACKUP_DIR"
}

# Function to setup SSL
ssl() {
    if [ -z "$1" ]; then
        print_error "Domain name required. Usage: $0 ssl <domain>"
        exit 1
    fi
    
    DOMAIN="$1"
    print_header "Setting up SSL for $DOMAIN"
    
    # Install certbot
    apt update
    apt install -y certbot python3-certbot-nginx
    
    # Get SSL certificate
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@example.com
    
    print_success "SSL setup completed for $DOMAIN"
}

# Main function
main() {
    case "${1:-help}" in
        "setup")
            setup
            ;;
        "deploy")
            deploy
            ;;
        "logs")
            logs
            ;;
        "status")
            status
            ;;
        "backup")
            backup
            ;;
        "ssl")
            ssl "$2"
            ;;
        "help"|*)
            echo "Usage: $0 {setup|deploy|logs|status|backup|ssl <domain>}"
            echo ""
            echo "Commands:"
            echo "  setup   - Setup the application"
            echo "  deploy  - Deploy the application"
            echo "  logs    - Show application logs"
            echo "  status  - Show service status"
            echo "  backup  - Create backup"
            echo "  ssl     - Setup SSL certificate"
            ;;
    esac
}

# Execute main function
main "$@" 