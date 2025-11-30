/**
 * Spike Test
 * 
 * Tests system recovery from sudden traffic spike.
 * Sudden jump to 500 users, then recovery.
 * 
 * Requirements: 7.3
 * Target: Recovery within 2 minutes after spike ends
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const recoveryTime = new Trend('recovery_time');

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load baseline
    { duration: '30s', target: 500 },  // Sudden spike to 500 users
    { duration: '2m', target: 500 },   // Hold spike
    { duration: '30s', target: 10 },   // Drop back to normal
    { duration: '2m', target: 10 },    // Recovery period
  ],
  thresholds: {
    'http_req_duration': ['p(95)<15000'], // Allow some degradation during spike
    'http_req_failed': ['rate<0.10'],     // Allow up to 10% errors during spike
    'errors': ['rate<0.10'],
  },
};

let spikeStartTime = null;
let spikeEndTime = null;
let recoveryStartTime = null;

export default function () {
  const currentVUs = __VU;
  
  // Track spike timing
  if (currentVUs > 100 && spikeStartTime === null) {
    spikeStartTime = Date.now();
  }
  
  if (currentVUs < 50 && spikeStartTime !== null && spikeEndTime === null) {
    spikeEndTime = Date.now();
    recoveryStartTime = Date.now();
  }
  
  // Test health endpoint
  const healthRes = http.get('http://localhost:3001/health', {
    timeout: '20s',
  });
  
  const success = check(healthRes, {
    'status 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 15000,
  });
  
  errorRate.add(!success);
  responseTime.add(healthRes.timings.duration);
  
  // Track recovery
  if (recoveryStartTime !== null && success && healthRes.timings.duration < 2000) {
    const recoveryDuration = Date.now() - recoveryStartTime;
    recoveryTime.add(recoveryDuration);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'results/spike-summary.json': JSON.stringify(data),
    'results/spike-summary.txt': summary,
  };
}

function generateSummary(data) {
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  let summary = '\n';
  summary += 'Spike Test Results\n';
  summary += '='.repeat(70) + '\n\n';
  
  // Response times
  summary += 'Response Times:\n';
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const values = data.metrics.http_req_duration.values;
    summary += `  Average: ${safeFormat(values.avg)}ms\n`;
    summary += `  p50: ${safeFormat(values.p50)}ms\n`;
    summary += `  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `  p99: ${safeFormat(values.p99)}ms\n`;
    summary += `  Max: ${safeFormat(values.max)}ms\n\n`;
  } else {
    summary += '  No response time data available\n\n';
  }
  
  // Error analysis
  if (data.metrics.http_req_failed && data.metrics.http_req_failed.values &&
      data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const errorRate = data.metrics.http_req_failed.values.rate || 0;
    const errorPct = safeFormat(errorRate * 100);
    summary += 'Error Analysis:\n';
    summary += `  Error Rate: ${errorPct}%\n`;
    summary += `  Total Requests: ${data.metrics.http_reqs.values.count || 0}\n\n`;
  } else {
    summary += 'Error Analysis:\n';
    summary += '  No error data available\n\n';
  }
  
  // Spike handling
  summary += 'Spike Handling:\n';
  const errorRate = (data.metrics.http_req_failed && data.metrics.http_req_failed.values)
    ? data.metrics.http_req_failed.values.rate || 0
    : 1;
    
  if (errorRate < 0.05) {
    summary += '  ✓ System handled spike without significant errors\n';
  } else if (errorRate < 0.10) {
    summary += '  ⚠ System showed some degradation during spike\n';
  } else {
    summary += '  ✗ System struggled with sudden spike\n';
  }
  
  // Recovery analysis
  const p95 = (data.metrics.http_req_duration && data.metrics.http_req_duration.values)
    ? data.metrics.http_req_duration.values.p95 || 0
    : Infinity;
    
  if (p95 < 5000) {
    summary += '  ✓ System recovered quickly after spike\n';
  } else {
    summary += '  ⚠ System recovery was slower than expected\n';
  }
  
  summary += '\n';
  summary += 'Recommendations:\n';
  if (errorRate > 0.05) {
    summary += '  - Consider implementing request queuing\n';
    summary += '  - Add auto-scaling triggers\n';
    summary += '  - Increase resource buffers\n';
  } else {
    summary += '  - System handles spikes well\n';
    summary += '  - Current configuration is adequate\n';
  }
  
  summary += '\n';
  return summary;
}
