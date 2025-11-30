# Structured Logging Implementation

## Overview

This document describes the structured logging implementation for the UP Schedule Generator backend. The implementation adds comprehensive logging with request context (request ID, user ID) and detailed logging for critical paths.

## Implementation Details

### 1. Logging Interceptor

**File**: `src/common/interceptors/logging.interceptor.ts`

**Purpose**: Adds request ID and user ID to all HTTP requests and logs request lifecycle.

**Features**:
- Generates or retrieves request ID from `X-Request-ID` header
- Extracts user ID from authenticated session
- Logs incoming requests with metadata (method, URL, IP, user agent)
- Logs request completion with duration and status code
- Logs request failures with error details

**Log Format**:
```typescript
{
  message: 'Incoming request' | 'Request completed' | 'Request failed',
  requestId: string,
  userId: string,
  method: string,
  url: string,
  ip: string,
  userAgent?: string,
  statusCode?: number,
  duration?: string,
  error?: string
}
```

### 2. Enhanced Exception Filter

**File**: `src/common/filters/http-exception.filter.ts`

**Purpose**: Logs all exceptions with full context including stack traces.

**Features**:
- Logs exception details with request context
- Includes stack traces for debugging
- Logs request body, query params, and route params
- Adds request ID to error responses

**Log Format**:
```typescript
{
  message: 'Exception caught',
  requestId: string,
  userId: string,
  method: string,
  url: string,
  statusCode: number,
  error: string,
  stack?: string,
  body: any,
  query: any,
  params: any
}
```

### 3. Rate Limit Violation Logging

**File**: `src/common/guards/custom-throttler.guard.ts`

**Purpose**: Logs when users exceed rate limits.

**Features**:
- Logs rate limit violations with user context
- Includes throttler name and limits
- Logs retry-after time
- Tracks IP addresses for abuse detection

**Log Format**:
```typescript
{
  message: 'Rate limit exceeded',
  requestId: string,
  userId: string,
  endpoint: string,
  method: string,
  ip: string,
  throttlerName: string,
  limit: number,
  totalHits: number,
  retryAfter: string
}
```

### 4. Job Lifecycle Logging

**File**: `src/jobs/jobs.service.ts`

**Purpose**: Logs job creation and status changes for monitoring and debugging.

**Features**:
- Logs job creation with metadata
- Logs all status transitions
- Logs processing duration for completed jobs
- Logs error details for failed jobs

**Log Formats**:

**Job Creation**:
```typescript
{
  message: 'Job created',
  jobId: string,
  pdfType: string,
  s3Key: string,
  priority: string,
  status: string,
  createdAt: string
}
```

**Job Status Change**:
```typescript
{
  message: 'Job status changed',
  jobId: string,
  previousStatus: string,
  newStatus: string,
  pdfType: string,
  s3Key: string,
  duration?: string,      // For completed jobs
  eventCount?: number,    // For completed jobs
  error?: string          // For failed jobs
}
```

### 5. Database Connection Pool Monitoring

**File**: `src/health/indicators/database.health.ts`

**Purpose**: Logs warnings and errors when database connection pool approaches or reaches capacity.

**Features**:
- Monitors connection pool utilization
- Warns at 80% capacity
- Errors at 100% capacity
- Includes detailed pool metrics

**Log Formats**:

**Warning (80% utilization)**:
```typescript
{
  message: 'Database connection pool nearing exhaustion',
  totalConnections: number,
  activeConnections: number,
  idleConnections: number,
  maxConnections: number,
  utilizationPercent: string
}
```

**Error (100% utilization)**:
```typescript
{
  message: 'Database connection pool exhausted',
  totalConnections: number,
  activeConnections: number,
  idleConnections: number,
  maxConnections: number,
  utilizationPercent: '100%'
}
```

## Configuration

### Global Registration

The logging interceptor is registered globally in `app.module.ts`:

```typescript
{
  provide: APP_INTERCEPTOR,
  useClass: LoggingInterceptor,
}
```

This ensures all HTTP requests are logged with request context.

## Log Levels

The implementation uses appropriate log levels:

- **LOG**: Normal operations (request lifecycle, job creation, status changes)
- **WARN**: Potential issues (connection pool nearing capacity, rate limit violations)
- **ERROR**: Errors (exceptions, failed jobs, pool exhaustion)

## Request Context Propagation

Request context (request ID and user ID) is propagated through:

1. **Logging Interceptor**: Attaches `requestId` and `userId` to request object
2. **Exception Filter**: Reads context from request object
3. **Rate Limiter Guard**: Reads context from request object
4. **Response Headers**: Request ID is added to all responses via `X-Request-ID` header

## Benefits

1. **Traceability**: Every log entry can be traced back to a specific request via request ID
2. **User Attribution**: Actions can be attributed to specific users (or anonymous)
3. **Performance Monitoring**: Request durations are logged for all endpoints
4. **Error Debugging**: Full stack traces and request context for all errors
5. **Security Monitoring**: Rate limit violations are logged with IP addresses
6. **Capacity Planning**: Database connection pool metrics help identify scaling needs
7. **Job Monitoring**: Complete job lifecycle tracking for debugging and analytics

## Example Log Output

### Successful Request
```
[HTTP] Incoming request {"requestId":"550e8400-e29b-41d4-a716-446655440000","userId":"user123","method":"POST","url":"/api/upload","ip":"192.168.1.1","userAgent":"Mozilla/5.0..."}
[JobsService] Job created {"jobId":"660e8400-e29b-41d4-a716-446655440001","pdfType":"lecture","s3Key":"uploads/file.pdf","priority":"NORMAL","status":"PENDING","createdAt":"2025-11-30T13:00:00.000Z"}
[HTTP] Request completed {"requestId":"550e8400-e29b-41d4-a716-446655440000","userId":"user123","method":"POST","url":"/api/upload","statusCode":201,"duration":"245ms"}
```

### Rate Limit Violation
```
[HTTP] Incoming request {"requestId":"550e8400-e29b-41d4-a716-446655440002","userId":"user456","method":"POST","url":"/api/upload","ip":"192.168.1.2"}
[CustomThrottlerGuard] Rate limit exceeded {"requestId":"550e8400-e29b-41d4-a716-446655440002","userId":"user456","endpoint":"/api/upload","method":"POST","ip":"192.168.1.2","throttlerName":"upload","limit":10,"totalHits":11,"retryAfter":"3600s"}
[HTTP] Request failed {"requestId":"550e8400-e29b-41d4-a716-446655440002","userId":"user456","method":"POST","url":"/api/upload","statusCode":429,"duration":"12ms","error":"ThrottlerException: Too Many Requests"}
```

### Database Pool Warning
```
[DatabaseHealthIndicator] Database connection pool nearing exhaustion {"totalConnections":42,"activeConnections":38,"idleConnections":4,"maxConnections":50,"utilizationPercent":"84%"}
```

### Job Completion
```
[JobsService] Job status changed {"message":"Job status changed","jobId":"660e8400-e29b-41d4-a716-446655440001","previousStatus":"PROCESSING","newStatus":"COMPLETED","pdfType":"lecture","s3Key":"uploads/file.pdf","duration":"45.23s","eventCount":24}
```

## Testing

All existing tests pass with the new logging implementation. The logging does not affect application behavior, only adds observability.

## Future Enhancements

Potential improvements for production:

1. **Log Aggregation**: Integrate with ELK stack or similar for centralized logging
2. **Structured JSON Logging**: Use a library like `winston` or `pino` for consistent JSON output
3. **Log Sampling**: Sample high-volume logs to reduce storage costs
4. **Sensitive Data Redaction**: Automatically redact sensitive information from logs
5. **Correlation IDs**: Propagate request IDs to external services (PDF worker, MinIO)
6. **Performance Metrics**: Add more detailed performance breakdowns (DB query time, external API time)

## Related Requirements

This implementation satisfies the following requirements from the production readiness specification:

- **Requirement 5.5**: Log rate limit violations
- **Requirement 6.3**: Log errors with context including user ID, request ID, and stack trace
- **Task 8**: Configure structured logging with request ID and user ID
- **Task 8.1**: Add logging to critical paths (job creation, status changes, rate limits, pool exhaustion)
