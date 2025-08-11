# Docker Cleanup System for Cactus Dashboard

## 🎯 Overview

Este sistema automatizado de limpieza de Docker está diseñado específicamente para el proyecto **Cactus Dashboard** en macOS. Resuelve el problema de almacenamiento excesivo de Docker (hasta 70+ GB) de forma segura y automática.

## 🚀 Características Principales

- ✅ **Limpieza segura**: Protege contenedores y volúmenes activos del proyecto
- ✅ **Automatización completa**: Ejecución semanal automática con `launchd`
- ✅ **Monitoreo inteligente**: Reportes detallados de espacio liberado
- ✅ **Logging completo**: Registro de todas las operaciones
- ✅ **Modo dry-run**: Prueba sin afectar datos
- ✅ **Backup automático**: Respaldo del estado antes de limpiar
- ✅ **Interfaz amigable**: Colores y mensajes claros

## 📁 Estructura de Archivos

```
scripts/
├── docker-cleanup.sh              # Script principal de limpieza
├── install-docker-cleanup.sh      # Instalador automático
├── uninstall-docker-cleanup.sh    # Desinstalador
├── docker-status.sh               # Monitor de estado
├── com.cactus.docker-cleanup.plist # Configuración launchd
└── README-docker-cleanup.md       # Esta documentación
```

## 🛠️ Instalación Rápida

### 1. Instalación Automática (Recomendado)

```bash
# Navegar al directorio del proyecto
cd /Users/prueba/Desktop/CactusDashboard

# Ejecutar el instalador
chmod +x scripts/install-docker-cleanup.sh
./scripts/install-docker-cleanup.sh
```

### 2. Instalación Manual

```bash
# Hacer ejecutables los scripts
chmod +x scripts/docker-cleanup.sh
chmod +x scripts/install-docker-cleanup.sh
chmod +x scripts/uninstall-docker-cleanup.sh
chmod +x scripts/docker-status.sh

# Instalar el servicio
./scripts/install-docker-cleanup.sh
```

## 📋 Uso del Sistema

### Comandos Principales

#### 1. Limpieza Manual

```bash
# Limpieza normal (con confirmación)
./scripts/docker-cleanup.sh

# Limpieza forzada (sin confirmación)
./scripts/docker-cleanup.sh --force

# Modo dry-run (solo muestra qué se limpiaría)
./scripts/docker-cleanup.sh --dry-run

# Modo verbose (más detalles)
./scripts/docker-cleanup.sh --verbose

# Combinar opciones
./scripts/docker-cleanup.sh --dry-run --verbose
```

#### 2. Monitoreo de Estado

```bash
# Ver estado completo del sistema
./scripts/docker-status.sh
```

#### 3. Gestión del Servicio

```bash
# Verificar si el servicio está activo
launchctl list | grep docker-cleanup

# Detener la ejecución automática
launchctl unload ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist

# Reiniciar la ejecución automática
launchctl load ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist
```

#### 4. Logs y Monitoreo

```bash
# Ver logs de limpieza en tiempo real
tail -f scripts/docker-cleanup.log

# Ver logs de salida estándar
tail -f logs/docker-cleanup.out

# Ver logs de errores
tail -f logs/docker-cleanup.err
```

## 🛡️ Recursos Protegidos

El sistema protege automáticamente los siguientes recursos del proyecto Cactus Dashboard:

### Contenedores Protegidos
- `cactus-backend`
- `cactus-frontend`
- `cactus-db`
- `cactus-redis`
- `cactus-nginx`
- `cactus-prometheus`
- `cactus-grafana`

### Volúmenes Protegidos
- `postgres_data`
- `redis_data`
- `backend_logs`
- `frontend_logs`
- `nginx_logs`
- `prometheus_data`
- `grafana_data`
- Y variaciones con prefijos del proyecto

## ⏰ Programación Automática

El sistema se ejecuta automáticamente:
- **Frecuencia**: Cada domingo
- **Hora**: 2:00 AM
- **Duración**: Aproximadamente 1-2 minutos
- **Logs**: Guardados en `logs/docker-cleanup.log`

## 📊 Reportes de Espacio

El sistema muestra:
- Espacio total usado por Docker
- Espacio reclamable antes y después
- Cantidad exacta liberada
- Recomendaciones basadas en el uso

### Ejemplo de Salida

```
[INFO] Current Docker space usage:
TYPE                TOTALCOUNT   SIZE                RECLAIMABLE
Images              15           2.1GB               1.8GB
Containers          8            156MB               156MB
Local Volumes       12           3.2GB               2.1GB
Build Cache         0B           0B                  0B

[INFO] Successfully freed 4.05 GB
```

## 🔧 Configuración Avanzada

### Modificar la Programación

Editar `scripts/com.cactus.docker-cleanup.plist`:

```xml
<key>StartCalendarInterval</key>
<dict>
    <key>Weekday</key>
    <integer>0</integer>  <!-- 0=Domingo, 1=Lunes, etc. -->
    <key>Hour</key>
    <integer>2</integer>  <!-- Hora (0-23) -->
    <key>Minute</key>
    <integer>0</integer>  <!-- Minuto (0-59) -->
</dict>
```

### Agregar Recursos Protegidos

Editar `scripts/docker-cleanup.sh`:

```bash
# Agregar contenedores protegidos
PROTECTED_CONTAINERS=(
    "cactus-backend"
    "cactus-frontend"
    "mi-nuevo-contenedor"  # ← Agregar aquí
)

# Agregar volúmenes protegidos
PROTECTED_VOLUMES=(
    "postgres_data"
    "redis_data"
    "mi-nuevo-volumen"     # ← Agregar aquí
)
```

## 🚨 Solución de Problemas

### Problema: "Docker is not running"
```bash
# Solución: Iniciar Docker Desktop
open -a "Docker Desktop"
```

### Problema: "Permission denied"
```bash
# Solución: Dar permisos de ejecución
chmod +x scripts/docker-cleanup.sh
```

### Problema: "Service not loaded"
```bash
# Solución: Recargar el servicio
launchctl unload ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist
launchctl load ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist
```

### Problema: "bc command not found"
```bash
# Solución: Instalar bc (calculadora de línea de comandos)
brew install bc
```

## 📈 Métricas y Rendimiento

### Espacio Típico Liberado
- **Primera ejecución**: 10-30 GB
- **Ejecuciones semanales**: 1-5 GB
- **Tiempo de ejecución**: 30-120 segundos

### Factores que Afectan el Espacio
- Número de builds de Docker
- Imágenes no utilizadas
- Contenedores parados
- Caché de construcción
- Volúmenes huérfanos

## 🔄 Desinstalación

### Desinstalación Completa

```bash
# Ejecutar el desinstalador
./scripts/uninstall-docker-cleanup.sh
```

### Desinstalación Manual

```bash
# Detener el servicio
launchctl unload ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist

# Remover archivos
rm ~/Library/LaunchAgents/com.cactus.docker-cleanup.plist
rm scripts/docker-cleanup.log
rm -rf scripts/backups/
```

## 📞 Soporte

### Verificar Estado del Sistema
```bash
./scripts/docker-status.sh
```

### Logs Detallados
```bash
# Ver todos los logs
cat scripts/docker-cleanup.log

# Ver solo errores
grep "ERROR" scripts/docker-cleanup.log

# Ver solo advertencias
grep "WARN" scripts/docker-cleanup.log
```

### Información del Sistema
```bash
# Ver información de Docker
docker system df

# Ver contenedores activos
docker ps

# Ver todos los contenedores
docker ps -a

# Ver volúmenes
docker volume ls
```

## 🎯 Beneficios del Sistema

1. **Ahorro de Espacio**: Libera automáticamente 10-30 GB semanalmente
2. **Seguridad**: Protege datos importantes del proyecto
3. **Automatización**: Sin intervención manual requerida
4. **Transparencia**: Logs detallados de todas las operaciones
5. **Flexibilidad**: Modo manual y automático disponible
6. **Monitoreo**: Estado en tiempo real del sistema

## 🔮 Próximas Mejoras

- [ ] Notificaciones push cuando se libera mucho espacio
- [ ] Integración con Docker Desktop para monitoreo visual
- [ ] Configuración web para ajustar parámetros
- [ ] Backup automático de volúmenes importantes
- [ ] Métricas históricas de uso de espacio

---

**Desarrollado específicamente para Cactus Dashboard en macOS**  
**Versión**: 1.0.0  
**Última actualización**: $(date)

