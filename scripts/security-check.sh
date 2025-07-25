#!/bin/bash

# =============================================================================
# SCRIPT DE VERIFICACIÓN DE SEGURIDAD - CACTUS DASHBOARD
# =============================================================================
# Verifica que la configuración de seguridad esté correctamente implementada
# Autor: Cactus Dashboard Team
# Versión: 1.0
# =============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}🔒 VERIFICACIÓN DE SEGURIDAD - CACTUS DASHBOARD${NC}"
echo "=================================================================="
echo ""

# Función para mostrar resultado
show_result() {
    local status=$1
    local message=$2
    local details=$3
    
    case $status in
        "PASS")
            echo -e "✅ ${GREEN}PASS${NC}: $message"
            ((PASSED++))
            ;;
        "FAIL")
            echo -e "❌ ${RED}FAIL${NC}: $message"
            if [ ! -z "$details" ]; then
                echo -e "   ${RED}→${NC} $details"
            fi
            ((FAILED++))
            ;;
        "WARN")
            echo -e "⚠️  ${YELLOW}WARN${NC}: $message"
            if [ ! -z "$details" ]; then
                echo -e "   ${YELLOW}→${NC} $details"
            fi
            ((WARNINGS++))
            ;;
    esac
}

echo -e "${BLUE}1. VERIFICANDO CONFIGURACIÓN DE DOCKER COMPOSE${NC}"
echo "--------------------------------------------------------------"

# Verificar que PostgreSQL no tenga ports expuestos
if grep -q "ports:" docker-compose.prod.yml | grep -q "5432"; then
    show_result "FAIL" "PostgreSQL tiene puertos expuestos públicamente" "Usar 'expose' en lugar de 'ports'"
else
    show_result "PASS" "PostgreSQL no está expuesto públicamente"
fi

# Verificar que Redis no tenga ports expuestos
if grep -q "ports:" docker-compose.prod.yml | grep -q "6379"; then
    show_result "FAIL" "Redis tiene puertos expuestos públicamente" "Usar 'expose' en lugar de 'ports'"
else
    show_result "PASS" "Redis no está expuesto públicamente"
fi

# Verificar que Redis tenga contraseña
if grep -q "requirepass" docker-compose.prod.yml; then
    show_result "PASS" "Redis configurado con contraseña"
else
    show_result "FAIL" "Redis no tiene contraseña configurada" "Agregar --requirepass en command"
fi

# Verificar que Nginx esté configurado
if grep -q "nginx:" docker-compose.prod.yml; then
    show_result "PASS" "Nginx configurado como reverse proxy"
else
    show_result "FAIL" "Nginx no está configurado" "Agregar servicio nginx al docker-compose"
fi

echo ""
echo -e "${BLUE}2. VERIFICANDO CONFIGURACIÓN DE TERRAFORM${NC}"
echo "--------------------------------------------------------------"

# Verificar que puertos críticos no estén expuestos en security group
if grep -A 20 "aws_security_group" terraform/main.tf | grep -q "5432\|6379"; then
    show_result "FAIL" "Puertos de base de datos expuestos en Security Group" "Remover puertos 5432 y 6379"
else
    show_result "PASS" "Puertos de base de datos no expuestos en Security Group"
fi

# Verificar que solo puertos necesarios estén abiertos
necessary_ports=("22" "80" "443")
for port in "${necessary_ports[@]}"; do
    if grep -A 20 "aws_security_group" terraform/main.tf | grep -q "from_port.*= $port"; then
        show_result "PASS" "Puerto $port correctamente configurado"
    else
        show_result "WARN" "Puerto $port no encontrado" "Verificar configuración"
    fi
done

echo ""
echo -e "${BLUE}3. VERIFICANDO ARCHIVOS DE CONFIGURACIÓN${NC}"
echo "--------------------------------------------------------------"

# Verificar nginx-secure.conf
if [ -f "nginx-secure.conf" ]; then
    show_result "PASS" "Archivo nginx-secure.conf existe"
    
    # Verificar configuraciones de seguridad en nginx
    if grep -q "proxy_pass.*backend" nginx-secure.conf; then
        show_result "PASS" "Nginx configurado para proxy al backend"
    else
        show_result "FAIL" "Nginx no tiene proxy al backend configurado"
    fi
    
    if grep -q "deny.*db\|deny.*redis" nginx-secure.conf; then
        show_result "PASS" "Nginx bloquea acceso directo a servicios internos"
    else
        show_result "WARN" "Nginx podría no estar bloqueando servicios internos"
    fi
else
    show_result "FAIL" "Archivo nginx-secure.conf no existe" "Crear configuración de Nginx"
fi

# Verificar .env.aws.example
if [ -f ".env.aws.example" ]; then
    if grep -q "REDIS_PASSWORD" .env.aws.example; then
        show_result "PASS" "Variable REDIS_PASSWORD configurada en .env.aws.example"
    else
        show_result "FAIL" "Variable REDIS_PASSWORD no encontrada en .env.aws.example"
    fi
else
    show_result "WARN" "Archivo .env.aws.example no existe"
fi

echo ""
echo -e "${BLUE}4. VERIFICANDO ESTADO ACTUAL (SI ESTÁ EJECUTÁNDOSE)${NC}"
echo "--------------------------------------------------------------"

# Verificar si Docker está ejecutándose
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    # Verificar puertos expuestos en contenedores activos
    exposed_ports=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "5432|6379" | grep "0.0.0.0" || true)
    
    if [ -z "$exposed_ports" ]; then
        show_result "PASS" "No hay puertos críticos expuestos en contenedores activos"
    else
        show_result "FAIL" "Puertos críticos expuestos en contenedores activos" "$exposed_ports"
    fi
    
    # Verificar que Nginx esté ejecutándose
    if docker ps | grep -q "nginx"; then
        show_result "PASS" "Nginx está ejecutándose"
    else
        show_result "WARN" "Nginx no está ejecutándose" "Iniciar con docker-compose up"
    fi
else
    show_result "WARN" "Docker no está ejecutándose o no disponible" "No se puede verificar estado actual"
fi

echo ""
echo -e "${BLUE}5. VERIFICANDO CONECTIVIDAD DE RED${NC}"
echo "--------------------------------------------------------------"

# Verificar si hay una red Docker personalizada
if command -v docker >/dev/null 2>&1; then
    if docker network ls | grep -q "cactus_network"; then
        show_result "PASS" "Red Docker personalizada 'cactus_network' existe"
    else
        show_result "WARN" "Red Docker personalizada no encontrada" "Crear con docker-compose up"
    fi
fi

echo ""
echo "=================================================================="
echo -e "${BLUE}📊 RESUMEN DE VERIFICACIÓN DE SEGURIDAD${NC}"
echo "=================================================================="
echo -e "✅ ${GREEN}Verificaciones Pasadas: $PASSED${NC}"
echo -e "❌ ${RED}Verificaciones Fallidas: $FAILED${NC}"
echo -e "⚠️  ${YELLOW}Advertencias: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡EXCELENTE! Tu configuración de seguridad está bien implementada.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}💡 Revisa las advertencias para optimización adicional.${NC}"
    fi
    exit 0
else
    echo -e "${RED}🚨 ATENCIÓN: Se encontraron $FAILED problemas de seguridad críticos.${NC}"
    echo -e "${RED}🔧 Por favor, corrige estos problemas antes del despliegue.${NC}"
    exit 1
fi