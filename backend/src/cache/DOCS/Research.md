<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/cache
researched_at_commit: 12c5e7b16be2baac7c5670143d541fb2133d8bb1
sources:
  - path: backend/src/app.module.ts
    blob_sha: 1b5f64495a918f74a914ccba7b1f456fb29e60cd
  - path: backend/src/cache/cache.module.ts
    blob_sha: 8d4e50ec4d37305467b50dc1e0b3ebc24f8d7495
  - path: backend/src/cache/index.ts
    blob_sha: bd12fb1bc37d4bb32c48505f5d7abc88d6ff40ec
-->

# Research: backend/src/cache

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-cache.7f2e5345`

The cache unit defines a NestJS module, CacheModule, that registers the @nestjs/cache-manager CacheModule as a global module with a default TTL of 300000 milliseconds (5 minutes) and a maximum of 1000 cached items.

- `backend/src/cache/cache.module.ts` L1-L14 @8d4e50ec4d37305467b50dc1e0b3ebc24f8d7495

### `research.backend-src-cache.3854dd3f`

CacheModule exports the registered NestCacheModule, so any module that imports CacheModule can use the cache.

- `backend/src/cache/cache.module.ts` L4-L13 @8d4e50ec4d37305467b50dc1e0b3ebc24f8d7495

### `research.backend-src-cache.1712b9b5`

The unit's public entry point, backend/src/cache/index.ts, re-exports CacheModule from './cache.module.js'.

- `backend/src/cache/index.ts` L1-L2 @bd12fb1bc37d4bb32c48505f5d7abc88d6ff40ec

### `research.backend-src-cache.c6629710`

The root AppModule in backend/src/app.module.ts imports CacheModule from './cache/cache.module.js' and includes it in its module imports, making the global cache available to the application.

- `backend/src/app.module.ts` L7-L7 @1b5f64495a918f74a914ccba7b1f456fb29e60cd
- `backend/src/app.module.ts` L20-L20 @1b5f64495a918f74a914ccba7b1f456fb29e60cd

## Open questions

None.
