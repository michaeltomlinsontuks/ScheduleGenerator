<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/stores
researched_at_commit: 3dfb08a2c80c0207bf2f5de2692309c18f78fe1e
sources:
  - path: frontend/src/stores/authStore.ts
    blob_sha: feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193
  - path: frontend/src/stores/configStore.env.test.ts
    blob_sha: eb3ba1949148867a8b4ff3063a69fffe8ea35f1d
  - path: frontend/src/stores/configStore.persistence.test.ts
    blob_sha: 1066a59a4950895387f7fe7581c9a878580022ce
  - path: frontend/src/stores/configStore.ts
    blob_sha: 3ba36594afedca84446e1253b13f1dc90412c065
  - path: frontend/src/stores/eventStore.persistence.test.ts
    blob_sha: 7da79feeeea522f794e662517da614061fed7735
  - path: frontend/src/stores/eventStore.ts
    blob_sha: 30eec249caa18a9d184716235f1a106c2640c545
  - path: frontend/src/stores/index.ts
    blob_sha: dbccf872074ed11daca5f7246a883faaaf21fa3d
  - path: frontend/src/stores/stores.test.ts
    blob_sha: 8ad4e3c64213d589ad1c7559b2d1039765e8b812
-->

# Research: frontend/src/stores

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-stores.20919a0e`

The authStore module defines useAuthStore, a Zustand store managing authentication state with isAuthenticated, user, isLoading, and error fields, initialized with isAuthenticated false, user null, isLoading false, and error null.

- `frontend/src/stores/authStore.ts` L8-L13 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193
- `frontend/src/stores/authStore.ts` L24-L29 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193
- `frontend/src/stores/authStore.ts` L31-L31 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193

### `research.frontend-src-stores.fe06a322`

The auth store's checkStatus action calls authService.getStatus() and updates isAuthenticated and user from the response, silently resetting to an unauthenticated state without setting an error when the request fails.

- `frontend/src/stores/authStore.ts` L34-L52 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193

### `research.frontend-src-stores.877c6128`

The auth store's logout action sets isLoading while calling authService.logout(), clears authentication state on success, and records the error message on failure.

- `frontend/src/stores/authStore.ts` L54-L69 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193

### `research.frontend-src-stores.f9c68020`

The auth store's reset action restores the initial authentication state, and its setError action sets the error field directly.

- `frontend/src/stores/authStore.ts` L71-L73 @feb25b97324e1788c1fe5ae4b3ba6a39b3bd2193

### `research.frontend-src-stores.d8eccfe7`

The stores index module re-exports useEventStore and PdfType from eventStore, useConfigStore from configStore, and useAuthStore from authStore.

- `frontend/src/stores/index.ts` L1-L7 @dbccf872074ed11daca5f7246a883faaaf21fa3d

### `research.frontend-src-stores.603e01d8`

The configStore module defines useConfigStore, a Zustand store persisted with the persist middleware to localStorage under the key 'schedule-config' through getStorageAdapter('localStorage').

- `frontend/src/stores/configStore.ts` L94-L94 @3ba36594afedca84446e1253b13f1dc90412c065
- `frontend/src/stores/configStore.ts` L124-L125 @3ba36594afedca84446e1253b13f1dc90412c065
- `frontend/src/stores/configStore.ts` L187-L196 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.3a9b1ab0`

The config store state holds semesterStart and semesterEnd dates, a moduleColors record mapping module names to color ids, a light or dark theme, and a selectedCalendarId.

- `frontend/src/stores/configStore.ts` L10-L16 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.e60a5eba`

The config store derives initial semester dates from environment variables: getCurrentSemesterDefaults selects the current or next semester from the first and second semester start/end environment variables, falling back to the legacy NEXT_PUBLIC_SEMESTER_START_DATE and NEXT_PUBLIC_SEMESTER_END_DATE variables.

- `frontend/src/stores/configStore.ts` L36-L83 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.8d6d0a27`

The config store's dateStorage custom storage serializes Date values to ISO strings and revives ISO date strings back to Date objects, logging errors and showing toasts on failure.

- `frontend/src/stores/configStore.ts` L94-L122 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.40536261`

The config store's onRehydrateStorage handler resets the store to its initial state and shows a warning toast when rehydration fails, and applies environment-variable semester date defaults when rehydrated values are null.

- `frontend/src/stores/configStore.ts` L198-L220 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.e088b11b`

The config store exposes setSemesterStart, setSemesterEnd, setModuleColor, setTheme, setSelectedCalendarId and reset actions, each wrapped in error handling that logs the failure and shows an error toast.

- `frontend/src/stores/configStore.ts` L129-L185 @3ba36594afedca84446e1253b13f1dc90412c065

### `research.frontend-src-stores.cdecb433`

The eventStore module defines useEventStore, a Zustand store persisted with the persist middleware to sessionStorage under the key 'schedule-events' through getStorageAdapter('sessionStorage').

- `frontend/src/stores/eventStore.ts` L45-L45 @30eec249caa18a9d184716235f1a106c2640c545
- `frontend/src/stores/eventStore.ts` L74-L75 @30eec249caa18a9d184716235f1a106c2640c545
- `frontend/src/stores/eventStore.ts` L139-L148 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.7a3b944f`

The event store state holds parsed events, a Set of selected event ids, a job id, a job status, and a pdfType of 'lecture', 'test' or 'exam'.

- `frontend/src/stores/eventStore.ts` L12-L20 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.eb176372`

The event store's setEvents action stores the events, selects all of them by default, records the pdfType, and clears the config store's semester dates when the pdfType is not 'lecture'.

- `frontend/src/stores/eventStore.ts` L79-L96 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.d6fe83cb`

The event store's eventStorage custom storage serializes the selectedIds Set to an array and revives arrays back into Sets, logging errors and showing toasts on failure.

- `frontend/src/stores/eventStore.ts` L45-L72 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.2358d4de`

The event store exposes toggleEvent, selectAll, deselectAll and getSelectedEvents actions for managing the selection of events.

- `frontend/src/stores/eventStore.ts` L102-L131 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.2248b42b`

The event store's reset and clearWorkflowState actions restore the initial state, and its onRehydrateStorage handler resets the store and shows a warning toast when rehydration fails.

- `frontend/src/stores/eventStore.ts` L133-L137 @30eec249caa18a9d184716235f1a106c2640c545
- `frontend/src/stores/eventStore.ts` L150-L159 @30eec249caa18a9d184716235f1a106c2640c545

### `research.frontend-src-stores.3c8894ff`

Tests verify that the event store persists to sessionStorage and the config store persists to localStorage, keeping their data separate.

- `frontend/src/stores/stores.test.ts` L321-L378 @8ad4e3c64213d589ad1c7559b2d1039765e8b812

### `research.frontend-src-stores.af73850d`

Tests verify that the event store serializes selectedIds as an array in storage and restores it as a Set in memory, and that the config store serializes Date objects to ISO strings and restores them as Date objects.

- `frontend/src/stores/stores.test.ts` L460-L506 @8ad4e3c64213d589ad1c7559b2d1039765e8b812
- `frontend/src/stores/eventStore.persistence.test.ts` L51-L79 @7da79feeeea522f794e662517da614061fed7735
- `frontend/src/stores/configStore.persistence.test.ts` L88-L127 @1066a59a4950895387f7fe7581c9a878580022ce

### `research.frontend-src-stores.8136be6b`

Tests verify that both stores handle corrupted or missing storage data gracefully by falling back to initial state without crashing.

- `frontend/src/stores/stores.test.ts` L418-L456 @8ad4e3c64213d589ad1c7559b2d1039765e8b812
- `frontend/src/stores/eventStore.persistence.test.ts` L111-L119 @7da79feeeea522f794e662517da614061fed7735
- `frontend/src/stores/configStore.persistence.test.ts` L182-L192 @1066a59a4950895387f7fe7581c9a878580022ce

### `research.frontend-src-stores.734039f2`

Tests verify that setting events with pdfType 'test' or 'exam' clears the config store's semester dates while 'lecture' leaves them intact.

- `frontend/src/stores/stores.test.ts` L178-L223 @8ad4e3c64213d589ad1c7559b2d1039765e8b812

### `research.frontend-src-stores.c044a1ea`

Tests verify that the config store initializes semester dates from environment variables and treats invalid date strings as null.

- `frontend/src/stores/configStore.env.test.ts` L26-L67 @eb3ba1949148867a8b4ff3063a69fffe8ea35f1d

## Open questions

None.
