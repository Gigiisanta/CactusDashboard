#!/bin/bash

# =============================================================================
# Docker Status Monitor for macOS
# Cactus Dashboard - Docker Storage and Cleanup System Status
# =============================================================================
#
# This script provides a comprehensive overview of:
# - Current Docker storage usage
# - Status of the cleanup service
# - Protected containers and volumes
# - Recent cleanup logs
# - System recommendations
#
# Author: DevOps Expert for Cactus Dashboard
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLEANUP_SCRIPT="$SCRIPT_DIR/docker-cleanup.sh"
LOG_FILE="$SCRIPT_DIR/docker-cleanup.log"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/com.cactus.docker-cleanup.plist"

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

# Utility functions
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

# Check Docker status
check_docker_status() {
    echo -e "${CYAN}🐳 Docker Status${NC}"
    echo "=================="
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Docker is running${NC}"
    
    # Get Docker version
    local docker_version
    docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo "   Version: $docker_version"
    
    # Get Docker Desktop status
    if pgrep -f "Docker Desktop" >/dev/null; then
        echo -e "   Desktop: ${GREEN}Running${NC}"
    else
        echo -e "   Desktop: ${YELLOW}Not detected${NC}"
    fi
    
    echo
}

# Show Docker storage usage
show_storage_usage() {
    echo -e "${CYAN}💾 Storage Usage${NC}"
    echo "================="
    
    # Get detailed storage information
    local storage_info
    storage_info=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}")
    echo "$storage_info"
    
    # Calculate total reclaimable space
    local reclaimable_space
    reclaimable_space=$(get_reclaimable_space)
    
    echo
    echo -e "${YELLOW}📊 Summary:${NC}"
    echo "   Reclaimable space: $(format_bytes $reclaimable_space)"
    
    # Provide recommendations based on space usage
    if [[ $reclaimable_space -gt 5368709120 ]]; then  # 5 GB
        echo -e "   ${RED}⚠️  High space usage detected! Consider running cleanup.${NC}"
    elif [[ $reclaimable_space -gt 1073741824 ]]; then  # 1 GB
        echo -e "   ${YELLOW}⚠️  Moderate space usage. Cleanup recommended.${NC}"
    else
        echo -e "   ${GREEN}✅ Space usage is normal.${NC}"
    fi
    
    echo
}

# Show container status
show_container_status() {
    echo -e "${CYAN}📦 Container Status${NC}"
    echo "====================="
    
    # Get all containers
    local all_containers
    all_containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null || true)
    
    if [[ -z "$all_containers" ]]; then
        echo "No containers found"
    else
        echo "$all_containers"
    fi
    
    echo
}

# Show volume status
show_volume_status() {
    echo -e "${CYAN}💿 Volume Status${NC}"
    echo "=================="
    
    # Get all volumes
    local all_volumes
    all_volumes=$(docker volume ls --format "table {{.Name}}\t{{.Driver}}" 2>/dev/null || true)
    
    if [[ -z "$all_volumes" ]]; then
        echo "No volumes found"
    else
        echo "$all_volumes"
    fi
    
    echo
}

# Check cleanup service status
check_cleanup_service() {
    echo -e "${CYAN}🧹 Cleanup Service Status${NC}"
    echo "========================="
    
    # Check if plist file exists
    if [[ -f "$PLIST_DEST" ]]; then
        echo -e "${GREEN}✅ Service file installed${NC}"
    else
        echo -e "${RED}❌ Service file not found${NC}"
        return
    fi
    
    # Check if service is loaded
    if launchctl list | grep -q "com.cactus.docker-cleanup"; then
        echo -e "${GREEN}✅ Service is loaded and active${NC}"
    else
        echo -e "${YELLOW}⚠️  Service is not loaded${NC}"
    fi
    
    # Check next run time (approximate)
    echo "   Next scheduled run: Sunday 2:00 AM"
    
    # Check if cleanup script exists and is executable
    if [[ -f "$CLEANUP_SCRIPT" ]]; then
        if [[ -x "$CLEANUP_SCRIPT" ]]; then
            echo -e "${GREEN}✅ Cleanup script is executable${NC}"
        else
            echo -e "${RED}❌ Cleanup script is not executable${NC}"
        fi
    else
        echo -e "${RED}❌ Cleanup script not found${NC}"
    fi
    
    echo
}

# Show recent logs
show_recent_logs() {
    echo -e "${CYAN}📋 Recent Cleanup Logs${NC}"
    echo "======================="
    
    if [[ -f "$LOG_FILE" ]]; then
        # Show last 10 lines of the log
        local recent_logs
        recent_logs=$(tail -n 10 "$LOG_FILE" 2>/dev/null || true)
        
        if [[ -n "$recent_logs" ]]; then
            echo "$recent_logs"
        else
            echo "No recent logs found"
        fi
    else
        echo "Log file not found: $LOG_FILE"
    fi
    
    echo
}

# Show protected resources
show_protected_resources() {
    echo -e "${CYAN}🛡️  Protected Resources${NC}"
    echo "======================="
    
    echo -e "${BLUE}Protected Containers:${NC}"
    for container in "${PROTECTED_CONTAINERS[@]}"; do
        echo "   - $container"
    done
    
    echo
    echo -e "${BLUE}Protected Volumes:${NC}"
    for volume in "${PROTECTED_VOLUMES[@]}"; do
        echo "   - $volume"
    done
    
    echo
}

# Show recommendations
show_recommendations() {
    echo -e "${CYAN}💡 Recommendations${NC}"
    echo "=================="
    
    local reclaimable_space
    reclaimable_space=$(get_reclaimable_space)
    
    if [[ $reclaimable_space -gt 5368709120 ]]; then  # 5 GB
        echo -e "${RED}🚨 Immediate action recommended:${NC}"
        echo "   Run: $CLEANUP_SCRIPT --force"
    elif [[ $reclaimable_space -gt 1073741824 ]]; then  # 1 GB
        echo -e "${YELLOW}⚠️  Consider cleanup:${NC}"
        echo "   Run: $CLEANUP_SCRIPT"
    else
        echo -e "${GREEN}✅ No immediate action needed${NC}"
    fi
    
    echo
    echo -e "${BLUE}📝 Manual commands:${NC}"
    echo "   Dry run: $CLEANUP_SCRIPT --dry-run"
    echo "   Force cleanup: $CLEANUP_SCRIPT --force"
    echo "   View logs: tail -f $LOG_FILE"
    echo "   Check service: launchctl list | grep docker-cleanup"
    
    echo
}

# Main function
main() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}  Docker Status Monitor${NC}"
    echo -e "${PURPLE}  Cactus Dashboard - macOS${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo
    
    # Check Docker status first
    if ! check_docker_status; then
        echo -e "${RED}Docker is not available. Please start Docker Desktop.${NC}"
        exit 1
    fi
    
    # Show all status information
    show_storage_usage
    show_container_status
    show_volume_status
    check_cleanup_service
    show_protected_resources
    show_recent_logs
    show_recommendations
    
    echo -e "${GREEN}Status check completed!${NC}"
}

# Run main function
main "$@"

