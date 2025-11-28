# UP Schedule Generator API Documentation

## Overview

The UP Schedule Generator API provides endpoints for uploading University of Pretoria schedule PDFs, processing them into structured calendar events, and exporting to Google Calendar or ICS format.

The API supports three PDF modes:
- **LECTURE**: Recurring weekly lecture schedules
- **TEST**: One-time semester test schedules  
- **EXAM**: One-time final exam schedules

## Base URL

- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

## Interactive Documentation

Swagger/OpenAPI documentation is available at:
- `/api/docs` - Interactive API explorer

## Authentication

Some endpoints require Google OAuth2 authentication:
- Calendar endpoints (`/api/calendars/*`) require authentication
- Upload and job endpoints are public

## PDF Mode Detection

The system automatically detects the PDF mode by scanning the first page for identifying keywords:
- **"Lectures"** → LECTURE mode
- **"Semester Tests"** → TEST mode  
- **"Exams"** → EXAM mode

## Endpoints

### Upload PDF

**POST** `/api/upload`

Upload a UP schedule PDF for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF file, max 10MB)

**Response (201):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "pdfType": "lecture",
  "message": "PDF uploaded successfully and queued for processing"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `FILE_TYPE_NOT_ALLOWED` | Only PDF files are allowed |
| 400 | `FILE_TOO_LARGE` | File exceeds 10MB limit |
| 400 | `Invalid PDF: file does not start with PDF magic bytes` | Not a valid PDF file |
| 400 | `Invalid PDF: Unable to extract text content` | PDF is corrupted or encrypted |
| 400 | `Invalid PDF: Not a recognized UP schedule format` | No valid mode keyword found |

---

### Get Job Status

**GET** `/api/jobs/:id`

Retrieve the current status of a PDF processing job.

**Parameters:**
- `id` (path): Job UUID

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "pdfType": "lecture",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "completedAt": "2025-01-15T10:30:15.000Z",
  "error": null
}
```

**Job Statuses:**
- `pending`: Job is queued and waiting to be processed
- `processing`: Job is currently being processed
- `completed`: Job finished successfully, results available
- `failed`: Job failed, check error field

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | `Job not found` | Invalid job ID |

---

### Get Job Results

**GET** `/api/jobs/:id/result`

Retrieve parsed calendar events from a completed job.

**Parameters:**
- `id` (path): Job UUID

**Response (200) - Lecture Events:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "events": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "module": "COS 132",
      "activity": "Lecture",
      "group": "G01",
      "day": "Monday",
      "startTime": "08:30",
      "endTime": "09:20",
      "venue": "IT 4-4",
      "isRecurring": true
    }
  ]
}
```

**Response (200) - Test Events:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "events": [
    {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "module": "COS 132",
      "activity": "Test 1",
      "date": "2025-08-15",
      "startTime": "08:30",
      "endTime": "10:30",
      "venue": "IT 4-4",
      "isRecurring": false
    }
  ]
}
```

**Response (200) - Exam Events:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "events": [
    {
      "id": "323e4567-e89b-12d3-a456-426614174000",
      "module": "COS 132",
      "activity": "Final Exam",
      "date": "2025-11-15",
      "startTime": "08:00",
      "endTime": "11:00",
      "venue": "Exam Hall A",
      "isRecurring": false
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `JOB_NOT_COMPLETED` | Job is not in completed status |
| 404 | `Job not found` | Invalid job ID |

---

### Add Events to Google Calendar

**POST** `/api/calendars/events`

Add parsed events to a Google Calendar.

**Authentication:** Required (Google OAuth2)

**Request:**
```json
{
  "calendarId": "primary",
  "events": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "summary": "COS 132 Lecture",
      "location": "IT 4-4",
      "startTime": "08:30",
      "endTime": "09:20",
      "day": "Monday",
      "isRecurring": true,
      "colorId": "1"
    }
  ],
  "semesterStart": "2025-02-10",
  "semesterEnd": "2025-06-06",
  "pdfType": "lecture"
}
```

**Important:** 
- `semesterStart` and `semesterEnd` are **REQUIRED** for lecture mode (recurring events)
- `semesterStart` and `semesterEnd` are **OPTIONAL** for test and exam modes (one-time events)

**Response (201):**
```json
{
  "message": "Events added successfully",
  "count": 15
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `MISSING_SEMESTER_DATES` | Semester dates required for lecture mode |
| 401 | `GOOGLE_AUTH_REQUIRED` | Not authenticated with Google |
| 500 | - | Google Calendar API error |

---

### Generate ICS File

**POST** `/api/generate/ics`

Generate an ICS (iCalendar) file from parsed events.

**Request:**
```json
{
  "events": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "summary": "COS 132 Lecture",
      "location": "IT 4-4",
      "startTime": "08:30",
      "endTime": "09:20",
      "day": "Monday",
      "isRecurring": true,
      "colorId": "1"
    }
  ],
  "semesterStart": "2025-02-10",
  "semesterEnd": "2025-06-06",
  "pdfType": "lecture"
}
```

**Important:** 
- `semesterStart` and `semesterEnd` are **REQUIRED** for lecture mode (recurring events)
- `semesterStart` and `semesterEnd` are **OPTIONAL** for test and exam modes (one-time events)

**Response (200):**
- Content-Type: `text/calendar; charset=utf-8`
- Content-Disposition: `attachment; filename="schedule.ics"`
- Body: ICS file content

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `MISSING_SEMESTER_DATES` | Semester dates required for lecture mode |

---

## Data Models

### PdfType Enum

```typescript
enum PdfType {
  LECTURE = 'lecture',  // Recurring weekly events
  TEST = 'test',        // One-time test events
  EXAM = 'exam',        // One-time exam events
}
```

### JobStatus Enum

```typescript
enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

### ParsedEvent

```typescript
interface ParsedEvent {
  id: string;              // UUID
  module: string;          // Module code (e.g., "COS 132")
  activity: string;        // Activity type
  group?: string;          // Group ID (lectures only)
  day?: string;            // Day of week (lectures only)
  date?: string;           // Specific date (tests/exams only)
  startTime: string;       // HH:MM format
  endTime: string;         // HH:MM format
  venue: string;           // Location
  isRecurring: boolean;    // true for lectures, false for tests/exams
}
```

### EventConfig

```typescript
interface EventConfig {
  id: string;              // UUID
  summary: string;         // Event title
  location: string;        // Venue
  startTime: string;       // HH:MM format
  endTime: string;         // HH:MM format
  day?: string;            // Day of week (lectures only)
  date?: string;           // Specific date (tests/exams only)
  isRecurring: boolean;    // true for lectures, false for tests/exams
  colorId: string;         // Google Calendar color ID (1-11)
  notes?: string;          // Additional notes (e.g., for unfinalised exams)
}
```

---

## Mode-Specific Behavior

### Lecture Mode (LECTURE)

**Characteristics:**
- Recurring weekly events
- Contains `day` field (Monday, Tuesday, etc.)
- `isRecurring` is `true`
- Requires `semesterStart` and `semesterEnd` for calendar generation

**Example Event:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "module": "COS 132",
  "activity": "Lecture",
  "group": "G01",
  "day": "Monday",
  "startTime": "08:30",
  "endTime": "09:20",
  "venue": "IT 4-4",
  "isRecurring": true
}
```

### Test Mode (TEST)

**Characteristics:**
- One-time events on specific dates
- Contains `date` field (YYYY-MM-DD)
- `isRecurring` is `false`
- Semester dates are optional

**Example Event:**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "module": "COS 132",
  "activity": "Test 1",
  "date": "2025-08-15",
  "startTime": "08:30",
  "endTime": "10:30",
  "venue": "IT 4-4",
  "isRecurring": false
}
```

### Exam Mode (EXAM)

**Characteristics:**
- One-time events on specific dates
- Contains `date` field (YYYY-MM-DD)
- `isRecurring` is `false`
- Semester dates are optional
- May include `notes` field for unfinalised exams

**Example Event:**
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174000",
  "module": "COS 132",
  "activity": "Final Exam",
  "date": "2025-11-15",
  "startTime": "08:00",
  "endTime": "11:00",
  "venue": "Exam Hall A",
  "isRecurring": false,
  "notes": "Venue TBA - Check official schedule for updates"
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/upload",
  "details": "Additional error details (optional)"
}
```

### Common Errors

#### Upload Errors

1. **Invalid File Type**
   - Status: 400
   - Message: `FILE_TYPE_NOT_ALLOWED`
   - Details: Only PDF files are allowed

2. **File Too Large**
   - Status: 400
   - Message: `FILE_TOO_LARGE`
   - Details: File size exceeds 10MB limit

3. **Invalid PDF Magic Bytes**
   - Status: 400
   - Message: `Invalid PDF: file does not start with PDF magic bytes`

4. **Text Extraction Failed**
   - Status: 400
   - Message: `Invalid PDF: Unable to extract text content`
   - Details: PDF may be corrupted or encrypted

5. **Unrecognized Format**
   - Status: 400
   - Message: `Invalid PDF: Not a recognized UP schedule format`
   - Details: Expected "Lectures", "Semester Tests", or "Exams" text in PDF

#### Processing Errors

1. **Unknown PDF Type**
   - Error: `Unable to determine PDF type. Expected 'Lectures', 'Semester Tests', or 'Examinations' text.`

2. **Table Extraction Failed**
   - Error: `Parsing failed: No tables found in PDF`

3. **Invalid Table Structure**
   - Error: `Parsing failed: Missing required columns: [column names]`

#### Calendar Errors

1. **Missing Semester Dates**
   - Status: 400
   - Message: `Semester start and end dates are required for recurring events (lecture mode)`
   - Error: `MISSING_SEMESTER_DATES`

2. **Not Authenticated**
   - Status: 401
   - Message: `Not authenticated. Please login with Google first.`
   - Error: `GOOGLE_AUTH_REQUIRED`

---

## Examples

### Complete Workflow: Lecture Schedule

1. **Upload PDF**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@lecture-schedule.pdf"
```

Response:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "pdfType": "lecture",
  "message": "PDF uploaded successfully and queued for processing"
}
```

2. **Check Job Status**
```bash
curl http://localhost:3001/api/jobs/550e8400-e29b-41d4-a716-446655440000
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "pdfType": "lecture",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "completedAt": "2025-01-15T10:30:15.000Z",
  "error": null
}
```

3. **Get Results**
```bash
curl http://localhost:3001/api/jobs/550e8400-e29b-41d4-a716-446655440000/result
```

4. **Generate ICS File**
```bash
curl -X POST http://localhost:3001/api/generate/ics \
  -H "Content-Type: application/json" \
  -d '{
    "events": [...],
    "semesterStart": "2025-02-10",
    "semesterEnd": "2025-06-06",
    "pdfType": "lecture"
  }' \
  --output schedule.ics
```

### Complete Workflow: Test Schedule

1. **Upload PDF**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test-schedule.pdf"
```

Response:
```json
{
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "pdfType": "test",
  "message": "PDF uploaded successfully and queued for processing"
}
```

2. **Generate ICS File (no semester dates needed)**
```bash
curl -X POST http://localhost:3001/api/generate/ics \
  -H "Content-Type: application/json" \
  -d '{
    "events": [...],
    "pdfType": "test"
  }' \
  --output tests.ics
```

---

## Rate Limits

Currently, no rate limits are enforced. This may change in production.

## Support

For issues or questions:
- GitHub Issues: [repository-url]
- Email: support@example.com

## Changelog

### Version 3.0.0 (Current)
- Added support for three PDF modes (LECTURE, TEST, EXAM)
- Enhanced PDF validation with content-based mode detection
- Added comprehensive error responses
- Improved API documentation with mode-specific examples
- Added support for unfinalised exam handling

### Version 2.0.0
- Added Google Calendar integration
- Added ICS file generation
- Improved PDF parsing

### Version 1.0.0
- Initial release with basic PDF parsing
