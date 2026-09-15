<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/utils
researched_at_commit: 1536c6b6fc82a1b1d585caa5f922f274df7dfc88
sources:
  - path: frontend/src/utils/colors.ts
    blob_sha: 89bb9cf8b699a9ab8c3f46e457d07fc09f1d18fb
  - path: frontend/src/utils/dates.ts
    blob_sha: 0b15469dc66d3a7f83c46072d79f05559cccd5bf
  - path: frontend/src/utils/eventMapper.ts
    blob_sha: 66736d55fd4f51f5842f4979b5e16b17091aac19
  - path: frontend/src/utils/index.ts
    blob_sha: df45c2f325b69483ed75397ab786d6b21dd452c2
  - path: frontend/src/utils/stateManagement.ts
    blob_sha: 862cf535a103ab1926d1aa4bace3799a4e983cc5
  - path: frontend/src/utils/storage.test.ts
    blob_sha: 6c18ad4ff3eb99e32ad4183017cf062adc7f9e18
  - path: frontend/src/utils/storage.ts
    blob_sha: b0186b091df57537a2160c6978624e5107b317a2
  - path: frontend/src/utils/toast.test.ts
    blob_sha: 338328ca7b348a0d14da3b687a73f47cde4fd669
  - path: frontend/src/utils/toast.ts
    blob_sha: 3d55b7495a81955ef8c38f073b91eb06beeeb61f
  - path: frontend/src/utils/validation.ts
    blob_sha: 6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b
-->

# Research: frontend/src/utils

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-utils.aeae3538`

GOOGLE_CALENDAR_COLORS is a readonly array of 11 GoogleCalendarColor entries, each with an id, name, and hex value, matching the 11 predefined colors available in the Google Calendar API.

- `frontend/src/utils/colors.ts` L12-L24 @89bb9cf8b699a9ab8c3f46e457d07fc09f1d18fb

### `research.frontend-src-utils.6071d56c`

getColorById(id) returns the GoogleCalendarColor whose id matches the given id, or undefined when no color matches.

- `frontend/src/utils/colors.ts` L29-L31 @89bb9cf8b699a9ab8c3f46e457d07fc09f1d18fb

### `research.frontend-src-utils.9de19b1b`

getColorHex(id) returns the hex value for a color id, falling back to the hex of the first color in GOOGLE_CALENDAR_COLORS when the id is not found.

- `frontend/src/utils/colors.ts` L36-L39 @89bb9cf8b699a9ab8c3f46e457d07fc09f1d18fb

### `research.frontend-src-utils.16a130a7`

formatDateForInput(date) formats a Date as a YYYY-MM-DD string with zero-padded month and day, for use in input fields.

- `frontend/src/utils/dates.ts` L8-L13 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.d8a71fdf`

formatDateForDisplay(date) formats a Date for display using the en-US locale with a short month name, numeric day, and numeric year (e.g., "Jan 15, 2025").

- `frontend/src/utils/dates.ts` L18-L24 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.59e6ab4f`

formatDateRange(start, end) formats a date range for display, omitting the year from the start date when both dates fall in the same year.

- `frontend/src/utils/dates.ts` L29-L45 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.21cedf45`

parseDate(dateStr) parses a YYYY-MM-DD string into a Date object, returning null when the string does not represent a valid date.

- `frontend/src/utils/dates.ts` L50-L53 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.7858a9d1`

validateDateRange(start, end) returns the message "End date must be after start date" when the end date is not after the start date, and returns null when either date is missing or the range is valid.

- `frontend/src/utils/dates.ts` L59-L69 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.212eb8b0`

formatTime(time) converts a 24-hour HH:MM time string into a 12-hour display string with AM/PM (e.g., "8:30 AM").

- `frontend/src/utils/dates.ts` L74-L79 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.6febbfa9`

formatTimeRange(startTime, endTime) formats a time range for display by joining the two formatted times with " - " (e.g., "8:30 AM - 10:20 AM").

- `frontend/src/utils/dates.ts` L84-L86 @0b15469dc66d3a7f83c46072d79f05559cccd5bf

### `research.frontend-src-utils.bbb5f559`

isUnfinalised(event) returns true when the event's venue or date contains the text "tba" or "unfinalised" (case-insensitive), indicating an unfinalised exam schedule.

- `frontend/src/utils/eventMapper.ts` L19-L26 @66736d55fd4f51f5842f4979b5e16b17091aac19

### `research.frontend-src-utils.d7facff8`

mapEventToConfig(event, moduleColors) maps a single ParsedEvent into an EventConfig, building the summary from the module and activity, defaulting the colorId to '1' when the module has no assigned color, and adding a notes field warning that the schedule is unfinalised when isUnfinalised(event) is true.

- `frontend/src/utils/eventMapper.ts` L34-L56 @66736d55fd4f51f5842f4979b5e16b17091aac19

### `research.frontend-src-utils.e9bbeaed`

mapEventsToConfig(events, moduleColors) maps an array of ParsedEvents to an array of EventConfigs by applying mapEventToConfig to each event.

- `frontend/src/utils/eventMapper.ts` L64-L69 @66736d55fd4f51f5842f4979b5e16b17091aac19

### `research.frontend-src-utils.9a5af885`

index.ts is a barrel module that re-exports the public API of the colors, dates, eventMapper, validation, toast, storage, and stateManagement utility modules.

- `frontend/src/utils/index.ts` L1-L7 @df45c2f325b69483ed75397ab786d6b21dd452c2

### `research.frontend-src-utils.aab427c4`

clearWorkflowState() clears the event store's workflow state (events, selections, and job tracking state) and sessionStorage workflow data, logging success, and on failure shows an error toast and re-throws the error.

- `frontend/src/utils/stateManagement.ts` L28-L43 @862cf535a103ab1926d1aa4bace3799a4e983cc5

### `research.frontend-src-utils.3af1b0e1`

clearAllState() clears all workflow state and configuration preferences (module colors, semester dates, calendar selection) while preserving the user's theme preference, showing a success toast on completion and an error toast with re-throw on failure.

- `frontend/src/utils/stateManagement.ts` L57-L79 @862cf535a103ab1926d1aa4bace3799a4e983cc5

### `research.frontend-src-utils.68f23b20`

StorageType is a union type of 'localStorage' and 'sessionStorage', and StorageAdapter is an interface with getItem, setItem, removeItem, and clear methods.

- `frontend/src/utils/storage.ts` L7-L14 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.09a21098`

storage.ts defines two custom error classes, StorageQuotaExceededError and StorageUnavailableError, both extending Error and setting their name to the class name.

- `frontend/src/utils/storage.ts` L19-L31 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.4db9a6b0`

isStorageAvailable(type) probes the requested browser storage by writing and removing a test key, returning true when the operations succeed and false when they throw.

- `frontend/src/utils/storage.ts` L36-L46 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.c46d5742`

getStorageAdapter(type) returns a safe storage adapter wrapping the native browser storage when it is available, and otherwise warns the user and falls back to an in-memory storage adapter.

- `frontend/src/utils/storage.ts` L51-L63 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.5ed2f768`

createSafeStorageAdapter(storage, type) wraps getItem, setItem, removeItem, and clear with error handling: getItem returns null on failure, setItem recovers from quota-exceeded errors via handleQuotaExceeded and otherwise throws StorageUnavailableError, while removeItem and clear only log failures.

- `frontend/src/utils/storage.ts` L68-L113 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.f0c999d1`

createInMemoryStorage() creates a StorageAdapter backed by a Map, providing a working fallback when browser storage is unavailable.

- `frontend/src/utils/storage.ts` L118-L127 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.33edcda2`

clearWorkflowStorage() removes the 'schedule-events' key from sessionStorage via getStorageAdapter, logging but not re-throwing any failure.

- `frontend/src/utils/storage.ts` L132-L139 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.5b8ede5d`

checkStorageQuota() uses the navigator.storage.estimate() API when available to report whether usage is below 90% of quota, and otherwise reports storage as available.

- `frontend/src/utils/storage.ts` L144-L163 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.d5f9772e`

handleQuotaExceeded(storage, key, value, type) recovers from a quota-exceeded error in sessionStorage by removing the 'schedule-events' key and retrying the write with a warning toast, while for localStorage it shows an error toast and throws StorageQuotaExceededError.

- `frontend/src/utils/storage.ts` L182-L226 @b0186b091df57537a2160c6978624e5107b317a2

### `research.frontend-src-utils.514c2808`

showToast(message, options) creates a toast container with DaisyUI positioning classes when one does not exist, appends a toast element with role="alert" and type-based styling, and auto-removes the toast after the configured duration (default 5000ms) with a fade-out, removing the container when it becomes empty.

- `frontend/src/utils/toast.ts` L20-L56 @3d55b7495a81955ef8c38f073b91eb06beeeb61f

### `research.frontend-src-utils.fc2443da`

toast.ts provides four convenience functions, showErrorToast, showWarningToast, showSuccessToast, and showInfoToast, each delegating to showToast with the corresponding type.

- `frontend/src/utils/toast.ts` L61-L84 @3d55b7495a81955ef8c38f073b91eb06beeeb61f

### `research.frontend-src-utils.10727d12`

getContainerClass(position) returns Tailwind positioning classes for the toast container, defaulting to top-right for unknown positions, and getToastClass(type) returns DaisyUI alert styling classes for the toast type.

- `frontend/src/utils/toast.ts` L89-L118 @3d55b7495a81955ef8c38f073b91eb06beeeb61f

### `research.frontend-src-utils.46a08961`

validation.ts defines MAX_FILE_SIZE as 10MB in bytes, ACCEPTED_FILE_TYPES as ['application/pdf'], and ACCEPTED_EXTENSION as '.pdf'.

- `frontend/src/utils/validation.ts` L13-L23 @6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b

### `research.frontend-src-utils.689b9bea`

validateFileType(file) accepts a file when its MIME type is application/pdf or its name ends with the .pdf extension, returning the error "Please upload a PDF file" otherwise.

- `frontend/src/utils/validation.ts` L28-L40 @6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b

### `research.frontend-src-utils.01a09d10`

validateFileSize(file) rejects files larger than MAX_FILE_SIZE with the error "File must be under 10MB".

- `frontend/src/utils/validation.ts` L45-L54 @6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b

### `research.frontend-src-utils.53f51917`

validateFile(file) validates a file for upload by running type validation first and then size validation, returning the first failing result or a valid result when both pass.

- `frontend/src/utils/validation.ts` L59-L71 @6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b

### `research.frontend-src-utils.82357724`

formatFileSize(bytes) formats a byte count for display as B, KB, or MB with one decimal place (e.g., "2.5 MB", "500 KB").

- `frontend/src/utils/validation.ts` L76-L86 @6cca5ceb5b2ad099e7a5e01f44b4a3e152bdc32b

### `research.frontend-src-utils.98364cb7`

storage.test.ts verifies that isStorageAvailable returns true for available sessionStorage and localStorage and false when the storage access throws.

- `frontend/src/utils/storage.test.ts` L26-L53 @6c18ad4ff3eb99e32ad4183017cf062adc7f9e18

### `research.frontend-src-utils.68ef00d5`

storage.test.ts verifies that createInMemoryStorage produces a working adapter supporting setItem, getItem, removeItem, and clear, and returning null for non-existent keys.

- `frontend/src/utils/storage.test.ts` L55-L82 @6c18ad4ff3eb99e32ad4183017cf062adc7f9e18

### `research.frontend-src-utils.58a7da43`

storage.test.ts verifies that getStorageAdapter returns the native storage adapter when storage is available and falls back to in-memory storage when native storage is unavailable.

- `frontend/src/utils/storage.test.ts` L84-L108 @6c18ad4ff3eb99e32ad4183017cf062adc7f9e18

### `research.frontend-src-utils.5875d1ec`

storage.test.ts verifies that the safe storage adapter handles getItem, removeItem, and clear errors gracefully without throwing.

- `frontend/src/utils/storage.test.ts` L110-L155 @6c18ad4ff3eb99e32ad4183017cf062adc7f9e18

### `research.frontend-src-utils.453cb763`

storage.test.ts verifies that StorageQuotaExceededError and StorageUnavailableError are Error instances carrying the correct name and message.

- `frontend/src/utils/storage.test.ts` L157-L171 @6c18ad4ff3eb99e32ad4183017cf062adc7f9e18

### `research.frontend-src-utils.09cf8250`

toast.test.ts verifies that showToast creates a toast container when one does not exist, adds a toast element with the correct message text, applies info styling by default and the correct styling for each type, sets role="alert", and reuses an existing container for multiple toasts.

- `frontend/src/utils/toast.test.ts` L30-L95 @338328ca7b348a0d14da3b687a73f47cde4fd669

### `research.frontend-src-utils.804b86a6`

toast.test.ts verifies that the convenience functions showErrorToast, showWarningToast, showSuccessToast, and showInfoToast create toasts with the corresponding styling and message text.

- `frontend/src/utils/toast.test.ts` L97-L129 @338328ca7b348a0d14da3b687a73f47cde4fd669

### `research.frontend-src-utils.2b9c1409`

toast.test.ts verifies that toasts are auto-removed after the configured duration and that the container is removed when the last toast is removed.

- `frontend/src/utils/toast.test.ts` L131-L164 @338328ca7b348a0d14da3b687a73f47cde4fd669

## Open questions

None.
