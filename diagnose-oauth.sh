#!/bin/bash

# =============================================================================
# SCRIPT DE DIAGNÓSTICO OAUTH - CACTUS DASHBOARD
# =============================================================================
# Verifica la configuración actual de OAuth y detecta problemas
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✅ OK]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

header() {
    echo -e "${CYAN}=== $1 ===${NC}"
}

echo ""
header "🔍 DIAGNÓSTICO OAUTH - CACTUS DASHBOARD"
echo ""

# 1. Verificar archivos de configuración
header "📁 ARCHIVOS DE CONFIGURACIÓN"

if [ -f ".env" ]; then
    success "Archivo .env encontrado"
    
    # Extraer variables del .env
    GOOGLE_CLIENT_ID_ROOT=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2 | tr -d '"' || echo "")
    GOOGLE_CLIENT_SECRET_ROOT=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2 | tr -d '"' || echo "")
    NEXTAUTH_SECRET_ROOT=$(grep "^NEXTAUTH_SECRET=" .env | cut -d'=' -f2 | tr -d '"' || echo "")
    
    if [ -n "$GOOGLE_CLIENT_ID_ROOT" ] && [ "$GOOGLE_CLIENT_ID_ROOT" != "TU_NUEVO_GOOGLE_CLIENT_ID_AQUI" ]; then
        success "GOOGLE_CLIENT_ID configurado en .env"
    else
        error "GOOGLE_CLIENT_ID no configurado en .env"
    fi
    
    if [ -n "$GOOGLE_CLIENT_SECRET_ROOT" ] && [ "$GOOGLE_CLIENT_SECRET_ROOT" != "TU_NUEVO_GOOGLE_CLIENT_SECRET_AQUI" ]; then
        success "GOOGLE_CLIENT_SECRET configurado en .env"
    else
        error "GOOGLE_CLIENT_SECRET no configurado en .env"
    fi
    
    if [ -n "$NEXTAUTH_SECRET_ROOT" ]; then
        success "NEXTAUTH_SECRET configurado en .env"
    else
        error "NEXTAUTH_SECRET no configurado en .env"
    fi
else
    error "Archivo .env no encontrado"
fi

echo ""

if [ -f "cactus-wealth-frontend/.env.local" ]; then
    success "Archivo cactus-wealth-frontend/.env.local encontrado"
    
    # Extraer variables del .env.local
    GOOGLE_CLIENT_ID_FRONTEND=$(grep "^GOOGLE_CLIENT_ID=" cactus-wealth-frontend/.env.local | cut -d'=' -f2 | tr -d '"' || echo "")
    GOOGLE_CLIENT_SECRET_FRONTEND=$(grep "^GOOGLE_CLIENT_SECRET=" cactus-wealth-frontend/.env.local | cut -d'=' -f2 | tr -d '"' || echo "")
    NEXTAUTH_SECRET_FRONTEND=$(grep "^NEXTAUTH_SECRET=" cactus-wealth-frontend/.env.local | cut -d'=' -f2 | tr -d '"' || echo "")
    
    if [ -n "$GOOGLE_CLIENT_ID_FRONTEND" ] && [ "$GOOGLE_CLIENT_ID_FRONTEND" != "TU_NUEVO_GOOGLE_CLIENT_ID_AQUI" ]; then
        success "GOOGLE_CLIENT_ID configurado en .env.local"
    else
        error "GOOGLE_CLIENT_ID no configurado en .env.local"
    fi
    
    if [ -n "$GOOGLE_CLIENT_SECRET_FRONTEND" ] && [ "$GOOGLE_CLIENT_SECRET_FRONTEND" != "TU_NUEVO_GOOGLE_CLIENT_SECRET_AQUI" ]; then
        success "GOOGLE_CLIENT_SECRET configurado en .env.local"
    else
        error "GOOGLE_CLIENT_SECRET no configurado en .env.local"
    fi
    
    if [ -n "$NEXTAUTH_SECRET_FRONTEND" ]; then
        success "NEXTAUTH_SECRET configurado en .env.local"
    else
        warning "NEXTAUTH_SECRET no encontrado en .env.local (puede estar en .env)"
    fi
else
    error "Archivo cactus-wealth-frontend/.env.local no encontrado"
fi

echo ""

# 2. Verificar consistencia entre archivos
header "🔄 CONSISTENCIA ENTRE ARCHIVOS"

if [ -n "$GOOGLE_CLIENT_ID_ROOT" ] && [ -n "$GOOGLE_CLIENT_ID_FRONTEND" ]; then
    if [ "$GOOGLE_CLIENT_ID_ROOT" = "$GOOGLE_CLIENT_ID_FRONTEND" ]; then
        success "GOOGLE_CLIENT_ID es consistente entre archivos"
    else
        error "GOOGLE_CLIENT_ID es diferente entre .env y .env.local"
        echo "   .env: $GOOGLE_CLIENT_ID_ROOT"
        echo "   .env.local: $GOOGLE_CLIENT_ID_FRONTEND"
    fi
fi

if [ -n "$GOOGLE_CLIENT_SECRET_ROOT" ] && [ -n "$GOOGLE_CLIENT_SECRET_FRONTEND" ]; then
    if [ "$GOOGLE_CLIENT_SECRET_ROOT" = "$GOOGLE_CLIENT_SECRET_FRONTEND" ]; then
        success "GOOGLE_CLIENT_SECRET es consistente entre archivos"
    else
        error "GOOGLE_CLIENT_SECRET es diferente entre .env y .env.local"
    fi
fi

echo ""

# 3. Verificar Docker
header "🐳 ESTADO DE DOCKER"

if docker ps >/dev/null 2>&1; then
    success "Docker está ejecutándose"
    
    # Verificar contenedores
    if docker ps | grep -q "cactusdashboard-frontend"; then
        success "Contenedor frontend está ejecutándose"
        
        # Verificar variables de entorno en el contenedor
        log "Verificando variables de entorno en el contenedor..."
        CONTAINER_GOOGLE_ID=$(docker exec cactusdashboard-frontend-1 printenv GOOGLE_CLIENT_ID 2>/dev/null || echo "")
        CONTAINER_NEXTAUTH_SECRET=$(docker exec cactusdashboard-frontend-1 printenv NEXTAUTH_SECRET 2>/dev/null || echo "")
        
        if [ -n "$CONTAINER_GOOGLE_ID" ]; then
            success "GOOGLE_CLIENT_ID disponible en contenedor"
        else
            error "GOOGLE_CLIENT_ID no disponible en contenedor"
        fi
        
        if [ -n "$CONTAINER_NEXTAUTH_SECRET" ]; then
            success "NEXTAUTH_SECRET disponible en contenedor"
        else
            error "NEXTAUTH_SECRET no disponible en contenedor"
        fi
    else
        error "Contenedor frontend no está ejecutándose"
    fi
    
    if docker ps | grep -q "cactusdashboard-backend"; then
        success "Contenedor backend está ejecutándose"
    else
        error "Contenedor backend no está ejecutándose"
    fi
else
    error "Docker no está ejecutándose"
fi

echo ""

# 4. Verificar conectividad
header "🌐 CONECTIVIDAD DE SERVICIOS"

# Verificar backend
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    success "Backend responde en http://localhost:8000"
else
    error "Backend no responde en http://localhost:8000"
fi

# Verificar frontend
if curl -s -I http://localhost:3000 >/dev/null 2>&1; then
    success "Frontend responde en http://localhost:3000"
else
    error "Frontend no responde en http://localhost:3000"
fi

echo ""

# 5. Verificar formato de credenciales
header "🔍 VALIDACIÓN DE CREDENCIALES"

if [ -n "$GOOGLE_CLIENT_ID_ROOT" ] && [ "$GOOGLE_CLIENT_ID_ROOT" != "TU_NUEVO_GOOGLE_CLIENT_ID_AQUI" ]; then
    if [[ "$GOOGLE_CLIENT_ID_ROOT" =~ \.apps\.googleusercontent\.com$ ]]; then
        success "Formato de GOOGLE_CLIENT_ID es válido"
    else
        error "Formato de GOOGLE_CLIENT_ID es inválido (debe terminar en .apps.googleusercontent.com)"
    fi
    
    # Verificar si es el ID eliminado
    if [ "$GOOGLE_CLIENT_ID_ROOT" = "1019817697031-xxxx.apps.googleusercontent.com" ]; then
        error "¡Estás usando el Client ID eliminado! Necesitas crear uno nuevo."
    fi
fi

if [ -n "$GOOGLE_CLIENT_SECRET_ROOT" ] && [ "$GOOGLE_CLIENT_SECRET_ROOT" != "TU_NUEVO_GOOGLE_CLIENT_SECRET_AQUI" ]; then
    if [[ "$GOOGLE_CLIENT_SECRET_ROOT" =~ ^GOCSPX- ]]; then
        success "Formato de GOOGLE_CLIENT_SECRET es válido"
    else
        warning "Formato de GOOGLE_CLIENT_SECRET puede ser inválido (debería empezar con GOCSPX-)"
    fi
fi

echo ""

# 6. Resumen y recomendaciones
header "📋 RESUMEN Y RECOMENDACIONES"

if [ "$GOOGLE_CLIENT_ID_ROOT" = "TU_NUEVO_GOOGLE_CLIENT_ID_AQUI" ] || [ "$GOOGLE_CLIENT_ID_ROOT" = "1019817697031-xxxx.apps.googleusercontent.com" ]; then
    echo ""
    error "🚨 ACCIÓN REQUERIDA: Necesitas crear un nuevo cliente OAuth"
    echo ""
    log "Pasos para solucionarlo:"
    echo "   1. Ve a: https://console.cloud.google.com/apis/credentials"
    echo "   2. Crea un nuevo 'OAuth 2.0 Client ID'"
    echo "   3. Configura:"
    echo "      - Authorized JavaScript origins: http://localhost:3000"
    echo "      - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google"
    echo "   4. Ejecuta: ./update-oauth-credentials.sh \"TU_CLIENT_ID\" \"TU_CLIENT_SECRET\""
    echo ""
elif [ -n "$GOOGLE_CLIENT_ID_ROOT" ] && [ -n "$GOOGLE_CLIENT_SECRET_ROOT" ]; then
    success "🎉 Las credenciales OAuth están configuradas correctamente"
    log "Si sigues teniendo problemas, reinicia los contenedores:"
    echo "   docker-compose -f docker-compose.prod.yml restart"
else
    warning "⚠️  Configuración incompleta. Verifica las variables de entorno."
fi

echo ""
log "🔗 Enlaces útiles:"
echo "   • Google Cloud Console: https://console.cloud.google.com/apis/credentials"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend Health: http://localhost:8000/health"
echo "   • Debug Page: http://localhost:3000/debug"
echo ""