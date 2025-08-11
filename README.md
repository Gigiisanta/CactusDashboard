# 🌵 CactusDashboard - Wealth Management Platform

**Next.js + FastAPI + PostgreSQL + Task Automation**

Una plataforma de gestión financiera de alto rendimiento con sistema de automatización unificado y arquitectura optimizada.

## 🚀 **INICIO RÁPIDO**

### Migración a Podman (Recomendado)
```bash
# 1. Migración automática a Podman (más liviano y rápido)
./scripts/migrate-to-podman.sh

# 2. O migración manual paso a paso
./scripts/setup-podman.sh
task podman:verify
task dev
```

### Desarrollo Local (Docker)
```bash
# 1. Instalar Task (si no está instalado)
# macOS: brew install go-task
# Linux: sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin

# 2. Configuración inicial
task setup

# 3. Iniciar desarrollo
task dev

# 4. Acceder a la aplicación
# Frontend: http://localhost:3000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### AWS Deployment
```bash
# Configurar AWS y desplegar
task deploy:aws

# Gestionar instancia
task aws:start    # Iniciar
task aws:stop     # Detener (ahorrar dinero)
task aws:status   # Estado
```

## 🎯 **COMANDOS PRINCIPALES**

```bash
# Desarrollo
task dev          # Iniciar desarrollo completo
task dev:stop     # Detener desarrollo
task status       # Estado del sistema
task health       # Verificar salud

# Podman Management
task podman:status    # Estado de la máquina Podman
task podman:start     # Iniciar máquina Podman
task podman:stop      # Detener máquina Podman
task podman:cleanup   # Limpiar recursos Podman

# AWS Management
task aws:start    # Iniciar instancia EC2
task aws:stop     # Detener instancia
task aws:ip       # Obtener IP pública
task aws:ssh      # Conectar SSH

# Logs y Debug
task logs         # Ver logs en vivo
task debug        # Diagnóstico completo
task cleanup      # Limpiar puertos

# Ayuda
task help         # Documentación completa
task --list       # Lista de comandos
```

## 📚 **DOCUMENTACIÓN COMPLETA**

### 📖 Guía Principal
**[📚 DOCUMENTATION.md](DOCUMENTATION.md)** - Documentación unificada completa

### 🔗 Enlaces Rápidos
- **[Migración a Podman](PODMAN_MIGRATION.md)** - Guía completa de migración
- **[Configuración Local](DOCUMENTATION.md#configuración-local)** - Setup desarrollo
- **[AWS Deployment](DOCUMENTATION.md#despliegue-aws)** - Despliegue en AWS  
- **[OAuth Setup](DOCUMENTATION.md#autenticación)** - Configuración Google
- **[API Docs](DOCUMENTATION.md#api-y-desarrollo)** - Endpoints y schemas
- **[Troubleshooting](DOCUMENTATION.md#docker-y-troubleshooting)** - Solución de problemas

## 🏗️ **ARQUITECTURA**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Backend API    │◄──►│   PostgreSQL    │
│   (Next.js)     │    │   (FastAPI)      │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Task System   │    │     Redis        │    │   Monitoring    │
│   (Automation)  │    │   (Cache/Queue)  │    │   (Health)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ **CARACTERÍSTICAS PRINCIPALES**

- ✅ **Sistema Unificado**: Todos los comandos en `Taskfile.yml`
- ✅ **AWS Optimizado**: Control de costos y auto-downgrade
- ✅ **Real-time**: WebSockets y eventos en tiempo real
- ✅ **Type-safe**: TypeScript + Pydantic end-to-end
- ✅ **Testing**: Cobertura completa con pytest y Jest
- ✅ **Monitoring**: Health checks y observabilidad

## 🌩️ **AWS DEPLOYMENT**

### URLs de Producción
- **Frontend**: http://3.137.157.34:3000
- **API**: http://3.137.157.34:8000
- **Health**: http://3.137.157.34:8000/health

### Control de Costos
- **Presupuesto**: $75/mes con alertas automáticas
- **Instancia**: t4g.small (Free Tier hasta Dec 2025)
- **Auto-downgrade**: t4g.micro desde Jan 2026
- **Monitoreo**: CloudWatch + SNS alerts

## 🔧 **STACK TECNOLÓGICO**

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Backend** | FastAPI | 0.111.0 |
| **Frontend** | Next.js | 15.4.1 |
| **Database** | PostgreSQL | Latest |
| **Cache** | Redis | Latest |
| **Automation** | Task | 3.44.1 |
| **Infrastructure** | Docker + AWS | Latest |

## 📁 **Project Structure**

```
CactusDashboard/
├── cactus-wealth-backend/     # FastAPI backend
├── cactus-wealth-frontend/    # Next.js frontend
├── scripts/                   # Scripts directory
├── config/                   # Configuration files
├── terraform/                # Infrastructure as Code
├── Taskfile.yml             # CLI task runner unificado
├── docker-compose.yml       # Docker configuration unificada
├── DOCUMENTATION.md         # Documentación consolidada
└── README.md                # This file
```

## 📞 **SOPORTE**

```bash
# Ayuda completa
task help

# Lista rápida de comandos  
task --list

# Estado del sistema
task status

# Diagnóstico
task debug
```

### 📖 Documentación Detallada
- **[📚 DOCUMENTATION.md](DOCUMENTATION.md)** - Guía completa consolidada

---

**🎯 Sistema unificado con Task - Todo en un solo lugar**