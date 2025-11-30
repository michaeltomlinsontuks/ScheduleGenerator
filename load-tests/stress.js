/**
 * Stress Test
 * 
 * Gradually increases load to find system breaking point.
 * Ramps from 100 to 1000 concurrent users.
 * 
 * Requirements: 7.2
 * Target: Identify breaking point without data corruption
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
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Hold at 100 users
    { duration: '2m', target: 200 },   // Ramp to 200 users
    { duration: '5m', target: 200 },   // Hold at 200 users
    { duration: '2m', target: 500 },   // Ramp to 500 users
    { duration: '5m', target: 500 },   // Hold at 500 users
    { duration: '2m', target: 1000 },  // Ramp to 1000 users
    { duration: '5m', target: 1000 },  // Hold at 1000 users
    { duration: '5m', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<30000'], // Allow degradation up to 30s
    'http_req_failed': ['rate<0.20'],     // Allow up to 20% errors at peak
    'errors': ['rate<0.20'],
  },
};

export default function () {
  requestCount.add(1);
  
  // Test health endpoint (lightweight)
  const healthRes = http.get('http://localhost:3001/health', {
    timeout: '30s',
  });
  
  const success = check(healthRes, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'response received': (r) => r.body !== undefined,
  });
  
  errorRate.add(!success);
  responseTime.add(healthRes.timings.duration);
  
  // Log errors for analysis
  if (!success) {
    console.error(`Request failed: status=${healthRes.status}, error=${healthRes.error}`);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'results/stress-summary.json': JSON.stringify(data),
    'results/stress-summary.txt': summary,
  };
}

function generateSummary(data) {
  let summary = '\n';
  summary += 'Stress Test Results\n';
  summary += '='.repeat(70) + '\n\n';
  
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  // Response times by stage
  summary += 'Response Times:\n';
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const values = data.metrics.http_req_duration.values;
    summary += `  Average: ${safeFormat(values.avg)}ms\n`;
    summary += `  p50: ${safeFormat(values.med || values.p50)}ms\n`;
    summary += `  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `  p99: ${safeFormat(values.p99)}ms\n`;
    summary += `  Max: ${safeFormat(values.max)}ms\n\n`;
  } else {
    summary += '  No response time data available\n\n';
  }
  
  // Error analysis
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values && 
      data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const totalRequests = data.metrics.http_reqs.values.count || 0;
    const errorRate = data.metrics.http_req_failed.values.rate || 0;
    const failedRequests = Math.round(totalRequests * errorRate);
    const errorPct = safeFormat(errorRate * 100);
    
    summary += 'Error Analysis:\n';
    summary += `  Total Requests: ${totalRequests}\n`;
    summary += `  Failed Requests: ${failedRequests}\n`;
    summary += `  Error Rate: ${errorPct}%\n\n`;
  } else {
    summary += 'Error Analysis:\n';
    summary += '  No error data available\n\n';
  }
  
  // Throughput
  if (data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const values = data.metrics.http_reqs.values;
    summary += 'Throughput:\n';
    summary += `  Average: ${safeFormat(values.rate)} req/s\n`;
    summary += `  Total: ${values.count || 0} requests\n\n`;
  } else {
    summary += 'Throughput:\n';
    summary += '  No throughput data available\n\n';
  }
  
  // Breaking point analysis
  summary += 'Breaking Point Analysis:\n';
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values) {
    const errorRate = data.metrics.http_req_failed.values.rate || 0;
    
    if (errorRate < 0.05) {
      summary += '  ✓ System handled 1000 concurrent users successfully\n';
      summary += '  ✓ Error rate remained below 5%\n';
    } else if (errorRate < 0.20) {
      summary += '  ⚠ System showed degradation at peak load\n';
      summary += '  ⚠ Consider scaling resources or optimizing bottlenecks\n';
    } else {
      summary += '  ✗ System exceeded acceptable error threshold\n';
      summary += '  ✗ Breaking point reached - immediate optimization required\n';
    }
  } else {
    summary += '  Unable to determine breaking point - no error data available\n';
  }
  
  summary += '\n';
  return summary;
}
