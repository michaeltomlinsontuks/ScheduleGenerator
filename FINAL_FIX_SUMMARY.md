# PDF Processing - Complete Fix Summary

## Issues Identified

### 1. Frontend Not Fetching Results
**Problem:** Frontend only called `/api/jobs/:id` (status endpoint) but never called `/api/jobs/:id/result` (results endpoint).

**Fix:** Updated `jobService.ts` and `useJobStatus.ts` to fetch results separately when job completes.

### 2. Field Name Mismatch
**Problem:** Python PDF worker returns capital letter keys (`Day`, `Module`, `Activity`, `Venue`) but backend expects lowercase camelCase (`day`, `module`, `activity`, `venue`).

**Fix:** Added transformation layer in `backend/src/parser/parser.service.ts` to convert Python worker response to backend format.

### 3. Duplicate Event IDs
**Problem:** Generated event IDs were not unique, causing React key collision errors: `"Encountered two children with the same key, COS-284-P1-Monday-14:30"`

**Fix:** Enhanced ID generation to include group, venue, and index for guaranteed uniqueness.

## Files Modified

### Frontend
1. **`frontend/src/services/jobService.ts`**
   - Added `getResult()` method to fetch parsed events
   - Added `JobResult` interface

2. **`frontend/src/hooks/useJobStatus.ts`**
   - Updated polling logic to call `getResult()` when job completes
   - Added error handling for result fetch failures

### Backend
3. **`backend/src/parser/parser.service.ts`**
   - Added data transformation to convert Python worker response
   - Enhanced `generateEventId()` to include group, venue, and index
   - Handles both capital and lowercase field names

## How It Works Now

```
┌─────────────┐
│   Upload    │
│   PDF File  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: POST /api/upload                               │
│ - Stores PDF in MinIO                                   │
│ - Creates job in database                               │
│ - Queues job for processing                             │
│ - Returns jobId                                         │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: Poll GET /api/jobs/:id (every 1 second)      │
│ - Checks job status                                     │
│ - Waits for status = "completed"                        │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: Job Processor                                  │
│ 1. Downloads PDF from MinIO                             │
│ 2. Sends to Python PDF Worker (POST /parse)             │
│ 3. Python returns events with capital keys              │
│ 4. Parser Service transforms to lowercase camelCase     │
│ 5. Generates unique IDs for each event                  │
│ 6. Stores in database with job                          │
│ 7. Updates job status to "completed"                    │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: GET /api/jobs/:id/result                      │
│ - Fetches parsed events                                 │
│ - Maps to frontend ParsedEvent type                     │
│ - Stores in Zustand event store                         │
│ - Navigates to /preview                                 │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Preview Page                                            │
│ - Reads events from store                               │
│ - Displays events grouped by day                        │
│ - Shows module colors                                   │
│ - Allows selection/filtering                            │
└─────────────────────────────────────────────────────────┘
```

## Data Transformation Example

### Python Worker Output
```json
{
  "Day": "Monday",
  "Module": "COS 214",
  "Activity": "L1",
  "Group": "G01",
  "Venue": "Centenary 6",
  "start_time": "08:30",
  "end_time": "09:20"
}
```

### After Backend Transformation
```json
{
  "id": "COS-214-L1-Monday-08:30-G01-Centenary-6-0",
  "module": "COS 214",
  "activity": "L1",
  "group": "G01",
  "day": "Monday",
  "startTime": "08:30",
  "endTime": "09:20",
  "venue": "Centenary 6",
  "isRecurring": true
}
```

### After Frontend Mapping
```typescript
{
  id: "COS-214-L1-Monday-08:30-G01-Centenary-6-0",
  moduleCode: "COS 214",
  eventType: "l1",  // lowercase
  dayOfWeek: "Monday",
  startTime: "08:30",
  endTime: "09:20",
  location: "Centenary 6",
  group: "G01"
}
```

## Testing

### Manual Testing
1. Navigate to http://localhost:3000/upload
2. Upload a PDF file (e.g., `SourceFiles/UP_MOD_XLS.pdf`)
3. Wait for processing (should see "Uploading" → "Processing")
4. Should automatically navigate to `/preview`
5. Should see events displayed with correct data
6. No duplicate key errors in console

### E2E Testing
```bash
cd e2e
npm test -- pdf-processing.spec.ts
```

## Verification

The fix is working when you see:
1. ✅ No "lowercase error" in frontend
2. ✅ No duplicate key warnings in console
3. ✅ Events displayed on preview page
4. ✅ Backend logs show: "Parser returned X events"
5. ✅ Backend logs show: "Job completed successfully with X events"

## Backend Logs (Success)
```
[JobsProcessor] Processing job <uuid>
[JobsProcessor] Downloading PDF from MinIO
[JobsProcessor] Parsing PDF with type: weekly
[ParserService] Sending PDF to parser service
[ParserService] Parser returned 44 events
[JobsProcessor] Job completed successfully with 44 events
```

## Next Steps

1. ✅ Test with a real PDF upload
2. ✅ Verify events display correctly
3. ✅ Verify no duplicate key errors
4. 📝 Add more comprehensive E2E tests
5. 📝 Add error handling for malformed PDFs
6. 📝 Add loading states during result fetch
7. 📝 Consider caching results to avoid refetch on page refresh
