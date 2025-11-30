# AWS EC2 Quick Reference

Quick commands and checklists for AWS EC2 deployment.

## Pre-Deployment Checklist

- [ ] AWS account created
- [ ] Domain name purchased
- [ ] Google OAuth credentials configured
- [ ] SSH key pair generated
- [ ] Docker installed locally

## Essential Commands

### EC2 Connection
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Copy files to EC2
scp -i your-key.pem file.txt ubuntu@YOUR_EC2_IP:~/
```

### Docker Registry (Docker Hub)
```bash
# Login
docker login

# Build and push
docker build -t username/schedgen-frontend:latest ./frontend
docker push username/schedgen-frontend:latest

# Pull on EC2
docker pull username/schedgen-frontend:latest
```

### Application Management
```bash
# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart service
docker compose restart backend

# Check status
docker compose ps
```

### Monitoring
```bash
# Resource usage
docker stats
free -h
df -h

# Service logs
docker compose logs backend --tail=100 -f

# System logs
journalctl -u docker -f
```

### Maintenance
```bash
# Backup
./scripts/backup-all.sh

# Update application
git pull
docker compose pull
docker compose up -d

# Database migration
docker compose exec backend npm run migration:run

# Clean up
docker system prune -a
```

## DNS Configuration

### Route 53
```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# List hosted zones
aws route53 list-hosted-zones
```

### A Record (Domain Registrar)
```
Type: A
Name: @
Value: YOUR_EC2_IP
TTL: 3600
```

### CNAME Records
```
api.yourdomain.com     → yourdomain.com
minio.yourdomain.com   → yourdomain.com
grafana.yourdomain.com → yourdomain.com
```

## Security Group Rules

```
Type        Protocol    Port    Source
SSH         TCP         22      Your IP
HTTP        TCP         80      0.0.0.0/0
HTTPS       TCP         443     0.0.0.0/0
Custom      TCP         8081    Your IP (optional)
```

## Environment Variables Template

```bash
# Domain
DOMAIN=yourdomain.com
NODE_ENV=production

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Secrets (generate with: openssl rand -base64 32)
SESSION_SECRET=<generated>
POSTGRES_PASSWORD=<generated>
MINIO_SECRET_KEY=<generated>

# Database
POSTGRES_USER=schedgen
POSTGRES_DB=schedgen

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_BUCKET=pdf-uploads

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# Let's Encrypt
ACME_EMAIL=your-email@example.com
```

## Troubleshooting Quick Fixes

### DNS not resolving
```bash
dig yourdomain.com
# Wait up to 48 hours for propagation
```

### SSL certificate issues
```bash
docker compose logs traefik
docker compose restart traefik
```

### Out of memory
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Service won't start
```bash
docker compose logs <service-name>
docker compose restart <service-name>
```

### Database connection error
```bash
docker compose ps postgres
docker compose logs postgres
docker compose exec backend npm run migration:run
```

## Useful URLs

- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com
- Grafana: https://grafana.yourdomain.com
- Traefik: https://traefik.yourdomain.com
- MinIO: https://minio.yourdomain.com

## Cost Monitoring

### Free Tier Limits
- 750 hours/month t2.micro
- 30 GB EBS storage
- 15 GB data transfer out

### Check Usage
```bash
# AWS CLI
aws ce get-cost-and-usage \
  --time-period Start=2024-11-01,End=2024-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Backup & Recovery

### Manual Backup
```bash
./scripts/backup-all.sh
```

### Restore
```bash
./scripts/backup-all.sh --restore backups/db_schedgen_YYYYMMDD_HHMMSS.sql.gz
```

### Automated Backups
```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * /home/ubuntu/apps/up-schedule-generator/scripts/backup-all.sh
```

## Performance Optimization

### For t2.micro (1GB RAM)
```yaml
# docker-compose.prod.yml
pdf-worker:
  deploy:
    replicas: 1  # Reduce from 3
```

### Clean Up Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

## Migration to Elastic Infrastructure

### When to Migrate
- Consistently hitting CPU/memory limits
- Need auto-scaling
- Free tier expires
- Traffic increases significantly

### Migration Options
1. **Elastic Beanstalk** - Easiest, managed platform
2. **ECS/Fargate** - More control, container orchestration
3. **EKS** - Full Kubernetes, most complex

## Emergency Procedures

### Service Down
```bash
# Check status
docker compose ps

# Restart all
docker compose restart

# View logs
docker compose logs -f
```

### Disk Full
```bash
# Check usage
df -h

# Clean Docker
docker system prune -a --volumes

# Remove old backups
rm ~/apps/up-schedule-generator/backups/*.gz
```

### High CPU
```bash
# Check processes
docker stats

# Reduce workers
# Edit docker-compose.prod.yml
docker compose up -d
```

## Support Resources

- [Full Deployment Guide](AWS_EC2_DEPLOYMENT_GUIDE.md)
- [Deployment Runbook](DEPLOYMENT_RUNBOOK.md)
- [Troubleshooting Guide](../guides/troubleshooting.md)
- [AWS Documentation](https://docs.aws.amazon.com/ec2/)

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024-11-30
