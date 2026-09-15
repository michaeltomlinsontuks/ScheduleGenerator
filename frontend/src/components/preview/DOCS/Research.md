<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/preview
researched_at_commit: 06b8256dc758063007c43d842b98af24bf60c3ec
sources:
  - path: frontend/src/components/preview/BulkActions.tsx
    blob_sha: 08e0ce8da3c1793dd840b97201c2793429c880cd
  - path: frontend/src/components/preview/EventCard.tsx
    blob_sha: f7f973a57ceb2503a2bc06cfb1293efbd51f5027
  - path: frontend/src/components/preview/EventFilter.tsx
    blob_sha: 427b819d69c531b35b46516497bb86b2b803e936
  - path: frontend/src/components/preview/EventList.tsx
    blob_sha: 8d42caf8f04b112e7066ccb4ee747d46113b683c
  - path: frontend/src/components/preview/index.ts
    blob_sha: b81528c9cde37064a5384d889f71c408de6c37e6
-->

# Research: frontend/src/components/preview

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-preview.e0c5eaae`

BulkActionsProps declares totalCount and selectedCount as numbers and onSelectAll and onDeselectAll as callbacks that take no arguments.

- `frontend/src/components/preview/BulkActions.tsx` L5-L10 @08e0ce8da3c1793dd840b97201c2793429c880cd

### `research.frontend-src-components-preview.affb8b6d`

BulkActions computes allSelected as selectedCount equal to totalCount with totalCount greater than zero, and noneSelected as selectedCount equal to zero.

- `frontend/src/components/preview/BulkActions.tsx` L22-L23 @08e0ce8da3c1793dd840b97201c2793429c880cd

### `research.frontend-src-components-preview.ab636713`

BulkActions renders a flex container with a 'Select All' outline small Button that invokes onSelectAll and is disabled when allSelected, a 'Deselect All' ghost small Button that invokes onDeselectAll and is disabled when noneSelected, and a span displaying '{selectedCount} of {totalCount} selected'.

- `frontend/src/components/preview/BulkActions.tsx` L25-L49 @08e0ce8da3c1793dd840b97201c2793429c880cd

### `research.frontend-src-components-preview.7c45d4cc`

BulkActions is a client component, its file beginning with the 'use client' directive, and it imports Button from '@/components/common'.

- `frontend/src/components/preview/BulkActions.tsx` L1-L3 @08e0ce8da3c1793dd840b97201c2793429c880cd

### `research.frontend-src-components-preview.5ea63197`

EventCardProps declares event as a ParsedEvent, selected as a boolean, onToggle as a callback that takes no arguments, colorHex as an optional string, and pdfType as an optional 'lecture' | 'test' | 'exam'.

- `frontend/src/components/preview/EventCard.tsx` L6-L12 @f7f973a57ceb2503a2bc06cfb1293efbd51f5027

### `research.frontend-src-components-preview.2f73fb33`

EventCard computes timeRange as '{event.startTime} - {event.endTime}' and eventTypeDisplay as the event activity with its first letter capitalised.

- `frontend/src/components/preview/EventCard.tsx` L19-L22 @f7f973a57ceb2503a2bc06cfb1293efbd51f5027

### `research.frontend-src-components-preview.a7bf4a97`

EventCard detects an unfinalised exam by checking, case-insensitively, whether the event venue or date contains 'unfinalised' or 'tba'.

- `frontend/src/components/preview/EventCard.tsx` L24-L32 @f7f973a57ceb2503a2bc06cfb1293efbd51f5027

### `research.frontend-src-components-preview.88e9c7e7`

EventCard renders a card div with a left border coloured by colorHex when provided, a selection checkbox checked by selected that invokes onToggle, the module code, an event type badge, an optional group badge, a '⚠️ Unfinalised' warning badge when isUnfinalised and pdfType is 'exam', the time range, the venue prefixed with a location pin, and a warning Alert when isUnfinalised.

- `frontend/src/components/preview/EventCard.tsx` L34-L97 @f7f973a57ceb2503a2bc06cfb1293efbd51f5027

### `research.frontend-src-components-preview.97fd0b5a`

EventCard is a client component, its file beginning with the 'use client' directive, and it imports the ParsedEvent type from '@/types' and Alert from '@/components/common'.

- `frontend/src/components/preview/EventCard.tsx` L1-L4 @f7f973a57ceb2503a2bc06cfb1293efbd51f5027

### `research.frontend-src-components-preview.17a645a9`

EventFilterProps declares modules as a string array, selectedModule as a string, and onChange as a callback that takes a module string.

- `frontend/src/components/preview/EventFilter.tsx` L3-L7 @427b819d69c531b35b46516497bb86b2b803e936

### `research.frontend-src-components-preview.37b32c6a`

EventFilter renders a form-control div containing a label 'Filter by Module' and a select whose value is selectedModule, whose onChange invokes onChange with the new value, and which lists an 'All Modules' option followed by one option per module.

- `frontend/src/components/preview/EventFilter.tsx` L13-L32 @427b819d69c531b35b46516497bb86b2b803e936

### `research.frontend-src-components-preview.67168661`

EventFilter is a client component, its file beginning with the 'use client' directive.

- `frontend/src/components/preview/EventFilter.tsx` L1-L1 @427b819d69c531b35b46516497bb86b2b803e936

### `research.frontend-src-components-preview.d7adc797`

EventListProps declares events as a ParsedEvent array, selectedIds as a Set of strings, onToggle as a callback that takes an event id string, filterModule as an optional string, and moduleColors as an optional record mapping module codes to color ids.

- `frontend/src/components/preview/EventList.tsx` L6-L12 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.6b2f9698`

DayOfWeek is a union of the five weekdays 'Monday' through 'Friday' and DAYS_ORDER is a constant array listing those five days in order.

- `frontend/src/components/preview/EventList.tsx` L14-L16 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.ad3ce1c1`

groupEventsByDay groups events into a record keyed by DayOfWeek, keeping only events whose day is one of the five weekdays, and sorts the events within each day by startTime using localeCompare.

- `frontend/src/components/preview/EventList.tsx` L21-L42 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.3ba49e5e`

EventList filters events by module when filterModule is set and not 'all'.

- `frontend/src/components/preview/EventList.tsx` L55-L58 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.9f15c40a`

EventList's getColorHex maps a module's color id from moduleColors to a hex colour through an inline colour map, returning undefined when the module has no color id.

- `frontend/src/components/preview/EventList.tsx` L63-L73 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.59d4ce8e`

EventList renders, for each day in DAYS_ORDER that has events, a heading with the day name and event count and a responsive grid of EventCard components whose selected state comes from selectedIds and whose onToggle invokes onToggle with the event id.

- `frontend/src/components/preview/EventList.tsx` L75-L102 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.acd583f5`

EventList renders a 'No events found' message when filteredEvents is empty, appending the filter module when one is active.

- `frontend/src/components/preview/EventList.tsx` L104-L108 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.28920490`

EventList is a client component, its file beginning with the 'use client' directive, and it imports the ParsedEvent type from '@/types' and EventCard from './EventCard'.

- `frontend/src/components/preview/EventList.tsx` L1-L4 @8d42caf8f04b112e7066ccb4ee747d46113b683c

### `research.frontend-src-components-preview.8d2e31a0`

index.ts is a barrel module that re-exports the EventCard, BulkActions, EventFilter and EventList components together with their prop types (EventCardProps, BulkActionsProps, EventFilterProps, EventListProps).

- `frontend/src/components/preview/index.ts` L1-L12 @b81528c9cde37064a5384d889f71c408de6c37e6

## Open questions

None.
