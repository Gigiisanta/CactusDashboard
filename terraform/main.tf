# Configuración de Terraform para desplegar Cactus Dashboard en AWS Free Tier
# Este archivo automatiza la creación de toda la infraestructura necesaria

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables de configuración
variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "cactus-dashboard"
}

variable "environment" {
  description = "Entorno (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"  # Free Tier eligible
}

variable "key_pair_name" {
  description = "Nombre del key pair para SSH"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks permitidos para SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Cambiar por tu IP específica para mayor seguridad
}

variable "domain_name" {
  description = "Nombre de dominio (opcional)"
  type        = string
  default     = ""
}

# Configuración del proveedor AWS
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Obtener la AMI más reciente de Ubuntu
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Obtener la VPC por defecto
data "aws_vpc" "default" {
  default = true
}

# Obtener subnets de la VPC por defecto
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group para la aplicación
resource "aws_security_group" "cactus_dashboard" {
  name_prefix = "${var.project_name}-"
  description = "Security group for Cactus Dashboard - Secure Configuration"
  vpc_id      = data.aws_vpc.default.id

  # SSH - Solo desde IPs específicas
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP - Para Nginx reverse proxy
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS - Para Nginx reverse proxy con SSL
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # ELIMINADO: Frontend directo (3000) - Solo accesible via Nginx
  # ELIMINADO: Backend directo (8000) - Solo accesible via Nginx  
  # ELIMINADO: PostgreSQL (5432) - Solo accesible internamente via Docker
  # ELIMINADO: Redis (6379) - Solo accesible internamente via Docker

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-secure"
  }
}

# Elastic IP para la instancia
resource "aws_eip" "cactus_dashboard" {
  domain = "vpc"
  
  tags = {
    Name = "${var.project_name}-eip"
  }
}

# Asociar Elastic IP con la instancia
resource "aws_eip_association" "cactus_dashboard" {
  instance_id   = aws_instance.cactus_dashboard.id
  allocation_id = aws_eip.cactus_dashboard.id
}

# User data script para configuración inicial
locals {
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))
}

# Instancia EC2
resource "aws_instance" "cactus_dashboard" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.cactus_dashboard.id]
  subnet_id             = data.aws_subnets.default.ids[0]
  
  # Configuración de almacenamiento (Free Tier: hasta 30GB)
  root_block_device {
    volume_type = "gp3"
    volume_size = 20  # GB
    encrypted   = true
    
    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  user_data = local.user_data

  # Configuración de metadatos
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name = "${var.project_name}-instance"
  }
}

# CloudWatch Alarm para monitoreo de CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.cactus_dashboard.id
  }

  tags = {
    Name = "${var.project_name}-cpu-alarm"
  }
}

# CloudWatch Alarm para monitoreo de memoria (requiere CloudWatch Agent)
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.project_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.cactus_dashboard.id
  }

  tags = {
    Name = "${var.project_name}-memory-alarm"
  }
}

# SNS Topic para alertas
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
  
  tags = {
    Name = "${var.project_name}-alerts"
  }
}

# Budget para controlar costos
resource "aws_budgets_budget" "cactus_dashboard" {
  name         = "${var.project_name}-monthly-budget"
  budget_type  = "COST"
  limit_amount = "10"  # $10 USD
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters {
    tag {
      key    = "Project"
      values = [var.project_name]
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = ["admin@example.com"]  # Cambiar por tu email
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["admin@example.com"]  # Cambiar por tu email
  }
}

# Route53 (opcional, solo si se proporciona dominio)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "${var.project_name}-zone"
  }
}

resource "aws_route53_record" "main" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.cactus_dashboard.public_ip]
}

resource "aws_route53_record" "www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.cactus_dashboard.public_ip]
}

# Outputs
output "instance_id" {
  description = "ID de la instancia EC2"
  value       = aws_instance.cactus_dashboard.id
}

output "public_ip" {
  description = "IP pública de la instancia"
  value       = aws_eip.cactus_dashboard.public_ip
}

output "public_dns" {
  description = "DNS público de la instancia"
  value       = aws_instance.cactus_dashboard.public_dns
}

output "ssh_command" {
  description = "Comando SSH para conectarse a la instancia"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.cactus_dashboard.public_ip}"
}

output "application_urls" {
  description = "URLs de la aplicación (SEGURAS - Solo via Nginx)"
  value = {
    main_app    = "http://${aws_eip.cactus_dashboard.public_ip}"
    api_docs    = "http://${aws_eip.cactus_dashboard.public_ip}/docs"
    health      = "http://${aws_eip.cactus_dashboard.public_ip}/health"
    https_app   = var.domain_name != "" ? "https://${var.domain_name}" : "Configure SSL first"
    note        = "🔒 SEGURIDAD: Redis y PostgreSQL NO están expuestos públicamente"
  }
}

output "monitoring" {
  description = "Información de monitoreo"
  value = {
    cloudwatch_dashboard = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:"
    sns_topic_arn       = aws_sns_topic.alerts.arn
    budget_name         = aws_budgets_budget.cactus_dashboard.name
  }
}

output "next_steps" {
  description = "Próximos pasos después del despliegue"
  value = [
    "1. Conectarse via SSH: ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.cactus_dashboard.public_ip}",
    "2. Verificar el despliegue: sudo tail -f /var/log/cloud-init-output.log",
    "3. Configurar SSL si tienes dominio: cd /home/ubuntu/CactusDashboard && ./scripts/deploy-aws.sh ssl ${var.domain_name}",
    "4. Configurar alertas SNS con tu email",
    "5. Revisar presupuesto en AWS Budgets",
    "6. Configurar backups automáticos"
  ]
}