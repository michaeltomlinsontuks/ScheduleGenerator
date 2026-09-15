<!-- tyto-docs
tyto_docs: 1
kind: research
unit: pdf-worker/parser
researched_at_commit: cd7e223ff85d2e24a178dfdcc2a9bfc442efc6ad
sources:
  - path: pdf-worker/parser/__init__.py
    blob_sha: 528272af127ff9abf00bf08bf5defe96c3150dea
  - path: pdf-worker/parser/data_processor.py
    blob_sha: 2e253a2d0de0c2efc92f8ba92b8198bf379d116e
  - path: pdf-worker/parser/pdf_parser.py
    blob_sha: 868a33e978a0a9f07c8db9ea93f413bc7a673301
  - path: pdf-worker/parser/utils.py
    blob_sha: 4f234d38fd3913639c60d2755f579069fafa9399
-->

# Research: pdf-worker/parser

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.pdf-worker-parser.cb17ce51`

The pdf-worker/parser package is the PDF Parser module for the UP Schedule Generator, wrapping the V2 Python parser for use as an HTTP microservice, and re-exports parse_pdf, process_events, and get_pdf_type from its submodules.

- `pdf-worker/parser/__init__.py` L1-L8 @528272af127ff9abf00bf08bf5defe96c3150dea

### `research.pdf-worker-parser.3cd4a6b0`

get_pdf_type determines the type of a schedule PDF by scanning the first page for mode-identifying keywords, returning 'test' for 'Semester Tests', 'exam' for 'Exams', 'lecture' for 'Lectures', and 'unknown' when the PDF has no pages, no extractable text, or none of the keywords appear.

- `pdf-worker/parser/utils.py` L5-L36 @4f234d38fd3913639c60d2755f579069fafa9399

### `research.pdf-worker-parser.c56cea0a`

process_events cleans and validates a list of parsed schedule events, handling all three modes (lecture, test, exam), standardizing data formats such as day names and times, and preparing the event data for calendar generation.

- `pdf-worker/parser/data_processor.py` L5-L18 @2e253a2d0de0c2efc92f8ba92b8198bf379d116e

### `research.pdf-worker-parser.18409b65`

process_events standardizes day names for lectures by stripping whitespace and capitalizing the 'Day' field when it is present and non-empty.

- `pdf-worker/parser/data_processor.py` L21-L23 @2e253a2d0de0c2efc92f8ba92b8198bf379d116e

### `research.pdf-worker-parser.d5c7c2b0`

process_events validates and cleans the 'Time' field: a HH:MM-HH:MM range sets start_time and end_time; a single HH:MM sets start_time and derives end_time by adding a default 3-hour duration; events whose time matches neither pattern are skipped.

- `pdf-worker/parser/data_processor.py` L26-L43 @2e253a2d0de0c2efc92f8ba92b8198bf379d116e

### `research.pdf-worker-parser.747fcfaa`

process_events creates an event summary from the fields present: 'Module' with 'Test' marks a non-recurring test event, 'Module' with 'Activity' and a 'Day' field marks a recurring lecture event, 'Module' with 'Activity' and no 'Day' marks a non-recurring exam event, and any other event becomes 'Unnamed Event' marked non-recurring.

- `pdf-worker/parser/data_processor.py` L46-L63 @2e253a2d0de0c2efc92f8ba92b8198bf379d116e

### `research.pdf-worker-parser.e3c5dfd5`

process_events adds location information to each event from its 'Venue' field when present.

- `pdf-worker/parser/data_processor.py` L65-L67 @2e253a2d0de0c2efc92f8ba92b8198bf379d116e

### `research.pdf-worker-parser.bbe790b8`

pdf_parser.py defines two custom exceptions: TimeoutException, raised when PDF processing exceeds the timeout, and PDFSizeException, raised when a PDF exceeds size limits.

- `pdf-worker/parser/pdf_parser.py` L10-L17 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.e874286c`

The timeout context manager protects a block with SIGALRM, raising TimeoutException with a message naming the seconds limit if the operation exceeds it, and disables the alarm on exit.

- `pdf-worker/parser/pdf_parser.py` L20-L33 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.bfb7260a`

_parse_weekly_schedule parses raw table data from a weekly schedule PDF by building a DataFrame per table, forward-filling the Module, Offered, Group, and Lang columns, stripping whitespace, dropping rows without Day and Time, and splitting newline-separated Day, Time, Venue, and Activity cells into separate events.

- `pdf-worker/parser/pdf_parser.py` L36-L76 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.e5d437ce`

_parse_test_schedule parses raw table data from a test schedule PDF by building a DataFrame per table, forward-filling the Module and Test columns, stripping whitespace, dropping rows without Date and Time, and emitting one event per newline-separated venue.

- `pdf-worker/parser/pdf_parser.py` L79-L107 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.84efef65`

_parse_exam_schedule parses raw table data from an exam schedule PDF by building a DataFrame per table, forward-filling the Module and Status columns, stripping whitespace, dropping rows without Date and Start Time, joining newline-separated venue parts into a single string, cleaning newlines from the Activity field, and setting Time from Start Time because exam PDFs carry no end time.

- `pdf-worker/parser/pdf_parser.py` L110-L168 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.02c50d73`

parse_pdf parses a Tuks schedule PDF under a 60-second timeout and a 100-page limit: it determines the PDF type with get_pdf_type, raises ValueError when the type is 'unknown', extracts every table from every page with pdfplumber, routes the tables to the parser matching the detected type, and returns a dictionary with the 'events' list and the 'type' field ('lecture', 'test', or 'exam').

- `pdf-worker/parser/pdf_parser.py` L171-L225 @868a33e978a0a9f07c8db9ea93f413bc7a673301

### `research.pdf-worker-parser.c8e878e8`

parse_pdf converts TimeoutException and PDFSizeException into ValueError messages ('PDF parsing timeout' and 'PDF size limit exceeded' respectively), and wraps any other exception as 'PDF parsing failed', so callers only see ValueError.

- `pdf-worker/parser/pdf_parser.py` L226-L231 @868a33e978a0a9f07c8db9ea93f413bc7a673301

## Open questions

None.
