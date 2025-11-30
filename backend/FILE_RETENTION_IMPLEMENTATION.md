# Time-Based File Retention Implementation

## Overview

This document describes the implementation of time-based file retention for the UP Schedule Generator backend. The system automatically deletes processed PDF files and their associated job records 24 hours after job completion.

## Implementation Details

### 1. Database Schema Changes

**Added Field to Job Entity:**
- `expiresAt` (timestamp, nullable): Stores the expiration date/time for the job and its associated file

**Migration:**
- Created migration `1733000000000-AddJobExpiresAt.ts` to add the `expiresAt` column to the `jobs` table

### 2. Automatic Expiration Setting

**Location:** `backend/src/jobs/jobs.service.ts` - `updateJobStatus()` method

When a job reaches a terminal state (COMPLETED or FAILED), the system automatically:
1. Sets `completedAt` to the current timestamp
2. Calculates `expiresAt` as 24 hours after `completedAt`
3. Saves both timestamps to the database

```typescript
if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
  job.completedAt = new Date();
  
  // Set expiration to 24 hours after completion
  const expiresAt = new Date(job.completedAt);
  expiresAt.setHours(expiresAt.getHours() + 24);
  job.expiresAt = expiresAt;
  
  // ... metrics tracking
}
```

### 3. Scheduled Cleanup Job

**Location:** `backend/src/jobs/jobs.service.ts` - `cleanupExpiredJobs()` method

**Schedule:** Runs every hour (configured via `@Cron(CronExpression.EVERY_HOUR)`)

**Process:**
1. Query database for all jobs where `expiresAt < current_time`
2. For each expired job:
   - Delete the PDF file from MinIO storage
   - Invalidate the cache entry
   - Remove the job record from the database
3. Log success/failure for each deletion
4. Continue processing even if individual deletions fail

**Error Handling:**
- Individual job deletion failures are logged but don't stop the cleanup process
- Allows partial cleanup to succeed even if some files are inaccessible

### 4. Module Configuration

**ScheduleModule Integration:**
- Added `ScheduleModule.forRoot()` to `app.module.ts` to enable cron job functionality
- The `@nestjs/schedule` package was already installed

**StorageService Dependency:**
- Added `StorageService` injection to `JobsService` constructor
- Used to delete files from MinIO storage during cleanup

## Testing

### Unit Tests

**Location:** `backend/src/jobs/jobs.service.spec.ts`

**Test Coverage:**

1. **Expiration Setting Tests:**
   - Verifies `expiresAt` is set to 24 hours after completion for COMPLETED jobs
   - Verifies `expiresAt` is set to 24 hours after completion for FAILED jobs
   - Validates timestamp accuracy (within 1 second)

2. **Cleanup Tests:**
   - Verifies expired jobs and files are deleted correctly
   - Verifies cache invalidation occurs
   - Verifies database records are removed
   - Tests graceful handling when no expired jobs exist
   - Tests error resilience (continues cleanup even if individual deletions fail)

**Test Results:** All 8 tests passing ✓

## Configuration

### Retention Period

**Current Setting:** 24 hours after job completion

**To Modify:** Update the expiration calculation in `jobs.service.ts`:

```typescript
// Current: 24 hours
expiresAt.setHours(expiresAt.getHours() + 24);

// Example: 48 hours
expiresAt.setHours(expiresAt.getHours() + 48);

// Example: 7 days
expiresAt.setDate(expiresAt.getDate() + 7);
```

### Cleanup Frequency

**Current Setting:** Every hour

**To Modify:** Change the cron expression in `jobs.service.ts`:

```typescript
// Current: Every hour
@Cron(CronExpression.EVERY_HOUR)

// Example: Every 30 minutes
@Cron('*/30 * * * *')

// Example: Daily at 2 AM
@Cron('0 2 * * *')
```

## Monitoring

### Logs

The cleanup job produces structured logs:

**Start of Cleanup:**
```json
{
  "message": "Starting cleanup of expired jobs",
  "count": 5,
  "timestamp": "2025-11-30T19:00:00.000Z"
}
```

**Individual Job Deletion:**
```json
{
  "message": "Deleted expired job",
  "jobId": "uuid",
  "s3Key": "file.pdf",
  "completedAt": "2025-11-29T19:00:00.000Z",
  "expiresAt": "2025-11-30T19:00:00.000Z"
}
```

**Completion Summary:**
```json
{
  "message": "Completed cleanup of expired jobs",
  "totalExpired": 5,
  "successCount": 4,
  "errorCount": 1,
  "timestamp": "2025-11-30T19:00:05.000Z"
}
```

**Errors:**
```json
{
  "message": "Failed to delete expired job",
  "jobId": "uuid",
  "s3Key": "file.pdf",
  "error": "Storage error message"
}
```

### Metrics

No specific Prometheus metrics were added for file retention, but the following existing metrics are relevant:
- Job completion counts (tracked via `pdf_jobs_total`)
- Storage operations (if monitored at the MinIO level)

## Database Migration

To apply the schema change in production:

```bash
# Run migration
npm run migration:run:prod
```

The migration is reversible:

```bash
# Revert migration
npm run migration:revert
```

## Requirements Validation

**Requirement 11.5:** "WHEN processed PDFs are older than 24 hours THEN the System SHALL automatically delete them"

✓ **Validated:**
- Jobs set `expiresAt` to 24 hours after completion
- Scheduled job runs hourly to delete expired files
- Both the file (from MinIO) and job record (from database) are deleted
- Process is automatic and requires no manual intervention

## Related Files

- `backend/src/jobs/entities/job.entity.ts` - Job entity with expiresAt field
- `backend/src/jobs/jobs.service.ts` - Expiration logic and cleanup job
- `backend/src/jobs/jobs.service.spec.ts` - Unit tests
- `backend/src/app.module.ts` - ScheduleModule configuration
- `backend/src/migrations/1733000000000-AddJobExpiresAt.ts` - Database migration
- `backend/src/storage/storage.service.ts` - File deletion service

## Future Enhancements

Potential improvements for consideration:

1. **Configurable Retention Period:** Move retention period to environment variable
2. **Metrics:** Add Prometheus metrics for cleanup operations
3. **Soft Delete:** Implement soft delete with archive before permanent deletion
4. **User Notification:** Notify users before their files expire
5. **Selective Retention:** Different retention periods based on job type or user tier
6. **Cleanup Metrics Dashboard:** Grafana dashboard showing cleanup statistics
