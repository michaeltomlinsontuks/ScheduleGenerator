<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/upload/dto
researched_at_commit: 410140243e8024e19688be0c0911b04ee4c66dd6
sources:
  - path: backend/src/upload/dto/storage-quota-exceeded.dto.ts
    blob_sha: fb1af9c07ae996cf90f8ed18493b56901217e9fa
  - path: backend/src/upload/dto/storage-usage.dto.ts
    blob_sha: 81bd448603db9511faf29237860b60505a86848e
  - path: backend/src/upload/dto/upload-response.dto.ts
    blob_sha: c6b3120946d79fa220170067f821a6634e2bf8df
  - path: backend/src/upload/exceptions/storage-quota-exceeded.exception.ts
    blob_sha: 195d3a3fff9ab955fa38fc99e4277b96fbe2a9ba
  - path: backend/src/upload/upload.controller.ts
    blob_sha: 01ee7be39eee375d9143debe659f70136968eb2b
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/upload/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-upload-dto.7ff4b838`

StorageQuotaExceededDto is an exported class in backend/src/upload/dto/storage-quota-exceeded.dto.ts that models the HTTP 413 response body for a storage-quota-exceeded error, carrying statusCode, message, error, and a details object with currentUsage, quota, fileSize, and wouldExceedBy.

- `backend/src/upload/dto/storage-quota-exceeded.dto.ts` L1-L23 @fb1af9c07ae996cf90f8ed18493b56901217e9fa

### `research.backend-src-upload-dto.f24995c3`

The StorageQuotaExceededDto constructor fixes statusCode to 413, message to 'STORAGE_QUOTA_EXCEEDED', and error to 'Storage quota exceeded', and computes wouldExceedBy as currentUsage + fileSize - quota.

- `backend/src/upload/dto/storage-quota-exceeded.dto.ts` L12-L22 @fb1af9c07ae996cf90f8ed18493b56901217e9fa

### `research.backend-src-upload-dto.5fdc6946`

StorageQuotaExceededDto is instantiated by StorageQuotaExceededException, which passes the instance to HttpException with HttpStatus.PAYLOAD_TOO_LARGE.

- `backend/src/upload/exceptions/storage-quota-exceeded.exception.ts` L4-L12 @195d3a3fff9ab955fa38fc99e4277b96fbe2a9ba

### `research.backend-src-upload-dto.0f841c82`

StorageUsageDto is an exported class in backend/src/upload/dto/storage-usage.dto.ts that models storage usage with usedBytes, quotaBytes, usedPercentage, and availableBytes.

- `backend/src/upload/dto/storage-usage.dto.ts` L1-L13 @81bd448603db9511faf29237860b60505a86848e

### `research.backend-src-upload-dto.1f924985`

The StorageUsageDto constructor computes usedPercentage as Math.round((usedBytes / quotaBytes) * 100) and availableBytes as quotaBytes - usedBytes.

- `backend/src/upload/dto/storage-usage.dto.ts` L7-L12 @81bd448603db9511faf29237860b60505a86848e

### `research.backend-src-upload-dto.af8a9e0e`

UploadResponseDto is an exported class in backend/src/upload/dto/upload-response.dto.ts that models the upload endpoint's response, with jobId, pdfType, status, events, message, and semesterDates fields.

- `backend/src/upload/dto/upload-response.dto.ts` L6-L60 @c6b3120946d79fa220170067f821a6634e2bf8df

### `research.backend-src-upload-dto.0f7f178a`

In UploadResponseDto, jobId is a UUID string, pdfType is a PdfType enum value, status is 'completed' or 'failed', events is an optional ParsedEvent array, message is a string, and semesterDates is an optional object with semester ('S1' | 'S2' | null), startDate, and endDate.

- `backend/src/upload/dto/upload-response.dto.ts` L7-L59 @c6b3120946d79fa220170067f821a6634e2bf8df

### `research.backend-src-upload-dto.1c90203b`

UploadResponseDto decorates its fields with NestJS Swagger ApiProperty and class-validator decorators (IsUUID, IsEnum, IsString, IsArray, ValidateNested, IsOptional) and a class-transformer Type decorator.

- `backend/src/upload/dto/upload-response.dto.ts` L1-L4 @c6b3120946d79fa220170067f821a6634e2bf8df
- `backend/src/upload/dto/upload-response.dto.ts` L7-L59 @c6b3120946d79fa220170067f821a6634e2bf8df

### `research.backend-src-upload-dto.884c10ce`

UploadResponseDto imports PdfType and ParsedEvent from backend/src/common/types.ts.

- `backend/src/upload/dto/upload-response.dto.ts` L4-L4 @c6b3120946d79fa220170067f821a6634e2bf8df

### `research.backend-src-upload-dto.f2d958d5`

UploadResponseDto is the declared return type of UploadController.uploadPdf and UploadService.processUpload.

- `backend/src/upload/upload.controller.ts` L175-L175 @01ee7be39eee375d9143debe659f70136968eb2b
- `backend/src/upload/upload.service.ts` L37-L37 @383f116d920d0269c4a9d40eacf13b164dfa524f

## Open questions

None.
