# Requirements Document

## Introduction

This specification covers the completion of the UP Schedule Generator V3 frontend by implementing API service integration, Google OAuth authentication UI, and connecting the existing UI components to the backend services. The frontend currently has all UI pages and components built but uses simulated/mock data instead of actual API calls. This spec will bridge the frontend to the fully-implemented NestJS backend.

## Glossary

- **Frontend**: The Next.js 16 web application providing the user interface
- **Backend**: The NestJS API server handling PDF processing, authentication, and calendar operations
- **API Service**: TypeScript modules that encapsulate HTTP requests to backend endpoints
- **Google OAuth**: Authentication flow allowing users to grant calendar access permissions
- **Job Polling**: Periodic API requests to check PDF processing status
- **ICS File**: iCalendar format file for importing events into calendar applications
- **Access Token**: OAuth credential used to authenticate Google Calendar API requests
- **Session**: Server-side storage of user authentication state

## Requirements

### Requirement 1

**User Story:** As a developer, I want API service modules that communicate with the backend, so that the frontend can perform all operations through a consistent interface.

#### Acceptance Criteria

1. WHEN the API module is initialized THEN the Frontend SHALL create an Axios instance configured with the backend base URL and credentials mode
2. WHEN any API request is made THEN the Frontend SHALL include credentials for session-based authentication
3. WHEN an API request fails with a network error THEN the Frontend SHALL throw a descriptive error that can be caught by calling code
4. WHEN an API response contains an error status THEN the Frontend SHALL parse and throw the error message from the response body

### Requirement 2

**User Story:** As a user, I want to upload my PDF schedule and see real processing progress, so that I know my file is being handled correctly.

#### Acceptance Criteria

1. WHEN a user uploads a PDF file THEN the Frontend SHALL send a multipart/form-data POST request to the /api/upload endpoint
2. WHEN the upload request succeeds THEN the Frontend SHALL receive and store the job ID for status polling
3. WHEN a job ID is obtained THEN the Frontend SHALL poll the /api/jobs/:id endpoint every 1 second until status is complete or failed
4. WHEN job status becomes complete THEN the Frontend SHALL store the parsed events in the event store and navigate to preview
5. WHEN job status becomes failed THEN the Frontend SHALL display the error message from the job result

### Requirement 3

**User Story:** As a user, I want to authenticate with Google, so that I can add events directly to my Google Calendar.

#### Acceptance Criteria

1. WHEN a user clicks the Google login button THEN the Frontend SHALL redirect to the /api/auth/google endpoint
2. WHEN the OAuth callback completes THEN the Frontend SHALL check authentication status via /api/auth/status
3. WHEN authentication status returns authenticated:true THEN the Frontend SHALL display the user's profile information
4. WHEN a user clicks logout THEN the Frontend SHALL call /api/auth/logout and clear local auth state
5. WHEN the auth status endpoint returns authenticated:false THEN the Frontend SHALL show the login button instead of user profile

### Requirement 4

**User Story:** As an authenticated user, I want to select which Google Calendar to add events to, so that I can organize my schedule appropriately.

#### Acceptance Criteria

1. WHEN an authenticated user reaches the customize page THEN the Frontend SHALL fetch calendars from /api/calendars
2. WHEN calendars are fetched THEN the Frontend SHALL display a dropdown with calendar names and highlight the primary calendar
3. WHEN a user selects a calendar THEN the Frontend SHALL store the calendar ID in the config store
4. WHEN a user chooses to create a new calendar THEN the Frontend SHALL call POST /api/calendars with the provided name

### Requirement 5

**User Story:** As a user, I want to generate an ICS file from the backend, so that the file is properly formatted with all event details.

#### Acceptance Criteria

1. WHEN a user clicks Download ICS THEN the Frontend SHALL send selected events, colors, and dates to POST /api/generate/ics
2. WHEN the ICS generation succeeds THEN the Frontend SHALL trigger a file download with the response blob
3. WHEN ICS generation fails THEN the Frontend SHALL display an error alert with the failure reason

### Requirement 6

**User Story:** As an authenticated user, I want to add events to my Google Calendar, so that my schedule syncs automatically.

#### Acceptance Criteria

1. WHEN an authenticated user clicks Add to Google Calendar THEN the Frontend SHALL send events to POST /api/calendars/events
2. WHEN the calendar sync succeeds THEN the Frontend SHALL display a success message with the event count
3. WHEN the calendar sync fails with 401 THEN the Frontend SHALL prompt the user to re-authenticate
4. WHEN the calendar sync fails with other errors THEN the Frontend SHALL display the error message

### Requirement 7

**User Story:** As a user, I want visual feedback during all async operations, so that I understand what the application is doing.

#### Acceptance Criteria

1. WHILE an API request is in progress THEN the Frontend SHALL display a loading indicator on the triggering button
2. WHEN an API request completes successfully THEN the Frontend SHALL show a success notification
3. WHEN an API request fails THEN the Frontend SHALL show an error notification with actionable information
4. WHILE job polling is active THEN the Frontend SHALL display a progress indicator showing the current status

### Requirement 8

**User Story:** As a developer, I want custom React hooks for API operations, so that components can easily consume backend data.

#### Acceptance Criteria

1. WHEN useAuth hook is called THEN the Frontend SHALL return current auth status, user info, login function, and logout function
2. WHEN useUpload hook is called THEN the Frontend SHALL return upload function, progress state, and error state
3. WHEN useJobStatus hook is called with a job ID THEN the Frontend SHALL return current job status and auto-poll until complete
4. WHEN useCalendars hook is called THEN the Frontend SHALL return calendar list, loading state, and create calendar function
