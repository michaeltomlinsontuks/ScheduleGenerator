# Backup Quick Reference

## Quick Start

### Docker Compose (Recommended)

```bash
# Start backup service
docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup

# View logs
docker logs -f schedgen-backup

# Manual backup
docker exec schedgen-backup /usr/local/bin/backup-all.sh

# Stop backup service
docker compose -f docker-compose.backup.yml stop backup
```

### Automated Setup

```bash
# Setup automated backups (see Backup Automation guide)
# Option 1: Docker Compose
docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup

# Option 2: Systemd
sudo cp scripts/backup.service /etc/systemd/system/
sudo cp scripts/backup.timer /etc/systemd/system/
sudo systemctl enable backup.timer
sudo systemctl start backup.timer

# Option 3: Cron
sudo cp scripts/backup-cron /etc/cron.d/schedgen-backup
```

## Common Commands

### Check Backup Status

```bash
# List backups
ls -lh backups/

# Check backup sizes
du -sh backups/*

# Count backups
ls backups/db_*.sql.gz | wc -l
ls backups/minio_*.tar.gz | wc -l
```

### Manual Backup

```bash
# Docker environment
docker exec schedgen-backup /usr/local/bin/backup-all.sh

# Direct execution
./scripts/backup-all.sh
```

### Restore Database

```bash
# Stop backend
docker compose stop backend

# Restore
gunzip -c backups/db_schedgen_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i schedgen-postgres psql -U schedgen -d schedgen

# Start backend
docker compose start backend
```

### Restore MinIO

```bash
# Stop services
docker compose stop backend pdf-worker minio

# Remove old volume
docker volume rm schedgen_minio_data

# Create new volume
docker volume create schedgen_minio_data

# Restore
docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  tar xzf /backup/minio_schedgen-pdfs_YYYYMMDD_HHMMSS.tar.gz -C /data

# Start services
docker compose up -d
```

## Configuration

### Environment Variables

```bash
# In .env file
BACKUP_SCHEDULE="0 2 * * *"              # Daily at 2 AM
BACKUP_RETENTION_DAYS=7                   # Keep 7 days
BACKUP_ALERT_WEBHOOK_URL=https://...     # Slack/Discord webhook
BACKUP_ALERT_EMAIL=admin@example.com     # Email alerts
```

### Backup Schedule Examples

```bash
# Daily at 2 AM
BACKUP_SCHEDULE="0 2 * * *"

# Every 6 hours
BACKUP_SCHEDULE="0 */6 * * *"

# Weekly on Sunday at midnight
BACKUP_SCHEDULE="0 0 * * 0"

# Twice daily (2 AM and 2 PM)
BACKUP_SCHEDULE="0 2,14 * * *"
```

## Monitoring

### View Logs

```bash
# Docker
docker logs -f schedgen-backup

# Systemd
sudo journalctl -u backup.service -f

# Cron
tail -f /var/log/schedgen-backup.log
```

### Check Last Backup

```bash
# Most recent database backup
ls -lt backups/db_*.sql.gz | head -1

# Most recent MinIO backup
ls -lt backups/minio_*.tar.gz | head -1

# Backup age
stat -f "%Sm" backups/db_*.sql.gz | head -1  # macOS
stat -c "%y" backups/db_*.sql.gz | head -1   # Linux
```

## Troubleshooting

### Backup Fails

```bash
# Check permissions
ls -l scripts/backup-all.sh
chmod +x scripts/backup-all.sh

# Check environment
docker exec schedgen-backup env | grep -E 'POSTGRES|MINIO'

# Check disk space
df -h

# Run with debug
docker exec schedgen-backup sh -x /usr/local/bin/backup-all.sh
```

### Restore Fails

```bash
# Verify backup integrity
gunzip -t backups/db_schedgen_*.sql.gz
tar -tzf backups/minio_*.tar.gz > /dev/null

# Check database connection
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT 1"

# Check volume exists
docker volume ls | grep minio
```

## Alert Testing

### Test Webhook

```bash
curl -X POST "$BACKUP_ALERT_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test backup alert"}'
```

### Test Email

```bash
echo "Test backup alert" | mail -s "Test" admin@example.com
```

## Related Documents

- [Full Backup Documentation](./BACKUP_AUTOMATION.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Deployment Guide](./DEPLOYMENT.md)
