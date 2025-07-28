#!/bin/bash

# AWS Deployment Script for Cactus Dashboard
# This script deploys the application to AWS using Terraform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Check AWS credentials
check_aws_credentials() {
    print_header "Checking AWS Credentials"
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    fi
    
    # Check if AWS credentials are set
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        print_error "AWS credentials not found in .env file"
        exit 1
    fi
    
    # Test AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "Invalid AWS credentials"
        exit 1
    fi
    
    print_success "AWS credentials are valid"
}

# Build and push Docker images
build_and_push_images() {
    print_header "Building and Pushing Docker Images"
    
    cd "$PROJECT_ROOT"
    
    # Build images
    print_status "Building Docker images..."
    docker-compose -f config/docker/docker-compose.yml build
    
    # Tag images for AWS ECR (if using ECR)
    # docker tag cactusdashboard-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/cactusdashboard-backend:latest
    # docker tag cactusdashboard-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/cactusdashboard-frontend:latest
    
    print_success "Docker images built successfully"
}

# Deploy with Terraform
deploy_terraform() {
    print_header "Deploying with Terraform"
    
    cd "$PROJECT_ROOT/terraform"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Check if terraform.tfvars exists, if not create from example
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found, creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        print_status "Please review and update terraform.tfvars with your configuration"
        read -p "Press Enter to continue after updating terraform.tfvars..."
    fi
    
    # Plan deployment
    print_status "Planning Terraform deployment..."
    terraform plan -out=tfplan
    
    # Ask for confirmation
    read -p "Do you want to apply this plan? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Applying Terraform plan..."
        terraform apply tfplan
        print_success "Terraform deployment completed"
    else
        print_warning "Deployment cancelled"
        exit 0
    fi
}

# Post-deployment verification
verify_deployment() {
    print_header "Verifying Deployment"
    
    cd "$PROJECT_ROOT/terraform"
    
    # Get the public IP from Terraform output
    PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null || echo "")
    
    if [ -z "$PUBLIC_IP" ]; then
        print_warning "Could not get public IP from Terraform output"
        return
    fi
    
    print_status "Testing backend health at http://$PUBLIC_IP:8000/health"
    if curl -f "http://$PUBLIC_IP:8000/health" &> /dev/null; then
        print_success "Backend is responding"
    else
        print_warning "Backend is not responding yet"
    fi
    
    print_status "Testing frontend at http://$PUBLIC_IP:3000"
    if curl -f "http://$PUBLIC_IP:3000" &> /dev/null; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend is not responding yet"
    fi
    
    print_success "Deployment verification completed"
    print_status "Application URLs:"
    echo "  Backend: http://$PUBLIC_IP:8000"
    echo "  Frontend: http://$PUBLIC_IP:3000"
    echo "  SSH: ssh -i cactus-key.pem ubuntu@$PUBLIC_IP"
}

# Main deployment function
main() {
    print_header "AWS Deployment for Cactus Dashboard"
    
    check_prerequisites
    check_aws_credentials
    build_and_push_images
    deploy_terraform
    verify_deployment
    
    print_success "AWS deployment completed successfully!"
}

# Execute main function
main "$@" 