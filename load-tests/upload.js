/**
 * Upload Load Test
 * 
 * Tests concurrent PDF upload processing.
 * Simulates realistic upload patterns with job status polling.
 * 
 * Requirements: 7.1
 * Target: Upload p95 < 5s, Status check p95 < 200ms, Error rate < 5%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const uploadErrorRate = new Rate('upload_errors');
const statusErrorRate = new Rate('status_errors');
const uploadDuration = new Trend('upload_duration');
const statusDuration = new Trend('status_duration');
const jobCompletionTime = new Trend('job_completion_time');
const uploadCount = new Counter('uploads');
const completedJobs = new Counter('completed_jobs');
const failedJobs = new Counter('failed_jobs');

// Load test PDF files
const testFiles = new SharedArray('pdf_files', function() {
  return [
    { name: 'UP_TST_PDF.pdf', path: '../SourceFiles/UP_TST_PDF.pdf' },
    { name: 'UP_EXAM_SS.pdf', path: '../SourceFiles/UP_EXAM_SS.pdf' },
    { name: 'UP_MOD_XLS.pdf', path: '../SourceFiles/UP_MOD_XLS.pdf' },
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '3m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Hold at 50 users
    { duration: '3m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Hold at 100 users
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    'upload_duration': ['p(95)<5000'],      // Upload p95 < 5s
    'status_duration': ['p(95)<200'],       // Status check p95 < 200ms
    'upload_errors': ['rate<0.05'],         // Upload error rate < 5%
    'status_errors': ['rate<0.05'],         // Status error rate < 5%
    'job_completion_time': ['p(95)<60000'], // Job completion < 60s
  },
};

export default function () {
  // Select random test file
  const testFile = testFiles[Math.floor(Math.random() * testFiles.length)];
  
  // Read PDF file
  const pdfData = open(testFile.path, 'b');
  
  if (!pdfData) {
    console.error(`Failed to load test file: ${testFile.path}`);
    return;
  }
  
  uploadCount.add(1);
  
  // Upload PDF
  const uploadStartTime = Date.now();
  const formData = {
    file: http.file(pdfData, testFile.name, 'application/pdf'),
  };
  
  const uploadRes = http.post('http://localhost:3001/api/upload', formData, {
    tags: { endpoint: 'upload' },
    timeout: '30s',
  });
  
  uploadDuration.add(uploadRes.timings.duration);
  
  const uploadSuccess = check(uploadRes, {
    'upload status 201': (r) => r.status === 201,
    'has jobId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId !== undefined && body.jobId !== null;
      } catch {
        return false;
      }
    },
    'upload time acceptable': (r) => r.timings.duration < 10000,
  });
  
  uploadErrorRate.add(!uploadSuccess);
  
  if (!uploadSuccess) {
    console.error(`Upload failed: status=${uploadRes.status}, body=${uploadRes.body}`);
    sleep(5);
    return;
  }
  
  // Extract jobId
  let jobId;
  try {
    jobId = JSON.parse(uploadRes.body).jobId;
  } catch (e) {
    console.error(`Failed to parse upload response: ${e}`);
    uploadErrorRate.add(1);
    sleep(5);
    return;
  }
  
  // Poll job status until completion
  let attempts = 0;
  let completed = false;
  const maxAttempts = 30; // 30 attempts * 2s = 60s max wait
  
  while (attempts < maxAttempts && !completed) {
    sleep(2);
    attempts++;
    
    const statusRes = http.get(`http://localhost:3001/api/jobs/${jobId}`, {
      tags: { endpoint: 'status' },
      timeout: '5s',
    });
    
    statusDuration.add(statusRes.timings.duration);
    
    const statusSuccess = check(statusRes, {
      'status check 200': (r) => r.status === 200,
      'has status field': (r) => {
        try {
          return JSON.parse(r.body).status !== undefined;
        } catch {
          return false;
        }
      },
      'status check time acceptable': (r) => r.timings.duration < 1000,
    });
    
    statusErrorRate.add(!statusSuccess);
    
    if (!statusSuccess) {
      console.error(`Status check failed: status=${statusRes.status}`);
      continue;
    }
    
    // Check job status
    try {
      const jobData = JSON.parse(statusRes.body);
      const status = jobData.status;
      
      if (status === 'COMPLETED') {
        completed = true;
        completedJobs.add(1);
        
        const completionTime = Date.now() - uploadStartTime;
        jobCompletionTime.add(completionTime);
        
        // Verify result has events
        check(statusRes, {
          'job has result': (r) => {
            const body = JSON.parse(r.body);
            return body.result && Array.isArray(body.result) && body.result.length > 0;
          },
        });
        
      } else if (status === 'FAILED') {
        completed = true;
        failedJobs.add(1);
        console.error(`Job ${jobId} failed: ${jobData.error || 'Unknown error'}`);
      }
      
    } catch (e) {
      console.error(`Failed to parse status response: ${e}`);
      statusErrorRate.add(1);
    }
  }
  
  if (!completed) {
    console.warn(`Job ${jobId} did not complete within ${maxAttempts * 2}s`);
    failedJobs.add(1);
  }
  
  // Random sleep between uploads to simulate realistic behavior
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'results/upload-summary.json': JSON.stringify(data),
    'results/upload-summary.txt': summary,
  };
}

function generateSummary(data) {
  let summary = '\n';
  // Helper function to safely format numbers
  const safeFormat = (value, decimals = 2) => {
    return (value !== null && value !== undefined) ? value.toFixed(decimals) : 'N/A';
  };
  
  summary += 'Upload Load Test Results\n';
  summary += '='.repeat(70) + '\n\n';
  
  // Upload metrics
  summary += 'Upload Performance:\n';
  if (data.metrics.upload_duration && data.metrics.upload_duration.values) {
    const values = data.metrics.upload_duration.values;
    summary += `  Average: ${safeFormat(values.avg)}ms\n`;
    summary += `  p50: ${safeFormat(values.p50)}ms\n`;
    summary += `  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `  p99: ${safeFormat(values.p99)}ms\n`;
    
    const p95 = values.p95 || 0;
    if (p95 < 5000) {
      summary += `  ✓ Upload p95 meets target (<5s)\n`;
    } else {
      summary += `  ✗ Upload p95 exceeds target (${safeFormat(p95)}ms > 5000ms)\n`;
    }
  } else {
    summary += '  No upload performance data available\n';
  }
  summary += '\n';
  
  // Status check metrics
  summary += 'Status Check Performance:\n';
  if (data.metrics.status_duration && data.metrics.status_duration.values) {
    const values = data.metrics.status_duration.values;
    summary += `  Average: ${safeFormat(values.avg)}ms\n`;
    summary += `  p50: ${safeFormat(values.p50)}ms\n`;
    summary += `  p95: ${safeFormat(values.p95)}ms\n`;
    summary += `  p99: ${safeFormat(values.p99)}ms\n`;
    
    const p95 = values.p95 || 0;
    if (p95 < 200) {
      summary += `  ✓ Status check p95 meets target (<200ms)\n`;
    } else {
      summary += `  ✗ Status check p95 exceeds target (${safeFormat(p95)}ms > 200ms)\n`;
    }
  } else {
    summary += '  No status check performance data available\n';
  }
  summary += '\n';
  
  // Job completion metrics
  summary += 'Job Processing:\n';
  if (data.metrics.job_completion_time && data.metrics.job_completion_time.values) {
    const values = data.metrics.job_completion_time.values;
    const avgSeconds = (values.avg || 0) / 1000;
    const p95Seconds = (values.p95 || 0) / 1000;
    summary += `  Average completion: ${safeFormat(avgSeconds)}s\n`;
    summary += `  p95 completion: ${safeFormat(p95Seconds)}s\n`;
  }
  
  if (data.metrics.uploads && data.metrics.uploads.values) {
    const totalUploads = data.metrics.uploads.values.count || 0;
    const completed = (data.metrics.completed_jobs && data.metrics.completed_jobs.values) 
      ? data.metrics.completed_jobs.values.count || 0 
      : 0;
    const failed = (data.metrics.failed_jobs && data.metrics.failed_jobs.values)
      ? data.metrics.failed_jobs.values.count || 0
      : 0;
    const successRate = totalUploads > 0 ? safeFormat((completed / totalUploads) * 100) : '0.00';
    
    summary += `  Total uploads: ${totalUploads}\n`;
    summary += `  Completed: ${completed}\n`;
    summary += `  Failed: ${failed}\n`;
    summary += `  Success rate: ${successRate}%\n`;
  }
  summary += '\n';
  
  // Error rates
  summary += 'Error Rates:\n';
  if (data.metrics.upload_errors && data.metrics.upload_errors.values) {
    const uploadErrorRate = data.metrics.upload_errors.values.rate || 0;
    const uploadErrorPct = safeFormat(uploadErrorRate * 100);
    summary += `  Upload errors: ${uploadErrorPct}%`;
    
    if (uploadErrorRate < 0.05) {
      summary += ` ✓\n`;
    } else {
      summary += ` ✗ (exceeds 5% target)\n`;
    }
  }
  
  if (data.metrics.status_errors && data.metrics.status_errors.values) {
    const statusErrorRate = data.metrics.status_errors.values.rate || 0;
    const statusErrorPct = safeFormat(statusErrorRate * 100);
    summary += `  Status check errors: ${statusErrorPct}%`;
    
    if (statusErrorRate < 0.05) {
      summary += ` ✓\n`;
    } else {
      summary += ` ✗ (exceeds 5% target)\n`;
    }
  }
  summary += '\n';
  
  // Overall assessment
  summary += 'Overall Assessment:\n';
  const uploadP95Ok = data.metrics.upload_duration && data.metrics.upload_duration.values.p95 < 5000;
  const statusP95Ok = data.metrics.status_duration && data.metrics.status_duration.values.p95 < 200;
  const uploadErrorsOk = data.metrics.upload_errors && data.metrics.upload_errors.values.rate < 0.05;
  const statusErrorsOk = data.metrics.status_errors && data.metrics.status_errors.values.rate < 0.05;
  
  if (uploadP95Ok && statusP95Ok && uploadErrorsOk && statusErrorsOk) {
    summary += '  ✓ All performance targets met\n';
    summary += '  ✓ System is ready for production load\n';
  } else {
    summary += '  ⚠ Some performance targets not met\n';
    summary += '  ⚠ Optimization recommended before production\n';
    
    if (!uploadP95Ok) summary += '    - Optimize upload endpoint\n';
    if (!statusP95Ok) summary += '    - Optimize status check endpoint\n';
    if (!uploadErrorsOk) summary += '    - Investigate upload failures\n';
    if (!statusErrorsOk) summary += '    - Investigate status check failures\n';
  }
  
  summary += '\n';
  return summary;
}
