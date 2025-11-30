# Deployment Verification Guide

## Overview

This guide describes the deployment verification process that ensures the UP Schedule Generator is functioning correctly after deployment. The verification process includes health checks, smoke tests, and error rate monitoring.

## Verification Scripts

### 1. Full Verification (`verify-deployment.sh`)

**Purpose**: Comprehensive post-deployment verification including 10-minute monitoring

**Location**: `scripts/verify-deployment.sh`

**What it checks**:
- All services are running
- Health checks pass for all components
- Smoke tests for critical endpoints
- Monitoring stack (Prometheus, Grafana) is operational
- Error rates remain below 5% threshold over 10 minutes
- Container resource usage
- Recent error logs

**Usage**:
```bash
# Run with default settings
./scripts/verify-deployment.sh

# Run with custom backend URL
BACKEND_URL=http://api.example.com ./scripts/verify-deployment.sh

# Run with shorter monitoring duration (for testing)
MONITORING_DURATION=60 ./scripts/verify-deployment.sh
```

**Duration**: ~10-15 minutes (includes 10-minute monitoring period)

**Exit codes**:
- `0`: Verification successful
- `1`: Verification failed

### 2. Quick Smoke Tests (`smoke-test.sh`)

**Purpose**: Fast verification of critical functionality

**Location**: `scripts/smoke-test.sh`

**What it checks**:
- Backend health endpoint
- Database health endpoint
- Frontend accessibility
- Metrics endpoint
- Job queue metrics
- CORS configuration

**Usage**:
```bash
# Run smoke tests
./scripts/smoke-test.sh

# Run with custom URLs
BACKEND_URL=http://api.example.com FRONTEND_URL=http://app.example.com ./scripts/smoke-test.sh
```

**Duration**: ~30 seconds

**Exit codes**:
- `0`: All tests passed
- `1`: One or more tests failed

## Verification Process

### Automated Verification (via deploy.sh)

The deployment script (`scripts/deploy.sh`) automatically runs verification after deployment:

1. **Basic health checks**: Verifies all services are running
2. **Service status display**: Shows current state of all containers
3. **Comprehensive verification**: Runs `verify-deployment.sh` automatically

If verification fails, the deployment script exits with an error code.

### Manual Verification

You can run verification manually at any time:

```bash
# Quick check (30 seconds)
./scripts/smoke-test.sh

# Full verification (10+ minutes)
./scripts/verify-deployment.sh
```

## Verification Steps Explained

### Step 1: Service Status Check

Verifies that all critical services are running:
- PostgreSQL (database)
- Redis (cache and queue)
- MinIO (object storage)
- Backend (API server)
- Frontend (web application)
- PDF Worker (processing service)

**What to do if it fails**:
```bash
# Check service logs
docker compose logs <service-name>

# Restart failed service
docker compose up -d <service-name>
```

### Step 2: Health Check Verification

Tests health endpoints to ensure services are responding correctly:

**Backend health**: `GET /health`
- Checks database, Redis, and MinIO connectivity
- Should return 200 OK with JSON response

**Database health**: `GET /health/db`
- Checks database connection pool status
- Returns connection pool metrics

**Frontend accessibility**: `GET /`
- Verifies frontend is serving pages
- Should return 200 OK

**What to do if it fails**:
```bash
# Check backend logs
docker compose logs backend

# Test health endpoint manually
curl -v http://localhost:3001/health

# Check database connectivity
docker compose exec backend npm run typeorm query "SELECT 1"
```

### Step 3: Smoke Tests

Runs quick functional tests on critical endpoints:

1. **API root endpoint**: Verifies API is accessible
2. **Metrics endpoint**: Checks Prometheus metrics are being exposed
3. **Job queue metrics**: Verifies queue is operational
4. **Upload endpoint CORS**: Checks CORS is configured

**What to do if it fails**:
- Check the specific endpoint that failed
- Review backend configuration
- Verify environment variables are set correctly

### Step 4: Monitoring Stack Verification

Checks that monitoring infrastructure is operational:

**Prometheus**:
- Health endpoint: `http://localhost:9090/-/healthy`
- Verifies backend is being scraped for metrics

**Grafana**:
- Health endpoint: `http://localhost:3002/api/health`
- Dashboards should be accessible

**What to do if it fails**:
```bash
# Check Prometheus logs
docker compose logs prometheus

# Check Grafana logs
docker compose logs grafana

# Verify Prometheus targets
curl http://localhost:9090/api/v1/targets | jq
```

### Step 5: Error Rate Monitoring

Monitors the backend health endpoint every 10 seconds for 10 minutes:

**Metrics tracked**:
- Total requests made
- Failed requests
- Error rate percentage

**Threshold**: Error rate must stay below 5%

**What to do if it fails**:
- Check backend logs for errors
- Review recent changes that might have introduced issues
- Check resource utilization (CPU, memory)
- Consider rolling back the deployment

### Step 6: Resource Usage Check

Displays current resource usage for all containers:
- CPU percentage
- Memory usage
- Memory percentage

**What to look for**:
- CPU usage should be reasonable (< 80% under normal load)
- Memory usage should not be at limits
- No containers should be restarting

### Step 7: Log Error Check

Scans recent logs for error messages:
- Checks last 100 log lines from backend
- Counts error messages
- Displays recent errors if found

**What to do if errors are found**:
- Review the error messages
- Determine if they are critical or expected
- Fix issues if necessary

## Configuration Options

### Environment Variables

**verify-deployment.sh**:
```bash
COMPOSE_FILE=docker-compose.yml              # Docker Compose file
COMPOSE_PROD_FILE=docker-compose.prod.yml    # Production overrides
BACKEND_URL=http://localhost:3001            # Backend URL
FRONTEND_URL=http://localhost:3000           # Frontend URL
MONITORING_DURATION=600                      # Monitoring duration (seconds)
ERROR_THRESHOLD=0.05                         # Error rate threshold (5%)
```

**smoke-test.sh**:
```bash
BACKEND_URL=http://localhost:3001            # Backend URL
FRONTEND_URL=http://localhost:3000           # Frontend URL
```

### Customizing Thresholds

To adjust the error rate threshold:
```bash
# Allow up to 10% error rate
ERROR_THRESHOLD=0.10 ./scripts/verify-deployment.sh
```

To adjust monitoring duration:
```bash
# Monitor for 5 minutes instead of 10
MONITORING_DURATION=300 ./scripts/verify-deployment.sh
```

## Integration with CI/CD

### GitHub Actions Example

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

### Manual Deployment Workflow

1. **Pre-deployment**:
   ```bash
   # Create backup
   ./scripts/backup-all.sh
   ```

2. **Deployment**:
   ```bash
   # Deploy with automatic verification
   ./scripts/deploy.sh
   ```

3. **Post-deployment** (if deploy.sh verification was skipped):
   ```bash
   # Run verification manually
   ./scripts/verify-deployment.sh
   ```

4. **Monitoring**:
   ```bash
   # Watch logs
   docker compose logs -f backend frontend pdf-worker
   
   # Check Grafana dashboards
   open http://localhost:3002
   ```

## Troubleshooting

### Verification Fails Immediately

**Symptoms**: Verification fails in Step 1 or 2

**Possible causes**:
- Services didn't start properly
- Configuration errors
- Resource constraints

**Solutions**:
```bash
# Check all service status
docker compose ps

# Check logs for errors
docker compose logs --tail=100

# Restart services
docker compose restart
```

### High Error Rate During Monitoring

**Symptoms**: Error rate exceeds 5% during 10-minute monitoring

**Possible causes**:
- Backend instability
- Database connection issues
- Resource exhaustion
- Recent code changes introduced bugs

**Solutions**:
```bash
# Check backend logs
docker compose logs backend | tail -100

# Check resource usage
docker stats

# Check database connections
docker compose exec backend npm run typeorm query \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='schedgen'"

# Consider rollback
./scripts/rollback.sh
```

### Monitoring Stack Not Accessible

**Symptoms**: Prometheus or Grafana health checks fail

**Possible causes**:
- Services not started
- Port conflicts
- Configuration errors

**Solutions**:
```bash
# Check if services are running
docker compose ps prometheus grafana

# Check logs
docker compose logs prometheus grafana

# Restart monitoring stack
docker compose restart prometheus grafana
```

### Smoke Tests Pass But Full Verification Fails

**Symptoms**: Quick smoke tests succeed but 10-minute monitoring fails

**Possible causes**:
- Intermittent issues
- Memory leaks
- Resource exhaustion over time

**Solutions**:
- Review monitoring output to see when failures started
- Check resource usage trends
- Review recent changes
- Consider load testing to identify issues

## Best Practices

### 1. Always Run Verification After Deployment

Never skip verification, even for "small" changes. The 10-minute monitoring period can catch issues that don't appear immediately.

### 2. Monitor Grafana During Verification

Keep Grafana dashboards open during verification to see real-time metrics:
- System Overview dashboard
- Job Processing dashboard
- Resource Utilization dashboard

### 3. Save Verification Logs

Redirect verification output to a file for later review:
```bash
./scripts/verify-deployment.sh 2>&1 | tee verification-$(date +%Y%m%d-%H%M%S).log
```

### 4. Run Smoke Tests Frequently

Use smoke tests for quick health checks:
```bash
# Add to cron for periodic checks
*/5 * * * * /path/to/scripts/smoke-test.sh || /path/to/alert.sh
```

### 5. Establish Baseline Metrics

Before making changes, run verification to establish baseline:
```bash
# Before changes
./scripts/verify-deployment.sh > baseline.log

# After changes
./scripts/verify-deployment.sh > after-changes.log

# Compare
diff baseline.log after-changes.log
```

## Related Documentation

- [Deployment Guide](./ROLLING_DEPLOYMENT.md)
- [Rollback Procedures](./ROLLBACK_RUNBOOK.md)
- [Monitoring Guide](../../monitoring/README.md)
- [Health Check Implementation](../../backend/src/health/README.md)

## Requirements Validation

This verification process validates the following requirements:

- **Requirement 12.4**: Deployment verification with health checks and smoke tests
- **Requirement 6.1**: Health check endpoints respond within 5 seconds
- **Requirement 6.2**: Metrics are exposed and accessible
- **Requirement 10.4**: Load balancing works correctly across instances

## Summary

The deployment verification process ensures that:
1. ✓ All services are running and healthy
2. ✓ Critical endpoints are accessible
3. ✓ Monitoring infrastructure is operational
4. ✓ Error rates remain within acceptable limits
5. ✓ System is stable over time

Always run verification after deployment and address any failures before considering the deployment complete.
