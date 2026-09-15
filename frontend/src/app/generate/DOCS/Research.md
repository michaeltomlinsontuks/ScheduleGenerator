<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/generate
researched_at_commit: 584eeb324f30cb33f7faa52f94e6526ceaa92a8d
sources:
  - path: frontend/src/app/generate/page.tsx
    blob_sha: 027f5fccc3097bf20383d071acaf1ecb7456d79a
-->

# Research: frontend/src/app/generate

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-generate.dffc1987`

The unit frontend/src/app/generate consists of a single source file, page.tsx, a Next.js client component declared with the 'use client' directive that default-exports the GeneratePage component.

- `frontend/src/app/generate/page.tsx` L1-L1 @027f5fccc3097bf20383d071acaf1ecb7456d79a
- `frontend/src/app/generate/page.tsx` L20-L20 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.8c50d72a`

The GeneratePage component is documented as 'Generate Page - Display summary and output options' and cites requirements 1.1, 1.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, and 7.5.

- `frontend/src/app/generate/page.tsx` L15-L18 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.0e728abf`

The page imports useMemo and useState from 'react', useRouter from 'next/navigation', Button, Card, and Alert from '@/components/common', and stores, hooks, services, and utilities from '@/stores/eventStore', '@/stores/configStore', '@/hooks/useAuth', '@/hooks/useWorkflowGuard', '@/services/calendarService', '@/utils/dates', '@/utils/colors', '@/utils/eventMapper', and '@/utils/stateManagement'.

- `frontend/src/app/generate/page.tsx` L3-L14 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.5fb38237`

The page calls useWorkflowGuard('generate'), which redirects the user when the workflow requirements for the generate step are not met.

- `frontend/src/app/generate/page.tsx` L22-L22 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.9df5d0df`

The page keeps local state for isGeneratingIcs, isSyncingCalendar, downloadStatus, syncStatus, errorMessage, and successMessage.

- `frontend/src/app/generate/page.tsx` L25-L30 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.ac58fe31`

The page obtains isAuthenticated and login from the useAuth hook.

- `frontend/src/app/generate/page.tsx` L33-L33 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.60f6dab7`

The page reads events, selectedIds, getSelectedEvents, reset, and pdfType from the event store.

- `frontend/src/app/generate/page.tsx` L36-L40 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.aa4a1844`

The page reads semesterStart, semesterEnd, moduleColors, selectedCalendarId, and reset from the config store.

- `frontend/src/app/generate/page.tsx` L43-L47 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.bcf12ca9`

The page computes selectedEvents from getSelectedEvents, uniqueModules as a sorted, deduplicated list of the selected events' module names, and dateRangeDisplay as the formatted semester date range or 'Not set' when either date is missing.

- `frontend/src/app/generate/page.tsx` L50-L62 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.a8c47d82`

handleDownloadICS maps the selected events to EventConfig format via mapEventsToConfig, calls calendarService.generateIcs, and downloads the returned blob as a file named 'schedule.ics', requiring semester dates in lecture mode and reporting success or error status.

- `frontend/src/app/generate/page.tsx` L65-L110 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.8f6ab7aa`

handleAddToGoogleCalendar signs the user in when not authenticated, requires semester dates in lecture mode and a selected calendar, maps events via mapEventsToConfig, calls calendarService.addEvents, and reports success or error, prompting re-authentication on 401 or unauthorized responses.

- `frontend/src/app/generate/page.tsx` L112-L165 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.086b7cce`

handleUploadAnother clears all workflow and config state via clearAllState and navigates to '/upload', falling back to resetEvents and resetConfig if clearAllState fails.

- `frontend/src/app/generate/page.tsx` L167-L180 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.98c279a7`

handleBack navigates to '/customize' via the router.

- `frontend/src/app/generate/page.tsx` L182-L184 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.9308e8e8`

clearAlerts resets downloadStatus, syncStatus, errorMessage, and successMessage to their idle or null values.

- `frontend/src/app/generate/page.tsx` L187-L192 @027f5fccc3097bf20383d071acaf1ecb7456d79a

### `research.frontend-src-app-generate.c5f8430f`

The page renders a centered header titled 'Generate Your Calendar' with the subtitle 'Review your configuration and download your calendar', success and error status alerts, a Configuration Summary card showing the selected events count, module count, date range, and module color preview, two output option cards for Download ICS and Add to Google Calendar, and Back and Upload Another PDF navigation buttons.

- `frontend/src/app/generate/page.tsx` L194-L378 @027f5fccc3097bf20383d071acaf1ecb7456d79a

## Open questions

None.
