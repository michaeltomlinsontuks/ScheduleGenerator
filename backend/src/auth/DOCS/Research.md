<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/auth
researched_at_commit: c3c9763d7b3db9408bb827f87b397e6ccea39128
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/auth/auth.controller.ts
    blob_sha: 6f84fd0877188c3f01fe31ba3bbc1893a461cdee
  - path: backend/src/auth/auth.module.ts
    blob_sha: 80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
  - path: backend/src/auth/auth.service.ts
    blob_sha: 3899f0dd5c8137185cf9f7eb7bf2308734314cf8
  - path: backend/src/auth/index.ts
    blob_sha: 3e1f7b0247ba55ec056a29475fb8711e1a4294bf
  - path: backend/src/auth/ip-blocking.service.ts
    blob_sha: aa58e522ea7d1e91cb09e51cd64463b49caf8c0f
  - path: backend/src/auth/session.serializer.ts
    blob_sha: 216ecdd135d5f188bfad3209adce13e498ddfbaf
  - path: backend/src/calendar/calendar.controller.ts
    blob_sha: f0cba82c6f26744e13f1232d27140c819b3d4dea
  - path: backend/src/calendar/calendar.module.ts
    blob_sha: 8f04eee7e74627c0777ffb29bef010a2d9f15ead
  - path: backend/src/upload/upload.controller.ts
    blob_sha: 01ee7be39eee375d9143debe659f70136968eb2b
-->

# Research: backend/src/auth

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-auth.a5ccd742`

The AuthModule is a NestJS module that imports PassportModule registered for session-based authentication, declares AuthController as its controller, and provides AuthService, GoogleStrategy, SessionSerializer, IpBlockingService, and IpBlockingGuard, exporting AuthService, IpBlockingService, and IpBlockingGuard for other modules to consume.

- `backend/src/auth/auth.module.ts` L10-L26 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c

### `research.backend-src-auth.2f1e07c6`

The unit's index.ts barrel re-exports the auth module, service, controller, Google strategy, Google auth guard, session serializer, and the auth-response and ip-blocking DTOs.

- `backend/src/auth/index.ts` L1-L8 @3e1f7b0247ba55ec056a29475fb8711e1a4294bf

### `research.backend-src-auth.23c37bdd`

SessionSerializer extends PassportSerializer and serializes and deserializes the SessionUser by passing the user object through unchanged.

- `backend/src/auth/session.serializer.ts` L5-L20 @216ecdd135d5f188bfad3209adce13e498ddfbaf

### `research.backend-src-auth.d3636a19`

AuthController is a NestJS controller mounted at the api/auth route that exposes six endpoints: GET google to initiate Google OAuth, GET google/callback to handle the OAuth callback, GET status to report authentication status, POST logout to end the session, GET ip/status to report IP blocking status, and POST ip/unblock to manually unblock an IP address.

- `backend/src/auth/auth.controller.ts` L50-L266 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth.c4482e39`

The Google OAuth endpoints GET api/auth/google and GET api/auth/google/callback are both guarded by IpBlockingGuard and GoogleAuthGuard; the callback parses a returnUrl from the OAuth state parameter (defaulting to /generate) and redirects the browser to the frontend URL from the frontend.url configuration.

- `backend/src/auth/auth.controller.ts` L59-L123 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth.cff4f8e7`

AuthController declares local AuthRequest and AuthResponse interfaces describing the session-aware request (an optional SessionUser, logout, and session with a returnUrl) and the response helpers (redirect, status, clearCookie) it uses.

- `backend/src/auth/auth.controller.ts` L35-L48 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth.5b90bdc6`

The GET api/auth/ip/status endpoint returns block information with the time remaining when an IP is blocked, or the current failed-attempt count when it is not; the POST api/auth/ip/unblock endpoint manually unblocks an IP and throws a 404 IP_NOT_BLOCKED error when the IP is not currently blocked.

- `backend/src/auth/auth.controller.ts` L177-L248 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth.0fc4a025`

AuthController.getClientIp extracts the client IP from the X-Forwarded-For header (taking the first address for proxied requests), falling back to request.ip or the socket remote address, and finally to the literal string unknown.

- `backend/src/auth/auth.controller.ts` L254-L265 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

### `research.backend-src-auth.72901b6e`

AuthService validates Google OAuth users by mapping the Google profile to a SessionUser, using the user's email as the id because the architecture is stateless and has no database, and exposes getAuthStatus, getAccessToken, and getRefreshToken for the session user.

- `backend/src/auth/auth.service.ts` L24-L85 @3899f0dd5c8137185cf9f7eb7bf2308734314cf8

### `research.backend-src-auth.39e5596c`

The unit defines a SessionUser interface (id, email, firstName, lastName, picture, accessToken, and optional refreshToken) and an AuthStatus interface (an authenticated flag with an optional user profile) in auth.service.ts.

- `backend/src/auth/auth.service.ts` L4-L22 @3899f0dd5c8137185cf9f7eb7bf2308734314cf8

### `research.backend-src-auth.75a1d670`

IpBlockingService tracks failed authentication attempts per IP address in the cache manager, blocking an IP after 5 failed attempts within a 15-minute window for a 1-hour duration, and provides methods to record attempts, block, check, unblock, clear, and query IP status.

- `backend/src/auth/ip-blocking.service.ts` L15-L166 @aa58e522ea7d1e91cb09e51cd64463b49caf8c0f

### `research.backend-src-auth.1336c35d`

The auth unit is consumed elsewhere in the backend: app.module.ts and calendar.module.ts import AuthModule, calendar.controller.ts imports AuthService and SessionUser, and upload.controller.ts imports the SessionUser type.

- `backend/src/app.module.ts` L11-L11 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/calendar/calendar.module.ts` L6-L6 @8f04eee7e74627c0777ffb29bef010a2d9f15ead
- `backend/src/calendar/calendar.controller.ts` L21-L21 @f0cba82c6f26744e13f1232d27140c819b3d4dea
- `backend/src/upload/upload.controller.ts` L23-L23 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-auth.ac527cb7`

The unit's files depend on its sibling sub-units: auth.controller.ts imports GoogleAuthGuard and IpBlockingGuard from guards and the auth-response and ip-blocking DTOs from dto; auth.module.ts imports GoogleStrategy from strategies and IpBlockingGuard from guards; and auth.service.ts imports GoogleUser from strategies.

- `backend/src/auth/auth.controller.ts` L22-L23 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee
- `backend/src/auth/auth.controller.ts` L24-L32 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee
- `backend/src/auth/auth.module.ts` L5-L5 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
- `backend/src/auth/auth.module.ts` L8-L8 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
- `backend/src/auth/auth.service.ts` L2-L2 @3899f0dd5c8137185cf9f7eb7bf2308734314cf8

## Open questions

None.
