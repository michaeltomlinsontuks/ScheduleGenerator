# Rolling Deployment Guide

## Overview

This guide explains the zero-downtime rolling deployment strategy implemented in the UP Schedule Generator. The deployment script updates services one at a time with health check verification between each update to ensure continuous availability.

## Rolling Update Strategy

### Update Order

Services are updated in a specific order to minimize impact and maintain system availability:

1. **Infrastructure Services** (Redis, MinIO)
   - Updated first as they support application services
   - Health checks verify they're ready before proceeding

2. **Processing Layer** (PDF Workers)
   - Updated before backend to ensure processing capacity
   - Multiple replicas allow some workers to continue processing during updates

3. **API Layer** (Backend)
   - Updated after workers are ready
   - Health checks ensure API is responsive before frontend update

4. **Presentation Layer** (Frontend)
   - Updated last to ensure backend is ready
   - Users experience no downtime as old frontend continues serving until new one is healthy

5. **Monitoring Services** (Prometheus, Grafana)
   - Updated last as they're non-critical
   - Failures are logged as warnings but don't stop deployment

### Health Check Verification

After each service update, the script:
- Waits for the service to report healthy status
- Checks Docker health check status (if defined)
- Falls back to checking if service is running (for services without health checks)
- Times out after 5 minutes if service doesn't become healthy
- Aborts deployment if health check fails

### Timeout Protection

All deployment steps have timeout protection:
- **Container build**: 30 minutes max
- **Database migrations**: 5 minutes max
- **Service update**: 10 minutes max per service
- **Health check**: 5 minutes max per service

If any step exceeds its timeout, the deployment aborts with a clear error message.

## Usage

### Basic Deployment

```bash
./scripts/deploy.sh
```

### Deploy Specific Branch

```bash
GIT_BRANCH=develop ./scripts/deploy.sh
```

### Environment Variables

- `GIT_BRANCH`: Git branch to deploy (default: main)
- `HEALTH_CHECK_TIMEOUT`: Max seconds to wait for health checks (default: 300)
- `HEALTH_CHECK_INTERVAL`: Seconds between health check attempts (default: 5)
- `SERVICE_UPDATE_TIMEOUT`: Max seconds per service update (default: 600)

## Pre-requisites

### Required Tools

- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **jq**: JSON parsing for health check status
- **Git**: Version control

### Installation

```bash
# macOS
brew install jq

# Ubuntu/Debian
apt-get install jq

# CentOS/RHEL
yum install jq
```

## Deployment Process

### Step-by-Step Flow

1. **Pre-flight Checks**
   - Verify git repository
   - Check Docker availability
   - Check jq installation
   - Verify backup script exists

2. **Pre-Deployment Backup** ⭐ NEW
   - Create timestamped backup directory
   - Backup PostgreSQL database
   - Backup MinIO volumes
   - Verify backup integrity
   - Store backup location for rollback
   - Abort deployment if backup fails

3. **Pull Latest Code**
   - Fetch from origin
   - Checkout target branch
   - Pull latest changes

4. **Build Containers**
   - Build all service images
   - Use --no-cache for clean builds
   - Timeout after 30 minutes

5. **Run Database Migrations**
   - Ensure PostgreSQL is running
   - Wait for database health check
   - Run migrations with timeout

6. **Rolling Update - Infrastructure**
   - Update Redis (cache/queue)
   - Update MinIO (object storage)
   - Verify health after each update

7. **Rolling Update - Application**
   - Update PDF Workers (processing)
   - Update Backend (API)
   - Update Frontend (UI)
   - Verify health after each update

8. **Rolling Update - Monitoring**
   - Update Prometheus
   - Update Grafana
   - Non-critical, failures logged as warnings

9. **Post-Deployment Verification**
   - Verify all critical services healthy
   - Display service status
   - Display backup location
   - Show next steps

10. **Cleanup**
    - Remove old Docker images
    - Free up disk space

## Health Check Configuration

### Service Health Checks

Each service defines health checks in docker-compose files:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Health Check Endpoints

- **Backend**: `GET /health`
- **Frontend**: `GET /` (homepage)
- **PDF Worker**: `GET /health`
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping`

## Monitoring During Deployment

### Real-time Logs

Monitor deployment progress:

```bash
# Follow deployment script output
./scripts/deploy.sh

# Watch service logs in another terminal
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Service Status

Check service status during deployment:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Health Check Status

Check individual service health:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps --format json backend | jq '.[0].Health'
```

## Troubleshooting

### Service Fails Health Check

**Symptom**: Service update times out waiting for health check

**Solutions**:
1. Check service logs: `docker compose logs <service>`
2. Verify health check endpoint is accessible
3. Increase `HEALTH_CHECK_TIMEOUT` if service needs more startup time
4. Check resource constraints (CPU, memory)

### Database Migration Fails

**Symptom**: Migration step fails or times out

**Solutions**:
1. Check PostgreSQL logs: `docker compose logs postgres`
2. Verify database is accessible
3. Check migration files for errors
4. Manually run migrations: `docker compose run --rm backend npm run migration:run`

### Container Build Timeout

**Symptom**: Build step exceeds 30-minute timeout

**Solutions**:
1. Check network connectivity
2. Clear Docker build cache: `docker builder prune`
3. Build individual services: `docker compose build <service>`
4. Check for large files being copied into images

### Service Update Timeout

**Symptom**: Service update exceeds 10-minute timeout

**Solutions**:
1. Check if service is pulling large images
2. Verify Docker daemon is responsive
3. Check system resources (disk space, memory)
4. Increase `SERVICE_UPDATE_TIMEOUT` if needed

## Rollback Procedure

If deployment fails, rollback to previous version using the pre-deployment backup:

```bash
# 1. Get backup information
bash scripts/get-last-backup.sh

# 2. Stop services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 3. Restore database (use command from get-last-backup.sh output)
gunzip -c <DB_BACKUP_FILE> | docker compose exec -T postgres psql -U schedgen -d schedgen

# 4. Restore MinIO volumes (use command from get-last-backup.sh output)
docker run --rm -v schedgen_minio_data:/data -v $(pwd)/<BACKUP_DIR>:/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/<MINIO_BACKUP_FILE> -C /data'

# 5. Checkout previous version
git checkout <previous-commit>

# 6. Restart services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

For detailed rollback procedures, see:
- [Pre-Deployment Backup Guide](./PRE_DEPLOYMENT_BACKUP.md)
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md)

## Best Practices

### Before Deployment

- [ ] Test changes in staging environment
- [ ] Review database migrations
- [ ] Check disk space availability (backups require space)
- [ ] Notify team of deployment window
- [ ] Verify backup credentials are set (POSTGRES_PASSWORD, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)
- [ ] Note: Backup is created automatically before deployment

### During Deployment

- [ ] Monitor deployment script output
- [ ] Watch service logs for errors
- [ ] Check Grafana dashboards for metrics
- [ ] Be ready to rollback if issues arise

### After Deployment

- [ ] Verify all services are healthy
- [ ] Test critical user flows
- [ ] Monitor error rates in Grafana
- [ ] Check application logs for issues
- [ ] Verify metrics are being collected

## Performance Characteristics

### Typical Deployment Times

- **Small changes** (code only): 5-10 minutes
- **Medium changes** (dependencies): 10-20 minutes
- **Large changes** (major updates): 20-40 minutes

### Downtime

- **Expected downtime**: 0 seconds (zero-downtime)
- **Service unavailability**: None (rolling updates maintain availability)
- **User impact**: Minimal (transparent to users)

## Related Documentation

- [Pre-Deployment Backup Guide](./PRE_DEPLOYMENT_BACKUP.md) - Automatic backup before deployment
- [Backup Automation](./BACKUP_AUTOMATION.md) - Backup system overview
- [Backup Runbook](./BACKUP_RUNBOOK.md) - Backup and restore procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback procedures
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [Deployment Verification](./DEPLOYMENT_VERIFICATION.md) - Post-deployment verification

## Requirements Validation

This implementation satisfies:
- **Requirement 12.2**: Zero-downtime rolling updates
  - Health check verification between updates
  - Timeout protection for all deployment steps
  - Service update order optimized for availability
- **Requirement 12.5**: Pre-deployment backup
  - Automatic backup creation before any changes
  - Backup integrity verification
  - Backup location stored for rollback
