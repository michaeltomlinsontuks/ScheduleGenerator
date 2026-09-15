<!-- tyto-docs
tyto_docs: 1
kind: research
unit: pdf-worker
researched_at_commit: fc155ba31ed7fa52181bb433abbab922416e7edc
sources:
  - path: pdf-worker/Dockerfile
    blob_sha: b7fcdf0cc09080ab4e2048554d34d16c12768ed2
  - path: pdf-worker/app.py
    blob_sha: cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85
  - path: pdf-worker/fly.toml
    blob_sha: 78dc994cf2ddd815ffec9e9f888ee1411a8617c5
  - path: pdf-worker/requirements.txt
    blob_sha: 0b312e5ed651c59be378ec96bdb92ab11499988a
  - path: pdf-worker/verify_parsers.py
    blob_sha: c26e2106397fd5ca9a8263b72d8ce733614b1f80
-->

# Research: pdf-worker

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.pdf-worker.cc9ae6cb`

The pdf-worker unit is a FastAPI microservice named 'PDF Worker' (version 1.0.0) that wraps the V2 Python PDF parser and exposes it via an HTTP API for use by the NestJS backend.

- `pdf-worker/app.py` L1-L21 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.d73cf4b8`

The service exposes a GET /health endpoint that returns {"status": "healthy"} for container orchestration.

- `pdf-worker/app.py` L24-L32 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.ea078795`

The service exposes a POST /parse endpoint that accepts a PDF file upload and returns a JSON object with an events array and a type field.

- `pdf-worker/app.py` L35-L48 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.196e3f6a`

The /parse endpoint rejects uploads whose filename does not end in .pdf with a 400 'Invalid file type' response.

- `pdf-worker/app.py` L49-L54 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.163404cf`

The /parse endpoint rejects uploads whose content type is not application/pdf with a 400 'Invalid content type' response.

- `pdf-worker/app.py` L56-L61 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.331048a3`

The /parse endpoint saves the upload to a temporary .pdf file, rejects empty files with a 400 'Empty file' response, parses the file with parse_pdf, processes the events with process_events, and returns {"events": processed_events, "type": result['type']}.

- `pdf-worker/app.py` L63-L89 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.5313932f`

The /parse endpoint maps ValueError to a 400 'Invalid PDF format' response and any other exception to a 500 'Parsing failed' response, and always removes the temporary file in a finally block.

- `pdf-worker/app.py` L91-L106 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.a01ed52f`

When run as the main module, the app starts uvicorn on 0.0.0.0 at the port from the PORT environment variable, defaulting to 5001.

- `pdf-worker/app.py` L109-L112 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.8e148c31`

The service depends on the external parser package, importing parse_pdf and process_events from it.

- `pdf-worker/app.py` L15-L15 @cfcd1ca4a8a8bff4f6468a4fa7059cf62cd18f85

### `research.pdf-worker.9c5c601a`

verify_parsers.py is a verification script that tests the parser package's _parse_weekly_schedule() and _parse_test_schedule() functions to ensure they still work correctly after the multi-mode changes.

- `pdf-worker/verify_parsers.py` L1-L14 @c26e2106397fd5ca9a8263b72d8ce733614b1f80

### `research.pdf-worker.d3b8a595`

verify_lecture_parser() verifies the lecture parser by checking that a multi-day cell (Monday\nWednesday) splits into 2 events, that events carry the required fields Module, Activity, Group, Day, Time, and Venue, that process_events accepts them, and that all processed events are marked isRecurring=True.

- `pdf-worker/verify_parsers.py` L17-L72 @c26e2106397fd5ca9a8263b72d8ce733614b1f80

### `research.pdf-worker.7a4f0c4d`

verify_test_parser() verifies the test parser by checking that a multi-venue cell (IT 4-4\nIT 4-5) splits into 2 events, that events carry the required fields Module, Test, Date, Time, and Venue, that process_events accepts them, and that all processed events are marked isRecurring=False.

- `pdf-worker/verify_parsers.py` L75-L130 @c26e2106397fd5ca9a8263b72d8ce733614b1f80

### `research.pdf-worker.d8175c22`

verify_no_weekly_references() scans parser/pdf_parser.py, parser/utils.py, and parser/data_processor.py for hardcoded 'weekly' string references and fails if any are found.

- `pdf-worker/verify_parsers.py` L133-L162 @c26e2106397fd5ca9a8263b72d8ce733614b1f80

### `research.pdf-worker.e0f9a4f6`

main() runs the three verification functions (lecture parser, test parser, and no-weekly-references checks) and exits 0 when all pass and 1 when any fails.

- `pdf-worker/verify_parsers.py` L165-L206 @c26e2106397fd5ca9a8263b72d8ce733614b1f80

### `research.pdf-worker.23e9450e`

The Dockerfile builds the service from python:3.11-slim, installs libpoppler-cpp-dev and curl, installs the pinned requirements, copies the application code, creates a non-root 'worker' user, and exposes port 5001.

- `pdf-worker/Dockerfile` L4-L29 @b7fcdf0cc09080ab4e2048554d34d16c12768ed2

### `research.pdf-worker.ed04e41c`

The Dockerfile declares a HEALTHCHECK that hits http://localhost:5001/health every 30 seconds with a 10-second timeout, a 5-second start period, and 3 retries.

- `pdf-worker/Dockerfile` L31-L33 @b7fcdf0cc09080ab4e2048554d34d16c12768ed2

### `research.pdf-worker.d33c6b2f`

The container runs gunicorn with a uvicorn worker on 0.0.0.0:5001, with worker count, timeout, and max-requests configurable via the MAX_WORKERS, WORKER_TIMEOUT, MAX_REQUESTS, and MAX_REQUESTS_JITTER environment variables (defaults 4, 120, 1000, and 100).

- `pdf-worker/Dockerfile` L35-L45 @b7fcdf0cc09080ab4e2048554d34d16c12768ed2

### `research.pdf-worker.ad47318b`

fly.toml configures the Fly.io app 'schedgen-pdf-worker' with primary region 'jnb', a Dockerfile build, PORT=5001, an http_service on internal port 5001 with auto-stop machines and zero minimum running machines, and a shared-cpu-1x 512mb VM.

- `pdf-worker/fly.toml` L6-L26 @78dc994cf2ddd815ffec9e9f888ee1411a8617c5

### `research.pdf-worker.855062bc`

requirements.txt pins fastapi 0.109.2, uvicorn 0.27.1, gunicorn 21.2.0, python-multipart 0.0.9, pdfplumber 0.10.4, and pandas 2.2.0.

- `pdf-worker/requirements.txt` L3-L12 @0b312e5ed651c59be378ec96bdb92ab11499988a

## Open questions

None.
