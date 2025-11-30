# Verification Scripts - Quick Start Guide

## 🚀 Quick Start

### 1. Run Quick Smoke Tests (30 seconds)

```bash
./scripts/smoke-test.sh
```

**What it does**: Tests 6 critical endpoints to verify basic functionality

**When to use**: 
- Quick health check
- After making changes
- Periodic monitoring
- Before starting work

---

### 2. Run Full Verification (10-15 minutes)

```bash
./scripts/verify-deployment.sh
```

**What it does**: Comprehensive verification including 10-minute error rate monitoring

**When to use**:
- After deployment
- Before going live
- After major changes
- Weekly health check

---

### 3. Deploy with Automatic Verification (15-20 minutes)

```bash
./scripts/deploy.sh
```

**What it does**: Deploys code and automatically runs full verification

**When to use**:
- Production deployments
- Staging deployments
- Release process

---

## 📊 What Gets Checked

### Smoke Tests (Quick)
✅ Backend health endpoint
✅ Database health endpoint  
✅ Frontend accessibility
✅ Metrics endpoint
✅ Job queue metrics
✅ CORS configuration

### Full Verification (Comprehensive)
✅ All smoke tests
✅ Service status (all containers)
✅ Monitoring stack (Prometheus, Grafana)
✅ Error rate monitoring (10 minutes)
✅ Resource usage
✅ Log error scanning

---

## 🎯 Common Use Cases

### Use Case 1: Quick Health Check

```bash
# Just want to know if everything is working
./scripts/smoke-test.sh
```

**Output**:
```
✓ All smoke tests passed
```

---

### Use Case 2: After Deployment

```bash
# Deployed manually, now verify
./scripts/verify-deployment.sh
```

**Output**:
```
✓ All services are running
✓ Health checks passed
✓ Smoke tests completed
✓ Error rate within acceptable limits
```

---

### Use Case 3: Automated Deployment

```bash
# Deploy and verify in one command
./scripts/deploy.sh
```

**Output**:
```
=== Deployment Complete ===
=== Running Verification ===
✓ Deployment verification successful!
```

---

### Use Case 4: Custom Configuration

```bash
# Shorter monitoring for testing
MONITORING_DURATION=60 ./scripts/verify-deployment.sh

# Different environment
BACKEND_URL=https://api.example.com ./scripts/smoke-test.sh

# Higher error threshold
ERROR_THRESHOLD=0.10 ./scripts/verify-deployment.sh
```

---

## ⚙️ Configuration

### Quick Configuration

```bash
# Set environment variables before running
export BACKEND_URL=http://localhost:3001
export FRONTEND_URL=http://localhost:3000
export MONITORING_DURATION=600
export ERROR_THRESHOLD=0.05

# Then run
./scripts/verify-deployment.sh
```

### Inline Configuration

```bash
# Configure inline
BACKEND_URL=http://api.example.com \
MONITORING_DURATION=300 \
./scripts/verify-deployment.sh
```

---

## 🔍 Understanding Output

### Smoke Test Output

```bash
=== Smoke Test Suite ===
Testing Backend health... ✓ PASS
Testing Database health... ✓ PASS
Testing Frontend accessibility... ✓ PASS
Testing Metrics endpoint... ✓ PASS
Testing Job queue metrics... ✓ PASS
Testing CORS configuration... ✓ PASS

=== Results ===
Passed: 6
Failed: 0

✓ All smoke tests passed
```

**What it means**: All critical endpoints are working correctly

---

### Verification Progress

```
Progress: 120s / 600s | Requests: 12 | Errors: 0 (0.00%) | Remaining: 480s
```

**Reading the progress**:
- `120s / 600s`: 120 seconds elapsed out of 600 total
- `Requests: 12`: 12 health checks made so far
- `Errors: 0 (0.00%)`: No errors, 0% error rate
- `Remaining: 480s`: 480 seconds left

---

## ❌ What to Do If It Fails

### Failure: Service Not Running

```
[ERROR] ✗ backend is not running (state: exited)
```

**Fix**:
```bash
# Check logs
docker compose logs backend

# Restart service
docker compose up -d backend

# Try again
./scripts/smoke-test.sh
```

---

### Failure: Health Check Failed

```
[ERROR] ✗ Backend health check failed
```

**Fix**:
```bash
# Test manually
curl -v http://localhost:3001/health

# Check backend logs
docker compose logs backend | tail -50

# Check database
docker compose ps postgres
```

---

### Failure: High Error Rate

```
[ERROR] Error rate (8.33%) exceeds threshold (5.00%)
```

**Fix**:
```bash
# Check what's failing
docker compose logs backend | grep -i error

# Check resource usage
docker stats

# Consider rollback
./scripts/rollback.sh
```

---

## 🔧 Troubleshooting Commands

### Check Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs --tail=50

# Specific service
docker compose logs backend --tail=100

# Follow logs
docker compose logs -f backend
```

### Test Endpoints Manually
```bash
# Backend health
curl http://localhost:3001/health | jq

# Database health
curl http://localhost:3001/health/db | jq

# Metrics
curl http://localhost:3001/metrics | head -20

# Queue metrics
curl http://localhost:3001/api/jobs/metrics | jq
```

### Check Resources
```bash
# Container stats
docker stats --no-stream

# Disk usage
docker system df

# Network
docker network ls
```

---

## 📅 Recommended Schedule

### Daily
```bash
# Quick morning check
./scripts/smoke-test.sh
```

### After Each Deployment
```bash
# Automatic with deploy
./scripts/deploy.sh

# Or manual
./scripts/verify-deployment.sh
```

### Weekly
```bash
# Full verification
./scripts/verify-deployment.sh

# Save results
./scripts/verify-deployment.sh > weekly-check-$(date +%Y%m%d).log
```

### On-Demand
```bash
# When something seems wrong
./scripts/smoke-test.sh

# Before important events
./scripts/verify-deployment.sh
```

---

## 🎓 Best Practices

### ✅ DO

- Run smoke tests frequently
- Always verify after deployment
- Save verification logs
- Monitor during verification
- Investigate warnings

### ❌ DON'T

- Skip verification for "small" changes
- Ignore failed tests
- Deploy without backup
- Proceed if verification fails
- Disable monitoring period

---

## 📚 More Information

### Full Documentation
- [Deployment Verification Guide](../docs/production/DEPLOYMENT_VERIFICATION.md)
- [Quick Reference](../docs/production/VERIFICATION_QUICK_REFERENCE.md)
- [Scripts README](./README.md)

### Related Guides
- [Deployment Guide](../docs/production/ROLLING_DEPLOYMENT.md)
- [Troubleshooting](../docs/production/TROUBLESHOOTING.md)
- [Monitoring Guide](../monitoring/README.md)

---

## 🆘 Getting Help

### Check These First

1. **Service logs**: `docker compose logs <service>`
2. **Service status**: `docker compose ps`
3. **Resource usage**: `docker stats`
4. **Recent changes**: `git log --oneline -10`

### Still Having Issues?

1. Review the full documentation
2. Check Grafana dashboards
3. Review recent deployments
4. Consider rollback if critical

---

## 📝 Quick Reference Card

| Command | Duration | Use Case |
|---------|----------|----------|
| `./scripts/smoke-test.sh` | 30s | Quick check |
| `./scripts/verify-deployment.sh` | 10-15min | Full verification |
| `./scripts/deploy.sh` | 15-20min | Deploy + verify |

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success ✅ |
| 1 | Failure ❌ |

| Environment Variable | Default | Purpose |
|---------------------|---------|---------|
| `BACKEND_URL` | `http://localhost:3001` | Backend URL |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL |
| `MONITORING_DURATION` | `600` | Monitoring time (seconds) |
| `ERROR_THRESHOLD` | `0.05` | Error rate threshold (5%) |

---

## 🎉 Success!

If all tests pass, you'll see:

```
✓ All smoke tests passed
```

or

```
✓ Deployment verification successful!
```

**You're good to go!** 🚀

---

**Remember**: Always verify after deployment! 🔍
