<!-- tyto-docs
tyto_docs: 1
kind: component
unit: backend/src/upload/dto
title: Dto
status: current
written_at_commit: d62229f998b8b1c6c6dbfe73a050c8b743e0717f
written_at: "2026-09-15T06:01:09.529Z"
research: backend/src/upload/dto/DOCS/Research.md
sources: []
accepted:
  at: "2026-09-15T06:04:24.632Z"
  commit: d62229f998b8b1c6c6dbfe73a050c8b743e0717f
  research_fingerprint: "sha256:e47935addfa92e24594c7b8ec3cf6123e7370a0511ec8ffc070af80c5e67088d"
  research_findings:
    - research.backend-src-upload-dto.0f7f178a
    - research.backend-src-upload-dto.0f841c82
    - research.backend-src-upload-dto.1c90203b
    - research.backend-src-upload-dto.1f924985
    - research.backend-src-upload-dto.5fdc6946
    - research.backend-src-upload-dto.7ff4b838
    - research.backend-src-upload-dto.884c10ce
    - research.backend-src-upload-dto.af8a9e0e
    - research.backend-src-upload-dto.f24995c3
    - research.backend-src-upload-dto.f2d958d5
  critic_pass: critic.backend-src-upload-dto.2
  sources:
    - path: backend/src/upload/dto/storage-quota-exceeded.dto.ts
      blob_sha: fb1af9c07ae996cf90f8ed18493b56901217e9fa
    - path: backend/src/upload/dto/storage-usage.dto.ts
      blob_sha: 81bd448603db9511faf29237860b60505a86848e
    - path: backend/src/upload/dto/upload-response.dto.ts
      blob_sha: c6b3120946d79fa220170067f821a6634e2bf8df
evidence: Dto.evidence.md
critic:
  attempts: 2
  findings: []
  review_complete: true
  sections_reviewed: 8
  sections_total: 8
  last_reviewed_document: "sha256:0f36cf9155faf172e8f129e939e3ec761ec34f181c2c003fcdbac52f1d1bb1e3"
  retired: []
-->

# Dto

<!-- tyto-docs:generated:status -->
> **Status: Current**
<!-- /tyto-docs:generated:status -->

## [Summary](Dto.evidence.md#summary)

The dto unit owns the upload module's data-transfer types: the response shape for the upload endpoint, the storage-usage report, and the storage-quota error body. Dependants can rely on these classes to carry the upload result, usage figures, and quota-exceeded details consistently across the controller, service, and exception layers. <!-- ev:research.backend-src-upload-dto.af8a9e0e --><sup>[1](Dto.evidence.md#research.backend-src-upload-dto.af8a9e0e)</sup> <!-- ev:research.backend-src-upload-dto.0f841c82 --><sup>[2](Dto.evidence.md#research.backend-src-upload-dto.0f841c82)</sup> <!-- ev:research.backend-src-upload-dto.7ff4b838 --><sup>[3](Dto.evidence.md#research.backend-src-upload-dto.7ff4b838)</sup>

## [Purpose and boundaries](Dto.evidence.md#purpose-and-boundaries)

| | |
|---|---|
| Owns | The upload module's data-transfer types: UploadResponseDto, the upload endpoint's response shape; StorageUsageDto, the storage-usage report; and StorageQuotaExceededDto, the HTTP 413 error body. <!-- ev:research.backend-src-upload-dto.af8a9e0e --><sup>[1](Dto.evidence.md#research.backend-src-upload-dto.af8a9e0e)</sup> <!-- ev:research.backend-src-upload-dto.0f841c82 --><sup>[2](Dto.evidence.md#research.backend-src-upload-dto.0f841c82)</sup> <!-- ev:research.backend-src-upload-dto.7ff4b838 --><sup>[3](Dto.evidence.md#research.backend-src-upload-dto.7ff4b838)</sup> |
| Uses | PdfType and ParsedEvent from backend/src/common/types.ts to type UploadResponseDto's pdfType and events fields, and NestJS Swagger, class-validator, and class-transformer decorators to describe and validate them. <!-- ev:research.backend-src-upload-dto.884c10ce --><sup>[4](Dto.evidence.md#research.backend-src-upload-dto.884c10ce)</sup> <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> |
| Does not own | StorageQuotaExceededException, which instantiates StorageQuotaExceededDto and passes it to HttpException with HttpStatus.PAYLOAD_TOO_LARGE; UploadController.uploadPdf and UploadService.processUpload, which declare UploadResponseDto as their return type. <!-- ev:research.backend-src-upload-dto.5fdc6946 --><sup>[6](Dto.evidence.md#research.backend-src-upload-dto.5fdc6946)</sup> <!-- ev:research.backend-src-upload-dto.f2d958d5 --><sup>[7](Dto.evidence.md#research.backend-src-upload-dto.f2d958d5)</sup> |

## [How it works](Dto.evidence.md#how-it-works)

Two of the DTOs — StorageUsageDto and StorageQuotaExceededDto — are plain classes built by explicit constructors; UploadResponseDto declares its fields with definite-assignment and decorators rather than a constructor. <!-- ev:research.backend-src-upload-dto.1f924985 --><sup>[8](Dto.evidence.md#research.backend-src-upload-dto.1f924985)</sup> <!-- ev:research.backend-src-upload-dto.f24995c3 --><sup>[9](Dto.evidence.md#research.backend-src-upload-dto.f24995c3)</sup> <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> UploadResponseDto is the upload endpoint's declared return type: UploadController.uploadPdf and UploadService.processUpload both return it, carrying the job id, the detected PDF type, the processing status, parsed events, a message, and detected semester dates. <!-- ev:research.backend-src-upload-dto.f2d958d5 --><sup>[7](Dto.evidence.md#research.backend-src-upload-dto.f2d958d5)</sup> <!-- ev:research.backend-src-upload-dto.af8a9e0e --><sup>[1](Dto.evidence.md#research.backend-src-upload-dto.af8a9e0e)</sup>

Its fields are typed: jobId is a UUID string, pdfType is a PdfType enum value, status is 'completed' or 'failed', events is an optional ParsedEvent array, and semesterDates is an optional object with semester, startDate, and endDate. <!-- ev:research.backend-src-upload-dto.0f7f178a --><sup>[10](Dto.evidence.md#research.backend-src-upload-dto.0f7f178a)</sup> Swagger ApiProperty and class-validator decorators (IsUUID, IsEnum, IsString, IsArray, ValidateNested, IsOptional) plus a class-transformer Type decorator describe and validate those fields. <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup>

StorageUsageDto models storage usage: its constructor takes usedBytes and quotaBytes, computes usedPercentage as Math.round((usedBytes / quotaBytes) * 100), and derives availableBytes as quotaBytes - usedBytes. <!-- ev:research.backend-src-upload-dto.0f841c82 --><sup>[2](Dto.evidence.md#research.backend-src-upload-dto.0f841c82)</sup> <!-- ev:research.backend-src-upload-dto.1f924985 --><sup>[8](Dto.evidence.md#research.backend-src-upload-dto.1f924985)</sup>

StorageQuotaExceededDto models the HTTP 413 response body for a storage-quota-exceeded error. Its constructor takes currentUsage, quota, and fileSize, fixes statusCode to 413, message to 'STORAGE_QUOTA_EXCEEDED', and error to 'Storage quota exceeded', and computes wouldExceedBy as currentUsage + fileSize - quota. <!-- ev:research.backend-src-upload-dto.7ff4b838 --><sup>[3](Dto.evidence.md#research.backend-src-upload-dto.7ff4b838)</sup> <!-- ev:research.backend-src-upload-dto.f24995c3 --><sup>[9](Dto.evidence.md#research.backend-src-upload-dto.f24995c3)</sup> StorageQuotaExceededException, in the upload exceptions unit, instantiates the DTO and passes it to HttpException with HttpStatus.PAYLOAD_TOO_LARGE. <!-- ev:research.backend-src-upload-dto.5fdc6946 --><sup>[6](Dto.evidence.md#research.backend-src-upload-dto.5fdc6946)</sup>

```mermaid
%% required: behaviour
flowchart LR
    Upload[UploadController.uploadPdf<br/>UploadService.processUpload] -->|declared return type| Response[UploadResponseDto<br/>jobId, pdfType, status, events, message, semesterDates]
    Usage[constructed from usedBytes, quotaBytes] -->|computes| Storage[StorageUsageDto<br/>usedPercentage, availableBytes]
    Exception[StorageQuotaExceededException] -->|instantiates| Quota[StorageQuotaExceededDto<br/>statusCode 413, details]
    Quota -->|passed to HttpException| Http[HttpStatus.PAYLOAD_TOO_LARGE]
```

## [Interfaces](Dto.evidence.md#interfaces)

| Name | Input | Output | Guarantee |
|---|---|---|---|
| UploadResponseDto | jobId (UUID), pdfType (PdfType), status ('completed' \| 'failed'), events (ParsedEvent[]), message, semesterDates | The upload endpoint's response object | Declared return type of UploadController.uploadPdf and UploadService.processUpload; fields described by Swagger and validated by class-validator <!-- ev:research.backend-src-upload-dto.af8a9e0e --><sup>[1](Dto.evidence.md#research.backend-src-upload-dto.af8a9e0e)</sup> <!-- ev:research.backend-src-upload-dto.0f7f178a --><sup>[10](Dto.evidence.md#research.backend-src-upload-dto.0f7f178a)</sup> <!-- ev:research.backend-src-upload-dto.f2d958d5 --><sup>[7](Dto.evidence.md#research.backend-src-upload-dto.f2d958d5)</sup> <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> |
| StorageUsageDto | usedBytes, quotaBytes — numbers | Storage usage with usedPercentage and availableBytes | Constructor derives usedPercentage and availableBytes from the two byte counts <!-- ev:research.backend-src-upload-dto.0f841c82 --><sup>[2](Dto.evidence.md#research.backend-src-upload-dto.0f841c82)</sup> <!-- ev:research.backend-src-upload-dto.1f924985 --><sup>[8](Dto.evidence.md#research.backend-src-upload-dto.1f924985)</sup> |
| StorageQuotaExceededDto | currentUsage, quota, fileSize — numbers | HTTP 413 response body with statusCode, message, error, and details | Constructor fixes statusCode 413 and message 'STORAGE_QUOTA_EXCEEDED', and computes wouldExceedBy <!-- ev:research.backend-src-upload-dto.7ff4b838 --><sup>[3](Dto.evidence.md#research.backend-src-upload-dto.7ff4b838)</sup> <!-- ev:research.backend-src-upload-dto.f24995c3 --><sup>[9](Dto.evidence.md#research.backend-src-upload-dto.f24995c3)</sup> |

<!-- tyto-docs:generated:endpoints -->
<!-- No framework adapter is active, so no endpoints were extracted for this unit. -->
<!-- /tyto-docs:generated:endpoints -->

## Source files

<!-- tyto-docs:generated:file-table -->
<!-- This unit owns no source files. -->
<!-- /tyto-docs:generated:file-table -->

## [Dependencies](Dto.evidence.md#dependencies)

| Dependency | Capability used | Why |
|---|---|---|
| backend/src/common/types.ts (PdfType, ParsedEvent) | Types for the PDF type and parsed events | UploadResponseDto types its pdfType and events fields with them <!-- ev:research.backend-src-upload-dto.884c10ce --><sup>[4](Dto.evidence.md#research.backend-src-upload-dto.884c10ce)</sup> |
| @nestjs/swagger (ApiProperty) | OpenAPI field descriptions | UploadResponseDto decorates its fields for Swagger documentation <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> |
| class-validator (IsUUID, IsEnum, IsString, IsArray, ValidateNested, IsOptional) | Runtime field validation | UploadResponseDto validates its fields with these decorators <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> |
| class-transformer (Type) | Nested type transformation | UploadResponseDto transforms the events array with the Type decorator <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> |

<!-- tyto-docs:generated:module-graph -->
```mermaid
%% tyto-docs:generated
flowchart LR
    backend_src_upload_dto["backend/src/upload/dto"]
    backend_src_common["backend/src/common"]
    backend_src_upload["backend/src/upload"]
    backend_src_upload_exceptions["backend/src/upload/exceptions"]
    backend_src_upload_dto --> backend_src_common
    backend_src_upload --> backend_src_upload_dto
    backend_src_upload_exceptions --> backend_src_upload_dto
```
<!-- /tyto-docs:generated:module-graph -->

## [Data model](Dto.evidence.md#data-model)

This unit declares three data-transfer entities — UploadResponseDto, StorageUsageDto, and StorageQuotaExceededDto. StorageUsageDto and StorageQuotaExceededDto are plain classes whose constructors fix or compute their fields; UploadResponseDto declares its fields with definite-assignment and decorators instead. <!-- ev:research.backend-src-upload-dto.1f924985 --><sup>[8](Dto.evidence.md#research.backend-src-upload-dto.1f924985)</sup> <!-- ev:research.backend-src-upload-dto.f24995c3 --><sup>[9](Dto.evidence.md#research.backend-src-upload-dto.f24995c3)</sup> <!-- ev:research.backend-src-upload-dto.1c90203b --><sup>[5](Dto.evidence.md#research.backend-src-upload-dto.1c90203b)</sup> The types they reference, PdfType and ParsedEvent, are owned by backend/src/common/types.ts. <!-- ev:research.backend-src-upload-dto.884c10ce --><sup>[4](Dto.evidence.md#research.backend-src-upload-dto.884c10ce)</sup>

<!-- tyto-docs:generated:erd -->
<!-- This leaf unit has no descendant scope for a focused ERD. -->
<!-- /tyto-docs:generated:erd -->

## [Decisions and limitations](Dto.evidence.md#decisions-and-limitations)

StorageQuotaExceededDto hard-codes its HTTP semantics: the constructor fixes statusCode to 413 and message to 'STORAGE_QUOTA_EXCEEDED', coupling the DTO to the quota error rather than a generic error body. <!-- ev:research.backend-src-upload-dto.f24995c3 --><sup>[9](Dto.evidence.md#research.backend-src-upload-dto.f24995c3)</sup> StorageUsageDto rounds usedPercentage to a whole number, so the reported percentage is an approximation. <!-- ev:research.backend-src-upload-dto.1f924985 --><sup>[8](Dto.evidence.md#research.backend-src-upload-dto.1f924985)</sup>

<!-- tyto-docs:generated:navigation -->
- **Direct dependencies:** [Src common](../../../common/DOCS/Common.md)
- **Used by:** [Src upload](../../DOCS/Upload.md), [Exceptions](../../exceptions/DOCS/Exceptions.md)
- **Schedule:** 23 of 43, wave 1
<!-- /tyto-docs:generated:navigation -->