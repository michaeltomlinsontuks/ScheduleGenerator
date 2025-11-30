# Monitoring Stack for UP Schedule Generator

## Overview

This directory contains the monitoring infrastructure for the UP Schedule Generator production deployment. The stack includes:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and alerting
- **Pre-configured Dashboards**: System overview, job processing, and resource utilization
- **Alerting Rules**: Automated alerts for critical conditions

## Architecture

```
┌─────────────┐
│   Backend   │──────┐
│  (NestJS)   │      │
└─────────────┘      │
                     │ /metrics
┌─────────────┐      │ (scrape)
│ PDF Worker  │      │
│  (Python)   │      │
└─────────────┘      │
                     ▼
              ┌─────────────┐
              │ Prometheus  │
              │  (Metrics)  │
              └─────────────┘
                     │
                     │ Query
                     ▼
              ┌─────────────┐
              │   Grafana   │
              │ (Dashboards)│
              └─────────────┘
```

## Directory Structure

```
monitoring/
├── README.md                           # This file
├── prometheus/
│   ├── prometheus.yml                  # Prometheus configuration
│   └── alerts/
│       └── alerting-rules.yml          # Alert definitions
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml          # Auto-configure Prometheus datasource
        └── dashboards/
            ├── dashboards.yml          # Dashboard provisioning config
            └── json/
                ├── system-overview.json        # System metrics dashboard
                ├── job-processing.json         # Job processing dashboard
                └── resource-utilization.json   # Resource metrics dashboard
```

## Quick Start

### 1. Start the Monitoring Stack

```bash
# Development environment
docker compose up -d prometheus grafana

# Production environment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d prometheus grafana
```

### 2. Access the Dashboards

- **Grafana**: http://localhost:3002 (or https://grafana.yourdomain.com in production)
  - Default credentials: admin/admin (change on first login)
  - Pre-configured dashboards are available in the "Production" folder

- **Prometheus**: http://localhost:9090 (or https://prometheus.yourdomain.com in production)
  - Query metrics directly
  - View active alerts
  - Check scrape targets

## Dashboards

### 1. System Overview

**Purpose**: High-level view of system health and performance

**Key Metrics**:
- Request rate by HTTP method
- Error rate (5xx responses)
- Response time percentiles (P50, P95, P99)
- Response time by route
- Requests by status code
- Active alerts count
- Service uptime

**Use Cases**:
- Quick health check
- Identify performance degradation
- Monitor error rates
- Track overall system load

### 2. Job Processing

**Purpose**: Monitor PDF processing pipeline

**Key Metrics**:
- Job creation rate by type (lecture, test, exam)
- Queue depth (waiting jobs)
- PDF processing duration (P50, P95, P99)
- Job success rate
- Total jobs by type
- Failed jobs count
- Average processing time
- Job processing rate
- Processing duration distribution (heatmap)

**Use Cases**:
- Monitor job queue health
- Identify processing bottlenecks
- Track job failure rates
- Optimize worker scaling

### 3. Resource Utilization

**Purpose**: Monitor infrastructure resource usage

**Key Metrics**:
- Database connections (total, active, idle)
- Database connection pool utilization
- Memory usage (heap)
- Memory utilization percentage
- Event loop lag
- Garbage collection duration
- Active handles and requests
- External memory
- CPU usage
- Open file descriptors

**Use Cases**:
- Detect resource exhaustion
- Identify memory leaks
- Monitor database connection pool
- Track Node.js performance

## Alerting Rules

### Error Rate Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| HighErrorRate | HTTP 5xx error rate | > 5% for 2m | Critical |
| HighJobFailureRate | Job failure rate | > 10% for 5m | Warning |

### Response Time Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| HighResponseTime | P95 response time | > 10s for 3m | Critical |
| SlowPDFProcessing | P95 processing time | > 120s for 5m | Warning |

### Resource Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| HighDatabaseConnectionUsage | Connection pool utilization | > 80% for 5m | Warning |
| HighMemoryUsage | Heap utilization | > 80% for 5m | Warning |
| HighEventLoopLag | Event loop lag | > 1s for 3m | Warning |

### Queue Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| HighQueueDepth | Waiting jobs | > 500 for 5m | Critical |
| ElevatedQueueDepth | Waiting jobs | > 200 for 10m | Warning |

### Service Health Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| BackendDown | Service unreachable | Down for 1m | Critical |
| MetricsScrapeFailure | Prometheus scrape failure | Failed for 3m | Warning |

### Job Processing Alerts

| Alert | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| NoJobsProcessing | No jobs processed with queue backlog | 10m | Critical |
| LowJobProcessingRate | Low processing rate with backlog | 10m | Warning |

## Configuration

### Prometheus Configuration

Edit `prometheus/prometheus.yml` to:
- Add new scrape targets
- Adjust scrape intervals
- Configure alerting destinations
- Add external labels

### Alert Rules

Edit `prometheus/alerts/alerting-rules.yml` to:
- Add new alert rules
- Adjust thresholds
- Modify alert durations
- Change severity levels

### Grafana Dashboards

Dashboards can be modified through:
1. **Grafana UI**: Edit dashboards directly (changes persist)
2. **JSON files**: Edit `grafana/provisioning/dashboards/json/*.json`

## Metrics Reference

### Backend Metrics

#### Counters
- `pdf_jobs_total{type}`: Total PDF jobs created
- `http_request_duration_seconds_count{method,route,status}`: HTTP request count

#### Histograms
- `pdf_processing_duration_seconds{type,status}`: PDF processing duration
- `http_request_duration_seconds{method,route,status}`: HTTP request duration

#### Gauges
- `database_connections{state}`: Database connection count
- `queue_jobs_waiting{queue}`: Jobs waiting in queue

#### Node.js Metrics (Default)
- `nodejs_heap_size_used_bytes`: Heap memory used
- `nodejs_heap_size_total_bytes`: Total heap memory
- `nodejs_eventloop_lag_seconds`: Event loop lag
- `nodejs_gc_duration_seconds`: Garbage collection duration
- `nodejs_active_handles_total`: Active handles
- `nodejs_active_requests_total`: Active requests
- `nodejs_external_memory_bytes`: External memory
- `process_cpu_seconds_total`: CPU usage
- `process_open_fds`: Open file descriptors
- `process_max_fds`: Maximum file descriptors

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check if backend is running: `docker ps | grep backend`
2. Verify metrics endpoint: `curl http://localhost:3001/metrics`
3. Check Prometheus targets: http://localhost:9090/targets
4. Review Prometheus logs: `docker logs schedgen-prometheus`

### Grafana Dashboards Not Loading

1. Check Grafana logs: `docker logs schedgen-grafana`
2. Verify datasource configuration: Grafana → Configuration → Data Sources
3. Test Prometheus connection in Grafana
4. Check dashboard provisioning: `/etc/grafana/provisioning/dashboards/`

### Alerts Not Firing

1. Check alert rules in Prometheus: http://localhost:9090/alerts
2. Verify alert rule syntax in `alerting-rules.yml`
3. Check evaluation interval in `prometheus.yml`
4. Review Prometheus logs for rule evaluation errors

### High Memory Usage in Prometheus

1. Reduce retention time: `--storage.tsdb.retention.time=15d`
2. Increase scrape interval: `scrape_interval: 30s`
3. Reduce metric cardinality (fewer labels)
4. Increase Prometheus memory limit in docker-compose

## Best Practices

### Dashboard Usage

1. **Start with System Overview**: Get a high-level view first
2. **Drill down to specifics**: Use Job Processing or Resource Utilization for details
3. **Use time ranges**: Adjust time range to focus on specific incidents
4. **Compare time periods**: Use time shift to compare current vs previous periods

### Alert Management

1. **Tune thresholds**: Adjust based on your baseline performance
2. **Avoid alert fatigue**: Set appropriate durations to avoid flapping
3. **Document runbooks**: Add links to troubleshooting guides in annotations
4. **Test alerts**: Manually trigger conditions to verify alerts work

### Performance Optimization

1. **Monitor regularly**: Check dashboards daily
2. **Set up notifications**: Configure Grafana to send alerts via email/Slack
3. **Establish baselines**: Document normal operating ranges
4. **Review trends**: Look for gradual degradation over time

## Integration with Alertmanager (Future)

To add Alertmanager for advanced alert routing:

1. Add Alertmanager service to docker-compose.yml
2. Configure Prometheus to send alerts to Alertmanager
3. Set up notification channels (email, Slack, PagerDuty)
4. Define alert routing rules

## Related Documentation

- [Production Readiness Plan](../docs/production/PRODUCTION_READINESS_PLAN.md)
- [Implementation Guide](../docs/production/IMPLEMENTATION_GUIDE.md)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Prometheus and Grafana logs
3. Consult the production readiness documentation
4. Contact the development team
