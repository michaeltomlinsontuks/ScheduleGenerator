# Monitoring and Alerting Guide

Comprehensive guide for using Grafana dashboards, interpreting alerts, and troubleshooting issues in the UP Schedule Generator production environment.

## Table of Contents

- [Overview](#overview)
- [Accessing Monitoring Tools](#accessing-monitoring-tools)
- [Grafana Dashboard Usage](#grafana-dashboard-usage)
- [Alert Interpretation](#alert-interpretation)
- [Troubleshooting by Alert](#troubleshooting-by-alert)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)

## Overview

The UP Schedule Generator monitoring stack provides real-time visibility into system health, performance, and resource utilization. This guide helps you:

- Navigate and use Grafana dashboards effectively
- Understand what each alert means
- Respond to alerts with specific troubleshooting steps
- Identify patterns and trends before they become incidents

**Monitoring Stack Components**:
- **Prometheus**: Collects and stores metrics from all services
- **Grafana**: Visualizes metrics through interactive dashboards
- **Alerting Rules**: Automatically detect anomalies and trigger alerts

**Key Metrics Categories**:
- **Performance**: Response times, throughput, error rates
- **Resources**: CPU, memory, database connections
- **Business**: Job processing rates, queue depth, user activity
- **Health**: Service availability, scrape success


## Accessing Monitoring Tools

### Grafana

**Development Environment**:
```
URL: http://localhost:3002
Default Credentials: admin/admin (change on first login)
```

**Production Environment**:
```
URL: https://grafana.yourdomain.com
Credentials: Use SSO or configured admin account
```

**First-Time Setup**:
1. Navigate to Grafana URL
2. Log in with credentials
3. Navigate to "Dashboards" → "Browse"
4. Open the "Production" folder
5. Bookmark frequently used dashboards

### Prometheus

**Development Environment**:
```
URL: http://localhost:9090
```

**Production Environment**:
```
URL: https://prometheus.yourdomain.com
```

**Use Cases**:
- Query metrics directly using PromQL
- View active alerts and their status
- Check scrape target health
- Debug metric collection issues


## Grafana Dashboard Usage

### Dashboard 1: System Overview

**Purpose**: High-level view of overall system health and performance

**Location**: Dashboards → Production → System Overview

**When to Use**:
- First dashboard to check during incidents
- Daily health checks
- Quick status verification
- Identifying performance trends

#### Key Panels and Interpretation

**1. Request Rate**

*What it shows*: Number of HTTP requests per second, broken down by method (GET, POST, etc.)

*Normal behavior*:
- Steady baseline during business hours
- Lower traffic during off-hours
- Gradual increases/decreases

*Warning signs*:
- Sudden spike (possible attack or viral content)
- Sudden drop to zero (service down)
- Unusual patterns (e.g., high POST rate could indicate abuse)

*Actions*:
- Spike: Check error rate, scale if needed
- Drop: Check service health, investigate outage
- Unusual pattern: Review logs for suspicious activity

**2. Error Rate**

*What it shows*: Percentage of requests returning 5xx errors

*Normal behavior*:
- < 1% under normal conditions
- Brief spikes during deployments acceptable

*Warning signs*:
- > 5% for more than 2 minutes (triggers HighErrorRate alert)
- Sustained elevated rate (1-5%)
- Gradual increase over time

*Actions*:
- Check recent deployments (rollback if needed)
- Review backend logs for error patterns
- Check database and Redis connectivity
- See [HighErrorRate troubleshooting](#higherrorrate)


**3. Response Time (P50, P95, P99)**

*What it shows*: Response time percentiles across all endpoints

- **P50 (median)**: Half of requests are faster than this
- **P95**: 95% of requests are faster than this
- **P99**: 99% of requests are faster than this

*Normal behavior*:
- P50: < 500ms
- P95: < 2s
- P99: < 5s

*Warning signs*:
- P95 > 10s (triggers HighResponseTime alert)
- Large gap between P50 and P95 (inconsistent performance)
- Gradual increase over time (performance degradation)

*Actions*:
- Check queue depth (high queue = slow processing)
- Review database connection pool usage
- Check for slow queries in database
- Scale backend or PDF workers if needed
- See [HighResponseTime troubleshooting](#highresponsetime)

**4. Response Time by Route (P95)**

*What it shows*: P95 response time broken down by API endpoint

*Normal behavior*:
- Upload endpoint: < 2s
- Status check: < 200ms
- Health check: < 100ms

*Warning signs*:
- Specific route much slower than others
- Upload endpoint > 5s
- Status check > 1s

*Actions*:
- Identify slow endpoint
- Check endpoint-specific logs
- Review code for performance issues
- Add caching if appropriate

**5. Requests by Status Code**

*What it shows*: Request volume by HTTP status code (200, 400, 500, etc.)

*Normal behavior*:
- Majority 200 (success)
- Some 400 (client errors - expected)
- Very few 500 (server errors)

*Warning signs*:
- High 500 rate (server errors)
- High 429 rate (rate limiting triggered)
- High 503 rate (service unavailable)

*Actions*:
- 500s: Check error logs, investigate server issues
- 429s: Review rate limiting configuration, check for abuse
- 503s: Check service health, scale if needed


**6. Active Alerts**

*What it shows*: Number of currently firing alerts

*Normal behavior*:
- 0 alerts (green)

*Warning signs*:
- 1-2 alerts (yellow) - investigate
- 3+ alerts (red) - likely cascading failure

*Actions*:
- Click panel to see alert details
- Navigate to Prometheus alerts page
- Follow troubleshooting for specific alerts

**7. Uptime**

*What it shows*: Whether backend service is responding to health checks

*Normal behavior*:
- "UP" (green background)

*Warning signs*:
- "DOWN" (red background)

*Actions*:
- Check container status: `docker ps | grep backend`
- Review backend logs: `docker logs backend --tail 100`
- Restart if needed: `docker-compose restart backend`
- See [ServiceDown troubleshooting](#servicedown)

#### Using System Overview Dashboard

**Daily Health Check Workflow**:
1. Open System Overview dashboard
2. Check Uptime panel (should be green)
3. Check Active Alerts (should be 0)
4. Review Error Rate (should be < 1%)
5. Check Response Time trends (should be stable)
6. Note any anomalies for investigation

**Incident Response Workflow**:
1. Open System Overview dashboard
2. Identify affected metrics (error rate, response time, etc.)
3. Note time when issue started
4. Check for correlated changes (deployment, traffic spike)
5. Navigate to specific dashboard for deeper investigation
6. Follow alert-specific troubleshooting


### Dashboard 2: Job Processing

**Purpose**: Monitor PDF processing pipeline and job queue health

**Location**: Dashboards → Production → Job Processing

**When to Use**:
- Investigating slow PDF processing
- Monitoring queue depth
- Analyzing job failure patterns
- Capacity planning for workers

#### Key Panels and Interpretation

**1. Job Creation Rate by Type**

*What it shows*: Rate of new jobs being created, split by PDF type (lecture, test, exam)

*Normal behavior*:
- Varies by time of day and semester
- Spikes during registration periods
- Exam jobs increase before exam periods

*Warning signs*:
- Sudden spike (possible abuse or viral sharing)
- Unexpected pattern (e.g., many exam jobs mid-semester)

*Actions*:
- Spike: Check if legitimate traffic, scale workers
- Unusual pattern: Review logs for suspicious activity

**2. Queue Depth (Waiting Jobs)**

*What it shows*: Number of jobs waiting to be processed

*Normal behavior*:
- < 100 jobs during normal operation
- Brief spikes acceptable during high traffic

*Warning signs*:
- > 200 jobs for 10+ minutes (triggers ElevatedQueueDepth alert)
- > 500 jobs for 5+ minutes (triggers HighQueueDepth alert)
- Continuously increasing (workers not keeping up)

*Actions*:
- Scale PDF workers: `docker-compose up -d --scale pdf-worker=10`
- Check worker health: `docker ps | grep pdf-worker`
- Review worker logs for errors
- See [HighQueueDepth troubleshooting](#highqueuedepth)

**3. PDF Processing Duration (P50, P95, P99)**

*What it shows*: Time to process PDFs, by percentile

*Normal behavior*:
- P50: < 10s
- P95: < 60s
- P99: < 120s

*Warning signs*:
- P95 > 120s (triggers SlowPDFProcessing alert)
- Large gap between percentiles (inconsistent performance)
- Increasing trend over time

*Actions*:
- Check for large/complex PDFs
- Review worker resource usage
- Scale workers if CPU/memory constrained
- Check for worker errors in logs


**4. Job Success Rate**

*What it shows*: Percentage of jobs completing successfully

*Normal behavior*:
- > 95% success rate

*Warning signs*:
- < 90% success rate (triggers HighJobFailureRate alert)
- Sudden drop in success rate
- Specific PDF type failing more than others

*Actions*:
- Check worker logs for error patterns
- Review failed job details
- Check for corrupted/invalid PDFs
- See [HighJobFailureRate troubleshooting](#highjobfailurerate)

**5. Total Jobs by Type**

*What it shows*: Cumulative count of jobs processed by type

*Normal behavior*:
- Steady increase over time
- Lecture jobs most common
- Exam jobs spike during exam periods

*Warning signs*:
- Flat line (no jobs being processed)
- Unexpected distribution

*Actions*:
- Flat line: Check workers are running and processing
- Unusual distribution: Investigate traffic patterns

**6. Processing Duration Distribution (Heatmap)**

*What it shows*: Distribution of processing times over time

*Normal behavior*:
- Most jobs in 5-30 second range
- Consistent pattern over time

*Warning signs*:
- Shift toward longer processing times
- Bimodal distribution (two distinct groups)

*Actions*:
- Investigate what changed (PDF complexity, worker performance)
- Check for resource constraints

#### Using Job Processing Dashboard

**Queue Monitoring Workflow**:
1. Check Queue Depth panel
2. If elevated, check Job Creation Rate (is traffic high?)
3. Check Processing Duration (are workers slow?)
4. Check worker count: `docker ps | grep pdf-worker`
5. Scale workers if needed

**Performance Investigation Workflow**:
1. Check Processing Duration percentiles
2. Review Processing Duration Distribution heatmap
3. Identify when slowdown started
4. Check worker resource usage in Resource Utilization dashboard
5. Review worker logs for errors


### Dashboard 3: Resource Utilization

**Purpose**: Monitor infrastructure resource usage and identify bottlenecks

**Location**: Dashboards → Production → Resource Utilization

**When to Use**:
- Investigating performance issues
- Capacity planning
- Detecting resource leaks
- Optimizing resource allocation

#### Key Panels and Interpretation

**1. Database Connections (Total, Active, Idle)**

*What it shows*: Number of database connections by state

*Normal behavior*:
- Total: 10-30 connections
- Active: 5-15 connections
- Idle: 5-15 connections
- Well below max (50)

*Warning signs*:
- Total approaching 50 (pool exhaustion)
- Active > 40 (high load)
- Idle very low (no spare capacity)

*Actions*:
- Scale backend instances
- Check for connection leaks
- Review slow queries
- See [DatabaseConnectionPoolExhausted troubleshooting](#databaseconnectionpoolexhausted)

**2. Database Connection Pool Utilization**

*What it shows*: Percentage of connection pool in use

*Normal behavior*:
- < 60% utilization

*Warning signs*:
- > 80% for 5+ minutes (triggers HighDatabaseConnectionUsage alert)
- Sustained high utilization
- Rapid increases

*Actions*:
- Scale backend to distribute load
- Investigate slow queries
- Check for connection leaks
- Consider increasing pool size

**3. Memory Usage (Heap)**

*What it shows*: Node.js heap memory usage

*Normal behavior*:
- Steady state with periodic GC drops
- < 80% of heap size

*Warning signs*:
- > 80% for 5+ minutes (triggers HighMemoryUsage alert)
- Continuously increasing (memory leak)
- Frequent GC without memory release

*Actions*:
- Restart service to clear memory
- Investigate memory leaks
- Review recent code changes
- Check for large object retention


**4. Event Loop Lag**

*What it shows*: Delay in Node.js event loop processing

*Normal behavior*:
- < 100ms most of the time
- Brief spikes acceptable

*Warning signs*:
- > 1s for 3+ minutes (triggers HighEventLoopLag alert)
- Sustained high lag
- Correlates with slow response times

*Actions*:
- Check for CPU-intensive operations
- Review for blocking code
- Scale backend instances
- Optimize slow operations

**5. Garbage Collection Duration**

*What it shows*: Time spent in garbage collection

*Normal behavior*:
- Brief, infrequent GC pauses
- < 100ms per collection

*Warning signs*:
- Frequent long GC pauses (> 500ms)
- Increasing GC frequency
- Correlates with memory pressure

*Actions*:
- Investigate memory usage patterns
- Optimize object creation/retention
- Consider increasing heap size
- Review for memory leaks

**6. Active Handles and Requests**

*What it shows*: Number of active handles (timers, sockets) and pending requests

*Normal behavior*:
- Stable counts
- Handles: < 1000
- Requests: < 100

*Warning signs*:
- Continuously increasing handles (resource leak)
- High pending requests (backlog)

*Actions*:
- Investigate resource leaks
- Check for unclosed connections
- Review async operation handling

#### Using Resource Utilization Dashboard

**Resource Health Check Workflow**:
1. Check Database Connection Pool Utilization (< 80%)
2. Check Memory Usage (< 80%)
3. Check Event Loop Lag (< 100ms)
4. Note any concerning trends

**Performance Bottleneck Investigation**:
1. Identify which resource is constrained
2. Check correlation with performance issues
3. Review resource usage over time
4. Determine if scaling or optimization needed


### Dashboard Navigation Tips

**Time Range Selection**:
- Use time picker (top right) to adjust view
- Common ranges: Last 1h, Last 6h, Last 24h, Last 7d
- Use "Refresh" dropdown to auto-refresh (30s recommended)

**Zooming and Drilling Down**:
- Click and drag on any graph to zoom into time range
- Click "Zoom out" to return to previous view
- Click legend items to show/hide specific series
- Hover over data points for exact values

**Comparing Time Periods**:
- Use "Time shift" feature to overlay previous period
- Useful for comparing current vs. yesterday/last week
- Helps identify if issue is new or recurring pattern

**Sharing and Annotations**:
- Click "Share" to get dashboard link
- Add annotations to mark deployments or incidents
- Annotations appear as vertical lines on graphs

**Creating Custom Views**:
- Click "Dashboard settings" → "Variables" to filter by service
- Use "Add panel" to create custom visualizations
- Save as new dashboard or update existing


## Alert Interpretation

### Understanding Alert States

**Pending**: Alert condition met but waiting for duration threshold
- Example: Error rate > 5% for 30 seconds (needs 2 minutes)
- Action: Monitor, prepare to respond if it fires

**Firing**: Alert condition met for required duration
- Example: Error rate > 5% for 2+ minutes
- Action: Immediate investigation and response required

**Resolved**: Alert condition no longer met
- Example: Error rate dropped below 5%
- Action: Verify resolution, document what fixed it

### Alert Severity Levels

**Critical**: Immediate action required, user-facing impact
- Response time: < 5 minutes
- Examples: HighErrorRate, HighQueueDepth, BackendDown
- Escalation: Page on-call engineer

**Warning**: Attention needed, potential future impact
- Response time: < 30 minutes
- Examples: ElevatedQueueDepth, HighMemoryUsage
- Escalation: Notify team, investigate during business hours

### Alert Anatomy

Every alert includes:

**Labels**:
- `severity`: critical or warning
- `component`: affected component (backend, pdf-worker, database, queue)
- `alertname`: unique alert identifier

**Annotations**:
- `summary`: Brief description of the issue
- `description`: Detailed information with current value
- `dashboard`: Link to relevant Grafana dashboard

**Example Alert**:
```
Alert: HighErrorRate
Severity: critical
Component: backend
Summary: High error rate detected
Description: Error rate is 7.2% (threshold: 5%)
Dashboard: http://grafana:3000/d/system-overview
```


### Viewing Active Alerts

**In Prometheus**:
1. Navigate to http://localhost:9090/alerts
2. View all alert rules and their current state
3. See when alert started firing
4. View alert query and threshold

**In Grafana**:
1. Open System Overview dashboard
2. Check "Active Alerts" panel
3. Click panel for alert details
4. Navigate to Alerting → Alert Rules for full list

**Via Command Line**:
```bash
# Query Prometheus API for active alerts
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")'
```

### Alert Notification Channels (Future)

When Alertmanager is configured, alerts will be sent via:
- Email to on-call engineer
- Slack to #alerts channel
- PagerDuty for critical alerts
- SMS for critical alerts (optional)


## Troubleshooting by Alert

### HighErrorRate

**Alert Definition**: HTTP 5xx error rate exceeds 5% for 2 minutes

**Severity**: Critical

**What It Means**: 
More than 5% of requests are failing with server errors. Users are experiencing failures when trying to use the application.

**Immediate Actions**:

1. **Check Service Health**
   ```bash
   # Verify all services are running
   docker ps
   
   # Check health endpoints
   curl http://localhost:3000/health
   curl http://localhost:8000/health
   ```

2. **Review Error Logs**
   ```bash
   # Check backend logs for errors
   docker logs backend --tail 100 2>&1 | grep -i error
   
   # Look for error patterns
   docker logs backend --since 5m 2>&1 | grep "500\|error" | head -20
   ```

3. **Check Recent Changes**
   ```bash
   # Check if recent deployment
   docker ps --format "{{.Names}}\t{{.Status}}"
   
   # Review recent commits
   git log --oneline -5
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Bad deployment | Errors started after deployment | Rollback: `./scripts/rollback.sh` | 5-10 min |
| Database connection issues | "Connection pool exhausted" in logs | Restart backend: `docker-compose restart backend` | 2 min |
| Redis unavailable | "Redis connection failed" in logs | Restart Redis: `docker-compose restart redis` | 2 min |
| PDF Worker failures | Errors on /api/upload endpoint | Check worker logs, restart workers | 3-5 min |
| Resource exhaustion | High CPU/memory in Resource dashboard | Scale services or restart | 5 min |

**Verification**:
```bash
# Run smoke tests
./scripts/verify-deployment.sh --quick

# Check error rate in Grafana System Overview
# Should drop below 1% within 5 minutes
```

**Escalation**: If not resolved in 15 minutes, escalate to engineering lead

**Related Dashboards**: System Overview, Resource Utilization

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#1-high-error-rate--5)


### HighResponseTime

**Alert Definition**: P95 response time exceeds 10 seconds for 3 minutes

**Severity**: Critical

**What It Means**: 
95% of requests are taking longer than 10 seconds. Users are experiencing very slow page loads and timeouts.

**Immediate Actions**:

1. **Check Queue Depth**
   ```bash
   # Check job queue metrics
   curl http://localhost:3000/api/jobs/metrics
   ```

2. **Check Resource Usage**
   ```bash
   # Check container resource usage
   docker stats --no-stream
   ```

3. **Identify Slow Endpoints**
   - Open Grafana System Overview dashboard
   - Check "Response Time by Route" panel
   - Identify which endpoints are slow

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| High queue depth (> 500) | Queue Depth panel shows backlog | Scale workers: `docker-compose up -d --scale pdf-worker=10` | 3-5 min |
| Database slow queries | High DB connection usage | Kill slow queries, check indexes | 5-10 min |
| Memory pressure | High memory in Resource dashboard | Restart services: `docker-compose restart backend` | 3 min |
| Too many concurrent users | High request rate | Scale backend: `docker-compose up -d --scale backend=3` | 3-5 min |
| Cache not working | High DB load despite caching | Restart Redis: `docker-compose restart redis` | 2 min |

**Database Query Investigation**:
```bash
# Connect to database
docker exec -it postgres psql -U schedgen -d schedgen

# Check for slow queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC 
LIMIT 10;

# Kill slow query if needed
SELECT pg_terminate_backend(PID);
```

**Verification**:
```bash
# Check response time improved
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Monitor in Grafana System Overview
# P95 should drop below 2s within 5 minutes
```

**Escalation**: If not resolved in 20 minutes, escalate to engineering lead

**Related Dashboards**: System Overview, Job Processing, Resource Utilization

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#2-slow-response-times-p95--10s)


### HighQueueDepth

**Alert Definition**: Queue has more than 500 waiting jobs for 5 minutes

**Severity**: Critical

**What It Means**: 
PDF processing queue is backed up. Users will experience long delays getting their schedules processed.

**Immediate Actions**:

1. **Check Worker Status**
   ```bash
   # Check how many workers are running
   docker ps | grep pdf-worker
   
   # Check worker health
   for i in {1..3}; do curl http://localhost:800$i/health; echo; done
   ```

2. **Check Worker Logs**
   ```bash
   # Check for errors in worker logs
   docker logs pdf-worker --tail 50
   
   # Check all workers if scaled
   docker-compose logs pdf-worker --tail 20
   ```

3. **Check Queue Metrics**
   ```bash
   # Get detailed queue metrics
   curl http://localhost:3000/api/jobs/metrics | jq
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Not enough workers | Only 2-3 workers running | Scale to 10: `docker-compose up -d --scale pdf-worker=10` | 3-5 min |
| Workers crashing | Workers restarting frequently | Check logs, fix issue, restart | 10-20 min |
| Stalled jobs | Active jobs not completing | Clear stalled jobs from Redis | 2 min |
| Traffic spike | Sudden increase in uploads | Scale workers, enable rate limiting | 5 min |
| Large/complex PDFs | Processing taking > 2 minutes | Increase timeout, add more workers | 5 min |

**Scaling Workers**:
```bash
# Scale to 10 workers
docker-compose up -d --scale pdf-worker=10

# Verify workers started
docker ps | grep pdf-worker | wc -l

# Monitor queue draining
watch -n 10 'curl -s http://localhost:3000/api/jobs/metrics | jq .waiting'
```

**Clearing Stalled Jobs**:
```bash
# Connect to Redis
docker exec -it redis redis-cli

# Check stalled jobs
LLEN bull:pdf-processing:active

# If jobs are stalled (not decreasing), move them back to wait
# This requires BullMQ admin commands - see backend documentation
```

**Verification**:
- Queue depth should start decreasing within 2-3 minutes
- Monitor in Grafana Job Processing dashboard
- Target: < 100 waiting jobs within 15 minutes

**Escalation**: If queue not draining after scaling, escalate immediately

**Related Dashboards**: Job Processing

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#4-queue-depth-high--500-jobs)


### HighDatabaseConnectionUsage

**Alert Definition**: Database connection pool utilization exceeds 80% for 5 minutes

**Severity**: Warning

**What It Means**: 
Database connection pool is nearly exhausted. If it reaches 100%, new requests will fail or timeout.

**Immediate Actions**:

1. **Check Connection Pool Status**
   ```bash
   # Connect to database
   docker exec -it postgres psql -U schedgen -d schedgen
   
   # Check current connections
   SELECT count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
   FROM pg_stat_activity
   WHERE datname = 'schedgen';
   ```

2. **Check for Long-Running Queries**
   ```sql
   -- Find long-running queries
   SELECT pid, now() - query_start as duration, state, query
   FROM pg_stat_activity
   WHERE datname = 'schedgen' AND state != 'idle'
   ORDER BY duration DESC
   LIMIT 10;
   ```

3. **Check Backend Instances**
   ```bash
   # Check how many backend instances running
   docker ps | grep backend
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Connection leak | Connections not being released | Restart backend: `docker-compose restart backend` | 2 min |
| Too many concurrent requests | High request rate | Scale backend instances | 3-5 min |
| Long-running queries | Queries taking > 10s | Kill queries: `SELECT pg_terminate_backend(pid)` | 1 min |
| Idle transactions | Many "idle in transaction" | Kill idle transactions | 1 min |
| Pool size too small | Consistently at limit | Increase pool size in config | 5 min + deploy |

**Killing Problematic Connections**:
```sql
-- Kill specific long-running query
SELECT pg_terminate_backend(12345);  -- Replace with actual PID

-- Kill all idle in transaction (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'schedgen' 
  AND state = 'idle in transaction'
  AND now() - state_change > interval '5 minutes';
```

**Scaling Backend**:
```bash
# Scale to 3 backend instances
docker-compose up -d --scale backend=3

# Verify instances started
docker ps | grep backend
```

**Verification**:
- Connection count should drop below 40 (80% of 50)
- Check Resource Utilization dashboard
- Monitor for 10 minutes to ensure stable

**Escalation**: If connections don't decrease, escalate to DBA or engineering lead

**Related Dashboards**: Resource Utilization

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#5-database-connection-pool-exhausted)


### HighMemoryUsage

**Alert Definition**: Heap memory utilization exceeds 80% for 5 minutes

**Severity**: Warning

**What It Means**: 
Backend service is using most of its allocated memory. Risk of out-of-memory errors and crashes.

**Immediate Actions**:

1. **Check Memory Usage**
   ```bash
   # Check container memory usage
   docker stats backend --no-stream
   
   # Check Node.js heap usage in Grafana Resource Utilization dashboard
   ```

2. **Check for Memory Leaks**
   - Open Grafana Resource Utilization dashboard
   - Look at Memory Usage panel over last 6 hours
   - Continuously increasing = likely memory leak
   - Sawtooth pattern = normal GC behavior

3. **Review Recent Changes**
   ```bash
   # Check recent deployments
   git log --oneline -10
   
   # Check when service was last restarted
   docker inspect backend | jq '.[0].State.StartedAt'
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Memory leak | Continuously increasing memory | Restart: `docker-compose restart backend` | 2 min |
| High traffic | Correlates with request rate | Scale backend instances | 3-5 min |
| Large objects in memory | Sudden increase after operation | Review code, optimize | 30+ min |
| Cache too large | Redis cache using too much memory | Clear cache: `docker exec redis redis-cli FLUSHDB` | 1 min |
| Insufficient memory limit | Consistently at limit | Increase memory limit in docker-compose | 5 min + deploy |

**Immediate Mitigation**:
```bash
# Restart backend to clear memory
docker-compose restart backend

# Verify memory usage dropped
docker stats backend --no-stream

# Monitor in Grafana for 10 minutes
```

**Investigating Memory Leaks**:
```bash
# Enable Node.js heap snapshots (requires code change)
# Add to backend startup: --inspect=0.0.0.0:9229

# Take heap snapshot
docker exec backend kill -USR2 $(docker exec backend pgrep node)

# Analyze with Chrome DevTools or heapdump package
```

**Verification**:
- Memory usage should drop below 60% after restart
- Monitor for gradual increase (indicates leak)
- Check Garbage Collection Duration panel for excessive GC

**Escalation**: If memory increases rapidly after restart, escalate immediately

**Related Dashboards**: Resource Utilization

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#3-high-resource-utilization--80)


### HighEventLoopLag

**Alert Definition**: Event loop lag exceeds 1 second for 3 minutes

**Severity**: Warning

**What It Means**: 
Node.js event loop is blocked, preventing timely processing of requests. Causes slow response times and timeouts.

**Immediate Actions**:

1. **Check Event Loop Lag**
   - Open Grafana Resource Utilization dashboard
   - Check Event Loop Lag panel
   - Note when lag started

2. **Check CPU Usage**
   ```bash
   # Check container CPU usage
   docker stats backend --no-stream
   ```

3. **Review Active Operations**
   ```bash
   # Check backend logs for long operations
   docker logs backend --tail 100 | grep -i "slow\|timeout\|blocking"
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| CPU-intensive operation | High CPU usage | Optimize code, move to worker | 30+ min |
| Blocking synchronous code | Lag spikes during operations | Refactor to async | 30+ min |
| Too many concurrent requests | High request rate | Scale backend instances | 3-5 min |
| Database query blocking | Correlates with DB activity | Optimize queries, add indexes | 10-20 min |
| External API timeout | Waiting for external service | Add timeout, use async | 30+ min |

**Immediate Mitigation**:
```bash
# Scale backend to distribute load
docker-compose up -d --scale backend=3

# Verify lag decreased
# Check Grafana Resource Utilization dashboard
```

**Identifying Blocking Code**:
```bash
# Enable Node.js profiling (requires code change)
# Add to backend startup: --prof

# Generate CPU profile
docker exec backend kill -SIGUSR1 $(docker exec backend pgrep node)

# Analyze with node --prof-process
```

**Verification**:
- Event loop lag should drop below 100ms
- Response times should improve
- Monitor for 15 minutes to ensure stable

**Escalation**: If lag persists after scaling, escalate to engineering lead for code review

**Related Dashboards**: Resource Utilization, System Overview

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#3-high-resource-utilization--80)


### BackendDown

**Alert Definition**: Backend service health check failing for 1 minute

**Severity**: Critical

**What It Means**: 
Backend service is completely unavailable. All API requests are failing. Complete service outage.

**Immediate Actions**:

1. **Check Container Status**
   ```bash
   # Check if container is running
   docker ps -a | grep backend
   
   # Check container exit code if stopped
   docker inspect backend | jq '.[0].State'
   ```

2. **Check Container Logs**
   ```bash
   # Get last 100 lines of logs
   docker logs backend --tail 100
   
   # Look for crash reason
   docker logs backend 2>&1 | grep -i "error\|fatal\|crash" | tail -20
   ```

3. **Check Dependencies**
   ```bash
   # Check database
   docker exec postgres pg_isready
   
   # Check Redis
   docker exec redis redis-cli ping
   
   # Check MinIO
   curl http://localhost:9000/minio/health/live
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Container crashed | Container not in `docker ps` | Restart: `docker-compose restart backend` | 2 min |
| OOM killed | "Out of memory" in logs | Increase memory, restart | 3 min |
| Database down | "Connection refused" in logs | Restart database: `docker-compose restart postgres` | 2-3 min |
| Redis down | "Redis connection failed" | Restart Redis: `docker-compose restart redis` | 2 min |
| Bad deployment | Started after deployment | Rollback: `./scripts/rollback.sh` | 5-10 min |
| Port conflict | "Address already in use" | Check ports: `netstat -tulpn \| grep 3000` | 5 min |
| Configuration error | "Invalid configuration" in logs | Fix config, redeploy | 10-15 min |

**Restart Procedure**:
```bash
# Restart backend
docker-compose restart backend

# Wait for startup (30 seconds)
sleep 30

# Check health
curl http://localhost:3000/health

# Check logs for errors
docker logs backend --tail 50
```

**Rollback Procedure**:
```bash
# If recent deployment caused issue
./scripts/rollback.sh

# Verify service is up
./scripts/verify-deployment.sh --quick
```

**Verification**:
```bash
# Check service is running
docker ps | grep backend

# Check health endpoint
curl http://localhost:3000/health

# Run full smoke tests
./scripts/verify-deployment.sh --quick

# Check Grafana System Overview - Uptime should be green
```

**Escalation**: This is a SEV-1 incident - escalate immediately to engineering lead and product owner

**Related Dashboards**: System Overview

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md#6-service-completely-down), [Rollback Runbook](./ROLLBACK_RUNBOOK.md)


### HighJobFailureRate

**Alert Definition**: Job failure rate exceeds 10% for 5 minutes

**Severity**: Warning

**What It Means**: 
More than 10% of PDF processing jobs are failing. Users are unable to get their schedules processed.

**Immediate Actions**:

1. **Check Worker Status**
   ```bash
   # Check worker logs for errors
   docker logs pdf-worker --tail 100
   
   # Check all workers if scaled
   docker-compose logs pdf-worker --tail 50
   ```

2. **Check Failed Jobs**
   ```bash
   # Get recent failed jobs
   curl http://localhost:3000/api/jobs/metrics
   
   # Check Redis for failed job details
   docker exec redis redis-cli LRANGE bull:pdf-processing:failed 0 10
   ```

3. **Check Worker Health**
   ```bash
   # Check worker health endpoints
   for i in {1..3}; do curl http://localhost:800$i/health; echo; done
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Worker code error | Specific error in logs | Fix code, redeploy workers | 15-30 min |
| Invalid PDF files | "Parse error" in logs | Add better validation | 30+ min |
| Timeout issues | "Timeout" in logs | Increase timeout, optimize parser | 10-20 min |
| MinIO connection issues | "S3 error" in logs | Restart MinIO: `docker-compose restart minio` | 2 min |
| Resource constraints | Workers OOM or CPU throttled | Scale workers, increase limits | 5 min |

**Investigating Failed Jobs**:
```bash
# Get failed job details from database
docker exec -it postgres psql -U schedgen -d schedgen

SELECT id, pdf_type, error, created_at 
FROM jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

# Look for error patterns
SELECT error, count(*) 
FROM jobs 
WHERE status = 'failed' 
  AND created_at > now() - interval '1 hour'
GROUP BY error 
ORDER BY count DESC;
```

**Reprocessing Failed Jobs**:
```bash
# If issue is fixed, reprocess failed jobs
# This requires backend API endpoint or manual intervention
curl -X POST http://localhost:3000/api/jobs/retry-failed
```

**Verification**:
- Failure rate should drop below 5%
- Check Job Processing dashboard
- Monitor for 15 minutes to ensure stable

**Escalation**: If failure rate doesn't improve, escalate to engineering team

**Related Dashboards**: Job Processing

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md)


### SlowPDFProcessing

**Alert Definition**: P95 PDF processing time exceeds 120 seconds for 5 minutes

**Severity**: Warning

**What It Means**: 
PDF processing is taking much longer than normal. Users experiencing long waits for their schedules.

**Immediate Actions**:

1. **Check Processing Times**
   - Open Grafana Job Processing dashboard
   - Check PDF Processing Duration panel
   - Note which PDF types are slow

2. **Check Worker Resources**
   ```bash
   # Check worker CPU and memory
   docker stats pdf-worker --no-stream
   
   # Check all workers if scaled
   docker stats $(docker ps --filter name=pdf-worker --format "{{.Names}}")
   ```

3. **Check Recent Jobs**
   ```bash
   # Check for large or complex PDFs
   docker exec -it postgres psql -U schedgen -d schedgen
   
   SELECT id, pdf_type, 
          extract(epoch from (completed_at - created_at)) as duration_seconds
   FROM jobs 
   WHERE status = 'completed' 
     AND completed_at > now() - interval '30 minutes'
   ORDER BY duration_seconds DESC 
   LIMIT 10;
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Large/complex PDFs | Specific jobs taking > 2 min | Enforce page limits, optimize parser | 30+ min |
| Worker resource constraints | High CPU/memory usage | Scale workers, increase limits | 5 min |
| Too few workers | High queue depth | Scale to 10 workers | 3-5 min |
| Parser inefficiency | All PDFs slow | Optimize parser code | 1-2 hours |
| Network issues | S3 download slow | Check MinIO, network latency | 10 min |

**Scaling Workers**:
```bash
# Scale to 10 workers
docker-compose up -d --scale pdf-worker=10

# Verify workers started
docker ps | grep pdf-worker | wc -l

# Monitor processing times
# Should improve within 5 minutes
```

**Checking PDF Complexity**:
```bash
# Get PDF file sizes from MinIO
docker exec minio mc ls local/schedgen-pdfs --recursive

# Check for unusually large files (> 5MB)
```

**Verification**:
- P95 processing time should drop below 60s
- Check Job Processing dashboard
- Monitor for 15 minutes to ensure stable

**Escalation**: If processing times don't improve, escalate to engineering team for parser optimization

**Related Dashboards**: Job Processing, Resource Utilization

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md)


### ElevatedQueueDepth

**Alert Definition**: Queue has more than 200 waiting jobs for 10 minutes

**Severity**: Warning

**What It Means**: 
Queue is building up but not yet critical. Early warning that workers may not be keeping up with demand.

**Immediate Actions**:

1. **Check Queue Trend**
   - Open Grafana Job Processing dashboard
   - Check Queue Depth panel over last hour
   - Determine if increasing, stable, or decreasing

2. **Check Worker Count**
   ```bash
   # Check how many workers are running
   docker ps | grep pdf-worker | wc -l
   ```

3. **Check Job Creation Rate**
   - Check Job Creation Rate panel in Grafana
   - Compare to normal baseline

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Traffic increase | Higher than normal job creation rate | Scale workers proactively | 3-5 min |
| Worker performance degraded | Processing times increased | Check worker resources, restart | 5 min |
| Approaching peak hours | Predictable traffic pattern | Scale workers before peak | 3-5 min |
| Slow PDFs in queue | Some jobs taking very long | Monitor, may need to scale | 5 min |

**Proactive Scaling**:
```bash
# Scale to 5-7 workers (moderate increase)
docker-compose up -d --scale pdf-worker=7

# Monitor queue depth
watch -n 30 'curl -s http://localhost:3000/api/jobs/metrics | jq .waiting'
```

**Verification**:
- Queue depth should stabilize or decrease
- Should not reach 500 (critical threshold)
- Monitor for 20 minutes

**Escalation**: If queue continues growing toward 500, escalate and scale more aggressively

**Related Dashboards**: Job Processing

**Related Runbooks**: [Scaling Runbook](./SCALING_RUNBOOK.md)


### NoJobsProcessing

**Alert Definition**: No jobs processed for 10 minutes despite queue backlog

**Severity**: Critical

**What It Means**: 
Workers appear to be stuck or not processing jobs. Queue is building up but nothing is completing.

**Immediate Actions**:

1. **Check Worker Status**
   ```bash
   # Check if workers are running
   docker ps | grep pdf-worker
   
   # Check worker logs for errors
   docker logs pdf-worker --tail 100
   ```

2. **Check Active Jobs**
   ```bash
   # Check Redis for active jobs
   docker exec redis redis-cli LLEN bull:pdf-processing:active
   
   # Check if jobs are stuck
   docker exec redis redis-cli LRANGE bull:pdf-processing:active 0 5
   ```

3. **Check Queue Metrics**
   ```bash
   curl http://localhost:3000/api/jobs/metrics
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| All workers crashed | No workers in `docker ps` | Restart: `docker-compose up -d pdf-worker` | 2-3 min |
| Workers stuck | Workers running but not processing | Restart: `docker-compose restart pdf-worker` | 2-3 min |
| Redis connection lost | "Redis error" in logs | Restart Redis: `docker-compose restart redis` | 2 min |
| Jobs stuck in active state | Active jobs not completing | Clear stalled jobs, restart workers | 5 min |
| MinIO unavailable | Cannot download PDFs | Restart MinIO: `docker-compose restart minio` | 2 min |

**Restart Workers**:
```bash
# Restart all workers
docker-compose restart pdf-worker

# If scaled, restart all instances
docker-compose up -d --scale pdf-worker=5

# Verify workers started
docker ps | grep pdf-worker

# Check workers are processing
watch -n 10 'curl -s http://localhost:3000/api/jobs/metrics | jq "{waiting, active, completed}"'
```

**Clearing Stalled Jobs**:
```bash
# Connect to Redis
docker exec -it redis redis-cli

# Check stalled jobs
LLEN bull:pdf-processing:active

# If jobs are stalled (not changing), they need to be moved back to wait
# This requires BullMQ admin intervention - contact engineering team
```

**Verification**:
- Jobs should start completing within 2 minutes
- Active count should be > 0
- Completed count should be increasing
- Waiting count should be decreasing

**Escalation**: This is a SEV-1 incident if queue > 500 - escalate immediately

**Related Dashboards**: Job Processing

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md)


### MetricsScrapeFailure

**Alert Definition**: Prometheus cannot scrape metrics for 3 minutes

**Severity**: Warning

**What It Means**: 
Monitoring is blind - cannot collect metrics from services. May indicate service issues or monitoring problems.

**Immediate Actions**:

1. **Check Prometheus Targets**
   - Navigate to http://localhost:9090/targets
   - Identify which targets are down
   - Check error messages

2. **Check Service Health**
   ```bash
   # Check if service is running
   docker ps | grep backend
   
   # Check metrics endpoint directly
   curl http://localhost:3000/metrics
   ```

3. **Check Prometheus Logs**
   ```bash
   docker logs prometheus --tail 100
   ```

**Common Causes and Solutions**:

| Cause | Symptoms | Solution | Time |
|-------|----------|----------|------|
| Service down | Target shows "down" | Restart service | 2-3 min |
| Metrics endpoint error | 500 error on /metrics | Check service logs, restart | 5 min |
| Network issue | Connection timeout | Check Docker network | 5 min |
| Prometheus configuration error | All targets down | Check prometheus.yml | 10 min |
| Prometheus down | Cannot access Prometheus UI | Restart: `docker-compose restart prometheus` | 2 min |

**Restart Prometheus**:
```bash
# Restart Prometheus
docker-compose restart prometheus

# Wait for startup
sleep 10

# Check targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

**Fix Service Metrics**:
```bash
# If backend metrics endpoint failing
docker-compose restart backend

# Verify metrics endpoint
curl http://localhost:3000/metrics

# Should return Prometheus format metrics
```

**Verification**:
- All targets should show "up" in Prometheus
- Metrics should be flowing to Grafana
- Dashboards should update with new data

**Escalation**: If metrics don't resume, escalate to engineering team

**Related Dashboards**: All dashboards affected

**Related Runbooks**: [Incident Response](./INCIDENT_RESPONSE_RUNBOOK.md)


## Best Practices

### Daily Monitoring Routine

**Morning Health Check** (5 minutes):
1. Open Grafana System Overview dashboard
2. Check for active alerts (should be 0)
3. Review error rate over last 24 hours (should be < 1%)
4. Check response times are within targets
5. Note any anomalies for investigation

**Weekly Review** (30 minutes):
1. Review all three dashboards
2. Check for gradual performance degradation
3. Review resource utilization trends
4. Identify capacity planning needs
5. Document any concerning patterns

**Monthly Analysis** (1-2 hours):
1. Analyze performance trends over month
2. Review all alerts that fired
3. Identify recurring issues
4. Plan infrastructure improvements
5. Update alert thresholds if needed

### Alert Response Best Practices

**When Alert Fires**:
1. **Acknowledge immediately** - Let team know you're investigating
2. **Check severity** - Critical = immediate, Warning = within 30 min
3. **Open relevant dashboard** - Get context before acting
4. **Document actions** - Record what you try and results
5. **Communicate status** - Update team every 15-30 minutes

**Investigation Approach**:
1. **Start broad** - System Overview dashboard first
2. **Narrow down** - Move to specific dashboards
3. **Check recent changes** - Deployments, config changes
4. **Review logs** - Look for error patterns
5. **Compare to baseline** - Is this normal for this time?

**Resolution Verification**:
1. **Confirm metrics normalized** - Check dashboards
2. **Run smoke tests** - Verify functionality
3. **Monitor for 15 minutes** - Ensure stable
4. **Document resolution** - What fixed it
5. **Create follow-up tasks** - Prevent recurrence


### Dashboard Interpretation Tips

**Identifying Trends**:
- **Gradual increase**: Potential memory leak or growing load
- **Sudden spike**: Traffic surge or deployment issue
- **Sawtooth pattern**: Normal for memory with GC
- **Flat line**: Possible data collection issue

**Correlating Metrics**:
- High error rate + high queue depth = worker issues
- Slow response time + high DB connections = database bottleneck
- High memory + high event loop lag = resource exhaustion
- High queue depth + low processing rate = worker capacity issue

**Time Range Selection**:
- **Last 1 hour**: Real-time monitoring, incident response
- **Last 6 hours**: Identifying recent trends
- **Last 24 hours**: Daily patterns, comparing to yesterday
- **Last 7 days**: Weekly patterns, capacity planning

**Using Annotations**:
- Mark deployments on dashboards
- Note when scaling actions taken
- Document incident start/end times
- Track configuration changes

### Alert Tuning

**When to Adjust Thresholds**:
- Frequent false positives (alert fires but no real issue)
- Alert fires too late (issue already impacting users)
- Baseline performance changed (after optimization)
- Seasonal traffic patterns (exam periods)

**How to Adjust**:
1. Document current threshold and why changing
2. Edit `monitoring/prometheus/alerts/alerting-rules.yml`
3. Test new threshold in staging
4. Deploy to production
5. Monitor for 1 week
6. Document new baseline

**Example Threshold Adjustment**:
```yaml
# Before: Too sensitive
- alert: HighQueueDepth
  expr: queue_jobs_waiting > 200
  for: 5m

# After: More appropriate for traffic patterns
- alert: HighQueueDepth
  expr: queue_jobs_waiting > 500
  for: 5m
```


### Capacity Planning

**Using Metrics for Planning**:

**CPU Utilization**:
- Monitor average and peak CPU usage
- Plan to scale when average > 60%
- Peak should not exceed 80% for extended periods

**Memory Utilization**:
- Monitor heap usage trends
- Plan to increase limits when average > 70%
- Watch for gradual increases (memory leaks)

**Database Connections**:
- Monitor connection pool usage
- Plan to scale backend when average > 60%
- Consider increasing pool size if consistently high

**Queue Depth**:
- Monitor queue depth patterns
- Identify peak hours and traffic patterns
- Scale workers proactively before peaks

**Growth Projections**:
```
Current Baseline (100 concurrent users):
- Backend: 2 instances, 30% CPU, 50% memory
- PDF Workers: 3 instances, 40% CPU, 60% memory
- Database: 20 connections average

Projected for 500 concurrent users:
- Backend: 6-8 instances
- PDF Workers: 10-15 instances
- Database: Increase pool to 100 connections

Projected for 1000 concurrent users:
- Backend: 12-15 instances
- PDF Workers: 20-30 instances
- Database: Increase pool to 150 connections
- Consider database read replicas
```

### Troubleshooting Monitoring Issues

**Dashboards Not Updating**:
1. Check Prometheus is scraping: http://localhost:9090/targets
2. Check Grafana datasource: Configuration → Data Sources
3. Test Prometheus query in Grafana Explore
4. Check time range is not in future
5. Verify auto-refresh is enabled

**Missing Metrics**:
1. Check service is exposing /metrics endpoint
2. Verify Prometheus scrape configuration
3. Check for metric name changes in code
4. Review Prometheus logs for scrape errors

**Alerts Not Firing**:
1. Check alert rules in Prometheus: http://localhost:9090/alerts
2. Verify alert expression is correct
3. Check evaluation interval in prometheus.yml
4. Test alert query manually in Prometheus
5. Check alert duration (for) is appropriate

**High Cardinality Issues**:
- Too many unique label combinations
- Causes high memory usage in Prometheus
- Solution: Reduce label cardinality, use recording rules


## Quick Reference

### Critical Commands

```bash
# Health Checks
curl http://localhost:3000/health              # Backend health
curl http://localhost:8000/health              # PDF Worker health
curl http://localhost:3000/metrics             # Backend metrics

# Service Management
docker-compose restart backend                 # Restart backend
docker-compose restart pdf-worker              # Restart workers
docker-compose up -d --scale pdf-worker=10     # Scale workers

# Monitoring
docker logs backend --tail 100                 # Backend logs
docker logs pdf-worker --tail 100              # Worker logs
docker stats --no-stream                       # Resource usage

# Queue Management
curl http://localhost:3000/api/jobs/metrics    # Queue metrics
docker exec redis redis-cli LLEN bull:pdf-processing:wait

# Database
docker exec -it postgres psql -U schedgen -d schedgen
# Then: SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';

# Emergency
./scripts/rollback.sh                          # Rollback deployment
./scripts/verify-deployment.sh --quick                        # Run smoke tests
```

### Dashboard URLs

**Development**:
- Grafana: http://localhost:3002
- Prometheus: http://localhost:9090
- Prometheus Targets: http://localhost:9090/targets
- Prometheus Alerts: http://localhost:9090/alerts

**Production**:
- Grafana: https://grafana.yourdomain.com
- Prometheus: https://prometheus.yourdomain.com

### Alert Severity Quick Reference

| Alert | Severity | Response Time | Action |
|-------|----------|---------------|--------|
| HighErrorRate | Critical | < 5 min | Check logs, rollback if needed |
| HighResponseTime | Critical | < 5 min | Scale services, check resources |
| HighQueueDepth | Critical | < 5 min | Scale workers immediately |
| BackendDown | Critical | < 5 min | Restart service, check dependencies |
| NoJobsProcessing | Critical | < 5 min | Restart workers, check Redis |
| HighDatabaseConnectionUsage | Warning | < 30 min | Scale backend, check queries |
| HighMemoryUsage | Warning | < 30 min | Restart service, investigate leak |
| HighEventLoopLag | Warning | < 30 min | Scale backend, optimize code |
| ElevatedQueueDepth | Warning | < 30 min | Monitor, scale proactively |
| SlowPDFProcessing | Warning | < 30 min | Scale workers, check resources |
| HighJobFailureRate | Warning | < 30 min | Check logs, fix errors |
| MetricsScrapeFailure | Warning | < 30 min | Check service, restart Prometheus |


### Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate | < 1% | > 3% | > 5% |
| Response Time (P95) | < 2s | > 5s | > 10s |
| Queue Depth | < 100 | > 200 | > 500 |
| DB Connection Usage | < 60% | > 70% | > 80% |
| Memory Usage | < 70% | > 75% | > 80% |
| Event Loop Lag | < 100ms | > 500ms | > 1s |
| PDF Processing (P95) | < 60s | > 90s | > 120s |
| Job Success Rate | > 95% | < 93% | < 90% |

### Escalation Contacts

```
On-Call Engineer: [PagerDuty rotation]
Engineering Lead: [Contact info]
System Administrator: [Contact info]
Product Owner: [Contact info]

Escalation Triggers:
- SEV-1: Immediate escalation to all
- SEV-2: Escalate if not resolved in 30 minutes
- SEV-3: Escalate if not resolved in 2 hours
- Multiple alerts: Escalate immediately
```

### Common Metric Queries

**Error Rate**:
```promql
sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_request_duration_seconds_count[5m]))
```

**P95 Response Time**:
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

**Queue Depth**:
```promql
queue_jobs_waiting{queue="pdf-processing"}
```

**Database Connections**:
```promql
database_connections{state="active"}
```

**Memory Usage Percentage**:
```promql
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes
```


## Related Documentation

### Production Operations
- [Incident Response Runbook](./INCIDENT_RESPONSE_RUNBOOK.md) - Detailed incident response procedures
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Deployment procedures and verification
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md) - Rollback procedures for failed deployments
- [Scaling Runbook](./SCALING_RUNBOOK.md) - Scaling procedures for services
- [Backup Runbook](./BACKUP_RUNBOOK.md) - Backup and restore procedures

### Monitoring Setup
- [Monitoring README](../../monitoring/README.md) - Monitoring stack overview and setup
- [Alerting Rules Summary](../../monitoring/ALERTING_RULES_SUMMARY.md) - Alert rule definitions
- [Monitoring Implementation](../../monitoring/IMPLEMENTATION_SUMMARY.md) - Implementation details

### Production Readiness
- [Production Readiness Plan](./PRODUCTION_READINESS_PLAN.md) - Overall production readiness strategy
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Implementation details

### External Resources
- [Prometheus Documentation](https://prometheus.io/docs/) - Official Prometheus docs
- [Grafana Documentation](https://grafana.com/docs/) - Official Grafana docs
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/) - Query language reference
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/best-practices/) - Dashboard best practices

---

## Document Information

**Document Version**: 1.0  
**Last Updated**: 2024-11-30  
**Owner**: Engineering Team  
**Review Cycle**: Quarterly or after major incidents

**Change Log**:
- 2024-11-30: Initial version created
- Covers all 12 alert types with detailed troubleshooting
- Includes comprehensive dashboard usage guide
- Provides best practices and quick reference

**Feedback**: 
For questions, corrections, or suggestions, contact the engineering team or create an issue in the project repository.

---

**Next Steps**:
1. Familiarize yourself with all three Grafana dashboards
2. Review alert definitions in Prometheus
3. Practice using dashboards during normal operations
4. Conduct alert response drills
5. Update this guide based on real incident experiences

