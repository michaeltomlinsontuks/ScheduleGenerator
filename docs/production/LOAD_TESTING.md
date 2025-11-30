# Load Testing Guide

**Document Version**: 1.0  
**Last Updated**: 2024-11-30  
**Purpose**: Validate system performance under high user loads

## Overview

This guide provides comprehensive load testing procedures for the UP Schedule Generator. Use these tests to validate scalability improvements and identify bottlenecks before production deployment.

---

## Prerequisites

### Install K6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

### Test Environment Setup

```bash
# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify services are healthy
docker compose ps

# Create test fixtures directory
mkdir -p load-tests/fixtures
```

---

## Test Scenarios

### Scenario 1: Baseline Performance Test

**Goal**: Establish performance baseline with minimal load

```javascript
// load-tests/baseline.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

export default function () {
  // Test homepage
  const homeRes = http.get('http://localhost:3000');
  check(homeRes, {
    'homepage status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test API health
  const healthRes = http.get('http://localhost:3001/health');
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health is ok': (r) => JSON.parse(r.body).status === 'ok',
  });

  sleep(2);
}
```

**Run Test:**
```bash
k6 run load-tests/baseline.js
```

**Expected Results:**
- Average response time: <500ms
- 95th percentile: <2s
- Error rate: <1%
- Throughput: 100+ req/s

---

### Scenario 2: PDF Upload Load Test

**Goal**: Test concurrent PDF uploads

```javascript
// load-tests/upload.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// Load test PDF file
const pdfData = open('./fixtures/test-schedule.pdf', 'b');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '3m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Hold at 50 users
    { duration: '3m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Hold at 100 users
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% under 10s
    http_req_failed: ['rate<0.05'],     // Less than 5% errors
    'http_req_duration{endpoint:upload}': ['p(95)<5000'],
    'http_req_duration{endpoint:status}': ['p(95)<1000'],
  },
};

export default function () {
  const uploadUrl = 'http://localhost:3001/api/upload';
  
  // Upload PDF
  const fd = new FormData();
  fd.append('file', http.file(pdfData, 'test-schedule.pdf', 'application/pdf'));
  
  const uploadRes = http.post(uploadUrl, fd.body(), {
    headers: { 
      'Content-Type': 'multipart/form-data; boundary=' + fd.boundary 
    },
    tags: { endpoint: 'upload' },
  });
  
  const uploadSuccess = check(uploadRes, {
    'upload status 201': (r) => r.status === 201,
    'has jobId': (r) => {
      try {
        return JSON.parse(r.body).jobId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (uploadSuccess) {
    const jobId = JSON.parse(uploadRes.body).jobId;
    
    // Poll job status
    let attempts = 0;
    let completed = false;
    
    while (attempts < 30 && !completed) {
      sleep(2);
      
      const statusRes = http.get(`http://localhost:3001/api/jobs/${jobId}`, {
        tags: { endpoint: 'status' },
      });
      
      check(statusRes, {
        'status check 200': (r) => r.status === 200,
      });
      
      try {
        const status = JSON.parse(statusRes.body).status;
        if (status === 'COMPLETED' || status === 'FAILED') {
          completed = true;
          check(statusRes, {
            'job completed': (r) => JSON.parse(r.body).status === 'COMPLETED',
          });
        }
      } catch (e) {
        console.error('Failed to parse status response:', e);
      }
      
      attempts++;
    }
  }

  sleep(5);
}
```

**Run Test:**
```bash
k6 run load-tests/upload.js
```

**Expected Results:**
- Upload response time: <5s (95th percentile)
- Status check response time: <1s (95th percentile)
- Job completion rate: >95%
- Error rate: <5%

---

### Scenario 3: Stress Test

**Goal**: Find system breaking point

```javascript
// load-tests/stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100
    { duration: '5m', target: 100 },   // Hold at 100
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '5m', target: 200 },   // Hold at 200
    { duration: '2m', target: 500 },   // Ramp to 500
    { duration: '5m', target: 500 },   // Hold at 500
    { duration: '2m', target: 1000 },  // Ramp to 1000
    { duration: '5m', target: 1000 },  // Hold at 1000
    { duration: '5m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'], // Allow degradation
    http_req_failed: ['rate<0.20'],     // Allow 20% errors at peak
  },
};

export default function () {
  const res = http.get('http://localhost:3001/health');
  
  check(res, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
  });
  
  sleep(1);
}
```

**Run Test:**
```bash
k6 run load-tests/stress.js
```

**Monitor During Test:**
```bash
# Terminal 1: Watch resource usage
docker stats

# Terminal 2: Watch queue metrics
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'

# Terminal 3: Watch database connections
watch -n 1 'docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity"'
```

**Expected Results:**
- System remains stable up to 500 concurrent users
- Graceful degradation beyond 500 users
- No crashes or data loss
- Recovery after load decreases

---

### Scenario 4: Spike Test

**Goal**: Test system recovery from sudden traffic spike

```javascript
// load-tests/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '30s', target: 500 },  // Sudden spike
    { duration: '2m', target: 500 },   // Hold spike
    { duration: '30s', target: 10 },   // Drop back
    { duration: '2m', target: 10 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const res = http.get('http://localhost:3001/health');
  
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

**Run Test:**
```bash
k6 run load-tests/spike.js
```

**Expected Results:**
- System handles spike without crashing
- Response times increase but remain acceptable
- System recovers to normal performance after spike
- No lingering issues after recovery

---

### Scenario 5: Soak Test

**Goal**: Test system stability over extended period

```javascript
// load-tests/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up
    { duration: '2h', target: 50 },    // Hold for 2 hours
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  // Mix of operations
  const operations = [
    () => http.get('http://localhost:3000'),
    () => http.get('http://localhost:3001/health'),
    () => http.get('http://localhost:3001/api/jobs/metrics'),
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const res = operation();
  
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 5 + 1); // 1-6 seconds
}
```

**Run Test:**
```bash
k6 run load-tests/soak.js
```

**Monitor During Test:**
- Memory usage (should remain stable)
- Database connection count
- Redis memory usage
- Disk space
- Error logs

**Expected Results:**
- No memory leaks
- Stable performance throughout
- No resource exhaustion
- Clean error logs

---

## Monitoring During Tests

### Real-time Metrics Dashboard

```bash
# Terminal 1: K6 output
k6 run --out json=test-results.json load-tests/upload.js

# Terminal 2: System resources
docker stats

# Terminal 3: Application metrics
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'

# Terminal 4: Database
watch -n 1 'docker exec schedgen-postgres psql -U schedgen -d schedgen -c "
  SELECT 
    count(*) as connections,
    count(*) FILTER (WHERE state = '\''active'\'') as active,
    count(*) FILTER (WHERE state = '\''idle'\'') as idle
  FROM pg_stat_activity 
  WHERE datname = '\''schedgen'\'';
"'

# Terminal 5: Redis
watch -n 1 'docker exec schedgen-redis redis-cli INFO stats | grep -E "total_commands_processed|instantaneous_ops_per_sec"'
```

### Key Metrics to Watch

**Application Metrics:**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Queue length
- Active jobs

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network I/O
- Container health

**Database Metrics:**
- Connection count
- Active queries
- Query duration
- Lock waits
- Cache hit ratio

**Redis Metrics:**
- Memory usage
- Operations per second
- Key count
- Evictions

---

## Test Results Analysis

### Generate Report

```bash
# Run test with JSON output
k6 run --out json=results.json load-tests/upload.js

# Analyze results
k6 inspect results.json

# Generate HTML report (requires k6-reporter)
k6 run --out json=results.json load-tests/upload.js
k6-reporter results.json
```

### Performance Benchmarks

**Acceptable Performance:**
- Homepage load: <1s (p95)
- API health check: <200ms (p95)
- PDF upload: <5s (p95)
- Job status check: <500ms (p95)
- Job completion: <60s (p95)

**Warning Thresholds:**
- Response time >10s (p95)
- Error rate >5%
- Queue length >100
- CPU usage >80%
- Memory usage >85%

**Critical Thresholds:**
- Response time >30s (p95)
- Error rate >10%
- Queue length >500
- CPU usage >95%
- Memory usage >95%

---

## Troubleshooting Load Test Issues

### Issue: High Error Rate

**Symptoms:**
- Many 500/503 errors
- Timeouts
- Connection refused

**Diagnosis:**
```bash
# Check service logs
docker compose logs backend
docker compose logs pdf-worker

# Check resource usage
docker stats

# Check database connections
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity"
```

**Solutions:**
- Increase resource limits
- Scale PDF workers
- Increase database connection pool
- Add rate limiting

---

### Issue: Slow Response Times

**Symptoms:**
- High p95/p99 latency
- Increasing response times over test duration

**Diagnosis:**
```bash
# Check queue backlog
curl http://localhost:3001/api/jobs/metrics

# Check database slow queries
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check Redis memory
docker exec schedgen-redis redis-cli INFO memory
```

**Solutions:**
- Add database indexes
- Implement caching
- Optimize queries
- Increase worker count

---

### Issue: Memory Leaks

**Symptoms:**
- Memory usage continuously increasing
- OOM kills
- Degrading performance over time

**Diagnosis:**
```bash
# Monitor memory over time
while true; do
  docker stats --no-stream | grep schedgen
  sleep 10
done

# Check for memory leaks in Node.js
docker exec schedgen-backend node --expose-gc --inspect=0.0.0.0:9229 dist/main.js
```

**Solutions:**
- Review code for memory leaks
- Implement proper cleanup
- Add memory limits
- Restart workers periodically

---

## Continuous Load Testing

### Automated Testing Pipeline

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: |
          docker compose up -d
          sleep 30
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load tests
        run: |
          k6 run --out json=results.json load-tests/baseline.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

---

## Related Documents

- [Scalability Assessment](./SCALABILITY_ASSESSMENT.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Deployment Guide](../../DEPLOYMENT.md)
