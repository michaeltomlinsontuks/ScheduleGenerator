# Deployment Verification - Quick Reference

## Quick Commands

### Run Full Verification
```bash
./scripts/verify-deployment.sh
```
⏱️ Duration: ~10-15 minutes

### Run Quick Smoke Tests
```bash
./scripts/smoke-test.sh
```
⏱️ Duration: ~30 seconds

### Deploy with Automatic Verification
```bash
./scripts/deploy.sh
```
⏱️ Duration: ~15-20 minutes (includes verification)

## What Gets Verified

### ✅ Service Status
- PostgreSQL running
- Redis running
- MinIO running
- Backend running
- Frontend running
- PDF Worker running

### ✅ Health Endpoints
- `GET /health` → 200 OK
- `GET /health/db` → 200 OK
- `GET /` (frontend) → 200 OK

### ✅ Smoke Tests
- API root endpoint
- Metrics endpoint (Prometheus format)
- Job queue metrics (JSON)
- Upload endpoint CORS

### ✅ Monitoring Stack
- Prometheus healthy
- Grafana healthy
- Backend metrics being scraped

### ✅ Error Rate Monitoring
- 10-minute continuous monitoring
- Error rate < 5% threshold
- Real-time progress display

## Configuration

### Environment Variables

```bash
# Backend URL (default: http://localhost:3001)
BACKEND_URL=http://api.example.com

# Frontend URL (default: http://localhost:3000)
FRONTEND_URL=http://app.example.com

# Monitoring duration in seconds (default: 600)
MONITORING_DURATION=300

# Error rate threshold (default: 0.05 = 5%)
ERROR_THRESHOLD=0.10
```

### Example: Custom Configuration

```bash
BACKEND_URL=http://api.example.com \
MONITORING_DURATION=300 \
ERROR_THRESHOLD=0.10 \
./scripts/verify-deployment.sh
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Verification successful |
| 1 | Verification failed |

## Common Issues

### Issue: Service Not Running

**Symptom**: "Service X is not running"

**Fix**:
```bash
# Check status
docker compose ps

# Restart service
docker compose up -d <service-name>

# Check logs
docker compose logs <service-name>
```

### Issue: Health Check Failed

**Symptom**: "Backend health check failed"

**Fix**:
```bash
# Test manually
curl -v http://localhost:3001/health

# Check backend logs
docker compose logs backend

# Check database
docker compose exec backend npm run typeorm query "SELECT 1"
```

### Issue: High Error Rate

**Symptom**: "Error rate (X%) exceeds threshold"

**Fix**:
```bash
# Check backend logs
docker compose logs backend | tail -100

# Check resource usage
docker stats

# Consider rollback
./scripts/rollback.sh
```

### Issue: Monitoring Stack Not Accessible

**Symptom**: "Prometheus is not accessible"

**Fix**:
```bash
# Check if running
docker compose ps prometheus grafana

# Restart monitoring
docker compose restart prometheus grafana

# Check logs
docker compose logs prometheus grafana
```

## Verification Output

### Successful Verification

```
=== Deployment Verification Script ===
Started at: 2024-01-15 10:30:00

[STEP] Step 1: Verifying all services are running
[INFO] ✓ postgres is running
[INFO] ✓ redis is running
[INFO] ✓ minio is running
[INFO] ✓ backend is running
[INFO] ✓ frontend is running
[INFO] ✓ pdf-worker is running

[STEP] Step 2: Verifying health checks
[INFO] ✓ Backend health check passed
[INFO] ✓ Database health check passed
[INFO] ✓ Frontend is accessible

[STEP] Step 3: Running smoke tests
[INFO] ✓ API root endpoint accessible
[INFO] ✓ Metrics endpoint accessible
[INFO] ✓ Job queue metrics accessible

[STEP] Step 4: Verifying monitoring stack
[INFO] ✓ Prometheus is healthy
[INFO] ✓ Grafana is healthy

[STEP] Step 5: Monitoring error rates for 600s
Progress: 600s / 600s | Requests: 60 | Errors: 0 (0.00%) | Remaining: 0s
[INFO] ✓ Error rate within acceptable limits

[STEP] Deployment Verification Complete
✓ All services are running
✓ Health checks passed
✓ Smoke tests completed
✓ Error rate within acceptable limits

Deployment verification successful!
```

### Failed Verification

```
[ERROR] ✗ backend is not running (state: exited)
[ERROR] Not all services are running
```

## Integration Examples

### GitHub Actions

```yaml
- name: Deploy to production
  run: ./scripts/deploy.sh

- name: Verify deployment
  run: ./scripts/verify-deployment.sh
  timeout-minutes: 15

- name: Rollback on failure
  if: failure()
  run: ./scripts/rollback.sh
```

### Cron Job (Periodic Health Checks)

```bash
# Run smoke tests every 5 minutes
*/5 * * * * /path/to/scripts/smoke-test.sh || /path/to/alert.sh
```

### Manual Deployment Workflow

```bash
# 1. Backup
./scripts/backup-all.sh

# 2. Deploy (includes verification)
./scripts/deploy.sh

# 3. Monitor
docker compose logs -f backend frontend pdf-worker

# 4. Check Grafana
open http://localhost:3002
```

## Monitoring During Verification

### Real-time Progress

```
Progress: 120s / 600s | Requests: 12 | Errors: 0 (0.00%) | Remaining: 480s
```

**What it shows**:
- Elapsed time: 120 seconds
- Total monitoring time: 600 seconds (10 minutes)
- Requests made: 12
- Failed requests: 0
- Error rate: 0.00%
- Time remaining: 480 seconds

### What to Watch

- ✅ Error rate stays at 0%
- ✅ Requests are being made regularly
- ✅ No timeout errors
- ⚠️ Error rate > 1% (investigate)
- 🚨 Error rate > 5% (verification fails)

## Best Practices

### ✅ DO

- Run verification after every deployment
- Monitor Grafana during verification
- Save verification logs for review
- Run smoke tests frequently
- Establish baseline metrics

### ❌ DON'T

- Skip verification for "small" changes
- Ignore warnings
- Deploy without backup
- Proceed if verification fails
- Disable monitoring period

## Quick Troubleshooting

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Service not running | Failed to start | Check logs, restart service |
| Health check timeout | Service overloaded | Check resources, scale up |
| High error rate | Code issue | Check logs, consider rollback |
| Metrics not accessible | Prometheus down | Restart Prometheus |
| Frontend not accessible | Build failed | Check frontend logs |

## Related Documentation

- [Full Verification Guide](./DEPLOYMENT_VERIFICATION.md)
- [Deployment Guide](./ROLLING_DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Scripts README](../../scripts/README.md)

## Support Checklist

If verification fails:

- [ ] Check service status: `docker compose ps`
- [ ] Review logs: `docker compose logs --tail=100`
- [ ] Test health endpoints manually
- [ ] Check resource usage: `docker stats`
- [ ] Review recent changes
- [ ] Check Grafana dashboards
- [ ] Consider rollback if critical

## Summary

**Quick verification**: `./scripts/smoke-test.sh` (~30s)

**Full verification**: `./scripts/verify-deployment.sh` (~10-15min)

**Deploy + verify**: `./scripts/deploy.sh` (~15-20min)

**Always verify after deployment!** 🚀
