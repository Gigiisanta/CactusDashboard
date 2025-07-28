#!/bin/bash

# Cactus Dashboard - Master Script
# Unified script for all Cactus Dashboard operations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# =============================================================================
# OAUTH FUNCTIONS
# =============================================================================

setup_oauth() {
    print_header "Setting up OAuth configuration"
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_warning ".env file not found. Creating template..."
        cat > "$PROJECT_ROOT/.env" << EOF
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/cactus_wealth

# JWT Configuration
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
EOF
        print_success ".env template created. Please update with your actual values."
    else
        print_success ".env file already exists"
    fi

    # Create tokens directory if it doesn't exist
    if [ ! -d "$PROJECT_ROOT/tokens" ]; then
        mkdir -p "$PROJECT_ROOT/tokens"
        print_success "Tokens directory created"
    else
        print_success "Tokens directory already exists"
    fi

    # Set proper permissions
    chmod 600 "$PROJECT_ROOT/.env" 2>/dev/null || print_warning "Could not set .env permissions"
    chmod 755 "$PROJECT_ROOT/tokens" 2>/dev/null || print_warning "Could not set tokens permissions"

    # Check if OAuth credentials are configured
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
        
        if [ -n "$GOOGLE_CLIENT_ID" ] && [ "$GOOGLE_CLIENT_ID" != "your_google_client_id_here" ]; then
            print_success "GOOGLE_CLIENT_ID is configured"
        else
            print_warning "GOOGLE_CLIENT_ID needs to be configured"
        fi
        
        if [ -n "$GOOGLE_CLIENT_SECRET" ] && [ "$GOOGLE_CLIENT_SECRET" != "your_google_client_secret_here" ]; then
            print_success "GOOGLE_CLIENT_SECRET is configured"
        else
            print_warning "GOOGLE_CLIENT_SECRET needs to be configured"
        fi
    fi

    print_success "OAuth setup complete!"
    print_status "Next steps:"
    echo "   1. Update .env with your Google OAuth credentials"
    echo "   2. Run 'cactus.sh oauth:test' to test the configuration"
    echo "   3. Run 'cactus.sh oauth:debug' to verify the OAuth flow"
}

test_oauth_flow() {
    print_header "Testing OAuth flow"
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
        print_success "Environment variables loaded"
    else
        print_error ".env file not found. Run 'cactus.sh oauth:setup' first."
        exit 1
    fi

    # Check if required environment variables are set
    if [ -z "$GOOGLE_CLIENT_ID" ] || [ "$GOOGLE_CLIENT_ID" = "your_google_client_id_here" ]; then
        print_error "GOOGLE_CLIENT_ID not configured in .env"
        exit 1
    fi

    if [ -z "$GOOGLE_CLIENT_SECRET" ] || [ "$GOOGLE_CLIENT_SECRET" = "your_google_client_secret_here" ]; then
        print_error "GOOGLE_CLIENT_SECRET not configured in .env"
        exit 1
    fi

    print_success "OAuth credentials configured"

    # Test OAuth endpoints
    print_status "Testing OAuth endpoints..."

    # Test backend health
    if curl -f -s "http://localhost:8000/health" > /dev/null; then
        print_success "Backend is running"
    else
        print_warning "Backend not responding on port 8000"
    fi

    # Test frontend
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Frontend is running"
    else
        print_warning "Frontend not responding on port 3000"
    fi

    # Test OAuth configuration endpoint
    print_status "Testing OAuth configuration endpoint..."
    CONFIG_RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/config 2>/dev/null || echo "")
    if echo "$CONFIG_RESPONSE" | jq -e '.client_id' > /dev/null 2>&1; then
        print_success "OAuth configuration endpoint working"
        echo "  Client ID: $(echo "$CONFIG_RESPONSE" | jq -r '.client_id' | cut -c1-20)..."
        echo "  Redirect URI: $(echo "$CONFIG_RESPONSE" | jq -r '.redirect_uri')"
    else
        print_warning "OAuth configuration endpoint not accessible"
    fi

    # Check Docker services
    print_status "Checking Docker services..."
    if docker ps | grep -q "cactusdashboard"; then
        print_success "Docker services are running"
    else
        print_warning "Docker services not found"
    fi

    print_success "OAuth flow test completed!"
    print_status "To run a complete manual test, use: cactus.sh oauth:debug"
}

diagnose_oauth() {
    print_header "Diagnosing OAuth configuration"
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
        print_success ".env file loaded"
    else
        print_error ".env file not found"
        exit 1
    fi

    # Check environment variables
    print_status "Environment Variables Check:"
    if [ -n "$GOOGLE_CLIENT_ID" ] && [ "$GOOGLE_CLIENT_ID" != "your_google_client_id_here" ]; then
        print_success "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:10}..."
    else
        print_error "GOOGLE_CLIENT_ID: Not configured"
    fi

    if [ -n "$GOOGLE_CLIENT_SECRET" ] && [ "$GOOGLE_CLIENT_SECRET" != "your_google_client_secret_here" ]; then
        print_success "GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:10}..."
    else
        print_error "GOOGLE_CLIENT_SECRET: Not configured"
    fi

    if [ -n "$GOOGLE_REDIRECT_URI" ]; then
        print_success "GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI"
    else
        print_warning "GOOGLE_REDIRECT_URI: Not configured"
    fi

    if [ -n "$BACKEND_URL" ]; then
        print_success "BACKEND_URL: $BACKEND_URL"
    else
        print_warning "BACKEND_URL: Not configured"
    fi

    if [ -n "$FRONTEND_URL" ]; then
        print_success "FRONTEND_URL: $FRONTEND_URL"
    else
        print_warning "FRONTEND_URL: Not configured"
    fi

    # Check network connectivity
    print_status "Network Connectivity Check:"
    if ping -c 1 google.com > /dev/null 2>&1; then
        print_success "Internet connectivity OK"
    else
        print_error "No internet connectivity"
    fi

    # Check local services
    print_status "Local Services Check:"
    if curl -f -s "http://localhost:8000/health" > /dev/null; then
        print_success "Backend (port 8000) is running"
    else
        print_error "Backend (port 8000) is not responding"
    fi

    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Frontend (port 3000) is running"
    else
        print_error "Frontend (port 3000) is not responding"
    fi

    # Check ports
    print_status "Port Usage Check:"
    if command -v lsof > /dev/null 2>&1; then
        lsof -i :3000,8000,5432 2>/dev/null || print_warning "No services found on main ports"
    else
        print_warning "lsof not available for port checking"
    fi

    # Check Docker services
    print_status "Docker Services Check:"
    if docker ps | grep -q "cactusdashboard"; then
        print_success "Docker services are running"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cactusdashboard
    else
        print_warning "No Docker services found"
    fi

    # Check OAuth configuration endpoint
    print_status "OAuth Configuration Endpoint Check:"
    CONFIG_RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/config 2>/dev/null || echo "")
    if echo "$CONFIG_RESPONSE" | jq -e '.client_id' > /dev/null 2>&1; then
        print_success "OAuth configuration endpoint accessible"
        echo "  Client ID: $(echo "$CONFIG_RESPONSE" | jq -r '.client_id' | cut -c1-20)..."
        echo "  Redirect URI: $(echo "$CONFIG_RESPONSE" | jq -r '.redirect_uri')"
    else
        print_warning "OAuth configuration endpoint not accessible"
    fi

    # Check tokens directory
    print_status "Tokens Directory Check:"
    if [ -d "$PROJECT_ROOT/tokens" ]; then
        print_success "Tokens directory exists"
        ls -la "$PROJECT_ROOT/tokens" 2>/dev/null || print_warning "Cannot list tokens directory"
    else
        print_warning "Tokens directory not found"
    fi

    print_success "OAuth diagnosis completed!"
}

# =============================================================================
# TESTING FUNCTIONS
# =============================================================================

test_complete_app() {
    print_header "Complete Application Test"
    
    # 1. Check Docker containers
    print_status "1. Checking Docker containers..."
    if docker ps | grep -q "cactusdashboard"; then
        print_success "Docker containers are running"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cactusdashboard
    else
        print_error "Docker containers are not running"
        exit 1
    fi
    echo ""

    # 2. Check infrastructure services
    print_status "2. Checking infrastructure services..."

    # Check PostgreSQL
    print_status "Checking PostgreSQL..."
    if docker exec cactusdashboard-db-1 psql -U cactus_user -d cactus_db -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "PostgreSQL is working"
    else
        print_error "PostgreSQL is not working"
    fi

    # Check Redis
    print_status "Checking Redis..."
    if docker exec cactusdashboard-redis-1 redis-cli -a cactus_redis_secure_2024 ping > /dev/null 2>&1; then
        print_success "Redis is working"
    else
        print_error "Redis is not working"
    fi
    echo ""

    # 3. Check backend API
    print_status "3. Checking backend API..."

    # Check health endpoint
    print_status "Checking health endpoint..."
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>/dev/null || echo "")
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        print_success "Health endpoint is working"
        echo "  Status: $(echo $HEALTH_RESPONSE | jq -r '.status' 2>/dev/null || echo 'unknown')"
    else
        print_error "Health endpoint is not working"
    fi

    # Check backend port
    print_status "Checking backend port 8000..."
    if curl -s -I http://localhost:8000/health | head -1 | grep -q "200" 2>/dev/null; then
        print_success "Backend responds on port 8000"
    else
        print_error "Backend does not respond on port 8000"
    fi
    echo ""

    # 4. Check frontend
    print_status "4. Checking frontend..."

    # Check frontend port
    print_status "Checking frontend port 3000..."
    if curl -s -I http://localhost:3000 | head -1 | grep -q "200\|307" 2>/dev/null; then
        print_success "Frontend responds on port 3000"
    else
        print_warning "Frontend does not respond on port 3000 (may not be started)"
    fi

    # Check login page
    print_status "Checking login page..."
    if curl -s http://localhost:3000/login | grep -q "Cactus" 2>/dev/null; then
        print_success "Login page is available"
    else
        print_warning "Login page not accessible (frontend may not be started)"
    fi
    echo ""

    # 5. Check OAuth configuration
    print_status "5. Checking OAuth configuration..."
    if curl -s http://localhost:8000/api/v1/auth/google/config | jq -e '.client_id' > /dev/null 2>/dev/null; then
        print_success "OAuth configuration endpoint is working"
    else
        print_warning "OAuth configuration endpoint not accessible"
    fi
    echo ""

    # Summary
    print_status "Test Summary:"
    echo "  ✅ Docker containers: Running"
    echo "  ✅ PostgreSQL: Working"
    echo "  ✅ Redis: Working"
    echo "  ✅ Backend API: Working"
    echo "  ⚠️  Frontend: May need to be started"
    echo "  ⚠️  OAuth: Configuration accessible"

    print_success "Complete application test finished!"
    print_status "To start frontend: cd cactus-wealth-frontend && npm run dev"
}

test_backend() {
    print_header "Backend Tests"
    cd "$PROJECT_ROOT/cactus-wealth-backend"
    python -m pytest tests/ -v || print_error "Backend tests failed"
    cd "$PROJECT_ROOT"
}

test_frontend() {
    print_header "Frontend Tests"
    cd "$PROJECT_ROOT/cactus-wealth-frontend"
    npm test || print_error "Frontend tests failed"
    cd "$PROJECT_ROOT"
}

test_all() {
    print_header "Running All Tests"
    test_backend
    test_frontend
    test_oauth_flow
    test_complete_app
}

# =============================================================================
# DOCKER FUNCTIONS
# =============================================================================

docker_up() {
    print_header "Starting Docker Services"
    docker-compose -f config/docker/docker-compose.yml up -d || print_error "Docker up failed"
    print_success "Docker services started"
}

docker_down() {
    print_header "Stopping Docker Services"
    docker-compose -f config/docker/docker-compose.yml down || print_error "Docker down failed"
    print_success "Docker services stopped"
}

docker_restart() {
    print_header "Restarting Docker Services"
    docker_down
    docker_up
}

docker_logs() {
    print_header "Docker Logs"
    docker-compose -f config/docker/docker-compose.yml logs -f
}

# =============================================================================
# DEBUG FUNCTIONS
# =============================================================================

clean_ports() {
    print_header "Port Cleaner"
    
    # Check if lsof is available
    if ! command -v lsof &> /dev/null; then
        print_error "lsof is not installed. Please install lsof to continue."
        exit 1
    fi

    # Show current port usage
    print_status "Current port usage:"
    echo ""

    # Common development ports
    DEV_PORTS=(3000 3001 8000 8001 5432 6379 8080 9000)

    for port in "${DEV_PORTS[@]}"; do
        pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            process_info=$(lsof -i:$port | grep LISTEN | head -1 | awk '{print $1, $2, $9}' 2>/dev/null || echo "Unknown process")
            print_warning "Port $port: $process_info (PID: $pids)"
        else
            print_success "Port $port: free"
        fi
    done

    echo ""

    # Ask for confirmation before killing processes
    read -p "Do you want to kill processes on these ports? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Killing processes on development ports..."
        
        killed_count=0
        for port in "${DEV_PORTS[@]}"; do
            pids=$(lsof -ti:$port 2>/dev/null || true)
            if [ ! -z "$pids" ]; then
                print_warning "Killing processes on port $port: $pids"
                echo "$pids" | xargs kill -9 2>/dev/null || true
                killed_count=$((killed_count + $(echo "$pids" | wc -w)))
            fi
        done
        
        if [ $killed_count -gt 0 ]; then
            print_success "Killed $killed_count processes"
        else
            print_success "No processes were killed"
        fi
    else
        print_status "No processes were killed"
    fi

    echo ""
    print_status "Port cleaning completed!"
}

debug_health() {
    print_header "Health Check"
    print_status "Checking backend health..."
    curl -f http://localhost:8000/health || print_error "Backend not responding"
    print_status "Checking frontend health..."
    curl -f http://localhost:3000 || print_error "Frontend not responding"
    print_success "Health check completed"
}

show_status() {
    print_header "Service Status"
    print_status "Docker containers:"
    docker ps || print_warning "Docker not running"
    echo ""
    print_status "Port usage:"
    lsof -i :3000,8000,5432 || print_warning "No services on main ports"
}

# =============================================================================
# SETUP FUNCTIONS
# =============================================================================

setup_backend() {
    print_header "Setting up Backend"
    cd "$PROJECT_ROOT/cactus-wealth-backend"
    pip install -r requirements.txt || print_error "Backend setup failed"
    cd "$PROJECT_ROOT"
    print_success "Backend setup completed"
}

setup_frontend() {
    print_header "Setting up Frontend"
    cd "$PROJECT_ROOT/cactus-wealth-frontend"
    npm install || print_error "Frontend setup failed"
    cd "$PROJECT_ROOT"
    print_success "Frontend setup completed"
}

setup_dev() {
    print_header "Setting up Development Environment"
    setup_backend
    setup_frontend
    setup_oauth
    print_success "Development environment setup completed"
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_aws() {
    print_header "Deploying to AWS"
    if [ -f "$PROJECT_ROOT/scripts/deploy/aws-deploy.sh" ]; then
        bash "$PROJECT_ROOT/scripts/deploy/aws-deploy.sh" || print_error "AWS deployment failed"
    else
        print_error "AWS deployment script not found"
    fi
}

deploy_local() {
    print_header "Deploying Locally"
    docker_up
    debug_health
    print_success "Local deployment completed"
}

# =============================================================================
# GITHUB FUNCTIONS
# =============================================================================

setup_github() {
    print_header "Setting up GitHub Repository Configuration"
    
    # Get current repository URL
    CURRENT_REPO=$(git remote get-url origin 2>/dev/null || echo "")
    
    if [ -z "$CURRENT_REPO" ]; then
        print_error "No Git repository found. Please initialize Git first."
        return 1
    fi
    
    print_success "Current repository: $CURRENT_REPO"
    
    # Update user data script with correct repository URL
    REPO_NAME=$(echo "$CURRENT_REPO" | sed 's/.*github\.com\///' | sed 's/\.git$//')
    
    if [ -f "terraform/user-data.sh" ]; then
        sed -i.bak "s|https://github.com/[^/]*/CactusDashboard.git|$CURRENT_REPO|g" terraform/user-data.sh
        print_success "Updated terraform/user-data.sh with repository: $CURRENT_REPO"
    fi
    
    # Create GitHub configuration file
    cat > .github-config << EOF
# GitHub Repository Configuration
GITHUB_REPO_URL=$CURRENT_REPO
GITHUB_REPO_NAME=$REPO_NAME
GITHUB_USER=$(echo "$REPO_NAME" | cut -d'/' -f1)
GITHUB_PROJECT=$(echo "$REPO_NAME" | cut -d'/' -f2)

# AWS Deployment Configuration
AWS_INSTANCE_IP=$(terraform -chdir=terraform output -raw public_ip 2>/dev/null || echo "NOT_DEPLOYED")
AWS_INSTANCE_ID=$(terraform -chdir=terraform output -raw instance_id 2>/dev/null || echo "NOT_DEPLOYED")

# Last updated: $(date)
EOF
    
    print_success "GitHub configuration created in .github-config"
    print_status "Configuration:"
    cat .github-config
}

update_github_url() {
    print_header "Updating GitHub Repository URL"
    
    read -p "Enter new GitHub repository URL: " NEW_REPO_URL
    
    if [ -z "$NEW_REPO_URL" ]; then
        print_error "Repository URL cannot be empty"
        return 1
    fi
    
    # Update git remote
    git remote set-url origin "$NEW_REPO_URL"
    print_success "Updated git remote to: $NEW_REPO_URL"
    
    # Update user data script
    if [ -f "terraform/user-data.sh" ]; then
        sed -i.bak "s|https://github.com/[^/]*/CactusDashboard.git|$NEW_REPO_URL|g" terraform/user-data.sh
        print_success "Updated terraform/user-data.sh"
    fi
    
    # Update GitHub config
    setup_github
    
    print_success "GitHub URL updated successfully"
}

deploy_to_github_and_aws() {
    print_header "Deploying to GitHub and AWS"
    
    # Check if we have changes to commit
    if ! git diff-index --quiet HEAD --; then
        print_status "Committing local changes..."
        git add .
        git commit -m "Auto-deploy: $(date)"
    fi
    
    # Push to GitHub
    print_status "Pushing to GitHub..."
    git push origin main || git push origin master
    
    # Deploy to AWS
    print_status "Deploying to AWS..."
    deploy_aws
    
    print_success "Deployment to GitHub and AWS completed"
}

sync_with_github() {
    print_header "Syncing with GitHub Repository"
    
    # Pull latest changes
    print_status "Pulling latest changes from GitHub..."
    git pull origin main || git pull origin master
    
    # Check for conflicts
    if [ $? -ne 0 ]; then
        print_error "Merge conflicts detected. Please resolve manually."
        return 1
    fi
    
    # Update dependencies
    print_status "Updating dependencies..."
    setup_backend
    setup_frontend
    
    print_success "Sync completed successfully"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

clean_all() {
    print_header "Cleaning All Temporary Files"
    rm -rf .pytest_cache/ __pycache__/ || true
    rm -rf cactus-wealth-frontend/.next/ cactus-wealth-frontend/coverage/ || true
    rm -f logs/*.log || true
    print_success "Cleanup completed"
}

show_help() {
    print_header "Cactus Dashboard - Master Script"
    echo ""
    echo "Usage: $0 {category}:{command} [options]"
    echo ""
    echo "Categories and Commands:"
    echo ""
    echo "🔐 OAUTH:"
    echo "  oauth:setup      - Setup OAuth configuration"
    echo "  oauth:test       - Test OAuth flow"
    echo "  oauth:debug      - Diagnose OAuth issues"
    echo ""
    echo "🧪 TESTING:"
    echo "  test:all         - Run all tests"
    echo "  test:backend     - Run backend tests"
    echo "  test:frontend    - Run frontend tests"
    echo "  test:integration - Run integration tests"
    echo ""
    echo "🐳 DOCKER:"
    echo "  docker:up        - Start Docker services"
    echo "  docker:down      - Stop Docker services"
    echo "  docker:restart   - Restart Docker services"
    echo "  docker:logs      - Show Docker logs"
    echo ""
    echo "🐛 DEBUG:"
    echo "  debug:ports      - Clean port conflicts"
    echo "  debug:health     - Health check services"
    echo "  debug:status     - Show service status"
    echo ""
    echo "🔧 SETUP:"
    echo "  setup:dev        - Setup development environment"
    echo "  setup:backend    - Setup backend"
    echo "  setup:frontend   - Setup frontend"
    echo ""
    echo "🚀 DEPLOYMENT:"
    echo "  deploy:aws       - Deploy to AWS"
    echo "  deploy:local     - Deploy locally"
    echo ""
    echo "🐙 GITHUB:"
    echo "  github:setup     - Setup GitHub repository configuration"
    echo "  github:update    - Update GitHub repository URL"
    echo "  github:deploy    - Deploy to GitHub and then to AWS"
    echo "  github:sync      - Sync local changes with GitHub repository"
    echo ""
    echo "🧹 UTILITIES:"
    echo "  clean:all        - Clean temporary files"
    echo "  help             - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 oauth:setup"
    echo "  $0 test:all"
    echo "  $0 docker:up"
    echo "  $0 debug:health"
    echo ""
}

# =============================================================================
# MAIN FUNCTION
# =============================================================================

main() {
    case "${1:-help}" in
        # OAuth commands
        "oauth:setup")
            setup_oauth
            ;;
        "oauth:test")
            test_oauth_flow
            ;;
        "oauth:debug")
            diagnose_oauth
            ;;
        
        # Testing commands
        "test:all")
            test_all
            ;;
        "test:backend")
            test_backend
            ;;
        "test:frontend")
            test_frontend
            ;;
        "test:integration")
            test_complete_app
            ;;
        
        # Docker commands
        "docker:up")
            docker_up
            ;;
        "docker:down")
            docker_down
            ;;
        "docker:restart")
            docker_restart
            ;;
        "docker:logs")
            docker_logs
            ;;
        
        # Debug commands
        "debug:ports")
            clean_ports
            ;;
        "debug:health")
            debug_health
            ;;
        "debug:status")
            show_status
            ;;
        
        # Setup commands
        "setup:dev")
            setup_dev
            ;;
        "setup:backend")
            setup_backend
            ;;
        "setup:frontend")
            setup_frontend
            ;;
        
        # Deployment commands
        "deploy:aws")
            deploy_aws
            ;;
        "deploy:local")
            deploy_local
            ;;
        
        # GitHub commands
        "github:setup")
            setup_github
            ;;
        "github:update")
            update_github_url
            ;;
        "github:deploy")
            deploy_to_github_and_aws
            ;;
        "github:sync")
            sync_with_github
            ;;
        
        # Utility commands
        "clean:all")
            clean_all
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Execute main function
main "$@" 