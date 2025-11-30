# Deployment and Operations Scripts

This directory contains scripts for deploying, verifying, and maintaining the UP Schedule Generator in production.

## Scripts Overview

### Deployment Scripts

#### `deploy.sh`
**Purpose**: Zero-downtime rolling deployment with automatic verification

**Features**:
- Pulls latest code from git
- Builds Docker containers
- Runs database migrations
- Performs rolling updates (one service at a time)
- Verifies health between updates
- Runs comprehensive post-deployment verification

**Usage**:
```bash
./scripts/deploy.sh

# Deploy from specific branch
GIT_BRANCH=develop ./scripts/deploy.sh
```

**Requirements**: 12.1, 12.2, 12.4

#### `deploy-with-rollback.sh`
**Purpose**: Deployment with automatic rollback on failure detection

**Features**:
- Executes standard deployment
- Monitors health checks continuously
- Detects consecutive failures (3+ failures)
- Detects high error rates (>10%)
- Automatically triggers rollback on failure
- Extended monitoring period (10 minutes)

**Usage**:
```bash
./scripts/deploy-with-rollback.sh

# Custom monitoring configuration
MONITORING_DURATION=600 \
ERROR_THRESHOLD=0.10 \
./scripts/deploy-with-rollback.sh
```

**Automatic Rollback Triggers**:
- 3 consecutive health check failures
- Error rate exceeds 10%
- Deployment script failure
- Verification failure

**Requirements**: 12.2, 12.3, 12.4

#### `rollback.sh`
**Purpose**: Manual rollback to previous deployment state

**Features**:
- Loads pre-deployment backup information
- Stops all services gracefully
- Restores PostgreSQL database from backup
- Restores MinIO volumes from backup
- Reverts Git repository to previous commit
- Rebuilds Docker containers
- Verifies rollback success

**Usage**:
```bash
# Interactive rollback (prompts for confirmation)
./scripts/rollback.sh

# Non-interactive rollback (auto-confirm)
ROLLBACK_CONFIRM=yes ./scripts/rollback.sh
```

**Duration**: 10-25 minutes

**Requirements**: 12.3

---

### Verification Scripts

#### `verify-deployment.sh`
**Purpose**: Comprehensive post-deployment verification with monitoring

**Features**:
- Verifies all services are running
- Tests health endpoints
- Runs smoke tests
- Checks monitoring stack
- Monitors error rates for 10 minutes
- Checks resource usage
- Scans logs for errors

**Usage**:
```bash
./scripts/verify-deployment.sh

# Custom configuration
BACKEND_URL=http://api.example.com \
MONITORING_DURATION=300 \
ERROR_THRESHOLD=0.10 \
./scripts/verify-deployment.sh
```

**Duration**: ~10-15 minutes

**Requirements**: 12.4

#### `smoke-test.sh`
**Purpose**: Quick smoke tests for critical functionality

**Features**:
- Backend health check
- Database health check
- Frontend accessibility
- Metrics endpoint
- Job queue metrics
- CORS configuration

**Usage**:
```bash
./scripts/smoke-test.sh

# Custom URLs
BACKEND_URL=http://api.example.com \
FRONTEND_URL=http://app.example.com \
./scripts/smoke-test.sh
```

**Duration**: ~30 seconds

**Requirements**: 12.4

---

### Backup Scripts

#### `backup-all.sh`
**Purpose**: Complete system backup (database + files)

**Features**:
- Backs up PostgreSQL database
- Backs up MinIO volumes
- Compresses backups
- Applies retention policy (7 days)
- Verifies backup integrity

**Usage**:
```bash
./scripts/backup-all.sh

# Custom backup directory
BACKUP_DIR=/mnt/backups ./scripts/backup-all.sh
```

**Requirements**: 9.1, 9.2, 9.4

#### `backup-db.sh`
**Purpose**: Database-only backup

**Features**:
- Backs up PostgreSQL database
- Compresses with gzip
- Verifies backup integrity
- Applies retention policy

**Usage**:
```bash
./scripts/backup-db.sh
```

**Requirements**: 9.1, 9.2

#### `get-last-backup.sh`
**Purpose**: Retrieve information about the last pre-deployment backup

**Features**:
- Displays backup timestamp and location
- Shows Git commit and branch information
- Verifies backup files exist
- Provides ready-to-use rollback commands

**Usage**:
```bash
./scripts/get-last-backup.sh
```

**Output**:
- Deployment timestamp
- Backup directory path
- Database and MinIO backup file paths
- File sizes
- Rollback commands

**Requirements**: 12.5

#### `setup-backup.sh`
**Purpose**: Configure automated backups

**Features**:
- Sets up systemd timer for daily backups
- Configures backup service
- Tests backup functionality
- Sets up monitoring

**Usage**:
```bash
sudo ./scripts/setup-backup.sh
```

**Requirements**: 9.1, 9.4

---

### Infrastructure Scripts

#### `init-minio.sh`
**Purpose**: Initialize MinIO object storage

**Features**:
- Creates required buckets
- Sets up access policies
- Configures lifecycle rules

**Usage**:
```bash
./scripts/init-minio.sh
```

#### `test-prod-local.sh`
**Purpose**: Test production configuration locally

**Features**:
- Starts services with production configuration
- Runs verification tests
- Cleans up after testing

**Usage**:
```bash
./scripts/test-prod-local.sh
```

---

## Common Workflows

### 1. Deploy to Production (Recommended)

```bash
# Deploy with automatic rollback protection
./scripts/deploy-with-rollback.sh

# Monitor (optional - script already monitors)
docker compose logs -f backend frontend pdf-worker

# View backup information if needed
./scripts/get-last-backup.sh
```

**Note**: This is the recommended deployment method for production. It includes automatic rollback on failure.

### 1a. Deploy to Production (Standard)

```bash
# Deploy without automatic rollback (for staging/testing)
./scripts/deploy.sh

# Monitor
docker compose logs -f backend frontend pdf-worker

# View backup information if needed
./scripts/get-last-backup.sh
```

**Note**: Both deployment scripts automatically create a backup before deploying. Manual backup is no longer required.

### 2. Quick Health Check

```bash
# Run smoke tests
./scripts/smoke-test.sh

# Check service status
docker compose ps

# Check logs
docker compose logs --tail=50 backend
```

### 3. Manual Verification

```bash
# Full verification with monitoring
./scripts/verify-deployment.sh

# Quick smoke tests only
./scripts/smoke-test.sh
```

### 4. Backup and Restore

```bash
# Create manual backup
./scripts/backup-all.sh

# List backups
ls -lh backups/

# Get last deployment backup info
./scripts/get-last-backup.sh

# Restore using automatic rollback
./scripts/rollback.sh

# Manual restore - database (use commands from get-last-backup.sh)
gunzip -c <DB_BACKUP_FILE> | docker compose exec -T postgres psql -U schedgen -d schedgen

# Manual restore - MinIO (use commands from get-last-backup.sh)
docker run --rm -v schedgen_minio_data:/data -v $(pwd)/<BACKUP_DIR>:/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/<MINIO_BACKUP_FILE> -C /data'
```

### 5. Setup Automated Backups

```bash
# One-time setup
sudo ./scripts/setup-backup.sh

# Verify backup service
sudo systemctl status backup.timer
sudo systemctl status backup.service

# Test backup manually
sudo systemctl start backup.service
```

## Script Dependencies

### Required Tools

All scripts require:
- `bash` (version 4.0+)
- `docker` and `docker compose`
- `jq` (for JSON parsing)
- `curl` (for HTTP requests)

Backup scripts additionally require:
- `pg_dump` (for database backups)
- `gzip` (for compression)

### Environment Variables

Scripts use these environment variables (with defaults):

**Deployment**:
- `GIT_BRANCH` (default: `main`)
- `COMPOSE_FILE` (default: `docker-compose.yml`)
- `COMPOSE_PROD_FILE` (default: `docker-compose.prod.yml`)

**Verification**:
- `BACKEND_URL` (default: `http://localhost:3001`)
- `FRONTEND_URL` (default: `http://localhost:3000`)
- `MONITORING_DURATION` (default: `600` seconds)
- `ERROR_THRESHOLD` (default: `0.05` = 5%)

**Backup**:
- `BACKUP_DIR` (default: `./backups`)
- `RETENTION_DAYS` (default: `7`)

## Exit Codes

All scripts follow standard exit code conventions:
- `0`: Success
- `1`: General error
- `2`: Misuse of command
- `130`: Script terminated by Ctrl+C

## Logging

Scripts output colored logs:
- 🟢 **Green [INFO]**: Successful operations
- 🟡 **Yellow [WARN]**: Warnings (non-critical)
- 🔴 **Red [ERROR]**: Errors (critical)
- 🔵 **Blue [STEP]**: Major workflow steps

## Error Handling

All scripts use `set -e` to exit on errors. To continue on errors:
```bash
set +e
./scripts/some-script.sh
set -e
```

## Timeouts

Scripts include timeout protection:
- Health checks: 5 minutes max
- Service updates: 10 minutes max
- Database migrations: 5 minutes max
- Container builds: 30 minutes max

## Troubleshooting

### Script Fails with "Permission Denied"

```bash
# Make script executable
chmod +x scripts/<script-name>.sh
```

### Script Fails with "jq: command not found"

```bash
# Install jq
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### Script Fails with "docker: command not found"

```bash
# Ensure Docker is installed and in PATH
which docker

# Add to PATH if needed
export PATH=$PATH:/usr/local/bin
```

### Verification Fails During Monitoring

Check the specific error message and refer to:
- [Deployment Verification Guide](../docs/production/DEPLOYMENT_VERIFICATION.md)
- [Troubleshooting Guide](../docs/production/TROUBLESHOOTING.md)

## Best Practices

### 1. Always Backup Before Deployment

```bash
./scripts/backup-all.sh && ./scripts/deploy.sh
```

### 2. Test Scripts in Staging First

```bash
# Test with staging environment
BACKEND_URL=https://staging-api.example.com ./scripts/verify-deployment.sh
```

### 3. Save Script Output

```bash
./scripts/deploy.sh 2>&1 | tee deploy-$(date +%Y%m%d-%H%M%S).log
```

### 4. Use Timeouts for Long-Running Scripts

```bash
timeout 30m ./scripts/deploy.sh
```

### 5. Monitor During Deployment

Keep Grafana open during deployment:
```bash
open http://localhost:3002
./scripts/deploy.sh
```

## Related Documentation

- [Deployment Verification Guide](../docs/production/DEPLOYMENT_VERIFICATION.md)
- [Rolling Deployment Guide](../docs/production/ROLLING_DEPLOYMENT.md)
- [Rollback Guide](../docs/production/ROLLBACK_GUIDE.md)
- [Rollback Quick Reference](../docs/production/ROLLBACK_QUICK_REFERENCE.md)
- [Backup Automation Guide](../docs/production/BACKUP_AUTOMATION.md)
- [Production Runbooks](../docs/production/)

## Contributing

When adding new scripts:

1. **Follow naming conventions**: Use kebab-case (e.g., `my-script.sh`)
2. **Add documentation**: Include header comment with purpose and usage
3. **Use color codes**: Follow existing color scheme for output
4. **Include error handling**: Use `set -e` and check return codes
5. **Add to this README**: Document the new script
6. **Make executable**: `chmod +x scripts/new-script.sh`
7. **Test thoroughly**: Test in staging before production

## Support

For issues with scripts:
1. Check script output for specific error messages
2. Review related documentation
3. Check Docker logs: `docker compose logs`
4. Verify environment variables are set correctly
5. Ensure all dependencies are installed

## License

These scripts are part of the UP Schedule Generator project.
