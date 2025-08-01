#!/bin/bash

# =============================================================================
# SCRIPT PARA ACTUALIZAR CREDENCIALES OAUTH DE GOOGLE
# =============================================================================
# Uso: ./update-oauth-credentials.sh "TU_CLIENT_ID" "TU_CLIENT_SECRET"
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar argumentos
if [ $# -ne 2 ]; then
    error "Uso: $0 \"TU_CLIENT_ID\" \"TU_CLIENT_SECRET\""
    echo ""
    echo "Ejemplo:"
    echo "  $0 \"123456789-abcdef.apps.googleusercontent.com\" \"GOCSPX-abcdef123456\""
    exit 1
fi

CLIENT_ID="$1"
CLIENT_SECRET="$2"

log "🔧 Actualizando credenciales OAuth de Google..."
echo ""

# Validar formato básico del Client ID
if [[ ! "$CLIENT_ID" =~ \.apps\.googleusercontent\.com$ ]]; then
    warning "El Client ID no parece tener el formato correcto de Google OAuth"
    echo "   Debería terminar en '.apps.googleusercontent.com'"
fi

# Validar formato básico del Client Secret
if [[ ! "$CLIENT_SECRET" =~ ^GOCSPX- ]]; then
    warning "El Client Secret no parece tener el formato correcto de Google OAuth"
    echo "   Debería empezar con 'GOCSPX-'"
fi

# Actualizar archivo .env de la raíz
log "📝 Actualizando .env (raíz del proyecto)..."
if [ -f ".env" ]; then
    sed -i.bak "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|g" .env
    sed -i.bak "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|g" .env
    sed -i.bak "s|NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*|NEXT_PUBLIC_GOOGLE_CLIENT_ID=$CLIENT_ID|g" .env
    success "✅ .env actualizado"
else
    error "❌ Archivo .env no encontrado en la raíz"
fi

# Actualizar archivo .env.local del frontend
log "📝 Actualizando cactus-wealth-frontend/.env.local..."
if [ -f "cactus-wealth-frontend/.env.local" ]; then
    sed -i.bak "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|g" cactus-wealth-frontend/.env.local
    sed -i.bak "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|g" cactus-wealth-frontend/.env.local
    success "✅ cactus-wealth-frontend/.env.local actualizado"
else
    error "❌ Archivo cactus-wealth-frontend/.env.local no encontrado"
fi

echo ""
log "🔄 Reiniciando contenedores para aplicar cambios..."

# Verificar si Docker está ejecutándose
if ! docker ps >/dev/null 2>&1; then
    error "❌ Docker no está ejecutándose. Inicia Docker Desktop primero."
    exit 1
fi

# Reiniciar contenedores
if docker-compose -f docker-compose.prod.yml ps | grep -q "cactusdashboard"; then
    log "🛑 Deteniendo contenedores..."
    docker-compose -f docker-compose.prod.yml down
    
    log "🚀 Iniciando contenedores con nuevas credenciales..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Esperar a que los contenedores estén listos
    log "⏳ Esperando a que los servicios estén listos..."
    sleep 10
    
    # Verificar estado de los contenedores
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        success "✅ Contenedores reiniciados correctamente"
    else
        error "❌ Error al reiniciar contenedores"
        docker-compose -f docker-compose.prod.yml logs --tail=20
        exit 1
    fi
else
    warning "⚠️  Los contenedores no están ejecutándose. Inicia con: task dev"
fi

echo ""
success "🎉 ¡Credenciales OAuth actualizadas exitosamente!"
echo ""
log "📋 Resumen de cambios:"
echo "   • Client ID: $CLIENT_ID"
echo "   • Client Secret: ${CLIENT_SECRET:0:12}..."
echo "   • Archivos actualizados: .env, cactus-wealth-frontend/.env.local"
echo "   • Contenedores reiniciados"
echo ""
log "🌐 Puedes probar la autenticación en: http://localhost:3000"
echo ""
log "🔍 Para verificar que todo funciona:"
echo "   1. Ve a http://localhost:3000"
echo "   2. Haz clic en 'Iniciar sesión con Google'"
echo "   3. Deberías ser redirigido a Google OAuth sin errores"