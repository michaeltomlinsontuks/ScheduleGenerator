<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend
researched_at_commit: c0611434ff8f1cf9e08ead13da854e4a6b9c8c43
sources:
  - path: backend/.dockerignore
    blob_sha: 0623efa5b931f26137594884637e9fb052c12b5b
  - path: backend/.env.example
    blob_sha: 5c0073ac5dff3313475eb86908e7760b48661eb9
  - path: backend/.prettierrc
    blob_sha: a20502b7f06d848452da0d93ce8830c1d86b05dd
  - path: backend/Dockerfile
    blob_sha: 5126794b2f42dc22793f54d10ebc6cdd11640c65
  - path: backend/Dockerfile.dev
    blob_sha: 0181c9b6a6a564f6673ca45a0cfcb13d4241b01f
  - path: backend/eslint.config.mjs
    blob_sha: df284040167d4d2b049039af4d8f188d6d3a414a
  - path: backend/fly.toml
    blob_sha: 64084107abf01698a1821b91326c5d35ee7c7bef
  - path: backend/nest-cli.json
    blob_sha: f9aa683b1ad5cffc76da9ad4b77c562ac4c2b399
  - path: backend/package-lock.json
    blob_sha: b43b8c8ee53c5e67e57c90e770230e93df4ffde6
  - path: backend/package.json
    blob_sha: e389b2f65dcc6d24b415a69ee60174f46a9d48b5
  - path: backend/tsconfig.build.json
    blob_sha: 64f86c6bd2bb30e3d22e752295eb7c7923fc191e
  - path: backend/tsconfig.json
    blob_sha: af5653e5e9c3af3cf4683f908f0ff8186434da26
-->

# Research: backend

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend.e5c8e0f5`

The backend directory is a private NestJS application named 'backend' (version 0.0.1, license UNLICENSED) declared in backend/package.json.

- `backend/package.json` L1-L7 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

### `research.backend.45c28ca5`

backend/nest-cli.json configures the NestJS CLI with the @nestjs/schematics collection, sourceRoot 'src', and a compiler option that deletes the output directory before each build.

- `backend/nest-cli.json` L1-L8 @f9aa683b1ad5cffc76da9ad4b77c562ac4c2b399

### `research.backend.a9b5c807`

backend/tsconfig.json compiles the backend with strict TypeScript checks enabled, experimental decorator metadata, ES2023 target, and output to ./dist.

- `backend/tsconfig.json` L2-L31 @af5653e5e9c3af3cf4683f908f0ff8186434da26

### `research.backend.e90724d2`

backend/tsconfig.build.json extends tsconfig.json and excludes node_modules, test, dist, and spec files from production builds.

- `backend/tsconfig.build.json` L1-L4 @64f86c6bd2bb30e3d22e752295eb7c7923fc191e

### `research.backend.150705f1`

backend/package.json declares npm scripts for building (nest build), running (nest start, node dist/main), linting (eslint), testing (jest), and TypeORM migrations.

- `backend/package.json` L8-L27 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

### `research.backend.737a298d`

The backend's runtime dependencies are the NestJS framework packages (@nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/config, @nestjs/swagger, @nestjs/terminus, @nestjs/throttler, @nestjs/passport, @nestjs/axios, @nestjs/cache-manager) plus supporting libraries (axios, cache-manager, class-transformer, class-validator, express-session, form-data, helmet, passport, passport-google-oauth20, pdf-parse, reflect-metadata, rxjs, ts-node, tsconfig-paths, uuid).

- `backend/package.json` L28-L54 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

### `research.backend.1d11f4c3`

The backend's devDependencies provide the NestJS CLI and schematics, testing tooling (jest, @nestjs/testing, supertest, ts-jest, fast-check), and linting and formatting tooling (eslint, typescript-eslint, prettier, eslint-plugin-prettier).

- `backend/package.json` L55-L83 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

### `research.backend.bd9c3a1e`

The jest configuration embedded in backend/package.json runs tests from the src rootDir with the ts-jest transform, matches *.spec.ts files, and writes coverage to ../coverage.

- `backend/package.json` L84-L106 @e389b2f65dcc6d24b415a69ee60174f46a9d48b5

### `research.backend.6b9bdeb3`

The production Dockerfile builds the backend in two stages on node:20-alpine, installs only production dependencies, runs as a non-root 'nestjs' user, exposes port 3001, health-checks http://localhost:3001/health, and starts the app with node dist/main.js.

- `backend/Dockerfile` L1-L53 @5126794b2f42dc22793f54d10ebc6cdd11640c65

### `research.backend.5857555d`

The development Dockerfile runs the backend on node:20-alpine, installs all dependencies including devDependencies, exposes port 3001, and starts the app with npm run start:dev in watch mode.

- `backend/Dockerfile.dev` L1-L19 @0181c9b6a6a564f6673ca45a0cfcb13d4241b01f

### `research.backend.ac621e01`

backend/fly.toml deploys the backend to Fly.io as app 'schedgen-backend' with primary region 'jnb', building from the Dockerfile, setting PORT=3001, NODE_ENV=production, FRONTEND_URL, 2026 semester dates, and the production Google OAuth callback URL, serving an http_service on internal port 3001 with force_https on a shared-cpu-1x 512mb VM.

- `backend/fly.toml` L1-L38 @64084107abf01698a1821b91326c5d35ee7c7bef

### `research.backend.e7a20a37`

backend/.env.example documents the environment variables the backend expects: server settings (PORT, SESSION_SECRET), PostgreSQL connection, MinIO object storage, Google OAuth, frontend URL, parser service URL, and 2026 semester dates.

- `backend/.env.example` L1-L36 @5c0073ac5dff3313475eb86908e7760b48661eb9

### `research.backend.b213f18f`

backend/eslint.config.mjs configures ESLint with the flat config format, applying @eslint/js recommended, typescript-eslint recommendedTypeChecked, and the Prettier plugin, with @typescript-eslint/no-explicit-any disabled and warnings for no-floating-promises and no-unsafe-argument.

- `backend/eslint.config.mjs` L1-L34 @df284040167d4d2b049039af4d8f188d6d3a414a

### `research.backend.e264cc65`

backend/.prettierrc configures Prettier to use single quotes and trailing commas.

- `backend/.prettierrc` L1-L4 @a20502b7f06d848452da0d93ce8830c1d86b05dd

### `research.backend.2dd75891`

backend/.dockerignore excludes node_modules, dist, coverage, IDE files, environment files, logs, OS files, git metadata, test files, and README.md from the Docker build context.

- `backend/.dockerignore` L1-L36 @0623efa5b931f26137594884637e9fb052c12b5b

### `research.backend.72bc6afb`

backend/package-lock.json is the npm lockfile (lockfileVersion 3) recording the resolved dependency tree for the backend package.

- `backend/package-lock.json` L1-L20 @b43b8c8ee53c5e67e57c90e770230e93df4ffde6

## Open questions

None.
