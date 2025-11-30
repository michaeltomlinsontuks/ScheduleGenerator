# Pre-Deployment Backup

## Overview

The deployment script automatically creates a complete system backup before deploying any changes. This ensures that the system can be restored to its pre-deployment state if issues occur during or after deployment.

**Requirement**: 12.5 - WHEN deployment is triggered THEN the System SHALL create a backup before proceeding

## How It Works

### Automatic Backup Creation

When you run `scripts/deploy.sh`, the script automatically:

1. **Creates a timestamped backup directory** at `./backups/pre-deployment-YYYYMMDD_HHMMSS/`
2. **Backs up the PostgreSQL database** to a compressed SQL file
3. **Backs up MinIO volumes** containing uploaded PDFs
4. **Verifies backup integrity** by checking file sizes and compression validity
5. **Stores backup location** in `.last-deployment-backup` for easy rollback access

### Backup Verification

The script performs the following verification checks:

- **Database backup**: Must be at least 1KB and valid gzip format
- **MinIO backup**: Must be at least 512 bytes and valid tar.gz format
- **Compression integrity**: Both files are tested with `gzip -t`

If any verification fails, the deployment is **aborted** to prevent data loss.

## Backup Location

Backups are stored in:
```
./backups/pre-deployment-YYYYMMDD_HHMMSS/
├── db_schedgen_YYYYMMDD_HHMMSS.sql.gz      # Database backup
└── minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz  # MinIO backup
```

The `.last-deployment-backup` file contains:
- Deployment timestamp
- Backup directory path
- Database backup file path
- MinIO backup file path
- Git commit hash
- Git branch name

## Retrieving Backup Information

To view information about the last deployment backup:

```bash
bash scripts/get-last-backup.sh
```

This displays:
- Deployment timestamp
- Backup directory location
- Git commit and branch
- Backup file sizes
- Rollback commands

## Using Backups for Rollback

### Quick Rollback Commands

The `get-last-backup.sh` script provides ready-to-use rollback commands. Example output:

```bash
=== Usage for Rollback ===

To restore the database:
  gunzip -c ./backups/pre-deployment-20241130_143022/db_schedgen_20241130_143022.sql.gz | \
    docker compose exec -T postgres psql -U schedgen -d schedgen

To restore MinIO volumes:
  docker run --rm -v schedgen_minio_data:/data \
    -v $(pwd)/backups/pre-deployment-20241130_143022:/backup alpine \
    sh -c 'rm -rf /data/* && tar xzf /backup/minio_schedgen-pdfs_20241130_143022.tar.gz -C /data'
```

### Manual Rollback Process

If you need to manually restore from a specific backup:

1. **Stop the services**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml down
   ```

2. **Restore the database**:
   ```bash
   # Start only PostgreSQL
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
   
   # Restore from backup
   gunzip -c ./backups/pre-deployment-TIMESTAMP/db_schedgen_TIMESTAMP.sql.gz | \
     docker compose exec -T postgres psql -U schedgen -d schedgen
   ```

3. **Restore MinIO volumes**:
   ```bash
   docker run --rm \
     -v schedgen_minio_data:/data \
     -v $(pwd)/backups/pre-deployment-TIMESTAMP:/backup \
     alpine sh -c 'rm -rf /data/* && tar xzf /backup/minio_*.tar.gz -C /data'
   ```

4. **Revert code changes**:
   ```bash
   # Get the commit hash from .last-deployment-backup
   git checkout <COMMIT_HASH>
   ```

5. **Restart services**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Backup Retention

Pre-deployment backups follow the same retention policy as regular backups:

- **Retention period**: 7 days
- **Automatic cleanup**: Old backups are removed by the backup script
- **Manual cleanup**: You can safely delete old backup directories after 7 days

## Troubleshooting

### Backup Creation Fails

If backup creation fails, the deployment is automatically aborted. Common causes:

1. **Insufficient disk space**: Check available disk space with `df -h`
2. **Database connection issues**: Verify PostgreSQL is running and accessible
3. **Missing credentials**: Ensure `POSTGRES_PASSWORD`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` are set

### Backup Verification Fails

If backup verification fails:

1. **File too small**: May indicate database is empty or MinIO has no data
2. **Corrupted file**: Disk I/O issues or interrupted backup process
3. **Missing file**: Backup script failed silently

Check the backup script logs for detailed error messages.

### Rollback Issues

If rollback fails:

1. **Database restore errors**: Check PostgreSQL logs with `docker compose logs postgres`
2. **MinIO restore errors**: Verify volume permissions and available space
3. **Service startup failures**: Check application logs for migration or configuration issues

## Integration with Deployment

The pre-deployment backup is integrated into the deployment workflow:

```
Deployment Flow:
1. Pre-flight checks
2. ✓ Pre-deployment backup (NEW)
3. Pull latest code
4. Build containers
5. Run database migrations
6. Rolling update - Infrastructure
7. Rolling update - Application
8. Rolling update - Monitoring
9. Post-deployment verification
10. Cleanup
```

The backup step occurs **before** any code changes or migrations, ensuring a clean restore point.

## Best Practices

1. **Monitor backup size**: Regularly check that backups are growing appropriately with data
2. **Test restores**: Periodically test the restore process in a non-production environment
3. **Keep backup info**: Don't delete `.last-deployment-backup` until the next deployment
4. **Document custom data**: If you have custom data outside PostgreSQL/MinIO, document backup procedures
5. **Alert on failures**: Configure `BACKUP_ALERT_WEBHOOK_URL` or `BACKUP_ALERT_EMAIL` for notifications

## Related Documentation

- [Deployment Guide](./ROLLING_DEPLOYMENT.md)
- [Backup Automation](./BACKUP_AUTOMATION.md)
- [Backup Runbook](./BACKUP_RUNBOOK.md)
- [Deployment Verification](./DEPLOYMENT_VERIFICATION.md)

## Requirements Validation

This implementation satisfies:

- **Requirement 12.5**: WHEN deployment is triggered THEN the System SHALL create a backup before proceeding
  - ✓ Backup created automatically before any deployment changes
  - ✓ Backup integrity verified before proceeding
  - ✓ Backup location stored for rollback access
  - ✓ Deployment aborted if backup fails
