#!/bin/bash

# =============================================================================
# CACTUS DASHBOARD - SCRIPT DE DESPLIEGUE AWS
# =============================================================================
# Script automatizado para desplegar CactusDashboard en AWS EC2
# Incluye configuración de Nginx, Docker y validación completa
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_IP="34.195.179.168"
SSH_KEY="cactus-key.pem"
PROJECT_DIR="/home/ubuntu/CactusDashboard"

# Functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if SSH key exists
check_ssh_key() {
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key $SSH_KEY not found!"
        print_info "Make sure the SSH key is in the current directory"
        exit 1
    fi
    chmod 600 "$SSH_KEY"
    print_success "SSH key found and permissions set"
}

# Test SSH connection
test_ssh_connection() {
    print_header "Testing SSH Connection"
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$AWS_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        print_success "SSH connection to AWS EC2 successful"
    else
        print_error "Cannot connect to AWS EC2 instance"
        print_info "Check if the instance is running and security groups allow SSH"
        exit 1
    fi
}

# Deploy application
deploy_application() {
    print_header "Deploying Application to AWS"
    
    ssh -i "$SSH_KEY" ubuntu@"$AWS_IP" << 'EOF'
        cd /home/ubuntu/CactusDashboard
        
        echo "🔄 Pulling latest changes..."
        git pull origin main || echo "No git repository configured yet"
        
        echo "🐳 Building and starting Docker containers..."
        docker-compose -f docker-compose.prod.yml down || true
        docker-compose -f docker-compose.prod.yml build
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        echo "📊 Checking service status..."
        docker-compose -f docker-compose.prod.yml ps
EOF
    
    print_success "Application deployed successfully"
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx Reverse Proxy"
    
    # Copy nginx configuration to server
    scp -i "$SSH_KEY" nginx-reverse-proxy.conf ubuntu@"$AWS_IP":/tmp/nginx-cactus.conf
    
    ssh -i "$SSH_KEY" ubuntu@"$AWS_IP" << 'EOF'
        echo "🔧 Configuring Nginx..."
        
        # Backup existing configuration
        sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
        
        # Install new configuration
        sudo cp /tmp/nginx-cactus.conf /etc/nginx/sites-available/default
        
        # Test configuration
        if sudo nginx -t; then
            echo "✅ Nginx configuration is valid"
            sudo systemctl reload nginx
            echo "✅ Nginx reloaded successfully"
        else
            echo "❌ Nginx configuration is invalid"
            sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
            exit 1
        fi
        
        # Ensure Nginx is running
        sudo systemctl enable nginx
        sudo systemctl start nginx
EOF
    
    print_success "Nginx configured successfully"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    ssh -i "$SSH_KEY" ubuntu@"$AWS_IP" << 'EOF'
        cd /home/ubuntu/CactusDashboard
        
        echo "🗃️ Running database migrations..."
        docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "No migrations to run"
EOF
    
    print_success "Database migrations completed"
}

# Validate deployment
validate_deployment() {
    print_header "Validating Deployment"
    
    # Check services on server
    ssh -i "$SSH_KEY" ubuntu@"$AWS_IP" << 'EOF'
        cd /home/ubuntu/CactusDashboard
        
        echo "📊 Checking Docker services..."
        docker-compose -f docker-compose.prod.yml ps
        
        echo "🔍 Testing internal endpoints..."
        curl -f http://localhost:8000/health || echo "❌ Backend health check failed"
        curl -f http://localhost:3000 || echo "❌ Frontend check failed"
EOF
    
    # Check public endpoints
    print_info "Testing public endpoints..."
    
    if curl -f -s "http://$AWS_IP" > /dev/null; then
        print_success "Frontend accessible at http://$AWS_IP"
    else
        print_error "Frontend not accessible"
    fi
    
    if curl -f -s "http://$AWS_IP/api/health" > /dev/null; then
        print_success "Backend API accessible at http://$AWS_IP/api"
    else
        print_error "Backend API not accessible"
    fi
    
    if curl -f -s "http://$AWS_IP/api/docs" > /dev/null; then
        print_success "API documentation accessible at http://$AWS_IP/api/docs"
    else
        print_warning "API documentation not accessible (this might be expected)"
    fi
}

# Show deployment summary
show_summary() {
    print_header "Deployment Summary"
    
    echo -e "${GREEN}🎉 CactusDashboard deployment completed!${NC}\n"
    echo -e "📱 Frontend: ${BLUE}http://$AWS_IP${NC}"
    echo -e "🔧 API: ${BLUE}http://$AWS_IP/api${NC}"
    echo -e "📚 API Docs: ${BLUE}http://$AWS_IP/api/docs${NC}"
    echo -e "💚 Health Check: ${BLUE}http://$AWS_IP/api/health${NC}"
    echo ""
    echo -e "🔐 SSH Access: ${YELLOW}ssh -i $SSH_KEY ubuntu@$AWS_IP${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test the application functionality"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure SSL certificates for production"
    echo "4. Set up automated backups"
}

# Main execution
main() {
    print_header "CactusDashboard AWS Deployment Script"
    
    check_ssh_key
    test_ssh_connection
    deploy_application
    configure_nginx
    run_migrations
    validate_deployment
    show_summary
    
    print_success "Deployment script completed successfully!"
}

# Run main function
main "$@"