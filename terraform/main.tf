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

variable "instance_type_current" {
  description = "Tipo de instancia EC2 actual (t4g.small hasta 31-dic-2025)"
  type        = string
  default     = "t4g.small"
}

variable "instance_type_next" {
  description = "Tipo de instancia EC2 después de 31-dic-2025 (t4g.micro)"
  type        = string
  default     = "t4g.micro"
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

variable "alert_email" {
  description = "Email para alertas"
  type        = string
  default     = "admin@example.com"
}

variable "monthly_budget_limit" {
  description = "Límite mensual del presupuesto en USD"
  type        = string
  default     = "75"
}

variable "budget_threshold_percentage" {
  description = "Porcentaje del presupuesto para activar alertas"
  type        = number
  default     = 95
}

variable "ebs_volume_size" {
  description = "Tamaño del volumen EBS en GB"
  type        = number
  default     = 30
}

# Configuración del proveedor AWS
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Cactus-Budget"
    }
  }
}

# Obtener la AMI más reciente de Ubuntu 24.04 (Noble) - Free Tier compatible
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  
  filter {
    name   = "architecture"
    values = ["arm64"]  # t4g instances require ARM64
  }
}

# Obtener VPC por defecto
data "aws_vpc" "default" {
  default = true
}

# Obtener subnets por defecto
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group para Cactus Dashboard
resource "aws_security_group" "cactus_dashboard" {
  name_prefix = "${var.project_name}-sg-"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API
  ingress {
    description = "Backend API"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend
  ingress {
    description = "Frontend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PostgreSQL (solo local)
  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  # Redis (solo local)
  ingress {
    description = "Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  # Egress - Solo IPv4, sin IPv6
  egress {
    description = "All outbound IPv4"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-security-group"
  }
}

# Elastic IP
resource "aws_eip" "cactus_dashboard" {
  domain = "vpc"
  
  tags = {
    Name = "${var.project_name}-eip"
  }
}

# Asociar EIP a la instancia
resource "aws_eip_association" "cactus_dashboard" {
  instance_id   = aws_instance.cactus_dashboard.id
  allocation_id = aws_eip.cactus_dashboard.id
}

# User data script
locals {
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))
}

# Instancia EC2
resource "aws_instance" "cactus_dashboard" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type_current
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.cactus_dashboard.id]
  subnet_id             = data.aws_subnets.default.ids[0]
  
  # Configuración de almacenamiento (30GB gp3)
  root_block_device {
    volume_type = "gp3"
    volume_size = var.ebs_volume_size
    encrypted   = true
    iops        = 3000
    throughput  = 125
    
    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  # Configuración de créditos estándar (NO unlimited)
  credit_specification {
    cpu_credits = "standard"
  }

  user_data = local.user_data

  # Configuración de metadatos
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  # Deshabilitar IPv6
  ipv6_address_count = 0

  tags = {
    Name = "${var.project_name}-instance"
    AutoDowngradeDate = "2026-01-01"
    NextInstanceType  = var.instance_type_next
  }
}

# IAM Role para detener instancia cuando se alcance el presupuesto
resource "aws_iam_role" "budget_stop_ec2_role" {
  name = "${var.project_name}-budget-stop-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-budget-stop-ec2-role"
  }
}

# IAM Policy para detener instancias EC2
resource "aws_iam_role_policy" "budget_stop_ec2_policy" {
  name = "${var.project_name}-budget-stop-ec2-policy"
  role = aws_iam_role.budget_stop_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:StopInstances",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = var.project_name
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function para detener instancia cuando se alcance el presupuesto
resource "aws_lambda_function" "budget_stop_ec2" {
  filename         = "${path.module}/lambda/budget_stop_ec2.zip"
  function_name    = "${var.project_name}-budget-stop-ec2"
  role            = aws_iam_role.budget_stop_ec2_role.arn
  handler         = "index.handler"
  runtime         = "python3.11"
  timeout         = 30

  environment {
    variables = {
      INSTANCE_ID = aws_instance.cactus_dashboard.id
      PROJECT_NAME = var.project_name
    }
  }

  tags = {
    Name = "${var.project_name}-budget-stop-ec2-lambda"
  }
}

# SNS Topic para alertas
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
  
  tags = {
    Name = "${var.project_name}-alerts"
  }
}

# SNS Topic para alertas de presupuesto
resource "aws_sns_topic" "budget_alerts" {
  name = "${var.project_name}-budget-alerts"
  
  tags = {
    Name = "${var.project_name}-budget-alerts"
  }
}

# Suscripción de email para alertas de presupuesto
resource "aws_sns_topic_subscription" "budget_email" {
  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Budget para controlar costos
resource "aws_budgets_budget" "cactus_dashboard" {
  name         = "${var.project_name}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = var.budget_threshold_percentage
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = var.budget_threshold_percentage
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }

  tags = {
    Name = "${var.project_name}-budget"
  }

  # Ignore notification changes to prevent duplicate errors
  lifecycle {
    ignore_changes = [notification]
  }
}

# EventBridge rule para auto-downgrade el 1 de enero de 2026
resource "aws_cloudwatch_event_rule" "auto_downgrade" {
  name                = "${var.project_name}-auto-downgrade"
  description         = "Auto-downgrade instance to t4g.micro on 2026-01-01"
  schedule_expression = "cron(15 0 1 1 ? 2026)"  # 00:15 UTC on January 1, 2026

  tags = {
    Name = "${var.project_name}-auto-downgrade-rule"
  }
}

# SSM Automation document para auto-downgrade
resource "aws_ssm_document" "auto_downgrade" {
  name          = "${var.project_name}-auto-downgrade"
  document_type = "Automation"

  content = jsonencode({
    schemaVersion = "0.3"
    description   = "Auto-downgrade EC2 instance from t4g.small to t4g.micro"
    parameters = {
      InstanceId = {
        type = "String"
        description = "Instance ID to downgrade"
      }
      NewInstanceType = {
        type = "String"
        description = "New instance type"
        default = var.instance_type_next
      }
    }
    mainSteps = [
      {
        name = "StopInstance"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "ec2"
          Api = "StopInstances"
          InstanceIds = ["{{ InstanceId }}"]
        }
        nextStep = "WaitForStopped"
      },
      {
        name = "WaitForStopped"
        action = "aws:waitForAwsResourceProperty"
        inputs = {
          Service = "ec2"
          Api = "DescribeInstances"
          InstanceIds = ["{{ InstanceId }}"]
          PropertySelector = "$.Reservations[0].Instances[0].State.Name"
          DesiredValues = ["stopped"]
        }
        nextStep = "ModifyInstanceType"
      },
      {
        name = "ModifyInstanceType"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "ec2"
          Api = "ModifyInstanceAttribute"
          InstanceId = "{{ InstanceId }}"
          InstanceType = {
            Value = "{{ NewInstanceType }}"
          }
        }
        nextStep = "StartInstance"
      },
      {
        name = "StartInstance"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "ec2"
          Api = "StartInstances"
          InstanceIds = ["{{ InstanceId }}"]
        }
        nextStep = "WaitForRunning"
      },
      {
        name = "WaitForRunning"
        action = "aws:waitForAwsResourceProperty"
        inputs = {
          Service = "ec2"
          Api = "DescribeInstances"
          InstanceIds = ["{{ InstanceId }}"]
          PropertySelector = "$.Reservations[0].Instances[0].State.Name"
          DesiredValues = ["running"]
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-auto-downgrade-document"
  }
}

# EventBridge target para ejecutar SSM Automation
resource "aws_cloudwatch_event_target" "auto_downgrade" {
  rule      = aws_cloudwatch_event_rule.auto_downgrade.name
  target_id = "AutoDowngradeTarget"
  arn       = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:automation-definition/${aws_ssm_document.auto_downgrade.name}"

  role_arn = aws_iam_role.eventbridge_ssm_role.arn

  input = jsonencode({
    InstanceId = aws_instance.cactus_dashboard.id
    NewInstanceType = var.instance_type_next
  })
}

# IAM Role para EventBridge ejecutar SSM Automation
resource "aws_iam_role" "eventbridge_ssm_role" {
  name = "${var.project_name}-eventbridge-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-eventbridge-ssm-role"
  }
}

# IAM Policy para EventBridge ejecutar SSM Automation
resource "aws_iam_role_policy" "eventbridge_ssm_policy" {
  name = "${var.project_name}-eventbridge-ssm-policy"
  role = aws_iam_role.eventbridge_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:StartAutomationExecution"
        ]
        Resource = aws_ssm_document.auto_downgrade.arn
      }
    ]
  })
}

# Obtener account ID actual
data "aws_caller_identity" "current" {}

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

# CloudWatch custom metric para latencia del dashboard
resource "aws_cloudwatch_metric_alarm" "dashboard_latency" {
  alarm_name          = "${var.project_name}-dashboard-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DashboardLatency"
  namespace           = "CactusDashboard"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"  # 2 segundos
  alarm_description   = "This metric monitors dashboard response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.cactus_dashboard.id
  }

  tags = {
    Name = "${var.project_name}-latency-alarm"
  }
}

# Route53 Zone (solo si se especifica un dominio)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "${var.project_name}-zone"
  }
}

# Route53 Record A
resource "aws_route53_record" "main" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = "300"
  records = [aws_eip.cactus_dashboard.public_ip]
}

# Route53 Record CNAME para www
resource "aws_route53_record" "www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [var.domain_name]
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
  value       = aws_eip.cactus_dashboard.public_dns
}

output "ssh_command" {
  description = "Comando SSH para conectarse a la instancia"
  value       = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_eip.cactus_dashboard.public_ip}"
}

output "application_urls" {
  description = "URLs de la aplicación"
  value = {
    frontend = "http://${aws_eip.cactus_dashboard.public_ip}:3000"
    backend  = "http://${aws_eip.cactus_dashboard.public_ip}:8000"
    domain   = var.domain_name != "" ? "https://${var.domain_name}" : "N/A"
  }
}

output "monitoring" {
  description = "Información de monitoreo"
  value = {
    budget_name = aws_budgets_budget.cactus_dashboard.name
    budget_limit = "${var.monthly_budget_limit} USD"
    sns_topic = aws_sns_topic.alerts.arn
    auto_downgrade_date = "2026-01-01 00:15 UTC"
    next_instance_type = var.instance_type_next
  }
}

output "next_steps" {
  description = "Próximos pasos después del despliegue"
  value = [
    "1. Verificar que la instancia esté ejecutándose: ${aws_eip.cactus_dashboard.public_ip}",
    "2. Conectarse via SSH: ssh -i ${var.key_pair_name}.pem ubuntu@${aws_eip.cactus_dashboard.public_ip}",
    "3. Verificar logs de Docker: docker compose logs -f",
    "4. Acceder al dashboard: http://${aws_eip.cactus_dashboard.public_ip}:3000",
    "5. Configurar alertas de presupuesto en AWS Budgets",
    "6. Verificar auto-downgrade programado para 2026-01-01"
  ]
}