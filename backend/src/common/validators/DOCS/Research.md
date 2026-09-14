<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/validators
researched_at_commit: b6421855dd2a4b1ab0adc94c8152f517c09bb65a
sources:
  - path: backend/src/common/types.ts
    blob_sha: f9ce422cd0369be27778d0c86ffd5bd88d059c7f
  - path: backend/src/common/validators/pdf-content.validator.ts
    blob_sha: e575a38a9d1480fc3c6290ebb98ab590bbab5530
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/common/validators

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-validators.cb5529be`

The unit backend/src/common/validators contains a single source file, pdf-content.validator.ts, which holds the application's PDF content validation logic.

- `backend/src/common/validators/pdf-content.validator.ts` L1-L73 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.82ea47d1`

The file defines and exports an enum PdfContentError with the members INVALID_PDF_CONTENT, UNRECOGNIZED_FORMAT, and TEXT_EXTRACTION_FAILED.

- `backend/src/common/validators/pdf-content.validator.ts` L4-L8 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.724eb903`

The PdfContentError enum is not referenced anywhere in the repository; the validation functions throw plain Error objects with descriptive message strings rather than PdfContentError values.

- `backend/src/common/validators/pdf-content.validator.ts` L4-L8 @e575a38a9d1480fc3c6290ebb98ab590bbab5530
- `backend/src/common/validators/pdf-content.validator.ts` L22-L22 @e575a38a9d1480fc3c6290ebb98ab590bbab5530
- `backend/src/common/validators/pdf-content.validator.ts` L32-L32 @e575a38a9d1480fc3c6290ebb98ab590bbab5530
- `backend/src/common/validators/pdf-content.validator.ts` L48-L48 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.47ffdba6`

The file imports PdfType from '../types.js' and PDFParse from the 'pdf-parse' package.

- `backend/src/common/validators/pdf-content.validator.ts` L1-L2 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.a52803bf`

validatePdfContent is an exported async function that takes a PDF file buffer and returns a Promise<PdfType>, validating the PDF content and detecting the schedule mode by checking for mode-identifying keywords in the first page.

- `backend/src/common/validators/pdf-content.validator.ts` L18-L49 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.2fc0a41c`

validatePdfContent first checks the PDF magic bytes: it reads the first five bytes of the buffer as ASCII and throws 'Invalid PDF: file does not start with PDF magic bytes' unless they start with '%PDF-'.

- `backend/src/common/validators/pdf-content.validator.ts` L19-L23 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.941928f3`

validatePdfContent extracts text from the first page only, using a PDFParse instance constructed with the buffer and parser.getText({ first: 1 }), and throws 'Invalid PDF: Unable to extract text content' if extraction fails.

- `backend/src/common/validators/pdf-content.validator.ts` L25-L33 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.f528bbdf`

validatePdfContent detects the schedule mode by keyword, in order: text containing 'Semester Tests' returns PdfType.TEST, 'Exams' returns PdfType.EXAM, and 'Lectures' returns PdfType.LECTURE; the source comment notes the order matters so 'Semester Tests' is checked before 'Exams'.

- `backend/src/common/validators/pdf-content.validator.ts` L35-L45 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.288dcff4`

If none of the mode keywords is found, validatePdfContent throws 'Invalid PDF: Not a recognized UP schedule format'.

- `backend/src/common/validators/pdf-content.validator.ts` L47-L48 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.b49da522`

isPdfValidUpSchedule is an exported async function that checks whether a buffer is a valid UP schedule PDF without throwing, returning { isValid: true, pdfType } on success and { isValid: false, error } on failure, where error is the thrown message or 'Unknown error'.

- `backend/src/common/validators/pdf-content.validator.ts` L58-L72 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.2b0e1f4b`

isPdfValidUpSchedule calls validatePdfContent inside a try/catch to obtain the PDF type.

- `backend/src/common/validators/pdf-content.validator.ts` L63-L65 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

### `research.backend-src-common-validators.9b47ae2b`

PdfType is an enum defined in backend/src/common/types.ts with the values LECTURE = 'lecture', TEST = 'test', and EXAM = 'exam'.

- `backend/src/common/types.ts` L1-L5 @f9ce422cd0369be27778d0c86ffd5bd88d059c7f

### `research.backend-src-common-validators.ef7d2a73`

UploadService.processUpload in backend/src/upload/upload.service.ts imports validatePdfContent and calls it with the uploaded file's buffer to determine the PDF type, throwing a BadRequestException with the validation error message if validation fails.

- `backend/src/upload/upload.service.ts` L6-L6 @383f116d920d0269c4a9d40eacf13b164dfa524f
- `backend/src/upload/upload.service.ts` L51-L57 @383f116d920d0269c4a9d40eacf13b164dfa524f

### `research.backend-src-common-validators.153ec0f0`

No test files exist for this unit: no test files sit inside backend/src/common/validators, none name a file in it from a mirrored test tree, and none are named for the unit itself.

- `backend/src/common/validators/pdf-content.validator.ts` L1-L73 @e575a38a9d1480fc3c6290ebb98ab590bbab5530

## Open questions

None.
