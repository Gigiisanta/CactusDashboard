# 🐳 Configuración de Docker para CactusDashboard

Esta guía te ayudará a configurar Docker de manera permanente para evitar problemas de conexión.

## ✅ Solución Implementada

Hemos implementado una **solución completa y permanente** que incluye:

### 1. **Inicio Automático de Docker Desktop**
- Docker Desktop se configurará para iniciarse automáticamente al arrancar tu Mac
- No más problemas de "Cannot connect to the Docker daemon"

### 2. **Verificación Automática**
- Todos los comandos de desarrollo verifican automáticamente que Docker esté ejecutándose
- Si Docker no está activo, se inicia automáticamente

### 3. **Scripts de Diagnóstico**
- Herramientas para diagnosticar y solucionar problemas de Docker
- Configuración automática de inicio

## 🚀 Comandos Disponibles

### Configuración Inicial (Una sola vez)
```bash
# Configurar Docker para inicio automático
task docker:setup

# O ejecutar directamente
./scripts/setup-docker-autostart.sh
```

### Verificación Diaria
```bash
# Verificar que Docker esté ejecutándose
task docker:check

# O ejecutar directamente
./scripts/check-docker.sh
```

### Diagnóstico Completo
```bash
# Diagnóstico completo de Docker
task docker:diagnose

# O ejecutar directamente
./scripts/diagnose-docker.sh
```

### Comandos de Desarrollo (Ahora con verificación automática)
```bash
# Iniciar desarrollo (verifica Docker automáticamente)
task dev

# Detener desarrollo (verifica Docker automáticamente)
task dev:stop

# Rebuild completo (verifica Docker automáticamente)
task dev:rebuild
```

## 📋 Verificación Manual

Si quieres verificar manualmente que todo esté configurado:

### 1. Verificar que Docker esté en inicio automático
```bash
osascript -e 'tell application "System Events" to get the name of every login item'
```
Deberías ver "Docker" en la lista.

### 2. Verificar que Docker esté ejecutándose
```bash
docker info
```
Deberías ver información del daemon de Docker.

### 3. Verificar que los comandos funcionen
```bash
task dev:stop
```
Debería funcionar sin errores de conexión.

## 🔧 Solución de Problemas

### Problema: "Cannot connect to the Docker daemon"
**Solución:**
```bash
# Ejecutar diagnóstico completo
task docker:diagnose

# Si Docker no está configurado para inicio automático
task docker:setup

# Si Docker no está ejecutándose
open -a Docker
```

### Problema: Docker no se inicia automáticamente
**Solución:**
```bash
# Configurar inicio automático
task docker:setup

# Verificar configuración
osascript -e 'tell application "System Events" to get the name of every login item'
```

### Problema: Permisos de Docker
**Solución:**
```bash
# Verificar permisos del socket
ls -la /Users/$(whoami)/.docker/run/docker.sock

# Si no existe, reiniciar Docker Desktop
open -a Docker
```

## 🎯 Beneficios de esta Solución

1. **✅ Permanente**: Docker se inicia automáticamente al arrancar tu Mac
2. **✅ Automática**: Los comandos verifican y inician Docker si es necesario
3. **✅ Diagnóstica**: Herramientas para identificar y solucionar problemas
4. **✅ Integrada**: Funciona con el sistema de tareas existente
5. **✅ Documentada**: Guías claras para configuración y solución de problemas

## 📝 Notas Importantes

- **Primera vez**: Ejecuta `task docker:setup` una sola vez para configurar inicio automático
- **Reinicio**: Después de reiniciar tu Mac, Docker se iniciará automáticamente
- **Comandos**: Todos los comandos de desarrollo ahora verifican Docker automáticamente
- **Diagnóstico**: Usa `task docker:diagnose` si tienes problemas

## 🔗 Comandos Relacionados

- `task help` - Ver todos los comandos disponibles
- `task debug` - Diagnóstico completo del sistema
- `task setup` - Configuración inicial del proyecto

---

**🎉 ¡Con esta configuración, nunca más tendrás problemas de conexión con Docker!** 