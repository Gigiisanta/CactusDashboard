#!/bin/bash

# =============================================================================
# Docker Cleanup Uninstall Script for macOS
# Cactus Dashboard - Automated Docker Storage Management Removal
# =============================================================================
#
# This script removes the automated Docker cleanup system
# for the Cactus Dashboard project on macOS.
#
# Features:
# - Unloads and removes launchd service
# - Removes plist file from LaunchAgents
# - Cleans up log files (optional)
# - Provides confirmation prompts
#
# Author: DevOps Expert for Cactus Dashboard
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/com.cactus.docker-cleanup.plist"

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

# Check if running on macOS
check_macos() {
    if [[ "$(uname)" != "Darwin" ]]; then
        log "ERROR" "This script is designed for macOS only."
        exit 1
    fi
    log "INFO" "macOS detected"
}

# Check if service is installed
check_service_installed() {
    if [[ ! -f "$PLIST_DEST" ]]; then
        log "WARN" "Docker cleanup service is not installed."
        log "INFO" "No uninstallation needed."
        exit 0
    fi
    
    log "INFO" "Docker cleanup service found"
}

# Unload launchd service
unload_service() {
    log "STEP" "Unloading launchd service..."
    
    if launchctl list | grep -q "com.cactus.docker-cleanup"; then
        launchctl unload "$PLIST_DEST"
        log "INFO" "Service unloaded successfully"
    else
        log "INFO" "Service was not running"
    fi
}

# Remove plist file
remove_plist() {
    log "STEP" "Removing plist file..."
    
    if [[ -f "$PLIST_DEST" ]]; then
        rm "$PLIST_DEST"
        log "INFO" "Plist file removed: $PLIST_DEST"
    else
        log "WARN" "Plist file not found: $PLIST_DEST"
    fi
}

# Clean up log files (optional)
cleanup_logs() {
    log "STEP" "Cleaning up log files..."
    
    local log_files=(
        "$PROJECT_ROOT/logs/docker-cleanup.log"
        "$PROJECT_ROOT/logs/docker-cleanup.out"
        "$PROJECT_ROOT/logs/docker-cleanup.err"
    )
    
    local removed_count=0
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            rm "$log_file"
            log "INFO" "Removed log file: $log_file"
            ((removed_count++))
        fi
    done
    
    if [[ $removed_count -eq 0 ]]; then
        log "INFO" "No log files found to remove"
    else
        log "INFO" "Removed $removed_count log files"
    fi
}

# Clean up backup files (optional)
cleanup_backups() {
    log "STEP" "Cleaning up backup files..."
    
    local backup_dir="$SCRIPT_DIR/backups"
    
    if [[ -d "$backup_dir" ]]; then
        local backup_count=$(find "$backup_dir" -name "*.txt" | wc -l)
        if [[ $backup_count -gt 0 ]]; then
            rm -rf "$backup_dir"
            log "INFO" "Removed backup directory: $backup_dir"
            log "INFO" "Removed $backup_count backup files"
        else
            log "INFO" "No backup files found"
        fi
    else
        log "INFO" "Backup directory not found"
    fi
}

# Show uninstallation summary
show_summary() {
    echo
    log "STEP" "Uninstallation Summary"
    echo "============================"
    log "INFO" "✅ Launchd service unloaded"
    log "INFO" "✅ Plist file removed"
    log "INFO" "✅ Log files cleaned up"
    log "INFO" "✅ Backup files cleaned up"
    echo
    log "INFO" "Docker cleanup service has been completely removed."
    log "INFO" "Your Docker containers and volumes are unaffected."
    echo
}

# Main uninstallation function
main() {
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${CYAN}  Docker Cleanup Uninstall Script${NC}"
    echo -e "${CYAN}  Cactus Dashboard - macOS${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo
    
    log "INFO" "Starting uninstallation..."
    
    # Check system
    check_macos
    check_service_installed
    
    # Confirmation prompt
    echo -e "${YELLOW}This will remove the automated Docker cleanup service.${NC}"
    echo -e "${YELLOW}Your Docker containers and volumes will NOT be affected.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Uninstallation cancelled by user"
        exit 0
    fi
    
    # Run uninstallation steps
    unload_service
    remove_plist
    cleanup_logs
    cleanup_backups
    
    # Show results
    show_summary
    
    log "INFO" "Uninstallation completed successfully!"
}

# Run main function
main "$@"

