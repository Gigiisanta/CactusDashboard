# 🌵 Cactus Dashboard - AWS Infrastructure

This directory contains the Terraform configuration for deploying Cactus Dashboard to AWS with strict cost controls and Free Tier optimization.

## 🎯 **Deployment Goals**

- ✅ **12-month operation** with ≤$80 USD promotional credits
- ✅ **t4g.small** (Free trial until Dec 31, 2025) → **t4g.micro** (Jan 1, 2026)
- ✅ **AWS Free Tier** compliance for all resources
- ✅ **Automatic cost control** with budget alerts and instance stopping
- ✅ **Zero-downtime auto-downgrade** on January 1, 2026

## 🏗️ **Infrastructure Components**

### **Compute**
- **EC2 Instance**: t4g.small (ARM64) with standard CPU credits
- **Auto-downgrade**: EventBridge + SSM Automation to t4g.micro
- **Region**: us-east-1 (cheapest for t4g instances)

### **Storage**
- **EBS Volume**: 30GB gp3 with encryption
- **Backups**: Weekly PostgreSQL dumps with 5-week rotation
- **Snapshot Management**: ≤1GB total backup size

### **Network**
- **Security Groups**: Minimal required ports (22, 80, 443, 3000, 8000)
- **Elastic IP**: Static public IP address
- **IPv6 Disabled**: Uses only IPv4 to stay within 100GB/month free outbound

### **Monitoring & Alerts**
- **AWS Budgets**: $75/month limit with 95% threshold alerts
- **CloudWatch**: Custom metrics for dashboard latency
- **SNS**: Email and webhook notifications
- **Lambda**: Automatic instance stopping at budget threshold

## 🚀 **Quick Deployment**

### **Prerequisites**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs)"
sudo apt-get update && sudo apt-get install terraform

# Configure AWS credentials
aws configure
```

### **Deployment Steps**
```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Initialize Terraform
terraform init

# 4. Plan deployment
terraform plan -out=tfplan

# 5. Apply deployment
terraform apply tfplan
```

### **Configuration Variables**
```hcl
# Required variables in terraform.tfvars
key_pair_name = "your-aws-key-pair-name"
alert_email = "your-email@example.com"
allowed_ssh_cidr = ["your-ip-address/32"]

# Optional variables
domain_name = "your-domain.com"  # For custom domain
```

## 💰 **Cost Control Features**

### **Budget Management**
- **Monthly Limit**: $75 USD
- **Alert Threshold**: 95% ($71.25)
- **Action**: Automatic instance stop
- **Notifications**: Email + SNS

### **Resource Optimization**
- **Instance Credits**: Standard (NO unlimited)
- **Storage**: 30GB gp3 (Free Tier limit)
- **Network**: IPv4 only (100GB/month free)
- **Backups**: Compressed with lifecycle management

### **Auto-Downgrade Process**
1. **EventBridge Rule**: Triggers on Jan 1, 2026 at 00:15 UTC
2. **SSM Automation**: Stops instance → Changes type → Starts instance
3. **Zero Data Loss**: EBS volume preserved during transition
4. **Service Recovery**: Docker containers restart automatically

## 📊 **Monitoring & Alerts**

### **CloudWatch Metrics**
- **CPU Utilization**: Standard EC2 metrics
- **Dashboard Latency**: Custom metric for response time
- **Memory Usage**: System-level monitoring
- **Disk Usage**: EBS volume monitoring

### **SNS Topics**
- **Budget Alerts**: Notifications at 95% threshold
- **System Alerts**: Performance and health notifications
- **Auto-downgrade**: Status updates for instance changes

### **Lambda Functions**
- **Budget Stop**: Automatically stops instance at threshold
- **Health Checks**: Monitors application availability
- **Backup Management**: Manages PostgreSQL backups

## 🔧 **Maintenance & Operations**

### **Backup Management**
```bash
# Manual backup
ssh ubuntu@<instance-ip>
sudo /opt/cactus/backup-db.sh

# Check backup status
ls -la /ebs/backups/
du -sh /ebs/backups/
```

### **Health Monitoring**
```bash
# Check application health
ssh ubuntu@<instance-ip>
/opt/cactus/health-check.sh

# View system information
./system-info.sh

# Check logs
docker compose logs -f
```

### **Auto-Downgrade Status**
```bash
# Check downgrade status
ssh ubuntu@<instance-ip>
sudo /opt/cactus/auto-downgrade.sh status

# Manual downgrade (if needed)
sudo /opt/cactus/auto-downgrade.sh downgrade
```

## 🛡️ **Security Features**

### **Network Security**
- **SSH Access**: Restricted to specified IP ranges
- **Application Ports**: Only required services exposed
- **Database Access**: Internal only (no public access)
- **Redis Access**: Internal only (no public access)

### **Data Protection**
- **EBS Encryption**: All volumes encrypted at rest
- **Backup Encryption**: Compressed and encrypted backups
- **Environment Variables**: Sensitive data in environment files
- **IAM Roles**: Least-privilege access policies

### **Monitoring & Logging**
- **CloudTrail**: API call logging
- **CloudWatch Logs**: Application and system logs
- **Security Groups**: Traffic monitoring
- **IAM Access**: User and role activity tracking

## 📈 **Performance Optimization**

### **Instance Configuration**
- **t4g.small**: 2 vCPUs, 2GB RAM (Free trial)
- **t4g.micro**: 2 vCPUs, 1GB RAM (Post-trial)
- **Standard Credits**: Controlled CPU burst usage
- **Swap File**: 1GB for memory management

### **Application Optimization**
- **Docker Compose**: Efficient container orchestration
- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Automatic service recovery
- **Log Rotation**: Prevents disk space issues

### **Database Optimization**
- **PostgreSQL Tuning**: Optimized for small instances
- **Connection Pooling**: Efficient database connections
- **Index Optimization**: Fast query performance
- **Backup Compression**: Reduced storage requirements

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Instance Won't Start**
```bash
# Check instance status
aws ec2 describe-instances --instance-ids <instance-id>

# Check system logs
ssh ubuntu@<instance-ip>
sudo tail -f /var/log/cloud-init-output.log
```

#### **Application Not Responding**
```bash
# Check Docker containers
ssh ubuntu@<instance-ip>
docker compose ps
docker compose logs

# Check application health
/opt/cactus/health-check.sh
```

#### **Budget Alerts**
```bash
# Check budget status
aws budgets describe-budgets --account-id <account-id>

# Check recent costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### **Recovery Procedures**

#### **Instance Stopped by Budget**
1. Review costs in AWS Cost Explorer
2. Identify cost drivers
3. Optimize resource usage
4. Start instance manually if needed
5. Adjust budget if necessary

#### **Auto-Downgrade Issues**
1. Check EventBridge rule status
2. Verify SSM Automation document
3. Review CloudWatch logs
4. Execute manual downgrade if needed

## 📋 **Deployment Checklist**

- [ ] **AWS CLI** installed and configured
- [ ] **Terraform** installed (version >= 1.0)
- [ ] **AWS Key Pair** created for SSH access
- [ ] **terraform.tfvars** configured with correct values
- [ ] **Budget limit** set to $75/month
- [ ] **Alert email** configured for notifications
- [ ] **SSH access** restricted to your IP address
- [ ] **Domain name** configured (optional)
- [ ] **Backup schedule** verified (weekly)
- [ ] **Auto-downgrade** scheduled for Jan 1, 2026
- [ ] **Monitoring** enabled and configured
- [ ] **Security groups** properly configured
- [ ] **EBS volume** encrypted and sized correctly

## 📞 **Support**

For deployment issues:
1. Check CloudWatch logs for errors
2. Review Terraform plan output
3. Verify AWS credentials and permissions
4. Check instance system logs
5. Review security group configurations

## 📄 **Files Description**

- **main.tf**: Main Terraform configuration
- **terraform.tfvars**: Variable definitions (create from example)
- **user-data.sh**: Instance initialization script
- **budget-policy.json**: AWS Budget configuration
- **iam-policy.json**: IAM permissions for cost control
- **lambda/budget_stop_ec2.zip**: Lambda function for budget control