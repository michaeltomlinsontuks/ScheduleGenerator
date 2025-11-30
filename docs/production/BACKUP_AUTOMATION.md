# Automated Backup Configuration

## Overview

This document describes the automated backup system for the UP Schedule Generator. The system performs daily backups of both the PostgreSQL database and MinIO object storage, with configurable alerting on failure.

**Requirements Addressed**: 9.1, 9.4, 9.5

## Features

- **Daily automated backups** at 2:00 AM (configurable)
- **PostgreSQL database backup** with compression
- **MinIO volume backup** including all uploaded PDFs
- **7-day retention policy** with automatic cleanup
- **Backup verification** to ensure integrity
- **Alert notifications** on backup failure (webhook and email)
- **Multiple deployment options** (cron, systemd, Docker)

## Backup Components

### 1. Backup Script (`scripts/backup-all.sh`)

The main backup script that:
- Creates timestamped backups of PostgreSQL database
- Creates timestamped backups of MinIO volumes
- Verifies backup integrity
- Removes backups older than 7 days
- Sends alerts on failure

### 2. Backup Files

Backups are stored in `./backups/` directory:
- Database: `db_schedgen_YYYYMMDD_HHMMSS.sql.gz`
- MinIO: `minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz`

## Deployment Options

### Option 1: Docker Compose (Recommended for Production)

**Advantages**: Containerized, portable, easy to manage

1. **Start the backup service**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup
   ```

2. **Configure backup schedule** (optional):
   ```bash
   # In .env file
   BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2:00 AM (default)
   # BACKUP_SCHEDULE="0 */6 * * *"  # Every 6 hours
   # BACKUP_SCHEDULE="0 0 * * 0"  # Weekly on Sunday
   ```

3. **Configure alerts** (optional):
   ```bash
   # In .env file
   BACKUP_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   BACKUP_ALERT_EMAIL=admin@example.com
   ```

4. **View backup logs**:
   ```bash
   docker logs schedgen-backup
   ```

5. **Trigger manual backup**:
   ```bash
   docker exec schedgen-backup /usr/local/bin/backup-all.sh
   ```

### Option 2: Systemd Timer (Linux Servers)

**Advantages**: Native Linux integration, runs without Docker

1. **Copy service files**:
   ```bash
   sudo cp scripts/backup.service /etc/systemd/system/
   sudo cp scripts/backup.timer /etc/systemd/system/
   ```

2. **Update paths in service file**:
   ```bash
   sudo nano /etc/systemd/system/backup.service
   # Update WorkingDirectory and ExecStart paths
   ```

3. **Enable and start timer**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable backup.timer
   sudo systemctl start backup.timer
   ```

4. **Check timer status**:
   ```bash
   sudo systemctl status backup.timer
   sudo systemctl list-timers
   ```

5. **View logs**:
   ```bash
   sudo journalctl -u backup.service -f
   ```

6. **Trigger manual backup**:
   ```bash
   sudo systemctl start backup.service
   ```

### Option 3: Cron (Traditional Approach)

**Advantages**: Simple, widely supported

1. **Install cron configuration**:
   ```bash
   sudo cp scripts/backup-cron /etc/cron.d/schedgen-backup
   sudo chmod 644 /etc/cron.d/schedgen-backup
   ```

2. **Update paths in cron file**:
   ```bash
   sudo nano /etc/cron.d/schedgen-backup
   # Update the path to your installation directory
   ```

3. **Restart cron**:
   ```bash
   sudo systemctl restart cron
   ```

4. **View logs**:
   ```bash
   tail -f /var/log/schedgen-backup.log
   ```

## Alert Configuration

### Webhook Alerts (Slack, Discord, etc.)

1. **Create webhook URL** in your chat platform
2. **Set environment variable**:
   ```bash
   export BACKUP_ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

3. **Test webhook**:
   ```bash
   curl -X POST "$BACKUP_ALERT_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test backup alert"}'
   ```

### Email Alerts

1. **Install mail utility**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mailutils
   
   # CentOS/RHEL
   sudo yum install mailx
   ```

2. **Configure SMTP** (if needed):
   ```bash
   # Edit /etc/mail.rc or /etc/mailrc
   set smtp=smtp.gmail.com:587
   set smtp-use-starttls
   set smtp-auth=login
   set smtp-auth-user=your-email@gmail.com
   set smtp-auth-password=your-app-password
   ```

3. **Set environment variable**:
   ```bash
   export BACKUP_ALERT_EMAIL="admin@example.com"
   ```

## Backup Verification

The backup script automatically verifies:
- Backup file exists
- Backup file size is reasonable (> 1KB for DB, > 512B for MinIO)
- Gzip compression integrity

Manual verification:
```bash
# Test database backup
gunzip -t backups/db_schedgen_*.sql.gz

# Test MinIO backup
tar -tzf backups/minio_schedgen-pdfs_*.tar.gz > /dev/null

# Inspect database backup contents
gunzip -c backups/db_schedgen_*.sql.gz | head -n 50
```

## Restore Procedures

### Restore Database

```bash
# Stop backend service
docker compose stop backend

# Restore from backup
gunzip -c backups/db_schedgen_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i schedgen-postgres psql -U schedgen -d schedgen

# Restart backend
docker compose start backend
```

### Restore MinIO Volumes

```bash
# Stop services
docker compose stop backend pdf-worker minio

# Remove old volume
docker volume rm schedgen_minio_data

# Create new volume
docker volume create schedgen_minio_data

# Restore from backup
docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  tar xzf /backup/minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz -C /data

# Restart services
docker compose up -d
```

## Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lh backups/

# Check backup sizes
du -sh backups/*

# Count backups
echo "Database backups: $(ls backups/db_*.sql.gz 2>/dev/null | wc -l)"
echo "MinIO backups: $(ls backups/minio_*.tar.gz 2>/dev/null | wc -l)"
```

### Grafana Dashboard

Add backup monitoring to Grafana:

1. **Create custom metric** in backup script:
   ```bash
   # Add to backup-all.sh
   echo "backup_success{type=\"database\"} 1" | curl --data-binary @- \
     http://prometheus:9090/metrics/job/backup
   ```

2. **Create alert rule** in Prometheus:
   ```yaml
   - alert: BackupFailed
     expr: time() - backup_last_success_timestamp > 86400
     for: 1h
     labels:
       severity: critical
     annotations:
       summary: "Backup has not run successfully in 24 hours"
   ```

## Troubleshooting

### Backup Script Fails

1. **Check permissions**:
   ```bash
   ls -l scripts/backup-all.sh
   chmod +x scripts/backup-all.sh
   ```

2. **Check environment variables**:
   ```bash
   docker exec schedgen-backup env | grep -E 'POSTGRES|MINIO'
   ```

3. **Check disk space**:
   ```bash
   df -h
   ```

4. **Run manually with verbose output**:
   ```bash
   docker exec schedgen-backup sh -x /usr/local/bin/backup-all.sh
   ```

### Cron Not Running

1. **Check cron service**:
   ```bash
   sudo systemctl status cron
   ```

2. **Check cron logs**:
   ```bash
   sudo grep CRON /var/log/syslog
   ```

3. **Verify cron syntax**:
   ```bash
   crontab -l
   ```

### Alerts Not Sending

1. **Test webhook manually**:
   ```bash
   curl -X POST "$BACKUP_ALERT_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test alert"}'
   ```

2. **Check email configuration**:
   ```bash
   echo "Test" | mail -s "Test" admin@example.com
   ```

3. **Check environment variables**:
   ```bash
   echo $BACKUP_ALERT_WEBHOOK_URL
   echo $BACKUP_ALERT_EMAIL
   ```

## Best Practices

1. **Test backups regularly** by performing restore tests
2. **Monitor backup sizes** to detect anomalies
3. **Store backups off-site** for disaster recovery
4. **Encrypt backups** if they contain sensitive data
5. **Document restore procedures** and test them
6. **Set up monitoring alerts** for backup failures
7. **Review backup logs** periodically

## Security Considerations

1. **Backup files contain sensitive data** - protect with appropriate permissions
2. **Use secure channels** for backup transfers
3. **Encrypt backups at rest** if storing off-site
4. **Rotate credentials** used for backups regularly
5. **Limit access** to backup files and scripts

## Related Documents

- [Production Readiness Requirements](../../.kiro/specs/production-readiness/requirements.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
