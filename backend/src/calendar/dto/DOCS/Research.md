<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/calendar/dto
researched_at_commit: d4a98ce4d5db0c84aaf2eb4955255bad4ba81104
sources:
  - path: backend/src/calendar/calendar.controller.ts
    blob_sha: f0cba82c6f26744e13f1232d27140c819b3d4dea
  - path: backend/src/calendar/calendar.service.ts
    blob_sha: 018938deb74cc638fcd3b1be7a0417a85d5da606
  - path: backend/src/calendar/dto/add-events.dto.ts
    blob_sha: 0dabb96985db410a557f72bddf13c712832cd098
  - path: backend/src/calendar/dto/calendar-list.dto.ts
    blob_sha: 4b7274d6b757553a92f92b37f5ef94a1674402cc
  - path: backend/src/calendar/dto/event-config.dto.ts
    blob_sha: 2628724c17133af9f8b4da19e5f784445314e5d4
  - path: backend/src/calendar/dto/generate-ics.dto.ts
    blob_sha: 8a6a6039229d4c457c8dcba4eeea894f3671f07d
  - path: backend/src/calendar/dto/index.ts
    blob_sha: 1e0b1f29e2c5f4788119ce4ab91dc03efcf529df
  - path: backend/src/calendar/ics.service.ts
    blob_sha: 9b1a5bb865e888532ad4338ea221899be19df88a
  - path: backend/src/common/types.ts
    blob_sha: f9ce422cd0369be27778d0c86ffd5bd88d059c7f
-->

# Research: backend/src/calendar/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-calendar-dto.acc9046f`

The unit backend/src/calendar/dto contains five source files — add-events.dto.ts, calendar-list.dto.ts, event-config.dto.ts, generate-ics.dto.ts, and index.ts — which together define the calendar module's data-transfer objects.

- `backend/src/calendar/dto/add-events.dto.ts` L1-L64 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/calendar-list.dto.ts` L1-L47 @4b7274d6b757553a92f92b37f5ef94a1674402cc
- `backend/src/calendar/dto/event-config.dto.ts` L1-L111 @2628724c17133af9f8b4da19e5f784445314e5d4
- `backend/src/calendar/dto/generate-ics.dto.ts` L1-L56 @8a6a6039229d4c457c8dcba4eeea894f3671f07d
- `backend/src/calendar/dto/index.ts` L1-L4 @1e0b1f29e2c5f4788119ce4ab91dc03efcf529df

### `research.backend-src-calendar-dto.ba516a14`

AddEventsDto, exported from add-events.dto.ts, is the request body for adding events to a Google Calendar: it requires a calendarId string and an events array of EventConfigDto, and optionally accepts semesterStart and semesterEnd ISO date strings and a pdfType from the PdfType enum.

- `backend/src/calendar/dto/add-events.dto.ts` L7-L63 @0dabb96985db410a557f72bddf13c712832cd098

### `research.backend-src-calendar-dto.e0536527`

AddEventsDto's fields are validated with class-validator decorators — @IsString on calendarId, @IsArray with @ValidateNested({ each: true }) and @Type(() => EventConfigDto) on events, @IsOptional @IsDateString on semesterStart and semesterEnd, and @IsOptional @IsEnum(PdfType) on pdfType — and every field is documented with @ApiProperty or @ApiPropertyOptional from @nestjs/swagger.

- `backend/src/calendar/dto/add-events.dto.ts` L1-L5 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/add-events.dto.ts` L7-L63 @0dabb96985db410a557f72bddf13c712832cd098

### `research.backend-src-calendar-dto.06060975`

CalendarDto, exported from calendar-list.dto.ts, describes a Google Calendar with required id and summary string fields and optional description string, primary boolean, and backgroundColor string fields.

- `backend/src/calendar/dto/calendar-list.dto.ts` L5-L28 @4b7274d6b757553a92f92b37f5ef94a1674402cc

### `research.backend-src-calendar-dto.2ad7a509`

CalendarListDto, exported from calendar-list.dto.ts, wraps a list of calendars in a single required calendars field typed as CalendarDto[] and validated with @IsArray, @ValidateNested({ each: true }), and @Type(() => CalendarDto).

- `backend/src/calendar/dto/calendar-list.dto.ts` L30-L36 @4b7274d6b757553a92f92b37f5ef94a1674402cc

### `research.backend-src-calendar-dto.40e94606`

CreateCalendarDto, exported from calendar-list.dto.ts, is the request body for creating a new calendar: it requires a name string and optionally accepts a description string.

- `backend/src/calendar/dto/calendar-list.dto.ts` L38-L47 @4b7274d6b757553a92f92b37f5ef94a1674402cc

### `research.backend-src-calendar-dto.9500b6e7`

EventConfigDto, exported from event-config.dto.ts, describes a single calendar event with required id (UUID), summary, location, startTime, endTime, isRecurring (boolean), and colorId fields, and optional day, date, notes, and semester string fields.

- `backend/src/calendar/dto/event-config.dto.ts` L10-L111 @2628724c17133af9f8b4da19e5f784445314e5d4

### `research.backend-src-calendar-dto.9fc660bd`

EventConfigDto validates its id with @IsUUID and its startTime and endTime with @Matches(/^\d{2}:\d{2}$/) to enforce the HH:MM 24-hour format, with custom validation messages for the time fields.

- `backend/src/calendar/dto/event-config.dto.ts` L11-L16 @2628724c17133af9f8b4da19e5f784445314e5d4
- `backend/src/calendar/dto/event-config.dto.ts` L36-L54 @2628724c17133af9f8b4da19e5f784445314e5d4

### `research.backend-src-calendar-dto.7e196b5d`

GenerateIcsDto, exported from generate-ics.dto.ts, is the request body for generating an ICS file: it requires an events array of EventConfigDto and optionally accepts semesterStart and semesterEnd ISO date strings and a pdfType from the PdfType enum.

- `backend/src/calendar/dto/generate-ics.dto.ts` L7-L56 @8a6a6039229d4c457c8dcba4eeea894f3671f07d

### `research.backend-src-calendar-dto.4410e692`

index.ts re-exports all four DTO modules — event-config.dto.js, add-events.dto.js, calendar-list.dto.js, and generate-ics.dto.js — so the unit's DTOs are importable from a single entry point.

- `backend/src/calendar/dto/index.ts` L1-L4 @1e0b1f29e2c5f4788119ce4ab91dc03efcf529df

### `research.backend-src-calendar-dto.36976215`

add-events.dto.ts and generate-ics.dto.ts both import PdfType from ../../common/types.js, where PdfType is an enum with LECTURE, TEST, and EXAM members, and use it to type their optional pdfType field.

- `backend/src/calendar/dto/add-events.dto.ts` L5-L5 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/add-events.dto.ts` L51-L63 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/generate-ics.dto.ts` L5-L5 @8a6a6039229d4c457c8dcba4eeea894f3671f07d
- `backend/src/calendar/dto/generate-ics.dto.ts` L43-L55 @8a6a6039229d4c457c8dcba4eeea894f3671f07d
- `backend/src/common/types.ts` L1-L5 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-calendar-dto.d65e12ed`

The unit's DTOs are consumed by the calendar module's controller and services: calendar.controller.ts imports CalendarListDto, CalendarDto, CreateCalendarDto, AddEventsDto, and GenerateIcsDto; calendar.service.ts imports CalendarDto and EventConfigDto; and ics.service.ts imports EventConfigDto.

- `backend/src/calendar/calendar.controller.ts` L22-L28 @f0cba82c6f26744e13f1232d27140c819b3d4dea
- `backend/src/calendar/calendar.service.ts` L4-L5 @018938deb74cc638fcd3b1be7a0417a85d5da606
- `backend/src/calendar/ics.service.ts` L2-L2 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar-dto.a1c3c634`

All DTO classes in the unit use decorators from @nestjs/swagger (@ApiProperty, @ApiPropertyOptional), class-validator (@IsString, @IsArray, @IsBoolean, @IsDateString, @IsEnum, @IsOptional, @IsUUID, @Matches, @ValidateNested), and class-transformer (@Type) to document, validate, and transform request and response payloads.

- `backend/src/calendar/dto/add-events.dto.ts` L1-L3 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/calendar-list.dto.ts` L1-L3 @4b7274d6b757553a92f92b37f5ef94a1674402cc
- `backend/src/calendar/dto/event-config.dto.ts` L1-L8 @2628724c17133af9f8b4da19e5f784445314e5d4
- `backend/src/calendar/dto/generate-ics.dto.ts` L1-L3 @8a6a6039229d4c457c8dcba4eeea894f3671f07d

## Open questions

None.
