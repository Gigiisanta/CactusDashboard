#!/bin/bash

# Docker Health Check Script
# Verifies Docker daemon status and starts Docker Desktop if needed

echo "🔍 Checking Docker daemon status..."

# Check if Docker daemon is running
if docker info >/dev/null 2>&1; then
    echo "✅ Docker daemon is running"
    echo "📊 Docker info:"
    docker info --format "table {{.ServerVersion}}\t{{.OperatingSystem}}\t{{.Architecture}}" | head -2
    echo ""
    echo "🐳 Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -5
else
    echo "❌ Docker daemon is not available"
    echo "🚀 Attempting to start Docker Desktop..."
    
    # Try to start Docker Desktop
    if open -a Docker; then
        echo "⏳ Docker Desktop is starting..."
        echo "💡 Please wait a moment and run this script again"
    else
        echo "❌ Failed to start Docker Desktop"
        echo "💡 Please start Docker Desktop manually from Applications"
    fi
fi

# Check socket symlink
if [ -L "/var/run/docker.sock" ]; then
    echo "✅ Docker socket symlink exists at /var/run/docker.sock"
else
    echo "⚠️  Docker socket symlink missing"
    echo "🔧 Creating symlink..."
    sudo ln -sf ~/.docker/run/docker.sock /var/run/docker.sock
    echo "✅ Symlink created"
fi

echo ""
echo "🔧 Docker configuration:"
echo "   Socket location: $(readlink -f /var/run/docker.sock 2>/dev/null || echo 'Not found')"
echo "   User permissions: $(ls -la ~/.docker/run/docker.sock 2>/dev/null | awk '{print $1, $3, $4}' || echo 'Not accessible')" 