<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/auth/dto
researched_at_commit: 6a17336e21ed64732b697beeebcb654fb33df91f
sources:
  - path: backend/src/auth/auth.controller.ts
    blob_sha: 6f84fd0877188c3f01fe31ba3bbc1893a461cdee
  - path: backend/src/auth/dto/auth-response.dto.ts
    blob_sha: f993d984f352c14c94b8a89a29d85ec463a7e22f
  - path: backend/src/auth/dto/ip-blocking.dto.ts
    blob_sha: 303188269c8faf35436b96929b97c43a08f838ab
-->

# Research: backend/src/auth/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-auth-dto.9f057329`

auth-response.dto.ts declares the exported class UserDto with four required string properties — email, firstName, lastName, and picture — each annotated with an @ApiProperty decorator from @nestjs/swagger.

- `backend/src/auth/dto/auth-response.dto.ts` L3-L15 @f993d984f352c14c94b8a89a29d85ec463a7e22f

### `research.backend-src-auth-dto.3360858c`

auth-response.dto.ts declares the exported class AuthStatusDto with a required boolean property authenticated and an optional UserDto property user annotated with @ApiPropertyOptional.

- `backend/src/auth/dto/auth-response.dto.ts` L17-L23 @f993d984f352c14c94b8a89a29d85ec463a7e22f

### `research.backend-src-auth-dto.be3a6715`

auth-response.dto.ts declares the exported class AuthResponseDto with a required string property message and a required UserDto property user.

- `backend/src/auth/dto/auth-response.dto.ts` L25-L31 @f993d984f352c14c94b8a89a29d85ec463a7e22f

### `research.backend-src-auth-dto.5c028e22`

auth-response.dto.ts declares the exported class LogoutResponseDto with a single required string property message.

- `backend/src/auth/dto/auth-response.dto.ts` L33-L36 @f993d984f352c14c94b8a89a29d85ec463a7e22f

### `research.backend-src-auth-dto.8678031f`

ip-blocking.dto.ts declares the exported class UnblockIpDto with a required string property ip validated by the class-validator @IsIP decorator.

- `backend/src/auth/dto/ip-blocking.dto.ts` L4-L11 @303188269c8faf35436b96929b97c43a08f838ab

### `research.backend-src-auth-dto.bdfad290`

ip-blocking.dto.ts declares the exported class BlockedIpInfoDto with five required properties — ip (string), attempts (number), blockedAt (number), reason (string), and timeRemaining (number) — each annotated with an @ApiProperty decorator.

- `backend/src/auth/dto/ip-blocking.dto.ts` L13-L43 @303188269c8faf35436b96929b97c43a08f838ab

### `research.backend-src-auth-dto.3e8353c6`

ip-blocking.dto.ts declares the exported class UnblockResponseDto with two required string properties — message and ip.

- `backend/src/auth/dto/ip-blocking.dto.ts` L45-L57 @303188269c8faf35436b96929b97c43a08f838ab

### `research.backend-src-auth-dto.b892d58a`

ip-blocking.dto.ts declares the exported class IpStatusDto with a required boolean property blocked and two optional properties — failedAttempts (number) and blockInfo (BlockedIpInfoDto).

- `backend/src/auth/dto/ip-blocking.dto.ts` L59-L79 @303188269c8faf35436b96929b97c43a08f838ab

### `research.backend-src-auth-dto.06c54672`

The unit backend/src/auth/dto contains two TypeScript files — auth-response.dto.ts and ip-blocking.dto.ts — which together declare eight exported DTO classes.

- `backend/src/auth/dto/auth-response.dto.ts` L1-L36 @f993d984f352c14c94b8a89a29d85ec463a7e22f
- `backend/src/auth/dto/ip-blocking.dto.ts` L1-L79 @303188269c8faf35436b96929b97c43a08f838ab

### `research.backend-src-auth-dto.72901a78`

backend/src/auth/auth.controller.ts imports from both files in the unit: AuthStatusDto and LogoutResponseDto from auth-response.dto.js, and UnblockIpDto, UnblockResponseDto, and IpStatusDto from ip-blocking.dto.js.

- `backend/src/auth/auth.controller.ts` L26-L34 @6f84fd0877188c3f01fe31ba3bbc1893a461cdee

## Open questions

None.
