/**
 * Status Check Load Test
 * 
 * Tests job status polling under high load.
 * Simulates many users checking job status concurrently.
 * 
 * Requirements: 7.1
 * Target: p95 < 200ms, Error rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const cacheHitRate = new Rate('cache_hits');
const requestCount = new Counter('requests');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp to 50 users
    { duration: '3m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Hold at 100 users
    { duration: '3m', target: 200 },   // Ramp to 200 users
    { duration: '5m', target: 200 },   // Hold at 200 users
    { duration: '2m', target: 0 },     // Cool down
  ],
  thresholds: {
    'response_time': ['p(95)<200'],     // p95 < 200ms
    'errors': ['rate<0.01'],            // Error rate < 1%
    'http_req_duration': ['p(95)<200'], // Overall p95 < 200ms
  },
};

// Simulate a pool of job IDs that users might be checking
// In a real scenario, these would be actual job IDs from recent uploads
const jobIdPool = [];

export function setup() {
  // Create some test jobs to check status on
  const testJobs = [];
  
  for (let i = 0; i < 10; i++) {
    // Try to create a test job
    const pdfData = open('../SourceFiles/UP_TST_PDF.pdf', 'b');
    
    if (pdfData) {
      const formData = {
        file: http.file(pdfData, 'test.pdf', 'application/pdf'),
      };
      
      const uploadRes = http.post('http://localhost:3001/api/upload', formData, {
        timeout: '30s',
      });
      
      if (uploadRes.status === 201) {
        try {
          const jobId = JSON.parse(uploadRes.body).jobId;
          testJobs.push(jobId);
        } catch (e) {
          console.error(`Failed to parse upload response: ${e}`);
        }
      }
    }
    
    // Don't overwhelm the system during setup
    sleep(2);
  }
  
  console.log(`Setup complete: Created ${testJobs.length} test jobs`);
  return { jobIds: testJobs };
}

export default function (data) {
  requestCount.add(1);
  
  // Select a job ID to check
  let jobId;
  
  if (data.jobIds && data.jobIds.length > 0) {
    // Use a real job ID from setup
    jobId = data.jobIds[Math.floor(Math.random() * data.jobIds.length)];
  } else {
    // Fallback to a random UUID format (will likely return 404, but tests error handling)
    jobId = generateUUID();
  }
  
  // Check job status
  const statusRes = http.get(`http://localhost:3001/api/jobs/${jobId}`, {
    timeout: '5s',
  });
  
  responseTime.add(statusRes.timings.duration);
  
  const success = check(statusRes, {
    'status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  
  // Check if response was likely from cache (very fast response)
  if (statusRes.timings.duration < 50) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }
  
  // Log slow responses
  if (statusRes.timings.duration > 500) {
    const duration = statusRes.timings.duration || 0;
    console.warn(`Slow response: ${duration.toFixed(2)}ms for job ${jobId}`);
  }
  
  // Simulate realistic polling interval
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'results/status-check-summary.json': JSON.stringify(data),
    'results/status-check-summary.txt': summary,
  };
}

function generateSummary(data) {
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  let summary = '\n';
  summary += 'Status Check Load Test Results\n';
  summary += '='.repeat(70) + '\n\n';
  
  // Response time metrics
  summary += 'Response Time Performance:\n';
  if (data.metrics.response_time && data.metrics.response_time.values) {
    const values = data.metrics.response_time.values;
    summary += `  Average: ${safeFormat(values.avg)}ms\n`;
    summary += `  p50: ${safeFormat(values.p50)}ms\n`;
    summary += `  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `  p99: ${safeFormat(values.p99)}ms\n`;
    summary += `  Max: ${safeFormat(values.max)}ms\n`;
    
    const p95 = values.p95 || 0;
    if (p95 < 200) {
      summary += `  ✓ p95 meets target (<200ms)\n`;
    } else {
      summary += `  ✗ p95 exceeds target (${safeFormat(p95)}ms > 200ms)\n`;
    }
  } else {
    summary += '  No response time data available\n';
  }
  summary += '\n';
  
  // Throughput
  summary += 'Throughput:\n';
  if (data.metrics.requests && data.metrics.requests.values && data.state && data.state.testRunDurationMs) {
    const totalRequests = data.metrics.requests.values.count || 0;
    const duration = data.state.testRunDurationMs / 1000;
    const rps = duration > 0 ? totalRequests / duration : 0;
    
    summary += `  Total requests: ${totalRequests}\n`;
    summary += `  Requests per second: ${safeFormat(rps)}\n`;
  } else {
    summary += '  No throughput data available\n';
  }
  summary += '\n';
  
  // Cache performance
  summary += 'Cache Performance:\n';
  if (data.metrics.cache_hits && data.metrics.cache_hits.values) {
    const cacheHitRate = data.metrics.cache_hits.values.rate || 0;
    const cacheHitPct = safeFormat(cacheHitRate * 100);
    summary += `  Cache hit rate: ${cacheHitPct}%\n`;
    
    if (cacheHitRate > 0.5) {
      summary += `  ✓ Good cache utilization\n`;
    } else {
      summary += `  ⚠ Low cache hit rate - consider caching strategy\n`;
    }
  } else {
    summary += '  No cache data available\n';
  }
  summary += '\n';
  
  // Error analysis
  summary += 'Error Analysis:\n';
  if (data.metrics.errors && data.metrics.errors.values) {
    const errorRate = data.metrics.errors.values.rate || 0;
    const errorPct = safeFormat(errorRate * 100);
    summary += `  Error rate: ${errorPct}%`;
    
    if (errorRate < 0.01) {
      summary += ` ✓\n`;
    } else {
      summary += ` ✗ (exceeds 1% target)\n`;
    }
  } else {
    summary += '  No error data available\n';
  }
  summary += '\n';
  
  // Overall assessment
  summary += 'Overall Assessment:\n';
  const p95Ok = data.metrics.response_time && data.metrics.response_time.values.p95 < 200;
  const errorsOk = data.metrics.errors && data.metrics.errors.values.rate < 0.01;
  
  if (p95Ok && errorsOk) {
    summary += '  ✓ Status check endpoint meets all performance targets\n';
    summary += '  ✓ Ready for high-frequency polling in production\n';
  } else {
    summary += '  ⚠ Performance targets not fully met\n';
    
    if (!p95Ok) {
      summary += '  Recommendations:\n';
      summary += '    - Implement or optimize caching layer\n';
      summary += '    - Add database indexes on job ID\n';
      summary += '    - Consider read replicas for status queries\n';
    }
    
    if (!errorsOk) {
      summary += '  Recommendations:\n';
      summary += '    - Investigate error causes\n';
      summary += '    - Add retry logic for transient failures\n';
      summary += '    - Improve error handling\n';
    }
  }
  
  summary += '\n';
  return summary;
}
