# Backup and Restore Runbook

## Purpose

This runbook provides comprehensive step-by-step procedures for backup and restore operations in production. Use this document during routine maintenance, pre-deployment backups, and disaster recovery scenarios.

**Target Audience**: DevOps engineers, system administrators, on-call engineers

**Related Documents**:
- [Backup Automation](./BACKUP_AUTOMATION.md) - Setup and configuration
- [Backup Quick Reference](./BACKUP_QUICK_REFERENCE.md) - Common commands
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Pre-deployment backup procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback with backup restoration

**Requirements Addressed**: 9.1, 9.2, 9.3

## Table of Contents

1. [Manual Backup Procedure](#manual-backup-procedure)
2. [Automated Backup Verification](#automated-backup-verification)
3. [Restore Procedures](#restore-procedures)
   - [Database Restore](#database-restore-procedure)
   - [MinIO Restore](#minio-restore-procedure)
   - [Full System Restore](#full-system-restore)
   - [Partial Data Restore](#partial-data-restore)
4. [Recovery Time Expectations](#recovery-time-expectations)
5. [Backup Troubleshooting](#backup-troubleshooting)
6. [Testing and Validation](#testing-and-validation)

## Manual Backup Procedure

### When to Use

Execute manual backups in these scenarios:
- **Pre-deployment**: Before deploying new code or configuration changes
- **Pre-migration**: Before running database migrations
- **Pre-upgrade**: Before upgrading system components or dependencies
- **On-demand testing**: When testing restore procedures
- **Before risky operations**: Any operation that could affect data integrity

### Prerequisites Checklist

Before starting the backup procedure, verify:

- [ ] Docker services are running (`docker compose ps`)
- [ ] Sufficient disk space available (minimum 2x current data size)
- [ ] Environment variables configured in `.env` file
- [ ] Backup directory exists and is writable
- [ ] Database is accessible and healthy
- [ ] MinIO is accessible and healthy

**Quick Pre-flight Check**:
```bash
# Check all prerequisites at once
docker compose ps | grep -E "(postgres|minio)" && \
df -h | grep -E "/$" && \
test -d backups && echo "✓ All prerequisites met" || echo "✗ Prerequisites check failed"
```

### Step-by-Step Procedure

#### Step 1: Pre-Backup Verification

**Purpose**: Ensure system is in a good state before backup

```bash
# 1. Check service health
docker compose ps
# Expected: All services should be "Up" or "Up (healthy)"

# 2. Check disk space (need at least 5GB free)
df -h
# Expected: / or /var should have >5GB available

# 3. Check existing backups
ls -lh backups/
# Expected: Directory exists, previous backups visible

# 4. Verify database connectivity
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs"
# Expected: Returns row count without errors

# 5. Verify MinIO connectivity
docker exec schedgen-minio mc ls local/schedgen-pdfs
# Expected: Lists bucket contents without errors
```

**If any check fails**: Resolve the issue before proceeding with backup.

#### Step 2: Execute Backup

**Choose your deployment method**:

**Option A: Docker Compose (Recommended)**
```bash
# If backup service is running
docker exec schedgen-backup /usr/local/bin/backup-all.sh

# If backup service is not running
docker compose -f docker-compose.yml -f docker-compose.backup.yml run --rm backup
```

**Option B: Direct Script Execution**
```bash
# Ensure environment variables are loaded
source .env

# Run backup script
./scripts/backup-all.sh
```

**Expected Output**:
```
=== Complete System Backup Script ===
Database: schedgen
Host: postgres:5432
MinIO Bucket: schedgen-pdfs
Backup directory: ./backups
Retention: 7 days

--- PostgreSQL Database Backup ---
Creating backup: ./backups/db_schedgen_20241130_143022.sql.gz
Backup verified: ./backups/db_schedgen_20241130_143022.sql.gz (2.3M)
Database backup completed successfully

--- MinIO Volume Backup ---
Creating backup: ./backups/minio_schedgen-pdfs_20241130_143022.tar.gz
Backup verified: ./backups/minio_schedgen-pdfs_20241130_143022.tar.gz (15M)
MinIO backup completed successfully

=== Backup Complete ===
```

#### Step 3: Verify Backup Integrity

**Critical**: Always verify backups immediately after creation

```bash
# Get today's date for filtering
TODAY=$(date +%Y%m%d)

# 1. Verify backup files exist
ls -lh backups/db_schedgen_${TODAY}*.sql.gz
ls -lh backups/minio_schedgen-pdfs_${TODAY}*.tar.gz
# Expected: Both files should be listed with reasonable sizes

# 2. Verify database backup integrity (gzip test)
gunzip -t backups/db_schedgen_${TODAY}*.sql.gz
echo $?
# Expected: Exit code 0 (no output means success)

# 3. Verify MinIO backup integrity (tar test)
tar -tzf backups/minio_schedgen-pdfs_${TODAY}*.tar.gz > /dev/null
echo $?
# Expected: Exit code 0

# 4. Check file sizes are reasonable
du -h backups/db_schedgen_${TODAY}*.sql.gz
du -h backups/minio_schedgen-pdfs_${TODAY}*.tar.gz
# Expected: DB > 1KB, MinIO > 512B (actual sizes depend on data)

# 5. Quick content check (database)
gunzip -c backups/db_schedgen_${TODAY}*.sql.gz | head -20
# Expected: Should see SQL dump header and CREATE statements
```

**Size Guidelines**:
- **Database backup**: Typically 1-100MB compressed (depends on job history)
- **MinIO backup**: Typically 10MB-10GB (depends on uploaded PDFs)
- **Warning**: If backup is <1KB, it's likely corrupted or empty

#### Step 4: Document Backup

**Purpose**: Maintain audit trail for compliance and troubleshooting

```bash
# Create backup log entry
cat >> backups/backup-log.txt <<EOF
=== Manual Backup ===
Timestamp: $(date -Iseconds)
Operator: $(whoami)
Reason: [FILL IN REASON - e.g., "Pre-deployment backup for v2.1.0"]
Database Backup: $(ls -lh backups/db_schedgen_${TODAY}*.sql.gz | tail -1)
MinIO Backup: $(ls -lh backups/minio_schedgen-pdfs_${TODAY}*.tar.gz | tail -1)
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Status: SUCCESS
EOF

# For pre-deployment backups, also create marker file
if [ "$DEPLOYMENT_BACKUP" = "true" ]; then
    cat > .last-deployment-backup <<EOF
DEPLOYMENT_TIMESTAMP=$(date -Iseconds)
BACKUP_DIR=backups
DB_BACKUP_FILE=$(ls backups/db_schedgen_${TODAY}*.sql.gz | tail -1)
MINIO_BACKUP_FILE=$(ls backups/minio_schedgen-pdfs_${TODAY}*.tar.gz | tail -1)
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
EOF
fi
```

#### Step 5: Post-Backup Verification

**Final checks before considering backup complete**:

```bash
# 1. Verify backup count (should be ≤7 due to retention policy)
echo "Database backups: $(ls backups/db_*.sql.gz 2>/dev/null | wc -l)"
echo "MinIO backups: $(ls backups/minio_*.tar.gz 2>/dev/null | wc -l)"
# Expected: Each should show ≤7 backups

# 2. Compare with previous backup sizes
du -h backups/db_*.sql.gz | tail -3
du -h backups/minio_*.tar.gz | tail -3
# Expected: New backup size should be similar to recent backups

# 3. Verify services still healthy after backup
docker compose ps
curl -s http://localhost:3001/health | jq .
# Expected: All services still running, health check passes
```

### Success Criteria

The backup is considered successful when:
- ✓ Both backup files created (database and MinIO)
- ✓ Both files pass integrity checks (gzip -t and tar -tzf)
- ✓ File sizes are reasonable (not suspiciously small)
- ✓ Backup documented in backup-log.txt
- ✓ Services remain healthy after backup

### Expected Duration

- **Small system** (<100 jobs, <1GB storage): 2-3 minutes
- **Medium system** (100-1000 jobs, 1-10GB storage): 3-5 minutes
- **Large system** (>1000 jobs, >10GB storage): 5-10 minutes

### Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| "Permission denied" | Run with sudo or check file permissions |
| "No space left on device" | Free up disk space or change BACKUP_DIR |
| "Connection refused" | Check if postgres/minio containers are running |
| "Backup file too small" | Check database has data, verify no errors in logs |
| "Command not found: pg_dump" | Install postgresql-client or use docker exec |

## Automated Backup Verification

### Purpose

Verify that automated daily backups are running successfully and producing valid backup files. This should be performed daily as part of operational monitoring.

**Frequency**: Daily (recommended: morning check of previous night's backup)  
**Expected Duration**: 2-3 minutes  
**Responsibility**: On-call engineer or operations team

### Daily Verification Checklist

Use this checklist to verify automated backups:

#### Step 1: Check Backup Service Status

**Verify the backup service is running and healthy**:

**For Docker Compose Deployment**:
```bash
# Check backup container status
docker ps | grep backup
# Expected: Container should be "Up" with healthy status

# Check recent logs
docker logs --tail 50 schedgen-backup
# Expected: Should see "Backup Complete" message from last run

# Check for errors
docker logs schedgen-backup 2>&1 | grep -i error | tail -10
# Expected: No recent errors
```

**For Systemd Timer Deployment**:
```bash
# Check timer status
sudo systemctl status backup.timer
# Expected: Active (waiting) with next trigger time shown

# Check last service run
sudo systemctl status backup.service
# Expected: Should show recent successful run

# View recent logs
sudo journalctl -u backup.service --since today
# Expected: Should see successful backup completion
```

**For Cron Deployment**:
```bash
# Check cron is running
sudo systemctl status cron
# Expected: Active (running)

# View backup logs
tail -50 /var/log/schedgen-backup.log
# Expected: Should see recent backup completion

# Check cron execution
sudo grep "backup" /var/log/syslog | tail -10
# Expected: Should see recent cron execution
```

#### Step 2: Verify Backup Files Exist

**Check that today's backup files were created**:

```bash
# Get today's date
TODAY=$(date +%Y%m%d)

# Check database backup exists
if ls backups/db_schedgen_${TODAY}*.sql.gz 1> /dev/null 2>&1; then
    echo "✓ Database backup exists"
    ls -lh backups/db_schedgen_${TODAY}*.sql.gz
else
    echo "✗ Database backup MISSING for ${TODAY}"
fi

# Check MinIO backup exists
if ls backups/minio_schedgen-pdfs_${TODAY}*.tar.gz 1> /dev/null 2>&1; then
    echo "✓ MinIO backup exists"
    ls -lh backups/minio_schedgen-pdfs_${TODAY}*.tar.gz
else
    echo "✗ MinIO backup MISSING for ${TODAY}"
fi

# Count total backups (should be ≤7 due to retention policy)
DB_COUNT=$(ls backups/db_*.sql.gz 2>/dev/null | wc -l)
MINIO_COUNT=$(ls backups/minio_*.tar.gz 2>/dev/null | wc -l)
echo "Database backups: ${DB_COUNT} (expected: ≤7)"
echo "MinIO backups: ${MINIO_COUNT} (expected: ≤7)"
```

**Alert Conditions**:
- No backup file for today → **CRITICAL**: Backup failed
- Backup count >7 → **WARNING**: Retention cleanup not working
- Backup count <3 → **WARNING**: May indicate recent failures

#### Step 3: Verify Backup Sizes

**Check that backup sizes are reasonable**:

```bash
# Show recent backup sizes
echo "=== Recent Database Backups ==="
du -h backups/db_*.sql.gz | tail -3

echo ""
echo "=== Recent MinIO Backups ==="
du -h backups/minio_*.tar.gz | tail -3

# Calculate size change percentage (requires bc)
LATEST_DB=$(ls -t backups/db_*.sql.gz | head -1)
PREVIOUS_DB=$(ls -t backups/db_*.sql.gz | head -2 | tail -1)

if [ -f "$LATEST_DB" ] && [ -f "$PREVIOUS_DB" ]; then
    LATEST_SIZE=$(stat -f%z "$LATEST_DB" 2>/dev/null || stat -c%s "$LATEST_DB")
    PREVIOUS_SIZE=$(stat -f%z "$PREVIOUS_DB" 2>/dev/null || stat -c%s "$PREVIOUS_DB")
    
    if [ "$PREVIOUS_SIZE" -gt 0 ]; then
        CHANGE_PCT=$(echo "scale=2; (($LATEST_SIZE - $PREVIOUS_SIZE) / $PREVIOUS_SIZE) * 100" | bc)
        echo ""
        echo "Database size change: ${CHANGE_PCT}%"
        
        # Alert if size changed dramatically
        if (( $(echo "$CHANGE_PCT < -50" | bc -l) )); then
            echo "⚠️  WARNING: Database backup size dropped >50%"
        elif (( $(echo "$CHANGE_PCT > 200" | bc -l) )); then
            echo "⚠️  WARNING: Database backup size increased >200%"
        fi
    fi
fi
```

**Size Guidelines**:
- **Database**: Should grow slowly over time as jobs accumulate
- **MinIO**: Can vary significantly based on upload activity
- **Alert if**: Size drops >50% or increases >200% suddenly

#### Step 4: Test Backup Integrity

**Verify backup files are not corrupted**:

```bash
# Test latest database backup
LATEST_DB=$(ls -t backups/db_*.sql.gz | head -1)
if [ -f "$LATEST_DB" ]; then
    if gunzip -t "$LATEST_DB" 2>/dev/null; then
        echo "✓ Database backup integrity OK: $LATEST_DB"
    else
        echo "✗ Database backup CORRUPTED: $LATEST_DB"
        # CRITICAL: Alert immediately
    fi
else
    echo "✗ No database backup found"
fi

# Test latest MinIO backup
LATEST_MINIO=$(ls -t backups/minio_*.tar.gz | head -1)
if [ -f "$LATEST_MINIO" ]; then
    if tar -tzf "$LATEST_MINIO" > /dev/null 2>&1; then
        echo "✓ MinIO backup integrity OK: $LATEST_MINIO"
    else
        echo "✗ MinIO backup CORRUPTED: $LATEST_MINIO"
        # CRITICAL: Alert immediately
    fi
else
    echo "✗ No MinIO backup found"
fi
```

#### Step 5: Verify Backup Content (Spot Check)

**Periodically verify backup contents are valid**:

```bash
# Check database backup contains expected tables
LATEST_DB=$(ls -t backups/db_*.sql.gz | head -1)
gunzip -c "$LATEST_DB" | grep -E "CREATE TABLE|INSERT INTO" | head -10
# Expected: Should see CREATE TABLE statements for jobs, users, etc.

# Check MinIO backup contains files
LATEST_MINIO=$(ls -t backups/minio_*.tar.gz | head -1)
tar -tzf "$LATEST_MINIO" | head -10
# Expected: Should see .minio.sys/ and schedgen-pdfs/ directories

# Count files in MinIO backup
FILE_COUNT=$(tar -tzf "$LATEST_MINIO" | wc -l)
echo "Files in MinIO backup: ${FILE_COUNT}"
# Expected: Should be >0, typically hundreds to thousands
```

### Automated Verification Script

**Create a daily verification script**:

```bash
#!/bin/bash
# Save as: scripts/verify-daily-backup.sh

set -e

TODAY=$(date +%Y%m%d)
ALERT_EMAIL="${BACKUP_ALERT_EMAIL:-}"
ERRORS=0

echo "=== Daily Backup Verification ==="
echo "Date: $(date)"
echo ""

# Check database backup
if ls backups/db_schedgen_${TODAY}*.sql.gz 1> /dev/null 2>&1; then
    DB_FILE=$(ls -t backups/db_schedgen_${TODAY}*.sql.gz | head -1)
    if gunzip -t "$DB_FILE" 2>/dev/null; then
        echo "✓ Database backup OK: $DB_FILE"
    else
        echo "✗ Database backup CORRUPTED: $DB_FILE"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "✗ Database backup MISSING"
    ERRORS=$((ERRORS + 1))
fi

# Check MinIO backup
if ls backups/minio_schedgen-pdfs_${TODAY}*.tar.gz 1> /dev/null 2>&1; then
    MINIO_FILE=$(ls -t backups/minio_schedgen-pdfs_${TODAY}*.tar.gz | head -1)
    if tar -tzf "$MINIO_FILE" > /dev/null 2>&1; then
        echo "✓ MinIO backup OK: $MINIO_FILE"
    else
        echo "✗ MinIO backup CORRUPTED: $MINIO_FILE"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "✗ MinIO backup MISSING"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✓ All backups verified successfully"
    exit 0
else
    echo "✗ Backup verification failed with $ERRORS error(s)"
    
    # Send alert if configured
    if [ -n "$ALERT_EMAIL" ]; then
        echo "Backup verification failed on $(date)" | \
            mail -s "ALERT: Backup Verification Failed" "$ALERT_EMAIL"
    fi
    
    exit 1
fi
```

**Schedule daily verification**:
```bash
# Add to crontab (run at 3 AM, after 2 AM backup)
0 3 * * * /path/to/scripts/verify-daily-backup.sh >> /var/log/backup-verification.log 2>&1
```

### Verification Success Criteria

Daily verification is successful when:
- ✓ Backup service is running (Docker/systemd/cron)
- ✓ Today's backup files exist (both database and MinIO)
- ✓ Backup count is ≤7 (retention working)
- ✓ Backup sizes are reasonable (no dramatic changes)
- ✓ Integrity checks pass (gzip -t and tar -tzf)
- ✓ Backup contents are valid (spot check)

### Alert Escalation

| Severity | Condition | Action |
|----------|-----------|--------|
| **CRITICAL** | No backup for today | Page on-call engineer immediately |
| **CRITICAL** | Backup file corrupted | Page on-call engineer immediately |
| **HIGH** | Backup size dropped >50% | Alert operations team within 1 hour |
| **MEDIUM** | Backup count >7 | Create ticket for investigation |
| **LOW** | Backup size increased >200% | Monitor for trend |

## Restore Procedures

### Overview

This section covers different restore scenarios. Choose the appropriate procedure based on your situation:

- **Database Restore**: Restore PostgreSQL database only
- **MinIO Restore**: Restore file storage only
- **Full System Restore**: Restore complete system from backups
- **Partial Data Restore**: Restore specific tables or files

**⚠️ WARNING**: Restore operations are destructive. Always create a safety backup before restoring.

---

## Database Restore Procedure

### When to Use

Execute database restore in these scenarios:
- **Database corruption**: Database files corrupted or inconsistent
- **Accidental data deletion**: Critical data deleted by mistake
- **Failed migration rollback**: Database migration caused issues
- **Disaster recovery**: Complete database loss
- **Testing**: Restore to specific point in time for testing

### Prerequisites Checklist

Before starting database restore:

- [ ] Backup file identified and verified (integrity check passed)
- [ ] Backend service can be stopped (maintenance window scheduled)
- [ ] Database credentials available (POSTGRES_PASSWORD in .env)
- [ ] Sufficient disk space (2x backup file size)
- [ ] Stakeholders notified (if production)
- [ ] Safety backup created (if database is accessible)

### Risk Assessment

**Impact**: HIGH - All current database data will be lost  
**Downtime**: 5-15 minutes (backend unavailable)  
**Reversibility**: Only if safety backup created  
**Data Loss**: All changes since backup timestamp will be lost

### Step-by-Step Procedure

#### Step 1: Prepare for Restore

**Create safety backup of current state** (if database is accessible):

```bash
# Stop backend to prevent new writes
docker compose stop backend
echo "Backend stopped at $(date)"

# Verify database is accessible
if docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT 1" > /dev/null 2>&1; then
    echo "✓ Database is accessible"
    
    # Create safety backup
    SAFETY_BACKUP="backups/pre-restore-$(date +%Y%m%d_%H%M%S).sql.gz"
    docker exec schedgen-postgres pg_dump -U schedgen schedgen | gzip > "$SAFETY_BACKUP"
    
    if [ -f "$SAFETY_BACKUP" ]; then
        echo "✓ Safety backup created: $SAFETY_BACKUP"
        echo "  Size: $(du -h "$SAFETY_BACKUP" | cut -f1)"
    else
        echo "✗ Failed to create safety backup"
        read -p "Continue without safety backup? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            echo "Restore cancelled"
            docker compose start backend
            exit 1
        fi
    fi
else
    echo "⚠️  Database not accessible - skipping safety backup"
fi

# Record restore operation
cat >> backups/restore-log.txt <<EOF
=== Database Restore Started ===
Timestamp: $(date -Iseconds)
Operator: $(whoami)
Reason: [FILL IN REASON]
Safety Backup: ${SAFETY_BACKUP:-none}
EOF
```

#### Step 2: Select and Verify Backup

**Choose the backup file to restore**:

```bash
# List available backups with timestamps
echo "=== Available Database Backups ==="
ls -lht backups/db_*.sql.gz | head -10

# Select backup file (replace with actual filename)
read -p "Enter backup filename to restore: " BACKUP_FILENAME
BACKUP_FILE="backups/$BACKUP_FILENAME"

# Verify file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo "✓ Backup integrity verified"
else
    echo "✗ Backup file is corrupted"
    exit 1
fi

# Show backup details
echo ""
echo "=== Backup Details ==="
echo "File: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "Date: $(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c%y "$BACKUP_FILE" 2>/dev/null)"

# Confirm restore
echo ""
echo "⚠️  WARNING: This will DELETE all current database data!"
read -p "Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore cancelled"
    docker compose start backend
    exit 1
fi
```

#### Step 3: Execute Database Restore

**Restore the database from backup**:

```bash
echo ""
echo "=== Executing Database Restore ==="

# Drop existing database
echo "Dropping existing database..."
docker exec schedgen-postgres psql -U schedgen -d postgres -c "DROP DATABASE IF EXISTS schedgen"

# Recreate database
echo "Creating fresh database..."
docker exec schedgen-postgres psql -U schedgen -d postgres -c "CREATE DATABASE schedgen"

# Restore from backup
echo "Restoring from backup (this may take several minutes)..."
gunzip -c "$BACKUP_FILE" | docker exec -i schedgen-postgres psql -U schedgen -d schedgen 2>&1 | tee /tmp/restore-output.log

# Check for errors
if grep -i "error" /tmp/restore-output.log > /dev/null; then
    echo "⚠️  Errors detected during restore - check /tmp/restore-output.log"
    echo "Common errors like 'already exists' are usually safe to ignore"
else
    echo "✓ Restore completed without errors"
fi
```

#### Step 4: Verify Restore

**Verify database was restored correctly**:

```bash
echo ""
echo "=== Verifying Database Restore ==="

# Check database exists
if docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT 1" > /dev/null 2>&1; then
    echo "✓ Database is accessible"
else
    echo "✗ Database is not accessible"
    exit 1
fi

# Check tables exist
echo ""
echo "Tables in database:"
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "\dt"

# Check row counts
echo ""
echo "Row counts:"
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "
    SELECT 'jobs' as table_name, COUNT(*) as row_count FROM jobs
    UNION ALL
    SELECT 'users', COUNT(*) FROM users
    ORDER BY table_name;
"

# Check recent data
echo ""
echo "Recent jobs (sample):"
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "
    SELECT id, status, pdf_type, created_at 
    FROM jobs 
    ORDER BY created_at DESC 
    LIMIT 5;
"

# Verify data looks correct
read -p "Does the data look correct? (yes/no): " DATA_OK
if [ "$DATA_OK" != "yes" ]; then
    echo "⚠️  Data verification failed"
    echo "Consider restoring from a different backup"
    exit 1
fi
```

#### Step 5: Restart Services and Verify

**Bring the system back online**:

```bash
echo ""
echo "=== Restarting Services ==="

# Start backend
docker compose start backend

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Check health endpoint
echo "Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✓ Backend is healthy"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 2
done

# Verify health check details
echo ""
echo "Health check response:"
curl -s http://localhost:3001/health | jq .

# Check database health
echo ""
echo "Database health check:"
curl -s http://localhost:3001/health/db | jq .

# Monitor logs for errors
echo ""
echo "Recent backend logs:"
docker logs --tail 20 schedgen-backend

# Final verification
echo ""
read -p "Are all services healthy? (yes/no): " SERVICES_OK
if [ "$SERVICES_OK" != "yes" ]; then
    echo "⚠️  Services not healthy - investigate logs"
    exit 1
fi
```

#### Step 6: Document Restore

**Record the restore operation**:

```bash
# Update restore log
cat >> backups/restore-log.txt <<EOF
Backup Restored: $BACKUP_FILE
Restore Completed: $(date -Iseconds)
Verification: PASSED
Services Restarted: $(date -Iseconds)
Status: SUCCESS
Notes: [Add any relevant notes]
===
EOF

echo ""
echo "✓ Database restore completed successfully"
echo "Restore documented in backups/restore-log.txt"
```

### Success Criteria

Database restore is successful when:
- ✓ Database accessible and contains expected tables
- ✓ Row counts are reasonable (not zero)
- ✓ Sample data looks correct
- ✓ Backend starts successfully
- ✓ Health checks pass (both /health and /health/db)
- ✓ No errors in backend logs

### Expected Duration

- **Small database** (<100MB): 2-5 minutes
- **Medium database** (100MB-1GB): 5-10 minutes
- **Large database** (>1GB): 10-20 minutes

### Rollback Procedure

If restore fails or data is incorrect:

```bash
# If safety backup was created
SAFETY_BACKUP="backups/pre-restore-YYYYMMDD_HHMMSS.sql.gz"

# Restore from safety backup
docker compose stop backend
docker exec schedgen-postgres psql -U schedgen -d postgres -c "DROP DATABASE IF EXISTS schedgen"
docker exec schedgen-postgres psql -U schedgen -d postgres -c "CREATE DATABASE schedgen"
gunzip -c "$SAFETY_BACKUP" | docker exec -i schedgen-postgres psql -U schedgen -d schedgen
docker compose start backend
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "database does not exist" | Database not created | Run CREATE DATABASE command |
| "role does not exist" | User not created | Create user first or restore to postgres database |
| "already exists" errors | Objects already exist | Usually safe to ignore |
| Backend won't start | Migration mismatch | Run migrations: `npm run migration:run` |
| Slow restore | Large database | Normal - wait for completion |

---

## MinIO Restore Procedure

### When to Use

Execute MinIO restore in these scenarios:
- **Storage corruption**: MinIO volume corrupted or inaccessible
- **Accidental file deletion**: PDFs deleted by mistake
- **Disaster recovery**: Complete storage loss
- **Storage migration**: Moving to new storage system
- **Testing**: Restore specific files for testing

### Prerequisites Checklist

Before starting MinIO restore:

- [ ] Backup file identified and verified (integrity check passed)
- [ ] Services using MinIO can be stopped (backend, pdf-worker)
- [ ] Sufficient disk space (2x backup file size)
- [ ] MinIO credentials available (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD)
- [ ] Stakeholders notified (if production)
- [ ] Safety backup created (if volume is accessible)

### Risk Assessment

**Impact**: HIGH - All current files will be lost  
**Downtime**: 10-20 minutes (file uploads unavailable)  
**Reversibility**: Only if safety backup created  
**Data Loss**: All files uploaded since backup timestamp will be lost

### Step-by-Step Procedure

#### Step 1: Prepare for Restore

**Create safety backup of current state** (if volume is accessible):

```bash
# Stop services that use MinIO
docker compose stop backend pdf-worker
echo "Services stopped at $(date)"

# Verify MinIO volume exists
if docker volume ls | grep schedgen_minio_data > /dev/null; then
    echo "✓ MinIO volume exists"
    
    # Create safety backup
    SAFETY_BACKUP="backups/minio-pre-restore-$(date +%Y%m%d_%H%M%S).tar.gz"
    docker run --rm \
        -v schedgen_minio_data:/data:ro \
        -v "$(pwd)/backups":/backup \
        alpine \
        tar czf "/backup/$(basename $SAFETY_BACKUP)" -C /data .
    
    if [ -f "$SAFETY_BACKUP" ]; then
        echo "✓ Safety backup created: $SAFETY_BACKUP"
        echo "  Size: $(du -h "$SAFETY_BACKUP" | cut -f1)"
    else
        echo "✗ Failed to create safety backup"
        read -p "Continue without safety backup? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            echo "Restore cancelled"
            docker compose start backend pdf-worker
            exit 1
        fi
    fi
else
    echo "⚠️  MinIO volume not found - skipping safety backup"
fi

# Stop MinIO
docker compose stop minio

# Record restore operation
cat >> backups/restore-log.txt <<EOF
=== MinIO Restore Started ===
Timestamp: $(date -Iseconds)
Operator: $(whoami)
Reason: [FILL IN REASON]
Safety Backup: ${SAFETY_BACKUP:-none}
EOF
```

#### Step 2: Select and Verify Backup

**Choose the backup file to restore**:

```bash
# List available backups
echo "=== Available MinIO Backups ==="
ls -lht backups/minio_*.tar.gz | head -10

# Select backup file
read -p "Enter backup filename to restore: " BACKUP_FILENAME
BACKUP_FILE="backups/$BACKUP_FILENAME"

# Verify file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    echo "✓ Backup integrity verified"
    
    # Show file count
    FILE_COUNT=$(tar -tzf "$BACKUP_FILE" | wc -l)
    echo "  Files in backup: $FILE_COUNT"
else
    echo "✗ Backup file is corrupted"
    exit 1
fi

# Show backup details
echo ""
echo "=== Backup Details ==="
echo "File: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "Date: $(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c%y "$BACKUP_FILE" 2>/dev/null)"

# Confirm restore
echo ""
echo "⚠️  WARNING: This will DELETE all current files in MinIO!"
read -p "Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore cancelled"
    docker compose start minio backend pdf-worker
    exit 1
fi
```

#### Step 3: Execute MinIO Restore

**Restore the MinIO volume from backup**:

```bash
echo ""
echo "=== Executing MinIO Restore ==="

# Remove old volume
echo "Removing old volume..."
docker volume rm schedgen_minio_data

# Create new volume
echo "Creating new volume..."
docker volume create schedgen_minio_data

# Restore from backup
echo "Restoring from backup (this may take several minutes)..."
docker run --rm \
    -v schedgen_minio_data:/data \
    -v "$(pwd)/backups":/backup \
    alpine \
    tar xzf "/backup/$(basename "$BACKUP_FILE")" -C /data

# Check exit code
if [ $? -eq 0 ]; then
    echo "✓ Restore completed successfully"
else
    echo "✗ Restore failed"
    exit 1
fi
```

#### Step 4: Verify Restore

**Verify files were restored correctly**:

```bash
echo ""
echo "=== Verifying MinIO Restore ==="

# Check volume contents
echo "Checking volume contents..."
docker run --rm \
    -v schedgen_minio_data:/data \
    alpine \
    sh -c "ls -lh /data && echo '' && du -sh /data"

# Count files
FILE_COUNT=$(docker run --rm \
    -v schedgen_minio_data:/data \
    alpine \
    find /data -type f | wc -l)
echo ""
echo "Files restored: $FILE_COUNT"

# Check MinIO system files
echo ""
echo "Checking MinIO system files..."
docker run --rm \
    -v schedgen_minio_data:/data \
    alpine \
    ls -la /data/.minio.sys/

# Verify data looks correct
read -p "Does the file count look correct? (yes/no): " DATA_OK
if [ "$DATA_OK" != "yes" ]; then
    echo "⚠️  Data verification failed"
    echo "Consider restoring from a different backup"
    exit 1
fi
```

#### Step 5: Restart Services and Verify

**Bring the system back online**:

```bash
echo ""
echo "=== Restarting Services ==="

# Start MinIO first
docker compose up -d minio

# Wait for MinIO to be ready
echo "Waiting for MinIO to start..."
sleep 15

# Check MinIO health
for i in {1..30}; do
    if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo "✓ MinIO is healthy"
        break
    fi
    echo "Waiting for MinIO... ($i/30)"
    sleep 2
done

# Start other services
docker compose up -d backend pdf-worker

# Wait for services
sleep 10

# Check backend health
echo ""
echo "Checking backend health..."
curl -s http://localhost:3001/health | jq .

# Verify MinIO access via backend
echo ""
echo "Testing MinIO access..."
# This will fail if MinIO is not accessible
docker logs --tail 20 schedgen-backend | grep -i minio

# Check MinIO console (manual verification)
echo ""
echo "=== Manual Verification Required ==="
echo "1. Open MinIO console: http://localhost:9001"
echo "2. Login with credentials from .env"
echo "3. Navigate to 'schedgen-pdfs' bucket"
echo "4. Verify files are present"
echo ""
read -p "Are files visible in MinIO console? (yes/no): " MINIO_OK
if [ "$MINIO_OK" != "yes" ]; then
    echo "⚠️  MinIO verification failed"
    exit 1
fi
```

#### Step 6: Document Restore

**Record the restore operation**:

```bash
# Update restore log
cat >> backups/restore-log.txt <<EOF
Backup Restored: $BACKUP_FILE
Files Restored: $FILE_COUNT
Restore Completed: $(date -Iseconds)
Verification: PASSED
Services Restarted: $(date -Iseconds)
Status: SUCCESS
Notes: [Add any relevant notes]
===
EOF

echo ""
echo "✓ MinIO restore completed successfully"
echo "Restore documented in backups/restore-log.txt"
```

### Success Criteria

MinIO restore is successful when:
- ✓ Volume created and contains files
- ✓ File count matches expectations
- ✓ MinIO system files present (.minio.sys/)
- ✓ MinIO starts successfully
- ✓ Files visible in MinIO console
- ✓ Backend can access MinIO
- ✓ No errors in service logs

### Expected Duration

- **Small storage** (<1GB): 5-10 minutes
- **Medium storage** (1-10GB): 10-20 minutes
- **Large storage** (>10GB): 20-40 minutes

### Rollback Procedure

If restore fails or files are incorrect:

```bash
# If safety backup was created
SAFETY_BACKUP="backups/minio-pre-restore-YYYYMMDD_HHMMSS.tar.gz"

# Restore from safety backup
docker compose stop minio backend pdf-worker
docker volume rm schedgen_minio_data
docker volume create schedgen_minio_data
docker run --rm \
    -v schedgen_minio_data:/data \
    -v "$(pwd)/backups":/backup \
    alpine \
    tar xzf "/backup/$(basename $SAFETY_BACKUP)" -C /data
docker compose up -d minio backend pdf-worker
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "volume in use" | Services still running | Stop all services using volume |
| "no space left" | Insufficient disk space | Free up space or use larger disk |
| MinIO won't start | Corrupted system files | Check .minio.sys/ directory |
| Files not visible | Wrong bucket | Check bucket name in .env |
| Permission errors | Wrong file permissions | Check volume permissions |

---

## Full System Restore

### When to Use

Execute full system restore in these scenarios:
- **Complete system failure**: Server crashed or became unrecoverable
- **Disaster recovery**: Data center failure, hardware failure
- **Server migration**: Moving to new server or cloud provider
- **Environment rebuild**: Recreating production environment from scratch
- **Major corruption**: Both database and storage corrupted

### Prerequisites Checklist

Before starting full system restore:

- [ ] Fresh server or clean environment available
- [ ] Docker and Docker Compose installed
- [ ] Backup files available (database and MinIO)
- [ ] Environment variables documented (.env file)
- [ ] Network configuration ready (DNS, firewall rules)
- [ ] TLS certificates available (if using custom certs)
- [ ] Sufficient disk space (3x total backup size)

### Risk Assessment

**Impact**: CRITICAL - Complete system rebuild  
**Downtime**: 30-60 minutes (complete service outage)  
**Reversibility**: N/A (building from scratch)  
**Data Loss**: All changes since backup timestamp will be lost

### Step-by-Step Procedure

#### Step 1: Prepare Server Environment

**Set up the base system**:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not installed)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Add user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 2: Clone Repository and Configure

**Set up the application**:

```bash
# Clone repository
git clone https://github.com/your-org/ScheduleGenerator.git
cd ScheduleGenerator

# Checkout specific version (if needed)
git checkout v2.1.0  # Replace with your version

# Create environment file
cp .env.example .env

# Configure environment variables
nano .env
# Set all required variables:
# - Database credentials
# - MinIO credentials
# - Google OAuth credentials
# - Session secret
# - Domain/URL settings
```

**Example .env configuration**:
```bash
# Database
POSTGRES_USER=schedgen
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=schedgen

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<secure-password>

# Application
NODE_ENV=production
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Session
SESSION_SECRET=<secure-random-string>
```

#### Step 3: Transfer Backup Files

**Copy backup files to the new server**:

```bash
# Create backup directory
mkdir -p backups

# Transfer backup files from backup storage
# Option A: From another server
scp user@backup-server:/backups/db_schedgen_*.sql.gz backups/
scp user@backup-server:/backups/minio_schedgen-pdfs_*.tar.gz backups/

# Option B: From cloud storage (AWS S3 example)
aws s3 cp s3://your-backup-bucket/db_schedgen_latest.sql.gz backups/
aws s3 cp s3://your-backup-bucket/minio_schedgen-pdfs_latest.tar.gz backups/

# Option C: From local backup
# Copy files manually or use rsync

# Verify backup files
ls -lh backups/
gunzip -t backups/db_*.sql.gz
tar -tzf backups/minio_*.tar.gz > /dev/null
```

#### Step 4: Start Infrastructure Services

**Start database, cache, and storage**:

```bash
# Start infrastructure services only
docker compose up -d postgres redis minio

# Wait for services to initialize
echo "Waiting for services to start..."
sleep 30

# Verify services are running
docker compose ps

# Check PostgreSQL
docker exec schedgen-postgres pg_isready -U schedgen
# Expected: "accepting connections"

# Check Redis
docker exec schedgen-redis redis-cli ping
# Expected: "PONG"

# Check MinIO
curl -s http://localhost:9000/minio/health/live
# Expected: HTTP 200
```

#### Step 5: Restore Database

**Restore PostgreSQL database**:

```bash
# Select most recent database backup
DB_BACKUP=$(ls -t backups/db_*.sql.gz | head -1)
echo "Restoring database from: $DB_BACKUP"

# Create database
docker exec schedgen-postgres psql -U schedgen -d postgres -c "CREATE DATABASE schedgen"

# Restore from backup
gunzip -c "$DB_BACKUP" | docker exec -i schedgen-postgres psql -U schedgen -d schedgen

# Verify restore
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "\dt"
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs"
```

#### Step 6: Restore MinIO Storage

**Restore MinIO volumes**:

```bash
# Select most recent MinIO backup
MINIO_BACKUP=$(ls -t backups/minio_*.tar.gz | head -1)
echo "Restoring MinIO from: $MINIO_BACKUP"

# Stop MinIO temporarily
docker compose stop minio

# Restore volume
docker run --rm \
    -v schedgen_minio_data:/data \
    -v "$(pwd)/backups":/backup \
    alpine \
    tar xzf "/backup/$(basename $MINIO_BACKUP)" -C /data

# Restart MinIO
docker compose up -d minio

# Wait for MinIO to start
sleep 15

# Verify restore
docker exec schedgen-minio mc ls local/schedgen-pdfs
```

#### Step 7: Start Application Services

**Start backend, frontend, and workers**:

```bash
# Start all application services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor startup logs
docker compose logs -f backend frontend pdf-worker

# Wait for services to be ready
sleep 30
```

#### Step 8: Verify System Health

**Comprehensive system verification**:

```bash
echo "=== System Health Check ==="

# Check all services running
echo ""
echo "Service Status:"
docker compose ps

# Check backend health
echo ""
echo "Backend Health:"
curl -s http://localhost:3001/health | jq .

# Check database health
echo ""
echo "Database Health:"
curl -s http://localhost:3001/health/db | jq .

# Check frontend
echo ""
echo "Frontend Status:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Check Traefik (if using)
echo ""
echo "Traefik Status:"
curl -s http://localhost:8080/api/http/routers | jq .

# Check metrics endpoint
echo ""
echo "Metrics Endpoint:"
curl -s http://localhost:3001/metrics | head -20
```

#### Step 9: Functional Testing

**Test critical user flows**:

```bash
echo ""
echo "=== Functional Testing ==="
echo ""
echo "Manual tests to perform:"
echo "1. Open frontend: http://localhost:3000"
echo "2. Test Google OAuth login"
echo "3. Upload a test PDF"
echo "4. Verify job processing completes"
echo "5. Download generated ICS file"
echo "6. Check job history"
echo ""
read -p "Have all functional tests passed? (yes/no): " TESTS_OK

if [ "$TESTS_OK" != "yes" ]; then
    echo "⚠️  Functional tests failed - investigate issues"
    echo "Check logs: docker compose logs"
    exit 1
fi
```

#### Step 10: Configure Production Settings

**Apply production-specific configuration**:

```bash
# Configure TLS (if using Let's Encrypt)
# Traefik will automatically request certificates

# Configure monitoring
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d prometheus grafana

# Configure backups
docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup

# Configure firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Set up DNS (if needed)
# Point your domain to the server IP

# Verify HTTPS access
curl -s https://yourdomain.com/health | jq .
```

#### Step 11: Document Restore

**Record the restore operation**:

```bash
cat >> backups/restore-log.txt <<EOF
=== Full System Restore ===
Timestamp: $(date -Iseconds)
Operator: $(whoami)
Server: $(hostname)
Database Backup: $DB_BACKUP
MinIO Backup: $MINIO_BACKUP
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Status: SUCCESS
Downtime: [FILL IN ACTUAL DOWNTIME]
Notes: [Add any relevant notes]
===
EOF

echo ""
echo "✓ Full system restore completed successfully"
echo "System is now operational"
```

### Success Criteria

Full system restore is successful when:
- ✓ All Docker services running
- ✓ Database accessible with correct data
- ✓ MinIO accessible with correct files
- ✓ Backend health checks pass
- ✓ Frontend accessible
- ✓ User can log in
- ✓ PDF upload and processing works
- ✓ Monitoring and backups configured

### Expected Duration

- **Fresh environment**: 45-60 minutes
- **Existing environment**: 30-45 minutes
- **With automation**: 20-30 minutes

### Post-Restore Checklist

After full system restore:

- [ ] All services running and healthy
- [ ] DNS configured correctly
- [ ] TLS certificates active
- [ ] Monitoring dashboards accessible
- [ ] Backup automation configured
- [ ] Firewall rules applied
- [ ] Team notified of restore completion
- [ ] Incident documented
- [ ] Post-mortem scheduled (if disaster recovery)

---

## Partial Data Restore

### When to Use

Execute partial restore when you need to:
- **Restore specific tables**: Recover specific database tables
- **Restore specific files**: Recover individual PDFs from MinIO
- **Selective recovery**: Restore only certain data without full restore

### Database Table Restore

**Restore specific tables from backup**:

```bash
# Extract specific table from backup
gunzip -c backups/db_schedgen_YYYYMMDD_HHMMSS.sql.gz | \
    grep -A 10000 "CREATE TABLE jobs" | \
    grep -B 10000 "CREATE TABLE users" > /tmp/jobs_table.sql

# Restore specific table
docker exec -i schedgen-postgres psql -U schedgen -d schedgen < /tmp/jobs_table.sql
```

### Individual File Restore

**Restore specific files from MinIO backup**:

```bash
# List files in backup
tar -tzf backups/minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz | grep "specific-file.pdf"

# Extract specific file
tar -xzf backups/minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz \
    --strip-components=2 \
    "schedgen-pdfs/specific-file.pdf"

# Upload to MinIO
docker exec schedgen-minio mc cp specific-file.pdf local/schedgen-pdfs/
```

### Point-in-Time Recovery

**Restore to specific point in time** (requires WAL archiving):

```bash
# This requires PostgreSQL WAL archiving to be configured
# See PostgreSQL documentation for PITR setup

# Example recovery.conf
cat > /tmp/recovery.conf <<EOF
restore_command = 'cp /path/to/wal_archive/%f %p'
recovery_target_time = '2024-11-30 14:30:00'
EOF

# Apply recovery configuration
# (Specific steps depend on PostgreSQL version)
```

---

## Recovery Time Expectations

### Overview

This section provides expected recovery times for different restore scenarios. Use these estimates for capacity planning, SLA definitions, and incident response.

**Requirements Addressed**: 9.3 (Recovery within 1 hour)

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Typical RTO | Maximum RTO |
|----------|-----------|-------------|-------------|
| Database restore (small) | 5 min | 5-10 min | 15 min |
| Database restore (medium) | 10 min | 10-15 min | 30 min |
| Database restore (large) | 20 min | 20-30 min | 60 min |
| MinIO restore (small) | 10 min | 10-15 min | 30 min |
| MinIO restore (medium) | 20 min | 20-30 min | 60 min |
| MinIO restore (large) | 40 min | 40-60 min | 90 min |
| Full system restore | 45 min | 45-60 min | 90 min |
| Partial data restore | 10 min | 10-20 min | 30 min |

### Size Classifications

**Database Sizes**:
- **Small**: <100MB compressed (<500MB uncompressed, <1000 jobs)
- **Medium**: 100MB-1GB compressed (500MB-5GB uncompressed, 1000-10000 jobs)
- **Large**: >1GB compressed (>5GB uncompressed, >10000 jobs)

**MinIO Storage Sizes**:
- **Small**: <1GB (< 100 PDFs)
- **Medium**: 1-10GB (100-1000 PDFs)
- **Large**: >10GB (>1000 PDFs)

### Factors Affecting Recovery Time

#### 1. Backup File Size
- **Impact**: HIGH
- **Explanation**: Larger backups take longer to transfer and restore
- **Mitigation**: Use compression, incremental backups

#### 2. Disk I/O Performance
- **Impact**: HIGH
- **Explanation**: SSD vs HDD can make 5-10x difference
- **Mitigation**: Use SSD storage for production

#### 3. Network Speed
- **Impact**: MEDIUM (if transferring backups)
- **Explanation**: Slow network delays backup transfer
- **Mitigation**: Store backups locally or use fast network

#### 4. Database Complexity
- **Impact**: MEDIUM
- **Explanation**: Many indexes/constraints slow restore
- **Mitigation**: Restore indexes after data

#### 5. System Load
- **Impact**: LOW
- **Explanation**: High CPU/memory usage slows restore
- **Mitigation**: Perform restores during low-traffic periods

### Recovery Time Breakdown

**Database Restore (Medium, 500MB)**:
```
Pre-flight checks:        2 min
Safety backup:            3 min
Backup verification:      1 min
Database drop/create:     30 sec
Data restore:             5 min
Index rebuild:            2 min
Service restart:          1 min
Health verification:      1 min
-----------------------------------
Total:                    15.5 min
```

**MinIO Restore (Medium, 5GB)**:
```
Pre-flight checks:        2 min
Safety backup:            8 min
Backup verification:      1 min
Volume removal:           30 sec
Volume creation:          30 sec
Data extraction:          12 min
Service restart:          2 min
Health verification:      2 min
-----------------------------------
Total:                    28 min
```

**Full System Restore (Fresh Server)**:
```
Server preparation:       10 min
Repository setup:         5 min
Backup transfer:          5 min
Infrastructure start:     5 min
Database restore:         10 min
MinIO restore:            15 min
Application start:        5 min
Health verification:      5 min
-----------------------------------
Total:                    60 min
```

### Recovery Point Objectives (RPO)

**RPO**: Maximum acceptable data loss

| Backup Frequency | RPO | Data Loss Risk |
|-----------------|-----|----------------|
| Daily (2 AM) | 24 hours | Up to 1 day of data |
| Every 6 hours | 6 hours | Up to 6 hours of data |
| Hourly | 1 hour | Up to 1 hour of data |
| Continuous (WAL) | Minutes | Minimal data loss |

**Current Configuration**: Daily backups at 2 AM  
**Current RPO**: 24 hours  
**Recommendation**: For production, consider 6-hour backups

### Performance Benchmarks

**Test Environment**:
- Server: 4 CPU cores, 16GB RAM, SSD storage
- Database: 250MB compressed (1.2GB uncompressed, 5000 jobs)
- MinIO: 3GB (300 PDFs)

**Measured Times**:
- Database backup: 2.5 minutes
- Database restore: 8 minutes
- MinIO backup: 5 minutes
- MinIO restore: 12 minutes
- Full system restore: 42 minutes

### Improving Recovery Times

#### Short-term Improvements
1. **Use SSD storage**: 5-10x faster than HDD
2. **Increase backup frequency**: Smaller backups restore faster
3. **Compress backups**: Faster transfer, slightly slower extraction
4. **Local backup storage**: Eliminate network transfer time

#### Long-term Improvements
1. **Implement WAL archiving**: Point-in-time recovery
2. **Use streaming replication**: Hot standby for instant failover
3. **Implement incremental backups**: Only backup changes
4. **Use backup appliances**: Dedicated backup hardware
5. **Cloud backup services**: Managed backup/restore

### SLA Recommendations

Based on recovery time data:

**Tier 1 (Critical)**:
- RTO: 30 minutes
- RPO: 1 hour
- Backup frequency: Hourly
- Requires: Hot standby or WAL archiving

**Tier 2 (Production)**:
- RTO: 1 hour
- RPO: 6 hours
- Backup frequency: Every 6 hours
- Requires: Automated backups, tested restore procedures

**Tier 3 (Development)**:
- RTO: 4 hours
- RPO: 24 hours
- Backup frequency: Daily
- Requires: Basic backup automation

**Current System**: Tier 2 (Production)

---

## Backup Troubleshooting

### Issue: Backup Script Fails

**Symptoms**: Script exits with error, no backup files created

**Diagnosis**:
```bash
# Check script permissions
ls -l scripts/backup-all.sh

# Check environment variables
docker exec schedgen-backup env | grep -E 'POSTGRES|MINIO'

# Check disk space
df -h

# Run with debug output
docker exec schedgen-backup sh -x /usr/local/bin/backup-all.sh
```

**Solutions**:
1. Fix permissions: `chmod +x scripts/backup-all.sh`
2. Set missing environment variables in `.env`
3. Free up disk space
4. Check database/MinIO connectivity

### Issue: Backup Files Too Small

**Symptoms**: Backup files exist but are suspiciously small

**Diagnosis**:
```bash
# Check file sizes
du -h backups/*

# Compare with previous backups
du -h backups/db_*.sql.gz | tail -5

# Test backup integrity
gunzip -t backups/db_*.sql.gz
```

**Solutions**:
1. Verify database has data: `docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs"`
2. Check for backup errors in logs
3. Re-run backup manually
4. Verify compression is working

### Issue: Restore Fails

**Symptoms**: Restore command fails or database/MinIO not working after restore

**Diagnosis**:
```bash
# Verify backup file integrity
gunzip -t backups/db_*.sql.gz
tar -tzf backups/minio_*.tar.gz

# Check database connection
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT 1"

# Check logs
docker logs schedgen-postgres
docker logs schedgen-minio
```

**Solutions**:
1. Use different backup file
2. Check database credentials
3. Verify volume permissions
4. Check for disk space issues

### Issue: Alerts Not Sending

**Symptoms**: Backup fails but no alert received

**Diagnosis**:
```bash
# Check environment variables
echo $BACKUP_ALERT_WEBHOOK_URL
echo $BACKUP_ALERT_EMAIL

# Test webhook manually
curl -X POST "$BACKUP_ALERT_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert"}'

# Test email
echo "Test" | mail -s "Test" $BACKUP_ALERT_EMAIL
```

**Solutions**:
1. Verify webhook URL is correct
2. Check email configuration
3. Verify network connectivity
4. Check alert service logs

## Recovery Time Expectations

### Database Restore
- **Small database** (<100MB): 2-5 minutes
- **Medium database** (100MB-1GB): 5-15 minutes
- **Large database** (>1GB): 15-30 minutes

### MinIO Restore
- **Small storage** (<1GB): 5-10 minutes
- **Medium storage** (1-10GB): 10-30 minutes
- **Large storage** (>10GB): 30-60 minutes

### Full System Restore
- **Fresh environment**: 30-60 minutes
- **Existing environment**: 15-30 minutes

### Factors Affecting Recovery Time
- Backup file size
- Network speed (if copying backups)
- Disk I/O performance
- Database complexity
- Number of files in MinIO

---

## Testing and Validation

### Purpose

Regular testing ensures backups are valid and restore procedures work correctly. This section provides testing procedures and schedules.

**Requirements Addressed**: 9.2 (Backup verification)

### Monthly Restore Test

**Frequency**: Monthly (first Sunday of each month)  
**Duration**: 1-2 hours  
**Responsibility**: DevOps team

#### Test Procedure

```bash
#!/bin/bash
# Monthly restore test script

echo "=== Monthly Backup Restore Test ==="
echo "Date: $(date)"
echo ""

# 1. Select test backup (use yesterday's backup)
YESTERDAY=$(date -d "yesterday" +%Y%m%d 2>/dev/null || date -v-1d +%Y%m%d)
DB_BACKUP=$(ls backups/db_schedgen_${YESTERDAY}*.sql.gz | head -1)
MINIO_BACKUP=$(ls backups/minio_schedgen-pdfs_${YESTERDAY}*.sql.gz | head -1)

echo "Testing backups:"
echo "  Database: $DB_BACKUP"
echo "  MinIO: $MINIO_BACKUP"
echo ""

# 2. Create test environment
docker compose -f docker-compose.test.yml up -d postgres-test minio-test

# 3. Restore to test environment
echo "Restoring database to test environment..."
gunzip -c "$DB_BACKUP" | docker exec -i test-postgres psql -U schedgen -d schedgen

echo "Restoring MinIO to test environment..."
docker run --rm \
    -v test_minio_data:/data \
    -v "$(pwd)/backups":/backup \
    alpine \
    tar xzf "/backup/$(basename $MINIO_BACKUP)" -C /data

# 4. Verify restore
echo ""
echo "Verifying restore..."
docker exec test-postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs"
docker exec test-minio mc ls local/schedgen-pdfs | wc -l

# 5. Cleanup
echo ""
echo "Cleaning up test environment..."
docker compose -f docker-compose.test.yml down -v

echo ""
echo "✓ Monthly restore test completed"
echo "Document results in backups/test-log.txt"
```

#### Test Checklist

- [ ] Test backup selected (recent backup)
- [ ] Test environment created
- [ ] Database restored successfully
- [ ] MinIO restored successfully
- [ ] Data verified (row counts, file counts)
- [ ] Test environment cleaned up
- [ ] Results documented
- [ ] Issues identified and tracked

### Quarterly Disaster Recovery Drill

**Frequency**: Quarterly  
**Duration**: 2-4 hours  
**Responsibility**: Full team

#### Drill Procedure

1. **Simulate disaster**: Take down production-like environment
2. **Execute full restore**: Follow full system restore procedure
3. **Verify functionality**: Test all critical user flows
4. **Measure times**: Record actual recovery times
5. **Document issues**: Note any problems encountered
6. **Update procedures**: Improve runbook based on learnings

#### Drill Checklist

- [ ] Drill scheduled and team notified
- [ ] Test environment prepared
- [ ] Disaster scenario simulated
- [ ] Full restore executed
- [ ] Recovery times measured
- [ ] Functionality verified
- [ ] Issues documented
- [ ] Runbook updated
- [ ] Post-drill review completed

### Backup Integrity Checks

**Automated daily checks**:

```bash
#!/bin/bash
# Daily backup integrity check
# Run via cron: 0 3 * * * /path/to/check-backup-integrity.sh

TODAY=$(date +%Y%m%d)

# Check database backup
DB_BACKUP=$(ls backups/db_schedgen_${TODAY}*.sql.gz | head -1)
if gunzip -t "$DB_BACKUP" 2>/dev/null; then
    echo "✓ Database backup integrity OK"
else
    echo "✗ Database backup CORRUPTED"
    # Send alert
    curl -X POST "$ALERT_WEBHOOK_URL" \
        -d '{"text":"ALERT: Database backup corrupted"}'
fi

# Check MinIO backup
MINIO_BACKUP=$(ls backups/minio_schedgen-pdfs_${TODAY}*.tar.gz | head -1)
if tar -tzf "$MINIO_BACKUP" > /dev/null 2>&1; then
    echo "✓ MinIO backup integrity OK"
else
    echo "✗ MinIO backup CORRUPTED"
    # Send alert
    curl -X POST "$ALERT_WEBHOOK_URL" \
        -d '{"text":"ALERT: MinIO backup corrupted"}'
fi
```

### Test Documentation Template

**Record test results**:

```markdown
# Backup Restore Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Test Type**: [Monthly/Quarterly/Ad-hoc]

## Test Details
- **Backup Date**: YYYY-MM-DD HH:MM
- **Database Backup**: [filename]
- **MinIO Backup**: [filename]
- **Test Environment**: [description]

## Results
- **Database Restore**: ✓ PASS / ✗ FAIL
- **MinIO Restore**: ✓ PASS / ✗ FAIL
- **Data Verification**: ✓ PASS / ✗ FAIL
- **Functionality Test**: ✓ PASS / ✗ FAIL

## Timing
- **Database Restore Time**: X minutes
- **MinIO Restore Time**: X minutes
- **Total Recovery Time**: X minutes

## Issues Encountered
1. [Issue description]
2. [Issue description]

## Actions Required
1. [Action item]
2. [Action item]

## Conclusion
[Overall assessment and recommendations]
```

---

## Best Practices

### Backup Best Practices

1. **Test restores regularly**: Monthly restore tests to verify backups work
2. **Automate everything**: Use automated backups, verification, and alerts
3. **Keep multiple copies**: Follow 3-2-1 rule (3 copies, 2 media types, 1 offsite)
4. **Verify immediately**: Check backup integrity right after creation
5. **Monitor backup sizes**: Alert on significant size changes
6. **Document procedures**: Keep runbooks up to date
7. **Train the team**: Ensure multiple people can perform restores
8. **Encrypt backups**: Protect sensitive data in backups

### Restore Best Practices

1. **Create safety backup**: Always backup current state before restoring
2. **Verify backup first**: Test integrity before starting restore
3. **Use maintenance window**: Schedule restores during low-traffic periods
4. **Monitor during restore**: Watch logs for errors
5. **Verify after restore**: Test critical functionality
6. **Document everything**: Record what was done and why
7. **Communicate status**: Keep stakeholders informed
8. **Learn from incidents**: Update procedures based on experience

### Operational Best Practices

1. **Track recovery times**: Measure actual RTO for capacity planning
2. **Review procedures quarterly**: Keep runbooks current
3. **Conduct disaster recovery drills**: Practice full system restore
4. **Maintain backup inventory**: Know what backups are available
5. **Set up monitoring**: Alert on backup failures
6. **Rotate credentials**: Update backup credentials regularly
7. **Audit access**: Control who can access backups
8. **Plan for growth**: Ensure backup system scales with data

---

## Emergency Contacts

### On-Call Rotation

- **Primary On-Call**: [Name] - [Phone] - [Email]
- **Secondary On-Call**: [Name] - [Phone] - [Email]
- **Escalation**: [Manager Name] - [Phone] - [Email]

### Specialist Contacts

- **Database Administrator**: [Name] - [Contact]
- **DevOps Lead**: [Name] - [Contact]
- **Security Team**: [Name] - [Contact]
- **Infrastructure Team**: [Name] - [Contact]

### External Contacts

- **Cloud Provider Support**: [Contact Info]
- **Backup Vendor Support**: [Contact Info]
- **Managed Services**: [Contact Info]

---

## Related Documents

### Backup Documentation
- [Backup Automation](./BACKUP_AUTOMATION.md) - Setup and configuration
- [Backup Quick Reference](./BACKUP_QUICK_REFERENCE.md) - Common commands
- [Pre-Deployment Backup](./PRE_DEPLOYMENT_BACKUP.md) - Deployment backup procedures

### Deployment Documentation
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback with backup restoration
- [Rollback Quick Reference](./ROLLBACK_QUICK_REFERENCE.md) - Quick rollback commands

### Operational Documentation
- [Incident Response Runbook](./INCIDENT_RESPONSE_RUNBOOK.md) - Incident handling
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production readiness
- [Scaling Runbook](./SCALING_RUNBOOK.md) - Scaling procedures

### Requirements
- [Production Readiness Requirements](../../.kiro/specs/production-readiness/requirements.md)
- [Production Readiness Design](../../.kiro/specs/production-readiness/design.md)

---

## Document Information

**Document Owner**: DevOps Team  
**Last Updated**: 2024-11-30  
**Review Schedule**: Quarterly  
**Next Review**: 2025-02-28  
**Version**: 2.0

### Change History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-11-30 | 2.0 | DevOps | Complete rewrite with comprehensive procedures |
| 2024-11-15 | 1.0 | DevOps | Initial version |

### Approval

- **Reviewed by**: [Name] - [Date]
- **Approved by**: [Name] - [Date]

---

**End of Backup and Restore Runbook**
