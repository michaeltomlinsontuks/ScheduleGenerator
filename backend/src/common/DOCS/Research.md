<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common
researched_at_commit: 93e5199a70863b34ffaeeaa2939a2992bc6d7d2b
sources:
  - path: backend/src/calendar/dto/add-events.dto.ts
    blob_sha: 0dabb96985db410a557f72bddf13c712832cd098
  - path: backend/src/calendar/dto/generate-ics.dto.ts
    blob_sha: 8a6a6039229d4c457c8dcba4eeea894f3671f07d
  - path: backend/src/common/types.ts
    blob_sha: f9ce422cd0369be27778d0c86ffd5bd88d059c7f
  - path: backend/src/common/validators/pdf-content.validator.ts
    blob_sha: e575a38a9d1480fc3c6290ebb98ab590bbab5530
  - path: backend/src/jobs/dto/job-result.dto.ts
    blob_sha: d8674fd7da58caba03fe07d59a38d3a5e924cc90
  - path: backend/src/jobs/dto/job-status.dto.ts
    blob_sha: c55a81e5f20a4f7a3443288ea7576b2c81117e63
  - path: backend/src/jobs/jobs.controller.ts
    blob_sha: e07b7a69267ec703b53a8e830eac82d985234025
  - path: backend/src/parser/parser.service.ts
    blob_sha: 7b5e30a20ce49603bc2cade6afaf32acef426549
  - path: backend/src/upload/dto/upload-response.dto.ts
    blob_sha: c6b3120946d79fa220170067f821a6634e2bf8df
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/common

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common.ff5bc729`

The unit's only source file, backend/src/common/types.ts, exports three shared declarations: the PdfType enum, the ParsedEvent interface, and the JobStatus enum.

- `backend/src/common/types.ts` L1-L26 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-common.65f47d6a`

PdfType is a string-valued enum whose members LECTURE, TEST, and EXAM map to the values 'lecture', 'test', and 'exam'.

- `backend/src/common/types.ts` L1-L5 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-common.75aee1be`

ParsedEvent is an interface with required id, module, activity, startTime, endTime, venue, and isRecurring fields, and optional group, day, date, and semester fields.

- `backend/src/common/types.ts` L7-L19 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-common.7fb2a50a`

JobStatus is a string-valued enum whose members PENDING, PROCESSING, COMPLETED, and FAILED map to the values 'pending', 'processing', 'completed', and 'failed'.

- `backend/src/common/types.ts` L21-L26 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-common.a5858b7f`

PdfType classifies the kind of PDF being processed: LECTURE denotes a recurring weekly schedule, TEST a one-time semester test schedule, and EXAM a one-time final exam schedule.

- `backend/src/jobs/dto/job-status.dto.ts` L28-L39 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-common.b02968d6`

JobStatus represents the lifecycle of a PDF processing job: PENDING means the job is queued and waiting to be processed, PROCESSING means it is being processed by the PDF worker, COMPLETED means it finished successfully, and FAILED means it failed.

- `backend/src/jobs/dto/job-status.dto.ts` L14-L26 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-common.f8a0ebc0`

The parser unit consumes ParsedEvent as the shape of a parsed event: ParserService.parsePdf returns Promise<ParsedEvent[]> and ParserResponse carries events: ParsedEvent[].

- `backend/src/parser/parser.service.ts` L8-L10 @7b5e30a20ce49603bc2cade6afaf32acef426549
- `backend/src/parser/parser.service.ts` L26-L26 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-common.42ee29f8`

backend/src/common/types.ts is imported by nine files across the calendar, jobs, parser, upload, and common/validators units.

- `backend/src/calendar/dto/add-events.dto.ts` L5-L5 @0dabb96985db410a557f72bddf13c712832cd098
- `backend/src/calendar/dto/generate-ics.dto.ts` L5-L5 @8a6a6039229d4c457c8dcba4eeea894f3671f07d
- `backend/src/common/validators/pdf-content.validator.ts` L1-L1 @e575a38a9d1480fc3c6290ebb98ab590bbab5530
- `backend/src/jobs/dto/job-result.dto.ts` L12-L12 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-status.dto.ts` L4-L4 @c55a81e5f20a4f7a3443288ea7576b2c81117e63
- `backend/src/jobs/jobs.controller.ts` L12-L12 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/parser/parser.service.ts` L5-L5 @7b5e30a20ce49603bc2cade6afaf32acef426549
- `backend/src/upload/dto/upload-response.dto.ts` L4-L4 @c6b3120946d79fa220170067f821a6634e2bf8df
- `backend/src/upload/upload.service.ts` L4-L4 @383f116d920d0269c4a9d40eacf13b164dfa524f

## Open questions

None.
