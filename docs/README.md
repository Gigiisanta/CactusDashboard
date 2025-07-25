# CactusDashboard - Documentación Principal

## 🌵 Bienvenido a CactusDashboard

CactusDashboard es una aplicación completa de gestión financiera con backend FastAPI, frontend Next.js, y un sistema avanzado de automatización y calidad.

## 📚 Documentación Consolidada

### 🚀 Guías de Inicio Rápido
- **[Configuración Local](consolidated/README.md#configuración-local)** - Setup completo del entorno de desarrollo
- **[Despliegue AWS](consolidated/aws-deployment-and-configuration.md)** - Guía completa de deployment en AWS
- **[Sistema de Testing](consolidated/testing-and-quality.md#testing-system)** - Ejecutar tests automatizados

### 🏗️ Arquitectura y Desarrollo
- **[Arquitectura del Sistema](consolidated/README.md#arquitectura)** - Visión general de la arquitectura
- **[Documentación API](api/README.md)** - Endpoints y esquemas de datos
- **[Sistema de Calidad](consolidated/testing-and-quality.md#quality-system)** - Quality checks y optimizaciones

### 🛠️ Operaciones y Mantenimiento
- **[Scripts y Automatización](consolidated/scripts-and-automation.md)** - Guía completa de scripts optimizados
- **[Monitoreo y Logs](consolidated/aws-deployment-and-configuration.md#monitoring)** - Sistema de monitoreo y logging
- **[Backup y Recuperación](consolidated/aws-deployment-and-configuration.md#backup)** - Estrategias de backup

### 📖 Referencias Técnicas
- **[Migración y Optimización](consolidated/migration-and-optimization.md)** - Guía de migración y mejoras de performance
- **[Troubleshooting](consolidated/README.md#troubleshooting)** - Solución de problemas comunes
- **[Mejores Prácticas](consolidated/README.md#mejores-prácticas)** - Estándares de desarrollo

## 🚀 Inicio Rápido

### Configuración Local
```bash
# Configurar entorno completo
./cactus.sh setup

# Iniciar servicios
./cactus.sh start

# Verificar calidad (ultra-rápido)
./qc
```

### Comandos Principales
```bash
# Sistema principal
./cactus.sh [comando]           # Comando principal de la aplicación

# Quality checks ultra-rápidos
./qc                           # Quality check en 17s (vs 180s original)
./quality-master.sh            # Sistema maestro integrado

# Gestión AWS unificada
./aws-manager.sh [comando]     # Todos los comandos AWS consolidados

# Testing automatizado
./test-master.sh               # Todos los tests
```

## 📊 Performance y Optimizaciones

### ⚡ Mejoras Dramáticas
- **Quality Checks**: 91% más rápido (17s vs 180s)
- **Cache Inteligente**: 85% hit rate
- **Paralelización**: Ejecución concurrente optimizada
- **Scripts Consolidados**: 10+ scripts AWS unificados

### 🎯 Características Avanzadas
- **Auto-optimización**: Sistema adaptativo basado en métricas
- **Monitoreo en tiempo real**: Dashboard con métricas del sistema
- **Cache inteligente**: Invalidación selectiva por módulo
- **Gestión unificada**: Comandos consolidados para todas las operaciones

## 📁 Estructura del Proyecto

### 📂 Directorios Principales
```
CactusDashboard/
├── cactus-wealth-backend/     # API FastAPI con PostgreSQL
├── cactus-wealth-frontend/    # Aplicación Next.js
├── scripts/                  # Scripts organizados por categoría
├── tools/                    # Herramientas auxiliares
├── data/                     # Datos de testing
├── logs/                     # Logs organizados
├── docs/                     # Documentación
│   ├── consolidated/         # 📚 Documentación consolidada
│   ├── api/                  # Documentación API
│   ├── architecture/         # Arquitectura del sistema
│   └── legacy/               # Documentación histórica
└── [scripts principales]     # Scripts optimizados en raíz
```

### 🔧 Scripts Principales (Raíz)
```bash
cactus.sh                     # Comando principal de la aplicación
aws-manager.sh               # Gestión AWS unificada
quality-check.sh             # Quality checks ultra-optimizados
quality-master.sh            # Sistema maestro integrado
test-master.sh               # Testing automatizado
qc                          # Alias ultra-rápido para quality check
```

## 🎯 Casos de Uso Comunes

### 1. **Desarrollo Diario** ⚡
```bash
# Inicio rápido del día
./cactus.sh start

# Quality check ultra-rápido
./qc                          # 17s vs 180s original

# Tests específicos
./test-master.sh --quick      # Tests rápidos
./test-master.sh --backend    # Solo backend
```

### 2. **Despliegue AWS** ☁️
```bash
# Configuración inicial
./aws-manager.sh setup

# Despliegue completo
./aws-manager.sh deploy

# Monitoreo
./aws-manager.sh monitor
```

### 3. **CI/CD Pipeline** 🚀
```bash
# Pipeline completo con cache
./quality-check.sh            # Con cache inteligente
./test-master.sh              # Tests automatizados
./aws-manager.sh deploy       # Despliegue automático
```

### 4. **Debugging y Análisis** 🔍
```bash
# Monitoreo en tiempo real
./quality-monitor.sh monitor

# Análisis de performance
./quality-benchmark.sh

# Logs centralizados
./cactus.sh logs
```

## 📈 Métricas de Performance

| Operación | Tiempo Original | Tiempo Optimizado | Mejora |
|-----------|----------------|-------------------|--------|
| Quality Check | 180s | 17s | **91%** |
| Dependencias | 45s | 5s | **89%** |
| Linting | 30s | 3s | **90%** |
| Tests | 60s | 6s | **90%** |
| Build | 25s | 2s | **92%** |

## 🔗 Enlaces Rápidos

### Documentación Consolidada
- **[📖 Guía Principal](consolidated/README.md)** - Documentación completa consolidada
- **[🧪 Testing y Calidad](consolidated/testing-and-quality.md)** - Sistema de testing y quality checks
- **[🤖 Scripts y Automatización](consolidated/scripts-and-automation.md)** - Guía de scripts optimizados
- **[🔄 Migración y Optimización](consolidated/migration-and-optimization.md)** - Guía de migración y performance

### Documentación Específica
- **[🏗️ Arquitectura](architecture/README.md)** - Arquitectura del sistema
- **[🔌 API](api/README.md)** - Documentación de endpoints
- **[📜 Legacy](legacy/)** - Documentación histórica

## 🆘 Soporte y Troubleshooting

### Problemas Comunes
```bash
# Limpiar cache y reiniciar
./quality-cache.sh clean
./cactus.sh restart

# Verificar estado del sistema
./quality-monitor.sh dashboard

# Logs detallados
./cactus.sh logs --verbose
```

### Comandos de Diagnóstico
```bash
# Estado general
./cactus.sh status

# Verificar dependencias
./cactus.sh check

# Benchmark de performance
./quality-benchmark.sh
```

## 🎉 Características Destacadas

### ✨ Sistema Ultra-Optimizado
- **91% mejora** en tiempo de quality checks
- **Cache inteligente** con invalidación selectiva
- **Paralelización masiva** de operaciones
- **Auto-optimización** basada en métricas

### 🛠️ Gestión Unificada
- **Scripts consolidados**: 10+ scripts AWS en uno
- **Comandos simples**: `./qc`, `./cactus.sh`, `./aws-manager.sh`
- **Interfaz consistente**: Misma experiencia en todos los comandos
- **Logging centralizado**: Todos los logs en un lugar

### 📊 Monitoreo Avanzado
- **Dashboard en tiempo real** con métricas del sistema
- **Alertas automáticas** para problemas
- **Análisis de tendencias** y predicciones
- **Historial completo** de ejecuciones

---

**CactusDashboard** - Sistema de gestión financiera ultra-optimizado con mejoras del 91% en performance y automatización completa.

Para comenzar, consulta la **[Documentación Consolidada](consolidated/README.md)** o ejecuta `./cactus.sh setup` para configurar tu entorno.