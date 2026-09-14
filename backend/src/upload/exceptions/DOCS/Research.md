<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/upload/exceptions
researched_at_commit: d3bd41dd2382f5789a727f7926a746d605ca012d
sources:
  - path: backend/src/upload/exceptions/storage-quota-exceeded.exception.ts
    blob_sha: 195d3a3fff9ab955fa38fc99e4277b96fbe2a9ba
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/upload/exceptions

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-upload-exceptions.4ca6495a`

The unit's only source file, storage-quota-exceeded.exception.ts, exports a single class, StorageQuotaExceededException, which extends NestJS's HttpException.

- `backend/src/upload/exceptions/storage-quota-exceeded.exception.ts` L1-L13 @195d3a3fff9ab955fa38fc99e4277b96fbe2a9ba

### `research.backend-src-upload-exceptions.eacb61cc`

StorageQuotaExceededException's constructor accepts currentUsage, quota, and fileSize as numbers, builds a StorageQuotaExceededDto response from them, and passes that response to the HttpException superclass together with HttpStatus.PAYLOAD_TOO_LARGE.

- `backend/src/upload/exceptions/storage-quota-exceeded.exception.ts` L5-L11 @195d3a3fff9ab955fa38fc99e4277b96fbe2a9ba

### `research.backend-src-upload-exceptions.6e62d2af`

UploadService.processUpload throws StorageQuotaExceededException when the uploaded file's size exceeds the service's 10MB per-file limit (MAX_FILE_SIZE).

- `backend/src/upload/upload.service.ts` L14-L14 @383f116d920d0269c4a9d40eacf13b164dfa524f
- `backend/src/upload/upload.service.ts` L41-L47 @383f116d920d0269c4a9d40eacf13b164dfa524f

## Open questions

None.
