<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/preview
researched_at_commit: d3ebaa55b57f293481291f7487fb443c0af5e7db
sources:
  - path: frontend/src/app/preview/page.tsx
    blob_sha: 4d167b8c1833e2c706bfa836435ace6d87217098
-->

# Research: frontend/src/app/preview

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-preview.fbdcc574`

The unit frontend/src/app/preview consists of a single source file, page.tsx, a Next.js client component declared with the 'use client' directive that default-exports the PreviewPage component.

- `frontend/src/app/preview/page.tsx` L1-L1 @4d167b8c1833e2c706bfa836435ace6d87217098
- `frontend/src/app/preview/page.tsx` L19-L19 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.b3310fff`

The PreviewPage component is documented as 'Preview Page - Display parsed events with selection and filtering' and cites requirements 6.1, 6.2, 6.9, 1.1, 2.1, 3.1, 7.1, and 7.5.

- `frontend/src/app/preview/page.tsx` L15-L18 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.61da71e8`

The page defines a DayOfWeek type restricted to the five weekdays Monday through Friday and a DAYS_ORDER constant listing those days in that order.

- `frontend/src/app/preview/page.tsx` L12-L13 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.73ddce6d`

The page keeps local state for the module filter (defaulting to 'all'), the active day (defaulting to 'Monday'), and the active date (defaulting to an empty string).

- `frontend/src/app/preview/page.tsx` L24-L26 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.74e2c157`

The page reads events, pdfType, selectedIds, and the toggleEvent, selectAll, and deselectAll actions from the event store, and moduleColors from the config store.

- `frontend/src/app/preview/page.tsx` L29-L37 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.d59f0bea`

The page invokes useWorkflowGuard('preview'), which redirects to the upload page when there are no events.

- `frontend/src/app/preview/page.tsx` L20-L21 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.28e99b46`

The page navigates to /customize when the user clicks Continue and to /upload when the user clicks Back.

- `frontend/src/app/preview/page.tsx` L116-L122 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.ee0fd1d8`

Events are grouped by day for lecture mode and by date for test and exam modes, with events within each group sorted by start time.

- `frontend/src/app/preview/page.tsx` L45-L89 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.297826ca`

The page computes a sorted list of date keys for test and exam modes and sets the active date to the first available date when the pdf type is not lecture and no date is active.

- `frontend/src/app/preview/page.tsx` L91-L109 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.0850ea0f`

The displayed events are selected from the active day's group in lecture mode or the active date's group in test and exam modes, and are further filtered by the selected module when a module other than 'all' is chosen.

- `frontend/src/app/preview/page.tsx` L136-L152 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.eca02c9c`

The page derives summary statistics for the total number of events, the number of selected events, and the number of unique modules.

- `frontend/src/app/preview/page.tsx` L111-L114 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.1c3166a2`

The page maps each module's color id from the config store to a hex color, returning undefined when a module has no color id.

- `frontend/src/app/preview/page.tsx` L124-L134 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.c6ddee13`

The page title depends on the pdf type: 'Lecture Schedule Preview' for lecture, 'Test Schedule Preview' for test, 'Exam Schedule Preview' for exam, and 'Preview Your Schedule' otherwise.

- `frontend/src/app/preview/page.tsx` L154-L166 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.a25a50c8`

The page renders a header containing the mode-dependent title, the subtitle 'Review and select events to include', and compact summary statistics for events, modules, and selected count.

- `frontend/src/app/preview/page.tsx` L168-L196 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.f825922a`

The page renders BulkActions and EventFilter controls, and a row of day tabs in lecture mode or date tabs in test and exam modes, each tab showing the count of events in that group.

- `frontend/src/app/preview/page.tsx` L198-L245 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.5ec29b20`

The page renders the filtered events as a grid of EventCard components showing selection state, module color, and pdf type, or an empty-state message naming the active day, date, or module when no events match.

- `frontend/src/app/preview/page.tsx` L247-L271 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.a41bc9c7`

The page renders Back and Continue navigation buttons, disables Continue when no events are selected, and shows a warning message asking the user to select at least one event when the selection is empty.

- `frontend/src/app/preview/page.tsx` L273-L291 @4d167b8c1833e2c706bfa836435ace6d87217098

### `research.frontend-src-app-preview.f6e2cbdb`

The page imports BulkActions, EventFilter, and EventCard from '@/components/preview', Button from '@/components/common', the event and config stores, the useWorkflowGuard hook, and the ParsedEvent type.

- `frontend/src/app/preview/page.tsx` L3-L10 @4d167b8c1833e2c706bfa836435ace6d87217098

## Open questions

None.
