#!/bin/bash

echo "🔄 REORGANIZANDO TASKFILE.YML"
echo "═══════════════════════════════"

# Crear respaldo con timestamp
BACKUP_FILE="Taskfile.yml.backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 Creando respaldo: $BACKUP_FILE"
cp Taskfile.yml "$BACKUP_FILE"

# Aplicar nueva organización
echo "🔄 Aplicando nueva organización..."
cp Taskfile.yml.reorganized Taskfile.yml

# Limpiar archivo temporal
rm Taskfile.yml.reorganized

echo "✅ Reorganización completada!"
echo ""
echo "📋 CAMBIOS REALIZADOS:"
echo "  ✅ Comandos agrupados por categorías lógicas"
echo "  ✅ Nomenclatura consistente y clara"
echo "  ✅ Documentación mejorada con emojis"
echo "  ✅ Secciones claramente delimitadas"
echo "  ✅ Ayuda reorganizada y actualizada"
echo ""
echo "📂 ESTRUCTURA NUEVA:"
echo "  🚀 DESARROLLO LOCAL"
echo "  📊 MONITOREO Y ESTADO"
echo "  🔍 HEALTH CHECKS GRANULARES"
echo "  📊 MONITOREO AVANZADO"
echo "  🔍 DIAGNÓSTICOS AVANZADOS"
echo "  📺 LOGS Y DEBUGGING"
echo "  🐚 SHELLS INTERACTIVOS"
echo "  🧹 LIMPIEZA Y MANTENIMIENTO"
echo "  ☁️ AWS MANAGEMENT"
echo "  🚀 DEPLOYMENT"
echo "  🔐 OAUTH & AUTENTICACIÓN"
echo "  ⚙️ CONFIGURACIÓN & UTILIDADES"
echo "  ❓ AYUDA & INFORMACIÓN"
echo ""
echo "💡 Prueba los comandos:"
echo "  task help        # Ver ayuda completa"
echo "  task help:quick  # Ver comandos esenciales"
echo "  task --list      # Ver lista de comandos"
echo ""
echo "🔙 Respaldo guardado en: $BACKUP_FILE"