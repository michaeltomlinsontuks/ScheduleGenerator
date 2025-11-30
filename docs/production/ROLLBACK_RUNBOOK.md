# Rollback Runbook

## Purpose

This runbook provides step-by-step instructions for rolling back the UP Schedule Generator to a previous stable state when deployment issues are detected. It covers decision criteria for when to rollback, the complete rollback procedure, database restore instructions, and verification steps.

**Target Audience**: System administrators, DevOps engineers, and on-call operators

**Related Documents**:
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Standard deployment procedures
- [Rollback Guide](./ROLLBACK_GUIDE.md) - Comprehensive rollback documentation
- [Rollback Quick Reference](./ROLLBACK_QUICK_REFERENCE.md) - Quick command reference
- [Backup Runbook](./BACKUP_RUNBOOK.md) - Backup and restore procedures

## Overview

Rollback restores the system to a previous stable state by:
1. Reverting Docker images to previous versions
2. Restoring database from pre-deployment backup
3. Restoring MinIO file storage from backup
4. Reverting code to previous Git commit
5. Verifying system health after rollback

**Typical rollback time**: 10-25 minutes

**Expected downtime**: 2-5 minutes (during service restart)

## When to Rollback

### Automatic Rollback Triggers

The system automatically triggers rollback when using `deploy-with-rollback.sh` if:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Consecutive health check failures | 3 failures | Immediate rollback |
| High error rate | >10% over 10 min | Rollback after monitoring |
| Deployment script failure | Any error | Immediate rollback |
| Verification failure | Any failure | Immediate rollback |

### Manual Rollback Decision Criteria

**Rollback immediately if**:

- **Critical functionality is broken**: Users cannot upload PDFs, check job status, or download calendars
- **Data corruption detected**: Database integrity checks fail or data is inconsistent
- **Security vulnerability discovered**: New deployment introduces security risk
- **Services crashing repeatedly**: Services restart continuously without stabilizing
- **Error rate exceeds 10%**: More than 10% of requests are failing
- **Database migration failure**: Migration cannot be completed or causes data loss
- **Complete system outage**: All services are down and cannot be recovered

**Consider rollback if**:

- **Performance significantly degraded**: Response times exceed 10 seconds (p95)
- **Non-critical features broken**: Some features work but others fail
- **Memory leaks detected**: Memory usage continuously increases
- **Monitoring shows concerning trends**: Error rates climbing, response times increasing
- **User complaints received**: Multiple users reporting issues
- **Resource exhaustion**: CPU or memory consistently above 90%

**Do NOT rollback if**:

- **Minor cosmetic issues**: UI styling problems that don't affect functionality
- **Single user reports issue**: Cannot be reproduced by others
- **Monitoring shows temporary spike**: Brief spike that resolves quickly
- **Non-production environment**: Issues only in staging/development
- **Issue can be hotfixed quickly**: Simple configuration change can resolve

### Decision Flowchart

```
Issue Detected
    ↓
Is it critical? (data loss, security, complete outage)
    ↓ YES → ROLLBACK IMMEDIATELY
    ↓ NO
    ↓
Can it be hotfixed in < 15 minutes?
    ↓ YES → Attempt hotfix, monitor closely
    ↓ NO
    ↓
Is error rate > 10% or performance degraded > 50%?
    ↓ YES → ROLLBACK
    ↓ NO
    ↓
Monitor for 30 minutes
    ↓
Issue worsening?
    ↓ YES → ROLLBACK
    ↓ NO → Continue monitoring
```

## Pre-Rollback Checklist

Complete this checklist before initiating rollback:

### 1. Confirm Rollback Decision

- [ ] **Issue severity assessed**: Documented why rollback is needed
- [ ] **Team notified**: Informed team of rollback decision
- [ ] **Stakeholders notified**: Users/management aware of rollback
- [ ] **Alternative solutions considered**: Hotfix not viable

### 2. Verify Backup Availability

- [ ] **Check backup information exists**:
  ```bash
  cat .last-deployment-backup
  ```

- [ ] **Verify backup files exist**:
  ```bash
  ./scripts/get-last-backup.sh
  ```

- [ ] **Confirm backup timestamp**: Backup is from the deployment being rolled back

### 3. Document Current State

- [ ] **Capture current logs**:
  ```bash
  docker compose logs > logs-before-rollback-$(date +%Y%m%d_%H%M%S).txt
  ```

- [ ] **Record current Git commit**:
  ```bash
  git rev-parse HEAD > commit-before-rollback.txt
  ```

- [ ] **Screenshot Grafana dashboards**: Save current metrics state

- [ ] **Document error messages**: Copy specific errors for post-mortem

### 4. Prepare for Rollback

- [ ] **Ensure Docker is running**:
  ```bash
  docker ps
  ```

- [ ] **Check disk space** (need space for rebuild):
  ```bash
  df -h
  # Ensure at least 5GB free
  ```

- [ ] **Have monitoring ready**: Open Grafana dashboards

- [ ] **Backup operator on standby**: Someone available to help if needed

## Rollback Procedure

### Step 1: Initiate Rollback

**Command**:
```bash
cd /path/to/up-schedule-generator
./scripts/rollback.sh
```

**Expected output**:
```
=== Automatic Rollback Script ===
Started at: [timestamp]

=== Pre-flight Checks ===
[INFO] Pre-flight checks passed

=== Step 1: Loading backup information ===
[INFO] Backup information loaded:
[INFO]   Deployment timestamp: 20241130_143022
[INFO]   Backup directory: ./backups/pre-deployment-20241130_143022
[INFO]   Git commit: abc123def456
[INFO]   Git branch: main
```

### Step 2: Confirm Rollback

**Prompt**:
```
⚠️  WARNING: This will rollback to the previous deployment
⚠️  Current data will be replaced with backup from: 20241130_143022
⚠️  Git commit: abc123def456

Are you sure you want to proceed with rollback? (yes/no):
```

**Action**: Type `yes` and press Enter

**For non-interactive rollback**:
```bash
export ROLLBACK_CONFIRM="yes"
./scripts/rollback.sh
```

### Step 3: Monitor Rollback Progress

The script will execute these steps automatically:

#### 3.1 Stop All Services
```
[STEP] Step 3: Stopping all services
[INFO] Stopping services gracefully...
[INFO] All services stopped
```

**What's happening**: All Docker containers are stopped gracefully

**Duration**: 30-60 seconds

#### 3.2 Restore Database
```
[STEP] Step 4: Restoring database from backup
[INFO] Starting PostgreSQL for restore...
[INFO] Waiting for PostgreSQL to be ready...
[INFO] Terminating existing database connections...
[INFO] Dropping and recreating database...
[INFO] Restoring database from backup: ./backups/.../db_*.sql.gz
[INFO] Database restored successfully
[INFO] Database verification passed (15 tables found)
```

**What's happening**: 
- PostgreSQL starts
- Existing database dropped
- Backup restored
- Integrity verified

**Duration**: 2-5 minutes depending on database size

#### 3.3 Restore MinIO Volumes
```
[STEP] Step 5: Restoring MinIO volumes from backup
[INFO] Stopping MinIO...
[INFO] Restoring MinIO data from backup: ./backups/.../minio_*.tar.gz
[INFO] MinIO data restored successfully
```

**What's happening**: MinIO file storage restored from backup

**Duration**: 1-3 minutes depending on file count

#### 3.4 Revert Git Commit
```
[STEP] Step 6: Reverting to previous Git commit
[INFO] Current commit: def456abc789
[INFO] Reverting to commit: abc123def456
[INFO] Git checkout successful
```

**What's happening**: Code reverted to previous version

**Duration**: 5-10 seconds

#### 3.5 Rebuild and Start Services
```
[STEP] Step 7: Rebuilding and starting services
[INFO] Rebuilding containers...
[INFO] Containers rebuilt successfully
[INFO] Starting all services...
[INFO] Services started, waiting for health checks...
```

**What's happening**: 
- Containers rebuilt from reverted code
- All services started
- Health checks begin

**Duration**: 5-10 minutes

#### 3.6 Verify Rollback
```
[STEP] Step 8: Verifying rollback success
[INFO] Waiting for services to become healthy...
[INFO] Service postgres is healthy
[INFO] Service redis is healthy
[INFO] Service backend is healthy
[INFO] Service frontend is healthy
[INFO] Service pdf-worker is healthy
[INFO] All critical services are healthy
[INFO] Running basic smoke tests...
[INFO] ✓ Backend health check passed
[INFO] ✓ Frontend accessibility check passed
[INFO] ✓ Database connectivity check passed
```

**What's happening**: Automated verification of rollback success

**Duration**: 1-2 minutes

### Step 4: Rollback Complete

**Success message**:
```
[STEP] Rollback Complete

[INFO] ✓ All services stopped and restarted
[INFO] ✓ Database restored from backup
[INFO] ✓ MinIO volumes restored from backup
[INFO] ✓ Code reverted to previous commit
[INFO] ✓ Services verified healthy

[INFO] Rollback completed successfully at: [timestamp]
[INFO] System restored to state from: 20241130_143022
[INFO] Git commit: abc123def456
```

## Database Restore Instructions

If you need to restore the database manually (e.g., rollback script failed):

### Manual Database Restore Procedure

#### Step 1: Get Backup Location

```bash
# Get backup information
./scripts/get-last-backup.sh

# Note the DB_BACKUP_FILE path
# Example: ./backups/pre-deployment-20241130_143022/db_20241130_143022.sql.gz
```

#### Step 2: Stop Backend Services

```bash
# Stop services that use the database
docker compose stop backend pdf-worker
```

#### Step 3: Ensure PostgreSQL is Running

```bash
# Start PostgreSQL if not running
docker compose up -d postgres

# Wait for it to be ready
sleep 10

# Verify it's running
docker compose ps postgres
```

#### Step 4: Terminate Active Connections

```bash
# Terminate all connections to the database
docker compose exec postgres psql -U schedgen -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'schedgen' AND pid <> pg_backend_pid();"
```

#### Step 5: Drop and Recreate Database

```bash
# Drop existing database
docker compose exec postgres psql -U schedgen -d postgres -c \
  "DROP DATABASE IF EXISTS schedgen;"

# Create fresh database
docker compose exec postgres psql -U schedgen -d postgres -c \
  "CREATE DATABASE schedgen;"
```

#### Step 6: Restore from Backup

```bash
# Restore database from backup file
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

**Expected output**: SQL commands executing (may take 1-5 minutes)

#### Step 7: Verify Restore

```bash
# Check tables exist
docker compose exec postgres psql -U schedgen -d schedgen -c "\dt"

# Check row counts
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT 'jobs' as table_name, COUNT(*) as row_count FROM jobs
   UNION ALL
   SELECT 'users', COUNT(*) FROM users;"
```

#### Step 8: Restart Services

```bash
# Restart backend services
docker compose start backend pdf-worker

# Verify health
curl http://localhost:3001/health
```

### Database Restore Troubleshooting

**Problem**: Backup file not found

```bash
# List available backups
ls -lh ./backups/

# Use specific backup
gunzip -c ./backups/pre-deployment-20241130_143022/db_20241130_143022.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

**Problem**: Permission denied

```bash
# Check file permissions
ls -l ./backups/pre-deployment-*/db_*.sql.gz

# Fix permissions if needed
chmod 644 ./backups/pre-deployment-*/db_*.sql.gz
```

**Problem**: Database restore hangs

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Check disk space
df -h

# Check PostgreSQL is not overloaded
docker stats postgres --no-stream
```

**Problem**: Restore completes but tables missing

```bash
# Verify backup file integrity
gzip -t ./backups/pre-deployment-*/db_*.sql.gz

# Check backup file content
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | head -100

# Try restore again with verbose output
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen -v ON_ERROR_STOP=1
```

## Verification Steps

After rollback completes, perform these verification steps:

### 1. Service Health Verification (Required)

**Check all services are running**:
```bash
docker compose ps
```

**Expected**: All services show "Up" and "healthy" status

**Check health endpoints**:
```bash
# Backend health
curl -f http://localhost:3001/health || echo "FAILED"

# Frontend
curl -f http://localhost:3000/ || echo "FAILED"

# Database health
curl -f http://localhost:3001/health/db || echo "FAILED"
```

**Expected**: All return HTTP 200 OK

### 2. Database Integrity Verification (Required)

**Check tables exist**:
```bash
docker compose exec postgres psql -U schedgen -d schedgen -c "\dt"
```

**Expected**: List of tables displayed (jobs, users, migrations, etc.)

**Check data integrity**:
```bash
# Check job count
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT COUNT(*) FROM jobs;"

# Check recent jobs
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT id, status, pdf_type, created_at FROM jobs ORDER BY created_at DESC LIMIT 5;"
```

**Expected**: Data returned without errors

### 3. File Storage Verification (Required)

**Check MinIO is accessible**:
```bash
curl -f http://localhost:9001/ || echo "FAILED"
```

**Check bucket exists**:
```bash
docker compose exec minio mc ls local/
```

**Expected**: Bucket "schedgen" listed

### 4. Functional Verification (Required)

**Test critical user flows**:

#### Upload Flow Test
```bash
# Test upload endpoint
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf" \
  -F "pdfType=WEEKLY"
```

**Expected**: Returns job ID

#### Job Status Test
```bash
# Get job metrics
curl http://localhost:3001/api/jobs/metrics
```

**Expected**: Returns queue metrics JSON

#### Frontend Test
1. Open http://localhost:3000 in browser
2. Verify homepage loads
3. Click "Upload PDF"
4. Verify upload page loads

### 5. Monitoring Verification (Recommended)

**Check Grafana dashboards**:
```bash
# Open Grafana
open http://localhost:3002
```

**Verify**:
- System Overview dashboard shows normal metrics
- Error rate is low (< 1%)
- Response times are normal (< 2s p95)
- No alerts firing

**Check Prometheus**:
```bash
curl http://localhost:9090/-/healthy
```

**Expected**: Returns "Prometheus is Healthy"

### 6. Log Verification (Recommended)

**Check for errors in logs**:
```bash
# Backend logs
docker compose logs --since 10m backend | grep -i error

# Frontend logs
docker compose logs --since 10m frontend | grep -i error

# PDF Worker logs
docker compose logs --since 10m pdf-worker | grep -i error
```

**Expected**: No critical errors (some warnings may be normal)

### 7. Performance Verification (Recommended)

**Test response times**:
```bash
# Backend response time
time curl http://localhost:3001/health
# Should be < 1 second

# Frontend response time
time curl http://localhost:3000/
# Should be < 2 seconds
```

**Check resource usage**:
```bash
docker stats --no-stream
```

**Expected**: 
- CPU < 80%
- Memory < 80%

### Verification Checklist

Use this checklist to track verification:

- [ ] All services running and healthy
- [ ] Health endpoints responding
- [ ] Database tables exist and accessible
- [ ] MinIO storage accessible
- [ ] Upload endpoint functional
- [ ] Job queue operational
- [ ] Frontend loads correctly
- [ ] Grafana dashboards normal
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] Resource usage normal

## Troubleshooting Rollback Issues

### Issue 1: Rollback Script Fails - Backup Not Found

**Symptoms**:
```
[ERROR] No backup information found at .last-deployment-backup
[ERROR] Cannot perform rollback without backup information
```

**Solution**:

1. **List available backups**:
   ```bash
   ls -lh ./backups/
   ```

2. **Identify most recent pre-deployment backup**:
   ```bash
   ls -lt ./backups/ | grep pre-deployment | head -1
   ```

3. **Manually create backup info file**:
   ```bash
   # Replace with your backup directory
   BACKUP_DIR="./backups/pre-deployment-20241130_143022"
   
   cat > .last-deployment-backup <<EOF
   DEPLOYMENT_TIMESTAMP=20241130_143022
   BACKUP_DIR=${BACKUP_DIR}
   DB_BACKUP_FILE=${BACKUP_DIR}/db_20241130_143022.sql.gz
   MINIO_BACKUP_FILE=${BACKUP_DIR}/minio_20241130_143022.tar.gz
   GIT_COMMIT=$(git rev-parse HEAD~1)
   GIT_BRANCH=main
   EOF
   ```

4. **Retry rollback**:
   ```bash
   ./scripts/rollback.sh
   ```

### Issue 2: Database Restore Fails

**Symptoms**:
```
[ERROR] Database restore failed
```

**Solution**:

1. **Check backup file integrity**:
   ```bash
   gzip -t ./backups/pre-deployment-*/db_*.sql.gz
   ```

2. **Check PostgreSQL logs**:
   ```bash
   docker compose logs postgres --tail=100
   ```

3. **Verify PostgreSQL is running**:
   ```bash
   docker compose ps postgres
   docker compose restart postgres
   sleep 10
   ```

4. **Try manual restore** (see Database Restore Instructions above)

5. **If restore still fails, check disk space**:
   ```bash
   df -h
   # Free up space if needed
   docker system prune -a
   ```

### Issue 3: Services Won't Start After Rollback

**Symptoms**:
```
[ERROR] Failed to start services
```

**Solution**:

1. **Check Docker daemon**:
   ```bash
   docker info
   systemctl status docker
   ```

2. **Check disk space**:
   ```bash
   df -h
   ```

3. **Check service logs**:
   ```bash
   docker compose logs --tail=100
   ```

4. **Try starting services individually**:
   ```bash
   # Start infrastructure first
   docker compose up -d postgres redis minio
   sleep 30
   
   # Then application services
   docker compose up -d backend pdf-worker frontend
   ```

5. **Check for port conflicts**:
   ```bash
   netstat -tulpn | grep -E '3000|3001|5432|6379|9000'
   ```

### Issue 4: Health Checks Fail After Rollback

**Symptoms**:
```
[ERROR] Service backend failed health check after 300s
```

**Solution**:

1. **Check service logs for errors**:
   ```bash
   docker compose logs backend --tail=100
   ```

2. **Check environment variables**:
   ```bash
   docker compose exec backend env | grep -E "DATABASE|REDIS|MINIO"
   ```

3. **Test health endpoint manually**:
   ```bash
   curl -v http://localhost:3001/health
   ```

4. **Check dependencies are healthy**:
   ```bash
   docker compose ps postgres redis
   ```

5. **Restart service**:
   ```bash
   docker compose restart backend
   sleep 30
   curl http://localhost:3001/health
   ```

### Issue 5: Git Checkout Fails

**Symptoms**:
```
[ERROR] Git checkout failed
```

**Solution**:

1. **Check git status**:
   ```bash
   git status
   ```

2. **Stash uncommitted changes**:
   ```bash
   git stash push -m "Stash before rollback"
   ```

3. **Force checkout**:
   ```bash
   source .last-deployment-backup
   git checkout -f ${GIT_COMMIT}
   ```

4. **If commit doesn't exist, use branch**:
   ```bash
   git fetch origin
   git checkout -f origin/main
   ```

### Issue 6: Partial Rollback (Interrupted)

**Symptoms**: Rollback was interrupted and system is in inconsistent state

**Solution**:

1. **Check rollback progress** (from script output):
   ```
   Rollback progress:
     - Services stopped: true
     - Database restored: false
     - Images reverted: false
   ```

2. **Resume from where it stopped**:

   **If services stopped but database not restored**:
   ```bash
   # Start PostgreSQL
   docker compose up -d postgres
   sleep 10
   
   # Restore database manually (see Database Restore Instructions)
   
   # Continue with rollback script
   ./scripts/rollback.sh
   ```

   **If database restored but services not started**:
   ```bash
   # Just restart services
   docker compose down
   docker compose up -d
   
   # Verify
   ./scripts/verify-deployment.sh
   ```

### Issue 7: Rollback Completes But System Still Has Issues

**Symptoms**: Rollback script reports success but issues persist

**Solution**:

1. **Run comprehensive verification**:
   ```bash
   ./scripts/verify-deployment.sh
   ```

2. **Check if issue existed before deployment**:
   - Review pre-deployment logs
   - Check if backup has the same issue

3. **Consider rolling back to earlier backup**:
   ```bash
   # List all backups
   ls -lt ./backups/
   
   # Manually set backup info to earlier backup
   # Then run rollback again
   ```

4. **If issue persists, perform complete system recovery** (see Emergency Procedures)

## Emergency Procedures

### Complete System Recovery

If rollback fails completely and system is unusable:

#### Step 1: Stop Everything

```bash
docker compose down --volumes
```

**Warning**: This removes all volumes. Only use if rollback failed.

#### Step 2: Restore Database

```bash
# Start only PostgreSQL
docker compose up -d postgres
sleep 10

# Restore from backup
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

#### Step 3: Restore MinIO

```bash
# Restore MinIO volumes
docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups/pre-deployment-*:/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/minio_*.tar.gz -C /data'
```

#### Step 4: Revert Code

```bash
# Get commit from backup
source .last-deployment-backup

# Checkout previous commit
git checkout -f $GIT_COMMIT
```

#### Step 5: Rebuild Everything

```bash
# Rebuild containers from scratch
docker compose build --no-cache

# Start all services
docker compose up -d

# Wait for services to start
sleep 60

# Verify
./scripts/verify-deployment.sh
```

### Emergency Rollback Without Backup

**Warning**: This should only be used as absolute last resort. Data loss may occur.

#### Step 1: Identify Last Known Good Commit

```bash
# View recent commits
git log --oneline -20

# Identify last known good commit (before deployment)
# Example: abc123d
```

#### Step 2: Stop Services

```bash
docker compose down
```

#### Step 3: Checkout Last Good Commit

```bash
git checkout -f abc123d
```

#### Step 4: Rebuild and Start

```bash
# Rebuild containers
docker compose build --no-cache

# Start services
docker compose up -d

# Wait and verify
sleep 60
./scripts/verify-deployment.sh
```

#### Step 5: Assess Data Loss

```bash
# Check database state
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT COUNT(*) FROM jobs WHERE created_at > NOW() - INTERVAL '1 day';"

# Check MinIO files
docker compose exec minio mc ls local/schedgen/
```

**Note**: Any data created between last backup and rollback will be lost.

## Post-Rollback Actions

### Immediate Actions (0-30 minutes)

1. **Notify team of rollback completion**:
   - Post in team chat
   - Include rollback timestamp
   - Confirm system is stable

2. **Monitor system closely**:
   - Watch Grafana dashboards
   - Check error logs every 5 minutes
   - Monitor resource usage

3. **Verify critical user flows**:
   - Test upload functionality
   - Test job processing
   - Test calendar download

4. **Document rollback**:
   - Record rollback time
   - Note any issues encountered
   - Save rollback logs

### Short-term Actions (1-24 hours)

1. **Extended monitoring**:
   - Check Grafana every hour
   - Review error logs regularly
   - Monitor user reports

2. **Investigate root cause**:
   - Review deployment logs
   - Analyze error messages
   - Identify what went wrong

3. **Plan fix**:
   - Document required changes
   - Create fix plan
   - Test fix in staging

4. **Communicate with stakeholders**:
   - Explain what happened
   - Share timeline for fix
   - Provide status updates

### Long-term Actions (1-7 days)

1. **Post-mortem meeting**:
   - Review what went wrong
   - Identify improvements
   - Update procedures

2. **Implement improvements**:
   - Add missing tests
   - Improve monitoring
   - Update documentation

3. **Test fix thoroughly**:
   - Deploy to staging
   - Run full test suite
   - Verify fix works

4. **Plan redeployment**:
   - Schedule deployment
   - Prepare team
   - Have rollback plan ready

## Best Practices

### Before Rollback

1. **Assess severity carefully**: Don't rollback for minor issues
2. **Document the issue**: Capture logs and errors
3. **Notify team**: Ensure everyone knows rollback is happening
4. **Verify backup exists**: Confirm backup files are available
5. **Have monitoring ready**: Open Grafana dashboards

### During Rollback

1. **Don't interrupt**: Let rollback script complete
2. **Monitor progress**: Watch script output
3. **Keep logs**: Save rollback output
4. **Stay calm**: Follow procedures step by step
5. **Ask for help if needed**: Don't hesitate to escalate

### After Rollback

1. **Verify thoroughly**: Complete all verification steps
2. **Monitor extended period**: Watch for 24 hours
3. **Document everything**: Record what happened
4. **Investigate root cause**: Understand why deployment failed
5. **Plan improvements**: Prevent similar issues

## Rollback Checklist

Use this checklist during rollback:

**Pre-Rollback**:
- [ ] Rollback decision confirmed
- [ ] Team notified
- [ ] Backup availability verified
- [ ] Current state documented
- [ ] Monitoring prepared

**Rollback Execution**:
- [ ] Rollback script started
- [ ] Rollback confirmed
- [ ] Services stopped
- [ ] Database restored
- [ ] MinIO restored
- [ ] Code reverted
- [ ] Services rebuilt
- [ ] Services started
- [ ] Health checks passed

**Post-Rollback**:
- [ ] All services healthy
- [ ] Database integrity verified
- [ ] File storage accessible
- [ ] Critical flows tested
- [ ] Monitoring normal
- [ ] No critical errors
- [ ] Team notified of completion
- [ ] Root cause investigation started

## Related Documentation

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Standard deployment procedures
- [Rollback Guide](./ROLLBACK_GUIDE.md) - Comprehensive rollback documentation
- [Rollback Quick Reference](./ROLLBACK_QUICK_REFERENCE.md) - Quick command reference
- [Backup Runbook](./BACKUP_RUNBOOK.md) - Backup and restore procedures
- [Deployment Verification Guide](./DEPLOYMENT_VERIFICATION.md) - Verification procedures
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production readiness checklist

## Requirements Validation

This runbook satisfies the following requirements:

- **Requirement 12.3**: Automatic rollback on deployment failure with clear procedures
- **Requirement 9.1**: Database backup and restore procedures
- **Requirement 9.2**: Backup integrity verification
- **Requirement 9.3**: Recovery time < 1 hour (typical rollback: 10-25 minutes)

## Support and Escalation

### When to Escalate

Escalate to senior team members if:
- Rollback fails after multiple attempts
- Data corruption is suspected
- System cannot be recovered
- Rollback takes longer than 1 hour
- Unsure about next steps

### Contact Information

**Escalation Path**:
1. **Primary**: Team Lead - [Contact]
2. **Secondary**: DevOps Lead - [Contact]
3. **Emergency**: On-Call Engineer - [Contact]

**When contacting support, provide**:
- Rollback script output
- Service logs (`docker compose logs`)
- Backup information (`./scripts/get-last-backup.sh`)
- Error messages
- Steps already attempted

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-11-30 | 1.0 | Initial rollback runbook | System |
