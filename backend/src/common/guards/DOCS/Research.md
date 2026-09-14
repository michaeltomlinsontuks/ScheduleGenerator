<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/guards
researched_at_commit: c0a8185dc0972c3d569e33a15e59c0762999d157
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/common/guards/custom-throttler.guard.ts
    blob_sha: b6f3084e8bf49e97eee5f7543fbe0290a1d329cb
  - path: backend/src/common/guards/index.ts
    blob_sha: 1d254df045be9bf22b0da73f82908b53819ac5d3
-->

# Research: backend/src/common/guards

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-guards.331a91ed`

The unit exports `CustomThrottlerGuard`, an `@Injectable()` class that extends `ThrottlerGuard` from `@nestjs/throttler` and is documented as adding rate limit information to the response so that the `RateLimitHeadersInterceptor` can add appropriate headers.

- `backend/src/common/guards/custom-throttler.guard.ts` L14-L19 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb
- `backend/src/common/guards/custom-throttler.guard.ts` L1-L7 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb

### `research.backend-src-common-guards.3df3c657`

`CustomThrottlerGuard.handleRequest` overrides the base throttler's `handleRequest` to compute a tracker key from the request, increment the storage counter, attach rate limit information to the response as a `rateLimitInfo` property and `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers, and, when the request count exceeds the limit, set a `Retry-After` header, log a warning with request context, and throw `ThrottlerException`.

- `backend/src/common/guards/custom-throttler.guard.ts` L21-L81 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb

### `research.backend-src-common-guards.b98d9ce0`

`CustomThrottlerGuard.getTracker` returns the request's IP address, falling back to `req.connection?.remoteAddress` and then to the string `'unknown'`.

- `backend/src/common/guards/custom-throttler.guard.ts` L83-L86 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb

### `research.backend-src-common-guards.f1aa9f05`

The unit defines a `RequestWithContext` interface that extends the express `Request` type with optional `requestId` and `userId` string fields.

- `backend/src/common/guards/custom-throttler.guard.ts` L9-L12 @b6f3084e8bf49e97eee5f7543fbe0290a1d329cb

### `research.backend-src-common-guards.65b3f8cd`

The unit's `index.ts` re-exports all public members of `./custom-throttler.guard.js`.

- `backend/src/common/guards/index.ts` L1-L1 @1d254df045be9bf22b0da73f82908b53819ac5d3

### `research.backend-src-common-guards.03354d0c`

`AppModule` registers `CustomThrottlerGuard` as a global guard through the `APP_GUARD` provider and configures `ThrottlerModule.forRoot` with a 60-second TTL and a limit of 100 requests.

- `backend/src/app.module.ts` L14-L14 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L22-L27 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L36-L42 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

## Open questions

None.
