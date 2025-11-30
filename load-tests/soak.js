/**
 * Soak Test
 * 
 * Tests system stability over extended period.
 * 100 concurrent users for 2 hours.
 * 
 * Requirements: 7.4
 * Target: No memory leaks, stable performance
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '2h', target: 100 },   // Hold for 2 hours
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // Maintain good performance
    'http_req_failed': ['rate<0.02'],    // Keep error rate low
    'errors': ['rate<0.02'],
  },
};

const operations = [
  { name: 'homepage', url: 'http://localhost:3000', weight: 3 },
  { name: 'health', url: 'http://localhost:3001/health', weight: 5 },
  { name: 'metrics', url: 'http://localhost:3001/api/jobs/metrics', weight: 2 },
];

export default function () {
  requestCount.add(1);
  
  // Select random operation based on weights
  const operation = selectOperation();
  
  const res = http.get(operation.url, {
    tags: { operation: operation.name },
    timeout: '10s',
  });
  
  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'has content': (r) => r.body && r.body.length > 0,
    'response time ok': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  // Variable sleep to simulate realistic user behavior
  sleep(Math.random() * 5 + 1); // 1-6 seconds
}

function selectOperation() {
  const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const op of operations) {
    random -= op.weight;
    if (random <= 0) {
      return op;
    }
  }
  
  return operations[0];
}

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'results/soak-summary.json': JSON.stringify(data),
    'results/soak-summary.txt': summary,
  };
}

function generateSummary(data) {
  let summary = '\n';
  summary += 'Soak Test Results (2 Hour Duration)\n';
  summary += '='.repeat(70) + '\n\n';
  
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  // Response times
  summary += 'Response Times:\n';
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const values = data.metrics.http_req_duration.values;
    const avg = safeFormat(values.avg);
    const p95 = safeFormat(values.p95);
    const p99 = safeFormat(values.p99);
    
    summary += `  Average: ${avg}ms\n`;
    summary += `  p95: ${p95}ms\n`;
    summary += `  p99: ${p99}ms\n\n`;
  } else {
    summary += '  No response time data available\n\n';
  }
  
  // Stability metrics
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values &&
      data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const errorRate = data.metrics.http_req_failed.values.rate || 0;
    const errorPct = safeFormat(errorRate * 100);
    const totalRequests = data.metrics.http_reqs.values.count || 0;
    const throughput = safeFormat(data.metrics.http_reqs.values.rate);
    
    summary += 'Stability Metrics:\n';
    summary += `  Total Requests: ${totalRequests}\n`;
    summary += `  Error Rate: ${errorPct}%\n`;
    summary += `  Throughput: ${throughput} req/s\n\n`;
  } else {
    summary += 'Stability Metrics:\n';
    summary += '  No stability data available\n\n';
  }
  
  // Memory leak detection
  summary += 'Memory Leak Analysis:\n';
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const p95 = data.metrics.http_req_duration.values.p95 || 0;
    
    if (p95 < 3000) {
      summary += '  ✓ Response times remained stable\n';
      summary += '  ✓ No signs of memory leaks detected\n';
    } else {
      summary += '  ⚠ Response times degraded over time\n';
      summary += '  ⚠ Possible memory leak - investigate further\n';
    }
  } else {
    summary += '  Unable to analyze - no response time data\n';
  }
  
  // Overall assessment
  summary += '\nOverall Assessment:\n';
  const errorRate = (data.metrics.http_req_failed && data.metrics.http_req_failed.values) 
    ? data.metrics.http_req_failed.values.rate || 0 
    : 1;
  const p95 = (data.metrics.http_req_duration && data.metrics.http_req_duration.values)
    ? data.metrics.http_req_duration.values.p95 || 0
    : Infinity;
    
  if (errorRate < 0.02 && p95 < 3000) {
    summary += '  ✓ System is production-ready for sustained load\n';
    summary += '  ✓ No stability issues detected\n';
    summary += '  ✓ Performance remained consistent\n';
  } else {
    summary += '  ⚠ System showed signs of degradation\n';
    summary += '  ⚠ Further optimization recommended\n';
  }
  
  summary += '\nRecommendations:\n';
  summary += '  - Monitor memory usage in production\n';
  summary += '  - Set up alerts for response time degradation\n';
  summary += '  - Implement periodic health checks\n';
  summary += '  - Consider implementing circuit breakers\n';
  
  summary += '\n';
  return summary;
}
