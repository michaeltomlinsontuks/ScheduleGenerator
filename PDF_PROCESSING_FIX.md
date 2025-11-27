# PDF Processing Issue - Root Cause and Fix

## Issue Description

The frontend was not displaying parsed events on the preview page even though the backend successfully processed PDFs and extracted events (44 events in the logs).

## Root Cause

There were **two issues** preventing events from displaying:

### Issue 1: Separate API Endpoints

The backend API has **two separate endpoints** for job information:

1. **`GET /api/jobs/:id`** - Returns job status only (no events)
   ```json
   {
     "id": "uuid",
     "status": "completed",
     "pdfType": "weekly",
     "createdAt": "...",
     "completedAt": "...",
     "error": null
   }
   ```

2. **`GET /api/jobs/:id/result`** - Returns parsed events
   ```json
   {
     "id": "uuid",
     "events": [...]
   }
   ```

The frontend was **only calling the status endpoint** and expecting it to include the `result` field with events, but the backend never returns events in the status endpoint.

### Issue 2: Field Name Mismatch

The Python PDF worker returns events with **capital letter keys**:
```json
{
  "Day": "Monday",
  "Module": "COS 214",
  "Activity": "L1",
  "Venue": "Centenary 6",
  "start_time": "08:30",
  "end_time": "09:20"
}
```

But the backend expects **lowercase camelCase keys**:
```json
{
  "day": "Monday",
  "module": "COS 214",
  "activity": "L1",
  "venue": "Centenary 6",
  "startTime": "08:30",
  "endTime": "09:20"
}
```

This caused the frontend to receive malformed data that couldn't be properly mapped to the `ParsedEvent` type.

## The Fix

### 1. Updated `frontend/src/services/jobService.ts`

Added a new method to fetch job results separately:

```typescript
export const jobService = {
  getStatus: (jobId: string) => api.get<JobStatus>(`/api/jobs/${jobId}`),
  getResult: (jobId: string) => api.get<JobResult>(`/api/jobs/${jobId}/result`),
};
```

### 2. Updated `frontend/src/hooks/useJobStatus.ts`

Modified the polling logic to fetch results when job is completed:

```typescript
if (jobStatus.status === 'completed') {
  // Stop polling
  const intervalId = get().intervalId;
  if (intervalId) clearInterval(intervalId);
  
  // Fetch the results separately
  try {
    const resultResponse = await jobService.getResult(jobId);
    const mappedEvents = resultResponse.data.events.map(mapParsedEvent);
    set({ status: jobStatus, isPolling: false, intervalId: null });
    onComplete(mappedEvents);
  } catch (resultErr) {
    set({
      status: jobStatus,
      isPolling: false,
      error: resultErr instanceof Error ? resultErr.message : 'Failed to fetch job results',
      intervalId: null,
    });
  }
}
```

### 3. Updated `backend/src/parser/parser.service.ts`

Added data transformation to convert Python worker response to backend format:

```typescript
// Transform Python worker response to match backend ParsedEvent interface
const transformedEvents: ParsedEvent[] = response.data.events.map((event: any) => ({
  id: event.id || this.generateEventId(event),
  module: event.Module || event.module || '',
  activity: event.Activity || event.activity || '',
  group: event.Group || event.group,
  day: event.Day || event.day,
  date: event.Date || event.date,
  startTime: event.start_time || event.startTime || '',
  endTime: event.end_time || event.endTime || '',
  venue: event.Venue || event.venue || event.location || '',
  isRecurring: event.isRecurring !== undefined ? event.isRecurring : true,
}));
```

This transformation handles both the capital letter keys from the Python worker and generates unique IDs for events that don't have them.

## How It Works Now

1. User uploads PDF → Backend creates job and returns `jobId`
2. Frontend polls `GET /api/jobs/:id` every 1 second
3. When status becomes `completed`:
   - Frontend calls `GET /api/jobs/:id/result` to fetch events
   - Events are mapped and stored in Zustand store
   - User is automatically navigated to `/preview`
4. Preview page reads events from store and displays them

## Testing

Created new E2E test: `e2e/tests/pdf-processing.spec.ts`

This test:
- Uploads a PDF file
- Waits for processing to complete
- Verifies navigation to preview page
- Checks that events are displayed

Run with:
```bash
cd e2e
npm test -- pdf-processing.spec.ts
```

## Backend Logs Confirmation

From the logs, we can see the backend is working correctly:

```
[JobsProcessor] Processing job 2e4c175d-31a1-41fc-89f8-789c9a4c5130
[JobsProcessor] Downloading PDF from MinIO
[JobsProcessor] Parsing PDF with type: weekly
[ParserService] Parser returned 44 events
[JobsProcessor] Job completed successfully with 44 events
```

The issue was purely on the frontend side - not fetching the results from the correct endpoint.

## Files Changed

1. `frontend/src/services/jobService.ts` - Added `getResult()` method
2. `frontend/src/hooks/useJobStatus.ts` - Updated to fetch results on completion
3. `backend/src/parser/parser.service.ts` - Added data transformation to convert Python worker response to backend format
4. `e2e/tests/pdf-processing.spec.ts` - New E2E test for upload flow

## Next Steps

1. Test the fix by uploading a PDF through the UI
2. Verify events appear on the preview page
3. Run the E2E test to ensure the flow works end-to-end
4. Consider adding loading states while fetching results
5. Add error handling for result fetch failures
