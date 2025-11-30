# Performance Baseline Documentation

**Last Updated:** November 30, 2025  
**System Version:** Production Readiness Phase 3  
**Test Environment:** Local Docker Compose

## Overview

This document establishes the performance baseline for the UP Schedule Generator system. It defines target metrics, current capabilities, and scaling characteristics based on load testing results.

## Response Time Targets

### Health Check Endpoint
- **Target p50:** < 50ms
- **Target p95:** < 200ms
- **Target p99:** < 500ms
- **Current p95:** 1.63s ⚠️ (needs optimization)

### Upload Endpoint
- **Target p50:** < 1s
- **Target p95:** < 5s
- **Target p99:** < 10s
- **Current Status:** Not yet tested under load

### Status Check Endpoint
- **Target p50:** < 50ms
- **Target p95:** < 200ms
- **Target p99:** < 500ms
- **Current Status:** Not yet tested under load

### Job Processing
- **Target Average:** < 30s
- **Target p95:** < 60s
- **Current Status:** Not yet tested under load

## Throughput Targets

### Overall System
- **Target:** 1000 req/s sustained
- **Current:** ~235 req/s (before rate limiting)
- **Gap:** 4.25x under target

### Upload Operations
- **Target:** 50 uploads/min sustained
- **Current:** Limited by rate limiting (10/hour)
- **Gap:** 300x under target

### Status Checks
- **Target:** 500 req/s sustained
- **Current:** Not yet measured
- **Gap:** Unknown

## Error Rate Targets

### Production Targets
- **Overall Error Rate:** < 1%
- **Upload Error Rate:** < 5%
- **Status Check Error Rate:** < 1%
- **Timeout Rate:** < 2%

### Current Performance
- **Overall Error Rate:** 99% ✗ (rate limiting)
- **Upload Error Rate:** Not measured
- **Status Check Error Rate:** Not measured
- **Timeout Rate:** < 1% ✓

## Resource Utilization Patterns

### Current Configuration

#### Backend Service
- **CPU Limit:** 1 core
- **Memory Limit:** 1GB
- **Instances:** 1
- **Status:** Under-provisioned for target load

#### PDF Worker Service
- **CPU Limit:** 2 cores per worker
- **Memory Limit:** 2GB per worker
- **Instances:** Configured for horizontal scaling
- **Status:** Scaling not yet validated

#### Database (PostgreSQL)
- **Connection Pool:** 10-50 connections
- **CPU:** Shared with host
- **Memory:** Shared with host
- **Status:** Not yet stress tested

#### Cache/Queue (Redis)
- **Memory Limit:** 2GB
- **Eviction Policy:** LRU
- **Persistence:** AOF enabled
- **Status:** Not yet stress tested

### Resource Utilization Targets
- **CPU Utilization:** < 70% sustained
- **Memory Utilization:** < 80% sustained
- **Database Connections:** < 80% of pool
- **Redis Memory:** < 80% of limit
- **Disk I/O:** < 70% capacity

## Scaling Characteristics

### Horizontal Scaling

#### PDF Workers
- **Configuration:** Docker Compose replicas
- **Scaling Trigger:** Queue depth > 100 OR CPU > 70%
- **Scale-up Time:** < 30 seconds
- **Scale-down Time:** 5 minutes after load decrease
- **Max Replicas:** 10
- **Status:** ⚠️ Not yet validated

#### Backend Service
- **Configuration:** Single instance (needs multi-instance)
- **Scaling Trigger:** CPU > 70% OR response time > 2s
- **Status:** ✗ Not implemented

### Vertical Scaling Limits
- **Backend:** Can scale to 4 cores, 4GB RAM
- **PDF Worker:** Can scale to 4 cores, 4GB RAM per worker
- **Database:** Can scale to 8 cores, 16GB RAM
- **Redis:** Can scale to 4GB memory

## Concurrency Limits

### Current Limits (Stress Test Results)
- **Breaking Point:** ~100-200 concurrent users
- **Stable Load:** < 100 concurrent users
- **Peak Load:** 1000 users (99% error rate)

### Target Limits
- **Stable Load:** 500 concurrent users
- **Peak Load:** 1000 concurrent users (< 5% error rate)
- **Burst Capacity:** 2000 concurrent users (< 20% error rate)

## Rate Limiting Configuration

### Current Configuration (Too Restrictive)
- **Global Limit:** 100 req/min per IP
- **Upload Limit:** 10 uploads/hour per IP
- **Status Check Limit:** 100 checks/min per IP

### Recommended Configuration
- **Global Limit:** 1000 req/min per IP (burst: 2000)
- **Upload Limit:** 100 uploads/hour per IP (burst: 200)
- **Status Check Limit:** 500 checks/min per IP (burst: 1000)

### Rate Limit Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Performance Degradation Thresholds

### Warning Thresholds (Monitoring Alerts)
- Response time p95 > 2s
- Error rate > 2%
- CPU utilization > 70%
- Memory utilization > 75%
- Queue depth > 200

### Critical Thresholds (Immediate Action)
- Response time p95 > 5s
- Error rate > 5%
- CPU utilization > 85%
- Memory utilization > 90%
- Queue depth > 500

## Load Test Results Summary

### Baseline Test (10 concurrent users)
- **Status:** ✓ Passed
- **p95 Response Time:** < 200ms
- **Error Rate:** < 1%
- **Throughput:** Adequate for light load

### Stress Test (Ramp to 1000 users)
- **Status:** ✗ Failed
- **Breaking Point:** ~100-200 users
- **Error Rate:** 99% (rate limiting)
- **Primary Issue:** Rate limiting too aggressive

### Spike Test (Sudden 500 users)
- **Status:** Not yet run
- **Target:** < 10% error rate during spike

### Soak Test (100 users for 2 hours)
- **Status:** Not yet run
- **Target:** No memory leaks, stable performance

## Known Performance Issues

### Critical (P0)
1. **Rate Limiting Too Aggressive**
   - Current: 100 req/min
   - Needed: 1000 req/min
   - Impact: 99% error rate under load

2. **No Request Queuing**
   - Requests rejected immediately
   - No graceful degradation
   - Impact: Poor user experience under load

### High Priority (P1)
3. **Horizontal Scaling Not Validated**
   - PDF workers may not be scaling
   - Backend is single instance
   - Impact: Cannot handle target load

4. **No Circuit Breakers**
   - Cascade failures possible
   - No graceful degradation
   - Impact: System instability under load

### Medium Priority (P2)
5. **Database Connection Pool**
   - Not yet stress tested
   - May be bottleneck
   - Impact: Unknown

6. **Cache Hit Rate**
   - Not yet measured
   - May be inefficient
   - Impact: Higher database load

## Performance Optimization Roadmap

### Phase 1: Fix Critical Issues (Week 1)
- [ ] Adjust rate limiting configuration
- [ ] Implement request queuing with BullMQ
- [ ] Validate horizontal scaling works
- [ ] Re-run stress test

### Phase 2: Improve Resilience (Week 2)
- [ ] Implement circuit breakers
- [ ] Add auto-scaling triggers
- [ ] Optimize database queries
- [ ] Run spike test

### Phase 3: Long-term Optimization (Week 3-4)
- [ ] Implement CDN/edge caching
- [ ] Add load balancing for backend
- [ ] Optimize PDF parsing performance
- [ ] Run soak test

## Monitoring and Alerting

### Key Performance Indicators (KPIs)
1. **Response Time p95** - Track per endpoint
2. **Error Rate** - Overall and per endpoint
3. **Throughput** - Requests per second
4. **Queue Depth** - Pending jobs
5. **Resource Utilization** - CPU, memory, disk

### Grafana Dashboards
- System Overview Dashboard
- Job Processing Dashboard
- Resource Utilization Dashboard

### Alert Rules
- Response time p95 > 5s for 5 minutes
- Error rate > 5% for 2 minutes
- Queue depth > 500 for 5 minutes
- CPU utilization > 85% for 10 minutes
- Memory utilization > 90% for 5 minutes

## Testing Methodology

### Load Test Types
1. **Baseline Test** - Establish normal operation metrics
2. **Stress Test** - Find breaking point
3. **Spike Test** - Test sudden load increases
4. **Soak Test** - Test stability over time

### Test Frequency
- **Baseline:** After every significant change
- **Stress:** Weekly during optimization phase
- **Spike:** Before each release
- **Soak:** Before production deployment

### Success Criteria
- All tests pass defined thresholds
- No memory leaks detected
- Graceful degradation under overload
- Recovery time < 5 minutes after load spike

## Appendix

### Test Environment Specifications
- **OS:** macOS (darwin)
- **Docker:** Docker Compose
- **Load Testing Tool:** K6
- **Monitoring:** Prometheus + Grafana

### Related Documents
- [Stress Test Results](results/stress-test-results.md)
- [Load Testing Guide](LOAD_TESTING.md)
- [Production Readiness Plan](../docs/production/PRODUCTION_READINESS_PLAN.md)

### Revision History
- **2025-11-30:** Initial baseline established from stress test results
