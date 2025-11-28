# UP Schedule Generator V3 - Production Deployment Guide

## Quick Start (TL;DR)

For experienced users who want to deploy quickly:

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/up-schedule-generator.git
cd up-schedule-generator
cp .env.example .env
nano .env  # Configure all required variables

# 2. Build and deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Initialize MinIO and run migrations
docker exec -it schedgen-minio sh -c "mc alias set local http://localhost:9000 \$MINIO_ACCESS_KEY \$MINIO_SECRET_KEY && mc mb local/\$MINIO_BUCKET --ignore-existing"
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npm run migration:run

# 4. Verify
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl https://yourdomain.com
```

**Prerequisites**: Docker, Docker Compose, configured domain with DNS, Google OAuth credentials.

For detailed instructions, continue reading below.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Production Environment Setup](#production-environment-setup)
5. [Initial Deployment](#initial-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Maintenance & Operations](#maintenance--operations)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)

---

## Architecture Overview

### Services Stack
```
┌─────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)              │
│              TLS Termination + Load Balancing           │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │  PDF Worker  │
│  (Next.js)   │    │  (NestJS)    │    │  (FastAPI)   │
│   Port 3000  │    │  Port 3001   │    │  Port 5001   │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐     ┌──────────┐
   │PostgreSQL│      │  Redis   │     │  MinIO   │
   │  Port    │      │  Port    │     │  Port    │
   │  5432    │      │  6379    │     │  9000    │
   └──────────┘      └──────────┘     └──────────┘
```

### Technology Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend | Next.js | 16.0.5 | React SSR/SSG framework |
| Backend | NestJS | 11.0.1 | Node.js API framework |
| PDF Worker | FastAPI | 0.109.2 | Python PDF parsing service |
| Database | PostgreSQL | 16 | Relational data storage |
| Cache/Queue | Redis | 7 | Job queue & caching |
| Storage | MinIO | Latest | S3-compatible object storage |
| Proxy | Traefik | v3.0 | Reverse proxy & TLS |

### Network Architecture
- **External Access**: Ports 80 (HTTP) and 443 (HTTPS) only
- **Internal Network**: All services communicate via Docker network `schedgen`
- **TLS**: Automatic Let's Encrypt certificates via Traefik
- **Security**: All services run as non-root users

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 22.04 LTS or later (recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum, 50GB+ recommended
- **Network**: Static IP or domain with DNS configured

### Software Requirements
```bash
# Docker Engine 24.0+
docker --version

# Docker Compose v2.20+
docker compose version

# Git
git --version
```

### Domain & DNS Setup
1. Register a domain (e.g., `schedgen.example.com`)
2. Configure DNS A records:
   ```
   @               A    YOUR_SERVER_IP
   api             A    YOUR_SERVER_IP
   minio           A    YOUR_SERVER_IP
   traefik         A    YOUR_SERVER_IP
   ```
3. Wait for DNS propagation (can take up to 48 hours)

### Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Google+ API (for OAuth)
4. Configure OAuth Consent Screen:
   - User Type: External (or Internal for workspace)
   - Add scopes: `calendar.events`, `userinfo.email`, `userinfo.profile`
   - Add test users (if in testing mode)
5. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://api.yourdomain.com/api/auth/google/callback
     ```
   - Save Client ID and Client Secret

---

## Pre-Deployment Checklist

### Security Checklist
- [ ] Server firewall configured (UFW/iptables)
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban installed and configured
- [ ] Strong passwords generated for all services
- [ ] SSL/TLS certificates will be auto-generated
- [ ] Security updates enabled

### Infrastructure Checklist
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS records configured and propagated
- [ ] Server has sufficient disk space
- [ ] Backup strategy planned
- [ ] Monitoring solution ready (optional)

### Application Checklist
- [ ] Google OAuth credentials obtained
- [ ] Environment variables prepared
- [ ] Repository access configured
- [ ] Deployment scripts reviewed

---

## Production Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/up-schedule-generator.git
cd up-schedule-generator

# Checkout production branch
git checkout main
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Required Environment Variables:**

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# Domain Configuration
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
NODE_ENV=production

# Security Secrets (GENERATE STRONG VALUES!)
SESSION_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
MINIO_SECRET_KEY=$(openssl rand -base64 32)

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=schedgen
POSTGRES_DB=schedgen

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_BUCKET=pdf-uploads
MINIO_USE_SSL=false

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# PDF Worker
PDF_WORKER_URL=http://pdf-worker:5001
PARSER_URL=http://pdf-worker:5001

# Traefik Configuration
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD=$(htpasswd -nb admin your-password)
ACME_EMAIL=your-email@example.com
```

**Generate Secure Passwords:**
```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate POSTGRES_PASSWORD
openssl rand -base64 32

# Generate MINIO_SECRET_KEY
openssl rand -base64 32

# Generate Traefik dashboard password (requires apache2-utils)
sudo apt install apache2-utils -y
htpasswd -nb admin your-password
```

### 4. Traefik Configuration Verification

Ensure Traefik configuration files exist:
```bash
ls -la traefik/
# Should show:
# - traefik.yml
# - traefik.dev.yml
# - dynamic/middlewares.yml
```

---

## Initial Deployment

### Step 1: Build Images

```bash
# Build all Docker images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
```

This will build:
- Frontend (Next.js) - Multi-stage build with standalone output
- Backend (NestJS) - Multi-stage build with production dependencies
- PDF Worker (FastAPI) - Python with Gunicorn

### Step 2: Start Infrastructure Services

```bash
# Start database and storage services first
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis minio

# Wait for services to be ready
sleep 15
```

### Step 3: Initialize MinIO

```bash
# Make script executable
chmod +x scripts/init-minio.sh

# Run initialization
docker exec -it schedgen-minio sh -c "
  mc alias set local http://localhost:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} &&
  mc mb local/${MINIO_BUCKET} --ignore-existing &&
  mc anonymous set download local/${MINIO_BUCKET}
"
```

### Step 4: Run Database Migrations

```bash
# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npm run migration:run
```

### Step 5: Start All Services

```bash
# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Step 6: Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# All services should show "healthy" or "running"
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend (should return HTML)
curl -I https://yourdomain.com

# PDF Worker health
docker exec schedgen-pdf-worker curl http://localhost:5001/health
```

### 2. Service Connectivity

```bash
# Check Traefik dashboard (requires auth)
curl -u admin:your-password https://traefik.yourdomain.com

# Check MinIO console
curl -I https://minio.yourdomain.com
```

### 3. Database Verification

```bash
# Connect to PostgreSQL
docker exec -it schedgen-postgres psql -U schedgen -d schedgen

# Check tables
\dt

# Exit
\q
```

### 4. Application Testing

1. **Frontend Access**: Visit `https://yourdomain.com`
   - Should load without errors
   - Check browser console for errors

2. **Google OAuth**: Click "Sign in with Google"
   - Should redirect to Google
   - After auth, should redirect back successfully

3. **PDF Upload**: Upload a test PDF
   - Should process successfully
   - Check job status in backend

4. **Calendar Export**: Generate calendar events
   - Should create ICS file
   - Should sync to Google Calendar

### 5. SSL Certificate Verification

```bash
# Check certificate
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Should show Let's Encrypt certificate with valid dates
```

---

## Maintenance & Operations

### Updating the Application

Use the deployment script for zero-downtime updates:

```bash
# Make script executable (first time only)
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

The script performs:
1. Git pull latest code
2. Build new images
3. Run database migrations
4. Restart services with new images
5. Clean up old images

### Manual Update Process

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npm run migration:run

# Restart services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Clean up
docker image prune -f
```

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend
```

### Restarting Services

```bash
# Restart all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Stop all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Monitoring & Logging

### Service Health Monitoring

All services have health checks configured:

```bash
# Check health status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Detailed health check
docker inspect --format='{{json .State.Health}}' schedgen-backend | jq
```

### Traefik Dashboard

Access at `https://traefik.yourdomain.com` (requires authentication)

Features:
- Real-time request metrics
- Service status
- Router configuration
- Middleware status

### Log Aggregation

```bash
# Export logs to file
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs > logs.txt

# Filter by service and time
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --since 1h backend
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
du -sh /var/lib/docker/volumes/*
```

---

## Backup & Recovery

### Database Backup

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Manual backup
POSTGRES_PASSWORD=your-password ./scripts/backup-db.sh

# Backups are stored in ./backups/ with 7-day retention
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/up-schedule-generator && POSTGRES_PASSWORD=your-password ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### Database Restore

```bash
# List available backups
ls -lh backups/

# Restore from backup
docker exec -i schedgen-postgres psql -U schedgen -d schedgen < backups/schedgen_YYYY-MM-DD_HH-MM-SS.sql
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm \
  -v schedgen_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_data.tar.gz -C /data .

docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio_data.tar.gz -C /data .
```

### Disaster Recovery

```bash
# Stop all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Restore volumes
docker run --rm \
  -v schedgen_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres_data.tar.gz -C /data

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Check specific service
docker logs schedgen-backend

# Verify environment variables
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
```

#### 2. SSL Certificate Issues

```bash
# Check Traefik logs
docker logs schedgen-traefik

# Verify ACME email is set
grep ACME_EMAIL .env

# Check certificate file
docker exec schedgen-traefik ls -la /etc/traefik/certs/

# Force certificate renewal (if needed)
docker exec schedgen-traefik rm /etc/traefik/certs/acme.json
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart traefik
```

#### 3. Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it schedgen-postgres psql -U schedgen -d schedgen -c "SELECT 1;"

# Check backend can connect
docker exec -it schedgen-backend wget -O- http://localhost:3001/health
```

#### 4. PDF Processing Failures

```bash
# Check PDF worker logs
docker logs schedgen-pdf-worker

# Test PDF worker directly
docker exec -it schedgen-pdf-worker curl http://localhost:5001/health

# Verify backend can reach PDF worker
docker exec -it schedgen-backend curl http://pdf-worker:5001/health
```

#### 5. MinIO Access Issues

```bash
# Check MinIO is running
docker ps | grep minio

# Verify bucket exists
docker exec -it schedgen-minio mc ls local/

# Recreate bucket
docker exec -it schedgen-minio mc mb local/pdf-uploads --ignore-existing
```

### Debug Mode

Enable debug logging:

```bash
# Edit docker-compose.prod.yml
# Add to backend service:
environment:
  - LOG_LEVEL=debug

# Restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Network Debugging

```bash
# Check Docker network
docker network inspect schedgen

# Test service connectivity
docker exec -it schedgen-backend ping postgres
docker exec -it schedgen-backend ping redis
docker exec -it schedgen-backend ping minio
docker exec -it schedgen-backend ping pdf-worker
```

---

## Security Considerations

### 1. Firewall Configuration

```bash
# UFW rules
sudo ufw status

# Should only allow:
# - 22/tcp (SSH)
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
```

### 2. Secret Management

- Never commit `.env` to version control
- Use strong, randomly generated passwords
- Rotate secrets regularly
- Use environment-specific secrets

### 3. SSL/TLS

- Automatic Let's Encrypt certificates via Traefik
- HTTP automatically redirects to HTTPS
- HSTS headers enabled
- TLS 1.2+ only

### 4. Container Security

- All services run as non-root users
- Minimal base images (Alpine Linux)
- No unnecessary ports exposed
- Read-only root filesystems where possible

### 5. Application Security

- Helmet.js security headers
- CORS configured for frontend only
- Rate limiting on API endpoints
- Session-based authentication
- OAuth 2.0 for Google integration

### 6. Database Security

- PostgreSQL not exposed externally
- Strong password required
- Regular backups
- Connection pooling

### 7. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f
```

---

## Performance Optimization

### 1. Resource Limits

Add to `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Database Tuning

```bash
# Connect to PostgreSQL
docker exec -it schedgen-postgres psql -U schedgen -d schedgen

# Check connection count
SELECT count(*) FROM pg_stat_activity;

# Optimize queries
EXPLAIN ANALYZE SELECT * FROM jobs WHERE status = 'completed';
```

### 3. Redis Optimization

```bash
# Check memory usage
docker exec -it schedgen-redis redis-cli INFO memory

# Set max memory
docker exec -it schedgen-redis redis-cli CONFIG SET maxmemory 256mb
docker exec -it schedgen-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 4. Monitoring Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

---

## Scaling Considerations

### Horizontal Scaling

To scale services:

```bash
# Scale backend to 3 instances
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3

# Traefik will automatically load balance
```

### Database Replication

For high availability, consider:
- PostgreSQL streaming replication
- Redis Sentinel for failover
- MinIO distributed mode

### CDN Integration

For better performance:
- Use CloudFlare or similar CDN
- Cache static assets
- Enable Brotli/Gzip compression

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor service health
- Check error logs
- Verify backups completed

**Weekly:**
- Review resource usage
- Check disk space
- Update Docker images

**Monthly:**
- Rotate secrets
- Review security logs
- Test disaster recovery
- Update system packages

### Getting Help

1. Check logs: `docker compose logs`
2. Review this documentation
3. Check GitHub issues
4. Contact system administrator

---

## Appendix

### Quick Reference Commands

```bash
# Start production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop production
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Restart service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npm run migration:run

# Backup database
POSTGRES_PASSWORD=xxx ./scripts/backup-db.sh

# Deploy updates
./scripts/deploy.sh
```

### Environment Variables Reference

See `.env.example` for complete list of configuration options.

### Port Reference

| Service | Internal Port | External Port (Dev) | External Port (Prod) |
|---------|--------------|---------------------|---------------------|
| Frontend | 3000 | 3000 | 443 (via Traefik) |
| Backend | 3001 | 3001 | 443 (via Traefik) |
| PDF Worker | 5001 | 5001 | Internal only |
| PostgreSQL | 5432 | 5433 | Internal only |
| Redis | 6379 | 6379 | Internal only |
| MinIO API | 9000 | 9000 | Internal only |
| MinIO Console | 9001 | 9001 | 443 (via Traefik) |
| Traefik HTTP | 80 | 80 | 80 |
| Traefik HTTPS | 443 | - | 443 |
| Traefik Dashboard | 8080 | 8081 | 443 (via Traefik) |

---

---

## Recent Updates & Fixes

### 2025-11-28
- **Fixed**: TypeScript build error in `EventList.tsx` - resolved `dayOfWeek` property issue
- **Updated**: Footer component - centered text, removed GitHub and Get Started links
- **Verified**: Production Docker build completes successfully
- **Status**: Ready for production deployment

---

**Document Version**: 1.1  
**Last Updated**: 2025-11-28  
**Maintained By**: DevOps Team
