# Requirements Document

## Introduction

This document specifies the requirements for the UP Schedule Generator V3 Backend - a NestJS API that provides PDF upload, processing orchestration, Google Calendar integration, and ICS file generation. The backend serves as the core processing engine for converting University of Pretoria schedule PDFs into calendar events, supporting both direct Google Calendar integration and ICS file downloads.

## Glossary

- **Backend**: The NestJS API server that handles all business logic, file processing, and external integrations
- **Job**: A processing task representing a PDF file being parsed and converted to calendar events
- **ParsedEvent**: A structured data object representing a single calendar event extracted from a PDF
- **ICS**: iCalendar file format (.ics) for calendar data interchange
- **MinIO**: S3-compatible object storage service for temporary PDF file storage
- **BullMQ**: Redis-based job queue library for managing asynchronous PDF processing
- **OAuth**: Open Authorization protocol used for Google Calendar authentication
- **DTO**: Data Transfer Object - classes that define the shape of data for API requests/responses
- **Swagger**: API documentation tool that generates interactive documentation from code annotations

## Requirements

### Requirement 1

**User Story:** As a developer, I want a well-structured NestJS application with proper configuration management, so that the backend is maintainable and deployable across environments.

#### Acceptance Criteria

1. WHEN the Backend starts THEN the Backend SHALL load configuration from environment variables using NestJS ConfigModule
2. WHEN the Backend initializes THEN the Backend SHALL establish connections to PostgreSQL, Redis, and MinIO services
3. WHEN the Backend starts THEN the Backend SHALL expose Swagger documentation at `/api/docs`
4. WHEN the Backend receives a request THEN the Backend SHALL apply CORS restrictions allowing only the configured frontend URL
5. WHEN the Backend encounters an unhandled exception THEN the Backend SHALL return a standardized error response with status code, message, and timestamp

### Requirement 2

**User Story:** As a user, I want to upload my UP schedule PDF, so that the system can process it and extract calendar events.

#### Acceptance Criteria

1. WHEN a user uploads a file to `/api/upload` THEN the Backend SHALL validate that the file is a PDF with content type `application/pdf`
2. WHEN a user uploads a PDF larger than 10MB THEN the Backend SHALL reject the upload with a 400 status and INVALID_FILE_TYPE error
3. WHEN a user uploads a valid PDF THEN the Backend SHALL scan the content for "Lectures" or "Semester Tests" keywords to validate it is a UP schedule
4. WHEN a user uploads an invalid PDF (not a UP schedule) THEN the Backend SHALL reject the upload with a 400 status and INVALID_PDF_CONTENT error
5. WHEN a user uploads a valid UP schedule PDF THEN the Backend SHALL store the file in MinIO, create a job record in PostgreSQL, queue the job in BullMQ, and return a job ID

### Requirement 3

**User Story:** As a user, I want to check the status of my PDF processing job, so that I know when my events are ready.

#### Acceptance Criteria

1. WHEN a user requests job status at `/api/jobs/:id` THEN the Backend SHALL return the current status (pending, processing, completed, failed)
2. WHEN a user requests a non-existent job ID THEN the Backend SHALL return a 404 status with JOB_NOT_FOUND error
3. WHEN a job completes successfully THEN the Backend SHALL store the parsed events as JSON in the job record
4. WHEN a job fails THEN the Backend SHALL store the error message in the job record and set status to failed
5. WHEN a user requests job results at `/api/jobs/:id/result` for a completed job THEN the Backend SHALL return the array of ParsedEvent objects

### Requirement 4

**User Story:** As a system, I want to process PDF files asynchronously, so that the API remains responsive during long-running parsing operations.

#### Acceptance Criteria

1. WHEN a job is added to the queue THEN the BullMQ processor SHALL download the PDF from MinIO
2. WHEN the processor has the PDF THEN the processor SHALL call the Python parser service via HTTP
3. WHEN the parser returns events THEN the processor SHALL update the job record with results and set status to completed
4. WHEN the parser fails THEN the processor SHALL update the job record with the error and set status to failed
5. WHEN processing completes (success or failure) THEN the processor SHALL delete the PDF from MinIO

### Requirement 5

**User Story:** As a user, I want to authenticate with Google, so that I can add events directly to my Google Calendar.

#### Acceptance Criteria

1. WHEN a user visits `/api/auth/google` THEN the Backend SHALL redirect to Google OAuth with calendar scopes
2. WHEN Google redirects to `/api/auth/google/callback` with a valid code THEN the Backend SHALL exchange the code for access tokens
3. WHEN a user requests `/api/auth/status` THEN the Backend SHALL return whether the user has valid Google credentials
4. WHEN a user requests `/api/auth/logout` THEN the Backend SHALL clear the user's session and tokens

### Requirement 6

**User Story:** As an authenticated user, I want to manage my Google Calendars, so that I can choose where to add my schedule events.

#### Acceptance Criteria

1. WHEN an authenticated user requests `/api/calendars` THEN the Backend SHALL return a list of the user's Google Calendars
2. WHEN an authenticated user creates a calendar via POST `/api/calendars` THEN the Backend SHALL create a new Google Calendar and return its details
3. WHEN an authenticated user adds events via POST `/api/calendars/events` THEN the Backend SHALL add all provided events to the specified Google Calendar
4. WHEN the Google Calendar API returns an error THEN the Backend SHALL return a 500 status with CALENDAR_API_ERROR

### Requirement 7

**User Story:** As a user, I want to generate an ICS file from my parsed events, so that I can import them into any calendar application.

#### Acceptance Criteria

1. WHEN a user posts events to `/api/generate/ics` THEN the Backend SHALL generate a valid ICS file containing all provided events
2. WHEN generating ICS for recurring events THEN the Backend SHALL include RRULE with weekly recurrence until the semester end date
3. WHEN generating ICS for one-time events THEN the Backend SHALL create single-occurrence events with the specified date
4. WHEN the ICS generation completes THEN the Backend SHALL return the ICS file content with appropriate content-type header

### Requirement 8

**User Story:** As a developer, I want comprehensive API documentation, so that frontend developers can integrate with the backend easily.

#### Acceptance Criteria

1. WHEN the Backend starts THEN Swagger SHALL document all endpoints with request/response schemas
2. WHEN a DTO is defined THEN the DTO SHALL include ApiProperty decorators for Swagger documentation
3. WHEN an endpoint accepts file uploads THEN Swagger SHALL document the multipart/form-data format
4. WHEN an endpoint requires authentication THEN Swagger SHALL indicate the OAuth2 requirement

### Requirement 9

**User Story:** As a DevOps engineer, I want health check endpoints, so that I can monitor the backend service status.

#### Acceptance Criteria

1. WHEN a monitoring system requests `/health` THEN the Backend SHALL return the health status of all dependencies
2. WHEN the database connection is healthy THEN the health check SHALL report database status as up
3. WHEN any dependency is unhealthy THEN the health check SHALL report the specific failing component

### Requirement 10

**User Story:** As a developer, I want validated DTOs, so that invalid data is rejected before processing.

#### Acceptance Criteria

1. WHEN a request contains invalid data THEN the Backend SHALL return a 400 status with validation error details
2. WHEN a ParsedEvent is received THEN the Backend SHALL validate that startTime and endTime match the format `HH:MM`
3. WHEN a GenerateIcsDto is received THEN the Backend SHALL validate that semesterStart and semesterEnd are valid ISO date strings
4. WHEN an EventConfigDto is received THEN the Backend SHALL validate that all required fields are present and correctly typed
