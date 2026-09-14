<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/parser
researched_at_commit: 87369fd19472142d7b940d0ee2eaf7b54ae99339
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/parser/index.ts
    blob_sha: 7224a7b4f286038343b880f5f0b506d2b781276f
  - path: backend/src/parser/parser.module.ts
    blob_sha: e084d9a004b3336c44d790f9d6a756c8055b7090
  - path: backend/src/parser/parser.service.ts
    blob_sha: 7b5e30a20ce49603bc2cade6afaf32acef426549
  - path: backend/src/upload/upload.module.ts
    blob_sha: 2a861a5d46640456d757cb7bf60451e40affc5c6
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/parser

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-parser.e56b44bf`

The unit backend/src/parser contains three source files: index.ts, parser.module.ts, and parser.service.ts.

- `backend/src/parser/index.ts` L1-L3 @7224a7b4f286038343b880f5f0b506d2b781276f
- `backend/src/parser/parser.module.ts` L1-L15 @e084d9a004b3336c44d790f9d6a756c8055b7090
- `backend/src/parser/parser.service.ts` L1-L96 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.96a8e4ef`

The unit's public entry point, backend/src/parser/index.ts, re-exports ParserModule from './parser.module.js', ParserService from './parser.service.js', and ParsedEventDto from './dto/parsed-event.dto.js'.

- `backend/src/parser/index.ts` L1-L3 @7224a7b4f286038343b880f5f0b506d2b781276f

### `research.backend-src-parser.93ab1aed`

ParserModule is a NestJS module that imports HttpModule registered with a 60000 millisecond timeout and maxRedirects 5, declares ParserService as a provider, and exports ParserService.

- `backend/src/parser/parser.module.ts` L5-L15 @e084d9a004b3336c44d790f9d6a756c8055b7090

### `research.backend-src-parser.7c1b30b5`

ParserService is an @Injectable() NestJS service that injects HttpService and ConfigService through its constructor and resolves the parser service URL from the 'parser.url' configuration value, defaulting to 'http://localhost:5000'.

- `backend/src/parser/parser.service.ts` L12-L24 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.3d5cb3fc`

The unit exports the ParserResponse interface, which declares a single events property holding an array of ParsedEvent.

- `backend/src/parser/parser.service.ts` L8-L10 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.1512ef80`

ParserService.parsePdf accepts a PDF buffer and a PdfType, builds a FormData payload containing the file (named 'schedule.pdf' with content type 'application/pdf') and the type, and POSTs it to the parser URL's /parse endpoint with a 60-second timeout.

- `backend/src/parser/parser.service.ts` L26-L46 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.87f7fa81`

parsePdf maps each event from the Python worker response to the backend ParsedEvent interface, normalizing field names (Module/module, Offered/offered, Activity/activity, Group/group, Day/day, Date/date, start_time/startTime, end_time/endTime, Venue/venue/location) and defaulting isRecurring to true when it is undefined.

- `backend/src/parser/parser.service.ts` L52-L65 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.bb50db71`

On failure, parsePdf logs the error via the NestJS logger and throws a new Error with the message 'Failed to parse PDF: <error message>'.

- `backend/src/parser/parser.service.ts` L68-L73 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.bf0fdbff`

The private generateEventId method generates a unique event ID using crypto.randomUUID when available, falling back to the generateUUIDv4 method.

- `backend/src/parser/parser.service.ts` L79-L84 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.bcfc00c5`

The private generateUUIDv4 method generates a UUID v4 string by replacing the template 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' with random hex digits.

- `backend/src/parser/parser.service.ts` L89-L95 @7b5e30a20ce49603bc2cade6afaf32acef426549

### `research.backend-src-parser.70006c63`

ParserModule is imported by the application root module (backend/src/app.module.ts) and by UploadModule (backend/src/upload/upload.module.ts), and ParserService is imported by UploadService (backend/src/upload/upload.service.ts).

- `backend/src/app.module.ts` L10-L10 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/upload/upload.module.ts` L4-L4 @2a861a5d46640456d757cb7bf60451e40affc5c6
- `backend/src/upload/upload.service.ts` L5-L5 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-parser.ac8c4268`

ParserService imports PdfType and ParsedEvent from backend/src/common/types.ts and FormData from the 'form-data' package.

- `backend/src/parser/parser.service.ts` L5-L6 @7b5e30a20ce49603bc2cade6afaf32acef426549

## Open questions

None.
