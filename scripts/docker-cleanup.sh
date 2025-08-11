#!/bin/bash

# =============================================================================
# Docker Cleanup Script for macOS
# Cactus Dashboard - Automated Docker Storage Management
# =============================================================================
# 
# This script safely cleans up Docker resources while preserving active containers
# and volumes used by the Cactus Dashboard project.
#
# Features:
# - Safe cleanup of unused Docker resources
# - Space usage reporting before and after cleanup
# - Protection of active containers and volumes
# - Detailed logging and error handling
# - Compatible with macOS and Docker Desktop
#
# Usage:
#   ./docker-cleanup.sh [--dry-run] [--verbose] [--force]
#
# Options:
#   --dry-run    Show what would be cleaned without actually doing it
#   --verbose    Show detailed output
#   --force      Skip confirmation prompts
#
# Author: DevOps Expert for Cactus Dashboard
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/docker-cleanup.log"
BACKUP_DIR="$SCRIPT_DIR/backups"
DRY_RUN=false
VERBOSE=false
FORCE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Cactus Dashboard specific containers and volumes to protect
PROTECTED_CONTAINERS=(
    "cactus-backend"
    "cactus-frontend" 
    "cactus-db"
    "cactus-redis"
    "cactus-nginx"
    "cactus-prometheus"
    "cactus-grafana"
)

PROTECTED_VOLUMES=(
    "cactus-wealth-backend_postgres_data"
    "cactus-wealth-backend_redis_data"
    "cactus-wealth-backend_backend_logs"
    "cactus-wealth-backend_frontend_logs"
    "cactus-wealth-backend_nginx_logs"
    "cactus-wealth-backend_prometheus_data"
    "cactus-wealth-backend_grafana_data"
    "postgres_data"
    "redis_data"
    "backend_logs"
    "frontend_logs"
    "nginx_logs"
    "prometheus_data"
    "grafana_data"
)

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") 
            if [[ "$VERBOSE" == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $message"
            fi
            ;;
        *) echo -e "[$level] $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Utility functions
get_docker_space_usage() {
    local space_info
    space_info=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}")
    echo "$space_info"
}

get_docker_space_summary() {
    docker system df --format "table {{.Type}}\t{{.Size}}\t{{.Reclaimable}}" | tail -n +2
}

format_bytes() {
    local bytes="$1"
    if [[ $bytes -gt 1073741824 ]]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc) GB"
    elif [[ $bytes -gt 1048576 ]]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc) MB"
    elif [[ $bytes -gt 1024 ]]; then
        echo "$(echo "scale=2; $bytes/1024" | bc) KB"
    else
        echo "${bytes} B"
    fi
}

get_reclaimable_space() {
    local reclaimable_bytes
    reclaimable_bytes=$(docker system df --format "{{.Reclaimable}}" | tail -n +2 | awk '{sum += $1} END {print sum}')
    echo "${reclaimable_bytes:-0}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    log "INFO" "Docker is running and accessible"
}

# Get list of active containers
get_active_containers() {
    docker ps --format "{{.Names}}" 2>/dev/null || true
}

# Get list of all containers (including stopped)
get_all_containers() {
    docker ps -a --format "{{.Names}}" 2>/dev/null || true
}

# Get list of all volumes
get_all_volumes() {
    docker volume ls --format "{{.Name}}" 2>/dev/null || true
}

# Check if container is protected
is_protected_container() {
    local container_name="$1"
    for protected in "${PROTECTED_CONTAINERS[@]}"; do
        if [[ "$container_name" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# Check if volume is protected
is_protected_volume() {
    local volume_name="$1"
    for protected in "${PROTECTED_VOLUMES[@]}"; do
        if [[ "$volume_name" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# Backup function (for safety)
backup_docker_info() {
    log "INFO" "Creating backup of current Docker state..."
    
    mkdir -p "$BACKUP_DIR"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    # Backup container information
    docker ps -a > "$BACKUP_DIR/containers_$timestamp.txt" 2>/dev/null || true
    docker images > "$BACKUP_DIR/images_$timestamp.txt" 2>/dev/null || true
    docker volume ls > "$BACKUP_DIR/volumes_$timestamp.txt" 2>/dev/null || true
    docker network ls > "$BACKUP_DIR/networks_$timestamp.txt" 2>/dev/null || true
    
    log "INFO" "Backup created in $BACKUP_DIR"
}

# Cleanup functions
cleanup_stopped_containers() {
    log "INFO" "Cleaning up stopped containers..."
    
    local stopped_containers
    stopped_containers=$(docker ps -a --filter "status=exited" --filter "status=created" --format "{{.Names}}" 2>/dev/null || true)
    
    if [[ -z "$stopped_containers" ]]; then
        log "INFO" "No stopped containers found"
        return
    fi
    
    local cleaned_count=0
    while IFS= read -r container; do
        if [[ -n "$container" ]] && ! is_protected_container "$container"; then
            if [[ "$DRY_RUN" == true ]]; then
                log "DEBUG" "Would remove stopped container: $container"
            else
                log "DEBUG" "Removing stopped container: $container"
                docker rm "$container" >/dev/null 2>&1 || log "WARN" "Failed to remove container: $container"
                ((cleaned_count++))
            fi
        else
            log "DEBUG" "Skipping protected container: $container"
        fi
    done <<< "$stopped_containers"
    
    log "INFO" "Cleaned up $cleaned_count stopped containers"
}

cleanup_unused_images() {
    log "INFO" "Cleaning up unused images..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DEBUG" "Would run: docker image prune -f"
    else
        local removed_images
        removed_images=$(docker image prune -f 2>&1 || true)
        log "INFO" "Removed unused images"
        if [[ "$VERBOSE" == true ]]; then
            echo "$removed_images"
        fi
    fi
}

cleanup_unused_volumes() {
    log "INFO" "Cleaning up unused volumes..."
    
    local unused_volumes
    unused_volumes=$(docker volume ls -q -f dangling=true 2>/dev/null || true)
    
    if [[ -z "$unused_volumes" ]]; then
        log "INFO" "No unused volumes found"
        return
    fi
    
    local cleaned_count=0
    while IFS= read -r volume; do
        if [[ -n "$volume" ]] && ! is_protected_volume "$volume"; then
            if [[ "$DRY_RUN" == true ]]; then
                log "DEBUG" "Would remove unused volume: $volume"
            else
                log "DEBUG" "Removing unused volume: $volume"
                docker volume rm "$volume" >/dev/null 2>&1 || log "WARN" "Failed to remove volume: $volume"
                ((cleaned_count++))
            fi
        else
            log "DEBUG" "Skipping protected volume: $volume"
        fi
    done <<< "$unused_volumes"
    
    log "INFO" "Cleaned up $cleaned_count unused volumes"
}

cleanup_unused_networks() {
    log "INFO" "Cleaning up unused networks..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DEBUG" "Would run: docker network prune -f"
    else
        local removed_networks
        removed_networks=$(docker network prune -f 2>&1 || true)
        log "INFO" "Removed unused networks"
        if [[ "$VERBOSE" == true ]]; then
            echo "$removed_networks"
        fi
    fi
}

cleanup_build_cache() {
    log "INFO" "Cleaning up build cache..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DEBUG" "Would run: docker builder prune -f"
    else
        local removed_cache
        removed_cache=$(docker builder prune -f 2>&1 || true)
        log "INFO" "Removed build cache"
        if [[ "$VERBOSE" == true ]]; then
            echo "$removed_cache"
        fi
    fi
}

# Main cleanup function
perform_cleanup() {
    log "INFO" "Starting Docker cleanup process..."
    
    # Show current state
    log "INFO" "Current Docker space usage:"
    get_docker_space_usage
    
    # Perform cleanup operations
    cleanup_stopped_containers
    cleanup_unused_images
    cleanup_unused_volumes
    cleanup_unused_networks
    cleanup_build_cache
    
    # Show final state
    log "INFO" "Cleanup completed. Final Docker space usage:"
    get_docker_space_usage
}

# Show protected resources
show_protected_resources() {
    log "INFO" "Protected containers (will not be removed):"
    for container in "${PROTECTED_CONTAINERS[@]}"; do
        echo "  - $container"
    done
    
    log "INFO" "Protected volumes (will not be removed):"
    for volume in "${PROTECTED_VOLUMES[@]}"; do
        echo "  - $volume"
    done
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--dry-run] [--verbose] [--force]"
                echo ""
                echo "Options:"
                echo "  --dry-run    Show what would be cleaned without actually doing it"
                echo "  --verbose    Show detailed output"
                echo "  --force      Skip confirmation prompts"
                echo "  --help, -h   Show this help message"
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    # Parse arguments first
    parse_arguments "$@"
    
    # Initialize log file
    echo "=== Docker Cleanup Log - $(date) ===" > "$LOG_FILE"
    
    log "INFO" "Starting Docker cleanup script"
    log "INFO" "Script directory: $SCRIPT_DIR"
    log "INFO" "Dry run mode: $DRY_RUN"
    log "INFO" "Verbose mode: $VERBOSE"
    
    # Check Docker
    check_docker
    
    # Show protected resources
    show_protected_resources
    
    # Get initial space usage
    local initial_space
    initial_space=$(get_reclaimable_space)
    log "INFO" "Initial reclaimable space: $(format_bytes $initial_space)"
    
    # Backup current state
    backup_docker_info
    
    # Confirmation prompt (unless --force is used)
    if [[ "$DRY_RUN" == false && "$FORCE" == false ]]; then
        echo -e "${YELLOW}This will clean up unused Docker resources.${NC}"
        echo -e "${YELLOW}Protected containers and volumes will be preserved.${NC}"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Cleanup cancelled by user"
            exit 0
        fi
    fi
    
    # Perform cleanup
    perform_cleanup
    
    # Calculate space saved
    local final_space
    final_space=$(get_reclaimable_space)
    local space_saved=$((initial_space - final_space))
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "DRY RUN: Would have freed approximately $(format_bytes $space_saved)"
    else
        log "INFO" "Successfully freed $(format_bytes $space_saved)"
    fi
    
    log "INFO" "Docker cleanup completed successfully"
}

# Run main function with all arguments
main "$@"
