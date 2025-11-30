# Scaling Runbook

## Purpose

This runbook provides step-by-step instructions for scaling the UP Schedule Generator system to handle increased load. It covers when to scale based on metrics thresholds, how to scale each service horizontally, verification steps after scaling, and procedures for scaling back down when load decreases.

**Target Audience**: System administrators, DevOps engineers, and operations team

**Related Documents**:
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Standard deployment procedures
- [Incident Response Runbook](./INCIDENT_RESPONSE_RUNBOOK.md) - Incident handling procedures
- [Scalability Assessment](./SCALABILITY_ASSESSMENT.md) - System capacity planning
- [Load Testing Guide](./LOAD_TESTING.md) - Performance testing procedures

## Overview

The UP Schedule Generator supports horizontal scaling for all application services:
- **Frontend**: Next.js instances (1-20 instances)
- **Backend**: NestJS API servers (1-20 instances)
- **PDF Worker**: Python FastAPI workers (2-50 instances)

Traefik automatically load balances requests across all instances with health check-based routing.

**Typical scaling time**: 3-5 minutes per service

**Expected downtime**: 0 seconds (zero-downtime scaling)

## When to Scale

### Scaling Triggers and Thresholds

Use these metrics to determine when scaling is needed:

#### CPU Utilization

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Average CPU | < 60% | 60-80% | > 80% | Scale up |
| Peak CPU | < 80% | 80-90% | > 90% | Scale up immediately |
| Sustained high CPU | - | > 70% for 10 min | > 80% for 5 min | Scale up |

**Grafana Query**: `rate(container_cpu_usage_seconds_total[5m]) * 100`


#### Memory Utilization

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Average Memory | < 60% | 60-80% | > 80% | Scale up |
| Peak Memory | < 80% | 80-90% | > 90% | Scale up immediately |
| Memory growth rate | < 5% per hour | 5-10% per hour | > 10% per hour | Investigate + scale |

**Grafana Query**: `(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100`

#### Response Time

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| p50 response time | < 500ms | 500ms-1s | > 1s | Scale up |
| p95 response time | < 2s | 2s-5s | > 5s | Scale up |
| p99 response time | < 5s | 5s-10s | > 10s | Scale up immediately |

**Grafana Query**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`

#### Error Rate

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Error rate | < 1% | 1-5% | > 5% | Investigate + scale |
| 5xx errors | < 0.5% | 0.5-2% | > 2% | Scale up |
| Timeout errors | < 0.1% | 0.1-1% | > 1% | Scale up immediately |

**Grafana Query**: `(rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100`

#### Queue Depth (PDF Worker)

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Waiting jobs | < 50 | 50-200 | > 200 | Scale PDF workers |
| Queue wait time | < 30s | 30s-2min | > 2min | Scale PDF workers |
| Processing time | < 30s | 30s-60s | > 60s | Scale PDF workers |

**Grafana Query**: `queue_jobs_waiting`

**API Check**:
```bash
curl http://localhost:3001/api/jobs/metrics
```

#### Database Connections

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Active connections | < 30 | 30-40 | > 40 | Scale backend |
| Connection pool usage | < 60% | 60-80% | > 80% | Scale backend |
| Connection wait time | < 100ms | 100ms-1s | > 1s | Scale backend immediately |

**Database Query**:
```sql
SELECT count(*) as total,
       count(*) FILTER (WHERE state = 'active') as active
FROM pg_stat_activity
WHERE datname = 'schedgen';
```


### Scaling Decision Matrix

Use this matrix to determine which services to scale:

| Symptom | Primary Cause | Scale Service | Priority |
|---------|---------------|---------------|----------|
| High CPU on PDF Worker | PDF processing load | PDF Worker | High |
| High memory on PDF Worker | Large PDFs or memory leak | PDF Worker | High |
| Queue depth > 200 | Insufficient workers | PDF Worker | High |
| High CPU on Backend | API request load | Backend | High |
| Database connections > 40 | Too many concurrent requests | Backend | High |
| Slow response times (p95 > 5s) | Overall system load | Backend + PDF Worker | High |
| High CPU on Frontend | SSR load | Frontend | Medium |
| Error rate > 5% | System overload | All services | Critical |
| Memory growth over time | Memory leak | Restart + Scale | Critical |

### Proactive Scaling Triggers

Scale **before** reaching critical thresholds in these scenarios:

**Anticipated Traffic Spikes**:
- Registration period starts (scale 2-3 days before)
- Exam schedule release (scale 1 day before)
- Start of semester (scale 1 week before)
- Known marketing campaigns

**Time-Based Patterns**:
- Monday mornings (8 AM - 10 AM): Scale up by 50%
- Weekday business hours (9 AM - 5 PM): Maintain higher capacity
- Weekends: Scale down to baseline
- Late night (12 AM - 6 AM): Scale down to minimum

**Load Testing Results**:
- After load tests identify new capacity limits
- When approaching 70% of tested capacity
- Before major feature releases

### Scaling Decision Flowchart

```
Monitor Metrics
    ↓
Metrics in Warning Range?
    ↓ YES → Continue monitoring for 5 minutes
    ↓ NO → Continue normal monitoring
    ↓
Still in Warning Range after 5 min?
    ↓ YES → Prepare to scale
    ↓ NO → Return to normal monitoring
    ↓
Metrics in Critical Range?
    ↓ YES → SCALE IMMEDIATELY
    ↓ NO
    ↓
Metrics trending upward?
    ↓ YES → SCALE PROACTIVELY
    ↓ NO → Continue monitoring
```


## Pre-Scaling Checklist

Complete this checklist before scaling any service:

### 1. Verify Current State

- [ ] **Check current instance counts**
  ```bash
  docker compose ps
  # Count instances of each service
  ```

- [ ] **Review current metrics**
  - Open Grafana dashboards
  - Check CPU, memory, response times
  - Verify metrics justify scaling

- [ ] **Check system resources**
  ```bash
  # Check host resources
  free -h
  df -h
  # Ensure sufficient resources for new instances
  ```

### 2. Verify Infrastructure Capacity

- [ ] **Check Docker host resources**
  ```bash
  # Available CPU cores
  nproc
  
  # Available memory
  free -h
  
  # Available disk space
  df -h /var/lib/docker
  ```

- [ ] **Verify network capacity**
  - Check network bandwidth usage
  - Ensure no network bottlenecks

- [ ] **Check database capacity**
  ```bash
  # Current connection count
  docker compose exec postgres psql -U schedgen -d schedgen -c \
    "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"
  
  # Max connections
  docker compose exec postgres psql -U schedgen -d schedgen -c \
    "SHOW max_connections;"
  ```

### 3. Prepare Monitoring

- [ ] **Open Grafana dashboards**
  ```bash
  open http://localhost:3002
  ```
  - System Overview
  - Job Processing
  - Resource Utilization

- [ ] **Prepare log monitoring**
  ```bash
  # In separate terminal
  docker compose logs -f backend frontend pdf-worker
  ```

- [ ] **Note baseline metrics**
  - Current CPU usage
  - Current memory usage
  - Current response times
  - Current error rate

### 4. Communication

- [ ] **Notify team of scaling operation**
  - Post in team chat
  - Expected duration: 3-5 minutes
  - Expected impact: None (zero-downtime)

- [ ] **Have backup operator available**
  - Someone to help if issues arise


## How to Scale Each Service

### Scaling PDF Worker

**When to scale**:
- Queue depth > 200 jobs
- CPU usage > 80%
- Memory usage > 80%
- Processing time > 60s (p95)

**Current capacity**: 2-50 instances

#### Scale Up PDF Worker

**Step 1: Determine target instance count**

```bash
# Check current count
docker compose ps pdf-worker | grep -c "Up"

# Calculate target based on queue depth
# Rule of thumb: 1 worker per 50 jobs in queue
CURRENT_QUEUE=$(curl -s http://localhost:3001/api/jobs/metrics | jq .waiting)
TARGET_WORKERS=$(( (CURRENT_QUEUE + 49) / 50 ))

# Ensure minimum of 3, maximum of 50
if [ $TARGET_WORKERS -lt 3 ]; then TARGET_WORKERS=3; fi
if [ $TARGET_WORKERS -gt 50 ]; then TARGET_WORKERS=50; fi

echo "Target workers: $TARGET_WORKERS"
```

**Step 2: Scale the service**

```bash
# Navigate to project root
cd /path/to/up-schedule-generator

# Scale PDF Worker to target count
docker compose up -d --scale pdf-worker=$TARGET_WORKERS --no-recreate

# Example: Scale to 10 workers
docker compose up -d --scale pdf-worker=10 --no-recreate
```

**Expected output**:
```
[+] Running 10/10
 ✔ Container pdf-worker-1   Started
 ✔ Container pdf-worker-2   Started
 ✔ Container pdf-worker-3   Started
 ✔ Container pdf-worker-4   Started
 ✔ Container pdf-worker-5   Started
 ✔ Container pdf-worker-6   Started
 ✔ Container pdf-worker-7   Started
 ✔ Container pdf-worker-8   Started
 ✔ Container pdf-worker-9   Started
 ✔ Container pdf-worker-10  Started
```

**Duration**: 30-60 seconds

**Step 3: Verify new instances are healthy**

```bash
# Check all instances are running
docker compose ps pdf-worker

# Wait for health checks to pass (30-60 seconds)
sleep 60

# Verify all instances are healthy
docker compose ps pdf-worker | grep -c "healthy"
# Should match target count
```

**Step 4: Monitor queue draining**

```bash
# Watch queue depth decrease
watch -n 10 'curl -s http://localhost:3001/api/jobs/metrics | jq "{waiting, active, completed}"'

# Press Ctrl+C when queue is under control
```

#### Common PDF Worker Scaling Scenarios

**Scenario 1: Sudden traffic spike (queue > 500)**
```bash
# Scale aggressively to 20 workers
docker compose up -d --scale pdf-worker=20 --no-recreate

# Monitor for 5 minutes
# Scale down once queue < 100
```

**Scenario 2: Sustained high load (queue consistently > 200)**
```bash
# Scale to 15 workers
docker compose up -d --scale pdf-worker=15 --no-recreate

# Monitor for 30 minutes
# Adjust if needed
```

**Scenario 3: Memory pressure (workers using > 1.5GB each)**
```bash
# Don't scale up - investigate memory leak
# Restart workers instead
docker compose restart pdf-worker

# If issue persists, scale down and fix issue
docker compose up -d --scale pdf-worker=2 --no-recreate
```


### Scaling Backend

**When to scale**:
- CPU usage > 80%
- Memory usage > 80%
- Response time p95 > 5s
- Database connections > 40
- Error rate > 5%

**Current capacity**: 1-20 instances

#### Scale Up Backend

**Step 1: Determine target instance count**

```bash
# Check current count
docker compose ps backend | grep -c "Up"

# Calculate target based on CPU usage
# Rule of thumb: Scale up if CPU > 80%
CURRENT_CPU=$(docker stats backend --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
if (( $(echo "$CURRENT_CPU > 80" | bc -l) )); then
  TARGET_BACKENDS=3
elif (( $(echo "$CURRENT_CPU > 60" | bc -l) )); then
  TARGET_BACKENDS=2
else
  TARGET_BACKENDS=1
fi

echo "Target backends: $TARGET_BACKENDS"
```

**Step 2: Scale the service**

```bash
# Scale Backend to target count
docker compose up -d --scale backend=$TARGET_BACKENDS --no-recreate

# Example: Scale to 3 instances
docker compose up -d --scale backend=3 --no-recreate
```

**Expected output**:
```
[+] Running 3/3
 ✔ Container backend-1  Started
 ✔ Container backend-2  Started
 ✔ Container backend-3  Started
```

**Duration**: 30-60 seconds

**Step 3: Verify new instances are healthy**

```bash
# Check all instances are running
docker compose ps backend

# Wait for health checks to pass
sleep 60

# Verify all instances are healthy
docker compose ps backend | grep -c "healthy"
# Should match target count

# Test health endpoints
for i in {1..3}; do
  CONTAINER_ID=$(docker compose ps -q backend | sed -n "${i}p")
  docker exec $CONTAINER_ID wget -q -O- http://localhost:3001/health
  echo ""
done
```

**Step 4: Verify load balancing**

```bash
# Make several requests and check distribution
for i in {1..10}; do
  curl -s http://localhost:3001/health | jq .hostname
done

# Should see different hostnames (load balanced)
```

#### Backend Scaling Considerations

**Session Management**:
- Sessions are stored in Redis (shared across instances)
- No session affinity required
- Users can be served by any backend instance

**Database Connections**:
- Each backend instance uses connection pool (max 50 connections)
- Total connections = instances × 50
- PostgreSQL max_connections = 100 (default)
- **Important**: Don't scale beyond 2 instances without increasing PostgreSQL max_connections

**Increase PostgreSQL max_connections** (if scaling beyond 2 backends):

```bash
# Edit PostgreSQL configuration
docker compose exec postgres psql -U schedgen -d postgres -c \
  "ALTER SYSTEM SET max_connections = 200;"

# Restart PostgreSQL
docker compose restart postgres

# Wait for restart
sleep 30

# Verify new limit
docker compose exec postgres psql -U schedgen -d postgres -c \
  "SHOW max_connections;"
```


### Scaling Frontend

**When to scale**:
- CPU usage > 80%
- Memory usage > 80%
- Response time p95 > 2s
- High number of concurrent users (> 1000)

**Current capacity**: 1-20 instances

#### Scale Up Frontend

**Step 1: Determine target instance count**

```bash
# Check current count
docker compose ps frontend | grep -c "Up"

# Calculate target based on load
# Rule of thumb: 1 instance per 500 concurrent users
# For CPU-based scaling:
CURRENT_CPU=$(docker stats frontend --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
if (( $(echo "$CURRENT_CPU > 80" | bc -l) )); then
  TARGET_FRONTENDS=3
elif (( $(echo "$CURRENT_CPU > 60" | bc -l) )); then
  TARGET_FRONTENDS=2
else
  TARGET_FRONTENDS=1
fi

echo "Target frontends: $TARGET_FRONTENDS"
```

**Step 2: Scale the service**

```bash
# Scale Frontend to target count
docker compose up -d --scale frontend=$TARGET_FRONTENDS --no-recreate

# Example: Scale to 2 instances
docker compose up -d --scale frontend=2 --no-recreate
```

**Expected output**:
```
[+] Running 2/2
 ✔ Container frontend-1  Started
 ✔ Container frontend-2  Started
```

**Duration**: 30-60 seconds

**Step 3: Verify new instances are healthy**

```bash
# Check all instances are running
docker compose ps frontend

# Wait for health checks to pass
sleep 60

# Verify all instances are healthy
docker compose ps frontend | grep -c "healthy"
# Should match target count

# Test frontend accessibility
for i in {1..2}; do
  CONTAINER_ID=$(docker compose ps -q frontend | sed -n "${i}p")
  docker exec $CONTAINER_ID wget -q -O- http://localhost:3000 | head -1
done
```

**Step 4: Verify load balancing**

```bash
# Make several requests through Traefik
for i in {1..10}; do
  curl -s http://localhost:3000 -I | grep -i "x-served-by"
done

# Should see requests distributed across instances
```

#### Frontend Scaling Considerations

**Static Assets**:
- Next.js serves static assets from each instance
- No shared file system required
- CDN recommended for production (not covered here)

**Server-Side Rendering (SSR)**:
- Each instance performs SSR independently
- No state shared between instances
- Scaling improves SSR capacity

**Client-Side State**:
- State managed in browser (Zustand stores)
- No server-side session state
- Users can be served by any frontend instance


### Scaling Multiple Services Simultaneously

**When to scale multiple services**:
- System-wide high load
- Error rate > 5% across all services
- Anticipated major traffic spike
- After load testing reveals bottlenecks

#### Scale All Application Services

```bash
# Scale all services at once
docker compose up -d \
  --scale frontend=2 \
  --scale backend=3 \
  --scale pdf-worker=10 \
  --no-recreate

# Wait for all services to become healthy
sleep 90

# Verify all services
docker compose ps
```

#### Coordinated Scaling Strategy

**For moderate load increase (2x traffic)**:
```bash
docker compose up -d \
  --scale frontend=2 \
  --scale backend=2 \
  --scale pdf-worker=6 \
  --no-recreate
```

**For high load increase (5x traffic)**:
```bash
docker compose up -d \
  --scale frontend=3 \
  --scale backend=5 \
  --scale pdf-worker=15 \
  --no-recreate
```

**For extreme load (10x traffic)**:
```bash
# First, increase database connections
docker compose exec postgres psql -U schedgen -d postgres -c \
  "ALTER SYSTEM SET max_connections = 500;"
docker compose restart postgres
sleep 30

# Then scale application services
docker compose up -d \
  --scale frontend=5 \
  --scale backend=10 \
  --scale pdf-worker=30 \
  --no-recreate
```


## Verification Steps After Scaling

### 1. Service Health Verification (Required)

**Check all instances are running**:
```bash
# List all containers
docker compose ps

# Count instances per service
echo "Frontend: $(docker compose ps frontend | grep -c 'Up')"
echo "Backend: $(docker compose ps backend | grep -c 'Up')"
echo "PDF Worker: $(docker compose ps pdf-worker | grep -c 'Up')"
```

**Expected**: All instances show "Up" and "healthy" status

**Check health endpoints**:
```bash
# Backend health (through load balancer)
for i in {1..5}; do
  curl -f http://localhost:3001/health || echo "FAILED"
done

# Frontend health (through load balancer)
for i in {1..5}; do
  curl -f http://localhost:3000/ -I || echo "FAILED"
done
```

**Expected**: All requests return HTTP 200 OK

### 2. Load Balancing Verification (Required)

**Verify Traefik is distributing load**:

```bash
# Make multiple requests and check which instance serves them
echo "Testing Backend load balancing:"
for i in {1..20}; do
  curl -s http://localhost:3001/health | jq -r .hostname
done | sort | uniq -c

echo "Testing Frontend load balancing:"
for i in {1..20}; do
  curl -s -I http://localhost:3000 2>&1 | grep -i "x-served-by" || echo "N/A"
done | sort | uniq -c
```

**Expected**: Requests distributed across multiple instances

**Check Traefik dashboard**:
```bash
# Open Traefik dashboard
open http://localhost:8080

# Verify all instances registered
# Check: HTTP Routers → backend → Service → Servers
# Should show all backend instances
```

### 3. Performance Verification (Required)

**Check response times improved**:

```bash
# Test backend response time
echo "Backend response time:"
for i in {1..10}; do
  curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3001/health
done | awk '{sum+=$1; count++} END {print "Average:", sum/count "s"}'

# Test frontend response time
echo "Frontend response time:"
for i in {1..10}; do
  curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3000/
done | awk '{sum+=$1; count++} END {print "Average:", sum/count "s"}'
```

**Expected**: 
- Backend: < 0.5s average
- Frontend: < 1s average

**Check queue processing improved** (if scaled PDF workers):

```bash
# Monitor queue depth over 5 minutes
for i in {1..30}; do
  METRICS=$(curl -s http://localhost:3001/api/jobs/metrics)
  WAITING=$(echo $METRICS | jq .waiting)
  ACTIVE=$(echo $METRICS | jq .active)
  echo "$(date +%H:%M:%S) - Waiting: $WAITING, Active: $ACTIVE"
  sleep 10
done
```

**Expected**: Queue depth decreasing or stable at low level

### 4. Resource Utilization Verification (Required)

**Check CPU usage decreased**:

```bash
# Check CPU usage per service
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}"
```

**Expected**: CPU usage per instance < 60%

**Check memory usage**:

```bash
# Check memory usage per service
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Expected**: Memory usage per instance < 60%

### 5. Database Connection Verification (Required if scaled Backend)

**Check database connection count**:

```bash
# Check total connections
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
   FROM pg_stat_activity
   WHERE datname = 'schedgen';"
```

**Expected**: 
- Total connections < max_connections
- Active connections distributed across backend instances
- No connection pool exhaustion errors

### 6. Monitoring Dashboard Verification (Recommended)

**Check Grafana dashboards**:

```bash
# Open Grafana
open http://localhost:3002
```

**Verify**:
- System Overview dashboard shows improved metrics
- CPU usage per instance decreased
- Response times improved
- Error rate stable or decreased
- Queue depth decreasing (if scaled PDF workers)

**Check for alerts**:
- No new alerts firing
- Existing alerts resolved

### 7. Functional Verification (Recommended)

**Test critical user flows**:

```bash
# Test upload endpoint
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf" \
  -F "pdfType=WEEKLY"

# Should return job ID
```

**Test in browser**:
1. Open http://localhost:3000
2. Upload a PDF file
3. Verify processing completes
4. Check events display correctly

### Verification Checklist

Use this checklist after scaling:

- [ ] All new instances running and healthy
- [ ] Health endpoints responding
- [ ] Load balancing working (requests distributed)
- [ ] Response times improved
- [ ] CPU usage per instance < 60%
- [ ] Memory usage per instance < 60%
- [ ] Database connections within limits
- [ ] Queue depth decreasing (if scaled PDF workers)
- [ ] Grafana dashboards show improvement
- [ ] No new errors in logs
- [ ] Critical user flows working
- [ ] Team notified of scaling completion


## Scaling Back Down

### When to Scale Down

Scale down when metrics return to normal levels for sustained period:

**Scale down triggers**:
- CPU usage < 40% for 30 minutes
- Memory usage < 40% for 30 minutes
- Response times well below targets (p95 < 1s) for 30 minutes
- Queue depth < 20 for 30 minutes
- Low traffic period (late night, weekends)
- After traffic spike has passed

**Do NOT scale down if**:
- Metrics only recently improved (< 30 minutes)
- Traffic spike expected soon
- During business hours (unless severely over-provisioned)
- Error rate still elevated
- Recent deployment or changes

### Scale Down Decision Matrix

| Current State | Target State | Action |
|---------------|--------------|--------|
| 10 PDF workers, queue < 20 | 3 PDF workers | Scale down gradually |
| 5 backends, CPU < 30% | 2 backends | Scale down to 2 |
| 3 frontends, CPU < 20% | 1 frontend | Scale down to 1 |
| All services over-provisioned | Baseline | Return to baseline config |

### Gradual Scale Down Strategy

**Important**: Always scale down gradually to avoid sudden performance degradation.

**Step 1: Reduce by 50%**
```bash
# If currently at 10 workers, scale to 5
docker compose up -d --scale pdf-worker=5 --no-recreate

# Wait 10 minutes and monitor
sleep 600
```

**Step 2: Check metrics**
```bash
# Check CPU, memory, response times
docker stats --no-stream

# Check queue depth
curl -s http://localhost:3001/api/jobs/metrics | jq .waiting
```

**Step 3: Continue if metrics still good**
```bash
# If metrics still good, scale down further
docker compose up -d --scale pdf-worker=3 --no-recreate
```

### Scale Down Procedures

#### Scale Down PDF Worker

**Scenario: Queue cleared, workers idle**

```bash
# Check current state
CURRENT_WORKERS=$(docker compose ps pdf-worker | grep -c "Up")
QUEUE_DEPTH=$(curl -s http://localhost:3001/api/jobs/metrics | jq .waiting)

echo "Current workers: $CURRENT_WORKERS"
echo "Queue depth: $QUEUE_DEPTH"

# Calculate target (minimum 3 workers)
if [ $QUEUE_DEPTH -lt 50 ]; then
  TARGET_WORKERS=3
else
  TARGET_WORKERS=$(( (QUEUE_DEPTH + 49) / 50 ))
  if [ $TARGET_WORKERS -lt 3 ]; then TARGET_WORKERS=3; fi
fi

echo "Target workers: $TARGET_WORKERS"

# Scale down gradually
docker compose up -d --scale pdf-worker=$TARGET_WORKERS --no-recreate

# Monitor for 10 minutes
watch -n 30 'curl -s http://localhost:3001/api/jobs/metrics | jq "{waiting, active}"'
```

**Expected**: Queue remains low, no backlog building

#### Scale Down Backend

**Scenario: Low API traffic, CPU < 40%**

```bash
# Check current state
CURRENT_BACKENDS=$(docker compose ps backend | grep -c "Up")
echo "Current backends: $CURRENT_BACKENDS"

# Check database connections
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"

# Scale down to 2 (or 1 if very low traffic)
docker compose up -d --scale backend=2 --no-recreate

# Monitor response times
for i in {1..20}; do
  curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3001/health
  sleep 5
done
```

**Expected**: Response times remain low (< 1s)

#### Scale Down Frontend

**Scenario: Low user traffic, CPU < 40%**

```bash
# Check current state
CURRENT_FRONTENDS=$(docker compose ps frontend | grep -c "Up")
echo "Current frontends: $CURRENT_FRONTENDS"

# Scale down to 1
docker compose up -d --scale frontend=1 --no-recreate

# Test frontend responsiveness
for i in {1..10}; do
  curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3000/
  sleep 5
done
```

**Expected**: Response times remain low (< 2s)

#### Return to Baseline Configuration

**When to use**: After extended high-load period, return to normal capacity

```bash
# Return all services to baseline
docker compose up -d \
  --scale frontend=1 \
  --scale backend=1 \
  --scale pdf-worker=3 \
  --no-recreate

# Wait for stabilization
sleep 60

# Verify all services healthy
docker compose ps

# Monitor for 30 minutes
# Check Grafana dashboards every 5 minutes
```

### Verification After Scale Down

**1. Check services still healthy**:
```bash
docker compose ps
./scripts/verify-deployment.sh --quick
```

**2. Monitor key metrics for 30 minutes**:
```bash
# Watch CPU usage
watch -n 30 'docker stats --no-stream'

# Watch queue depth (if scaled down PDF workers)
watch -n 30 'curl -s http://localhost:3001/api/jobs/metrics | jq .waiting'

# Watch response times in Grafana
```

**3. Verify no performance degradation**:
- Response times remain acceptable
- Error rate remains low
- Queue depth not building up
- CPU/memory usage acceptable

**4. Be ready to scale back up**:
- Keep monitoring for 1 hour after scale down
- Be prepared to scale back up if metrics worsen
- Have this runbook ready

### Scale Down Checklist

- [ ] Metrics in normal range for 30+ minutes
- [ ] No anticipated traffic spikes
- [ ] Not during peak hours
- [ ] Team notified of scale down
- [ ] Monitoring dashboards open
- [ ] Scaled down gradually (not all at once)
- [ ] Services verified healthy after scale down
- [ ] Metrics monitored for 30 minutes
- [ ] No performance degradation observed
- [ ] Ready to scale back up if needed


## Troubleshooting Scaling Issues

### Issue 1: New Instances Not Starting

**Symptoms**:
```
Error response from daemon: Cannot start container: insufficient resources
```

**Causes**:
- Insufficient host resources (CPU, memory, disk)
- Docker daemon limits reached
- Port conflicts

**Solutions**:

1. **Check host resources**:
   ```bash
   # Check available resources
   free -h
   df -h
   nproc
   
   # Check Docker resource usage
   docker system df
   ```

2. **Free up resources**:
   ```bash
   # Remove unused containers and images
   docker system prune -a
   
   # Remove unused volumes (careful!)
   docker volume prune
   ```

3. **Check Docker daemon limits**:
   ```bash
   # Check Docker info
   docker info | grep -i "containers\|images"
   ```

4. **Scale down other services first**:
   ```bash
   # If scaling backend, scale down PDF workers first
   docker compose up -d --scale pdf-worker=2 --no-recreate
   # Then scale up backend
   docker compose up -d --scale backend=3 --no-recreate
   ```

### Issue 2: New Instances Failing Health Checks

**Symptoms**:
```
Container pdf-worker-5 is unhealthy
```

**Causes**:
- Service taking longer to start
- Configuration errors
- Dependency not available
- Resource constraints

**Solutions**:

1. **Check container logs**:
   ```bash
   # Find unhealthy container
   docker compose ps | grep unhealthy
   
   # Check logs
   docker logs pdf-worker-5 --tail 100
   ```

2. **Check health check endpoint manually**:
   ```bash
   # Get container ID
   CONTAINER_ID=$(docker compose ps -q pdf-worker | head -1)
   
   # Test health endpoint
   docker exec $CONTAINER_ID curl -f http://localhost:5001/health
   ```

3. **Give more time for startup**:
   ```bash
   # Wait 2 minutes
   sleep 120
   
   # Check again
   docker compose ps
   ```

4. **Check resource limits**:
   ```bash
   # Check if container is being OOM killed
   docker inspect pdf-worker-5 | grep -i "oom"
   
   # Check resource usage
   docker stats pdf-worker-5 --no-stream
   ```

5. **Restart unhealthy instances**:
   ```bash
   docker compose restart pdf-worker-5
   ```

### Issue 3: Load Not Distributing Evenly

**Symptoms**:
- Some instances handling all traffic
- Other instances idle
- Uneven CPU usage across instances

**Causes**:
- Traefik not detecting all instances
- Health checks failing on some instances
- Sticky sessions enabled (shouldn't be)

**Solutions**:

1. **Check Traefik service discovery**:
   ```bash
   # Open Traefik dashboard
   open http://localhost:8080
   
   # Check HTTP Routers → backend → Service
   # Verify all instances listed
   ```

2. **Check health status in Traefik**:
   ```bash
   # All instances should show as "UP"
   # If some show "DOWN", check their health endpoints
   ```

3. **Verify no sticky sessions**:
   ```bash
   # Check Traefik configuration
   cat traefik/traefik.yml | grep -i sticky
   # Should not have sticky sessions enabled
   ```

4. **Restart Traefik**:
   ```bash
   docker compose restart traefik
   sleep 30
   ```

5. **Test load distribution**:
   ```bash
   # Make many requests
   for i in {1..100}; do
     curl -s http://localhost:3001/health | jq -r .hostname
   done | sort | uniq -c
   
   # Should be roughly even distribution
   ```

### Issue 4: Performance Not Improving After Scaling

**Symptoms**:
- Scaled up but metrics not improving
- Response times still high
- Queue still growing

**Causes**:
- Bottleneck elsewhere (database, Redis, network)
- Scaled wrong service
- Resource limits too restrictive
- Application-level issue

**Solutions**:

1. **Identify the real bottleneck**:
   ```bash
   # Check all services
   docker stats --no-stream
   
   # Check database
   docker compose exec postgres psql -U schedgen -d schedgen -c \
     "SELECT count(*), state FROM pg_stat_activity 
      WHERE datname = 'schedgen' GROUP BY state;"
   
   # Check Redis
   docker exec redis redis-cli INFO stats | grep -i "ops\|memory"
   ```

2. **Check for database bottleneck**:
   ```bash
   # Check slow queries
   docker compose exec postgres psql -U schedgen -d schedgen -c \
     "SELECT pid, now() - query_start as duration, query 
      FROM pg_stat_activity 
      WHERE state = 'active' AND datname = 'schedgen'
      ORDER BY duration DESC LIMIT 5;"
   
   # If slow queries found, may need to optimize queries or add indexes
   ```

3. **Check for Redis bottleneck**:
   ```bash
   # Check Redis memory
   docker exec redis redis-cli INFO memory | grep used_memory_human
   
   # Check if Redis is evicting keys
   docker exec redis redis-cli INFO stats | grep evicted_keys
   
   # If memory full, increase Redis memory limit
   ```

4. **Check resource limits**:
   ```bash
   # Check if containers hitting limits
   docker stats --no-stream
   
   # If hitting limits, increase in docker-compose.prod.yml
   ```

5. **Scale the actual bottleneck**:
   ```bash
   # If database is bottleneck, increase connection pool
   # If Redis is bottleneck, increase memory
   # If network is bottleneck, check network configuration
   ```

### Issue 5: Database Connection Pool Exhausted After Scaling Backend

**Symptoms**:
```
Error: Connection pool exhausted
FATAL: remaining connection slots are reserved
```

**Causes**:
- Too many backend instances for database max_connections
- Each backend uses up to 50 connections
- PostgreSQL default max_connections = 100

**Solutions**:

1. **Check current connection count**:
   ```bash
   docker compose exec postgres psql -U schedgen -d schedgen -c \
     "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"
   
   # Check max connections
   docker compose exec postgres psql -U schedgen -d postgres -c \
     "SHOW max_connections;"
   ```

2. **Increase PostgreSQL max_connections**:
   ```bash
   # Calculate required: backends × 50 + buffer
   # Example: 5 backends × 50 = 250 + 50 buffer = 300
   
   docker compose exec postgres psql -U schedgen -d postgres -c \
     "ALTER SYSTEM SET max_connections = 300;"
   
   # Restart PostgreSQL
   docker compose restart postgres
   sleep 30
   
   # Verify
   docker compose exec postgres psql -U schedgen -d postgres -c \
     "SHOW max_connections;"
   ```

3. **Or reduce backend instances**:
   ```bash
   # Scale back down
   docker compose up -d --scale backend=2 --no-recreate
   ```

4. **Or reduce connection pool size per backend**:
   ```bash
   # Edit backend/src/app.module.ts
   # Change pool max from 50 to 25
   # Redeploy backend
   ```

### Issue 6: Out of Memory After Scaling

**Symptoms**:
```
Container killed due to OOM
Cannot allocate memory
```

**Causes**:
- Too many instances for available host memory
- Memory leak in application
- Memory limits too high

**Solutions**:

1. **Check host memory**:
   ```bash
   free -h
   # Check available memory
   ```

2. **Check container memory usage**:
   ```bash
   docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
   ```

3. **Scale down to fit available memory**:
   ```bash
   # Calculate: available_memory / memory_per_instance
   # Example: 16GB available, 2GB per worker = 8 workers max
   
   docker compose up -d --scale pdf-worker=8 --no-recreate
   ```

4. **Check for memory leaks**:
   ```bash
   # Monitor memory over time
   watch -n 30 'docker stats --no-stream'
   
   # If memory continuously growing, restart services
   docker compose restart pdf-worker
   ```

5. **Adjust memory limits**:
   ```bash
   # Edit docker-compose.prod.yml
   # Reduce memory limits if needed
   # Example: Change pdf-worker from 2G to 1.5G
   ```


## Best Practices

### Before Scaling

1. **Monitor first, scale second**
   - Watch metrics for at least 5 minutes
   - Confirm trend is sustained, not temporary spike
   - Identify which service needs scaling

2. **Scale proactively**
   - Don't wait for critical thresholds
   - Scale at warning thresholds (60-80%)
   - Better to scale early than during incident

3. **Know your capacity limits**
   - Understand host resource limits
   - Know database connection limits
   - Plan for maximum scale before hitting limits

4. **Test scaling in staging first**
   - Practice scaling procedures
   - Verify load balancing works
   - Identify issues before production

### During Scaling

1. **Scale gradually**
   - Don't jump from 3 to 50 workers immediately
   - Scale in steps: 3 → 10 → 20 → 30
   - Monitor after each step

2. **Monitor actively**
   - Watch Grafana dashboards
   - Check service logs
   - Verify health checks passing

3. **Verify load balancing**
   - Confirm requests distributed evenly
   - Check Traefik dashboard
   - Test with multiple requests

4. **Document actions**
   - Note what you scaled and when
   - Record metrics before and after
   - Document any issues encountered

### After Scaling

1. **Verify thoroughly**
   - Complete all verification steps
   - Test critical user flows
   - Monitor for extended period (30+ minutes)

2. **Monitor for 1 hour**
   - Check metrics every 10 minutes
   - Watch for unexpected behavior
   - Be ready to scale further or rollback

3. **Communicate with team**
   - Notify team of scaling completion
   - Share metrics improvements
   - Document lessons learned

4. **Plan for scale down**
   - Set reminder to check if scale down possible
   - Monitor for sustained low load
   - Scale down gradually when appropriate

### General Best Practices

1. **Baseline Configuration**
   - Maintain documented baseline (1 frontend, 1 backend, 3 PDF workers)
   - Return to baseline when load normalizes
   - Review baseline quarterly

2. **Capacity Planning**
   - Know maximum capacity of current infrastructure
   - Plan infrastructure upgrades before hitting limits
   - Document capacity limits

3. **Automation**
   - Consider auto-scaling for predictable patterns
   - Document manual scaling procedures
   - Practice scaling regularly

4. **Cost Optimization**
   - Scale down during low-traffic periods
   - Monitor resource utilization
   - Right-size instances based on actual usage

5. **Documentation**
   - Keep this runbook updated
   - Document scaling decisions
   - Share knowledge with team


## Quick Reference

### Scaling Commands

```bash
# Scale PDF Worker
docker compose up -d --scale pdf-worker=10 --no-recreate

# Scale Backend
docker compose up -d --scale backend=3 --no-recreate

# Scale Frontend
docker compose up -d --scale frontend=2 --no-recreate

# Scale multiple services
docker compose up -d \
  --scale frontend=2 \
  --scale backend=3 \
  --scale pdf-worker=10 \
  --no-recreate

# Return to baseline
docker compose up -d \
  --scale frontend=1 \
  --scale backend=1 \
  --scale pdf-worker=3 \
  --no-recreate
```

### Monitoring Commands

```bash
# Check instance counts
docker compose ps | grep -E "frontend|backend|pdf-worker"

# Check resource usage
docker stats --no-stream

# Check queue metrics
curl -s http://localhost:3001/api/jobs/metrics | jq

# Check database connections
docker compose exec postgres psql -U schedgen -d schedgen -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"

# Test response times
curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3001/health

# Check health status
docker compose ps
./scripts/verify-deployment.sh --quick
```

### Scaling Thresholds Quick Reference

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| CPU | < 60% | 60-80% | > 80% | Scale up |
| Memory | < 60% | 60-80% | > 80% | Scale up |
| Response time (p95) | < 2s | 2-5s | > 5s | Scale up |
| Error rate | < 1% | 1-5% | > 5% | Scale up |
| Queue depth | < 50 | 50-200 | > 200 | Scale PDF workers |
| DB connections | < 30 | 30-40 | > 40 | Scale backend |

### Service Capacity Limits

| Service | Minimum | Baseline | Maximum | Notes |
|---------|---------|----------|---------|-------|
| Frontend | 1 | 1 | 20 | 1 per 500 users |
| Backend | 1 | 1 | 20 | Limited by DB connections |
| PDF Worker | 2 | 3 | 50 | 1 per 50 jobs in queue |

### Common Scaling Scenarios

**Scenario 1: Queue building up (> 200 jobs)**
```bash
docker compose up -d --scale pdf-worker=10 --no-recreate
```

**Scenario 2: High API load (CPU > 80%)**
```bash
docker compose up -d --scale backend=3 --no-recreate
```

**Scenario 3: Anticipated traffic spike**
```bash
docker compose up -d \
  --scale frontend=2 \
  --scale backend=3 \
  --scale pdf-worker=10 \
  --no-recreate
```

**Scenario 4: Return to normal after spike**
```bash
# Wait 30 minutes after load normalizes, then:
docker compose up -d \
  --scale frontend=1 \
  --scale backend=1 \
  --scale pdf-worker=3 \
  --no-recreate
```

### Emergency Contacts

```
On-Call Engineer: [PagerDuty rotation]
Engineering Lead: [Contact info]
System Administrator: [Contact info]
```

### Key Dashboards

- **System Overview**: http://localhost:3002/d/system-overview
- **Job Processing**: http://localhost:3002/d/job-processing
- **Resource Utilization**: http://localhost:3002/d/resource-utilization
- **Traefik Dashboard**: http://localhost:8080


## Scaling Checklist

Use this checklist when scaling services:

### Pre-Scaling
- [ ] Metrics reviewed (CPU, memory, response times)
- [ ] Scaling decision justified by sustained metrics
- [ ] Current instance counts noted
- [ ] Host resources verified (sufficient CPU, memory, disk)
- [ ] Database connection capacity checked (if scaling backend)
- [ ] Grafana dashboards opened
- [ ] Team notified of scaling operation
- [ ] Backup operator available

### During Scaling
- [ ] Scaling command executed
- [ ] New instances starting
- [ ] Health checks monitored
- [ ] Load balancing verified
- [ ] Logs checked for errors
- [ ] Metrics monitored in real-time

### Post-Scaling
- [ ] All instances running and healthy
- [ ] Health endpoints responding
- [ ] Load distributed evenly across instances
- [ ] Response times improved
- [ ] CPU usage per instance < 60%
- [ ] Memory usage per instance < 60%
- [ ] Database connections within limits (if scaled backend)
- [ ] Queue depth decreasing (if scaled PDF workers)
- [ ] Grafana dashboards show improvement
- [ ] No new errors in logs
- [ ] Critical user flows tested
- [ ] Monitored for 30+ minutes
- [ ] Team notified of completion
- [ ] Scaling action documented

### Scale Down
- [ ] Metrics in normal range for 30+ minutes
- [ ] No anticipated traffic spikes
- [ ] Not during peak hours
- [ ] Team notified
- [ ] Scaled down gradually
- [ ] Services verified healthy
- [ ] Metrics monitored for 30 minutes
- [ ] No performance degradation
- [ ] Ready to scale back up if needed

## Related Documentation

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Standard deployment procedures
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback procedures
- [Incident Response Runbook](./INCIDENT_RESPONSE_RUNBOOK.md) - Incident handling
- [Scalability Assessment](./SCALABILITY_ASSESSMENT.md) - Capacity planning
- [Load Testing Guide](./LOAD_TESTING.md) - Performance testing
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production readiness

## Requirements Validation

This runbook satisfies the following requirements:

- **Requirement 10.1**: Backend horizontal scaling from 1 to 20 instances
- **Requirement 10.2**: PDF Worker horizontal scaling from 2 to 50 instances
- **Requirement 10.3**: Session sharing via Redis for multiple backend instances
- **Requirement 10.4**: Traefik automatic load balancing with health checks

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-11-30 | 1.0 | Initial scaling runbook | System |

