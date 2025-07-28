#!/bin/bash

# Validation script for Cactus Dashboard AWS deployment
# Checks all requirements and constraints for the deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}🌵 $1${NC}"
    echo "================================================"
}

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
VALIDATION_RESULTS=()

# Function to add validation result
add_result() {
    local status="$1"
    local message="$2"
    VALIDATION_RESULTS+=("$status|$message")
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check AWS CLI
    if command -v aws &> /dev/null; then
        print_success "AWS CLI installed"
        add_result "SUCCESS" "AWS CLI installed"
        
        # Check AWS credentials
        if aws sts get-caller-identity &> /dev/null; then
            print_success "AWS credentials configured"
            add_result "SUCCESS" "AWS credentials configured"
        else
            print_error "AWS credentials not configured"
            add_result "ERROR" "AWS credentials not configured"
        fi
    else
        print_error "AWS CLI not installed"
        add_result "ERROR" "AWS CLI not installed"
    fi
    
    # Check Terraform
    if command -v terraform &> /dev/null; then
        print_success "Terraform installed"
        add_result "SUCCESS" "Terraform installed"
        
        # Check Terraform version
        local tf_version=$(terraform version -json | jq -r '.terraform_version')
        if [[ "$tf_version" =~ ^1\.[0-9]+\.[0-9]+$ ]]; then
            print_success "Terraform version: $tf_version"
            add_result "SUCCESS" "Terraform version $tf_version"
        else
            print_error "Terraform version must be >= 1.0"
            add_result "ERROR" "Terraform version must be >= 1.0"
        fi
    else
        print_error "Terraform not installed"
        add_result "ERROR" "Terraform not installed"
    fi
    
    # Check jq
    if command -v jq &> /dev/null; then
        print_success "jq installed"
        add_result "SUCCESS" "jq installed"
    else
        print_error "jq not installed"
        add_result "ERROR" "jq not installed"
    fi
}

# Check Terraform configuration
check_terraform_config() {
    print_header "Checking Terraform Configuration"
    
    # Check if terraform directory exists
    if [ ! -d "$TERRAFORM_DIR" ]; then
        print_error "Terraform directory not found"
        add_result "ERROR" "Terraform directory not found"
        return
    fi
    
    # Check main.tf
    if [ -f "$TERRAFORM_DIR/main.tf" ]; then
        print_success "main.tf found"
        add_result "SUCCESS" "main.tf found"
    else
        print_error "main.tf not found"
        add_result "ERROR" "main.tf not found"
    fi
    
    # Check terraform.tfvars
    if [ -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
        print_success "terraform.tfvars found"
        add_result "SUCCESS" "terraform.tfvars found"
        
        # Check required variables
        cd "$TERRAFORM_DIR"
        
        # Check key_pair_name
        if grep -q "key_pair_name" terraform.tfvars; then
            local key_pair=$(grep "key_pair_name" terraform.tfvars | cut -d'=' -f2 | tr -d ' "')
            if [ "$key_pair" != "cactus-key" ]; then
                print_success "key_pair_name configured: $key_pair"
                add_result "SUCCESS" "key_pair_name configured"
            else
                print_warning "key_pair_name is default value"
                add_result "WARNING" "key_pair_name is default value"
            fi
        else
            print_error "key_pair_name not found in terraform.tfvars"
            add_result "ERROR" "key_pair_name not found"
        fi
        
        # Check alert_email
        if grep -q "alert_email" terraform.tfvars; then
            local email=$(grep "alert_email" terraform.tfvars | cut -d'=' -f2 | tr -d ' "')
            if [ "$email" != "admin@example.com" ]; then
                print_success "alert_email configured: $email"
                add_result "SUCCESS" "alert_email configured"
            else
                print_warning "alert_email is default value"
                add_result "WARNING" "alert_email is default value"
            fi
        else
            print_error "alert_email not found in terraform.tfvars"
            add_result "ERROR" "alert_email not found"
        fi
        
        # Check instance types
        if grep -q "instance_type_current.*t4g.small" terraform.tfvars; then
            print_success "instance_type_current: t4g.small"
            add_result "SUCCESS" "instance_type_current: t4g.small"
        else
            print_error "instance_type_current must be t4g.small"
            add_result "ERROR" "instance_type_current must be t4g.small"
        fi
        
        if grep -q "instance_type_next.*t4g.micro" terraform.tfvars; then
            print_success "instance_type_next: t4g.micro"
            add_result "SUCCESS" "instance_type_next: t4g.micro"
        else
            print_error "instance_type_next must be t4g.micro"
            add_result "ERROR" "instance_type_next must be t4g.micro"
        fi
        
        # Check budget limit
        if grep -q "monthly_budget_limit.*75" terraform.tfvars; then
            print_success "monthly_budget_limit: 75"
            add_result "SUCCESS" "monthly_budget_limit: 75"
        else
            print_error "monthly_budget_limit must be 75"
            add_result "ERROR" "monthly_budget_limit must be 75"
        fi
        
        # Check EBS volume size
        if grep -q "ebs_volume_size.*30" terraform.tfvars; then
            print_success "ebs_volume_size: 30GB"
            add_result "SUCCESS" "ebs_volume_size: 30GB"
        else
            print_error "ebs_volume_size must be 30"
            add_result "ERROR" "ebs_volume_size must be 30"
        fi
        
        cd "$PROJECT_ROOT"
    else
        print_error "terraform.tfvars not found"
        add_result "ERROR" "terraform.tfvars not found"
    fi
}

# Check required files
check_required_files() {
    print_header "Checking Required Files"
    
    # Check Lambda function
    if [ -f "$TERRAFORM_DIR/lambda/budget_stop_ec2.zip" ]; then
        print_success "Lambda function found"
        add_result "SUCCESS" "Lambda function found"
    else
        print_error "Lambda function not found"
        add_result "ERROR" "Lambda function not found"
    fi
    
    # Check user-data script
    if [ -f "$TERRAFORM_DIR/user-data.sh" ]; then
        print_success "user-data.sh found"
        add_result "SUCCESS" "user-data.sh found"
    else
        print_error "user-data.sh not found"
        add_result "ERROR" "user-data.sh not found"
    fi
    
    # Check auto-downgrade script
    if [ -f "$PROJECT_ROOT/scripts/auto-downgrade.sh" ]; then
        print_success "auto-downgrade.sh found"
        add_result "SUCCESS" "auto-downgrade.sh found"
    else
        print_error "auto-downgrade.sh not found"
        add_result "ERROR" "auto-downgrade.sh not found"
    fi
    
    # Check budget policy
    if [ -f "$TERRAFORM_DIR/budget-policy.json" ]; then
        print_success "budget-policy.json found"
        add_result "SUCCESS" "budget-policy.json found"
    else
        print_error "budget-policy.json not found"
        add_result "ERROR" "budget-policy.json not found"
    fi
    
    # Check IAM policy
    if [ -f "$TERRAFORM_DIR/iam-policy.json" ]; then
        print_success "iam-policy.json found"
        add_result "SUCCESS" "iam-policy.json found"
    else
        print_error "iam-policy.json not found"
        add_result "ERROR" "iam-policy.json not found"
    fi
}

# Check Terraform configuration constraints
check_terraform_constraints() {
    print_header "Checking Terraform Constraints"
    
    cd "$TERRAFORM_DIR"
    
    # Check if main.tf contains required configurations
    if grep -q "t4g.small" main.tf; then
        print_success "t4g.small instance type configured"
        add_result "SUCCESS" "t4g.small instance type configured"
    else
        print_error "t4g.small instance type not found in main.tf"
        add_result "ERROR" "t4g.small instance type not found"
    fi
    
    if grep -q "cpu_credits.*standard" main.tf; then
        print_success "Standard CPU credits configured"
        add_result "SUCCESS" "Standard CPU credits configured"
    else
        print_error "Standard CPU credits not configured"
        add_result "ERROR" "Standard CPU credits not configured"
    fi
    
    if grep -q "volume_size.*30" main.tf; then
        print_success "30GB EBS volume configured"
        add_result "SUCCESS" "30GB EBS volume configured"
    else
        print_warning "30GB EBS volume pattern not found in main.tf (check manually)"
        add_result "WARNING" "30GB EBS volume pattern not found in main.tf"
    fi
    
    if grep -q "ipv6_address_count.*0" main.tf; then
        print_success "IPv6 disabled"
        add_result "SUCCESS" "IPv6 disabled"
    else
        print_error "IPv6 not disabled"
        add_result "ERROR" "IPv6 not disabled"
    fi
    
    if grep -q "limit_amount.*75" main.tf; then
        print_success "Budget limit 75 configured"
        add_result "SUCCESS" "Budget limit 75 configured"
    else
        print_warning "Budget limit 75 pattern not found in main.tf (check manually)"
        add_result "WARNING" "Budget limit 75 pattern not found in main.tf"
    fi
    
    if grep -q "threshold.*95" main.tf; then
        print_success "Budget threshold 95% configured"
        add_result "SUCCESS" "Budget threshold 95% configured"
    else
        print_warning "Budget threshold 95% pattern not found in main.tf (check manually)"
        add_result "WARNING" "Budget threshold 95% pattern not found in main.tf"
    fi
    
    if grep -q "cron(15 0 1 1 ? 2026)" main.tf; then
        print_success "Auto-downgrade scheduled for Jan 1, 2026"
        add_result "SUCCESS" "Auto-downgrade scheduled for Jan 1, 2026"
    else
        print_error "Auto-downgrade not scheduled"
        add_result "ERROR" "Auto-downgrade not scheduled"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check deployment readiness
check_deployment_readiness() {
    print_header "Checking Deployment Readiness"
    
    # Check if Terraform can initialize
    cd "$TERRAFORM_DIR"
    if terraform init -backend=false &> /dev/null; then
        print_success "Terraform can initialize"
        add_result "SUCCESS" "Terraform can initialize"
    else
        print_error "Terraform cannot initialize"
        add_result "ERROR" "Terraform cannot initialize"
    fi
    
    # Check if Terraform can validate
    if terraform validate &> /dev/null; then
        print_success "Terraform configuration is valid"
        add_result "SUCCESS" "Terraform configuration is valid"
    else
        print_error "Terraform configuration is invalid"
        add_result "ERROR" "Terraform configuration is invalid"
    fi
    
    cd "$PROJECT_ROOT"
}

# Generate summary report
generate_summary() {
    print_header "Validation Summary"
    
    local total=0
    local success=0
    local warning=0
    local error=0
    
    for result in "${VALIDATION_RESULTS[@]}"; do
        local status=$(echo "$result" | cut -d'|' -f1)
        local message=$(echo "$result" | cut -d'|' -f2)
        
        total=$((total + 1))
        
        case "$status" in
            "SUCCESS")
                success=$((success + 1))
                print_success "$message"
                ;;
            "WARNING")
                warning=$((warning + 1))
                print_warning "$message"
                ;;
            "ERROR")
                error=$((error + 1))
                print_error "$message"
                ;;
        esac
    done
    
    echo ""
    echo "================================================"
    echo "Validation Results:"
    echo "Total checks: $total"
    echo "✅ Success: $success"
    echo "⚠️  Warnings: $warning"
    echo "❌ Errors: $error"
    echo "================================================"
    
    if [ $error -eq 0 ]; then
        if [ $warning -eq 0 ]; then
            print_success "All validations passed! Ready for deployment."
            return 0
        else
            print_warning "Validations passed with warnings. Review warnings before deployment."
            return 0
        fi
    else
        print_error "Validations failed. Fix errors before deployment."
        return 1
    fi
}

# Main function
main() {
    print_header "Cactus Dashboard AWS Deployment Validation"
    
    check_prerequisites
    check_terraform_config
    check_required_files
    check_terraform_constraints
    check_deployment_readiness
    generate_summary
}

# Execute main function
main "$@" 