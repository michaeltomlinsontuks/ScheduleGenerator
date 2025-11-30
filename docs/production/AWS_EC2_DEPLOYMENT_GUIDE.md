# AWS EC2 Deployment Guide

Complete guide for deploying the UP Schedule Generator to AWS EC2 with custom domain configuration, Docker registry setup, and migration path to elastic scaling.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Domain Configuration](#phase-1-domain-configuration)
4. [Phase 2: EC2 Instance Setup](#phase-2-ec2-instance-setup)
5. [Phase 3: Docker Registry Setup](#phase-3-docker-registry-setup)
6. [Phase 4: Application Deployment](#phase-4-application-deployment)
7. [Phase 5: Monitoring & Maintenance](#phase-5-monitoring--maintenance)
8. [Phase 6: Migration to Elastic Scaling](#phase-6-migration-to-elastic-scaling)
9. [Troubleshooting](#troubleshooting)

## Overview

This guide covers deploying the UP Schedule Generator on AWS EC2 Free Tier with a custom domain, then provides a migration path to AWS Elastic Beanstalk or ECS for production scaling.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ Route 53│  (DNS Management)
                    │  or     │
                    │ Domain  │
                    │Registrar│
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │   EC2   │  (t2.micro/t3.micro Free Tier)
                    │Instance │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │ Traefik │     │  Docker │     │  Docker │
   │  (TLS)  │     │ Compose │     │ Registry│
   └─────────┘     └─────────┘     └─────────┘
```

### Cost Estimate

**Free Tier (12 months):**
- EC2 t2.micro: 750 hours/month (FREE)
- 30 GB EBS storage (FREE)
- 15 GB data transfer out (FREE)

**After Free Tier:**
- EC2 t3.micro: ~$7.50/month
- 30 GB EBS: ~$3/month
- Data transfer: Variable

## Prerequisites

### Required Accounts & Access
- [ ] AWS account with Free Tier eligibility
- [ ] Domain name (from any registrar)
- [ ] SSH key pair for EC2 access
- [ ] Google OAuth credentials configured

### Local Requirements
- [ ] AWS CLI installed
- [ ] SSH client
- [ ] Docker installed locally (for building images)
- [ ] Git

### Knowledge Requirements
- Basic Linux command line
- Docker fundamentals
- DNS configuration basics

## Phase 1: Domain Configuration

### Step 1.1: Choose DNS Management Strategy

You have two options:

**Option A: Use AWS Route 53 (Recommended)**
- Cost: $0.50/month per hosted zone
- Benefits: Integrated with AWS, automatic health checks, easy SSL
- Best for: Production deployments

**Option B: Use Your Domain Registrar's DNS**
- Cost: Usually free with domain
- Benefits: No additional AWS costs
- Best for: Development/testing

### Step 1.2: Configure DNS with Route 53 (Option A)

1. **Create Hosted Zone:**
   ```bash
   aws route53 create-hosted-zone \
     --name yourdomain.com \
     --caller-reference $(date +%s)
   ```

2. **Note the Name Servers:**
   ```bash
   aws route53 get-hosted-zone --id YOUR_ZONE_ID
   ```
   
   You'll see output like:
   ```
   ns-1234.awsdns-12.org
   ns-5678.awsdns-34.com
   ns-9012.awsdns-56.net
   ns-3456.awsdns-78.co.uk
   ```

3. **Update Domain Registrar:**
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Find "DNS Management" or "Nameservers"
   - Change from default to "Custom Nameservers"
   - Enter the 4 AWS nameservers from step 2
   - Save changes (propagation takes 24-48 hours)

4. **Verify DNS Propagation:**
   ```bash
   # Check nameservers
   dig NS yourdomain.com
   
   # Or use online tool
   # https://www.whatsmydns.net/
   ```

### Step 1.3: Configure DNS with Domain Registrar (Option B)

1. **Log into your domain registrar**

2. **Create A Record:**
   - Type: `A`
   - Name: `@` (root domain)
   - Value: `YOUR_EC2_IP` (get this in Phase 2)
   - TTL: `3600`

3. **Create CNAME Records for subdomains:**
   ```
   api.yourdomain.com     → yourdomain.com
   minio.yourdomain.com   → yourdomain.com
   grafana.yourdomain.com → yourdomain.com
   traefik.yourdomain.com → yourdomain.com
   ```

4. **Verify DNS:**
   ```bash
   dig yourdomain.com
   dig api.yourdomain.com
   ```

## Phase 2: EC2 Instance Setup

### Step 2.1: Launch EC2 Instance

1. **Log into AWS Console** → EC2 Dashboard

2. **Launch Instance:**
   - Name: `schedgen-production`
   - AMI: **Ubuntu Server 22.04 LTS** (Free Tier eligible)
   - Instance type: **t2.micro** (Free Tier: 750 hours/month)
   - Key pair: Create new or select existing
   - Network settings:
     - Auto-assign public IP: **Enable**
     - Security group: Create new

3. **Configure Security Group:**
   
   Create rules for:
   ```
   Type            Protocol    Port Range    Source
   SSH             TCP         22            Your IP/0.0.0.0/0
   HTTP            TCP         80            0.0.0.0/0
   HTTPS           TCP         443           0.0.0.0/0
   Custom TCP      TCP         8081          Your IP (Traefik dashboard)
   ```

4. **Configure Storage:**
   - Size: **30 GB** (Free Tier limit)
   - Volume type: **gp3** (better performance than gp2)

5. **Launch instance** and note the **Public IPv4 address**

### Step 2.2: Connect to EC2 Instance

```bash
# Set permissions on key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2.3: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  unzip \
  ca-certificates \
  gnupg \
  lsb-release

# Set timezone
sudo timedatectl set-timezone UTC

# Configure firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8081/tcp  # Traefik dashboard (optional, can restrict to your IP)
sudo ufw --force enable
```

### Step 2.4: Install Docker

```bash
# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
exit
```

Reconnect to EC2:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

Verify Docker:
```bash
docker --version
docker compose version
```

### Step 2.5: Configure Swap (Important for t2.micro)

t2.micro has only 1GB RAM. Add swap to prevent OOM errors:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap
free -h
```

## Phase 3: Docker Registry Setup

You need a place to store your Docker images. Options:

### Option A: Docker Hub (Recommended for Simplicity)

**Pros:** Free for public repos, easy setup
**Cons:** Public images (or $5/month for private)

1. **Create Docker Hub account:** https://hub.docker.com

2. **Login on EC2:**
   ```bash
   docker login
   ```

3. **Tag and push images** (from your local machine):
   ```bash
   # Build and tag images
   docker build -t yourusername/schedgen-frontend:latest ./frontend
   docker build -t yourusername/schedgen-backend:latest ./backend
   docker build -t yourusername/schedgen-pdf-worker:latest ./pdf-worker
   
   # Push to Docker Hub
   docker push yourusername/schedgen-frontend:latest
   docker push yourusername/schedgen-backend:latest
   docker push yourusername/schedgen-pdf-worker:latest
   ```

4. **Update docker-compose.yml on EC2** to use your images:
   ```yaml
   services:
     frontend:
       image: yourusername/schedgen-frontend:latest
       # Remove 'build' section
   ```

### Option B: AWS ECR (Elastic Container Registry)

**Pros:** Private, integrated with AWS, free tier: 500MB/month
**Cons:** More complex setup

1. **Create ECR repositories:**
   ```bash
   aws ecr create-repository --repository-name schedgen-frontend
   aws ecr create-repository --repository-name schedgen-backend
   aws ecr create-repository --repository-name schedgen-pdf-worker
   ```

2. **Get login credentials:**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   ```

3. **Tag and push images:**
   ```bash
   # Tag
   docker tag schedgen-frontend:latest \
     YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen-frontend:latest
   
   # Push
   docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen-frontend:latest
   ```

4. **Configure EC2 to pull from ECR:**
   ```bash
   # Install AWS CLI on EC2
   sudo apt install -y awscli
   
   # Configure credentials (use IAM role or access keys)
   aws configure
   
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   ```

### Option C: Self-Hosted Registry on EC2

**Pros:** Full control, private
**Cons:** Uses EC2 resources, manual management

1. **Run Docker Registry:**
   ```bash
   docker run -d \
     -p 5000:5000 \
     --restart=always \
     --name registry \
     -v /opt/registry:/var/lib/registry \
     registry:2
   ```

2. **Configure Docker to use insecure registry:**
   ```bash
   sudo nano /etc/docker/daemon.json
   ```
   
   Add:
   ```json
   {
     "insecure-registries": ["localhost:5000"]
   }
   ```
   
   Restart Docker:
   ```bash
   sudo systemctl restart docker
   ```

3. **Tag and push images:**
   ```bash
   docker tag schedgen-frontend:latest localhost:5000/schedgen-frontend:latest
   docker push localhost:5000/schedgen-frontend:latest
   ```

## Phase 4: Application Deployment

### Step 4.1: Clone Repository on EC2

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/yourusername/up-schedule-generator.git
cd up-schedule-generator
```

### Step 4.2: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Critical environment variables:**

```bash
# Domain Configuration
DOMAIN=yourdomain.com
NODE_ENV=production

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Security - Generate strong secrets
SESSION_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
MINIO_SECRET_KEY=$(openssl rand -base64 32)

# Database
POSTGRES_USER=schedgen
POSTGRES_DB=schedgen

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_BUCKET=pdf-uploads

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# Let's Encrypt
ACME_EMAIL=your-email@example.com

# Traefik Dashboard (optional)
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD=$(openssl passwd -apr1 your-password)
```

### Step 4.3: Update Docker Compose for Registry

If using Docker Hub or ECR, update `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Replace `build` sections with `image`:

```yaml
services:
  frontend:
    image: yourusername/schedgen-frontend:latest
    # Remove build section
    
  backend:
    image: yourusername/schedgen-backend:latest
    # Remove build section
    
  pdf-worker:
    image: yourusername/schedgen-pdf-worker:latest
    # Remove build section
```

### Step 4.4: Deploy Application

```bash
# Pull images (if using registry)
docker compose pull

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 4.5: Initialize MinIO

```bash
# Wait for MinIO to be ready
sleep 10

# Create bucket
docker exec schedgen-minio mc alias set local \
  http://localhost:9000 minioadmin $(grep MINIO_SECRET_KEY .env | cut -d '=' -f2)

docker exec schedgen-minio mc mb local/pdf-uploads

# Verify
docker exec schedgen-minio mc ls local/
```

### Step 4.6: Run Database Migrations

```bash
docker compose exec backend npm run migration:run
```

### Step 4.7: Verify Deployment

```bash
# Check all services are healthy
docker compose ps

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# Check DNS resolution
dig yourdomain.com
dig api.yourdomain.com

# Test HTTPS (after DNS propagates)
curl https://yourdomain.com
curl https://api.yourdomain.com/health
```

### Step 4.8: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```
4. Save changes

## Phase 5: Monitoring & Maintenance

### Step 5.1: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-schedgen.sh
```

Add:
```bash
#!/bin/bash
cd /home/ubuntu/apps/up-schedule-generator
./scripts/backup-all.sh
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-schedgen.sh
```

Create cron job:
```bash
crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * /usr/local/bin/backup-schedgen.sh >> /var/log/schedgen-backup.log 2>&1
```

### Step 5.2: Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/schedgen
```

Add:
```
/home/ubuntu/apps/up-schedule-generator/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### Step 5.3: Monitor Resources

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker stats
docker stats

# View application logs
docker compose logs -f --tail=100
```

### Step 5.4: Set Up CloudWatch (Optional)

Install CloudWatch agent for detailed monitoring:

```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

Configure metrics collection for CPU, memory, disk.

### Step 5.5: Access Monitoring Dashboards

- **Grafana:** https://grafana.yourdomain.com
  - Default: admin/admin (change immediately)
  - View system metrics, job processing, resource utilization

- **Traefik Dashboard:** https://traefik.yourdomain.com
  - View routing, middleware, TLS certificates

- **MinIO Console:** https://minio.yourdomain.com
  - Manage object storage, view uploaded files

## Phase 6: Migration to Elastic Scaling

When you outgrow the Free Tier or need better performance, migrate to elastic infrastructure.

### Option A: AWS Elastic Beanstalk

**Best for:** Simplified management, automatic scaling

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Elastic Beanstalk:**
   ```bash
   cd ~/apps/up-schedule-generator
   eb init -p docker schedgen-production
   ```

3. **Create environment:**
   ```bash
   eb create schedgen-prod-env \
     --instance-type t3.small \
     --database.engine postgres \
     --database.size 20 \
     --envvars $(cat .env | tr '\n' ',')
   ```

4. **Deploy:**
   ```bash
   eb deploy
   ```

5. **Configure auto-scaling:**
   ```bash
   eb scale 2  # Minimum 2 instances
   ```

### Option B: AWS ECS (Elastic Container Service)

**Best for:** Full control, microservices architecture

1. **Create ECS Cluster:**
   ```bash
   aws ecs create-cluster --cluster-name schedgen-cluster
   ```

2. **Create Task Definitions** for each service (frontend, backend, pdf-worker)

3. **Set up Application Load Balancer**

4. **Create ECS Services** with auto-scaling policies

5. **Migrate data:**
   - Use RDS for PostgreSQL
   - Use ElastiCache for Redis
   - Use S3 for object storage (replace MinIO)

### Option C: AWS Fargate

**Best for:** Serverless containers, no server management

Similar to ECS but without managing EC2 instances.

### Migration Checklist

- [ ] Export database: `./scripts/backup-all.sh`
- [ ] Push latest images to ECR
- [ ] Create RDS PostgreSQL instance
- [ ] Create ElastiCache Redis cluster
- [ ] Create S3 bucket for file storage
- [ ] Update environment variables
- [ ] Deploy to new infrastructure
- [ ] Import database backup
- [ ] Update DNS to point to new load balancer
- [ ] Test thoroughly
- [ ] Decommission EC2 instance

## Troubleshooting

### DNS Not Resolving

**Problem:** Domain doesn't point to EC2 instance

**Solutions:**
```bash
# Check nameservers
dig NS yourdomain.com

# Check A record
dig A yourdomain.com

# Verify EC2 IP
curl ifconfig.me

# Wait for propagation (up to 48 hours)
```

### SSL Certificate Issues

**Problem:** Let's Encrypt certificate not generating

**Solutions:**
```bash
# Check Traefik logs
docker compose logs traefik

# Verify DNS is resolving to your server
dig yourdomain.com

# Ensure ports 80 and 443 are open
sudo ufw status

# Check ACME email is set
grep ACME_EMAIL .env

# Manually trigger certificate
docker compose restart traefik
```

### Out of Memory Errors

**Problem:** Services crashing due to low memory

**Solutions:**
```bash
# Check memory usage
free -h

# Verify swap is active
swapon --show

# Reduce service replicas
# Edit docker-compose.prod.yml, reduce pdf-worker replicas to 1

# Restart services
docker compose restart
```

### Docker Build Fails on EC2

**Problem:** Not enough resources to build images

**Solution:** Build locally and push to registry instead:
```bash
# On local machine
docker build -t yourusername/schedgen-frontend:latest ./frontend
docker push yourusername/schedgen-frontend:latest

# On EC2
docker pull yourusername/schedgen-frontend:latest
```

### Database Connection Errors

**Problem:** Backend can't connect to PostgreSQL

**Solutions:**
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify environment variables
docker compose exec backend env | grep POSTGRES

# Test connection
docker compose exec backend npm run migration:run
```

### Google OAuth Redirect Mismatch

**Problem:** OAuth callback fails

**Solutions:**
1. Verify redirect URI in Google Console matches exactly:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```
2. Check GOOGLE_CALLBACK_URL in .env
3. Ensure DNS is resolving correctly
4. Clear browser cookies and try again

### High CPU Usage

**Problem:** EC2 instance CPU at 100%

**Solutions:**
```bash
# Check which container is using CPU
docker stats

# Reduce pdf-worker replicas
# Edit docker-compose.prod.yml

# Consider upgrading to t3.small
# Or migrate to elastic infrastructure
```

## Security Best Practices

### 1. Restrict SSH Access

```bash
# Edit security group to allow SSH only from your IP
# AWS Console → EC2 → Security Groups → Edit inbound rules
```

### 2. Set Up Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Enable Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Use IAM Roles Instead of Access Keys

Create an IAM role with necessary permissions and attach to EC2 instance.

### 5. Regular Backups

Ensure automated backups are running:
```bash
crontab -l
ls -lh ~/apps/up-schedule-generator/backups/
```

## Cost Optimization

### Free Tier Limits (12 months)
- 750 hours/month t2.micro (enough for 1 instance 24/7)
- 30 GB EBS storage
- 15 GB data transfer out

### After Free Tier
- Upgrade to t3.micro for better performance (~$7.50/month)
- Use Reserved Instances for 30-40% savings
- Set up billing alerts in AWS Console
- Monitor data transfer costs

### Billing Alerts

1. Go to AWS Billing Dashboard
2. Create budget alert for $10/month
3. Get email notifications before exceeding

## Next Steps

1. **Set up monitoring alerts** - Configure Grafana alerts for critical metrics
2. **Implement CI/CD** - Automate deployments with GitHub Actions
3. **Load testing** - Use the included k6 tests to verify performance
4. **Backup testing** - Regularly test backup restoration
5. **Documentation** - Document your specific configuration and customizations

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Project Documentation Index](../INDEX.md)

## Support

For issues specific to this application:
- Check [Troubleshooting Guide](../guides/troubleshooting.md)
- Review [Deployment Runbook](DEPLOYMENT_RUNBOOK.md)
- Check application logs: `docker compose logs`

For AWS-specific issues:
- AWS Support (if you have a support plan)
- AWS Forums
- Stack Overflow

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-30  
**Maintained By:** DevOps Team
