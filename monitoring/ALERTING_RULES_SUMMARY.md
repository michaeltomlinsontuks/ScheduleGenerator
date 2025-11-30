# Alerting Rules Implementation Summary

## Overview

This document summarizes the alerting rules configured for the UP Schedule Generator production monitoring system. All rules are defined in `prometheus/alerts/alerting-rules.yml` and are automatically loaded by Prometheus.

## Requirements Validation

### Requirement 6.4: Response Time Alerts
✅ **Alert on p95 response time > 10s**
- Alert: `HighResponseTime`
- Condition: P95 response time exceeds 10 seconds
- Duration: 3 minutes
- Severity: Critical

### Requirement 6.5: Resource Utilization Alerts
✅ **Alert on resource utilization > 80%**
- Alert: `HighDatabaseConnectionUsage` - Database connection pool > 80%
- Alert: `HighMemoryUsage` - Heap memory utilization > 80%
- Duration: 5 minutes
- Severity: Warning

### Additional Alerts (Beyond Requirements)

#### Error Rate Alerts
✅ **Alert on error rate > 5%**
- Alert: `HighErrorRate`
- Condition: HTTP 5xx error rate exceeds 5%
- Duration: 2 minutes
- Severity: Critical

#### Queue Depth Alerts
✅ **Alert on queue depth > 500**
- Alert: `HighQueueDepth`
- Condition: Queue has more than 500 waiting jobs
- Duration: 5 minutes
- Severity: Critical

## Alert Groups

### 1. Error Rate Alerts
- **HighErrorRate**: HTTP 5xx error rate > 5% for 2 minutes
- **HighJobFailureRate**: Job failure rate > 10% for 5 minutes

### 2. Response Time Alerts
- **HighResponseTime**: P95 response time > 10s for 3 minutes
- **SlowPDFProcessing**: P95 PDF processing time > 120s for 5 minutes

### 3. Resource Alerts
- **HighDatabaseConnectionUsage**: Connection pool > 80% for 5 minutes
- **HighMemoryUsage**: Heap utilization > 80% for 5 minutes
- **HighEventLoopLag**: Event loop lag > 1s for 3 minutes

### 4. Queue Alerts
- **HighQueueDepth**: Queue depth > 500 for 5 minutes
- **ElevatedQueueDepth**: Queue depth > 200 for 10 minutes

### 5. Service Health Alerts
- **BackendDown**: Service unreachable for 1 minute
- **MetricsScrapeFailure**: Prometheus cannot scrape metrics for 3 minutes

### 6. Job Processing Alerts
- **NoJobsProcessing**: No jobs processed for 10 minutes with queue backlog
- **LowJobProcessingRate**: Processing rate < 0.1 jobs/sec with backlog

## Alert Annotations

Each alert includes:
- **Summary**: Brief description of the alert
- **Description**: Detailed information with current value
- **Dashboard**: Link to relevant Grafana dashboard for investigation

## Alert Labels

Each alert includes:
- **Severity**: `critical` or `warning`
- **Component**: Affected component (backend, pdf-worker, database, queue, monitoring)

## Testing Alerts

### Manual Testing

1. **Test HighErrorRate**:
   ```bash
   # Generate 5xx errors
   for i in {1..100}; do curl http://localhost:3001/nonexistent; done
   ```

2. **Test HighQueueDepth**:
   ```bash
   # Upload many PDFs simultaneously
   for i in {1..600}; do curl -F "file=@test.pdf" http://localhost:3001/api/upload; done
   ```

3. **Test HighMemoryUsage**:
   ```bash
   # Trigger memory-intensive operations
   # Monitor with: docker stats schedgen-backend
   ```

4. **Test BackendDown**:
   ```bash
   # Stop the backend service
   docker stop schedgen-backend
   # Wait 1 minute, check Prometheus alerts
   ```

### Viewing Active Alerts

1. **Prometheus UI**: http://localhost:9090/alerts
2. **Grafana Dashboard**: System Overview → Active Alerts panel

## Alert Routing (Future Enhancement)

Currently, alerts are visible in:
- Prometheus UI (http://localhost:9090/alerts)
- Grafana dashboards (Active Alerts panel)

To enable notifications:
1. Set up Alertmanager
2. Configure notification channels (email, Slack, PagerDuty)
3. Define routing rules based on severity and component
4. Set up on-call schedules

## Alert Tuning

### Adjusting Thresholds

Edit `prometheus/alerts/alerting-rules.yml`:

```yaml
# Example: Change error rate threshold from 5% to 10%
- alert: HighErrorRate
  expr: |
    (
      sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m]))
      /
      sum(rate(http_request_duration_seconds_count[5m]))
    ) > 0.10  # Changed from 0.05
```

### Adjusting Duration

```yaml
# Example: Change duration from 2m to 5m
- alert: HighErrorRate
  expr: ...
  for: 5m  # Changed from 2m
```

### Reload Configuration

```bash
# Reload Prometheus configuration without restart
curl -X POST http://localhost:9090/-/reload

# Or restart Prometheus
docker restart schedgen-prometheus
```

## Best Practices

1. **Set appropriate durations**: Avoid alert flapping by using reasonable `for` durations
2. **Use meaningful labels**: Include component and severity for routing
3. **Add helpful annotations**: Include dashboard links and troubleshooting hints
4. **Test alerts regularly**: Verify alerts fire correctly under test conditions
5. **Document runbooks**: Create troubleshooting guides for each alert
6. **Review and tune**: Adjust thresholds based on production baselines

## Troubleshooting

### Alert Not Firing

1. Check alert rule syntax: http://localhost:9090/alerts
2. Verify metric exists: Query in Prometheus
3. Check evaluation interval in prometheus.yml
4. Review Prometheus logs: `docker logs schedgen-prometheus`

### False Positives

1. Increase `for` duration to reduce flapping
2. Adjust threshold based on baseline metrics
3. Add additional conditions to make alert more specific

### Alert Fatigue

1. Increase severity thresholds
2. Group related alerts
3. Set up proper alert routing with Alertmanager
4. Use inhibition rules to suppress dependent alerts

## Files Created

- `monitoring/prometheus/alerts/alerting-rules.yml` - Alert rule definitions
- `monitoring/ALERTING_RULES_SUMMARY.md` - This documentation

## Requirements Validated

✅ **Requirement 6.4**: Alert on p95 response time > 10s
✅ **Requirement 6.5**: Alert on resource utilization > 80%
✅ **Additional**: Alert on error rate > 5%
✅ **Additional**: Alert on queue depth > 500

## Next Steps

1. Deploy monitoring stack to production
2. Establish baseline metrics
3. Tune alert thresholds based on production data
4. Set up Alertmanager for notifications
5. Create runbooks for each alert
6. Train team on alert response procedures

## Related Documentation

- [Monitoring README](./README.md)
- [Production Readiness Plan](../docs/production/PRODUCTION_READINESS_PLAN.md)
- [Prometheus Alerting Documentation](https://prometheus.io/docs/alerting/latest/overview/)
