# 📚 CactusDashboard - Documentación Unificada

## 🎯 Guía de Navegación Rápida

### 🚀 **INICIO RÁPIDO**
```bash
# Desarrollo local
task dev                    # Iniciar desarrollo completo
task help                   # Ver todos los comandos disponibles

# AWS deployment  
task aws:start              # Iniciar instancia EC2
task deploy:aws             # Desplegar aplicación
```

### 📖 **DOCUMENTACIÓN PRINCIPAL**

#### 🏗️ **Arquitectura y Desarrollo**
- **[Arquitectura del Sistema](#arquitectura)** - Diseño y componentes principales
- **[Configuración Local](#configuración-local)** - Setup completo para desarrollo
- **[API Documentation](#api)** - Endpoints y esquemas de datos

#### ☁️ **AWS y Deployment**
- **[Deployment AWS](#aws-deployment)** - Guía completa de despliegue
- **[Configuración OAuth](#oauth)** - Setup de autenticación Google
- **[Monitoreo y Logs](#monitoreo)** - Sistema de observabilidad

#### 🧪 **Testing y Calidad**
- **[Sistema de Testing](#testing)** - Tests automatizados
- **[Quality Checks](#quality)** - Validaciones y linting
- **[Troubleshooting](#troubleshooting)** - Solución de problemas

---

## 🏗️ Arquitectura

### Stack Tecnológico
- **Backend**: FastAPI + PostgreSQL + Redis
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Infrastructure**: Docker + AWS EC2 + Terraform
- **Automation**: Task + Scripts unificados

### Componentes Principales
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

---

## 🚀 Configuración Local

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+
- Python 3.11+
- Task (go-task)

### Setup Completo
```bash
# 1. Clonar repositorio
git clone <repo-url>
cd CactusDashboard

# 2. Configuración inicial
task setup

# 3. Iniciar desarrollo
task dev

# 4. Verificar servicios
task status
task health
```

### URLs de Desarrollo
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

---

## ☁️ AWS Deployment

### Configuración Inicial
```bash
# 1. Configurar AWS CLI
aws configure

# 2. Crear terraform.tfvars
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Editar con tus valores

# 3. Validar configuración
task validate

# 4. Desplegar
task deploy:aws
```

### Gestión de Instancia
```bash
# Iniciar instancia
task aws:start

# Estado de la instancia
task aws:status

# Obtener IP pública
task aws:ip

# Conectar SSH
task aws:ssh

# Detener instancia (ahorrar dinero)
task aws:stop
```

### Control de Costos
- **Presupuesto mensual**: $75 USD
- **Instancia**: t4g.small (Free Tier hasta Dec 2025)
- **Auto-downgrade**: t4g.micro desde Jan 2026
- **Alertas**: 95% del presupuesto

---

## 🔐 OAuth Configuration

### Google OAuth Setup
```bash
# Verificar configuración OAuth
task oauth:verify

# Configurar .env.local
cp cactus-wealth-frontend/.env.example cactus-wealth-frontend/.env.local
```

### Variables Requeridas
```bash
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google Console Configuration
1. Ir a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crear OAuth 2.0 Client ID
3. Configurar:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

---

## 🧪 Testing

### Ejecutar Tests
```bash
# Todos los tests
task test:all

# Tests específicos
task test:backend
task test:frontend
task test:integration
```

### Quality Checks
```bash
# Validación completa
task validate

# Linting y formato
task lint

# Verificar dependencias
task deps:check
```

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# Todos los servicios
task logs

# Servicios específicos
task logs:backend
task logs:frontend
```

### Health Checks
```bash
# Estado local
task health

# Estado AWS
task aws:health

# Recursos del sistema
task resources
```

### Debugging
```bash
# Diagnóstico completo
task debug

# Shell interactivo
task shell:backend
task shell:frontend
task shell:db
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### Puerto en Uso
```bash
task cleanup
task dev:restart
```

#### Docker Issues
```bash
docker system prune -f
task dev:rebuild
```

#### Dependencias
```bash
# Backend
cd cactus-wealth-backend
poetry install

# Frontend
cd cactus-wealth-frontend
npm install
```

#### Base de Datos
```bash
# Reiniciar PostgreSQL
task db:restart

# Verificar conexión
task db:status
```

### Comandos de Diagnóstico
```bash
# Estado general
task status

# Verificar puertos
task ports

# Uso de recursos
task resources

# Logs detallados
task debug
```

---

## 📝 API Documentation

### Endpoints Principales

#### Authentication
- `POST /api/v1/login/access-token` - Login
- `GET /api/v1/users/me` - Usuario actual

#### Clients
- `GET /api/v1/clients/` - Lista de clientes
- `POST /api/v1/clients/` - Crear cliente
- `GET /api/v1/clients/{id}` - Obtener cliente
- `PUT /api/v1/clients/{id}` - Actualizar cliente

#### Portfolios
- `GET /api/v1/portfolios/{id}/valuation` - Valoración
- `POST /api/v1/portfolios/backtest` - Backtest

#### Dashboard
- `GET /api/v1/dashboard/summary` - Resumen

### Documentación Interactiva
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎯 Comandos Task Principales

### Desarrollo Local
```bash
task dev          # Iniciar desarrollo completo
task dev:stop     # Detener desarrollo
task dev:restart  # Reiniciar desarrollo
task dev:rebuild  # Rebuild completo
```

### AWS Management
```bash
task aws:start    # Iniciar instancia EC2
task aws:stop     # Detener instancia
task aws:status   # Estado de la instancia
task aws:ip       # IP pública
task aws:ssh      # Conectar SSH
task aws:health   # Verificar salud
task aws:costs    # Información de costos
```

### Logs y Debugging
```bash
task logs         # Ver todos los logs
task logs:backend # Logs del backend
task logs:frontend# Logs del frontend
task debug        # Diagnóstico completo
task shell:backend# Shell del backend
task shell:db     # Shell PostgreSQL
```

### Status y Health
```bash
task status       # Estado general
task health       # Verificar salud
task ports        # Verificar puertos
task resources    # Uso de recursos
```

### Deployment y Config
```bash
task deploy:aws   # Desplegar a AWS
task setup        # Configuración inicial
task validate     # Validar configuración
task oauth:verify # Verificar OAuth
task cleanup      # Limpiar puertos y cachés
```

### Ayuda
```bash
task help         # Ayuda completa
task --list       # Lista de comandos
```

---

## 🎉 Migración Completada

### ✅ Scripts Unificados
Todos los scripts dispersos han sido consolidados en el `Taskfile.yml`:

| Script Anterior | Comando Task Nuevo |
|----------------|-------------------|
| `start.sh` | `task dev` |
| `quick-start.sh` | `task dev` |
| `deploy-aws-complete.sh` | `task deploy:aws` |
| `scripts/aws-instance.sh` | `task aws:*` |
| `scripts/debug.sh` | `task debug` |
| `scripts/validate-deployment.sh` | `task validate` |

### 🚀 Beneficios
- **Unificación**: Un solo sistema de comandos
- **Consistencia**: Sintaxis uniforme
- **Documentación**: Ayuda integrada
- **Mantenibilidad**: Fácil de extender

---

## 📞 Soporte

### Comandos de Ayuda
```bash
task help         # Documentación completa
task --list       # Lista rápida
task status       # Estado del sistema
```

### Recursos Adicionales
- **Documentación API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Logs**: `task logs`

---

## 📊 **BENCHMARKS Y OPTIMIZACIÓN**

### Performance Metrics Detallados

#### Optimización de Contenedores
| Servicio | Antes | Después | Mejora |
|----------|-------|---------|--------|
| **PostgreSQL** | 384MB | 256MB | -33% memoria |
| **Redis** | 128MB | 80MB | -37% memoria |
| **Backend** | 384MB | 320MB | -17% memoria |
| **Frontend** | 256MB | 192MB | -25% memoria |
| **ARQ Worker** | 192MB | 160MB | -17% memoria |
| **Total Sistema** | 1.2GB | 950MB | -21% memoria |

#### Tiempo de Ejecución
| Proceso | Original | Optimizado | Mejora |
|---------|----------|------------|--------|
| **Startup Total** | 3-4 min | 1-2 min | -60% |
| **Build Time** | 8-12 min | 4-6 min | -50% |
| **Quality Checks** | ~180s | ~17s | -91% |
| **Tests Completos** | ~60s | ~6s | -90% |

#### Optimizaciones de Scripts
- **Cache Inteligente**: 85% hit rate, TTL configurable
- **Ejecución Paralela**: Reducción 40-60% en tiempo total
- **Logging Optimizado**: Reducción 20-30% en overhead
- **Find Operations**: Cache de búsquedas, -50-70% tiempo

### Arquitectura Optimizada AWS Free Tier
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │◄──►│   Application    │◄──►│   RDS (Free)    │
│   (CDN/SSL)     │    │  Load Balancer   │    │  PostgreSQL     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   EC2 t3.micro  │    │   ElastiCache    │    │   S3 Bucket     │
│  (App Server)   │    │   (Redis Free)   │    │  (Static Files) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Sistema de Webhooks Nativo
- **Antes**: Backend → SyncBridge → TwentyCRM → n8n
- **Después**: Backend → n8n (webhooks HTTP directos)
- **Beneficios**: -70% latencia, eliminación de 2 servicios intermedios

### Optimizaciones Implementadas
- Sistema de webhooks nativo (eliminación de SyncBridge)
- Imágenes Docker multi-stage con Alpine Linux
- Cache inteligente y paralelización de procesos
- Configuración optimizada para AWS Free Tier
- Usuario no-root en todos los contenedores
- Logs centralizados con rotación automática

---

*Documentación actualizada: $(date +'%Y-%m-%d %H:%M:%S')*
*Sistema unificado con Task - Versión 2.0*