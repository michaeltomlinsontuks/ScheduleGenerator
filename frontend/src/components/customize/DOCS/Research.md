<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/customize
researched_at_commit: 6e6a951789ba34349561146becbd1ba18540f239
sources:
  - path: frontend/src/components/customize/CalendarSelector.tsx
    blob_sha: 5017bf12209b2629328e801c01419e74c2b47a22
  - path: frontend/src/components/customize/ColorSwatch.tsx
    blob_sha: 0e1e6097bda5122bff5b9837597f450b7c29bbcd
  - path: frontend/src/components/customize/DateRangePicker.tsx
    blob_sha: c5d84f8d1d4a444a1a001127e700b942f5e10680
  - path: frontend/src/components/customize/ModuleColorPicker.tsx
    blob_sha: 482da083f22b7ccdcc38faa66358bf4d274273bd
  - path: frontend/src/components/customize/index.ts
    blob_sha: 4fc566fffd1c73583a4f1b3d22415dd1326f4e50
-->

# Research: frontend/src/components/customize

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-customize.f035b397`

The customize component directory owns four React components — CalendarSelector, ColorSwatch, DateRangePicker, and ModuleColorPicker — plus a barrel index file that re-exports them.

- `frontend/src/components/customize/index.ts` L1-L12 @4fc566fffd1c73583a4f1b3d22415dd1326f4e50

### `research.frontend-src-components-customize.68b3ae8e`

The index barrel re-exports each customize component and its props interface: ColorSwatch, ModuleColorPicker, DateRangePicker, and CalendarSelector.

- `frontend/src/components/customize/index.ts` L1-L12 @4fc566fffd1c73583a4f1b3d22415dd1326f4e50

### `research.frontend-src-components-customize.0a3898eb`

CalendarSelectorProps requires a calendars array, a selectedId, onSelect and onCreate callbacks, an isLoading flag, and an optional error message.

- `frontend/src/components/customize/CalendarSelector.tsx` L6-L13 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.c9b5358c`

ColorSwatchProps requires a colorId, a name, and a hex value, and accepts optional selected and onClick properties.

- `frontend/src/components/customize/ColorSwatch.tsx` L3-L9 @0e1e6097bda5122bff5b9837597f450b7c29bbcd

### `research.frontend-src-components-customize.9bdddf81`

DateRangePickerProps requires startDate and endDate values plus onStartChange and onEndChange callbacks, and accepts an optional error string.

- `frontend/src/components/customize/DateRangePicker.tsx` L5-L11 @c5d84f8d1d4a444a1a001127e700b942f5e10680

### `research.frontend-src-components-customize.fe945b7b`

ModuleColorPickerProps requires a modules array, a colors record mapping module names to color ids, and an onChange callback.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L6-L10 @482da083f22b7ccdcc38faa66358bf4d274273bd

### `research.frontend-src-components-customize.88aa4669`

CalendarSelector is a calendar selector dropdown with an option to create a new calendar, documented as covering requirements 4.2, 4.3, and 4.4.

- `frontend/src/components/customize/CalendarSelector.tsx` L15-L20 @5017bf12209b2629328e801c01419e74c2b47a22
- `frontend/src/components/customize/CalendarSelector.tsx` L21-L279 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.3a2d9382`

CalendarSelector renders a loading spinner with the text 'Loading calendars...' while the isLoading prop is true.

- `frontend/src/components/customize/CalendarSelector.tsx` L135-L142 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.9a1474d2`

CalendarSelector closes its dropdown and resets its create form state when a mousedown occurs outside the dropdown element.

- `frontend/src/components/customize/CalendarSelector.tsx` L40-L58 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.a89cc314`

CalendarSelector's create form trims the entered name, requires it to be non-empty, calls onCreate, and surfaces an error message on failure.

- `frontend/src/components/customize/CalendarSelector.tsx` L96-L123 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.a70392c2`

In the create form, pressing Enter triggers calendar creation and pressing Escape cancels it.

- `frontend/src/components/customize/CalendarSelector.tsx` L125-L133 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.320c84c5`

CalendarSelector imports the Calendar type from @/services/calendarService for its calendars prop.

- `frontend/src/components/customize/CalendarSelector.tsx` L3-L4 @5017bf12209b2629328e801c01419e74c2b47a22

### `research.frontend-src-components-customize.62d4f05d`

ColorSwatch renders a button showing a color circle and name, with a selected ring style, aria-pressed state, and a data-color-id attribute.

- `frontend/src/components/customize/ColorSwatch.tsx` L11-L38 @0e1e6097bda5122bff5b9837597f450b7c29bbcd

### `research.frontend-src-components-customize.ba4a1499`

DateRangePicker renders labeled Start Date and End Date inputs of type date for a semester date range, and shows an Alert when an error is provided.

- `frontend/src/components/customize/DateRangePicker.tsx` L39-L81 @c5d84f8d1d4a444a1a001127e700b942f5e10680

### `research.frontend-src-components-customize.ded4055e`

DateRangePicker converts Date values to yyyy-mm-dd strings for its date inputs via the formatDateForInput helper, and parses input values back into Date objects on change.

- `frontend/src/components/customize/DateRangePicker.tsx` L13-L16 @c5d84f8d1d4a444a1a001127e700b942f5e10680
- `frontend/src/components/customize/DateRangePicker.tsx` L25-L37 @c5d84f8d1d4a444a1a001127e700b942f5e10680
- `frontend/src/components/customize/DateRangePicker.tsx` L57-L57 @c5d84f8d1d4a444a1a001127e700b942f5e10680
- `frontend/src/components/customize/DateRangePicker.tsx` L70-L70 @c5d84f8d1d4a444a1a001127e700b942f5e10680

### `research.frontend-src-components-customize.e3c37fa6`

DateRangePicker imports the Alert component from @/components/common to display its error message.

- `frontend/src/components/customize/DateRangePicker.tsx` L3-L3 @c5d84f8d1d4a444a1a001127e700b942f5e10680

### `research.frontend-src-components-customize.d7088822`

ModuleColorPicker assigns a color to each module for identification in the calendar, rendering a color dropdown per module.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L12-L92 @482da083f22b7ccdcc38faa66358bf4d274273bd

### `research.frontend-src-components-customize.ced95b58`

ModuleColorPicker resolves a module's color from the colors prop, defaulting to color id '7' (Peacock, blue) when a module has no assigned color.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L23-L26 @482da083f22b7ccdcc38faa66358bf4d274273bd

### `research.frontend-src-components-customize.4a705995`

ModuleColorPicker defers rendering the interactive color dropdowns until after mount, showing a static placeholder list first to avoid hydration mismatch.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L17-L21 @482da083f22b7ccdcc38faa66358bf4d274273bd
- `frontend/src/components/customize/ModuleColorPicker.tsx` L28-L52 @482da083f22b7ccdcc38faa66358bf4d274273bd

### `research.frontend-src-components-customize.486aad9d`

ColorDropdown lists every Google Calendar color, marks the currently assigned one as active, and closes when a color is selected or a click occurs outside it.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L101-L170 @482da083f22b7ccdcc38faa66358bf4d274273bd

### `research.frontend-src-components-customize.4f3a0599`

ModuleColorPicker imports GOOGLE_CALENDAR_COLORS and getColorById from @/utils/colors to build its color palette.

- `frontend/src/components/customize/ModuleColorPicker.tsx` L3-L4 @482da083f22b7ccdcc38faa66358bf4d274273bd

## Open questions

None.
