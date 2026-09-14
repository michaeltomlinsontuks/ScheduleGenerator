<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/types
researched_at_commit: 67d8b314d49283c28b3fc2199e7ec519e3934ea8
sources:
  - path: frontend/src/types/.gitkeep
    blob_sha: e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
  - path: frontend/src/types/index.ts
    blob_sha: 99473a2d1736bbd2183fae91b28eb1cf84523e07
-->

# Research: frontend/src/types

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-types.1d3fd492`

The frontend/src/types unit declares the shared TypeScript type definitions for the UP Schedule Generator V3 frontend in its index.ts file.

- `frontend/src/types/index.ts` L1-L3 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.7ceb4e79`

index.ts is the unit's only TypeScript source file; the only other file in the unit is the empty .gitkeep placeholder.

- `frontend/src/types/index.ts` L1-L46 @99473a2d1736bbd2183fae91b28eb1cf84523e07
- `frontend/src/types/.gitkeep` L1-L1 @e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

### `research.frontend-src-types.b97d18d1`

ParsedEvent is an exported interface describing a schedule event extracted from the PDF, documented as matching the backend ParsedEvent structure.

- `frontend/src/types/index.ts` L5-L20 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.fef98377`

ParsedEvent declares id, module, activity, startTime, endTime and venue as required string fields, isRecurring as a required boolean field, and group, day and date as optional string fields.

- `frontend/src/types/index.ts` L9-L20 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.7abb8e7e`

ProcessingJob is an exported interface describing the processing job status reported by the backend.

- `frontend/src/types/index.ts` L22-L33 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.e2134e2a`

ProcessingJob declares jobId and createdAt as required string fields, status as a union of the literals 'pending', 'processing', 'complete' and 'failed', progress as an optional number field, events as an optional array of ParsedEvent, error as an optional string field, and completedAt as an optional string field.

- `frontend/src/types/index.ts` L25-L33 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.d64a8d5e`

GenerateRequest is an exported interface describing the request payload for generating calendar output.

- `frontend/src/types/index.ts` L35-L45 @99473a2d1736bbd2183fae91b28eb1cf84523e07

### `research.frontend-src-types.214c5ea9`

GenerateRequest declares events as an array of ParsedEvent, moduleColors as a Record mapping strings to strings, semesterStart and semesterEnd as required string fields, outputType as a union of the literals 'ics' and 'google', and calendarId as an optional string field.

- `frontend/src/types/index.ts` L38-L45 @99473a2d1736bbd2183fae91b28eb1cf84523e07

## Open questions

None.
