<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/demo
researched_at_commit: 7de17169b4d02f005b26e77c3f54b4d019ce63b9
sources:
  - path: frontend/src/app/demo/page.tsx
    blob_sha: 9476fbb11b2fdb76fb71931209bd79a5a591ce9b
-->

# Research: frontend/src/app/demo

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-demo.76170512`

The demo page is a Next.js client component (declared with the 'use client' directive at the top of the file) that imports common UI components (Button, Alert, Card, Loading, Modal), the Stepper layout component, preview components (EventList, BulkActions, EventFilter), customize components (ModuleColorPicker, DateRangePicker), the event and config stores, and the ParsedEvent type.

- `frontend/src/app/demo/page.tsx` L1-L11 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.8b8222cb`

The file defines MOCK_EVENTS, a constant array of seven ParsedEvent mock events covering modules COS 214, STK 220, and WTW 220, used to test the preview components.

- `frontend/src/app/demo/page.tsx` L13-L22 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.9e45057a`

DemoPage is the default export of the file and maintains local state for the modal open flag, the set of dismissed alerts, the current stepper step (restricted to 1-4), and the module filter.

- `frontend/src/app/demo/page.tsx` L24-L28 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.ba0f1eed`

DemoPage reads events, selected IDs, and store actions (setEvents, toggleEvent, selectAll, deselectAll) from the event store.

- `frontend/src/app/demo/page.tsx` L30-L36 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.8959102e`

On mount, DemoPage loads MOCK_EVENTS into the event store when the store is empty, and derives the sorted list of unique modules for the filter.

- `frontend/src/app/demo/page.tsx` L38-L46 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.3225166b`

DemoPage renders a Button component section demonstrating variants (primary, secondary, ghost, outline), sizes (sm, md, lg), and states (loading, disabled).

- `frontend/src/app/demo/page.tsx` L59-L89 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.bf339bf7`

DemoPage renders a Stepper section with an interactive stepper controlled by Previous and Next buttons (clamped to steps 1-4) and static step states 1 through 4.

- `frontend/src/app/demo/page.tsx` L91-L140 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.7e7a3a2d`

DemoPage renders an Alert section showing the four alert types (info, success, warning, error) and dismissible alerts with a reset button that clears the dismissed set.

- `frontend/src/app/demo/page.tsx` L142-L184 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.e1627b11`

DemoPage renders a Loading section showing the three sizes (sm, md, lg) both with and without accompanying text.

- `frontend/src/app/demo/page.tsx` L186-L207 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.addc4b26`

DemoPage renders a Card section showing a basic card, a bordered card, and a bordered card with a shadow and an action button.

- `frontend/src/app/demo/page.tsx` L210-L233 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.502c8228`

DemoPage renders a Modal section with an 'Open Modal' button and a modal titled 'Example Modal' that offers Cancel and Confirm actions and closes via its onClose handler.

- `frontend/src/app/demo/page.tsx` L235-L263 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.54d4881d`

DemoPage renders a combined example section that composes Card, Alert, Loading, and Button into an 'Upload Status' card.

- `frontend/src/app/demo/page.tsx` L265-L280 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.b7b829de`

DemoPage renders a preview components section with a summary card showing total events, module count, and selected count, followed by BulkActions, EventFilter, EventList, and a 'Reset Mock Events' button that reloads MOCK_EVENTS into the store.

- `frontend/src/app/demo/page.tsx` L282-L341 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.7781a80d`

DemoPage renders a navigation section with a link to the /customize page, labelled 'Go to Customize Page'.

- `frontend/src/app/demo/page.tsx` L346-L355 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

### `research.frontend-src-app-demo.f6ae26b3`

CustomizeDemo is a helper component that tests ModuleColorPicker and DateRangePicker, reading semester start, semester end, and module colors from the config store, validating that the end date is after the start date, and offering a 'Reset Config' button that calls the store's reset action.

- `frontend/src/app/demo/page.tsx` L360-L424 @9476fbb11b2fdb76fb71931209bd79a5a591ce9b

## Open questions

None.
