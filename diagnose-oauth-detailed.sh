#!/bin/bash

echo "🔍 DIAGNÓSTICO DETALLADO DE OAUTH - CACTUS DASHBOARD"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 1. VERIFICANDO ARCHIVOS DE CONFIGURACIÓN${NC}"
echo "------------------------------------------------"

# Verificar .env.local
if [ -f "cactus-wealth-frontend/.env.local" ]; then
    echo -e "${GREEN}✅ .env.local encontrado${NC}"
    
    CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" cactus-wealth-frontend/.env.local | cut -d'=' -f2)
    CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET=" cactus-wealth-frontend/.env.local | cut -d'=' -f2)
    NEXTAUTH_URL=$(grep "NEXTAUTH_URL=" cactus-wealth-frontend/.env.local | cut -d'=' -f2)
    
    echo "   Client ID: ${CLIENT_ID}"
    echo "   Client Secret: ${CLIENT_SECRET:0:20}..."
    echo "   NextAuth URL: ${NEXTAUTH_URL}"
else
    echo -e "${RED}❌ .env.local NO encontrado${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 2. VERIFICANDO FORMATO DEL CLIENT ID${NC}"
echo "------------------------------------------------"

# Verificar formato del Client ID
if [[ $CLIENT_ID =~ ^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$ ]]; then
    echo -e "${GREEN}✅ Formato del Client ID es válido${NC}"
else
    echo -e "${RED}❌ Formato del Client ID es inválido${NC}"
    echo "   Formato esperado: XXXXXXXXX-XXXXXXXX.apps.googleusercontent.com"
fi

echo ""
echo -e "${BLUE}📋 3. VERIFICANDO CONECTIVIDAD CON GOOGLE${NC}"
echo "------------------------------------------------"

# Verificar conectividad con Google OAuth
echo "Probando conectividad con Google OAuth API..."
GOOGLE_RESPONSE=$(curl -s -w "%{http_code}" "https://accounts.google.com/.well-known/openid_configuration" -o /dev/null)

if [ "$GOOGLE_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Conectividad con Google OAuth API: OK${NC}"
else
    echo -e "${RED}❌ Conectividad con Google OAuth API: FALLO (HTTP $GOOGLE_RESPONSE)${NC}"
fi

echo ""
echo -e "${BLUE}📋 4. VERIFICANDO CONFIGURACIÓN DE NEXTAUTH${NC}"
echo "------------------------------------------------"

# Verificar NextAuth configuration
if [ "$NEXTAUTH_URL" = "http://localhost:3000" ]; then
    echo -e "${GREEN}✅ NEXTAUTH_URL configurado correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  NEXTAUTH_URL: $NEXTAUTH_URL${NC}"
    echo "   Debería ser: http://localhost:3000"
fi

echo ""
echo -e "${BLUE}📋 5. VERIFICANDO PUERTOS${NC}"
echo "------------------------------------------------"

# Verificar puertos
PORT_3000=$(lsof -ti:3000)
PORT_8000=$(lsof -ti:8000)

if [ -n "$PORT_3000" ]; then
    echo -e "${GREEN}✅ Puerto 3000 en uso (Frontend)${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 3000 libre${NC}"
fi

if [ -n "$PORT_8000" ]; then
    echo -e "${GREEN}✅ Puerto 8000 en uso (Backend)${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 8000 libre${NC}"
fi

echo ""
echo -e "${BLUE}📋 6. INSTRUCCIONES PARA GOOGLE CLOUD CONSOLE${NC}"
echo "------------------------------------------------"
echo ""
echo -e "${YELLOW}🔧 CONFIGURACIÓN REQUERIDA EN GOOGLE CLOUD CONSOLE:${NC}"
echo ""
echo "1. Ve a: https://console.cloud.google.com/apis/credentials"
echo "2. Selecciona tu proyecto"
echo "3. Busca tu Client ID: ${CLIENT_ID}"
echo "4. Verifica que esté configurado como 'Web application'"
echo "5. Verifica las URLs autorizadas:"
echo ""
echo -e "${GREEN}   📍 Authorized JavaScript origins:${NC}"
echo "      http://localhost:3000"
echo ""
echo -e "${GREEN}   📍 Authorized redirect URIs:${NC}"
echo "      http://localhost:3000/api/auth/callback/google"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Las URLs deben coincidir EXACTAMENTE${NC}"
echo ""

echo ""
echo -e "${BLUE}📋 7. POSIBLES CAUSAS DEL ERROR 'deleted_client'${NC}"
echo "------------------------------------------------"
echo ""
echo -e "${RED}❌ Error 401: deleted_client puede ocurrir por:${NC}"
echo ""
echo "1. 🗑️  El Client ID fue eliminado del proyecto de Google Cloud"
echo "2. 📁 El proyecto de Google Cloud fue eliminado o deshabilitado"
echo "3. 🔗 Las URLs de redirección no coinciden exactamente"
echo "4. 🚫 El Client ID no está habilitado para aplicaciones web"
echo "5. 🔐 Las APIs necesarias no están habilitadas (Google+ API)"
echo "6. ⏰ Hay un retraso en la propagación de cambios (hasta 5 minutos)"
echo ""

echo -e "${BLUE}📋 8. PASOS PARA RESOLVER${NC}"
echo "------------------------------------------------"
echo ""
echo "1. 🔍 Verifica que el Client ID existe en Google Cloud Console"
echo "2. 🔧 Asegúrate de que las URLs estén configuradas exactamente como se muestra arriba"
echo "3. ✅ Habilita la Google+ API en tu proyecto"
echo "4. ⏰ Espera 5 minutos después de hacer cambios"
echo "5. 🔄 Si el problema persiste, crea nuevas credenciales OAuth"
echo ""

echo -e "${GREEN}✅ Diagnóstico completado${NC}"
echo ""
echo -e "${YELLOW}💡 Si necesitas crear nuevas credenciales, usa:${NC}"
echo "   task oauth:update CLIENT_ID=nuevo_client_id CLIENT_SECRET=nuevo_client_secret"
echo ""