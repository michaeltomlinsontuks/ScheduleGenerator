<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src
researched_at_commit: b9df7732552313a2d5aa2f2f75f0900b624b7e29
sources:
  - path: backend/src/app.controller.ts
    blob_sha: 22fbf4d55c3b23945330e1459842708801664fab
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/app.service.ts
    blob_sha: 927d7cca0badb13577152bf8753ce3552358f53b
  - path: backend/src/main.ts
    blob_sha: 0da6fa1450dd0c5db888411c1251ff4443abfc89
-->

# Research: backend/src

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src.b2d8b5d8`

AppModule is the application's root NestJS module: it imports the config, cache, upload, jobs, parser, auth, calendar, and health feature modules, declares AppController as its only controller, and provides AppService.

- `backend/src/app.module.ts` L17-L50 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src.46f509a2`

AppModule configures global rate limiting by importing ThrottlerModule.forRoot with a 60,000 ms TTL and a limit of 100 requests, and registers CustomThrottlerGuard as the global APP_GUARD provider.

- `backend/src/app.module.ts` L21-L27 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L38-L42 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src.cf249a5a`

AppModule registers LoggingInterceptor as the global APP_INTERCEPTOR provider so that every request is logged with request and user IDs.

- `backend/src/app.module.ts` L43-L47 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src.dcf1a38e`

AppController is a root-level NestJS controller that exposes a GET endpoint whose getHello method returns the greeting produced by AppService.

- `backend/src/app.controller.ts` L4-L12 @22fbf4d55c3b23945330e1459842708801664fab

### `research.backend-src.83908882`

AppService is an injectable NestJS service whose getHello method returns the string 'Hello World!'.

- `backend/src/app.service.ts` L3-L8 @927d7cca0badb13577152bf8753ce3552358f53b

### `research.backend-src.c2aad9fb`

The bootstrap function creates the Nest application from AppModule, sets the Express 'trust proxy' flag, enables Helmet security middleware, configures an express-session with a 24-hour cookie that is secure in production, and initializes Passport.

- `backend/src/main.ts` L12-L38 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src.d9944d03`

bootstrap enables CORS for the configured frontend URL and the deployed frontend origins, allowing requests without an origin and localhost origins outside production, with credentials enabled.

- `backend/src/main.ts` L40-L64 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src.a6d50bb5`

bootstrap installs a global HttpExceptionFilter, a global QueryTimeoutInterceptor with a 60-second timeout, and a global ValidationPipe with whitelist, forbidNonWhitelisted, and transform enabled.

- `backend/src/main.ts` L66-L86 @0da6fa1450dd0c5db888411c1251ff4443abfc89

### `research.backend-src.5f8caa7a`

bootstrap builds Swagger documentation titled 'Tuks Schedule Generator API' with Google OAuth2 and bearer authentication, serves it at /api/docs, and listens on the configured port (default 3001) on 0.0.0.0.

- `backend/src/main.ts` L88-L114 @0da6fa1450dd0c5db888411c1251ff4443abfc89

## Open questions

None.
