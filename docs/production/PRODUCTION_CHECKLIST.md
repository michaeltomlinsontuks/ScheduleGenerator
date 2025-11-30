# Production Readiness Checklist

**Quick Reference**: Use this checklist to track production readiness progress.

## Phase 1: Critical Fixes (Weeks 1-2)

### PDF Worker Scaling
- [ ] Update `docker-compose.prod.yml` with scaling configuration
- [ ] Add resource limits (2 CPU, 2GB RAM per worker)
- [ ] Implement 60-second timeout protection
- [ ] Add health checks to PDF worker
- [ ] Test with 3 worker instances
- [ ] Verify load balancing works

### Job Queue Configuration
- [ ] Configure BullMQ retry strategy (3 attempts, exponential backoff)
- [ ] Add 5-minute job timeout
- [ ] Implement rate limiting (10 jobs/second)
- [ ] Add job priority support
- [ ] Create `/api/jobs/metrics` endpoint
- [ ] Test queue under load

### Database Connection Pool
- [ ] Configure TypeORM pool size (50-100 connections)
- [ ] Add 30-second connection timeout
- [ ] Add 10-second query timeout
- [ ] Implement connection leak detection
- [ ] Add database health check endpoint
- [ ] Test under concurrent load

### Redis Configuration
- [ ] Set maxmemory to 2GB
- [ ] Configure allkeys-lru eviction policy
- [ ] Enable AOF persistence
- [ ] Implement caching for job status
- [ ] Add Redis health monitoring
- [ ] Test cache hit rates

### Rate Limiting
- [ ] Install @nestjs/throttler
- [ ] Configure global limits (100 req/min)
- [ ] Add upload limits (10/hour per user)
- [ ] Implement rate limit headers
- [ ] Add rate limit monitoring
- [ ] Test rate limit enforcement

## Phase 2: Monitoring & Optimization (Weeks 3-4)

### Prometheus Metrics
- [ ] Install @willsoto/nestjs-prometheus
- [ ] Configure Prometheus module
- [ ] Add custom metrics (jobs, durations)
- [ ] Expose `/metrics` endpoint
- [ ] Test metrics collection
- [ ] Document available metrics

### Health Checks
- [ ] Enhance health check endpoints
- [ ] Add database health check
- [ ] Add Redis health check
- [ ] Add MinIO health check
- [ ] Add PDF worker health check
- [ ] Test health check reliability

### Logging & Monitoring
- [ ] Implement structured logging
- [ ] Add request ID tracking
- [ ] Configure log levels
- [ ] Set up log aggregation (optional)
- [ ] Create monitoring dashboard (optional)
- [ ] Configure alerts

## Phase 3: Load Testing (Weeks 5-6)

### Test Setup
- [ ] Install K6 load testing tool
- [ ] Create `load-tests/` directory
- [ ] Generate test PDF fixtures
- [ ] Set up test environment
- [ ] Document test procedures

### Test Scenarios
- [ ] Write baseline test (10 users, 5 min)
- [ ] Write upload test (ramp to 100 users)
- [ ] Write stress test (find breaking point)
- [ ] Write spike test (sudden traffic)
- [ ] Write soak test (2 hours stability)

### Test Execution
- [ ] Run baseline test - document results
- [ ] Run upload test - document results
- [ ] Run stress test - find limits
- [ ] Run spike test - test recovery
- [ ] Run soak test - check for leaks
- [ ] Create performance report

## Phase 4: Production Deployment (Week 6)

### Pre-Deployment
- [ ] Review all environment variables
- [ ] Configure production resource limits
- [ ] **Set up automated backups** (see [Backup Automation](./BACKUP_AUTOMATION.md))
  - [ ] Choose deployment method (Docker/systemd/cron)
  - [ ] Configure backup schedule (default: daily at 2 AM)
  - [ ] Set up alert notifications (webhook/email)
  - [ ] Test backup script manually
  - [ ] Verify backup files created
  - [ ] Test restore procedure
- [ ] Configure monitoring alerts
- [ ] Review security settings
- [ ] Create deployment checklist

### Documentation
- [ ] Update deployment guide
- [ ] Create operations runbook
- [ ] Document incident response
- [ ] Create troubleshooting guide
- [ ] Write post-launch checklist
- [ ] Team training materials

### Deployment
- [ ] Backup current production (if exists)
- [ ] Run deployment script
- [ ] Verify all health checks pass
- [ ] Test critical user flows
- [ ] Monitor for 24 hours
- [ ] Document any issues

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor metrics dashboard continuously
- [ ] Check error logs every 2 hours
- [ ] Verify resource usage normal
- [ ] **Confirm backups running** (check `backups/` directory)
- [ ] Test critical flows
- [ ] Collect user feedback

### First Week
- [ ] Daily metrics review
- [ ] Daily error rate check
- [ ] Daily resource monitoring
- [ ] **Verify daily backups** (check backup logs and file sizes)
- [ ] Address user issues
- [ ] Performance tuning

### First Month
- [ ] Weekly performance review
- [ ] Weekly cost analysis
- [ ] Weekly security audit
- [ ] Update documentation
- [ ] Team retrospective
- [ ] Capacity planning

## Infrastructure Checklist

### Server Requirements
- [ ] Ubuntu 22.04 LTS or later
- [ ] 4 CPU cores minimum
- [ ] 16GB RAM minimum
- [ ] 200GB SSD minimum
- [ ] Static IP or domain configured

### Software Requirements
- [ ] Docker 24.0+ installed
- [ ] Docker Compose v2.20+ installed
- [ ] Git installed
- [ ] UFW firewall configured
- [ ] Fail2ban installed (optional)

### Network Configuration
- [ ] Domain registered
- [ ] DNS A records configured
- [ ] DNS propagation verified
- [ ] Firewall rules configured (22, 80, 443)
- [ ] SSL/TLS certificates ready (auto via Traefik)

### Security Configuration
- [ ] SSH key-based auth enabled
- [ ] Root login disabled
- [ ] Strong passwords generated
- [ ] Secrets in environment variables
- [ ] Security updates enabled
- [ ] Backup encryption configured

## Service Configuration

### Frontend
- [ ] Environment variables set
- [ ] Build optimization enabled
- [ ] Resource limits configured
- [ ] Health check working
- [ ] Logs structured

### Backend
- [ ] Environment variables set
- [ ] Database connection configured
- [ ] Redis connection configured
- [ ] OAuth credentials set
- [ ] Resource limits configured
- [ ] Health check working

### PDF Worker
- [ ] Environment variables set
- [ ] Resource limits configured
- [ ] Timeout protection enabled
- [ ] Health check working
- [ ] Scaling tested

### PostgreSQL
- [ ] Password set
- [ ] Connection pool configured
- [ ] Backup strategy implemented
- [ ] Health check working
- [ ] Indexes optimized

### Redis
- [ ] Memory limit set
- [ ] Eviction policy configured
- [ ] Persistence enabled
- [ ] Health check working
- [ ] Monitoring enabled

### MinIO
- [ ] Access keys set
- [ ] Bucket created
- [ ] Permissions configured
- [ ] Health check working
- [ ] Backup strategy implemented

### Traefik
- [ ] Domain configured
- [ ] ACME email set
- [ ] TLS enabled
- [ ] Dashboard secured
- [ ] Rate limiting configured

## Testing Checklist

### Unit Tests
- [ ] Backend unit tests passing
- [ ] Frontend unit tests passing
- [ ] PDF worker tests passing
- [ ] Coverage > 70%

### Integration Tests
- [ ] API integration tests passing
- [ ] Database integration tests passing
- [ ] Storage integration tests passing
- [ ] OAuth flow tested

### E2E Tests
- [ ] Upload flow tested
- [ ] Processing flow tested
- [ ] Calendar generation tested
- [ ] Google sync tested

### Load Tests
- [ ] Baseline test passed
- [ ] Upload test passed
- [ ] Stress test completed
- [ ] Spike test passed
- [ ] Soak test passed

## Monitoring Checklist

### Application Metrics
- [ ] Request rate tracked
- [ ] Response time tracked (p50, p95, p99)
- [ ] Error rate tracked
- [ ] Job queue length tracked
- [ ] Job processing time tracked
- [ ] Active users tracked

### Infrastructure Metrics
- [ ] CPU usage monitored
- [ ] Memory usage monitored
- [ ] Disk usage monitored
- [ ] Network I/O monitored
- [ ] Container health monitored

### Business Metrics
- [ ] Uploads per hour tracked
- [ ] Processing success rate tracked
- [ ] User retention tracked
- [ ] Storage usage tracked
- [ ] Cost per user tracked

## Backup & Recovery

### Backup Strategy
- [ ] Daily database backups configured
- [ ] 7-day retention policy set
- [ ] Backup verification automated
- [ ] Volume backups configured
- [ ] Backup monitoring enabled
- [ ] Backup alerts configured

### Recovery Procedures
- [ ] Database restore tested
- [ ] Volume restore tested
- [ ] Disaster recovery plan documented
- [ ] Recovery time objective defined (< 1 hour)
- [ ] Recovery point objective defined (< 24 hours)
- [ ] Team trained on recovery

## Documentation Checklist

### Technical Documentation
- [ ] Architecture overview complete
- [ ] API documentation current
- [ ] Database schema documented
- [ ] Component documentation complete
- [ ] Configuration guide complete

### Operational Documentation
- [ ] Deployment guide complete
- [ ] Operations runbook created
- [ ] Incident response plan documented
- [ ] Troubleshooting guide complete
- [ ] Monitoring guide complete

### User Documentation
- [ ] Getting started guide complete
- [ ] User guide complete
- [ ] FAQ complete
- [ ] Troubleshooting for users complete

## Team Readiness

### Training
- [ ] Team trained on architecture
- [ ] Team trained on deployment
- [ ] Team trained on monitoring
- [ ] Team trained on incident response
- [ ] Team trained on troubleshooting

### Processes
- [ ] On-call rotation established
- [ ] Escalation procedures defined
- [ ] Communication channels set up
- [ ] Incident response tested
- [ ] Post-mortem process defined

## Sign-off

### Technical Approval
- [ ] Backend lead approval
- [ ] Frontend lead approval
- [ ] DevOps lead approval
- [ ] QA lead approval

### Business Approval
- [ ] Product owner approval
- [ ] Project manager approval
- [ ] Security team approval
- [ ] Budget approval

---

## Quick Status Check

Run these commands to verify production readiness:

```bash
# Check all services are running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check health endpoints
curl https://api.yourdomain.com/health
curl https://yourdomain.com

# Check metrics
curl http://localhost:3001/metrics

# Check queue status
curl http://localhost:3001/api/jobs/metrics

# Check database connections
docker exec schedgen-postgres psql -U schedgen -d schedgen -c "SELECT count(*) FROM pg_stat_activity"

# Check Redis memory
docker exec schedgen-redis redis-cli INFO memory

# Check resource usage
docker stats --no-stream
```

---

**Last Updated**: 2024-11-30  
**Maintained By**: DevOps Team
