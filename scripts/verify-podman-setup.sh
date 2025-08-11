#!/bin/bash

# ================================
# ✅ VERIFICACIÓN DE MIGRACIÓN A PODMAN
# ================================

set -e

echo "✅ Verificando migración a Podman - CactusDashboard"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de verificaciones
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Función para mostrar resultado
show_check() {
    local check_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $check_name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $check_name"
    else
        echo -e "${RED}❌ FAIL${NC} - $check_name"
    fi
    
    if [ -n "$details" ]; then
        echo "   $details"
    fi
    echo ""
}

# Función para verificar comando
check_command() {
    local cmd="$1"
    local name="$2"
    
    if command -v "$cmd" >/dev/null 2>&1; then
        local version=$($cmd --version 2>/dev/null || echo "Instalado")
        show_check "$name" "PASS" "Versión: $version"
    else
        show_check "$name" "FAIL" "Comando no encontrado"
    fi
}

# Función para verificar alias
check_alias() {
    local alias_name="$1"
    local expected_cmd="$2"
    local name="$3"
    
    if alias "$alias_name" >/dev/null 2>&1; then
        local alias_value=$(alias "$alias_name" | sed "s/alias $alias_name='//;s/'$//")
        if [[ "$alias_value" == *"$expected_cmd"* ]]; then
            show_check "$name" "PASS" "Alias configurado: $alias_value"
        else
            show_check "$name" "WARN" "Alias configurado pero diferente: $alias_value"
        fi
    else
        show_check "$name" "FAIL" "Alias no configurado"
    fi
}

# Función para verificar variable de entorno
check_env_var() {
    local var_name="$1"
    local expected_value="$2"
    local name="$3"
    
    if [ -n "${!var_name}" ]; then
        if [ "${!var_name}" = "$expected_value" ]; then
            show_check "$name" "PASS" "Variable configurada: ${!var_name}"
        else
            show_check "$name" "WARN" "Variable configurada pero diferente: ${!var_name}"
        fi
    else
        show_check "$name" "FAIL" "Variable no configurada"
    fi
}

# Función para verificar máquina Podman
check_podman_machine() {
    echo "🔧 Verificando máquina Podman..."
    
    if podman machine list | grep -q "cactus-dashboard"; then
        local status=$(podman machine list | grep "cactus-dashboard" | awk '{print $2}')
        if [ "$status" = "Running" ]; then
            show_check "Máquina Podman" "PASS" "Estado: $status"
        else
            show_check "Máquina Podman" "WARN" "Estado: $status (debería estar Running)"
        fi
    else
        show_check "Máquina Podman" "FAIL" "Máquina cactus-dashboard no encontrada"
    fi
}

# Función para verificar conectividad Podman
check_podman_connectivity() {
    echo "🔗 Verificando conectividad Podman..."
    
    if podman info >/dev/null 2>&1; then
        local version=$(podman --version)
        show_check "Conectividad Podman" "PASS" "$version"
    else
        show_check "Conectividad Podman" "FAIL" "No se puede conectar a Podman"
    fi
}

# Función para verificar stack Docker Compose
check_docker_compose() {
    echo "🐳 Verificando compatibilidad Docker Compose..."
    
    if podman-compose --version >/dev/null 2>&1; then
        local version=$(podman-compose --version)
        show_check "Podman Compose" "PASS" "$version"
    else
        show_check "Podman Compose" "FAIL" "podman-compose no funciona"
    fi
}

# Función para verificar archivos de configuración
check_config_files() {
    echo "📁 Verificando archivos de configuración..."
    
    # Verificar docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        show_check "docker-compose.yml" "PASS" "Archivo presente"
    else
        show_check "docker-compose.yml" "FAIL" "Archivo no encontrado"
    fi
    
    # Verificar Taskfile.yml
    if [ -f "Taskfile.yml" ]; then
        if grep -q "podman" Taskfile.yml; then
            show_check "Taskfile.yml" "PASS" "Configurado para Podman"
        else
            show_check "Taskfile.yml" "WARN" "No se detectó configuración de Podman"
        fi
    else
        show_check "Taskfile.yml" "FAIL" "Archivo no encontrado"
    fi
    
    # Verificar scripts de Podman
    local podman_scripts=("setup-podman.sh" "podman-maintenance.sh" "migrate-to-podman.sh")
    for script in "${podman_scripts[@]}"; do
        if [ -f "scripts/$script" ] && [ -x "scripts/$script" ]; then
            show_check "Script $script" "PASS" "Presente y ejecutable"
        else
            show_check "Script $script" "FAIL" "No encontrado o no ejecutable"
        fi
    done
}

# Función para verificar alias de compatibilidad
check_compatibility_aliases() {
    echo "🔗 Verificando alias de compatibilidad..."
    
    # Verificar alias principales
    check_alias "docker" "podman" "Alias docker -> podman"
    check_alias "docker-compose" "podman-compose" "Alias docker-compose -> podman-compose"
    
    # Verificar variables de entorno
    check_env_var "PODMAN_MACHINE_NAME" "cactus-dashboard" "Variable PODMAN_MACHINE_NAME"
    check_env_var "COMPOSE_DOCKER_CLI_BUILD" "1" "Variable COMPOSE_DOCKER_CLI_BUILD"
    check_env_var "DOCKER_BUILDKIT" "1" "Variable DOCKER_BUILDKIT"
}

# Función para verificar comandos Task
check_task_commands() {
    echo "⚡ Verificando comandos Task..."
    
    # Verificar comandos principales
    local task_commands=("podman:verify" "podman:status" "podman:start" "podman:stop")
    for cmd in "${task_commands[@]}"; do
        if task --list | grep -q "$cmd"; then
            show_check "Task $cmd" "PASS" "Comando disponible"
        else
            show_check "Task $cmd" "FAIL" "Comando no encontrado"
        fi
    done
}

# Función para verificar stack completo
check_stack_functionality() {
    echo "🚀 Verificando funcionalidad del stack..."
    
    # Verificar si el stack puede iniciarse
    if task dev:stop >/dev/null 2>&1; then
        show_check "Comando dev:stop" "PASS" "Funciona correctamente"
    else
        show_check "Comando dev:stop" "WARN" "No se pudo ejecutar"
    fi
    
    # Verificar si el stack puede iniciarse
    if timeout 30s task dev >/dev/null 2>&1; then
        show_check "Comando dev" "PASS" "Stack inicia correctamente"
    else
        show_check "Comando dev" "WARN" "Stack puede tener problemas al iniciar"
    fi
}

# Función para mostrar resumen
show_summary() {
    echo "📊 RESUMEN DE VERIFICACIÓN"
    echo "=========================="
    echo ""
    echo "Total de verificaciones: $TOTAL_CHECKS"
    echo "Verificaciones exitosas: $PASSED_CHECKS"
    echo "Verificaciones fallidas: $((TOTAL_CHECKS - PASSED_CHECKS))"
    echo ""
    
    local percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    if [ $percentage -eq 100 ]; then
        echo -e "${GREEN}🎉 ¡Migración 100% exitosa!${NC}"
        echo "Tu entorno Podman está completamente configurado y listo para usar."
    elif [ $percentage -ge 80 ]; then
        echo -e "${YELLOW}✅ Migración mayormente exitosa (${percentage}%)${NC}"
        echo "Algunas verificaciones menores fallaron, pero el entorno está funcional."
    else
        echo -e "${RED}❌ Migración incompleta (${percentage}%)${NC}"
        echo "Hay problemas significativos que necesitan atención."
    fi
    
    echo ""
    echo "💡 Próximos pasos:"
    if [ $percentage -eq 100 ]; then
        echo "1. Ejecuta: task dev para iniciar desarrollo"
        echo "2. Ejecuta: task podman:cleanup semanalmente"
        echo "3. Consulta: PODMAN_MIGRATION.md para más detalles"
    else
        echo "1. Revisa las verificaciones fallidas arriba"
        echo "2. Ejecuta: ./scripts/migrate-to-podman.sh para corregir problemas"
        echo "3. Consulta: PODMAN_MIGRATION.md para troubleshooting"
    fi
}

# Función principal
main() {
    echo "🔍 Iniciando verificación completa..."
    echo ""
    
    # Verificar comandos básicos
    echo "📦 Verificando comandos básicos..."
    check_command "podman" "Podman CLI"
    check_command "podman-compose" "Podman Compose"
    check_command "task" "Task Runner"
    
    # Verificar máquina Podman
    check_podman_machine
    
    # Verificar conectividad
    check_podman_connectivity
    
    # Verificar Docker Compose
    check_docker_compose
    
    # Verificar archivos de configuración
    check_config_files
    
    # Verificar alias de compatibilidad
    check_compatibility_aliases
    
    # Verificar comandos Task
    check_task_commands
    
    # Verificar funcionalidad del stack
    check_stack_functionality
    
    # Mostrar resumen
    show_summary
}

# Ejecutar función principal
main "$@"

