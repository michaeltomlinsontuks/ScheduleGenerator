<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/customize
researched_at_commit: cf9d9a767e69a36347f8f343aab69bed189fbe7d
sources:
  - path: frontend/src/app/customize/page.tsx
    blob_sha: 7ced635fb7d8c26d104a61cbeaf81e21307d3dad
-->

# Research: frontend/src/app/customize

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-customize.6756b08f`

The unit consists of a single Next.js client component file, frontend/src/app/customize/page.tsx, which is marked 'use client' and exports a default function component named CustomizePage.

- `frontend/src/app/customize/page.tsx` L1-L1 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad
- `frontend/src/app/customize/page.tsx` L17-L17 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.c6412755`

The CustomizePage component is documented as the Customize Page, whose purpose is to assign colors to modules and set semester dates, and it references requirements 7.1, 7.7, 7.8, 7.9, 1.1, 2.1, 3.1, 7.2, and 7.5.

- `frontend/src/app/customize/page.tsx` L13-L16 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.0eaf846f`

The page imports ModuleColorPicker, DateRangePicker, and CalendarSelector from '@/components/customize', Button, Card, and Alert from '@/components/common', and hooks and stores from '@/stores/eventStore', '@/stores/configStore', '@/hooks/useAuth', '@/hooks/useCalendars', and '@/hooks/useWorkflowGuard'.

- `frontend/src/app/customize/page.tsx` L3-L11 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.6f4ed280`

The page calls useWorkflowGuard('customize'), which redirects to the preview page if no events or selections exist, per requirements 7.2 and 7.5.

- `frontend/src/app/customize/page.tsx` L20-L22 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.ff7d3a6c`

The page obtains isAuthenticated, isAuthLoading, and login from the useAuth hook, per requirement 4.1.

- `frontend/src/app/customize/page.tsx` L24-L25 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.0967392c`

The page obtains calendars, isCalendarsLoading, calendarsError, fetchCalendars, and createCalendar from the useCalendars hook, per requirements 4.1, 4.2, and 4.4.

- `frontend/src/app/customize/page.tsx` L27-L28 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.5e283c25`

The page reads selectedIds, getSelectedEvents, and pdfType from the event store.

- `frontend/src/app/customize/page.tsx` L30-L33 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.32e11e57`

The page reads semesterStart, semesterEnd, moduleColors, and selectedCalendarId from the config store, along with the setters setSemesterStart, setSemesterEnd, setModuleColor, and setSelectedCalendarId.

- `frontend/src/app/customize/page.tsx` L35-L43 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.796f3745`

uniqueModules is computed from the selected events' module names, deduplicated into a Set and returned as a sorted array.

- `frontend/src/app/customize/page.tsx` L45-L50 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.21254432`

dateError is 'End date must be after start date' when both semester dates are set and the end date is not after the start date, and undefined otherwise.

- `frontend/src/app/customize/page.tsx` L52-L60 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.6aba5291`

isValid requires at least one selected event; in lecture mode it additionally requires both semester dates to be set and no date error, while test and exam modes do not require semester dates, per requirements 1.1, 2.1, and 3.1.

- `frontend/src/app/customize/page.tsx` L62-L79 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.5cb83107`

A useEffect assigns a default color to each unique module that does not already have one, rotating through color ids 1 through 11.

- `frontend/src/app/customize/page.tsx` L81-L90 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.c5899d92`

A useEffect calls fetchCalendars when the user is authenticated and authentication is not loading, per requirement 4.1.

- `frontend/src/app/customize/page.tsx` L92-L97 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.cceae229`

handleCreateCalendar creates a calendar through createCalendar and sets the selected calendar id to the new calendar's id, logging errors that are otherwise handled by the useCalendars hook, per requirement 4.4.

- `frontend/src/app/customize/page.tsx` L99-L110 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.1cf75697`

handleBack navigates to '/preview' and handleGenerate navigates to '/generate' via the router.

- `frontend/src/app/customize/page.tsx` L112-L118 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.c76b6e71`

pageTitle is 'Customize Your Lecture Schedule' for lecture mode, 'Customize Your Test Schedule' for test mode, 'Customize Your Exam Schedule' for exam mode, and 'Customize Your Calendar' otherwise, per requirements 1.1, 2.1, and 3.1.

- `frontend/src/app/customize/page.tsx` L120-L132 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.738c8769`

pageSubtitle is 'Assign colors to your modules and set your semester dates' for lecture mode and 'Assign colors to your modules' otherwise.

- `frontend/src/app/customize/page.tsx` L134-L139 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.739a2070`

The component returns null until it has mounted, using an isMounted state flag set in a useEffect, to guard against hydration mismatches.

- `frontend/src/app/customize/page.tsx` L141-L149 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.fb217982`

The page renders a centered header with the page title and subtitle, and a two-column grid whose left column holds a Card with the ModuleColorPicker and whose right column holds the DateRangePicker for lecture mode or an info Alert for test and exam modes, plus a Google Calendar Integration card.

- `frontend/src/app/customize/page.tsx` L151-L199 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.f5be4417`

The Google Calendar Integration card shows a CalendarSelector when authenticated and a 'Continue with Google' sign-in button that calls login when not, per requirements 4.1, 4.2, 4.3, and 4.4.

- `frontend/src/app/customize/page.tsx` L201-L255 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.e5046c1e`

The page renders a Back button that navigates to '/preview' and a Generate Calendar button that navigates to '/generate' and is disabled when the form is not valid.

- `frontend/src/app/customize/page.tsx` L259-L271 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

### `research.frontend-src-app-customize.173537de`

In lecture mode, when the form is invalid and there is no date error, the page shows the message 'Please set both start and end dates to continue'.

- `frontend/src/app/customize/page.tsx` L273-L277 @7ced635fb7d8c26d104a61cbeaf81e21307d3dad

## Open questions

None.
