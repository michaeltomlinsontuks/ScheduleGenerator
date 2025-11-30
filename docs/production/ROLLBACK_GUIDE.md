# Rollback Guide

## Overview

This guide covers the automatic and manual rollback procedures for the UP Schedule Generator. Rollback restores the system to a previous stable state by reverting Docker images and restoring from pre-deployment backups.

## Table of Contents

- [Automatic Rollback](#automatic-rollback)
- [Manual Rollback](#manual-rollback)
- [Rollback Verification](#rollback-verification)
- [Troubleshooting](#troubleshooting)
- [Recovery Procedures](#recovery-procedures)

## Automatic Rollback

### Overview

The deployment system includes automatic rollback detection that monitors the deployment and triggers rollback if failures are detected.

### Automatic Rollback Triggers

Rollback is automatically triggered when:

1. **Consecutive Health Check Failures**: 3 consecutive health check failures
2. **High Error Rate**: Error rate exceeds 10% over monitoring period
3. **Deployment Script Failure**: The deployment script exits with an error
4. **Verification Failure**: Post-deployment verification fails

### Using Automatic Rollback

Deploy with automatic rollback protection:

```bash
bash scripts/deploy-with-rollback.sh
```

The script will:
1. Execute the deployment
2. Verify initial health checks
3. Run deployment verification
4. Monitor for 10 minutes (configurable)
5. Automatically rollback if failures detected

### Configuration

Configure automatic rollback thresholds via environment variables:

```bash
# Set monitoring duration (default: 600 seconds / 10 minutes)
export MONITORING_DURATION=600

# Set error rate threshold (default: 0.10 / 10%)
export ERROR_THRESHOLD=0.10

# Deploy with custom settings
bash scripts/deploy-with-rollback.sh
```

### Monitoring Output

During monitoring, you'll see real-time status:

```
Progress: 120s / 600s | Checks: 12 | Failures: 0 (0.00%) | Consecutive: 0 | Remaining: 480s
```

- **Progress**: Elapsed time / Total monitoring time
- **Checks**: Total health checks performed
- **Failures**: Failed checks and error rate percentage
- **Consecutive**: Consecutive failures (triggers rollback at 3)
- **Remaining**: Time remaining in monitoring period

## Manual Rollback

### When to Use Manual Rollback

Use manual rollback when:

- Issues are discovered after the monitoring period
- You need to rollback for reasons other than health/errors
- Automatic rollback failed and needs to be re-attempted
- You want to rollback to a specific previous deployment

### Prerequisites

Before performing manual rollback:

1. **Backup Information Available**: The `.last-deployment-backup` file must exist
2. **Backup Files Intact**: Database and MinIO backup files must be present
3. **Docker Running**: Docker daemon must be running
4. **Sufficient Disk Space**: Ensure enough space for rebuild

### Manual Rollback Procedure

#### Step 1: Check Backup Information

Verify backup information is available:

```bash
bash scripts/get-last-backup.sh
```

Expected output:
```
=== Last Deployment Backup Information ===

Deployment Timestamp: 20241130_143022
Backup Directory: ./backups/pre-deployment-20241130_143022
Git Commit: abc123def456
Git Branch: main

=== Backup Files ===

✓ Database backup: ./backups/pre-deployment-20241130_143022/db_20241130_143022.sql.gz (2.5M)
✓ MinIO backup: ./backups/pre-deployment-20241130_143022/minio_20241130_143022.tar.gz (15M)
```

#### Step 2: Execute Rollback

Run the rollback script:

```bash
bash scripts/rollback.sh
```

You will be prompted to confirm:

```
⚠️  WARNING: This will rollback to the previous deployment
⚠️  Current data will be replaced with backup from: 20241130_143022
⚠️  Git commit: abc123def456

Are you sure you want to proceed with rollback? (yes/no):
```

Type `yes` to proceed.

#### Step 3: Monitor Rollback Progress

The script will:

1. ✓ Load backup information
2. ✓ Stop all services
3. ✓ Restore database from backup
4. ✓ Restore MinIO volumes from backup
5. ✓ Revert to previous Git commit
6. ✓ Rebuild and start services
7. ✓ Verify rollback success

#### Step 4: Verify Rollback

After rollback completes, verify the system:

```bash
# Check service status
docker compose ps

# Check health endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# Check logs for errors
docker compose logs --tail=50 backend frontend pdf-worker
```

### Non-Interactive Rollback

For automated rollback (e.g., in scripts), use:

```bash
export ROLLBACK_CONFIRM="yes"
bash scripts/rollback.sh
```

## Rollback Verification

### Automated Verification

The rollback script automatically verifies:

- ✓ All services are running
- ✓ Health checks pass
- ✓ Database connectivity works
- ✓ Frontend is accessible
- ✓ Backend API responds

### Manual Verification Checklist

After rollback, manually verify:

#### 1. Service Health

```bash
# Check all services are running
docker compose ps

# Expected: All services in "Up" state with "healthy" status
```

#### 2. API Functionality

```bash
# Test backend health
curl http://localhost:3001/health

# Test metrics endpoint
curl http://localhost:3001/metrics

# Test job queue metrics
curl http://localhost:3001/api/jobs/metrics
```

#### 3. Database Integrity

```bash
# Check database tables
docker compose exec postgres psql -U schedgen -d schedgen -c "\dt"

# Check recent data
docker compose exec postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs;"
```

#### 4. Frontend Accessibility

```bash
# Test frontend
curl -I http://localhost:3000

# Expected: HTTP/1.1 200 OK
```

#### 5. File Storage

```bash
# Check MinIO is accessible
curl http://localhost:9001

# Verify bucket exists
docker compose exec minio mc ls local/
```

#### 6. Monitoring Stack

```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Grafana
curl http://localhost:3002/api/health
```

### Critical User Flows

Test these critical user flows manually:

1. **Homepage Load**: Visit http://localhost:3000
2. **Authentication**: Test Google OAuth login
3. **File Upload**: Upload a test PDF
4. **Job Status**: Check job status polling
5. **Calendar Download**: Download generated calendar

## Troubleshooting

### Rollback Script Fails

#### Problem: Backup information not found

```
ERROR: No backup information found at .last-deployment-backup
```

**Solution**: Check if backup was created during deployment

```bash
# List recent backups
ls -lh backups/

# If backups exist, manually create backup info file
cat > .last-deployment-backup <<EOF
DEPLOYMENT_TIMESTAMP=20241130_143022
BACKUP_DIR=./backups/pre-deployment-20241130_143022
DB_BACKUP_FILE=./backups/pre-deployment-20241130_143022/db_20241130_143022.sql.gz
MINIO_BACKUP_FILE=./backups/pre-deployment-20241130_143022/minio_20241130_143022.tar.gz
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=main
EOF
```

#### Problem: Database restore fails

```
ERROR: Database restore failed
```

**Solution**: Check backup file integrity and PostgreSQL status

```bash
# Verify backup file
gzip -t ./backups/pre-deployment-*/db_*.sql.gz

# Check PostgreSQL logs
docker compose logs postgres

# Manually restore if needed
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

#### Problem: Services won't start after rollback

```
ERROR: Failed to start services
```

**Solution**: Check Docker resources and logs

```bash
# Check Docker status
docker info

# Check available disk space
df -h

# Check service logs
docker compose logs --tail=100

# Try starting services individually
docker compose up -d postgres
docker compose up -d redis
docker compose up -d backend
```

### Partial Rollback

If rollback is interrupted, you can resume from specific steps:

#### Resume from Database Restore

```bash
# Start PostgreSQL
docker compose up -d postgres

# Restore database manually
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen

# Continue with rollback script
bash scripts/rollback.sh
```

#### Resume from Service Restart

```bash
# If database and volumes are restored, just restart services
docker compose down
docker compose up -d

# Verify health
bash scripts/verify-deployment.sh
```

## Recovery Procedures

### Complete System Recovery

If rollback fails completely, perform manual recovery:

#### 1. Stop All Services

```bash
docker compose down --volumes
```

#### 2. Restore Database

```bash
# Start only PostgreSQL
docker compose up -d postgres

# Wait for PostgreSQL
sleep 10

# Restore database
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

#### 3. Restore MinIO

```bash
# Restore MinIO volumes
docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups/pre-deployment-*:/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/minio_*.tar.gz -C /data'
```

#### 4. Revert Code

```bash
# Get commit from backup info
source .last-deployment-backup

# Checkout previous commit
git checkout $GIT_COMMIT
```

#### 5. Rebuild and Start

```bash
# Rebuild containers
docker compose build --no-cache

# Start all services
docker compose up -d

# Verify
bash scripts/verify-deployment.sh
```

### Emergency Rollback Without Backup

If no backup is available, perform emergency recovery:

#### 1. Identify Last Known Good Commit

```bash
# View recent commits
git log --oneline -10

# Checkout last known good commit
git checkout <commit-hash>
```

#### 2. Rebuild and Restart

```bash
# Stop services
docker compose down

# Rebuild
docker compose build --no-cache

# Start services
docker compose up -d
```

#### 3. Verify and Monitor

```bash
# Check health
curl http://localhost:3001/health

# Monitor logs
docker compose logs -f
```

**Note**: Without backup, data loss may occur. This should only be used as a last resort.

## Best Practices

### Before Rollback

1. **Document the Issue**: Record what went wrong and why rollback is needed
2. **Notify Team**: Inform team members of the rollback
3. **Check Backup**: Verify backup files exist and are valid
4. **Review Logs**: Capture logs before rollback for post-mortem

### During Rollback

1. **Monitor Progress**: Watch rollback output for errors
2. **Don't Interrupt**: Let rollback complete fully
3. **Keep Logs**: Save rollback output for documentation

### After Rollback

1. **Verify Thoroughly**: Complete all verification steps
2. **Monitor Extended**: Watch metrics for 1-2 hours
3. **Document Cause**: Record root cause of deployment failure
4. **Plan Fix**: Develop plan to fix issues before redeployment
5. **Test Fix**: Test fixes in staging before production

## Related Documentation

- [Deployment Guide](./ROLLING_DEPLOYMENT.md)
- [Deployment Verification](./DEPLOYMENT_VERIFICATION.md)
- [Backup Guide](./BACKUP_RUNBOOK.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)

## Support

If you encounter issues not covered in this guide:

1. Check service logs: `docker compose logs`
2. Review backup files: `ls -lh backups/`
3. Verify Docker status: `docker info`
4. Contact the development team with:
   - Rollback output
   - Service logs
   - Backup information
   - Error messages
