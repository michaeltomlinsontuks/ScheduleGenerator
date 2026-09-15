<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/upload
researched_at_commit: a1e551c096bfc43280b9ef6e8899030fc5f001f5
sources:
  - path: frontend/src/app/upload/page.tsx
    blob_sha: c5d3211ce0125032cccaa6324fd2281e68845788
-->

# Research: frontend/src/app/upload

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-upload.1dfb9cdd`

The frontend/src/app/upload unit contains a single source file, page.tsx, a Next.js App Router client component ('use client') that default-exports the UploadPage page component.

- `frontend/src/app/upload/page.tsx` L1-L1 @c5d3211ce0125032cccaa6324fd2281e68845788
- `frontend/src/app/upload/page.tsx` L12-L12 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.4e08417c`

UploadPage models its workflow with an UploadPhase state machine whose values are 'idle', 'uploading', 'processing', and 'resuming', initialized to 'idle'.

- `frontend/src/app/upload/page.tsx` L10-L10 @c5d3211ce0125032cccaa6324fd2281e68845788
- `frontend/src/app/upload/page.tsx` L15-L15 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.5c6de5b5`

The page derives a display status and error message from upload errors, job-status errors, the event store, and the current phase: errors take priority, a completed navigation with events present maps to 'complete', and the 'resuming' phase is displayed as 'processing'.

- `frontend/src/app/upload/page.tsx` L44-L65 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.f6387d2a`

On mount, when a job id exists in the event store but no events have been recorded, the page enters the 'resuming' phase so job-status polling can resume.

- `frontend/src/app/upload/page.tsx` L32-L41 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.9f594998`

Selecting or removing a file resets the phase to 'idle', clears the navigation flag, prevents the mount-time resume check, and resets the upload hook.

- `frontend/src/app/upload/page.tsx` L67-L81 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.e1e0b822`

The upload flow sets the phase to 'uploading', calls the upload function from useUpload with the selected file, and on success with parsed events marks navigation and redirects to /preview after an 800 ms delay; on failure it resets the phase to 'idle' to allow a retry.

- `frontend/src/app/upload/page.tsx` L83-L109 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.20aa94bc`

The retry handler clears the job id and job status in the event store, resets the phase to 'idle', clears the navigation flag, prevents the resume check, and resets the upload hook.

- `frontend/src/app/upload/page.tsx` L111-L119 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.52b1453f`

During the 'processing' phase the page simulates progress with a local processingProgress state that increments every 500 ms and is capped at 90%.

- `frontend/src/app/upload/page.tsx` L145-L158 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.ec70049a`

The page renders a DropZone when no file is selected and a FilePreview otherwise, an UploadProgress indicator during uploading, processing, complete, and error states, a 'Try Again' button on error, and an 'Upload & Process' button when a file is selected and the status is idle.

- `frontend/src/app/upload/page.tsx` L186-L232 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.4015880b`

The page depends on the useUpload and useJobStatus hooks from @/hooks, the useEventStore from @/stores/eventStore, the DropZone, FilePreview, and UploadProgress components from @/components/upload, and the Button component from @/components/common.

- `frontend/src/app/upload/page.tsx` L3-L8 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.4b13b959`

The page uses useRouter from next/navigation to navigate to the /preview route after a successful upload.

- `frontend/src/app/upload/page.tsx` L4-L4 @c5d3211ce0125032cccaa6324fd2281e68845788
- `frontend/src/app/upload/page.tsx` L98-L100 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.f55ff60a`

The page polls job status through useJobStatus while in the 'processing' or 'resuming' phases, using only the hook's error field for display.

- `frontend/src/app/upload/page.tsx` L26-L29 @c5d3211ce0125032cccaa6324fd2281e68845788
- `frontend/src/app/upload/page.tsx` L49-L50 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.974c9ab1`

The page computes a display progress value: the real upload progress while uploading, the simulated processing progress while processing, 100% when complete, and 0 otherwise.

- `frontend/src/app/upload/page.tsx` L160-L168 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.8c5555ce`

The page shows 'Resuming job...' while resuming, 'Processing PDF... This may take up to a minute.' while uploading or processing, and otherwise the derived error message.

- `frontend/src/app/upload/page.tsx` L170-L173 @c5d3211ce0125032cccaa6324fd2281e68845788

### `research.frontend-src-app-upload.4101c233`

The page contains an effect that emulates progress during the processing phase but never stores its computed value, making it dead code; the displayed simulated progress comes from a separate processingProgress state effect.

- `frontend/src/app/upload/page.tsx` L121-L158 @c5d3211ce0125032cccaa6324fd2281e68845788

## Open questions

None.
