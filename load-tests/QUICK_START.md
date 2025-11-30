# Quick Start Guide - K6 Load Tests

## Prerequisites

1. **Install K6**
   ```bash
   # macOS
   brew install k6
   
   # Verify installation
   k6 version
   ```

2. **Start Services**
   ```bash
   # From project root
   docker compose up -d
   
   # Wait for services to be ready (30 seconds)
   sleep 30
   
   # Verify services
   curl http://localhost:3001/health
   ```

## Running Tests

### Quick Test (Recommended First)

Run the baseline test to verify everything works:

```bash
cd load-tests
k6 run baseline.js
```

Expected duration: ~5 minutes

### Individual Tests

**Baseline Test** - Minimal load (10 users, 5 minutes)
```bash
k6 run baseline.js
```

**Status Check Test** - High-frequency polling (up to 200 users, 19 minutes)
```bash
k6 run status-check.js
```

**Upload Test** - Concurrent uploads (up to 100 users, 19 minutes)
```bash
k6 run upload.js
```

**Stress Test** - Find breaking point (up to 1000 users, 40 minutes)
```bash
k6 run stress.js
```

**Spike Test** - Sudden traffic spike (500 users, 8 minutes)
```bash
k6 run spike.js
```

**Soak Test** - Extended stability (100 users, 2+ hours)
```bash
k6 run soak.js
```

### Run All Tests

```bash
./run-all-tests.sh
```

This runs baseline, status-check, and upload tests in sequence.

## Understanding Results

### Key Metrics

- **http_req_duration**: Response time
  - p50: Median response time
  - p95: 95th percentile (target threshold)
  - p99: 99th percentile
  
- **http_req_failed**: Error rate
  - Target: < 1% for most tests
  - Target: < 5% for upload tests

- **http_reqs**: Total requests and throughput (req/s)

### Success Criteria

**Baseline Test:**
- ✓ p95 < 2s
- ✓ Error rate < 1%

**Status Check Test:**
- ✓ p95 < 200ms
- ✓ Error rate < 1%

**Upload Test:**
- ✓ Upload p95 < 5s
- ✓ Status check p95 < 200ms
- ✓ Error rate < 5%

### Reading Output

```
✓ status 200                    ✓ Check passed
✗ response time < 200ms         ✗ Check failed

http_req_duration..............: avg=150ms p95=280ms
  ↑ Average response time        ↑ 95th percentile

http_req_failed................: 2.5%
  ↑ Percentage of failed requests
```

## Monitoring During Tests

### Terminal 1: K6 Output
```bash
k6 run upload.js
```

### Terminal 2: System Resources
```bash
docker stats
```

### Terminal 3: Application Metrics
```bash
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'
```

### Terminal 4: Database Connections
```bash
watch -n 1 'docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '\''schedgen'\''"'
```

## Troubleshooting

### Test Fails Immediately

**Problem:** Services not running
```bash
# Check service status
docker compose ps

# Restart services
docker compose restart
```

**Problem:** K6 not installed
```bash
# Install K6
brew install k6
```

### High Error Rates

**Problem:** System overloaded
```bash
# Check logs
docker compose logs backend
docker compose logs pdf-worker

# Check resource usage
docker stats
```

**Solution:** Scale services or reduce test load

### Slow Response Times

**Problem:** Database bottleneck
```bash
# Check database connections
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity"
```

**Solution:** Increase connection pool or add indexes

### Test Files Not Found

**Problem:** Running from wrong directory
```bash
# Ensure you're in load-tests directory
cd load-tests
pwd  # Should end with /load-tests
```

## Next Steps

After running tests:

1. **Review Results**
   - Check `results/` directory for detailed JSON output
   - Compare against performance targets

2. **Analyze Bottlenecks**
   - Use Grafana dashboards (http://localhost:3002)
   - Check Prometheus metrics (http://localhost:3001/metrics)

3. **Optimize**
   - Scale services if needed
   - Adjust configuration based on findings
   - Re-run tests to verify improvements

4. **Document Findings**
   - Record baseline performance
   - Note any issues discovered
   - Update capacity planning

## Related Documentation

- [Load Testing Guide](../docs/production/LOAD_TESTING.md)
- [Scalability Assessment](../docs/production/SCALABILITY_ASSESSMENT.md)
- [Production Readiness Plan](../docs/production/PRODUCTION_READINESS_PLAN.md)
