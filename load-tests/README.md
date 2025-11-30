# Load Tests for UP Schedule Generator

This directory contains K6 load tests for validating system performance under various load conditions.

## Prerequisites

### Install K6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

### Setup Test Environment

```bash
# Start all services
docker compose -f docker-compose.yml up -d

# Wait for services to be ready
sleep 30

# Verify services are healthy
curl http://localhost:3001/health
```

## Test Scenarios

### 1. Baseline Test (baseline.js)
Tests system performance with minimal load (10 concurrent users).

**Run:**
```bash
npm run test:baseline
# or
k6 run baseline.js
```

**Expected Results:**
- p95 response time < 2s
- Error rate < 1%

### 2. Upload Load Test (upload.js)
Tests concurrent PDF upload processing.

**Run:**
```bash
npm run test:upload
# or
k6 run upload.js
```

**Expected Results:**
- Upload p95 < 5s
- Status check p95 < 200ms
- Error rate < 5%

### 3. Status Check Load Test (status-check.js)
Tests job status polling under load.

**Run:**
```bash
npm run test:status
# or
k6 run status-check.js
```

**Expected Results:**
- p95 response time < 200ms
- Error rate < 1%

### 4. Stress Test (stress.js)
Gradually increases load to find system breaking point (ramp to 1000 users).

**Run:**
```bash
npm run test:stress
# or
k6 run stress.js
```

**Monitor:**
```bash
# Watch resource usage
docker stats

# Watch queue metrics
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'
```

### 5. Spike Test (spike.js)
Tests system recovery from sudden traffic spike (sudden 500 users).

**Run:**
```bash
npm run test:spike
# or
k6 run spike.js
```

**Expected Results:**
- System handles spike without crashing
- Recovery within 2 minutes after spike ends

### 6. Soak Test (soak.js)
Tests system stability over extended period (100 users for 2 hours).

**Run:**
```bash
npm run test:soak
# or
k6 run soak.js
```

**Expected Results:**
- No memory leaks
- Stable performance throughout
- No resource exhaustion

## Test Fixtures

Test PDF files are located in `../SourceFiles/`:
- `UP_TST_PDF.pdf` - Test schedule PDF
- `UP_EXAM_SS.pdf` - Exam schedule PDF
- `UP_MOD_XLS.pdf` - Weekly schedule PDF

## Monitoring During Tests

### Real-time Metrics

**Terminal 1: K6 Output**
```bash
k6 run --out json=results.json upload.js
```

**Terminal 2: System Resources**
```bash
docker stats
```

**Terminal 3: Application Metrics**
```bash
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'
```

**Terminal 4: Database Connections**
```bash
watch -n 1 'docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) as total, count(*) FILTER (WHERE state = '\''active'\'') as active FROM pg_stat_activity WHERE datname = '\''schedgen'\''"'
```

## Performance Targets

### Response Times (p95)
- Homepage: < 500ms
- Upload endpoint: < 5s
- Status check: < 200ms
- Health check: < 100ms

### Throughput
- Concurrent users: 100-10,000
- Uploads per hour: 1,000-10,000
- Status checks per second: 100-1,000

### Reliability
- Error rate: < 5%
- Uptime: 99.9%

## Troubleshooting

### High Error Rate
Check service logs:
```bash
docker compose logs backend
docker compose logs pdf-worker
```

### Slow Response Times
Check queue backlog:
```bash
curl http://localhost:3001/api/jobs/metrics
```

### Memory Issues
Monitor memory usage:
```bash
docker stats --no-stream | grep schedgen
```

## Related Documentation

- [Load Testing Guide](../docs/production/LOAD_TESTING.md)
- [Scalability Assessment](../docs/production/SCALABILITY_ASSESSMENT.md)
- [Production Readiness Plan](../docs/production/PRODUCTION_READINESS_PLAN.md)
