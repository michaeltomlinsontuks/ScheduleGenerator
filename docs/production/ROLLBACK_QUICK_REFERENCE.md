# Rollback Quick Reference

## Quick Commands

### Deploy with Automatic Rollback
```bash
bash scripts/deploy.sh --with-rollback
```

### Manual Rollback
```bash
bash scripts/rollback.sh
```

### Check Last Backup
```bash
bash scripts/backup-all.sh --last
```

### Non-Interactive Rollback
```bash
export ROLLBACK_CONFIRM="yes"
bash scripts/rollback.sh
```

## Automatic Rollback Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Consecutive health check failures | 3 failures | Immediate rollback |
| High error rate | >10% over 10 min | Rollback after monitoring |
| Deployment script failure | Any error | Immediate rollback |
| Verification failure | Any failure | Immediate rollback |

## Configuration

```bash
# Set monitoring duration (default: 600s)
export MONITORING_DURATION=600

# Set error threshold (default: 0.10 = 10%)
export ERROR_THRESHOLD=0.10

# Auto-confirm rollback
export ROLLBACK_CONFIRM="yes"
```

## Rollback Process

1. Load backup information
2. Stop all services
3. Restore database
4. Restore MinIO volumes
5. Revert Git commit
6. Rebuild containers
7. Start services
8. Verify success

**Typical Duration**: 10-25 minutes

## Verification Commands

```bash
# Check service status
docker compose ps

# Check health endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# Check database
docker compose exec postgres psql -U schedgen -d schedgen -c "\dt"

# Check logs
docker compose logs --tail=50 backend frontend pdf-worker
```

## Troubleshooting

### Backup Not Found
```bash
# List backups
ls -lh backups/

# Check backup info
cat .last-deployment-backup
```

### Database Restore Fails
```bash
# Verify backup
gzip -t ./backups/pre-deployment-*/db_*.sql.gz

# Check PostgreSQL
docker compose logs postgres

# Manual restore
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen
```

### Services Won't Start
```bash
# Check resources
docker info
df -h

# Start individually
docker compose up -d postgres
docker compose up -d redis
docker compose up -d backend
```

## Emergency Recovery

### Without Backup
```bash
# 1. Find last good commit
git log --oneline -10

# 2. Checkout commit
git checkout <commit-hash>

# 3. Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Complete Recovery
```bash
# 1. Stop everything
docker compose down --volumes

# 2. Restore database
docker compose up -d postgres
sleep 10
gunzip -c ./backups/pre-deployment-*/db_*.sql.gz | \
  docker compose exec -T postgres psql -U schedgen -d schedgen

# 3. Restore MinIO
docker run --rm \
  -v schedgen_minio_data:/data \
  -v $(pwd)/backups/pre-deployment-*:/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/minio_*.tar.gz -C /data'

# 4. Revert code
source .last-deployment-backup
git checkout $GIT_COMMIT

# 5. Rebuild and start
docker compose build --no-cache
docker compose up -d
```

## Monitoring During Rollback

Watch for these indicators:

```
Progress: 120s / 600s | Checks: 12 | Failures: 0 (0.00%) | Consecutive: 0 | Remaining: 480s
```

- **Checks**: Total health checks performed
- **Failures**: Failed checks and error rate
- **Consecutive**: Consecutive failures (triggers at 3)
- **Remaining**: Time left in monitoring

## When to Rollback

**Automatic rollback triggers on**:
- Health check failures
- High error rates
- Deployment failures
- Verification failures

**Manual rollback when**:
- Issues found after monitoring
- Performance degradation
- Data corruption detected
- Security issues discovered

## Post-Rollback Checklist

- [ ] Verify all services running
- [ ] Check health endpoints
- [ ] Test critical user flows
- [ ] Review logs for errors
- [ ] Monitor metrics for 1-2 hours
- [ ] Document failure cause
- [ ] Plan fix for redeployment

## Related Documentation

- [Complete Rollback Guide](./ROLLBACK_GUIDE.md)
- [Deployment Guide](./ROLLING_DEPLOYMENT.md)
- [Backup Guide](./BACKUP_RUNBOOK.md)
- [Verification Guide](./DEPLOYMENT_VERIFICATION.md)

## Support Contacts

If rollback fails or issues persist:

1. Check logs: `docker compose logs`
2. Review backup: `bash scripts/backup-all.sh --last`
3. Contact development team with:
   - Rollback output
   - Service logs
   - Error messages
   - Backup information
