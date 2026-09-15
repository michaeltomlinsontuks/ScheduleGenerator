<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/interceptors
researched_at_commit: 1081bd47561ed9209ce497ea400328ee20e650f6
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/common/guards/custom-throttler.guard.ts
    blob_sha: b6f3084e8bf49e97eee5f7543fbe0290a1d329cb
  - path: backend/src/common/interceptors/index.ts
    blob_sha: 28b59e352648b3d98109bc87b8e6bcd0638a7c7d
  - path: backend/src/common/interceptors/logging.interceptor.ts
    blob_sha: e617fdabb524c4558e1ed51422816794e93603aa
  - path: backend/src/common/interceptors/query-timeout.interceptor.ts
    blob_sha: 0f66cee0ef3cdda2661ee9f3a8ad0032b4899421
  - path: backend/src/common/interceptors/rate-limit-headers.interceptor.ts
    blob_sha: 0760a7438fbef30ddda99ac81ff14c0da34abf71
  - path: backend/src/main.ts
    blob_sha: 0da6fa1450dd0c5db888411c1251ff4443abfc89
-->

# Research: backend/src/common/interceptors

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-interceptors.a9c23c83`

The unit backend/src/common/interceptors contains three NestJS interceptors — LoggingInterceptor, QueryTimeoutInterceptor, and RateLimitHeadersInterceptor — each an @Injectable() class implementing NestInterceptor.

- `backend/src/common/interceptors/logging.interceptor.ts` L16-L17 @e617fdabb524c4558e1ed51422816794e93603aa
- `backend/src/common/interceptors/query-timeout.interceptor.ts` L11-L12 @0f66cee0ef3cdda2661ee9f3a8ad0032b4899421
- `backend/src/common/interceptors/rate-limit-headers.interceptor.ts` L19-L20 @0760a7438fbef30ddda99ac81ff14c0da34abf71

### `research.backend-src-common-interceptors.da60b4cd`

The unit's index.ts barrel file re-exports the rate-limit-headers and query-timeout interceptors, but does not re-export the logging interceptor.

- `backend/src/common/interceptors/index.ts` L1-L2 @28b59e352648b3d98109bc87b8e6bcd0638a7c7d

### `research.backend-src-common-interceptors.c22ec7bf`

The only repository files that import from this unit are backend/src/app.module.ts, which imports LoggingInterceptor, and backend/src/main.ts, which imports QueryTimeoutInterceptor.

- `backend/src/app.module.ts` L15-L15 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/main.ts` L10-L10 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src-common-interceptors.30699c65`

LoggingInterceptor is documented as adding a request ID and user ID to all log entries and logging request start and completion with timing information, using a Logger instance named 'HTTP'.

- `backend/src/common/interceptors/logging.interceptor.ts` L12-L18 @e617fdabb524c4558e1ed51422816794e93603aa

### `research.backend-src-common-interceptors.da54c6bb`

LoggingInterceptor.intercept generates or reuses a request ID from the x-request-id request header (falling back to a uuidv4), stores it on the request as requestId, and sets it as the X-Request-ID response header.

- `backend/src/common/interceptors/logging.interceptor.ts` L20-L28 @e617fdabb524c4558e1ed51422816794e93603aa

### `research.backend-src-common-interceptors.b7b8ed8b`

LoggingInterceptor extracts the user ID from request.user?.id, defaulting to 'anonymous', and stores it on the request as userId.

- `backend/src/common/interceptors/logging.interceptor.ts` L30-L32 @e617fdabb524c4558e1ed51422816794e93603aa

### `research.backend-src-common-interceptors.15edc3b0`

LoggingInterceptor logs an 'Incoming request' entry containing the requestId, userId, method, url, ip, and user-agent of each request.

- `backend/src/common/interceptors/logging.interceptor.ts` L34-L45 @e617fdabb524c4558e1ed51422816794e93603aa

### `research.backend-src-common-interceptors.0237d7db`

LoggingInterceptor taps the response stream to log 'Request completed' with the response statusCode and duration in milliseconds, and 'Request failed' with the error's status (defaulting to 500) and message.

- `backend/src/common/interceptors/logging.interceptor.ts` L47-L79 @e617fdabb524c4558e1ed51422816794e93603aa

### `research.backend-src-common-interceptors.987da0ae`

AppModule registers LoggingInterceptor as a global interceptor through the APP_INTERCEPTOR provider.

- `backend/src/app.module.ts` L43-L47 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src-common-interceptors.18251310`

QueryTimeoutInterceptor is an @Injectable() class implementing NestInterceptor whose constructor accepts a timeoutMs value that defaults to 30000 milliseconds.

- `backend/src/common/interceptors/query-timeout.interceptor.ts` L11-L17 @0f66cee0ef3cdda2661ee9f3a8ad0032b4899421

### `research.backend-src-common-interceptors.0ce45ce6`

QueryTimeoutInterceptor.intercept applies an rxjs timeout of timeoutMs to the response stream and converts a TimeoutError into a RequestTimeoutException with statusCode 408, message 'REQUEST_TIMEOUT', and an error describing the exceeded timeout in seconds; any other error is rethrown unchanged.

- `backend/src/common/interceptors/query-timeout.interceptor.ts` L19-L35 @0f66cee0ef3cdda2661ee9f3a8ad0032b4899421

### `research.backend-src-common-interceptors.56665a46`

main.ts registers QueryTimeoutInterceptor as a global interceptor with a 60000 millisecond timeout, commented as accommodating PDF parsing.

- `backend/src/main.ts` L69-L70 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src-common-interceptors.61a7a445`

RateLimitHeadersInterceptor is an @Injectable() class implementing NestInterceptor that is documented as adding the X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers to responses.

- `backend/src/common/interceptors/rate-limit-headers.interceptor.ts` L11-L22 @0760a7438fbef30ddda99ac81ff14c0da34abf71

### `research.backend-src-common-interceptors.f6a184f0`

RateLimitHeadersInterceptor.intercept reads a rateLimitInfo object attached to the response by the throttler guard and, when present, sets the X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers from its limit, remaining, and reset fields.

- `backend/src/common/interceptors/rate-limit-headers.interceptor.ts` L24-L33 @0760a7438fbef30ddda99ac81ff14c0da34abf71

### `research.backend-src-common-interceptors.5d2a50a2`

When rateLimitInfo is absent, RateLimitHeadersInterceptor falls back to reading 'throttle' metadata from the route handler via Reflect.getMetadata, setting X-RateLimit-Limit (default 100) and X-RateLimit-Reset (default now plus 60000 milliseconds) while omitting X-RateLimit-Remaining.

- `backend/src/common/interceptors/rate-limit-headers.interceptor.ts` L34-L48 @0760a7438fbef30ddda99ac81ff14c0da34abf71

### `research.backend-src-common-interceptors.82c2bf04`

The rateLimitInfo object that RateLimitHeadersInterceptor reads is attached to the response by CustomThrottlerGuard in backend/src/common/guards, which sets limit, remaining, and reset fields on it.

- `backend/src/common/interceptors/rate-limit-headers.interceptor.ts` L26-L28 @0760a7438fbef30ddda99ac81ff14c0da34abf71
- `backend/src/common/guards/custom-throttler.guard.ts` L46-L51 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb

## Open questions

None.
