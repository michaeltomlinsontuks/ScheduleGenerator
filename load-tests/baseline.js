/**
 * Baseline Performance Test
 * 
 * Tests system performance with minimal load (10 concurrent users).
 * Establishes performance baseline for comparison.
 * 
 * Requirements: 7.1
 * Target: p95 < 2s, error rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const homepageDuration = new Trend('homepage_duration');
const healthDuration = new Trend('health_duration');
const metricsDuration = new Trend('metrics_duration');

export const options = {
  vus: 10, // 10 virtual users
  duration: '5m', // Run for 5 minutes
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests under 2s
    'http_req_failed': ['rate<0.01'],    // Less than 1% errors
    'errors': ['rate<0.01'],
    'homepage_duration': ['p(95)<1000'], // Homepage under 1s
    'health_duration': ['p(95)<200'],    // Health check under 200ms
  },
};

export default function () {
  // Test 1: Homepage
  const homeRes = http.get('http://localhost:3000');
  const homeSuccess = check(homeRes, {
    'homepage status 200': (r) => r.status === 200,
    'homepage has content': (r) => r.body.length > 0,
  });
  
  errorRate.add(!homeSuccess);
  homepageDuration.add(homeRes.timings.duration);
  
  sleep(1);

  // Test 2: API Health Check
  const healthRes = http.get('http://localhost:3001/health');
  const healthSuccess = check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health is ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok';
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!healthSuccess);
  healthDuration.add(healthRes.timings.duration);

  sleep(1);

  // Test 3: Metrics Endpoint
  const metricsRes = http.get('http://localhost:3001/metrics');
  const metricsSuccess = check(metricsRes, {
    'metrics status 200': (r) => r.status === 200,
    'metrics has content': (r) => r.body.length > 0,
  });
  
  errorRate.add(!metricsSuccess);
  metricsDuration.add(metricsRes.timings.duration);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'results/baseline-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  let summary = '\n';
  summary += `${indent}Baseline Test Results\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Request metrics
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const values = data.metrics.http_req_duration.values;
    summary += `${indent}Response Times:\n`;
    summary += `${indent}  p50: ${safeFormat(values.p50)}ms\n`;
    summary += `${indent}  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `${indent}  p99: ${safeFormat(values.p99)}ms\n\n`;
  }
  
  // Error rate
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values) {
    const errorRate = data.metrics.http_req_failed.values.rate || 0;
    const errorPct = safeFormat(errorRate * 100);
    summary += `${indent}Error Rate: ${errorPct}%\n\n`;
  }
  
  // Throughput
  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const throughput = safeFormat(data.metrics.http_reqs.values.rate);
    summary += `${indent}Throughput: ${throughput} req/s\n\n`;
  }
  
  return summary;
}
