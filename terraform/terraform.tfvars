# Variables de configuración para Terraform
# Copia este archivo a terraform.tfvars y personaliza los valores

# Configuración básica del proyecto
project_name = "cactus-dashboard"
environment  = "prod"
aws_region   = "us-east-1"  # Región más económica para t4g

# Configuración de la instancia EC2
instance_type_current = "t4g.small"  # Free trial hasta 31-dic-2025
instance_type_next    = "t4g.micro"  # Auto-downgrade después de 31-dic-2025

# Configuración de seguridad
# IMPORTANTE: Cambiar por tu key pair existente en AWS
key_pair_name = "cactus-key"

# IMPORTANTE: Cambiar por tu IP específica para mayor seguridad
# Puedes obtener tu IP con: curl ifconfig.me
allowed_ssh_cidr = ["186.127.184.104/32"]  # IP específica para mayor seguridad

# Configuración de dominio (opcional)
# Si tienes un dominio, descomenta y configura:
# domain_name = "mi-dominio.com"
domain_name = ""

# Configuración de alertas
# Cambiar por tu email real para recibir alertas
alert_email = "giolivosantarelli@gmail.com"

# Configuración de presupuesto
# Límite mensual en USD para alertas de costos (USD 75 + USD 5 forecasted)
monthly_budget_limit = "75"
budget_threshold_percentage = 95

# Configuración de almacenamiento
# Tamaño del volumen EBS en GB (Free Tier: hasta 30GB)
ebs_volume_size = 30