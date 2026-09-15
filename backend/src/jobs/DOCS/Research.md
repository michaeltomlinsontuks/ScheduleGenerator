<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/jobs
researched_at_commit: a2515f424431f93a5c785619d0db30268d1b298e
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/jobs/index.ts
    blob_sha: 9a35039bd60d36d4c17db26fdd03a4ae90d5896a
  - path: backend/src/jobs/jobs.controller.ts
    blob_sha: e07b7a69267ec703b53a8e830eac82d985234025
  - path: backend/src/jobs/jobs.module.ts
    blob_sha: 3fefe46aabe5169d0a7404798cd03a2e9329be92
  - path: backend/src/jobs/jobs.service.ts
    blob_sha: f56bbebd2a62129e161f9b3e98114a2bbedb98ea
-->

# Research: backend/src/jobs

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-jobs.bffe2d79`

The JobsModule NestJS module declares JobsController as its controller and registers JobsService as both a provider and an export.

- `backend/src/jobs/jobs.module.ts` L5-L10 @3fefe46aabe5169d0a7404798cd03a2e9329be92

### `research.backend-src-jobs.e390b3e8`

The application root AppModule imports JobsModule to wire the jobs feature into the application.

- `backend/src/app.module.ts` L9-L9 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L29-L29 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src-jobs.8217c5a9`

The index.ts barrel file re-exports the jobs module, service, controller, and the DTO index.

- `backend/src/jobs/index.ts` L1-L5 @9a35039bd60d36d4c17db26fdd03a4ae90d5896a

### `research.backend-src-jobs.d01fa15b`

JobsService is an @Injectable() service whose getJobById method always throws a NotFoundException with status code 404 and message JOB_NOT_FOUND, because jobs are not stored in stateless mode.

- `backend/src/jobs/jobs.service.ts` L3-L24 @f56bbebd2a62129e161f9b3e98114a2bbedb98ea

### `research.backend-src-jobs.15c336b3`

JobsController is a NestJS controller mapped to the api/jobs route and tagged jobs for Swagger.

- `backend/src/jobs/jobs.controller.ts` L15-L16 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.4c4a7440`

JobsController injects JobsService through its constructor.

- `backend/src/jobs/jobs.controller.ts` L18-L18 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.06a68913`

JobsController imports JobStatusDto and JobResultDto from the jobs DTO index, JobStatus from the common types, and ErrorResponseDto from the common DTOs.

- `backend/src/jobs/jobs.controller.ts` L10-L13 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.289fb29a`

JobsController.getJobStatus handles GET api/jobs/:id, validates the id with ParseUUIDPipe, and returns a JobStatusDto assembled from the job returned by JobsService.getJobById.

- `backend/src/jobs/jobs.controller.ts` L20-L21 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L101-L114 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.8c37981b`

The getJobStatus endpoint is rate-limited to 100 requests per 60 seconds by the @Throttle decorator.

- `backend/src/jobs/jobs.controller.ts` L21-L21 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.681c0b98`

JobsController.getJobResult handles GET api/jobs/:id/result, validates the id with ParseUUIDPipe, and throws a BadRequestException with message JOB_NOT_COMPLETED when the job's status is not COMPLETED.

- `backend/src/jobs/jobs.controller.ts` L116-L116 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L257-L268 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.1070c31f`

When the job is completed, getJobResult returns a JobResultDto whose events are taken from job.result, defaulting to an empty array when the result is absent.

- `backend/src/jobs/jobs.controller.ts` L270-L273 @e07b7a69267ec703b53a8e830eac82d985234025

### `research.backend-src-jobs.111c1710`

Because JobsService.getJobById always throws a NotFoundException, both controller endpoints currently fail every request with a 404 JOB_NOT_FOUND response.

- `backend/src/jobs/jobs.controller.ts` L104-L104 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.controller.ts` L260-L260 @e07b7a69267ec703b53a8e830eac82d985234025
- `backend/src/jobs/jobs.service.ts` L13-L24 @f56bbebd2a62129e161f9b3e98114a2bbedb98ea

## Open questions

None.
