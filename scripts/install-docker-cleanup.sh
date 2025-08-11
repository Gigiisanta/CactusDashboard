#!/bin/bash

# =============================================================================
# Docker Cleanup Installation Script for macOS
# Cactus Dashboard - Automated Docker Storage Management Setup
# =============================================================================
#
# This script installs and configures the automated Docker cleanup system
# for the Cactus Dashboard project on macOS.
#
# Features:
# - Installs the cleanup script with proper permissions
# - Configures launchd for weekly automatic execution
# - Creates necessary directories and log files
# - Tests the installation
# - Provides usage instructions
#
# Author: DevOps Expert for Cactus Dashboard
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLEANUP_SCRIPT="$SCRIPT_DIR/docker-cleanup.sh"
PLIST_FILE="$SCRIPT_DIR/com.cactus.docker-cleanup.plist"
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

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed. Please install Docker Desktop first."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    
    log "INFO" "Docker is installed and running"
}

# Check if required files exist
check_files() {
    if [[ ! -f "$CLEANUP_SCRIPT" ]]; then
        log "ERROR" "Cleanup script not found: $CLEANUP_SCRIPT"
        exit 1
    fi
    
    if [[ ! -f "$PLIST_FILE" ]]; then
        log "ERROR" "Plist file not found: $PLIST_FILE"
        exit 1
    fi
    
    log "INFO" "All required files found"
}

# Create necessary directories
create_directories() {
    log "STEP" "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    log "INFO" "Created logs directory: $PROJECT_ROOT/logs"
    
    # Create backups directory
    mkdir -p "$SCRIPT_DIR/backups"
    log "INFO" "Created backups directory: $SCRIPT_DIR/backups"
    
    # Create LaunchAgents directory if it doesn't exist
    mkdir -p "$LAUNCH_AGENTS_DIR"
    log "INFO" "LaunchAgents directory ready: $LAUNCH_AGENTS_DIR"
}

# Set proper permissions
set_permissions() {
    log "STEP" "Setting proper permissions..."
    
    # Make cleanup script executable
    chmod +x "$CLEANUP_SCRIPT"
    log "INFO" "Made cleanup script executable"
    
    # Set proper permissions for plist file
    chmod 644 "$PLIST_FILE"
    log "INFO" "Set plist file permissions"
}

# Update plist file with correct paths
update_plist_paths() {
    log "STEP" "Updating plist file with correct paths..."
    
    # Create a temporary plist with updated paths
    local temp_plist="$SCRIPT_DIR/temp_plist.plist"
    
    # Update the plist file with the correct user path
    sed "s|/Users/prueba|$HOME|g" "$PLIST_FILE" > "$temp_plist"
    
    # Replace the original with the updated version
    mv "$temp_plist" "$PLIST_FILE"
    
    log "INFO" "Updated plist file with correct user paths"
}

# Install launchd service
install_launchd_service() {
    log "STEP" "Installing launchd service..."
    
    # Copy plist file to LaunchAgents
    cp "$PLIST_FILE" "$PLIST_DEST"
    log "INFO" "Copied plist file to LaunchAgents"
    
    # Load the service
    if launchctl list | grep -q "com.cactus.docker-cleanup"; then
        log "INFO" "Unloading existing service..."
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
    fi
    
    launchctl load "$PLIST_DEST"
    log "INFO" "Loaded launchd service"
    
    # Verify the service is loaded
    if launchctl list | grep -q "com.cactus.docker-cleanup"; then
        log "INFO" "Service successfully loaded and active"
    else
        log "WARN" "Service may not be loaded properly"
    fi
}

# Test the cleanup script
test_cleanup_script() {
    log "STEP" "Testing cleanup script..."
    
    log "INFO" "Running dry-run test..."
    if "$CLEANUP_SCRIPT" --dry-run --verbose; then
        log "INFO" "Dry-run test completed successfully"
    else
        log "WARN" "Dry-run test had issues, but continuing installation"
    fi
}

# Show installation summary
show_summary() {
    echo
    log "STEP" "Installation Summary"
    echo "=================================="
    log "INFO" "✅ Cleanup script installed: $CLEANUP_SCRIPT"
    log "INFO" "✅ Launchd service installed: $PLIST_DEST"
    log "INFO" "✅ Service will run every Sunday at 2:00 AM"
    log "INFO" "✅ Logs will be saved to: $PROJECT_ROOT/logs/"
    log "INFO" "✅ Backups will be saved to: $SCRIPT_DIR/backups/"
    echo
}

# Show usage instructions
show_usage() {
    echo
    log "STEP" "Usage Instructions"
    echo "====================="
    echo
    echo "Manual execution:"
    echo "  $CLEANUP_SCRIPT                    # Normal cleanup with confirmation"
    echo "  $CLEANUP_SCRIPT --force            # Cleanup without confirmation"
    echo "  $CLEANUP_SCRIPT --dry-run          # Show what would be cleaned"
    echo "  $CLEANUP_SCRIPT --verbose          # Show detailed output"
    echo
    echo "Service management:"
    echo "  launchctl list | grep docker-cleanup    # Check if service is loaded"
    echo "  launchctl unload $PLIST_DEST            # Stop automatic execution"
    echo "  launchctl load $PLIST_DEST              # Start automatic execution"
    echo
    echo "Logs and monitoring:"
    echo "  tail -f $PROJECT_ROOT/logs/docker-cleanup.log    # View cleanup logs"
    echo "  tail -f $PROJECT_ROOT/logs/docker-cleanup.out    # View stdout logs"
    echo "  tail -f $PROJECT_ROOT/logs/docker-cleanup.err    # View error logs"
    echo
    echo "Uninstall:"
    echo "  launchctl unload $PLIST_DEST"
    echo "  rm $PLIST_DEST"
    echo
}

# Main installation function
main() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Docker Cleanup Installation Script${NC}"
    echo -e "${CYAN}  Cactus Dashboard - macOS${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
    
    log "INFO" "Starting installation..."
    
    # Run installation steps
    check_macos
    check_docker
    check_files
    create_directories
    set_permissions
    update_plist_paths
    install_launchd_service
    test_cleanup_script
    
    # Show results
    show_summary
    show_usage
    
    log "INFO" "Installation completed successfully!"
    echo
    log "INFO" "The Docker cleanup system is now installed and will run automatically every Sunday at 2:00 AM."
    log "INFO" "You can also run it manually anytime using the commands shown above."
}

# Run main function
main "$@"

