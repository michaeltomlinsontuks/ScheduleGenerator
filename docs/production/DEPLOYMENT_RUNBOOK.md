# Deployment Runbook

## Purpose

This runbook provides step-by-step instructions for deploying updates to the UP Schedule Generator production environment. It covers pre-deployment preparation, the deployment process, post-deployment verification, and troubleshooting common issues.

**Target Audience**: System administrators, DevOps engineers, and deployment operators

**Related Documents**:
- [Rolling Deployment Guide](./ROLLING_DEPLOYMENT.md) - Technical details of rolling update strategy
- [Deployment Verification Guide](./DEPLOYMENT_VERIFICATION.md) - Post-deployment verification procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback procedures if deployment fails
- [Pre-Deployment Backup Guide](./PRE_DEPLOYMENT_BACKUP.md) - Backup procedures

## Overview

The deployment process uses a zero-downtime rolling update strategy that:
- Creates automatic backups before any changes
- Updates services one at a time with health check verification
- Runs database migrations automatically
- Verifies deployment success with comprehensive checks
- Supports automatic rollback on failure

**Typical deployment time**: 15-30 minutes depending on changes

**Expected downtime**: 0 seconds (zero-downtime deployment)

## Pre-Deployment Checklist

Complete this checklist before starting any deployment:

### 1. Environment Preparation

- [ ] **Verify you have access to production server**
  ```bash
  ssh user@production-server
  ```

- [ ] **Confirm you're in the correct directory**
  ```bash
  cd /path/to/up-schedule-generator
  pwd  # Should show project root
  ```

- [ ] **Check current git branch and status**
  ```bash
  git status
  git branch
  ```

- [ ] **Verify Docker is running**
  ```bash
  docker ps
  docker compose version
  ```

### 2. Code Preparation

- [ ] **Identify the version/branch to deploy**
  ```bash
  # For main branch
  GIT_BRANCH=main
  
  # For specific tag
  GIT_BRANCH=v1.2.3
  
  # For feature branch (staging only)
  GIT_BRANCH=feature/new-feature
  ```

- [ ] **Review changes since last deployment**
  ```bash
  git log --oneline origin/main..HEAD
  git diff origin/main..HEAD
  ```

- [ ] **Check for database migrations**
  ```bash
  ls -la backend/src/migrations/
  # Note any new migration files
  ```

### 3. System Health Check

- [ ] **Verify current system is healthy**
  ```bash
  # Quick health check
  ./scripts/verify-deployment.sh --quick
  
  # Check service status
  docker compose ps
  ```

- [ ] **Check disk space (backups require space)**
  ```bash
  df -h
  # Ensure at least 10GB free space
  ```

- [ ] **Check system resources**
  ```bash
  # CPU and memory usage
  docker stats --no-stream
  
  # Should be under 80% utilization
  ```

- [ ] **Review recent logs for errors**
  ```bash
  docker compose logs --tail=100 backend | grep -i error
  ```

### 4. Backup Verification

- [ ] **Verify backup credentials are set**
  ```bash
  # Check .env file has required variables
  grep -E "POSTGRES_PASSWORD|MINIO_ACCESS_KEY|MINIO_SECRET_KEY" .env
  ```

- [ ] **Verify backup directory exists and is writable**
  ```bash
  mkdir -p ./backups
  touch ./backups/test && rm ./backups/test
  ```

- [ ] **Check recent backup status (optional)**
  ```bash
  ./scripts/backup-all.sh --last
  ```

### 5. Team Communication

- [ ] **Notify team of deployment window**
  - Post in team chat: "Starting deployment at [TIME]"
  - Estimated duration: 15-30 minutes
  - Expected impact: None (zero-downtime)

- [ ] **Ensure someone is available for rollback if needed**
  - Have backup operator on standby
  - Share this runbook with team

### 6. Monitoring Preparation

- [ ] **Open Grafana dashboards**
  ```bash
  # Open in browser
  open http://localhost:3002
  ```
  - System Overview dashboard
  - Job Processing dashboard
  - Resource Utilization dashboard

- [ ] **Open Prometheus (optional)**
  ```bash
  open http://localhost:9090
  ```

- [ ] **Prepare log monitoring**
  ```bash
  # In a separate terminal, tail logs
  docker compose logs -f backend frontend pdf-worker
  ```

## Deployment Procedure

### Method 1: Standard Deployment (Recommended)

Use this method for most deployments. It includes automatic backup, rolling updates, and verification.

#### Step 1: Start Deployment

```bash
# Navigate to project root
cd /path/to/up-schedule-generator

# Run deployment script
./scripts/deploy.sh
```

**What happens**:
1. Pre-flight checks verify prerequisites
2. **Automatic backup** of database and MinIO volumes
3. Backup integrity verification
4. Latest code pulled from git
5. Containers rebuilt
6. Database migrations run
7. Services updated one at a time with health checks
8. Post-deployment verification

**Expected output**:
```
=== Zero-Downtime Deployment Script ===
Branch: main
Started at: [timestamp]

=== Pre-flight Checks ===
[INFO] Pre-flight checks passed

=== Step 0: Pre-deployment backup ===
[INFO] Creating backup before deployment
[INFO] Backup directory: ./backups/pre-deployment-20241130_143000
[INFO] Backup integrity verified successfully
[INFO] Pre-deployment backup completed successfully

=== Step 1: Pulling latest code ===
[INFO] Code updated successfully

=== Step 2: Building containers ===
[INFO] Containers built successfully

=== Step 3: Running database migrations ===
[INFO] Migrations completed successfully

=== Step 4: Rolling update - Infrastructure services ===
[INFO] Service redis updated successfully
[INFO] Service minio updated successfully

=== Step 5: Rolling update - Application services ===
[INFO] Service pdf-worker updated successfully
[INFO] Service backend updated successfully
[INFO] Service frontend updated successfully

=== Step 6: Rolling update - Monitoring services ===
[INFO] Monitoring services updated

=== Step 7: Post-deployment verification ===
[INFO] All critical services are healthy
[INFO] Deployment verification passed

=== Step 8: Cleaning up old images ===
[INFO] Old images cleaned up

=== Deployment Complete ===
[INFO] All services updated successfully with zero downtime
```

#### Step 2: Monitor Deployment Progress

While deployment is running:

1. **Watch the deployment script output**
   - Look for green `[INFO]` messages indicating success
   - Watch for red `[ERROR]` messages indicating problems
   - Note the backup location displayed

2. **Monitor Grafana dashboards**
   - Watch for any spikes in error rates
   - Monitor response times
   - Check resource utilization

3. **Check service logs (in separate terminal)**
   ```bash
   docker compose logs -f backend frontend pdf-worker
   ```

#### Step 3: Verify Deployment Success

The deployment script automatically runs verification, but you can run additional checks:

```bash
# Quick smoke test
./scripts/verify-deployment.sh --quick

# Check all services are running
docker compose ps

# Verify health endpoints
curl http://localhost:3001/health
curl http://localhost:3000/

# Check metrics are being collected
curl http://localhost:3001/metrics
```

### Method 2: Deployment with Enhanced Monitoring

Use this method when you want automatic rollback on failure detection.

```bash
# Run deployment with automatic rollback capability
./scripts/deploy-with-rollback.sh
```

**Additional features**:
- Monitors health checks for 10 minutes after deployment
- Automatically triggers rollback if error rate exceeds 10%
- Automatically triggers rollback if 3 consecutive health checks fail
- Provides detailed monitoring output

**What to watch for**:
```
=== Step 4: Extended monitoring with automatic rollback detection ===
[INFO] Monitoring deployment for 600s...
[INFO] Automatic rollback will trigger if:
  - Error rate exceeds 10.00%
  - 3 consecutive health check failures occur

  Progress: 120s / 600s | Checks: 12 | Failures: 0 (0.00%) | Consecutive: 0 | Remaining: 480s
```

### Method 3: Deploy Specific Branch

To deploy a specific branch or tag:

```bash
# Deploy specific branch
GIT_BRANCH=develop ./scripts/deploy.sh

# Deploy specific tag
GIT_BRANCH=v1.2.3 ./scripts/deploy.sh
```

## Post-Deployment Verification

After deployment completes, perform these verification steps:

### 1. Immediate Verification (0-5 minutes)

- [ ] **Verify all services are running**
  ```bash
  docker compose ps
  # All services should show "Up" and "healthy"
  ```

- [ ] **Check health endpoints**
  ```bash
  # Backend health
  curl -f http://localhost:3001/health || echo "FAILED"
  
  # Frontend accessibility
  curl -f http://localhost:3000/ || echo "FAILED"
  
  # Database health
  curl -f http://localhost:3001/health/db || echo "FAILED"
  ```

- [ ] **Verify metrics endpoint**
  ```bash
  curl -f http://localhost:3001/metrics | head -20
  ```

- [ ] **Check recent logs for errors**
  ```bash
  docker compose logs --tail=50 backend | grep -i error
  docker compose logs --tail=50 frontend | grep -i error
  docker compose logs --tail=50 pdf-worker | grep -i error
  ```

### 2. Functional Verification (5-10 minutes)

- [ ] **Test critical user flows**
  
  **Upload Flow**:
  1. Navigate to http://localhost:3000
  2. Click "Upload PDF"
  3. Select a test PDF file
  4. Verify upload succeeds
  5. Check job status updates correctly
  6. Verify events are displayed

  **API Flow**:
  ```bash
  # Test upload endpoint
  curl -X POST http://localhost:3001/api/upload \
    -H "Content-Type: multipart/form-data" \
    -F "file=@test.pdf" \
    -F "pdfType=WEEKLY"
  
  # Should return job ID
  ```

- [ ] **Verify database migrations applied**
  ```bash
  docker compose exec backend npm run migration:show
  # All migrations should show as "executed"
  ```

- [ ] **Check job queue is operational**
  ```bash
  curl http://localhost:3001/api/jobs/metrics
  # Should return queue metrics
  ```

### 3. Extended Monitoring (10-60 minutes)

- [ ] **Monitor Grafana dashboards**
  - System Overview: Check error rates, response times
  - Job Processing: Verify jobs are being processed
  - Resource Utilization: Ensure resources are within limits

- [ ] **Watch for memory leaks**
  ```bash
  # Monitor memory usage over time
  watch -n 30 'docker stats --no-stream'
  ```

- [ ] **Check error rates**
  ```bash
  # Run extended verification
  MONITORING_DURATION=600 ./scripts/verify-deployment.sh
  ```

- [ ] **Review application logs**
  ```bash
  # Check for any unusual patterns
  docker compose logs --since 10m backend | grep -i error
  docker compose logs --since 10m backend | grep -i warn
  ```

### 4. Performance Verification

- [ ] **Check response times**
  ```bash
  # Test backend response time
  time curl http://localhost:3001/health
  # Should be < 1 second
  
  # Test frontend response time
  time curl http://localhost:3000/
  # Should be < 2 seconds
  ```

- [ ] **Verify database performance**
  ```bash
  docker compose exec backend npm run typeorm query \
    "SELECT count(*) FROM jobs"
  # Should return quickly (< 100ms)
  ```

- [ ] **Check resource utilization**
  ```bash
  docker stats --no-stream
  # CPU should be < 80%
  # Memory should be < 80%
  ```

## Common Issues and Solutions

### Issue 1: Pre-Deployment Backup Fails

**Symptoms**:
```
[ERROR] Pre-deployment backup failed
[ERROR] Aborting deployment to prevent data loss
```

**Causes**:
- Insufficient disk space
- Database not accessible
- Missing backup credentials
- Permission issues

**Solutions**:

1. **Check disk space**:
   ```bash
   df -h
   # Free up space if needed
   docker system prune -a
   ```

2. **Verify database is running**:
   ```bash
   docker compose ps postgres
   docker compose logs postgres
   ```

3. **Check backup credentials**:
   ```bash
   # Verify .env has required variables
   grep POSTGRES_PASSWORD .env
   grep MINIO_ACCESS_KEY .env
   grep MINIO_SECRET_KEY .env
   ```

4. **Check permissions**:
   ```bash
   ls -la ./backups
   # Should be writable by current user
   ```

5. **Try manual backup**:
   ```bash
   ./scripts/backup-all.sh
   # Check output for specific error
   ```

### Issue 2: Container Build Fails

**Symptoms**:
```
[ERROR] Container build timed out or failed
```

**Causes**:
- Network connectivity issues
- Docker daemon issues
- Insufficient resources
- Build cache corruption

**Solutions**:

1. **Check Docker daemon**:
   ```bash
   docker info
   systemctl status docker
   ```

2. **Clear build cache**:
   ```bash
   docker builder prune -a
   ```

3. **Build individual services**:
   ```bash
   # Build backend only
   docker compose build backend
   
   # Build pdf-worker only
   docker compose build pdf-worker
   ```

4. **Check network connectivity**:
   ```bash
   ping -c 3 registry.npmjs.org
   ping -c 3 pypi.org
   ```

5. **Increase timeout**:
   ```bash
   # Edit deploy.sh and increase timeout
   # Or build manually first
   docker compose build --no-cache
   ./scripts/deploy.sh
   ```

### Issue 3: Database Migration Fails

**Symptoms**:
```
[ERROR] Database migrations timed out or failed
```

**Causes**:
- Database not accessible
- Migration syntax errors
- Conflicting migrations
- Database locked

**Solutions**:

1. **Check database status**:
   ```bash
   docker compose ps postgres
   docker compose logs postgres
   ```

2. **Verify database connectivity**:
   ```bash
   docker compose exec backend npm run typeorm query "SELECT 1"
   ```

3. **Check migration files**:
   ```bash
   ls -la backend/src/migrations/
   # Look for new migrations
   ```

4. **Run migrations manually**:
   ```bash
   docker compose run --rm backend npm run migration:run
   # Check output for specific error
   ```

5. **Check migration status**:
   ```bash
   docker compose exec backend npm run migration:show
   ```

6. **Revert last migration if needed**:
   ```bash
   docker compose exec backend npm run migration:revert
   ```

### Issue 4: Service Fails Health Check

**Symptoms**:
```
[ERROR] Service backend failed health check after 300s
```

**Causes**:
- Service crashed on startup
- Configuration errors
- Resource constraints
- Dependency not available

**Solutions**:

1. **Check service logs**:
   ```bash
   docker compose logs backend --tail=100
   # Look for error messages
   ```

2. **Check service status**:
   ```bash
   docker compose ps backend
   # Check if container is running
   ```

3. **Test health endpoint manually**:
   ```bash
   curl -v http://localhost:3001/health
   ```

4. **Check environment variables**:
   ```bash
   docker compose exec backend env | grep -E "DATABASE|REDIS|MINIO"
   ```

5. **Check resource usage**:
   ```bash
   docker stats backend --no-stream
   ```

6. **Restart service**:
   ```bash
   docker compose restart backend
   ```

7. **Check dependencies**:
   ```bash
   # Ensure database is healthy
   docker compose ps postgres
   
   # Ensure Redis is healthy
   docker compose ps redis
   ```

### Issue 5: High Error Rate After Deployment

**Symptoms**:
```
[ERROR] Error rate (12.50%) exceeded threshold (10.00%)
[ERROR] TRIGGERING AUTOMATIC ROLLBACK
```

**Causes**:
- New code introduced bugs
- Configuration errors
- Resource exhaustion
- Database issues

**Solutions**:

1. **Let automatic rollback complete**:
   - If using `deploy-with-rollback.sh`, rollback happens automatically
   - Monitor rollback progress

2. **Check error logs**:
   ```bash
   docker compose logs backend --since 10m | grep -i error
   ```

3. **Identify error pattern**:
   ```bash
   # Count error types
   docker compose logs backend --since 10m | grep -i error | sort | uniq -c
   ```

4. **Check recent changes**:
   ```bash
   git log --oneline -10
   git diff HEAD~1..HEAD
   ```

5. **Manual rollback if needed**:
   ```bash
   ./scripts/rollback.sh
   ```

6. **Fix issues and redeploy**:
   - Fix identified issues
   - Test in staging environment
   - Redeploy to production

### Issue 6: Deployment Verification Fails

**Symptoms**:
```
[ERROR] Deployment verification failed
[ERROR] Some services are not healthy. Please check logs.
```

**Causes**:
- Services not fully started
- Configuration issues
- Resource constraints

**Solutions**:

1. **Check which services failed**:
   ```bash
   docker compose ps
   # Look for unhealthy services
   ```

2. **Run verification manually**:
   ```bash
   ./scripts/verify-deployment.sh
   # Check detailed output
   ```

3. **Check specific service**:
   ```bash
   # For backend
   curl http://localhost:3001/health
   docker compose logs backend
   
   # For frontend
   curl http://localhost:3000/
   docker compose logs frontend
   ```

4. **Wait and retry**:
   ```bash
   # Services might need more time
   sleep 60
   ./scripts/verify-deployment.sh
   ```

5. **Check monitoring**:
   - Open Grafana dashboards
   - Check for error spikes
   - Review metrics

## Rollback Procedure

If deployment fails or issues are discovered, follow the rollback procedure:

### Quick Rollback Decision

**Rollback immediately if**:
- Error rate exceeds 10%
- Critical functionality is broken
- Data corruption is detected
- Services are crashing repeatedly

**Consider rollback if**:
- Performance is significantly degraded
- Non-critical features are broken
- Monitoring shows concerning trends

### Rollback Steps

1. **Trigger rollback**:
   ```bash
   ./scripts/rollback.sh
   ```

2. **Confirm rollback when prompted**:
   ```
   WARNING: This will rollback to the previous deployment
   Backup location: ./backups/pre-deployment-20241130_143000
   
   Do you want to proceed with rollback? (yes/no): yes
   ```

3. **Monitor rollback progress**:
   - Watch script output
   - Check Grafana dashboards
   - Verify services are healthy

4. **Verify rollback success**:
   ```bash
   ./scripts/verify-deployment.sh
   ```

For detailed rollback procedures, see [Rollback Runbook](./ROLLBACK_RUNBOOK.md).

## Emergency Procedures

### Complete System Failure

If the entire system is down:

1. **Stop all services**:
   ```bash
   docker compose down
   ```

2. **Restore from backup**:
   ```bash
   # Get last backup location
   ./scripts/backup-all.sh --last
   
   # Follow restore instructions from output
   ```

3. **Start services**:
   ```bash
   docker compose up -d
   ```

4. **Verify system health**:
   ```bash
   ./scripts/verify-deployment.sh
   ```

### Database Corruption

If database is corrupted:

1. **Stop backend services**:
   ```bash
   docker compose stop backend pdf-worker
   ```

2. **Restore database from backup**:
   ```bash
   # Get backup location
   ./scripts/backup-all.sh --last
   
   # Restore database (use command from output)
   gunzip -c <DB_BACKUP_FILE> | docker compose exec -T postgres psql -U schedgen -d schedgen
   ```

3. **Restart services**:
   ```bash
   docker compose start backend pdf-worker
   ```

### Contact Information

**Escalation Path**:
1. Primary: [Team Lead Name] - [Contact]
2. Secondary: [DevOps Lead Name] - [Contact]
3. Emergency: [On-Call Engineer] - [Contact]

## Best Practices

### Before Deployment

1. **Always test in staging first**
   - Deploy to staging environment
   - Run full test suite
   - Verify functionality

2. **Review changes carefully**
   - Check git diff
   - Review database migrations
   - Identify potential risks

3. **Plan deployment timing**
   - Deploy during low-traffic periods
   - Avoid deployments on Fridays
   - Have team available for support

4. **Communicate with team**
   - Notify team of deployment
   - Share deployment plan
   - Ensure backup support available

### During Deployment

1. **Monitor actively**
   - Watch deployment script output
   - Monitor Grafana dashboards
   - Check service logs

2. **Don't interrupt deployment**
   - Let script complete
   - Don't manually restart services
   - Wait for health checks

3. **Document issues**
   - Note any warnings or errors
   - Save deployment logs
   - Record timing information

### After Deployment

1. **Verify thoroughly**
   - Run all verification steps
   - Test critical user flows
   - Monitor for extended period

2. **Monitor for 24 hours**
   - Check Grafana regularly
   - Review error logs
   - Watch resource usage

3. **Document deployment**
   - Record deployment time
   - Note any issues encountered
   - Update team on status

4. **Keep backup accessible**
   - Don't delete pre-deployment backup
   - Keep for at least 7 days
   - Verify backup integrity

## Deployment Checklist Summary

Use this quick checklist during deployment:

**Pre-Deployment**:
- [ ] Access to production server verified
- [ ] Correct directory confirmed
- [ ] Git branch identified
- [ ] Changes reviewed
- [ ] System health checked
- [ ] Disk space verified (>10GB free)
- [ ] Backup credentials verified
- [ ] Team notified
- [ ] Grafana dashboards opened

**Deployment**:
- [ ] Deployment script started
- [ ] Backup creation confirmed
- [ ] Backup integrity verified
- [ ] Code pull successful
- [ ] Container build successful
- [ ] Migrations completed
- [ ] Services updated successfully
- [ ] Health checks passed

**Post-Deployment**:
- [ ] All services running
- [ ] Health endpoints responding
- [ ] Metrics being collected
- [ ] No errors in logs
- [ ] Critical flows tested
- [ ] Grafana dashboards normal
- [ ] Extended monitoring started
- [ ] Team notified of completion

## Related Documentation

- [Rolling Deployment Guide](./ROLLING_DEPLOYMENT.md) - Technical implementation details
- [Deployment Verification Guide](./DEPLOYMENT_VERIFICATION.md) - Verification procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback procedures
- [Pre-Deployment Backup Guide](./PRE_DEPLOYMENT_BACKUP.md) - Backup procedures
- [Backup Runbook](./BACKUP_RUNBOOK.md) - Backup and restore procedures
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production readiness checklist

## Requirements Validation

This runbook satisfies the following requirements:

- **Requirement 12.1**: Database migrations run automatically before starting services
- **Requirement 12.2**: Zero-downtime rolling updates with health check verification
- **Requirement 12.4**: Comprehensive deployment verification with health checks and smoke tests
- **Requirement 12.5**: Automatic pre-deployment backup creation and verification

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-11-30 | 1.0 | Initial deployment runbook | System |

