# Task 18.3 Verification Checklist

## Pre-Deployment Backup Implementation Verification

Use this checklist to verify that the pre-deployment backup implementation works correctly.

## Prerequisites

Before testing, ensure:
- [ ] Docker and Docker Compose are running
- [ ] PostgreSQL database has some data
- [ ] MinIO has some uploaded files
- [ ] Required environment variables are set:
  ```bash
  export POSTGRES_PASSWORD=your_password
  export MINIO_ACCESS_KEY=your_key
  export MINIO_SECRET_KEY=your_secret
  ```

## Test 1: Successful Backup Creation

### Steps
1. Run the deployment script:
   ```bash
   ./scripts/deploy.sh
   ```

2. Observe the output for Step 0

### Expected Results
- [ ] Step 0: Pre-deployment backup section appears
- [ ] Backup directory is created: `./backups/pre-deployment-YYYYMMDD_HHMMSS/`
- [ ] Database backup file is created: `db_schedgen_*.sql.gz`
- [ ] MinIO backup file is created: `minio_schedgen-pdfs_*.tar.gz`
- [ ] Backup integrity verification passes
- [ ] `.last-deployment-backup` file is created
- [ ] Deployment continues to next steps

### Verification Commands
```bash
# Check backup directory exists
ls -lh backups/pre-deployment-*/

# Check backup files
ls -lh backups/pre-deployment-*/*.gz

# Check backup info file
cat .last-deployment-backup

# Verify file sizes are reasonable
du -h backups/pre-deployment-*/*
```

## Test 2: Backup Information Retrieval

### Steps
1. Run the get-last-backup script:
   ```bash
   ./scripts/get-last-backup.sh
   ```

### Expected Results
- [ ] Script displays deployment timestamp
- [ ] Script displays backup directory path
- [ ] Script displays Git commit and branch
- [ ] Script shows database backup file with size
- [ ] Script shows MinIO backup file with size
- [ ] Script provides rollback commands
- [ ] All displayed files actually exist

### Verification Commands
```bash
# Run the script
./scripts/get-last-backup.sh

# Verify files exist
source .last-deployment-backup
test -f "$DB_BACKUP_FILE" && echo "DB backup exists" || echo "DB backup missing"
test -f "$MINIO_BACKUP_FILE" && echo "MinIO backup exists" || echo "MinIO backup missing"
```

## Test 3: Backup Verification (File Size)

### Steps
1. Create a test backup directory:
   ```bash
   mkdir -p backups/test-backup
   ```

2. Create an empty database backup file:
   ```bash
   touch backups/test-backup/db_test.sql.gz
   ```

3. Modify deployment script temporarily to use test backup (or test manually)

### Expected Results
- [ ] Backup verification detects file is too small
- [ ] Error message: "Database backup file too small"
- [ ] Deployment is aborted
- [ ] No further deployment steps execute

## Test 4: Backup Verification (Corruption)

### Steps
1. Create a test backup directory:
   ```bash
   mkdir -p backups/test-backup
   ```

2. Create a corrupted gzip file:
   ```bash
   echo "not a valid gzip file" > backups/test-backup/db_test.sql.gz
   ```

3. Test gzip verification:
   ```bash
   gzip -t backups/test-backup/db_test.sql.gz
   ```

### Expected Results
- [ ] gzip -t command fails
- [ ] Backup verification detects corruption
- [ ] Error message: "Database backup file corrupted"
- [ ] Deployment would be aborted

## Test 5: Missing Backup Script

### Steps
1. Temporarily rename backup script:
   ```bash
   mv scripts/backup-all.sh scripts/backup-all.sh.bak
   ```

2. Run deployment script:
   ```bash
   ./scripts/deploy.sh
   ```

3. Restore backup script:
   ```bash
   mv scripts/backup-all.sh.bak scripts/backup-all.sh
   ```

### Expected Results
- [ ] Pre-flight check detects missing backup script
- [ ] Error message: "Backup script not found"
- [ ] Deployment is aborted immediately
- [ ] No backup directory is created

## Test 6: Backup Location Storage

### Steps
1. Run a deployment
2. Check the `.last-deployment-backup` file

### Expected Results
- [ ] File contains `DEPLOYMENT_TIMESTAMP`
- [ ] File contains `BACKUP_DIR`
- [ ] File contains `DB_BACKUP_FILE`
- [ ] File contains `MINIO_BACKUP_FILE`
- [ ] File contains `GIT_COMMIT`
- [ ] File contains `GIT_BRANCH`
- [ ] All paths are absolute or relative to project root
- [ ] Git commit matches current HEAD

### Verification Commands
```bash
# Check file contents
cat .last-deployment-backup

# Verify Git commit
source .last-deployment-backup
test "$GIT_COMMIT" = "$(git rev-parse HEAD)" && echo "Git commit matches" || echo "Git commit mismatch"
```

## Test 7: Rollback Procedure

### Steps
1. Note current database state:
   ```bash
   docker compose exec postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs;"
   ```

2. Get backup information:
   ```bash
   ./scripts/get-last-backup.sh
   ```

3. Follow rollback commands from output

### Expected Results
- [ ] Database restore command works without errors
- [ ] MinIO restore command works without errors
- [ ] Data is restored to pre-deployment state
- [ ] Services start successfully after restore

### Verification Commands
```bash
# After restore, verify data
docker compose exec postgres psql -U schedgen -d schedgen -c "SELECT COUNT(*) FROM jobs;"

# Check services are running
docker compose ps
```

## Test 8: Multiple Deployments

### Steps
1. Run first deployment:
   ```bash
   ./scripts/deploy.sh
   ```

2. Note backup location:
   ```bash
   ./scripts/get-last-backup.sh
   ```

3. Run second deployment:
   ```bash
   ./scripts/deploy.sh
   ```

4. Check backup location again:
   ```bash
   ./scripts/get-last-backup.sh
   ```

### Expected Results
- [ ] First deployment creates backup in `pre-deployment-TIMESTAMP1/`
- [ ] Second deployment creates backup in `pre-deployment-TIMESTAMP2/`
- [ ] `.last-deployment-backup` points to second backup
- [ ] Both backup directories exist
- [ ] Timestamps are different

### Verification Commands
```bash
# List all pre-deployment backups
ls -ld backups/pre-deployment-*/

# Check which backup is "last"
cat .last-deployment-backup | grep BACKUP_DIR
```

## Test 9: Disk Space Handling

### Steps
1. Check available disk space:
   ```bash
   df -h .
   ```

2. Estimate backup size:
   ```bash
   du -sh backups/
   ```

3. Ensure sufficient space for backup

### Expected Results
- [ ] Sufficient disk space available (at least 2x current backup size)
- [ ] Backup creation doesn't fill disk
- [ ] Warning if disk space is low

## Test 10: Documentation Verification

### Steps
1. Read the documentation:
   - `docs/production/PRE_DEPLOYMENT_BACKUP.md`
   - `docs/production/ROLLING_DEPLOYMENT.md`
   - `scripts/README.md`

### Expected Results
- [ ] Documentation explains how pre-deployment backup works
- [ ] Documentation includes usage examples
- [ ] Documentation includes rollback procedures
- [ ] Documentation includes troubleshooting
- [ ] All documentation is consistent
- [ ] All file paths in documentation are correct

## Summary Checklist

After completing all tests:

- [ ] Backup creation works correctly
- [ ] Backup verification works correctly
- [ ] Backup information retrieval works correctly
- [ ] Deployment aborts on backup failure
- [ ] Backup location is stored correctly
- [ ] Rollback procedure works correctly
- [ ] Multiple deployments create separate backups
- [ ] Documentation is complete and accurate

## Issues Found

Document any issues found during verification:

1. Issue: _______________
   - Expected: _______________
   - Actual: _______________
   - Fix: _______________

2. Issue: _______________
   - Expected: _______________
   - Actual: _______________
   - Fix: _______________

## Sign-off

- [ ] All tests passed
- [ ] No critical issues found
- [ ] Documentation reviewed and accurate
- [ ] Ready for production use

**Tested by**: _______________
**Date**: _______________
**Environment**: _______________
