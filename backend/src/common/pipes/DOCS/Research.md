<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/common/pipes
researched_at_commit: d90689c899e61e11159be5667074dda1fbe7ff73
sources:
  - path: backend/src/common/pipes/file-validation.pipe.ts
    blob_sha: 2a65d9d67496f22a3f997a1fecae0efe59ada041
  - path: backend/src/upload/upload.controller.ts
    blob_sha: 01ee7be39eee375d9143debe659f70136968eb2b
  - path: backend/src/upload/upload.service.ts
    blob_sha: 383f116d920d0269c4a9d40eacf13b164dfa524f
-->

# Research: backend/src/common/pipes

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-common-pipes.583c665f`

The unit defines FileValidationPipe, an @Injectable() class implementing NestJS PipeTransform<MulterFile, MulterFile>, which validates uploaded files before they reach the upload handler.

- `backend/src/common/pipes/file-validation.pipe.ts` L1-L5 @2a65d9d67496f22a3f997a1fecae0efe59ada041
- `backend/src/common/pipes/file-validation.pipe.ts` L25-L26 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.1da762c0`

The pipe's transform method throws a BadRequestException carrying FileValidationError.NO_FILE_PROVIDED with message 'No file provided' when no file is supplied.

- `backend/src/common/pipes/file-validation.pipe.ts` L28-L33 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.b3934f5d`

The pipe's transform method throws a BadRequestException carrying FileValidationError.INVALID_FILE_TYPE when the file's mimetype is not the allowed 'application/pdf' MIME type.

- `backend/src/common/pipes/file-validation.pipe.ts` L17-L17 @2a65d9d67496f22a3f997a1fecae0efe59ada041
- `backend/src/common/pipes/file-validation.pipe.ts` L35-L40 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.5d2f6012`

The pipe's transform method throws a BadRequestException carrying FileValidationError.FILE_TOO_LARGE when the file's size exceeds the 10MB maximum.

- `backend/src/common/pipes/file-validation.pipe.ts` L16-L16 @2a65d9d67496f22a3f997a1fecae0efe59ada041
- `backend/src/common/pipes/file-validation.pipe.ts` L42-L47 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.43edab1e`

The pipe's transform method returns the validated file unchanged when it passes all validation checks.

- `backend/src/common/pipes/file-validation.pipe.ts` L49-L49 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.272f15f3`

The unit defines MAX_FILE_SIZE as 10 * 1024 * 1024 bytes (10MB), the maximum accepted upload size, and ALLOWED_MIME_TYPE as 'application/pdf', the only accepted upload MIME type.

- `backend/src/common/pipes/file-validation.pipe.ts` L16-L17 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.8b544a92`

The unit defines the MulterFile interface describing the shape of an uploaded file: fieldname, originalname, encoding, mimetype, size, and buffer.

- `backend/src/common/pipes/file-validation.pipe.ts` L7-L14 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.3178fd79`

The unit defines the FileValidationError enum with the members INVALID_FILE_TYPE, FILE_TOO_LARGE, and NO_FILE_PROVIDED.

- `backend/src/common/pipes/file-validation.pipe.ts` L19-L23 @2a65d9d67496f22a3f997a1fecae0efe59ada041

### `research.backend-src-common-pipes.3b37c851`

FileValidationPipe is applied to the uploadPdf handler in backend/src/upload/upload.controller.ts via @UploadedFile(new FileValidationPipe()), so uploaded files are validated before UploadService.processUpload runs.

- `backend/src/upload/upload.controller.ts` L19-L19 @01ee7be39eee375d9143debe659f70136968eb2b
- `backend/src/upload/upload.controller.ts` L22-L22 @01ee7be39eee375d9143debe659f70136968eb2b
- `backend/src/upload/upload.controller.ts` L173-L173 @01ee7be39eee375d9143debe659f70136968eb2b

### `research.backend-src-common-pipes.76a3193e`

The unit's MulterFile type is imported by backend/src/upload/upload.service.ts to type the upload processing input.

- `backend/src/upload/upload.service.ts` L8-L8 @383f116d920d0269c4a9d40eacf13b164dfa524f

## Open questions

None.
