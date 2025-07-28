# 🌵 CactusDashboard - Monitoring Runbook

## 📋 **Overview**

This runbook provides comprehensive monitoring and operational procedures for CactusDashboard deployed on AWS with strict budget controls ($75/month limit).

## 🚨 **Critical Alerts & Thresholds**

### Budget Alerts
- **Threshold**: 95% of $75/month budget ($71.25)
- **Action**: Automatic EC2 instance stop via Lambda
- **Notification**: Email to giolivosantarelli@gmail.com
- **Recovery**: Manual restart required after budget review

### Performance Alerts
- **CPU Utilization**: >80% for 2 consecutive 5-minute periods
- **Dashboard Latency**: >2000ms response time
- **Memory Usage**: Monitored via CloudWatch Agent

### Auto-Downgrade Schedule
- **Date**: January 1, 2026 at 00:15 UTC
- **Action**: Automatic instance type change from t4g.small to t4g.micro
- **Process**: EventBridge → SSM Automation → Instance modification

## 🔍 **Daily Monitoring Checklist**

### 1. Cost Monitoring
```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Check budget status
aws budgets describe-budget --account-id 644439356858 --budget-name cactus-dashboard-monthly-budget
```

### 2. Instance Health
```bash
# SSH to instance
ssh -i cactus-key.pem ubuntu@34.195.179.168

# Check system resources
./system-info.sh

# Check Docker containers
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### 3. Application Health
```bash
# Test frontend
curl -f http://34.195.179.168:3000

# Test backend health
curl -f http://34.195.179.168:8000/health

# Check API documentation
curl -f http://34.195.179.168:8000/docs
```

## 📊 **CloudWatch Metrics**

### Key Metrics to Monitor
- **CPUUtilization**: Should stay <80%
- **DashboardLatency**: Should stay <2000ms
- **Memory Usage**: Monitor for memory leaks
- **Disk Usage**: Should stay <80% of 30GB

### Custom Namespace
- **Namespace**: CactusDashboard/EC2
- **Metrics**: CPU, Memory, Disk, Network

## 🔧 **Troubleshooting Procedures**

### Instance Not Responding
1. **Check Instance State**
   ```bash
   aws ec2 describe-instances --instance-ids i-0913b3f472d7001ef
   ```

2. **Check CloudWatch Logs**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix cactus-dashboard
   ```

3. **Restart Instance** (if stopped due to budget)
   ```bash
   aws ec2 start-instances --instance-ids i-0913b3f472d7001ef
   ```

### Application Issues
1. **SSH to Instance**
   ```bash
   ssh -i cactus-key.pem ubuntu@34.195.179.168
   ```

2. **Check Docker Status**
   ```bash
   cd /home/ubuntu/CactusDashboard
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Restart Services**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

4. **Check Application Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Budget Exceeded
1. **Check Cost Explorer**
   - Identify cost drivers
   - Review usage patterns

2. **Stop Instance** (if not already stopped)
   ```bash
   aws ec2 stop-instances --instance-ids i-0913b3f472d7001ef
   ```

3. **Review and Optimize**
   - Check for unnecessary resources
   - Optimize application performance
   - Consider cost-saving measures

## 🔄 **Maintenance Procedures**

### Weekly Tasks
- [ ] Review CloudWatch metrics
- [ ] Check budget forecast
- [ ] Review application logs
- [ ] Verify backup integrity
- [ ] Update security patches

### Monthly Tasks
- [ ] Review cost optimization opportunities
- [ ] Check auto-downgrade schedule
- [ ] Review security group rules
- [ ] Update monitoring thresholds if needed

### Quarterly Tasks
- [ ] Review and update runbook
- [ ] Test disaster recovery procedures
- [ ] Review access permissions
- [ ] Update documentation

## 🚨 **Emergency Procedures**

### Budget Emergency (95% threshold reached)
1. **Immediate Actions**
   - Instance will be automatically stopped
   - Email alert sent to giolivosantarelli@gmail.com

2. **Recovery Steps**
   - Review costs in Cost Explorer
   - Identify and address cost drivers
   - Restart instance if necessary
   - Implement cost optimizations

### Instance Failure
1. **Check Instance Status**
   ```bash
   aws ec2 describe-instances --instance-ids i-0913b3f472d7001ef
   ```

2. **Check System Logs**
   ```bash
   ssh -i cactus-key.pem ubuntu@34.195.179.168
   sudo tail -f /var/log/syslog
   ```

3. **Restart if Necessary**
   ```bash
   aws ec2 reboot-instances --instance-ids i-0913b3f472d7001ef
   ```

### Application Failure
1. **Check Docker Containers**
   ```bash
   ssh -i cactus-key.pem ubuntu@34.195.179.168
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Restart Application**
   ```bash
   cd /home/ubuntu/CactusDashboard
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Check Application Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## 📞 **Contact Information**

### Primary Contact
- **Email**: giolivosantarelli@gmail.com
- **AWS Account**: 644439356858
- **Region**: us-east-1

### AWS Support
- **Instance ID**: i-0913b3f472d7001ef
- **Security Group**: sg-06530984e47b85a68
- **Budget**: cactus-dashboard-monthly-budget

## 📈 **Performance Baselines**

### Expected Performance
- **CPU Usage**: <50% average, <80% peak
- **Memory Usage**: <70% of available RAM
- **Disk Usage**: <60% of 30GB EBS
- **Response Time**: <1000ms for API calls
- **Uptime**: >99.5%

### Cost Baselines
- **Monthly Budget**: $75 USD
- **Expected Monthly Cost**: $15-25 USD
- **Alert Threshold**: $71.25 (95%)
- **Emergency Threshold**: $75 (100%)

## 🔐 **Security Monitoring**

### Security Checks
- [ ] SSH access logs
- [ ] Failed login attempts
- [ ] Unusual network traffic
- [ ] Docker container security
- [ ] EBS volume encryption

### Access Control
- **SSH Access**: Restricted to 186.127.184.104/32
- **Application Ports**: 3000 (frontend), 8000 (backend)
- **Database**: Internal only (5432, 6379)

---

**Last Updated**: $(date)
**Version**: 1.0
**Next Review**: Monthly 