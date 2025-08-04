# 🌵 CactusDashboard - Referencia Rápida de Comandos

## 📋 Índice de Categorías

- [🚀 Desarrollo Local](#-desarrollo-local)
- [📊 Monitoreo y Estado](#-monitoreo-y-estado)
- [🔍 Health Checks Granulares](#-health-checks-granulares)
- [📊 Monitoreo Avanzado](#-monitoreo-avanzado)
- [🔍 Diagnósticos Avanzados](#-diagnósticos-avanzados)
- [📺 Logs y Debugging](#-logs-y-debugging)
- [🐚 Shells Interactivos](#-shells-interactivos)
- [🧹 Limpieza y Mantenimiento](#-limpieza-y-mantenimiento)
- [☁️ AWS Management](#️-aws-management)
- [🚀 Deployment](#-deployment)
- [🔐 OAuth & Autenticación](#-oauth--autenticación)
- [⚙️ Configuración & Utilidades](#️-configuración--utilidades)
- [❓ Ayuda & Información](#-ayuda--información)

---

## 🚀 Desarrollo Local

| Comando | Descripción |
|---------|-------------|
| `task dev` | Iniciar desarrollo local completo |
| `task dev:frontend` | Iniciar solo frontend en localhost:3000 |
| `task dev:frontend:clean` | Iniciar frontend con limpieza completa |
| `task dev:stop` | Detener desarrollo local |
| `task dev:restart` | Reiniciar desarrollo local |
| `task dev:rebuild` | Rebuild completo y reiniciar |

## 📊 Monitoreo y Estado

| Comando | Descripción |
|---------|-------------|
| `task status` | Estado general del sistema |
| `task health` | Verificar salud de todos los servicios |
| `task ports` | Verificar puertos en uso |
| `task resources` | Mostrar uso de recursos |

## 🔍 Health Checks Granulares

| Comando | Descripción |
|---------|-------------|
| `task health:services` | Verificar estado de servicios Docker |
| `task health:endpoints` | Verificar endpoints HTTP |
| `task health:database` | Verificar conexión a base de datos |
| `task health:auth` | Verificar configuración de autenticación |
| `task health:resources` | Verificar uso de recursos del sistema |

## 📊 Monitoreo Avanzado

| Comando | Descripción |
|---------|-------------|
| `task monitor:continuous` | Monitoreo continuo del sistema |
| `task monitor:continuous-full` | Monitoreo continuo completo (requiere Docker) |
| `task monitor:logs` | Monitoreo de logs con filtros |

## 🔍 Diagnósticos Avanzados

| Comando | Descripción |
|---------|-------------|
| `task diagnose:all` | Ejecutar todos los diagnósticos disponibles |
| `task diagnose:network` | Diagnóstico de red y conectividad |
| `task diagnose:performance` | Diagnóstico de rendimiento |
| `task diagnose:security` | Diagnóstico de seguridad |
| `task diagnose:dependencies` | Diagnóstico de dependencias |

## 📺 Logs y Debugging

| Comando | Descripción |
|---------|-------------|
| `task logs` | Ver logs en vivo - todos los servicios |
| `task logs:backend` | Ver logs del backend |
| `task logs:frontend` | Ver logs del frontend |
| `task logs:db` | Ver logs de la base de datos |
| `task debug` | Diagnóstico completo del sistema |

## 🐚 Shells Interactivos

| Comando | Descripción |
|---------|-------------|
| `task shell:backend` | Shell interactivo en backend |
| `task shell:frontend` | Shell interactivo en frontend |
| `task shell:db` | Shell PostgreSQL |

## 🧹 Limpieza y Mantenimiento

| Comando | Descripción |
|---------|-------------|
| `task cleanup` | Limpiar puertos y cachés |
| `task cleanup:ports` | Limpiar solo puertos (3000, 3001, 8000, 8080) |
| `task cleanup:frontend` | Limpiar caché y build del frontend |

## ☁️ AWS Management

| Comando | Descripción |
|---------|-------------|
| `task aws:start` | Iniciar instancia EC2 |
| `task aws:stop` | Detener instancia EC2 (ahorrar dinero) |
| `task aws:status` | Estado de la instancia EC2 |
| `task aws:ip` | Obtener IP pública de la instancia |
| `task aws:costs` | Ver información de costos |
| `task aws:ssh` | Conectar SSH a la instancia |
| `task aws:health` | Verificar salud de servicios en AWS |

## 🚀 Deployment

| Comando | Descripción |
|---------|-------------|
| `task deploy:aws` | Desplegar a AWS |

## 🔐 OAuth & Autenticación

| Comando | Descripción |
|---------|-------------|
| `task oauth:verify` | Verificar configuración OAuth |
| `task oauth:update` | Actualizar credenciales OAuth de Google |
| `task oauth:diagnose` | Diagnóstico completo de OAuth |
| `task oauth:test` | Probar configuración OAuth |
| `task oauth:monitor` | Monitorear estado OAuth automáticamente |
| `task oauth:setup-monitoring` | Configurar monitoreo automático de OAuth |

## ⚙️ Configuración & Utilidades

| Comando | Descripción |
|---------|-------------|
| `task setup` | Configuración inicial del proyecto |
| `task validate` | Validar toda la configuración |
| `task docker:check` | Verificar y asegurar que Docker esté ejecutándose |
| `task docker:setup` | Configurar Docker Desktop para inicio automático |
| `task docker:diagnose` | Diagnóstico completo de Docker |

## ❓ Ayuda & Información

| Comando | Descripción |
|---------|-------------|
| `task help` | Mostrar ayuda completa y organizada |
| `task help:quick` | Ayuda rápida - comandos esenciales |
| `task --list` | Lista rápida de todos los comandos |

---

## 🎯 Flujos de Trabajo Comunes

### 🚀 Desarrollo Diario
```bash
task dev              # Iniciar desarrollo
task logs             # Ver logs en vivo
task status           # Verificar estado
task dev:stop         # Detener al final del día
```

### 🔍 Troubleshooting
```bash
task debug            # Diagnóstico completo
task diagnose:all     # Diagnósticos avanzados
task cleanup          # Limpiar si hay problemas
task validate         # Verificar configuración
```

### ☁️ Gestión AWS
```bash
task aws:start        # Iniciar instancia
task deploy:aws       # Desplegar aplicación
task aws:health       # Verificar servicios
task aws:stop         # Detener para ahorrar dinero
```

### 🔐 OAuth Setup
```bash
task oauth:diagnose   # Verificar configuración actual
task oauth:update     # Actualizar credenciales
task oauth:test       # Probar configuración
task oauth:monitor    # Monitorear estado
```

### 📊 Monitoreo
```bash
task monitor:continuous     # Monitoreo básico continuo
task monitor:continuous-full # Monitoreo completo
task health:endpoints       # Verificar endpoints específicos
task health:auth           # Verificar autenticación
```

---

## 🎉 Características de la Nueva Organización

✅ **Categorización Lógica**: Comandos agrupados por funcionalidad
✅ **Nomenclatura Consistente**: Sintaxis uniforme `task categoria:accion`
✅ **Documentación Visual**: Emojis para identificación rápida
✅ **Ayuda Integrada**: Sistema de ayuda multinivel
✅ **Flujos Optimizados**: Comandos diseñados para workflows comunes

---

## 📚 Documentación Adicional

- **Taskfile.yml**: Archivo principal con todas las definiciones
- **scripts/**: Scripts auxiliares para funcionalidades específicas
- **DOCUMENTATION.md**: Documentación técnica detallada
- **QUICK_REFERENCE.md**: Esta guía de referencia rápida

---

*Última actualización: $(date)*