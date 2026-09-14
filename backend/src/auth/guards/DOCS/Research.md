<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/auth/guards
researched_at_commit: 0a84ed7686d50fd433342f0bf7824685996a1f86
sources:
  - path: backend/src/auth/auth.controller.ts
    blob_sha: 6f84fd0877188c3f01fe31ba3bbc1893a461cdee
  - path: backend/src/auth/auth.module.ts
    blob_sha: 80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
  - path: backend/src/auth/guards/google-auth.guard.ts
    blob_sha: a2b5ee5a171500a0b5863fe04572d390311e52d0
  - path: backend/src/auth/guards/ip-blocking.guard.ts
    blob_sha: 8e8a148d0ce7d64afcc7e3dd5e59f06df691ccc4
-->

# Research: backend/src/auth/guards

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-auth-guards.4eafa1c9`

GoogleAuthGuard is an @Injectable() NestJS guard that extends AuthGuard('google') from @nestjs/passport to provide Google OAuth authentication, and it depends on IpBlockingService injected through its constructor.

- `backend/src/auth/guards/google-auth.guard.ts` L1-L12 @a2b5ee5a171500a0b5863fe04572d390311e52d0

### `research.backend-src-auth-guards.f676ae38`

GoogleAuthGuard.canActivate delegates to the parent passport guard's canActivate; when authentication succeeds it clears any recorded failed attempts for the client IP via IpBlockingService.clearFailedAttempts and triggers a session login via super.logIn(request).

- `backend/src/auth/guards/google-auth.guard.ts` L14-L29 @a2b5ee5a171500a0b5863fe04572d390311e52d0

### `research.backend-src-auth-guards.8c0afe00`

GoogleAuthGuard.canActivate catches authentication failures, records a failed attempt for the client IP via IpBlockingService.recordFailedAttempt, logs a warning when the service reports the IP should be blocked, and re-throws the original error.

- `backend/src/auth/guards/google-auth.guard.ts` L30-L43 @a2b5ee5a171500a0b5863fe04572d390311e52d0

### `research.backend-src-auth-guards.f289afb7`

GoogleAuthGuard.getAuthenticateOptions reads returnUrl from the request query and returns it as a JSON-stringified state option so it survives the OAuth redirect.

- `backend/src/auth/guards/google-auth.guard.ts` L50-L58 @a2b5ee5a171500a0b5863fe04572d390311e52d0

### `research.backend-src-auth-guards.43ae735e`

GoogleAuthGuard.getClientIp extracts the client IP from the X-Forwarded-For header, taking the first entry when the header lists multiple IPs, and falls back to request.ip, then request.socket.remoteAddress, then the literal 'unknown'.

- `backend/src/auth/guards/google-auth.guard.ts` L64-L75 @a2b5ee5a171500a0b5863fe04572d390311e52d0

### `research.backend-src-auth-guards.0a33100e`

IpBlockingGuard is an @Injectable() NestJS guard implementing CanActivate that blocks access from IPs that IpBlockingService reports as blocked.

- `backend/src/auth/guards/ip-blocking.guard.ts` L11-L18 @8e8a148d0ce7d64afcc7e3dd5e59f06df691ccc4

### `research.backend-src-auth-guards.2b44575c`

IpBlockingGuard.canActivate checks IpBlockingService.isBlocked(ip); when the IP is blocked it computes the time until unblock, logs a warning with the reason and blocked-at timestamp, and throws a ForbiddenException with statusCode 403, message 'IP_BLOCKED', a human-readable error stating the minutes remaining, and retryAfter in seconds.

- `backend/src/auth/guards/ip-blocking.guard.ts` L20-L44 @8e8a148d0ce7d64afcc7e3dd5e59f06df691ccc4

### `research.backend-src-auth-guards.7518b4ff`

IpBlockingGuard.getClientIp extracts the client IP from the X-Forwarded-For header, taking the first entry when the header lists multiple IPs, and falls back to request.ip, then request.socket.remoteAddress, then the literal 'unknown'.

- `backend/src/auth/guards/ip-blocking.guard.ts` L53-L64 @8e8a148d0ce7d64afcc7e3dd5e59f06df691ccc4

### `research.backend-src-auth-guards.5f7d220b`

Both GoogleAuthGuard and IpBlockingGuard are imported by backend/src/auth/auth.controller.ts, which uses them as route guards.

- `backend/src/auth/auth.controller.ts` L22-L23 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth-guards.80e32637`

IpBlockingGuard is imported by backend/src/auth/auth.module.ts, which registers it as a provider and an export of the AuthModule.

- `backend/src/auth/auth.module.ts` L8-L8 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
- `backend/src/auth/auth.module.ts` L17-L24 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c

## Open questions

None.
