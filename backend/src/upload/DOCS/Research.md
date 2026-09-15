<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/upload
researched_at_commit: 7a91408556d2a22dae2e32d717dd8d5d58cc6797
sources:
  - path: backend/src/upload/index.ts
    blob_sha: b9103fb07421a1519573bb1626a6e038bdecdfa5
  - path: backend/src/upload/upload.controller.ts
    blob_sha: 01ee7be39eee375d9143debe659f70136968eb2b
  - path: backend/src/upload/upload.module.ts
    blob_sha: 2a861a5d46640456d757cb7bf60451e40affc5c6
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/upload

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-upload.c520e981`

UploadModule is a NestJS module that imports ParserModule, declares UploadController as its controller, provides UploadService, and exports UploadService.

- `backend/src/upload/upload.module.ts` L6-L13 @2a861a5d46640456d757cb7bf60451e40affc5c6

### `research.backend-src-upload.2d7939f6`

index.ts is a barrel file that re-exports UploadModule, UploadService, UploadController, and the upload-response DTO.

- `backend/src/upload/index.ts` L1-L4 @b9103fb07421a1519573bb1626a6e038bdecdfa5

### `research.backend-src-upload.6c2dff47`

UploadController maps the POST /api/upload endpoint, is tagged 'Upload' in Swagger, and throttles uploads to 5 per minute per client.

- `backend/src/upload/upload.controller.ts` L31-L38 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-upload.a78b71f0`

The upload endpoint accepts a multipart/form-data request with a single file field named 'file', and the uploaded file is validated by FileValidationPipe before processing.

- `backend/src/upload/upload.controller.ts` L47-L61 @01ee7be39eee375d9143debe659f70136968eb2b
- `backend/src/upload/upload.controller.ts` L172-L177 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-upload.de6a3d56`

UploadService is an injectable NestJS service whose constructor injects ParserService and ConfigService, and it enforces a 10MB per-file size limit via MAX_FILE_SIZE.

- `backend/src/upload/upload.service.ts` L11-L19 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.ff4e8daa`

UploadService.processUpload checks the uploaded file's buffer size against the 10MB limit and throws StorageQuotaExceededException when the file is too large.

- `backend/src/upload/upload.service.ts` L38-L47 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.a287c912`

processUpload validates the PDF content with validatePdfContent to determine the PDF type (lecture, test, or exam), and rethrows any validation error as a BadRequestException.

- `backend/src/upload/upload.service.ts` L49-L57 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.1c2ae083`

processUpload generates a random UUID job ID with uuidv4 for frontend compatibility; in stateless mode the ID is local to the request/response cycle.

- `backend/src/upload/upload.service.ts` L59-L68 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.390b08a8`

processUpload delegates PDF parsing to ParserService.parsePdf with the file buffer and the detected PDF type, and rethrows any parse failure as a BadRequestException prefixed with 'Failed to parse PDF:'.

- `backend/src/upload/upload.service.ts` L70-L79 @383f116d920d0269c4a9d40eacf13b164dfa524f
- `backend/src/upload/upload.service.ts` L142-L150 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.1acb5b6d`

processUpload filters parsed events by the current semester, keeping events with no semester info and year modules ('Y') or events matching the current semester, and reverts to the original events when filtering removes all of them.

- `backend/src/upload/upload.service.ts` L81-L133 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.b64e5ae9`

processUpload returns an UploadResponseDto containing the job ID, PDF type, status 'completed', the (filtered) parsed events, a success message, and semester dates when a semester was detected.

- `backend/src/upload/upload.service.ts` L152-L159 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.f9aa8124`

releaseStorageForJob is a deprecated no-op that returns immediately because stateless mode uses no storage.

- `backend/src/upload/upload.service.ts` L162-L169 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.32e10734`

getStorageUsage is a deprecated method that returns dummy values indicating empty storage, using MAX_FILE_SIZE as the quota.

- `backend/src/upload/upload.service.ts` L171-L188 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.9fb6b98f`

getCurrentSemesterInfo determines the current or next semester from the FIRST_SEMESTER_START, FIRST_SEMESTER_END, SECOND_SEMESTER_START, and SECOND_SEMESTER_END environment variables, returning null when any of them is not configured.

- `backend/src/upload/upload.service.ts` L190-L237 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.a5f9aecc`

getSemesterDates returns the configured start and end dates for a given semester ('S1' or 'S2'), or null when the semester's dates are not configured.

- `backend/src/upload/upload.service.ts` L239-L255 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-upload.4a5435f0`

UploadController.uploadPdf derives the user ID from the session's passport user and passes it to UploadService.processUpload, returning the resulting UploadResponseDto.

- `backend/src/upload/upload.controller.ts` L172-L178 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-upload.29dd44f7`

The upload endpoint's Swagger documentation describes a 201 success response with an UploadResponseDto, a 413 response for storage quota exceeded, and a 400 response for invalid file type, oversized file, invalid PDF content, or unrecognized format.

- `backend/src/upload/upload.controller.ts` L62-L171 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-upload.0ef9b720`

UploadController.uploadPdf applies FileValidationPipe to the uploaded file via the @UploadedFile decorator.

- `backend/src/upload/upload.controller.ts` L172-L175 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-upload.4286830d`

UploadService.processUpload throws StorageQuotaExceededException when the file size limit is exceeded and calls validatePdfContent to determine the PDF type.

- `backend/src/upload/upload.service.ts` L41-L52 @383f116d920d0269c4a9d40eacf13b164dfa524f

## Open questions

None.
