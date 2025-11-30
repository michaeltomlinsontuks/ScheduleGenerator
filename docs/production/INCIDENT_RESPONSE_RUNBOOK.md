# Incident Response Runbook

Comprehensive guide for responding to production incidents in the UP Schedule Generator system.

## Table of Contents

- [Incident Severity Levels](#incident-severity-levels)
- [Escalation Procedures](#escalation-procedures)
- [Common Incidents and Resolutions](#common-incidents-and-resolutions)
- [Communication Templates](#communication-templates)
- [Post-Incident Procedures](#post-incident-procedures)

## Incident Severity Levels

### SEV-1: Critical (P1)

**Definition**: Complete service outage or critical functionality unavailable affecting all users.

**Examples**:
- Entire application is down (all services unreachable)
- Database is completely unavailable
- Data loss or corruption affecting multiple users
- Security breach or data exposure

**Response Time**: Immediate (< 5 minutes)

**Response Team**: 
- On-call engineer (primary responder)
- Engineering lead
- Product owner
- System administrator

**Communication**: 
- Immediate notification to all stakeholders
- Status updates every 15 minutes
- Public status page update

**Resolution Target**: < 1 hour

---

### SEV-2: High (P2)

**Definition**: Major functionality degraded or unavailable affecting significant portion of users.

**Examples**:
- PDF processing completely failing (all uploads fail)
- Authentication system down
- Severe performance degradation (p95 > 30s)
- Single critical service down with no redundancy

**Response Time**: < 15 minutes

**Response Team**:
- On-call engineer (primary responder)
- Engineering lead (if not resolved in 30 minutes)

**Communication**:
- Notification to engineering team and product owner
- Status updates every 30 minutes
- Internal status update

**Resolution Target**: < 4 hours

---

### SEV-3: Medium (P3)

**Definition**: Partial functionality degraded or minor features unavailable affecting some users.

**Examples**:
- Intermittent PDF processing failures (< 20% error rate)
- Slow response times (p95 > 10s but < 30s)
- Non-critical service degradation
- Queue depth consistently high (> 500 jobs)

**Response Time**: < 1 hour

**Response Team**:
- On-call engineer

**Communication**:
- Notification to engineering team
- Status updates every 2 hours if ongoing

**Resolution Target**: < 24 hours

---

### SEV-4: Low (P4)

**Definition**: Minor issues with minimal user impact or cosmetic problems.

**Examples**:
- Minor UI glitches
- Non-critical logging errors
- Performance slightly below targets
- Documentation issues

**Response Time**: Next business day

**Response Team**:
- Assigned engineer during normal hours

**Communication**:
- Ticket created in issue tracker
- No immediate notifications required

**Resolution Target**: < 1 week

---

## Escalation Procedures

### Initial Response (0-5 minutes)

1. **Acknowledge the Alert**
   - Respond to PagerDuty/alert system
   - Post in #incidents Slack channel: "Investigating [brief description]"

2. **Assess Severity**
   - Check monitoring dashboards (Grafana)
   - Review error rates and affected users
   - Determine severity level (SEV-1 through SEV-4)

3. **Create Incident**
   - Create incident ticket with severity level
   - Document initial observations
   - Start incident timeline

### Escalation Triggers

**Escalate to Engineering Lead if**:
- SEV-1 incident declared
- SEV-2 incident not resolved within 30 minutes
- Root cause unclear after 15 minutes of investigation
- Multiple services affected
- Requires architectural decision

**Escalate to Product Owner if**:
- SEV-1 incident (immediate notification)
- Incident will impact SLA commitments
- User communication required
- Business decision needed

**Escalate to System Administrator if**:
- Infrastructure issues (servers, networking)
- Database issues requiring DBA expertise
- Security concerns
- Backup/restore operations needed

### Escalation Communication Template

```
ESCALATION REQUIRED

Incident ID: INC-YYYY-MM-DD-NNN
Severity: SEV-X
Duration: XX minutes
Status: [Investigating/Identified/Mitigating]

Issue: [Brief description]
Impact: [Number of users/services affected]
Actions Taken: [What has been tried]
Reason for Escalation: [Why escalating]

Current Responder: [Name]
Requesting: [Who you need]
```

---

## Common Incidents and Resolutions

### 1. High Error Rate (> 5%)

**Alert**: `HighErrorRate` - Error rate exceeds 5% for 5 minutes

**Symptoms**:
- Grafana dashboard shows error rate spike
- Users reporting failures
- Increased 5xx responses

**Investigation Steps**:

1. **Check Service Health**
   ```bash
   # Check all service health endpoints
   curl http://localhost:3000/health
   curl http://localhost:8000/health
   curl http://localhost:8001/health
   ```

2. **Review Recent Changes**
   - Check deployment history: `docker ps -a`
   - Review recent commits: `git log --oneline -10`
   - Check if deployment in progress

3. **Check Logs**
   ```bash
   # Backend logs
   docker logs backend --tail 100
   
   # PDF Worker logs
   docker logs pdf-worker --tail 100
   
   # Look for error patterns
   docker logs backend 2>&1 | grep -i error | tail -20
   ```

4. **Check Resource Utilization**
   - Open Grafana Resource Utilization dashboard
   - Check CPU, memory, disk usage
   - Look for resource exhaustion

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| Recent bad deployment | Rollback using `scripts/rollback.sh` | 5-10 min |
| Database connection pool exhausted | Restart backend: `docker-compose restart backend` | 2-3 min |
| PDF Worker overloaded | Scale workers: `docker-compose up -d --scale pdf-worker=5` | 3-5 min |
| Redis out of memory | Clear cache: `docker exec redis redis-cli FLUSHDB` | 1 min |
| Disk full | Clean old files: `docker system prune -af` | 5 min |

**Resolution Verification**:
```bash
# Run smoke tests
./scripts/smoke-test.sh

# Check error rate in Grafana
# Should drop below 1% within 5 minutes
```

---

### 2. Slow Response Times (p95 > 10s)

**Alert**: `HighResponseTime` - p95 response time exceeds 10s for 5 minutes

**Symptoms**:
- Users reporting slow page loads
- Timeouts in browser
- Queue depth increasing

**Investigation Steps**:

1. **Check System Load**
   ```bash
   # Check container resource usage
   docker stats --no-stream
   
   # Check queue depth
   curl http://localhost:3000/api/jobs/metrics
   ```

2. **Identify Bottleneck**
   - Check Grafana Job Processing dashboard
   - Look at database query times
   - Check PDF Worker processing times
   - Review cache hit rates

3. **Check Database Performance**
   ```bash
   # Connect to database
   docker exec -it postgres psql -U schedgen -d schedgen
   
   # Check active queries
   SELECT pid, now() - query_start as duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' 
   ORDER BY duration DESC;
   
   # Check connection pool
   SELECT count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
   FROM pg_stat_activity
   WHERE datname = 'schedgen';
   ```

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| High queue depth (> 500) | Scale PDF workers: `docker-compose up -d --scale pdf-worker=10` | 3-5 min |
| Database slow queries | Kill long-running queries, add indexes | 5-10 min |
| Cache not working | Restart Redis: `docker-compose restart redis` | 2 min |
| Too many concurrent users | Scale backend: `docker-compose up -d --scale backend=3` | 3-5 min |
| Memory pressure | Restart services to clear memory leaks | 5 min |

**Resolution Verification**:
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Monitor queue depth
watch -n 5 'curl -s http://localhost:3000/api/jobs/metrics | jq .waiting'
```

---

### 3. High Resource Utilization (> 80%)

**Alert**: `HighResourceUtilization` - CPU or memory exceeds 80% for 10 minutes

**Symptoms**:
- Slow performance
- Services becoming unresponsive
- OOM (Out of Memory) errors

**Investigation Steps**:

1. **Identify Resource Hog**
   ```bash
   # Check all containers
   docker stats --no-stream
   
   # Check host resources
   top -b -n 1 | head -20
   df -h
   ```

2. **Check for Memory Leaks**
   ```bash
   # Check container memory over time
   docker stats pdf-worker --no-stream
   
   # Look for growing memory usage in Grafana
   ```

3. **Review Application Logs**
   ```bash
   # Look for memory warnings
   docker logs backend 2>&1 | grep -i "memory\|heap"
   ```

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| PDF Worker memory leak | Restart workers: `docker-compose restart pdf-worker` | 2-3 min |
| Too many concurrent jobs | Reduce concurrency in jobs.service.ts config | 5 min + deploy |
| Large PDF files | Check file sizes, enforce limits | Immediate |
| Disk full | Clean old files: `docker system prune -af --volumes` | 5-10 min |
| Redis memory full | Increase maxmemory or clear cache | 2 min |

**Resolution Verification**:
```bash
# Check resource usage dropped
docker stats --no-stream

# Verify services healthy
./scripts/smoke-test.sh
```

---

### 4. Queue Depth High (> 500 jobs)

**Alert**: `HighQueueDepth` - Queue has more than 500 waiting jobs

**Symptoms**:
- Long wait times for PDF processing
- Users reporting delays
- Queue metrics showing backlog

**Investigation Steps**:

1. **Check Queue Status**
   ```bash
   # Get queue metrics
   curl http://localhost:3000/api/jobs/metrics
   
   # Check Redis queue
   docker exec redis redis-cli LLEN bull:pdf-processing:wait
   ```

2. **Check Worker Health**
   ```bash
   # Check how many workers are running
   docker ps | grep pdf-worker
   
   # Check worker logs for errors
   docker logs pdf-worker --tail 50
   ```

3. **Check for Stalled Jobs**
   ```bash
   # Look for jobs stuck in processing
   docker exec redis redis-cli LLEN bull:pdf-processing:active
   ```

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| Not enough workers | Scale to 10 workers: `docker-compose up -d --scale pdf-worker=10` | 3-5 min |
| Workers crashing | Check logs, fix issue, restart workers | 10-20 min |
| Stalled jobs | Clear stalled jobs from Redis | 2 min |
| Sudden traffic spike | Enable rate limiting, scale workers | 5 min |
| Large/complex PDFs | Increase worker timeout, add more workers | 5 min |

**Resolution Verification**:
```bash
# Monitor queue draining
watch -n 10 'curl -s http://localhost:3000/api/jobs/metrics | jq "{waiting, active, completed}"'

# Should see waiting count decreasing
```

---

### 5. Database Connection Pool Exhausted

**Alert**: `DatabaseConnectionPoolExhausted` - All database connections in use

**Symptoms**:
- "Connection pool exhausted" errors in logs
- Requests timing out
- 500 errors on API endpoints

**Investigation Steps**:

1. **Check Connection Pool**
   ```bash
   # Connect to database
   docker exec -it postgres psql -U schedgen -d schedgen
   
   # Check connections
   SELECT count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
   FROM pg_stat_activity
   WHERE datname = 'schedgen';
   
   # Check for long-running transactions
   SELECT pid, now() - xact_start as duration, state, query
   FROM pg_stat_activity
   WHERE datname = 'schedgen' AND xact_start IS NOT NULL
   ORDER BY duration DESC;
   ```

2. **Check Backend Configuration**
   ```bash
   # Check TypeORM pool settings in logs
   docker logs backend 2>&1 | grep -i "pool\|connection"
   ```

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| Connection leak in code | Restart backend: `docker-compose restart backend` | 2 min |
| Too many concurrent requests | Scale backend instances | 3-5 min |
| Long-running queries | Kill queries: `SELECT pg_terminate_backend(pid)` | 1 min |
| Idle transactions | Kill idle transactions | 1 min |
| Pool size too small | Increase max pool size in config | 5 min + deploy |

**Resolution Verification**:
```bash
# Check connection count normalized
docker exec -it postgres psql -U schedgen -d schedgen -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"

# Should be well below max (50)
```

---

### 6. Service Completely Down

**Alert**: `ServiceDown` - Health check failing for 2 minutes

**Symptoms**:
- Service not responding to requests
- Health check returns error or timeout
- Container not running or restarting

**Investigation Steps**:

1. **Check Container Status**
   ```bash
   # List all containers
   docker ps -a
   
   # Check specific service
   docker ps -a | grep backend
   docker ps -a | grep pdf-worker
   docker ps -a | grep frontend
   ```

2. **Check Container Logs**
   ```bash
   # Get last 100 lines
   docker logs backend --tail 100
   
   # Follow logs in real-time
   docker logs -f backend
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

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| Container crashed | Restart: `docker-compose restart <service>` | 2 min |
| OOM killed | Increase memory limit, restart | 3 min |
| Dependency down | Restart dependency service | 2-5 min |
| Bad deployment | Rollback: `./scripts/rollback.sh` | 5-10 min |
| Port conflict | Check ports: `netstat -tulpn`, resolve conflict | 5 min |
| Configuration error | Fix config, redeploy | 10-15 min |

**Resolution Verification**:
```bash
# Check service is running
docker ps | grep <service>

# Check health endpoint
curl http://localhost:3000/health

# Run smoke tests
./scripts/smoke-test.sh
```

---

### 7. Authentication Failures

**Alert**: Multiple authentication failures or auth service degraded

**Symptoms**:
- Users cannot log in
- "Authentication failed" errors
- Google OAuth not working

**Investigation Steps**:

1. **Check Auth Service**
   ```bash
   # Check backend logs for auth errors
   docker logs backend 2>&1 | grep -i "auth\|oauth\|google"
   
   # Test auth endpoint
   curl http://localhost:3000/api/auth/google
   ```

2. **Check Session Store**
   ```bash
   # Check Redis is working
   docker exec redis redis-cli ping
   
   # Check session keys
   docker exec redis redis-cli KEYS "sess:*" | wc -l
   ```

3. **Check External Dependencies**
   ```bash
   # Test Google OAuth connectivity
   curl -I https://accounts.google.com
   ```

**Common Causes & Solutions**:

| Cause | Solution | Time |
|-------|----------|------|
| Redis down (sessions lost) | Restart Redis: `docker-compose restart redis` | 2 min |
| Google OAuth credentials invalid | Update credentials in .env, restart backend | 5 min |
| Session secret changed | Revert secret or clear sessions | 2 min |
| IP blocking triggered | Unblock IP: Use admin endpoint | 1 min |
| Rate limiting too aggressive | Adjust rate limits temporarily | 5 min |

**Resolution Verification**:
```bash
# Test login flow manually
# Open browser to http://localhost:3000
# Click "Sign in with Google"
# Verify successful login
```

---

## Communication Templates

### Initial Incident Notification

**Subject**: [SEV-X] Incident: [Brief Description]

```
INCIDENT NOTIFICATION

Incident ID: INC-YYYY-MM-DD-NNN
Severity: SEV-X
Status: Investigating
Started: YYYY-MM-DD HH:MM UTC

ISSUE:
[Clear description of the problem]

IMPACT:
- Affected Users: [All/Percentage/Specific feature users]
- Affected Services: [List services]
- User-Facing Impact: [What users are experiencing]

CURRENT STATUS:
[What we know so far]

ACTIONS TAKEN:
- [Action 1]
- [Action 2]

NEXT STEPS:
- [Next action]
- [ETA for next update]

INCIDENT COMMANDER: [Name]
RESPONDERS: [Names]

Next update in: [15/30/60 minutes]
```

### Status Update

**Subject**: [SEV-X] Update: [Brief Description]

```
INCIDENT UPDATE #N

Incident ID: INC-YYYY-MM-DD-NNN
Severity: SEV-X
Status: [Investigating/Identified/Mitigating/Resolved]
Duration: [X hours Y minutes]

PROGRESS:
[What has changed since last update]

CURRENT STATUS:
[Current state of the incident]

ACTIONS TAKEN:
- [Recent action 1]
- [Recent action 2]

NEXT STEPS:
- [Next action]
- [ETA]

ESTIMATED RESOLUTION: [Time or "Unknown"]

Next update in: [15/30/60 minutes]
```

### Resolution Notification

**Subject**: [RESOLVED] [SEV-X]: [Brief Description]

```
INCIDENT RESOLVED

Incident ID: INC-YYYY-MM-DD-NNN
Severity: SEV-X
Status: Resolved
Duration: [X hours Y minutes]
Resolved: YYYY-MM-DD HH:MM UTC

ISSUE:
[Description of what happened]

IMPACT:
- Affected Users: [Details]
- Duration: [How long users were affected]

ROOT CAUSE:
[What caused the incident]

RESOLUTION:
[How it was fixed]

ACTIONS TAKEN:
- [Action 1]
- [Action 2]
- [Action 3]

PREVENTION:
[What we're doing to prevent recurrence]

POST-INCIDENT REVIEW:
Scheduled for: [Date/Time]
Participants: [Names]

Thank you for your patience during this incident.
```

### Escalation Request

**Subject**: ESCALATION NEEDED: [SEV-X] [Brief Description]

```
ESCALATION REQUEST

Incident ID: INC-YYYY-MM-DD-NNN
Severity: SEV-X
Duration: [X minutes]
Current Responder: [Name]

SITUATION:
[What is happening]

IMPACT:
[Who/what is affected]

ACTIONS ATTEMPTED:
- [Action 1 - Result]
- [Action 2 - Result]
- [Action 3 - Result]

REASON FOR ESCALATION:
[Why escalating - unclear root cause, requires expertise, etc.]

REQUESTING:
[Who/what you need]

URGENCY:
[Why this needs immediate attention]

Current Status: [Investigating/Mitigating]
```

### User-Facing Status Page Update

```
🔴 [Service Name] - Major Outage

We are currently experiencing issues with [specific functionality].

Impact: [What users cannot do]
Started: [Time]
Status: Investigating

We are actively working to resolve this issue and will provide updates 
every [15/30] minutes.

Last updated: [Time]
```

---

## Post-Incident Procedures

### Immediate Post-Resolution (Within 1 hour)

1. **Verify Full Resolution**
   - Run complete smoke test suite
   - Check all monitoring dashboards
   - Verify error rates back to normal
   - Confirm user reports stopped

2. **Document Timeline**
   - Record all actions taken with timestamps
   - Note who was involved
   - Document what worked and what didn't

3. **Communicate Resolution**
   - Send resolution notification (use template above)
   - Update status page
   - Thank responders

### Post-Incident Review (Within 48 hours)

**Schedule PIR Meeting**:
- Incident Commander (facilitator)
- All responders
- Engineering lead
- Product owner (for SEV-1/SEV-2)

**PIR Agenda**:

1. **Timeline Review** (10 min)
   - Walk through incident timeline
   - Clarify any gaps or questions

2. **Root Cause Analysis** (15 min)
   - What was the root cause?
   - Why did it happen?
   - Why wasn't it caught earlier?

3. **Response Evaluation** (10 min)
   - What went well?
   - What could be improved?
   - Were escalations appropriate?
   - Was communication effective?

4. **Action Items** (15 min)
   - Immediate fixes needed
   - Long-term improvements
   - Monitoring/alerting gaps
   - Documentation updates
   - Assign owners and deadlines

5. **Follow-up** (5 min)
   - Schedule action item review
   - Document lessons learned

**PIR Document Template**:

```markdown
# Post-Incident Review: INC-YYYY-MM-DD-NNN

## Incident Summary
- **Date**: YYYY-MM-DD
- **Duration**: X hours Y minutes
- **Severity**: SEV-X
- **Services Affected**: [List]
- **Users Affected**: [Number/Percentage]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Alert triggered |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Incident resolved |

## Root Cause
[Detailed explanation of what caused the incident]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## What Went Well
- [Positive aspect 1]
- [Positive aspect 2]

## What Could Be Improved
- [Improvement area 1]
- [Improvement area 2]

## Action Items
| Action | Owner | Deadline | Priority |
|--------|-------|----------|----------|
| [Action 1] | [Name] | [Date] | High |
| [Action 2] | [Name] | [Date] | Medium |

## Lessons Learned
- [Lesson 1]
- [Lesson 2]

## Prevention Measures
- [Measure 1]
- [Measure 2]
```

### Follow-up Actions

1. **Implement Fixes** (Within 1 week)
   - Complete all high-priority action items
   - Deploy fixes to production
   - Verify fixes work as expected

2. **Update Documentation** (Within 1 week)
   - Update runbooks with new information
   - Add incident to common incidents section
   - Update monitoring/alerting if needed

3. **Share Learnings** (Within 2 weeks)
   - Share PIR with broader team
   - Update training materials
   - Conduct knowledge sharing session if needed

4. **Review Action Items** (2 weeks after incident)
   - Check all action items completed
   - Verify effectiveness of fixes
   - Close incident ticket

---

## Quick Reference

### Emergency Contacts

```
On-Call Engineer: [PagerDuty rotation]
Engineering Lead: [Contact info]
System Administrator: [Contact info]
Product Owner: [Contact info]
```

### Critical Commands

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:8000/health

# Quick restart
docker-compose restart backend
docker-compose restart pdf-worker

# Scale workers
docker-compose up -d --scale pdf-worker=10

# Rollback
./scripts/rollback.sh

# Check logs
docker logs backend --tail 100
docker logs pdf-worker --tail 100

# Database connections
docker exec -it postgres psql -U schedgen -d schedgen -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'schedgen';"

# Queue metrics
curl http://localhost:3000/api/jobs/metrics

# Smoke test
./scripts/smoke-test.sh
```

### Key Dashboards

- **System Overview**: http://localhost:3001/d/system-overview
- **Job Processing**: http://localhost:3001/d/job-processing
- **Resource Utilization**: http://localhost:3001/d/resource-utilization

### Key Metrics

- Error Rate: < 1% (Alert at 5%)
- Response Time p95: < 2s (Alert at 10s)
- Queue Depth: < 100 (Alert at 500)
- CPU Usage: < 80% (Alert at 80%)
- Memory Usage: < 80% (Alert at 80%)

---

## Related Documents

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Rollback Runbook](./ROLLBACK_RUNBOOK.md)
- [Backup Runbook](./BACKUP_RUNBOOK.md)
- [Monitoring Guide](../../monitoring/README.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-30  
**Owner**: Engineering Team  
**Review Cycle**: Quarterly or after major incidents
