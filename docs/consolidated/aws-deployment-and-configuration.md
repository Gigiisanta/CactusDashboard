# Despliegue AWS y Configuración - CactusDashboard

## 🚀 Guía Completa de Despliegue AWS

### Resumen Ejecutivo

Esta guía consolida todas las instrucciones para desplegar CactusDashboard en AWS Free Tier de manera optimizada, segura y automatizada.

## 📋 Requisitos Previos

### Software Local Requerido
- **AWS CLI** v2.0+
- **Terraform** v1.0+
- **Docker** v20.0+
- **Docker Compose** v2.0+
- **SSH** client
- **curl** y **jq** (recomendado)

### Cuenta AWS
- Cuenta AWS activa con Free Tier
- Permisos para EC2, VPC, IAM, RDS, ElastiCache
- Límites de Free Tier disponibles

### Instalación Rápida de Dependencias

#### macOS (Homebrew)
```bash
# Instalar todas las dependencias
brew install awscli terraform jq curl
brew install --cask docker
```

#### Ubuntu/Debian
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Docker
sudo apt update && sudo apt install docker.io docker-compose-plugin
sudo usermod -aG docker $USER

# Herramientas adicionales
sudo apt install jq curl
```

## ⚙️ Configuración Inicial

### 1. Configurar AWS CLI
```bash
# Configuración interactiva
aws configure

# Verificar configuración
aws sts get-caller-identity
aws configure get region
```

### 2. Preparar Proyecto
```bash
# Clonar proyecto (si es necesario)
git clone <repository-url>
cd CactusDashboard

# Verificar dependencias
./aws-manager.sh check
```

## 🚀 Despliegue Ultra-Rápido

### Opción 1: Despliegue Automático Completo
```bash
# Despliegue completo con un comando
./aws-manager.sh deploy
```

Este comando ejecuta automáticamente:
1. ✅ Verificación de dependencias y configuración
2. 🏗️ Creación de infraestructura con Terraform
3. ⏳ Espera de instancia lista y configuración
4. 🔒 Configuración de seguridad y firewall
5. ⚡ Optimización de rendimiento del servidor
6. 🚀 Despliegue de aplicación con Docker
7. 🔐 Configuración SSL con Let's Encrypt
8. 🚨 Configuración de alertas y monitoreo
9. 💾 Configuración de backups automáticos
10. ✅ Verificación final y pruebas

### Opción 2: Despliegue con Variables Personalizadas
```bash
# Con dominio personalizado y alertas
DOMAIN_NAME="mi-dashboard.com" \
ALERT_EMAIL="admin@mi-empresa.com" \
SLACK_WEBHOOK="https://hooks.slack.com/..." \
./aws-manager.sh deploy
```

### Opción 3: Despliegue en Región Específica
```bash
# Desplegar en región diferente
AWS_REGION="eu-west-1" \
INSTANCE_TYPE="t3.micro" \
./aws-manager.sh deploy
```

## 🏗️ Arquitectura de Despliegue

### Arquitectura Optimizada para Free Tier
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

### Configuración de Seguridad
```
Internet
    ↓
[AWS Security Group] - Solo puertos 22, 80, 443
    ↓
[Nginx Reverse Proxy] - Puerto 80/443
    ↓
[Red Docker Interna: cactus_network]
    ├── Backend (puerto 8000) - Solo interno
    ├── Frontend (puerto 3000) - Solo interno
    ├── PostgreSQL (puerto 5432) - Solo interno
    ├── Redis (puerto 6379) - Solo interno + contraseña
    └── Sync Bridge (puerto 8001) - Solo interno
```

## 📝 Despliegue Paso a Paso (Avanzado)

### Paso 1: Configuración de Infraestructura
```bash
# Configurar infraestructura AWS
./aws-manager.sh setup

# Crear infraestructura con Terraform
./aws-manager.sh terraform apply
```

### Paso 2: Configuración del Servidor
```bash
# Obtener IP de la instancia
INSTANCE_IP=$(./aws-manager.sh status | grep "Public IP" | awk '{print $3}')

# Configurar servidor automáticamente
./aws-manager.sh configure
```

### Paso 3: Desplegar Aplicación
```bash
# Desplegar aplicación
./aws-manager.sh deploy-app

# Configurar SSL
./aws-manager.sh ssl
```

## 🔧 Configuración Post-Despliegue

### Verificar Estado
```bash
# Estado general del sistema
./aws-manager.sh status

# Logs en tiempo real
./aws-manager.sh logs

# Monitoreo de recursos
./aws-manager.sh monitor
```

### Configurar Dominio (Opcional)
```bash
# Configurar dominio personalizado
./aws-manager.sh ssl --domain mi-dashboard.com

# Configurar CloudFront CDN
./aws-manager.sh cdn --domain mi-dashboard.com
```

### Configurar Backups
```bash
# Configurar backups automáticos
./aws-manager.sh backup setup

# Ejecutar backup manual
./aws-manager.sh backup create
```

## 🔒 Seguridad y Mejores Prácticas

### Medidas de Seguridad Implementadas

#### 1. **Aislamiento de Red**
- PostgreSQL y Redis solo accesibles internamente
- Todo el tráfico pasa por Nginx como reverse proxy
- Security Groups restrictivos (solo puertos 22, 80, 443)

#### 2. **Autenticación y Encriptación**
- Redis protegido con contraseña
- SSL/TLS automático con Let's Encrypt
- Headers de seguridad configurados

#### 3. **Rate Limiting y Protección**
- 100 requests/minuto por IP
- 10 conexiones concurrentes por IP
- Protección contra ataques comunes

### Verificación de Seguridad
```bash
# Verificar configuración de seguridad
./aws-manager.sh security-check

# Escaneo de vulnerabilidades
./aws-manager.sh security-scan
```

## 📊 Monitoreo y Mantenimiento

### Comandos de Monitoreo
```bash
# Dashboard en tiempo real
./aws-manager.sh monitor

# Métricas de performance
./aws-manager.sh metrics

# Estado de servicios
./aws-manager.sh health
```

### Mantenimiento Automático
```bash
# Actualizar aplicación
./aws-manager.sh update

# Limpiar logs antiguos
./aws-manager.sh cleanup

# Optimizar base de datos
./aws-manager.sh optimize
```

## 💰 Optimización de Costos

### Configuración Free Tier
- **EC2**: t3.micro (750 horas/mes gratis)
- **RDS**: db.t3.micro PostgreSQL (750 horas/mes gratis)
- **ElastiCache**: cache.t3.micro Redis (750 horas/mes gratis)
- **S3**: 5GB almacenamiento gratis
- **CloudFront**: 50GB transferencia gratis

### Monitoreo de Costos
```bash
# Ver costos actuales
./aws-manager.sh costs

# Alertas de presupuesto
./aws-manager.sh budget-alerts
```

## 🆘 Solución de Problemas

### Problemas Comunes

#### 1. **Instancia no accesible**
```bash
# Verificar security groups
./aws-manager.sh check-security

# Reiniciar servicios
./aws-manager.sh restart
```

#### 2. **Aplicación no carga**
```bash
# Verificar logs
./aws-manager.sh logs --tail

# Verificar estado de contenedores
./aws-manager.sh docker-status
```

#### 3. **Base de datos no conecta**
```bash
# Verificar conexión a RDS
./aws-manager.sh db-check

# Reiniciar servicios de BD
./aws-manager.sh db-restart
```

### Comandos de Diagnóstico
```bash
# Diagnóstico completo
./aws-manager.sh diagnose

# Verificar conectividad
./aws-manager.sh connectivity-test

# Logs detallados
./aws-manager.sh logs --verbose
```

## 🔄 Desarrollo Local Optimizado

### Configuración Local Ultra-Rápida

Para desarrollo local sin Docker (10x más rápido):

#### Requisitos
- Python 3.12+ con Poetry
- Node.js 18+ con npm
- PostgreSQL local
- Redis local

#### Configuración
```bash
# Backend (.env.local)
DATABASE_URL=postgresql://cactus_user:cactus_password@localhost:5432/cactus_wealth
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

#### Arranque Ultra-Rápido
```bash
# Dar permisos
chmod +x start-local.sh

# Iniciar todo en paralelo
./start-local.sh

# Monitoreo en tiempo real
tail -f logs/*.log
```

### Performance Comparison

| Flujo | Backend Ready | Frontend Ready | DB Ready | Hot Reload | RAM/CPU |
|-------|--------------|---------------|----------|------------|---------|
| Docker Compose (Mac) | 1-3 min | 1-2 min | 30-60s | Lento | Alto |
| Local puro | 5-10s | 5-10s | 2-5s | Instantáneo | Bajo |

## 🎯 Comandos de Referencia Rápida

### Comandos Principales
```bash
# Despliegue completo
./aws-manager.sh deploy

# Estado del sistema
./aws-manager.sh status

# Logs en tiempo real
./aws-manager.sh logs

# Monitoreo
./aws-manager.sh monitor

# Backup
./aws-manager.sh backup

# Actualizar
./aws-manager.sh update

# Destruir infraestructura
./aws-manager.sh destroy
```

### Comandos de Desarrollo
```bash
# Desarrollo local
./start-local.sh

# Quality check ultra-rápido
./qc

# Tests automatizados
./test-master.sh

# Sistema maestro
./quality-master.sh
```

## 📚 Referencias Adicionales

### Documentación Relacionada
- **[Scripts y Automatización](scripts-and-automation.md)** - Guía completa de scripts
- **[Testing y Calidad](testing-and-quality.md)** - Sistema de testing
- **[Migración y Optimización](migration-and-optimization.md)** - Mejoras de performance

### Enlaces Útiles
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**CactusDashboard AWS Deployment** - Despliegue automatizado, seguro y optimizado para AWS Free Tier con mejoras del 91% en performance y gestión unificada.

Para comenzar inmediatamente: `./aws-manager.sh deploy`