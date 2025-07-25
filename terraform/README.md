# 🚀 Guía de Despliegue Automatizado con Terraform

Esta guía te permitirá desplegar Cactus Dashboard en AWS Free Tier de forma completamente automatizada usando Terraform.

## 📋 Prerrequisitos

### 1. Cuenta AWS
- Cuenta AWS activa con acceso a Free Tier
- Permisos para crear recursos EC2, VPC, Security Groups, etc.

### 2. Herramientas Locales
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Instalar Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### 3. Configuración AWS
```bash
# Configurar credenciales AWS
aws configure
# AWS Access Key ID: [Tu Access Key]
# AWS Secret Access Key: [Tu Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verificar configuración
aws sts get-caller-identity
```

### 4. Key Pair SSH
```bash
# Crear key pair en AWS (si no tienes uno)
aws ec2 create-key-pair --key-name cactus-dashboard-key --query 'KeyMaterial' --output text > ~/.ssh/cactus-dashboard-key.pem
chmod 400 ~/.ssh/cactus-dashboard-key.pem
```

## 🚀 Despliegue Rápido (5 minutos)

### Paso 1: Preparar Configuración
```bash
cd terraform/

# Copiar y personalizar variables
cp terraform.tfvars.example terraform.tfvars

# Editar configuración
nano terraform.tfvars
```

**Configuración mínima requerida en `terraform.tfvars`:**
```hcl
project_name = "cactus-dashboard"
environment  = "prod"
aws_region   = "us-east-1"
instance_type = "t3.micro"
key_pair_name = "cactus-dashboard-key"  # Tu key pair
allowed_ssh_cidr = ["TU.IP.PUBLICA.AQUI/32"]  # Tu IP específica
```

### Paso 2: Desplegar Infraestructura
```bash
# Inicializar Terraform
terraform init

# Revisar plan de despliegue
terraform plan

# Aplicar configuración (crear infraestructura)
terraform apply
# Escribir 'yes' cuando se solicite confirmación
```

### Paso 3: Verificar Despliegue
```bash
# Ver outputs importantes
terraform output

# Conectarse a la instancia
ssh -i ~/.ssh/cactus-dashboard-key.pem ubuntu@$(terraform output -raw public_ip)

# Verificar estado de la aplicación
./system-info.sh
```

## 📊 Información del Despliegue

### URLs de Acceso
Después del despliegue, tendrás acceso a:

- **Frontend**: `http://TU-IP-PUBLICA:3000`
- **Backend API**: `http://TU-IP-PUBLICA:8000`
- **Documentación API**: `http://TU-IP-PUBLICA:8000/docs`
- **Nginx (HTTP)**: `http://TU-IP-PUBLICA`

### Recursos Creados
- ✅ Instancia EC2 t3.micro (Free Tier)
- ✅ Elastic IP
- ✅ Security Group optimizado
- ✅ CloudWatch Alarms
- ✅ SNS Topic para alertas
- ✅ Budget para control de costos
- ✅ Route53 (opcional, si configuras dominio)

### Configuración Automática
La instancia se configura automáticamente con:
- ✅ Docker y Docker Compose
- ✅ Nginx con configuración optimizada
- ✅ Firewall (UFW) configurado
- ✅ Swap de 2GB para optimizar memoria
- ✅ CloudWatch Agent para monitoreo
- ✅ Fail2ban para seguridad
- ✅ Scripts de monitoreo y backup
- ✅ Aplicación Cactus Dashboard desplegada

## 🔧 Configuración Post-Despliegue

### 1. Configurar SSL (Recomendado)
```bash
# Conectarse a la instancia
ssh -i ~/.ssh/cactus-dashboard-key.pem ubuntu@$(terraform output -raw public_ip)

# Configurar SSL con tu dominio
cd CactusDashboard
./scripts/deploy-aws.sh ssl tu-dominio.com
```

### 2. Configurar Alertas por Email
```bash
# En AWS Console, ir a SNS y suscribirse al topic creado
aws sns subscribe \
    --topic-arn $(terraform output -raw sns_topic_arn) \
    --protocol email \
    --notification-endpoint tu-email@ejemplo.com
```

### 3. Configurar Backup Automático
```bash
# En la instancia EC2
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/ubuntu/CactusDashboard/scripts/deploy-aws.sh backup
```

## 📈 Monitoreo y Mantenimiento

### Comandos Útiles en la Instancia
```bash
# Ver estado general
./system-info.sh

# Ver estado de servicios
./scripts/deploy-aws.sh status

# Ver logs en tiempo real
./scripts/deploy-aws.sh logs

# Crear backup manual
./scripts/deploy-aws.sh backup

# Actualizar aplicación
./scripts/deploy-aws.sh update

# Limpiar recursos
./scripts/deploy-aws.sh cleanup
```

### Monitoreo en AWS Console
- **CloudWatch**: Métricas de CPU, memoria, disco
- **CloudWatch Logs**: Logs de aplicación y Nginx
- **AWS Budgets**: Control de costos
- **SNS**: Alertas por email

## 🔄 Gestión del Ciclo de Vida

### Actualizar Infraestructura
```bash
# Modificar terraform.tfvars o main.tf según necesites
nano terraform.tfvars

# Aplicar cambios
terraform plan
terraform apply
```

### Destruir Infraestructura
```bash
# ⚠️ CUIDADO: Esto eliminará todos los recursos
terraform destroy
# Escribir 'yes' cuando se solicite confirmación
```

### Backup Antes de Destruir
```bash
# Conectarse y crear backup final
ssh -i ~/.ssh/cactus-dashboard-key.pem ubuntu@$(terraform output -raw public_ip)
cd CactusDashboard
./scripts/deploy-aws.sh backup

# Descargar backup a tu máquina local
scp -i ~/.ssh/cactus-dashboard-key.pem -r ubuntu@$(terraform output -raw public_ip):/opt/cactus/backups ./backups-locales/
```

## 💰 Optimización de Costos

### Recursos Free Tier Incluidos
- **EC2**: 750 horas/mes de t3.micro
- **EBS**: 30 GB de almacenamiento
- **Elastic IP**: Gratis mientras esté asociada
- **CloudWatch**: 10 métricas personalizadas
- **SNS**: 1,000 notificaciones/mes

### Alertas de Presupuesto
- Configurado automáticamente para $10/mes
- Alertas al 80% y 100% del presupuesto
- Notificaciones por email

### Consejos de Optimización
1. **Parar instancia cuando no la uses**:
   ```bash
   aws ec2 stop-instances --instance-ids $(terraform output -raw instance_id)
   aws ec2 start-instances --instance-ids $(terraform output -raw instance_id)
   ```

2. **Monitorear uso de recursos**:
   - Revisar CloudWatch regularmente
   - Usar `htop` en la instancia para monitoreo en tiempo real

3. **Limpiar recursos regularmente**:
   ```bash
   ./scripts/deploy-aws.sh cleanup
   ```

## 🔒 Seguridad

### Configuración Incluida
- ✅ Firewall UFW configurado
- ✅ Fail2ban para protección SSH
- ✅ Security Group restrictivo
- ✅ Acceso SSH limitado por IP
- ✅ SSL/TLS configuración
- ✅ Headers de seguridad en Nginx

### Recomendaciones Adicionales
1. **Cambiar puerto SSH** (opcional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Cambiar Port 22 por Port 2222
   sudo systemctl restart ssh
   ```

2. **Configurar autenticación de dos factores**
3. **Revisar logs regularmente**:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

## 🆘 Solución de Problemas

### Problemas Comunes

#### 1. Terraform apply falla
```bash
# Verificar credenciales AWS
aws sts get-caller-identity

# Verificar permisos
aws iam get-user

# Limpiar estado si es necesario
terraform refresh
```

#### 2. Instancia no responde
```bash
# Verificar estado en AWS Console
aws ec2 describe-instances --instance-ids $(terraform output -raw instance_id)

# Ver logs de user-data
aws ec2 get-console-output --instance-id $(terraform output -raw instance_id)
```

#### 3. Aplicación no funciona
```bash
# Conectarse y verificar
ssh -i ~/.ssh/cactus-dashboard-key.pem ubuntu@$(terraform output -raw public_ip)

# Ver logs de configuración
sudo tail -f /var/log/cactus-setup.log

# Ver estado de Docker
docker-compose -f CactusDashboard/docker-compose.prod.yml ps
```

#### 4. Problemas de memoria
```bash
# Verificar swap
free -h

# Reiniciar servicios si es necesario
cd CactusDashboard
docker-compose -f docker-compose.prod.yml restart
```

### Logs Importantes
- **Setup**: `/var/log/cactus-setup.log`
- **Aplicación**: `/var/log/cactus/`
- **Nginx**: `/var/log/nginx/`
- **Sistema**: `/var/log/syslog`

## 📞 Soporte

### Recursos Útiles
- [Documentación AWS Free Tier](https://aws.amazon.com/free/)
- [Documentación Terraform](https://www.terraform.io/docs)
- [Guía Docker](https://docs.docker.com/)

### Contacto
Para problemas específicos del proyecto, crear un issue en el repositorio de GitHub.

---

## 🎉 ¡Felicidades!

Si has llegado hasta aquí, deberías tener Cactus Dashboard funcionando completamente en AWS Free Tier. 

**Próximos pasos recomendados:**
1. Configurar SSL con tu dominio
2. Configurar alertas por email
3. Programar backups automáticos
4. Personalizar la aplicación según tus necesidades

¡Disfruta de tu nueva aplicación en la nube! 🌵☁️