# Monitoring Stack Quick Reference

## Access URLs

| Service | Development | Production |
|---------|-------------|------------|
| Grafana | http://localhost:3002 | https://grafana.yourdomain.com |
| Prometheus | http://localhost:9090 | https://prometheus.yourdomain.com |
| Backend Metrics | http://localhost:3001/metrics | https://api.yourdomain.com/metrics |

## Default Credentials

- **Grafana**: admin/admin (change on first login)
- **Prometheus**: Protected by Traefik auth in production

## Quick Commands

### Start Services
```bash
# Development
docker compose up -d prometheus grafana

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d prometheus grafana
```

### Stop Services
```bash
docker compose stop prometheus grafana
```

### View Logs
```bash
docker logs schedgen-prometheus
docker logs schedgen-grafana
docker logs -f schedgen-prometheus  # Follow logs
```

### Restart Services
```bash
docker compose restart prometheus grafana
```

### Check Status
```bash
docker ps | grep -E "prometheus|grafana"
```

## Dashboards

| Dashboard | UID | Purpose |
|-----------|-----|---------|
| System Overview | system-overview | Request rates, errors, response times |
| Job Processing | job-processing | Job queue, processing times, success rates |
| Resource Utilization | resource-utilization | Database, memory, CPU, event loop |

## Key Metrics

### HTTP Metrics
- `http_request_duration_seconds_count` - Request count
- `http_request_duration_seconds_sum` - Total duration
- `http_request_duration_seconds_bucket` - Duration histogram

### Job Metrics
- `pdf_jobs_total{type}` - Total jobs by type
- `pdf_processing_duration_seconds` - Processing duration
- `queue_jobs_waiting{queue}` - Jobs in queue

### Resource Metrics
- `database_connections{state}` - DB connections
- `nodejs_heap_size_used_bytes` - Memory usage
- `nodejs_eventloop_lag_seconds` - Event loop lag

## Alert Thresholds

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| Error Rate | > 5% | 2m | Critical |
| Response Time | > 10s (P95) | 3m | Critical |
| Queue Depth | > 500 | 5m | Critical |
| DB Connections | > 80% | 5m | Warning |
| Memory Usage | > 80% | 5m | Warning |

## Common Tasks

### View Active Alerts
```bash
# Prometheus UI
open http://localhost:9090/alerts

# API
curl http://localhost:9090/api/v1/alerts
```

### Query Metrics
```bash
# Current error rate
curl 'http://localhost:9090/api/v1/query?query=rate(http_request_duration_seconds_count{status=~"5.."}[5m])'

# Queue depth
curl 'http://localhost:9090/api/v1/query?query=queue_jobs_waiting'

# Database connections
curl 'http://localhost:9090/api/v1/query?query=database_connections'
```

### Reload Prometheus Config
```bash
# Without restart
curl -X POST http://localhost:9090/-/reload

# Or restart
docker restart schedgen-prometheus
```

### Export Dashboard
1. Open dashboard in Grafana
2. Click share icon → Export
3. Save JSON → Export for sharing externally

### Import Dashboard
1. Grafana → Dashboards → Import
2. Upload JSON file or paste JSON
3. Select Prometheus datasource
4. Click Import

## Troubleshooting

### Prometheus Not Scraping
```bash
# Check targets
curl http://localhost:9090/api/v1/targets | jq

# Check backend metrics
curl http://localhost:3001/metrics

# Check Prometheus logs
docker logs schedgen-prometheus | grep -i error
```

### Grafana Dashboards Empty
```bash
# Test datasource
# Grafana → Configuration → Data Sources → Prometheus → Test

# Check provisioning
docker exec schedgen-grafana ls /etc/grafana/provisioning/dashboards/json/

# Restart Grafana
docker restart schedgen-grafana
```

### High Memory Usage
```bash
# Check Prometheus memory
docker stats schedgen-prometheus

# Reduce retention time (edit prometheus.yml)
--storage.tsdb.retention.time=15d

# Restart Prometheus
docker restart schedgen-prometheus
```

## Useful Prometheus Queries

### Error Rate
```promql
sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m])) 
/ 
sum(rate(http_request_duration_seconds_count[5m]))
```

### P95 Response Time
```promql
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

### Job Success Rate
```promql
sum(rate(pdf_jobs_total{status="completed"}[5m])) 
/ 
sum(rate(pdf_jobs_total[5m]))
```

### Database Connection Utilization
```promql
database_connections{state="active"} 
/ 
database_connections{state="total"}
```

### Memory Utilization
```promql
nodejs_heap_size_used_bytes 
/ 
nodejs_heap_size_total_bytes
```

## Configuration Files

| File | Purpose |
|------|---------|
| `monitoring/prometheus/prometheus.yml` | Prometheus config |
| `monitoring/prometheus/alerts/alerting-rules.yml` | Alert rules |
| `monitoring/grafana/provisioning/datasources/prometheus.yml` | Datasource config |
| `monitoring/grafana/provisioning/dashboards/dashboards.yml` | Dashboard config |
| `monitoring/grafana/provisioning/dashboards/json/*.json` | Dashboard definitions |

## Environment Variables

```bash
# Required
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-password

# Optional (for email alerts)
GRAFANA_SMTP_ENABLED=false
GRAFANA_SMTP_HOST=smtp.example.com:587
GRAFANA_SMTP_USER=grafana@example.com
GRAFANA_SMTP_PASSWORD=your-smtp-password
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Grafana | 3002 | Web UI |
| Prometheus | 9090 | Web UI & API |
| Backend | 3001 | Metrics endpoint |

## Data Retention

- **Prometheus**: 30 days (configurable)
- **Grafana**: Persistent (stored in volume)

## Backup

### Prometheus Data
```bash
# Backup
docker run --rm -v schedgen_prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data

# Restore
docker run --rm -v schedgen_prometheus_data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup.tar.gz -C /
```

### Grafana Data
```bash
# Backup
docker run --rm -v schedgen_grafana_data:/data -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz /data

# Restore
docker run --rm -v schedgen_grafana_data:/data -v $(pwd):/backup alpine tar xzf /backup/grafana-backup.tar.gz -C /
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)

## Support

For issues:
1. Check logs: `docker logs schedgen-prometheus` or `docker logs schedgen-grafana`
2. Verify configuration: `./monitoring/verify-setup.sh`
3. Review documentation: `monitoring/README.md`
4. Check Prometheus targets: http://localhost:9090/targets
