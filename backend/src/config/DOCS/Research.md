<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/config
researched_at_commit: efc8ec9476e0feed0dc674a979adc2e37a3eb76e
sources:
  - path: backend/package.json
    blob_sha: e389b2f65dcc6d24b415a69ee60174f46a9d48b5
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/config/config.module.ts
    blob_sha: 9d98e6c6d2cf329bbc0d1c66a9d38cfb70725c46
  - path: backend/src/config/configuration.ts
    blob_sha: 28dde12e7fe4e42652d5f690803923e7a8300952
-->

# Research: backend/src/config

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-config.f3479eba`

The unit's config.module.ts declares AppConfigModule, a NestJS module annotated with @Module(), that registers ConfigModule.forRoot as a global module loading the configuration factory and reading .env.local and .env files, and exports ConfigModule.

- `backend/src/config/config.module.ts` L1-L15 @9d98e6c6d2cf329bbc0d1c66a9d38cfb70725c46

### `research.backend-src-config.0b0b5327`

The root AppModule in backend/src/app.module.ts imports AppConfigModule from ./config/config.module.js and includes it in its module imports.

- `backend/src/app.module.ts` L6-L6 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L17-L19 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

### `research.backend-src-config.27c1ac53`

configuration.ts exports a default factory function that returns the application's configuration object, with port, database, redis, minio, google, frontend, and parser sections populated from environment variables with fallback defaults.

- `backend/src/config/configuration.ts` L1-L51 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.98069c0d`

The port setting is parsed from process.env.PORT with a default of 3001.

- `backend/src/config/configuration.ts` L2-L2 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.8fc2002c`

The database section reads POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB, defaulting to localhost, 5432, postgres, postgres, and up_schedule respectively.

- `backend/src/config/configuration.ts` L3-L9 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.6db2b38c`

The redis section reads REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD, defaulting the host to localhost and the port to 6379, with no default password.

- `backend/src/config/configuration.ts` L10-L14 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.6c6f7892`

The minio section reads MINIO_* environment variables with fallbacks to AWS S3/Tigris variables (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BUCKET_NAME, AWS_REGION), defaulting the endpoint to localhost, the port to 443, the credentials to minioadmin, the bucket to pdf-uploads, and the region to auto, and auto-enabling SSL when an S3 endpoint URL is set.

- `backend/src/config/configuration.ts` L15-L37 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.50f21225`

The google section reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL, defaulting the client id and secret to empty strings and the callback URL to http://localhost:3001/api/auth/google/callback.

- `backend/src/config/configuration.ts` L38-L44 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.844288aa`

The frontend section reads FRONTEND_URL with a default of http://localhost:3000.

- `backend/src/config/configuration.ts` L45-L47 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.59c38b0a`

The parser section reads PARSER_URL with a default of http://localhost:5000.

- `backend/src/config/configuration.ts` L48-L50 @28dde12e7fe4e42652d5f690803923e7a8300952

### `research.backend-src-config.658a6c1d`

The backend declares @nestjs/common (^11.0.1) and @nestjs/config (^4.0.2) as dependencies in backend/package.json, which the config module imports from.

- `backend/package.json` L31-L32 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

## Open questions

None.
