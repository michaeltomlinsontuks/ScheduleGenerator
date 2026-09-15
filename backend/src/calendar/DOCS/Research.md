<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/calendar
researched_at_commit: 9072fd689c6aa324b48baef4b5dadf7b85494024
sources:
  - path: backend/src/calendar/calendar.controller.ts
    blob_sha: f0cba82c6f26744e13f1232d27140c819b3d4dea
  - path: backend/src/calendar/calendar.module.ts
    blob_sha: 8f04eee7e74627c0777ffb29bef010a2d9f15ead
  - path: backend/src/calendar/calendar.service.ts
    blob_sha: 018938deb74cc638fcd3b1be7a0417a85d5da606
  - path: backend/src/calendar/ics.service.ts
    blob_sha: 9b1a5bb865e888532ad4338ea221899be19df88a
  - path: backend/src/calendar/index.ts
    blob_sha: e512bb5e33da5c1bdee28b01506348633563a9b4
-->

# Research: backend/src/calendar

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-calendar.c393c430`

CalendarModule is a NestJS module that imports HttpModule and AuthModule, registers CalendarController as its controller, and provides and exports GoogleCalendarService and IcsService.

- `backend/src/calendar/calendar.module.ts` L8-L13 @8f04eee7e74627c0777ffb29bef010a2d9f15ead

### `research.backend-src-calendar.2b59ee2e`

CalendarController is a NestJS controller mapped to the 'api' route prefix and tagged 'Calendar' in Swagger, and it depends on GoogleCalendarService, IcsService, AuthService, and ConfigService.

- `backend/src/calendar/calendar.controller.ts` L34-L42 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.ff0005af`

The GET api/calendars endpoint (listCalendars) returns the authenticated user's Google calendars as a CalendarListDto containing a calendars array.

- `backend/src/calendar/calendar.controller.ts` L44-L57 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.a993a83c`

The POST api/calendars endpoint (createCalendar) creates a new Google Calendar from a CreateCalendarDto carrying a name and optional description, and returns the created CalendarDto.

- `backend/src/calendar/calendar.controller.ts` L60-L79 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.fa2d817c`

The POST api/calendars/events endpoint (addEvents) adds parsed schedule events to a Google Calendar; when the payload contains recurring (lecture) events and semester dates are missing it derives them from the current semester and filters events to those matching the detected semester, throwing a 400 MISSING_SEMESTER_DATES HttpException when the semester cannot be determined automatically.

- `backend/src/calendar/calendar.controller.ts` L81-L170 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.884e28b4`

The POST api/generate/ics endpoint (generateIcs) generates an ICS file from the supplied events, applying the same semester derivation and semester filtering as addEvents, and sends it as a text/calendar attachment named schedule.ics.

- `backend/src/calendar/calendar.controller.ts` L172-L259 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.d59aaf87`

getCurrentSemesterInfo derives the current semester (S1 or S2) from the FIRST_SEMESTER_START, FIRST_SEMESTER_END, SECOND_SEMESTER_START, and SECOND_SEMESTER_END environment variables, returning the semester currently in progress, the next semester during a break, or null when any of the variables is unset.

- `backend/src/calendar/calendar.controller.ts` L264-L309 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.f2fecd25`

getAccessToken reads the access token from the request's session user via AuthService.getAccessToken and throws a 401 HttpException with the GOOGLE_AUTH_REQUIRED error code when the token is missing.

- `backend/src/calendar/calendar.controller.ts` L315-L328 @f0cba82c6f26744e13f1232d27140c819b3d4dea

### `research.backend-src-calendar.bf5a6451`

GoogleCalendarService is an injectable NestJS service that calls the Google Calendar v3 REST API at https://www.googleapis.com/calendar/v3 through HttpService, authenticating with the user's OAuth access token as a Bearer token.

- `backend/src/calendar/calendar.service.ts` L7-L7 @018938deb74cc638fcd3b1be7a0417a85d5da606
- `backend/src/calendar/calendar.service.ts` L52-L54 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.2dca828d`

GoogleCalendarService.listCalendars fetches GET /users/me/calendarList with the access token and maps each returned item to a CalendarDto carrying id, summary, description, primary, and backgroundColor.

- `backend/src/calendar/calendar.service.ts` L61-L84 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.803ee401`

GoogleCalendarService.createCalendar creates a calendar via POST /calendars with the given name as the summary and an optional description, returning the created calendar as a CalendarDto.

- `backend/src/calendar/calendar.service.ts` L93-L123 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.441cec18`

GoogleCalendarService.addEvents posts each event to POST /calendars/{calendarId}/events sequentially to avoid rate limiting, converting each EventConfigDto to Google Calendar event format first and delegating errors to handleGoogleApiError.

- `backend/src/calendar/calendar.service.ts` L134-L166 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.ded478de`

convertToGoogleEvent routes recurring events to createRecurringGoogleEvent, throwing an Error when semester dates are missing, and routes non-recurring events to createSingleGoogleEvent.

- `backend/src/calendar/calendar.service.ts` L171-L183 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.2e7a14c2`

createRecurringGoogleEvent builds a weekly recurring Google Calendar event with an RRULE of FREQ=WEEKLY;BYDAY=<day code>;UNTIL=<semester end>, local dateTime values and the Africa/Johannesburg timezone, starting on the first occurrence of the event's weekday on or after the semester start.

- `backend/src/calendar/calendar.service.ts` L188-L220 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.445c10fa`

createSingleGoogleEvent builds a one-time Google Calendar event from the event's date and start/end times with the Africa/Johannesburg timezone, adding the event's notes as the description when present.

- `backend/src/calendar/calendar.service.ts` L226-L257 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.441f9b4d`

toLocalISOString formats a Date as a local ISO string without UTC conversion, because the Google Calendar API expects local time when a timeZone is specified and toISOString() would introduce timezone offset issues.

- `backend/src/calendar/calendar.service.ts` L259-L267 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.8674fc85`

getFirstOccurrence computes the first occurrence of a recurring event as the first date on or after the semester start that falls on the event's weekday, defaulting to Monday when the day name is not recognised.

- `backend/src/calendar/calendar.service.ts` L272-L281 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.195d974f`

handleGoogleApiError converts Google API errors into HttpExceptions carrying the CALENDAR_API_ERROR error code, using the response status when present (a 401 maps to 'Google authentication expired. Please re-authenticate.') and falling back to 500 INTERNAL_SERVER_ERROR.

- `backend/src/calendar/calendar.service.ts` L286-L313 @018938deb74cc638fcd3b1be7a0417a85d5da606

### `research.backend-src-calendar.28d61066`

IcsService.generateIcs produces a complete iCalendar 2.0 document with BEGIN:VCALENDAR, VERSION:2.0, PRODID:-//UP Schedule Generator//EN, CALSCALE:GREGORIAN, and METHOD:PUBLISH, containing one VEVENT per event joined by CRLF, and throws an Error when a recurring event lacks semester dates.

- `backend/src/calendar/ics.service.ts` L39-L67 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.1b1f83ae`

IcsService.createRecurringEvent emits a VEVENT with a UID of <event id>@upschedulegen, DTSTAMP, DTSTART and DTEND, an RRULE of FREQ=WEEKLY;BYDAY=<day code>;UNTIL=<semester end date>, and escaped SUMMARY and LOCATION lines.

- `backend/src/calendar/ics.service.ts` L77-L99 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.0209c422`

IcsService.createSingleEvent emits a one-time VEVENT without an RRULE, adding a DESCRIPTION line from the event's notes when present.

- `backend/src/calendar/ics.service.ts` L106-L129 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.a1449049`

IcsService.formatDateTime formats a date and an HH:MM time as a local YYYYMMDDTHHMMSS string for iCalendar DTSTART and DTEND values.

- `backend/src/calendar/ics.service.ts` L154-L162 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.bc3e9708`

IcsService.formatDateOnly formats an ISO date string as a YYYYMMDD date for the RRULE UNTIL value.

- `backend/src/calendar/ics.service.ts` L169-L175 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.cddcfa48`

IcsService.formatNow formats the current UTC time as a YYYYMMDDTHHMMSSZ string for the DTSTAMP value.

- `backend/src/calendar/ics.service.ts` L181-L190 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.913fffb6`

IcsService.escapeText escapes backslashes, semicolons, commas, and newlines in text so it is safe for ICS fields.

- `backend/src/calendar/ics.service.ts` L197-L203 @9b1a5bb865e888532ad4338ea221899be19df88a

### `research.backend-src-calendar.eb000815`

The calendar index.ts barrel re-exports CalendarModule, GoogleCalendarService, IcsService, and the DTO index.

- `backend/src/calendar/index.ts` L1-L4 @e512bb5e33da5c1bdee28b01506348633563a9b4

## Open questions

None.
