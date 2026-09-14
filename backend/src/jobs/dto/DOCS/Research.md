<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/jobs/dto
researched_at_commit: 9d25b6bc7f50cd2b7e795fdc4e79a57886cdbeee
sources:
  - path: backend/src/jobs/dto/index.ts
    blob_sha: 3273d40bc62f1f09dce2d2f304346599777fc1a2
  - path: backend/src/jobs/dto/job-result.dto.ts
    blob_sha: d8674fd7da58caba03fe07d59a38d3a5e924cc90
  - path: backend/src/jobs/dto/job-status.dto.ts
    blob_sha: c55a81e5f20a4f7a3443288ea7576b2c81117e63
  - path: backend/src/jobs/jobs.controller.ts
    blob_sha: e07b7a69267ec703b53a8e830eac82d985234025
-->

# Research: backend/src/jobs/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-jobs-dto.3ca8491a`

The backend/src/jobs/dto unit contains three files: index.ts, which re-exports the two DTO modules; job-result.dto.ts, which defines ParsedEventDto and JobResultDto; and job-status.dto.ts, which defines JobStatusDto.

- `backend/src/jobs/dto/index.ts` L1-L2 @3273d40bc62f1f09dce2d2f304346599777fc1a2
- `backend/src/jobs/dto/job-result.dto.ts` L14-L14 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L107-L107 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-status.dto.ts` L6-L6 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-jobs-dto.e2eefccc`

backend/src/jobs/dto/index.ts is a barrel module that re-exports everything from './job-status.dto.js' and './job-result.dto.js'.

- `backend/src/jobs/dto/index.ts` L1-L2 @3273d40bc62f1f09dce2d2f304346599777fc1a2

### `research.backend-src-jobs-dto.30c730c8`

Both DTO files in the unit import shared types from backend/src/common/types.ts: job-result.dto.ts imports ParsedEvent, and job-status.dto.ts imports JobStatus and PdfType.

- `backend/src/jobs/dto/job-result.dto.ts` L12-L12 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-status.dto.ts` L4-L4 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-jobs-dto.37121d21`

ParsedEventDto implements the ParsedEvent interface from backend/src/common/types.ts and represents a single parsed calendar event.

- `backend/src/jobs/dto/job-result.dto.ts` L12-L12 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L14-L14 @d8674fd7da58caba03fe07d59a38d3a5e924cc90

### `research.backend-src-jobs-dto.ced7f633`

ParsedEventDto declares required id, module, activity, startTime, endTime, venue, and isRecurring fields, plus optional group, day, and date fields.

- `backend/src/jobs/dto/job-result.dto.ts` L14-L104 @d8674fd7da58caba03fe07d59a38d3a5e924cc90

### `research.backend-src-jobs-dto.554a1db5`

In ParsedEventDto, startTime and endTime are validated against the HH:MM 24-hour format by @Matches(/^\d{2}:\d{2}$/), id is validated with @IsUUID, isRecurring with @IsBoolean, and the optional group, day, and date fields are validated as strings with @IsOptional.

- `backend/src/jobs/dto/job-result.dto.ts` L19-L20 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L44-L46 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L54-L56 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L64-L66 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L72-L76 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L82-L86 @d8674fd7da58caba03fe07d59a38d3a5e924cc90
- `backend/src/jobs/dto/job-result.dto.ts` L103-L104 @d8674fd7da58caba03fe07d59a38d3a5e924cc90

### `research.backend-src-jobs-dto.16481720`

JobResultDto carries a UUID id and an events array of ParsedEventDto, validated with @IsArray, @ValidateNested({ each: true }), and @Type(() => ParsedEventDto).

- `backend/src/jobs/dto/job-result.dto.ts` L107-L126 @d8674fd7da58caba03fe07d59a38d3a5e924cc90

### `research.backend-src-jobs-dto.fa86a777`

JobStatusDto declares a UUID id, a status field typed by the JobStatus enum, a pdfType field typed by the PdfType enum, a createdAt Date, and optional completedAt (Date or null) and error (string or null) fields.

- `backend/src/jobs/dto/job-status.dto.ts` L6-L70 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-jobs-dto.66e75985`

In JobStatusDto, status and pdfType are validated with @IsEnum against JobStatus and PdfType respectively, createdAt and completedAt are validated with @IsDate and transformed with @Type(() => Date), and error is an optional string.

- `backend/src/jobs/dto/job-status.dto.ts` L25-L26 @c55a81e5f20a4f7a3443288ea7576b2c81117e63
- `backend/src/jobs/dto/job-status.dto.ts` L38-L39 @c55a81e5f20a4f7a3443288ea7576b2c81117e63
- `backend/src/jobs/dto/job-status.dto.ts` L45-L46 @c55a81e5f20a4f7a3443288ea7576b2c81117e63
- `backend/src/jobs/dto/job-status.dto.ts` L54-L57 @c55a81e5f20a4f7a3443288ea7576b2c81117e63
- `backend/src/jobs/dto/job-status.dto.ts` L68-L69 @c55a81e5f20a4f7a3443288ea7576b2c81117e63

### `research.backend-src-jobs-dto.f0a084ca`

backend/src/jobs/jobs.controller.ts imports JobStatusDto and JobResultDto from './dto/index.js' and uses them as the Swagger response types for the GET /api/jobs/:id and GET /api/jobs/:id/result endpoints.

- `backend/src/jobs/jobs.controller.ts` L11-L11 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L37-L37 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L103-L103 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L133-L133 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L259-L259 @e07b7a69267ec703b53a8e830eac82d985234025

## Open questions

None.
