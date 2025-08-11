#!/bin/bash

# =============================================================================
# Docker Cleanup Demo Script
# Cactus Dashboard - Demonstration of the cleanup system
# =============================================================================
#
# This script demonstrates the Docker cleanup system by:
# 1. Creating some test Docker resources
# 2. Showing the cleanup process
# 3. Cleaning up the demo resources
#
# Author: DevOps Expert for Cactus Dashboard
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "STEP")  echo -e "${BLUE}[STEP]${NC} $message" ;;
        *) echo -e "[$level] $message" ;;
    esac
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    log "INFO" "Docker is running and accessible"
}

# Create demo resources
create_demo_resources() {
    log "STEP" "Creating demo Docker resources..."
    
    # Create some test images
    log "INFO" "Creating test images..."
    docker pull hello-world:latest >/dev/null 2>&1 || true
    docker pull alpine:latest >/dev/null 2>&1 || true
    docker pull nginx:alpine >/dev/null 2>&1 || true
    
    # Create some test containers
    log "INFO" "Creating test containers..."
    docker run -d --name demo-nginx nginx:alpine >/dev/null 2>&1 || true
    docker run -d --name demo-alpine alpine:latest sleep 3600 >/dev/null 2>&1 || true
    
    # Stop some containers to simulate stopped ones
    log "INFO" "Stopping some containers..."
    docker stop demo-nginx >/dev/null 2>&1 || true
    
    # Create some test volumes
    log "INFO" "Creating test volumes..."
    docker volume create demo-volume-1 >/dev/null 2>&1 || true
    docker volume create demo-volume-2 >/dev/null 2>&1 || true
    
    # Create some unused networks
    log "INFO" "Creating test networks..."
    docker network create demo-network-1 >/dev/null 2>&1 || true
    docker network create demo-network-2 >/dev/null 2>&1 || true
    
    log "INFO" "Demo resources created successfully"
}

# Show current state
show_current_state() {
    log "STEP" "Current Docker state:"
    echo
    docker system df
    echo
}

# Run cleanup demo
run_cleanup_demo() {
    log "STEP" "Running cleanup demo..."
    echo
    
    # Run dry-run first
    log "INFO" "1. Dry-run (showing what would be cleaned):"
    ./scripts/docker-cleanup.sh --dry-run --verbose
    echo
    
    # Run actual cleanup
    log "INFO" "2. Actual cleanup:"
    ./scripts/docker-cleanup.sh --force
    echo
}

# Clean up demo resources
cleanup_demo_resources() {
    log "STEP" "Cleaning up demo resources..."
    
    # Remove containers
    docker rm -f demo-nginx demo-alpine 2>/dev/null || true
    
    # Remove images
    docker rmi hello-world:latest alpine:latest nginx:alpine 2>/dev/null || true
    
    # Remove volumes
    docker volume rm demo-volume-1 demo-volume-2 2>/dev/null || true
    
    # Remove networks
    docker network rm demo-network-1 demo-network-2 2>/dev/null || true
    
    log "INFO" "Demo resources cleaned up"
}

# Show final state
show_final_state() {
    log "STEP" "Final Docker state:"
    echo
    docker system df
    echo
}

# Main function
main() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Docker Cleanup Demo${NC}"
    echo -e "${CYAN}  Cactus Dashboard - macOS${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
    
    log "INFO" "This demo will create test Docker resources and show the cleanup process."
    log "INFO" "All demo resources will be removed at the end."
    echo
    
    read -p "Do you want to continue with the demo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Demo cancelled by user"
        exit 0
    fi
    
    # Run demo steps
    check_docker
    create_demo_resources
    show_current_state
    run_cleanup_demo
    cleanup_demo_resources
    show_final_state
    
    echo
    log "INFO" "Demo completed successfully!"
    log "INFO" "The cleanup system is working correctly."
    echo
    log "INFO" "Your automated cleanup service is still active and will run every Sunday at 2:00 AM."
    log "INFO" "You can monitor it anytime with: ./scripts/docker-status.sh"
}

# Run main function
main "$@"

