# Production Readiness Quick Start

**Goal**: Get the UP Schedule Generator production-ready in 6 weeks  
**Current Status**: ⚠️ Partially Ready (100-500 users)  
**Target Status**: ✅ Production Ready (1000-10,000 users)

---

## 🚀 Quick Overview

```
Week 1-2: Critical Fixes        → System stable for 500-1000 users
Week 3-4: Monitoring            → Full observability
Week 5-6: Testing & Deployment  → Production ready
```

---

## 📊 Current State

| Component | Status | Action Needed |
|-----------|--------|---------------|
| PDF Worker | 🔴 Limited | Scale to 3-5 instances |
| Job Queue | 🔴 Basic | Add timeouts, retries, limits |
| Database | 🟡 Default | Configure connection pool |
| Redis | 🟡 Basic | Add memory limits, caching |
| Rate Limiting | 🟡 Global | Add per-user limits |
| Monitoring | 🔴 Missing | Add metrics, alerts |
| Load Testing | 🔴 None | Create test suite |

---

## 🎯 6-Week Plan

### Week 1: Infrastructure Fixes
**Goal**: Handle 500 concurrent users

```bash
# Day 1-2: PDF Worker Scaling
- Scale to 3 instances
- Add resource limits (2 CPU, 2GB RAM)
- Add 60s timeout protection

# Day 3-4: Job Queue
- Configure retry strategy (3 attempts)
- Add 5-minute job timeout
- Limit to 10 jobs/second

# Day 5: Database
- Set connection pool to 50
- Add 30s connection timeout
- Add 10s query timeout
```

**Verification**:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale pdf-worker=3
curl http://localhost:3001/api/jobs/metrics
```

---

### Week 2: Redis & Rate Limiting
**Goal**: Optimize caching and prevent abuse

```bash
# Day 6-7: Redis
- Set maxmemory to 2GB
- Enable AOF persistence
- Add caching layer

# Day 8-9: Rate Limiting
- 10 uploads/hour per user
- 100 status checks/minute
- Return 429 with headers

# Day 10: Integration Testing
- Test all fixes together
- Verify health checks
- Document issues
```

**Verification**:
```bash
docker exec schedgen-redis redis-cli INFO memory
for i in {1..15}; do curl -i http://localhost:3001/api/upload; done
```

---

### Week 3: Monitoring Setup
**Goal**: Full observability

```bash
# Day 11-12: Prometheus
- Install metrics collection
- Add custom metrics
- Expose /metrics endpoint

# Day 13-14: Health Checks
- Enhance health endpoints
- Add dependency checks
- Structured logging

# Day 15: Dashboard
- Set up Grafana (optional)
- Create performance dashboard
- Configure alerts
```

**Verification**:
```bash
curl http://localhost:3001/metrics
curl http://localhost:3001/health
```

---

### Week 4: Load Testing Prep
**Goal**: Create test suite

```bash
# Day 16-17: K6 Setup
- Install K6
- Create test fixtures
- Set up test environment

# Day 18-19: Test Scenarios
- Baseline test (10 users)
- Upload test (100 users)
- Stress test (1000 users)
- Spike test
- Soak test (2 hours)

# Day 20: Test Infrastructure
- Set up monitoring
- Create result templates
- Document procedures
```

---

### Week 5: Load Testing
**Goal**: Validate performance

```bash
# Day 21: Baseline
k6 run load-tests/baseline.js
# Expected: p95 < 2s, error rate < 1%

# Day 22-23: Upload Tests
k6 run load-tests/upload.js
# Expected: p95 < 5s, completion rate > 95%

# Day 24: Stress Test
k6 run load-tests/stress.js
# Find breaking point

# Day 25: Spike & Soak
k6 run load-tests/spike.js
k6 run load-tests/soak.js
# Check stability
```

---

### Week 6: Production Deployment
**Goal**: Deploy with confidence

```bash
# Day 26-27: Analysis
- Compile test results
- Create performance report
- Document capacity limits

# Day 28: Production Config
- Review environment variables
- Configure resource limits
- Set up backups

# Day 29: Documentation
- Update deployment guide
- Create runbook
- Write incident response plan

# Day 30: Deploy
- Backup current state
- Run deployment
- Monitor for 24 hours
```

---

## 💰 Cost Estimates

### Small Scale (100-500 users)
```
Server: 2 CPU, 4GB RAM, 50GB SSD
Cost: $75-130/month
Status: ✅ Current capability
```

### Medium Scale (500-2000 users) - **RECOMMENDED**
```
Server: 4 CPU, 16GB RAM, 200GB SSD
Cost: $320-600/month
Status: ⚠️ Requires Week 1-2 fixes
```

### Large Scale (2000-10000 users)
```
Cluster: Multi-server with auto-scaling
Cost: $1600-4100/month
Status: 🔴 Requires all 6 weeks
```

---

## ✅ Success Criteria

### Performance Targets
- ✅ 1000 concurrent users supported
- ✅ Upload p95 response time < 5s
- ✅ Status check p95 < 1s
- ✅ Job completion rate > 95%
- ✅ Error rate < 2%
- ✅ Uptime > 99.5%

### Operational Targets
- ✅ Zero-downtime deployment
- ✅ Automated backups working
- ✅ Monitoring and alerts active
- ✅ Team trained on operations
- ✅ Incident response plan ready

---

## 🚨 Critical Priorities

### Must Have (Week 1-2)
1. **PDF Worker Scaling** - System fails without this
2. **Job Queue Config** - Prevents queue overflow
3. **Database Pool** - Prevents connection exhaustion
4. **Redis Config** - Prevents memory issues
5. **Rate Limiting** - Prevents abuse

### Should Have (Week 3-4)
6. **Monitoring** - Detect issues early
7. **Health Checks** - Automated verification
8. **Logging** - Troubleshooting capability

### Nice to Have (Week 5-6)
9. **Load Testing** - Validate performance
10. **Documentation** - Operational knowledge
11. **Dashboards** - Visual monitoring

---

## 📋 Quick Commands

### Check System Status
```bash
# All services running?
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Health checks passing?
curl https://api.yourdomain.com/health

# Queue metrics
curl http://localhost:3001/api/jobs/metrics

# Resource usage
docker stats --no-stream
```

### Deploy Updates
```bash
# Automated deployment
./scripts/deploy.sh

# Manual deployment
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend npm run migration:run
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Run Load Tests
```bash
# Install K6
brew install k6  # macOS
# or see https://k6.io/docs/getting-started/installation/

# Run tests
k6 run load-tests/baseline.js
k6 run load-tests/upload.js
k6 run load-tests/stress.js
```

### Monitor System
```bash
# Watch metrics
watch -n 1 'curl -s http://localhost:3001/api/jobs/metrics | jq'

# Watch resources
docker stats

# Watch logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

---

## 📚 Documentation

### Essential Reading
1. [Production Readiness Plan](./PRODUCTION_READINESS_PLAN.md) - Complete 6-week plan
2. [Production Checklist](./PRODUCTION_CHECKLIST.md) - Track your progress
3. [Scalability Assessment](./SCALABILITY_ASSESSMENT.md) - Understand the gaps

### Implementation Guides
4. [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Step-by-step instructions
5. [Load Testing Guide](./LOAD_TESTING.md) - Testing procedures
6. [Deployment Guide](../../DEPLOYMENT.md) - Deployment instructions

---

## 🆘 Getting Help

### Common Issues

**Services won't start**:
```bash
docker compose logs
docker compose config  # Check configuration
```

**High error rate**:
```bash
docker logs schedgen-backend
docker logs schedgen-pdf-worker
docker stats  # Check resources
```

**Slow performance**:
```bash
curl http://localhost:3001/api/jobs/metrics  # Check queue
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity"  # Check DB
```

### Support Resources
- Check logs: `docker compose logs -f`
- Review documentation in `docs/production/`
- Check GitHub issues
- Contact DevOps team

---

## 🎯 Next Steps

1. **Read** [Production Readiness Plan](./PRODUCTION_READINESS_PLAN.md)
2. **Review** [Production Checklist](./PRODUCTION_CHECKLIST.md)
3. **Start** Week 1 implementation
4. **Track** progress weekly
5. **Deploy** after Week 6

---

**Ready to start?** → [Production Readiness Plan](./PRODUCTION_READINESS_PLAN.md)

**Need details?** → [Implementation Guide](./IMPLEMENTATION_GUIDE.md)

**Want to test?** → [Load Testing Guide](./LOAD_TESTING.md)

---

**Last Updated**: 2024-11-30  
**Maintained By**: DevOps Team
