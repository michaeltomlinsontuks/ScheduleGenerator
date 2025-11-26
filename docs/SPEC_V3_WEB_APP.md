# UP Schedule Generator V3 - Web Application Specification

## Overview

Transform the existing CLI-based UP Schedule Generator into a self-hosted web application that allows University of Pretoria students to upload their schedule PDFs and have events added directly to their Google Calendar, or download an .ics file.

## Project Goals

1. **Accessibility**: Any UP student can use the tool via a web browser without installing software
2. **Dual Output**: Support both Google Calendar API integration and .ics file download
3. **Self-Hosted**: Deployable on personal server/VPS with configurable domains
4. **Scalable**: Handle multiple concurrent users via job queue system
5. **User-Friendly**: Modern UI with preview, event filtering, and color customization

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRAEFIK (Reverse Proxy)                        │
│                         Handles SSL, routing, load balancing                │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
┌─────────────────────────────┐        ┌─────────────────────────────────────┐
│      FRONTEND (Next.js)     │        │         BACKEND (NestJS)            │
│  - DaisyUI Components       │◄──────►│  - REST API + Swagger               │
│  - Google OAuth UI          │        │  - Google OAuth Handler             │
│  - PDF Upload               │        │  - PDF Processing Orchestration     │
│  - Preview Calendar         │        │  - Calendar Event Generation        │
│  - Color Picker             │        │  - Google Calendar API Client       │
│  - Date Range Selector      │        │  - Jest Testing                     │
└─────────────────────────────┘        └─────────────────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────┐
                    │                                   │                   │
                    ▼                                   ▼                   ▼
┌─────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────┐
│   MinIO (S3 Storage)    │  │   Redis + BullMQ (Queue)    │  │ PostgreSQL (Database)│
│  - Temporary PDF store  │  │  - Job queue management     │  │  - Job status        │
│  - Delete after process │  │  - Concurrent processing    │  │  - Processing logs   │
└─────────────────────────┘  └─────────────────────────────┘  └─────────────────────┘
                                          │
                                          ▼
                            ┌─────────────────────────────┐
                            │   PDF Parser (Python Worker)│
                            │  - Based on V2 pdf_parser   │
                            │  - Extracts schedule data   │
                            │  - Returns structured JSON  │
                            └─────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Reverse Proxy | Traefik | SSL termination, routing, .env domain config |
| Frontend | Next.js 14+ | React-based UI with SSR capabilities |
| UI Components | DaisyUI + Tailwind | Pre-built accessible components |
| Backend | NestJS | TypeScript API framework |
| API Docs | Swagger/OpenAPI | Auto-generated API documentation |
| Testing | Jest | Unit and integration testing |
| Database | PostgreSQL | Job tracking, processing logs |
| Queue | Redis + BullMQ | Job queue for PDF processing |
| Object Storage | MinIO | S3-compatible PDF storage |
| PDF Parser | Python (pdfplumber) | Reuse V2 parsing logic |
| Containerization | Docker + Docker Compose | All services containerized |

---

## User Flows

### Flow 1: Guest User (ICS Download)

```
1. User visits site
2. Uploads PDF (schedule or test)
3. System validates PDF type
4. System parses PDF → extracts events
5. User sees preview calendar
6. User removes unwanted events (e.g., wrong prac group)
7. User selects colors for each module
8. User sets semester date range
9. User downloads .ics file
10. (Optional) User uploads second PDF, colors persist via localStorage
```

### Flow 2: Google Calendar User

```
1. User visits site
2. User clicks "Login with Google"
3. OAuth flow → grants calendar access
4. User uploads PDF
5. System validates and parses PDF
6. User sees preview, filters events, sets colors
7. User selects target calendar (existing or create new)
8. User sets semester date range
9. System adds events to Google Calendar
10. User sees success confirmation
```

---

## Core Features

### 1. PDF Upload & Validation
- Accept PDF files only
- Quick validation: scan for "Lectures" or "Semester Tests" keywords
- Reject invalid PDFs before queuing
- Show upload progress

### 2. PDF Processing Queue
- Jobs queued in Redis via BullMQ
- PDF stored temporarily in MinIO
- Python worker processes PDF
- Returns structured event data as JSON
- PDF deleted after successful processing

### 3. Event Preview & Filtering
- Display parsed events in calendar view
- Group by day of week
- Allow user to deselect/remove events
- Show event details: module, activity, time, venue

### 4. Module Color Mapping
- Extract unique modules from parsed events
- Present Google Calendar color palette (11 colors)
- User assigns color per module
- Colors persist in localStorage for session

### 5. Date Range Configuration
- Semester start date picker
- Semester end date picker
- Smart defaults based on current date
- Affects recurring event generation

### 6. Calendar Selection (Google Users)
- Fetch user's calendar list via API
- Allow selection of existing calendar
- Option to create new calendar
- Default to primary calendar

### 7. Output Generation
- **ICS Download**: Generate .ics file with all selected events
- **Google Calendar**: Add events via API with colors and recurrence

---

## Sub-Specification Documents

This document provides the high-level architecture. Detailed specifications for each layer are in separate documents:

| Document | Contents |
|----------|----------|
| [SPEC_FRONTEND.md](./SPEC_FRONTEND.md) | Pages, components, styles, state management, localStorage |
| [SPEC_BACKEND.md](./SPEC_BACKEND.md) | NestJS modules, controllers, services, DTOs, Swagger config |
| [SPEC_DEVOPS.md](./SPEC_DEVOPS.md) | Docker configs, docker-compose, Traefik, .env variables |

---

## Data Models

### ParsedEvent
```typescript
interface ParsedEvent {
  id: string;                    // Generated UUID
  module: string;                // e.g., "COS 214"
  activity: string;              // e.g., "Lecture", "Practical", "Tutorial"
  group?: string;                // e.g., "P01", "G01"
  day?: string;                  // e.g., "Monday" (weekly events)
  date?: string;                 // e.g., "15 Aug 2025" (test events)
  startTime: string;             // e.g., "08:30"
  endTime: string;               // e.g., "10:20"
  venue: string;                 // e.g., "IT 4-4"
  isRecurring: boolean;          // true for weekly, false for tests
  selected: boolean;             // User can deselect
}
```

### ProcessingJob
```typescript
interface ProcessingJob {
  id: string;                    // Job UUID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfType: 'weekly' | 'test';
  s3Key: string;                 // MinIO object key
  createdAt: Date;
  completedAt?: Date;
  result?: ParsedEvent[];
  error?: string;
}
```

### UserColorPreferences (localStorage)
```typescript
interface UserColorPreferences {
  [moduleCode: string]: string;  // e.g., { "COS 214": "Tangerine" }
}
```

### CalendarConfig
```typescript
interface CalendarConfig {
  semesterStart: string;         // ISO date
  semesterEnd: string;           // ISO date
  targetCalendarId?: string;     // Google Calendar ID (if authenticated)
}
```

---

## API Endpoints (Summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF, returns job ID |
| GET | `/api/jobs/:id` | Get job status and results |
| POST | `/api/generate/ics` | Generate .ics file from events |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/calendars` | List user's Google Calendars |
| POST | `/api/calendars/events` | Add events to Google Calendar |

---

## Environment Variables

```env
# Domain Configuration
DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=schedgen
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=schedgen

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO (S3)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET=pdf-uploads

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=${BACKEND_URL}/api/auth/google/callback

# Traefik
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD=<hashed-password>
```

---

## Docker Services

| Service | Image/Build | Ports | Purpose |
|---------|-------------|-------|---------|
| traefik | traefik:v3.0 | 80, 443, 8080 | Reverse proxy |
| frontend | ./frontend | 3000 | Next.js app |
| backend | ./backend | 3001 | NestJS API |
| pdf-worker | ./pdf-worker | - | Python PDF processor |
| postgres | postgres:16 | 5432 | Database |
| redis | redis:7-alpine | 6379 | Queue backend |
| minio | minio/minio | 9000, 9001 | Object storage |

---

## Security Considerations

1. **File Validation**: Validate PDF magic bytes, not just extension
2. **File Size Limit**: Max 10MB per PDF
3. **Temporary Storage**: PDFs deleted immediately after processing
4. **OAuth Scopes**: Request minimal Google Calendar scopes
5. **CORS**: Restrict to frontend domain only
6. **Rate Limiting**: Not in MVP, but structure for future addition

---

## Out of Scope (MVP)

- User accounts/registration (beyond Google OAuth for calendar access)
- Persistent user preferences (beyond localStorage)
- Rate limiting
- Multiple language support
- Mobile app
- Email notifications
- Schedule sharing between users

---

## Success Criteria

1. User can upload a UP schedule PDF and download a valid .ics file
2. User can authenticate with Google and add events to their calendar
3. User can filter out unwanted events before generation
4. User can assign colors to modules
5. User can set custom semester date ranges
6. System handles multiple concurrent users via queue
7. All services run in Docker containers
8. API is documented via Swagger
9. Backend has Jest test coverage

---

## Next Steps

1. Create detailed [SPEC_FRONTEND.md](./SPEC_FRONTEND.md)
2. Create detailed [SPEC_BACKEND.md](./SPEC_BACKEND.md)
3. Create detailed [SPEC_DEVOPS.md](./SPEC_DEVOPS.md)
4. Use Kiro spec tool to create individual feature specs from sub-documents
