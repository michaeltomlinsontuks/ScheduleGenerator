<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/filters
researched_at_commit: 6ef68f8b90fcc6c4e1481cfad214d2538151a7aa
sources:
  - path: backend/src/common/filters/http-exception.filter.ts
    blob_sha: 6efae5217b95230058b7804c072d82a641de6f05
  - path: backend/src/main.ts
    blob_sha: 0da6fa1450dd0c5db888411c1251ff4443abfc89
-->

# Research: backend/src/common/filters

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-filters.1f111551`

The unit's only source file, http-exception.filter.ts, defines the exported HttpExceptionFilter class, which implements NestJS's ExceptionFilter interface and is decorated with @Catch() so it handles every exception raised in the application.

- `backend/src/common/filters/http-exception.filter.ts` L1-L8 @6efae5217b95230058b7804c072d82a641de6f05
- `backend/src/common/filters/http-exception.filter.ts` L24-L25 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.2b8aaaa3`

HttpExceptionFilter is registered as a global filter in backend/src/main.ts, which imports it at line 9 and instantiates it in bootstrap via app.useGlobalFilters(new HttpExceptionFilter()).

- `backend/src/main.ts` L9-L9 @0da6fa1450dd0c5db888411c1251ff4443abfc89
- `backend/src/main.ts` L67-L67 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src-common-filters.8ad937c6`

The catch method derives the response status from the exception: an HttpException contributes its own status via getStatus(), while any other exception maps to HttpStatus.INTERNAL_SERVER_ERROR.

- `backend/src/common/filters/http-exception.filter.ts` L33-L36 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.fcc49163`

The catch method derives the response message from the exception: an HttpException contributes exception.message, while any other exception maps to the literal 'Internal server error'.

- `backend/src/common/filters/http-exception.filter.ts` L38-L41 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.4bfeab06`

The filter builds an ErrorResponse object carrying the status code, message, an ISO-8601 timestamp, the request URL as path, and the request's requestId when present.

- `backend/src/common/filters/http-exception.filter.ts` L43-L49 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.bda5b518`

The filter logs every caught exception through a NestJS Logger named 'ExceptionFilter', recording requestId, userId (defaulting to 'anonymous'), method, url, statusCode, error message, stack trace, and the request body, query, and params.

- `backend/src/common/filters/http-exception.filter.ts` L26-L26 @6efae5217b95230058b7804c072d82a641de6f05
- `backend/src/common/filters/http-exception.filter.ts` L51-L64 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.af259114`

The filter sends the error response to the client with response.status(status).json(errorResponse).

- `backend/src/common/filters/http-exception.filter.ts` L66-L66 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.afca5efd`

The unit exports an ErrorResponse interface with required statusCode: number, message: string, and timestamp: string fields and optional path?: string and requestId?: string fields.

- `backend/src/common/filters/http-exception.filter.ts` L11-L17 @6efae5217b95230058b7804c072d82a641de6f05

### `research.backend-src-common-filters.4e746b8d`

The unit defines a non-exported RequestWithContext interface that extends Express's Request with optional requestId?: string and userId?: string fields.

- `backend/src/common/filters/http-exception.filter.ts` L19-L22 @6efae5217b95230058b7804c072d82a641de6f05

## Open questions

None.
