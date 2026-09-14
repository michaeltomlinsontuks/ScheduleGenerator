<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/parser/dto
researched_at_commit: 03fa7c496c585792eed85a86d2107dbe3f9e0de7
sources:
  - path: backend/src/parser/dto/parsed-event.dto.ts
    blob_sha: 862c24f5c56ec190a931f6d16ac5a13b26ef516f
-->

# Research: backend/src/parser/dto

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-parser-dto.a7c3ae29`

The unit backend/src/parser/dto contains a single source file, parsed-event.dto.ts, which defines the exported class ParsedEventDto.

- `backend/src/parser/dto/parsed-event.dto.ts` L10-L71 @862c24f5c56ec190a931f6d16ac5a13b26ef516f

### `research.backend-src-parser-dto.acf782fb`

ParsedEventDto is a data transfer object that represents a parsed event, carrying fields for a unique identifier, module code, activity type, optional group, day and date, start and end times, venue, and a recurring flag.

- `backend/src/parser/dto/parsed-event.dto.ts` L10-L71 @862c24f5c56ec190a931f6d16ac5a13b26ef516f

### `research.backend-src-parser-dto.e0cd8a63`

The DTO validates its fields with class-validator decorators: id must be a UUID, startTime and endTime must match the HH:MM format, isRecurring must be a boolean, and the remaining fields must be strings.

- `backend/src/parser/dto/parsed-event.dto.ts` L11-L70 @862c24f5c56ec190a931f6d16ac5a13b26ef516f

### `research.backend-src-parser-dto.6b15c218`

The DTO documents its fields for OpenAPI/Swagger using ApiProperty and ApiPropertyOptional decorators from @nestjs/swagger.

- `backend/src/parser/dto/parsed-event.dto.ts` L1-L1 @862c24f5c56ec190a931f6d16ac5a13b26ef516f
- `backend/src/parser/dto/parsed-event.dto.ts` L11-L70 @862c24f5c56ec190a931f6d16ac5a13b26ef516f

### `research.backend-src-parser-dto.6d90d151`

The fields id, module, activity, startTime, endTime, venue and isRecurring are required, while group, day and date are optional.

- `backend/src/parser/dto/parsed-event.dto.ts` L10-L70 @862c24f5c56ec190a931f6d16ac5a13b26ef516f

## Open questions

None.
