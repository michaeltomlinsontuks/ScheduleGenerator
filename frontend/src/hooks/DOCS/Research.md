<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/hooks
researched_at_commit: 7e5ae2f99594266a7e7e740b473abbbffcff0588
sources:
  - path: frontend/src/hooks/index.ts
    blob_sha: 1db75e298559fbd65f886dd62a318fcae28f29ce
  - path: frontend/src/hooks/useAuth.ts
    blob_sha: 5bfa28fe55fa00f67741a38ac17d4a0b084b5199
  - path: frontend/src/hooks/useCalendars.ts
    blob_sha: 217e8b93a19dc4c6c19589be0109b96a264ce8a9
  - path: frontend/src/hooks/useJobStatus.ts
    blob_sha: 62f23c194bdab83bf05013e8b145a6c1fc0ba487
  - path: frontend/src/hooks/useUpload.ts
    blob_sha: 23e65197308cd940e0eeace7f4cbf9a29023e426
  - path: frontend/src/hooks/useWorkflowGuard.ts
    blob_sha: 07f4003a9f3a92e4a3573fa9d21e322e0228a33e
-->

# Research: frontend/src/hooks

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-hooks.4201f24c`

The frontend/src/hooks unit's index.ts re-exports the five hooks useAuth, useUpload, useJobStatus, useCalendars, and useWorkflowGuard, along with the WorkflowPage type.

- `frontend/src/hooks/index.ts` L4-L9 @1db75e298559fbd65f886dd62a318fcae28f29ce

### `research.frontend-src-hooks.113c0f9b`

useAuth returns authentication state (isAuthenticated, user, isLoading, error) and actions (login, logout, setError) sourced from the auth store.

- `frontend/src/hooks/useAuth.ts` L15-L46 @5bfa28fe55fa00f67741a38ac17d4a0b084b5199

### `research.frontend-src-hooks.d56cd0d3`

useAuth checks the authentication status once on mount, guarded by a hasChecked ref so the check runs only a single time.

- `frontend/src/hooks/useAuth.ts` L20-L26 @5bfa28fe55fa00f67741a38ac17d4a0b084b5199

### `research.frontend-src-hooks.ebfd4865`

useAuth's login action redirects the browser to the Google OAuth login URL built by authService.getLoginUrl, defaulting to the current page path when no return URL is provided.

- `frontend/src/hooks/useAuth.ts` L32-L35 @5bfa28fe55fa00f67741a38ac17d4a0b084b5199

### `research.frontend-src-hooks.cb57a817`

useCalendars returns the calendar list, loading state, error, and the fetchCalendars and createCalendar actions for managing Google Calendar operations.

- `frontend/src/hooks/useCalendars.ts` L22-L76 @217e8b93a19dc4c6c19589be0109b96a264ce8a9

### `research.frontend-src-hooks.b9e53794`

useCalendars' fetchCalendars loads all calendars for the authenticated user through calendarService.listCalendars and updates local state, setting an error message on failure.

- `frontend/src/hooks/useCalendars.ts` L30-L43 @217e8b93a19dc4c6c19589be0109b96a264ce8a9

### `research.frontend-src-hooks.18de8ea5`

useCalendars' createCalendar creates a calendar through calendarService.createCalendar and appends the created calendar to the local list, re-throwing any error after recording it.

- `frontend/src/hooks/useCalendars.ts` L51-L67 @217e8b93a19dc4c6c19589be0109b96a264ce8a9

### `research.frontend-src-hooks.435fd042`

useJobStatus returns the stored job status from the event store, mapping the store's 'complete' value to 'completed' for backward compatibility, and always reports isPolling as false.

- `frontend/src/hooks/useJobStatus.ts` L28-L50 @62f23c194bdab83bf05013e8b145a6c1fc0ba487

### `research.frontend-src-hooks.2e418d97`

useUpload returns upload, progress, isUploading, error, and reset for managing PDF file uploads.

- `frontend/src/hooks/useUpload.ts` L25-L96 @23e65197308cd940e0eeace7f4cbf9a29023e426

### `research.frontend-src-hooks.7014decc`

useUpload's upload action uploads a PDF through uploadService.uploadPdf with progress tracking, stores the returned job ID, and on completion stores the parsed events and job status and updates semester dates in the config store.

- `frontend/src/hooks/useUpload.ts` L40-L78 @23e65197308cd940e0eeace7f4cbf9a29023e426

### `research.frontend-src-hooks.189679a3`

useUpload's reset action clears the progress, isUploading, and error state.

- `frontend/src/hooks/useUpload.ts` L83-L87 @23e65197308cd940e0eeace7f4cbf9a29023e426

### `research.frontend-src-hooks.dee1cbf0`

useWorkflowGuard guards a workflow page and redirects to another page when the page's requirements are not met, waiting for store hydration before evaluating them.

- `frontend/src/hooks/useWorkflowGuard.ts` L35-L96 @07f4003a9f3a92e4a3573fa9d21e322e0228a33e

### `research.frontend-src-hooks.c7935c6d`

useWorkflowGuard requires events to be loaded for the preview page, and events plus at least one selected event for the customize and generate pages.

- `frontend/src/hooks/useWorkflowGuard.ts` L66-L75 @07f4003a9f3a92e4a3573fa9d21e322e0228a33e

### `research.frontend-src-hooks.10b5cdd4`

useWorkflowGuard redirects to /upload from preview, /preview from customize, and /customize from generate when requirements are not met.

- `frontend/src/hooks/useWorkflowGuard.ts` L78-L82 @07f4003a9f3a92e4a3573fa9d21e322e0228a33e

## Open questions

None.
