<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/dto
researched_at_commit: 99b4d2789888aba8808bfab36ccf58919b09bd08
sources:
  - path: backend/src/common/dto/error-response.dto.ts
    blob_sha: 82c8ecaad720b64fcc39e308a8c4b5c1044ece99
  - path: backend/src/jobs/jobs.controller.ts
    blob_sha: e07b7a69267ec703b53a8e830eac82d985234025
  - path: backend/src/upload/upload.controller.ts
    blob_sha: 01ee7be39eee375d9143debe659f70136968eb2b
-->

# Research: backend/src/common/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-dto.d70f62b4`

The unit backend/src/common/dto contains a single source file, error-response.dto.ts, which defines and exports the ErrorResponseDto class.

- `backend/src/common/dto/error-response.dto.ts` L1-L33 @82c8ecaad720b64fcc39e308a8c4b5c1044ece99

### `research.backend-src-common-dto.3dc17d40`

ErrorResponseDto declares three required properties — statusCode (number), message (string), and timestamp (string) — each documented with the @ApiProperty decorator imported from @nestjs/swagger.

- `backend/src/common/dto/error-response.dto.ts` L1-L1 @82c8ecaad720b64fcc39e308a8c4b5c1044ece99
- `backend/src/common/dto/error-response.dto.ts` L4-L20 @82c8ecaad720b64fcc39e308a8c4b5c1044ece99

### `research.backend-src-common-dto.de431570`

ErrorResponseDto declares two optional properties — path (string) and details (string) — each documented with the @ApiPropertyOptional decorator imported from @nestjs/swagger.

- `backend/src/common/dto/error-response.dto.ts` L1-L1 @82c8ecaad720b64fcc39e308a8c4b5c1044ece99
- `backend/src/common/dto/error-response.dto.ts` L22-L32 @82c8ecaad720b64fcc39e308a8c4b5c1044ece99

### `research.backend-src-common-dto.8be4350b`

error-response.dto.ts is imported by backend/src/jobs/jobs.controller.ts and backend/src/upload/upload.controller.ts, where ErrorResponseDto is used as the type of @ApiResponse error responses.

- `backend/src/jobs/jobs.controller.ts` L13-L13 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L88-L88 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/upload/upload.controller.ts` L20-L20 @01ee7be39eee375d9143debe659f70136968eb2b
- `backend/src/upload/upload.controller.ts` L118-L118 @01ee7be39eee375d9143debe659f70136968eb2b

## Open questions

None.
