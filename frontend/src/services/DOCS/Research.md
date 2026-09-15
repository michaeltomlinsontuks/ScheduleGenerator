<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/services
researched_at_commit: 1094f02a73e23b3938f3af36d2e6725e681fecec
sources:
  - path: frontend/src/services/api.ts
    blob_sha: 8dac4f0ebbb271a4e34e0a1fad95eda948e1dae2
  - path: frontend/src/services/authService.ts
    blob_sha: 8f736510501dba60bd82ba09d608fedac8bb935d
  - path: frontend/src/services/calendarService.ts
    blob_sha: b15acdae539b258dc22e6a11f8c50af08193b567
  - path: frontend/src/services/index.ts
    blob_sha: 60f08700b1fafa32ec69396b57c84ce4c518ee99
  - path: frontend/src/services/jobService.ts
    blob_sha: 2dbcdfe13b5e422c062a0ecb1e24fd45f75c9f12
  - path: frontend/src/services/uploadService.ts
    blob_sha: cdcea1e94ac03ef55b8ac64de139ea87718a779d
-->

# Research: frontend/src/services

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-services.f6d9e0f0`

api.ts exports a shared Axios instance, api, configured with a base URL from the NEXT_PUBLIC_API_URL environment variable (defaulting to http://localhost:3001), session-based authentication via withCredentials, and a JSON content-type header.

- `frontend/src/services/api.ts` L30-L36 @8dac4f0ebbb271a4e34e0a1fad95eda948e1dae2

### `research.frontend-src-services.159b31d8`

api.ts normalizes API and network errors: parseApiError returns the response body's message when present, otherwise the Axios error message, otherwise 'An error occurred', and a response interceptor throws a plain Error carrying that message.

- `frontend/src/services/api.ts` L15-L23 @8dac4f0ebbb271a4e34e0a1fad95eda948e1dae2
- `frontend/src/services/api.ts` L38-L45 @8dac4f0ebbb271a4e34e0a1fad95eda948e1dae2

### `research.frontend-src-services.d62fd990`

authService provides Google OAuth operations: getLoginUrl builds the backend Google login URL from the api base URL, optionally appending a returnUrl query parameter, getStatus fetches the current authentication status from /api/auth/status, and logout posts to /api/auth/logout.

- `frontend/src/services/authService.ts` L24-L46 @8f736510501dba60bd82ba09d608fedac8bb935d

### `research.frontend-src-services.41cf2849`

calendarService provides Google Calendar operations: listCalendars fetches /api/calendars, createCalendar posts a new calendar with a name and optional description, addEvents posts events to /api/calendars/events, and generateIcs posts to /api/generate/ics requesting a blob response for download.

- `frontend/src/services/calendarService.ts` L70-L97 @b15acdae539b258dc22e6a11f8c50af08193b567

### `research.frontend-src-services.534cf769`

jobService provides job polling operations: getStatus fetches /api/jobs/{jobId} and getResult fetches /api/jobs/{jobId}/result.

- `frontend/src/services/jobService.ts` L43-L55 @2dbcdfe13b5e422c062a0ecb1e24fd45f75c9f12

### `research.frontend-src-services.1c57fcaf`

uploadService.uploadPdf uploads a PDF file to /api/upload as multipart/form-data, reports upload progress through an optional onProgress callback, and returns parsed events directly in the response, so the upload flow is synchronous rather than poll-based.

- `frontend/src/services/uploadService.ts` L4-L18 @cdcea1e94ac03ef55b8ac64de139ea87718a779d
- `frontend/src/services/uploadService.ts` L23-L42 @cdcea1e94ac03ef55b8ac64de139ea87718a779d

### `research.frontend-src-services.8f53350e`

index.ts is the unit's barrel export, re-exporting api, parseApiError, authService, uploadService, jobService, calendarService and their public types.

- `frontend/src/services/index.ts` L1-L31 @60f08700b1fafa32ec69396b57c84ce4c518ee99

### `research.frontend-src-services.7ed6782a`

Every service in the unit routes its HTTP calls through the shared api instance imported from ./api.

- `frontend/src/services/authService.ts` L1-L1 @8f736510501dba60bd82ba09d608fedac8bb935d
- `frontend/src/services/calendarService.ts` L1-L1 @b15acdae539b258dc22e6a11f8c50af08193b567
- `frontend/src/services/jobService.ts` L1-L1 @2dbcdfe13b5e422c062a0ecb1e24fd45f75c9f12
- `frontend/src/services/uploadService.ts` L1-L1 @cdcea1e94ac03ef55b8ac64de139ea87718a779d

### `research.frontend-src-services.451b12b7`

The unit declares the domain types it exchanges with the backend: ApiError, AuthUser, AuthStatus, Calendar, CalendarListResponse, EventConfig, PdfType, GenerateIcsRequest, AddEventsRequest, AddEventsResponse, ParsedEvent, JobStatus, JobResult, and UploadResponse.

- `frontend/src/services/api.ts` L6-L10 @8dac4f0ebbb271a4e34e0a1fad95eda948e1dae2
- `frontend/src/services/authService.ts` L6-L19 @8f736510501dba60bd82ba09d608fedac8bb935d
- `frontend/src/services/calendarService.ts` L6-L65 @b15acdae539b258dc22e6a11f8c50af08193b567
- `frontend/src/services/jobService.ts` L6-L38 @2dbcdfe13b5e422c062a0ecb1e24fd45f75c9f12
- `frontend/src/services/uploadService.ts` L7-L18 @cdcea1e94ac03ef55b8ac64de139ea87718a779d

### `research.frontend-src-services.288f5df7`

uploadService.ts imports ParsedEvent from the '@/types' path alias while jobService.ts declares its own structurally identical ParsedEvent interface, so the event shape is defined in two places.

- `frontend/src/services/uploadService.ts` L2-L2 @cdcea1e94ac03ef55b8ac64de139ea87718a779d
- `frontend/src/services/jobService.ts` L6-L17 @2dbcdfe13b5e422c062a0ecb1e24fd45f75c9f12

## Open questions

None.
