<!-- tyto-docs
tyto_docs: 1
kind: component
unit: backend/src/parser
title: Parser
status: current
written_at_commit: 87369fd19472142d7b940d0ee2eaf7b54ae99339
written_at: "2026-09-14T22:28:27.058Z"
research: backend/src/parser/DOCS/Research.md
sources: []
accepted:
  at: "2026-09-14T22:34:19.752Z"
  commit: 87369fd19472142d7b940d0ee2eaf7b54ae99339
  research_fingerprint: "sha256:9b6b34fae09834e7e4b6adfda4d8dfa3767af2520b3c4ecad7b7b8084ac59af6"
  research_findings:
    - research.backend-src-parser.1512ef80
    - research.backend-src-parser.3d5cb3fc
    - research.backend-src-parser.70006c63
    - research.backend-src-parser.7c1b30b5
    - research.backend-src-parser.87f7fa81
    - research.backend-src-parser.93ab1aed
    - research.backend-src-parser.96a8e4ef
    - research.backend-src-parser.ac8c4268
    - research.backend-src-parser.bb50db71
    - research.backend-src-parser.bcfc00c5
    - research.backend-src-parser.bf0fdbff
    - research.backend-src-parser.e56b44bf
  critic_pass: critic.backend-src-parser.1
  sources:
    - path: backend/src/parser/index.ts
      blob_sha: 7224a7b4f286038343b880f5f0b506d2b781276f
    - path: backend/src/parser/parser.module.ts
      blob_sha: e084d9a004b3336c44d790f9d6a756c8055b7090
    - path: backend/src/parser/parser.service.ts
      blob_sha: 7b5e30a20ce49603bc2cade6afaf32acef426549
evidence: Parser.evidence.md
critic:
  attempts: 1
  findings: []
  review_complete: true
  sections_reviewed: 8
  sections_total: 8
  last_reviewed_document: "sha256:cfef109cd0ccd487c4ee1c19309e60775a82221b2eacfa490533aaac2e601181"
  retired: []
-->

# Parser

<!-- tyto-docs:generated:status -->
> **Status: Current**
<!-- /tyto-docs:generated:status -->

## [Summary](Parser.evidence.md#summary)

The parser unit owns ParserModule and ParserService, the NestJS module and service that send PDF schedule files to the Python parser worker and translate the worker's response into the backend's ParsedEvent shape. <!-- ev:research.backend-src-parser.e56b44bf --><sup>[1](Parser.evidence.md#research.backend-src-parser.e56b44bf)</sup> <!-- ev:research.backend-src-parser.87f7fa81 --><sup>[2](Parser.evidence.md#research.backend-src-parser.87f7fa81)</sup> A dependant can rely on ParserService.parsePdf accepting a PDF buffer and a PdfType and returning a normalized array of parsed events. <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup>

## [Purpose and boundaries](Parser.evidence.md#purpose-and-boundaries)

| | |
|---|---|
| Owns | ParserModule and ParserService, the unit's two exported classes, plus the ParserResponse interface. <!-- ev:research.backend-src-parser.e56b44bf --><sup>[1](Parser.evidence.md#research.backend-src-parser.e56b44bf)</sup> <!-- ev:research.backend-src-parser.3d5cb3fc --><sup>[4](Parser.evidence.md#research.backend-src-parser.3d5cb3fc)</sup> The public entry point index.ts re-exports ParserModule, ParserService, and ParsedEventDto. <!-- ev:research.backend-src-parser.96a8e4ef --><sup>[5](Parser.evidence.md#research.backend-src-parser.96a8e4ef)</sup> |
| Uses | HttpService and ConfigService, injected into ParserService, with the parser URL resolved from the 'parser.url' configuration value and defaulting to 'http://localhost:5000'. <!-- ev:research.backend-src-parser.7c1b30b5 --><sup>[6](Parser.evidence.md#research.backend-src-parser.7c1b30b5)</sup> It also uses PdfType and ParsedEvent from backend/src/common/types.ts and FormData from the 'form-data' package. <!-- ev:research.backend-src-parser.ac8c4268 --><sup>[7](Parser.evidence.md#research.backend-src-parser.ac8c4268)</sup> |
| Does not own | The Python worker that parses the PDF: ParserService only forwards the PDF to the worker's /parse endpoint and transforms the response. <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup> <!-- ev:research.backend-src-parser.87f7fa81 --><sup>[2](Parser.evidence.md#research.backend-src-parser.87f7fa81)</sup> |

## [How it works](Parser.evidence.md#how-it-works)

ParserModule imports HttpModule registered with a 60000 millisecond timeout and maxRedirects 5, declares ParserService as a provider, and exports it. <!-- ev:research.backend-src-parser.93ab1aed --><sup>[8](Parser.evidence.md#research.backend-src-parser.93ab1aed)</sup> ParserService injects HttpService and ConfigService through its constructor and resolves the parser service URL from the 'parser.url' configuration value, defaulting to 'http://localhost:5000'. <!-- ev:research.backend-src-parser.7c1b30b5 --><sup>[6](Parser.evidence.md#research.backend-src-parser.7c1b30b5)</sup>

parsePdf accepts a PDF buffer and a PdfType, builds a FormData payload containing the file (named 'schedule.pdf' with content type 'application/pdf') and the type, and POSTs it to the parser URL's /parse endpoint with a 60-second timeout. <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup> Each event in the worker's response is mapped to the backend ParsedEvent interface, normalizing field names (Module/module, Offered/offered, Activity/activity, Group/group, Day/day, Date/date, start_time/startTime, end_time/endTime, Venue/venue/location) and defaulting isRecurring to true when it is undefined. <!-- ev:research.backend-src-parser.87f7fa81 --><sup>[2](Parser.evidence.md#research.backend-src-parser.87f7fa81)</sup>

Events that arrive without an id are assigned one by the private generateEventId method (inferred from the response mapping), which uses crypto.randomUUID when available and falls back to generateUUIDv4, a template-based UUID v4 generator. <!-- ev:research.backend-src-parser.bf0fdbff --><sup>[9](Parser.evidence.md#research.backend-src-parser.bf0fdbff)</sup> <!-- ev:research.backend-src-parser.bcfc00c5 --><sup>[10](Parser.evidence.md#research.backend-src-parser.bcfc00c5)</sup> On failure, parsePdf logs the error via the NestJS logger and throws a new Error with the message 'Failed to parse PDF: <error message>'. <!-- ev:research.backend-src-parser.bb50db71 --><sup>[11](Parser.evidence.md#research.backend-src-parser.bb50db71)</sup>

```mermaid
%% required: behaviour
flowchart LR
    Caller[UploadService] -->|PDF buffer + PdfType| Parse[ParserService.parsePdf]
    Parse -->|FormData: file + type| Endpoint[parser URL /parse]
    Endpoint -->|raw events| Normalize[field-name normalization]
    Normalize -->|"ParsedEvent[]"| Caller
```

## [Interfaces](Parser.evidence.md#interfaces)

| Name | Input | Output | Guarantee |
|---|---|---|---|
| ParserService.parsePdf | A PDF buffer and a PdfType | ParsedEvent[] | POSTs the PDF to the parser URL's /parse endpoint with a 60-second timeout and returns events normalized to the backend ParsedEvent interface <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup> <!-- ev:research.backend-src-parser.87f7fa81 --><sup>[2](Parser.evidence.md#research.backend-src-parser.87f7fa81)</sup> |
| ParserResponse | — | { events: ParsedEvent[] } | The unit's exported response shape: a single events property holding an array of ParsedEvent <!-- ev:research.backend-src-parser.3d5cb3fc --><sup>[4](Parser.evidence.md#research.backend-src-parser.3d5cb3fc)</sup> |

<!-- tyto-docs:generated:endpoints -->
<!-- No framework adapter is active, so no endpoints were extracted for this unit. -->
<!-- /tyto-docs:generated:endpoints -->

## Source files

<!-- tyto-docs:generated:file-table -->
<!-- This unit owns no source files. -->
<!-- /tyto-docs:generated:file-table -->

## [Dependencies](Parser.evidence.md#dependencies)

| Dependency | Capability used | Why |
|---|---|---|
| @nestjs/axios | HttpModule and HttpService, registered with a 60000 ms timeout and maxRedirects 5 | Sends the PDF to the parser service's /parse endpoint <!-- ev:research.backend-src-parser.93ab1aed --><sup>[8](Parser.evidence.md#research.backend-src-parser.93ab1aed)</sup> <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup> |
| @nestjs/config | ConfigService reading the 'parser.url' value | Resolves the parser service URL, defaulting to 'http://localhost:5000' <!-- ev:research.backend-src-parser.7c1b30b5 --><sup>[6](Parser.evidence.md#research.backend-src-parser.7c1b30b5)</sup> |
| form-data | FormData payload construction | Builds the multipart body carrying the PDF file and the PdfType <!-- ev:research.backend-src-parser.ac8c4268 --><sup>[7](Parser.evidence.md#research.backend-src-parser.ac8c4268)</sup> <!-- ev:research.backend-src-parser.1512ef80 --><sup>[3](Parser.evidence.md#research.backend-src-parser.1512ef80)</sup> |
| backend/src/common/types.ts | PdfType and ParsedEvent types | Types the parse request and the normalized response <!-- ev:research.backend-src-parser.ac8c4268 --><sup>[7](Parser.evidence.md#research.backend-src-parser.ac8c4268)</sup> |

<!-- tyto-docs:generated:module-graph -->
```mermaid
%% tyto-docs:generated
flowchart LR
    backend_src_parser["backend/src/parser"]
    backend_src_common["backend/src/common"]
    backend_src["backend/src"]
    backend_src_upload["backend/src/upload"]
    backend_src_parser --> backend_src_common
    backend_src --> backend_src_parser
    backend_src_upload --> backend_src_parser
```
<!-- /tyto-docs:generated:module-graph -->

## [Data model](Parser.evidence.md#data-model)

The unit declares no entities of its own; it references ParsedEvent and PdfType from backend/src/common/types.ts and returns ParsedEvent instances from parsePdf. <!-- ev:research.backend-src-parser.ac8c4268 --><sup>[7](Parser.evidence.md#research.backend-src-parser.ac8c4268)</sup>

<!-- tyto-docs:generated:erd -->
<!-- This leaf unit has no descendant scope for a focused ERD. -->
<!-- /tyto-docs:generated:erd -->

## [Decisions and limitations](Parser.evidence.md#decisions-and-limitations)

ParserService generates event ids with crypto.randomUUID when available, falling back to a template-based UUID v4 generator, so ids stay unique even where randomUUID is missing. <!-- ev:research.backend-src-parser.bf0fdbff --><sup>[9](Parser.evidence.md#research.backend-src-parser.bf0fdbff)</sup> <!-- ev:research.backend-src-parser.bcfc00c5 --><sup>[10](Parser.evidence.md#research.backend-src-parser.bcfc00c5)</sup> The parser URL defaults to 'http://localhost:5000' when 'parser.url' is not configured, so non-local deployments must set it explicitly. <!-- ev:research.backend-src-parser.7c1b30b5 --><sup>[6](Parser.evidence.md#research.backend-src-parser.7c1b30b5)</sup>

<!-- tyto-docs:generated:navigation -->
- **Direct dependencies:** [Src common](../../common/DOCS/Common.md)
- **Used by:** [Src](../../DOCS/Src.md), [Src upload](../../upload/DOCS/Upload.md)
- **Schedule:** 20 of 43, wave 1
<!-- /tyto-docs:generated:navigation -->