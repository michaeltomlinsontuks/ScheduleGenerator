<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/upload
researched_at_commit: fa4422ffa20f0d6746077deaaf6c59e29ba4c089
sources:
  - path: frontend/src/components/upload/DropZone.tsx
    blob_sha: 8727361e576bb55d896d73128084f31f84b07c03
  - path: frontend/src/components/upload/FilePreview.tsx
    blob_sha: c1d241af5610771c88fd62a2c8c66a421100ce4c
  - path: frontend/src/components/upload/UploadProgress.tsx
    blob_sha: 57e5ca2d8b0840bac452d13c5a77b737bbd37dd2
  - path: frontend/src/components/upload/index.ts
    blob_sha: f39ca1da9106bb3d830e343e850be0367164c850
-->

# Research: frontend/src/components/upload

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-upload.be6f3c46`

DropZoneProps declares onFileSelect as a callback taking a File, onFileRemove as a callback taking no arguments, and optional accept (string), maxSize (number), disabled (boolean), and selectedFile (File | null) properties.

- `frontend/src/components/upload/DropZone.tsx` L7-L14 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.c8a4ed57`

DropZone is a client component, its file beginning with the 'use client' directive, and it imports validateFile and ACCEPTED_EXTENSION from '@/utils/validation' and Alert from '@/components/common'.

- `frontend/src/components/upload/DropZone.tsx` L1-L5 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.55483170`

DropZone defaults accept to ACCEPTED_EXTENSION, disabled to false, and selectedFile to null, and maintains isDragOver, error, and fileInputRef state via useState and useRef.

- `frontend/src/components/upload/DropZone.tsx` L16-L25 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.9930880b`

handleFile clears the error, validates the file with validateFile, sets the error message when validation fails, and otherwise invokes onFileSelect with the file.

- `frontend/src/components/upload/DropZone.tsx` L27-L37 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.993cb698`

handleDragOver prevents default and stops propagation, setting isDragOver true when not disabled, while handleDragLeave resets isDragOver to false.

- `frontend/src/components/upload/DropZone.tsx` L39-L51 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.e775d04f`

handleDrop prevents default, stops propagation, resets isDragOver, returns early when disabled, and passes the first dropped file to handleFile.

- `frontend/src/components/upload/DropZone.tsx` L53-L64 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.dc516b8f`

handleClick triggers the hidden file input's click when not disabled, and handleInputChange passes the first selected file to handleFile and resets the input value so the same file can be selected again.

- `frontend/src/components/upload/DropZone.tsx` L67-L82 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.6170fa04`

handleDismissError clears the error, and handleRemoveFile clears the error and invokes onFileRemove.

- `frontend/src/components/upload/DropZone.tsx` L84-L91 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.f7f9ae9c`

DropZone renders an Alert with type 'error' and the current error message when error is set, and otherwise renders either a drop zone div when no file is selected or a selected-file summary with a remove button.

- `frontend/src/components/upload/DropZone.tsx` L100-L208 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.f4f9d6ea`

The drop zone div has role 'button', tabIndex 0 (or -1 when disabled), aria-label 'Drop zone for PDF files', handles drag, click, and Enter/Space keydown events, and contains a hidden file input with the accept and disabled attributes.

- `frontend/src/components/upload/DropZone.tsx` L108-L132 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.a9e16097`

The drop zone shows 'Drop your PDF here' when dragging over and 'Drag & drop your PDF here' otherwise, with the hint 'or click to browse (max 10MB)'.

- `frontend/src/components/upload/DropZone.tsx` L134-L158 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.eef69f3e`

When a file is selected, DropZone renders the file name and its size in MB to two decimal places, with a ghost remove button that invokes handleRemoveFile.

- `frontend/src/components/upload/DropZone.tsx` L160-L208 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.dd7c1c2d`

DropZone destructures only onFileSelect, onFileRemove, accept, disabled, and selectedFile from DropZoneProps, leaving the declared maxSize property unused by the component.

- `frontend/src/components/upload/DropZone.tsx` L16-L22 @8727361e576bb55d896d73128084f31f84b07c03

### `research.frontend-src-components-upload.909e138f`

FilePreviewProps declares file as a File and onRemove as a callback taking no arguments.

- `frontend/src/components/upload/FilePreview.tsx` L6-L9 @c1d241af5610771c88fd62a2c8c66a421100ce4c

### `research.frontend-src-components-upload.bcc21d34`

FilePreview is a client component, its file beginning with the 'use client' directive, and it imports formatFileSize from '@/utils/validation'.

- `frontend/src/components/upload/FilePreview.tsx` L1-L4 @c1d241af5610771c88fd62a2c8c66a421100ce4c

### `research.frontend-src-components-upload.4fcfa210`

FilePreview renders a bordered card containing a PDF icon, the file name truncated with a title attribute, the formatted file size from formatFileSize, and a circular ghost remove button with aria-label 'Remove {file.name}' that invokes onRemove.

- `frontend/src/components/upload/FilePreview.tsx` L11-L69 @c1d241af5610771c88fd62a2c8c66a421100ce4c

### `research.frontend-src-components-upload.287160b8`

UploadProgressProps declares progress as a number, status as one of 'uploading' | 'processing' | 'complete' | 'error', and message as an optional string.

- `frontend/src/components/upload/UploadProgress.tsx` L5-L9 @57e5ca2d8b0840bac452d13c5a77b737bbd37dd2

### `research.frontend-src-components-upload.40769818`

statusConfig maps each status to a label, progressClass, and icon: uploading and processing use progress-primary with a loading spinner, complete uses progress-success with a check icon, and error uses progress-error with an X icon.

- `frontend/src/components/upload/UploadProgress.tsx` L11-L70 @57e5ca2d8b0840bac452d13c5a77b737bbd37dd2

### `research.frontend-src-components-upload.0242aa7d`

UploadProgress is a client component, its file beginning with the 'use client' directive.

- `frontend/src/components/upload/UploadProgress.tsx` L1-L1 @57e5ca2d8b0840bac452d13c5a77b737bbd37dd2

### `research.frontend-src-components-upload.240aed34`

UploadProgress looks up statusConfig[status], displays message when provided and otherwise the config label, clamps progress to between 0 and 100, and renders the icon, display message, percentage, and a progress element with the config's progressClass and an aria-label of 'Upload progress: {clampedProgress}%'.

- `frontend/src/components/upload/UploadProgress.tsx` L72-L101 @57e5ca2d8b0840bac452d13c5a77b737bbd37dd2

### `research.frontend-src-components-upload.beaa42fe`

index.ts is a barrel module that re-exports the DropZone, FilePreview, and UploadProgress components together with their prop types (DropZoneProps, FilePreviewProps, UploadProgressProps).

- `frontend/src/components/upload/index.ts` L1-L9 @f39ca1da9106bb3d830e343e850be0367164c850

### `research.frontend-src-components-upload.59f50222`

All three components in this unit (DropZone, FilePreview, UploadProgress) are client components, each file beginning with the 'use client' directive.

- `frontend/src/components/upload/DropZone.tsx` L1-L1 @8727361e576bb55d896d73128084f31f84b07c03
- `frontend/src/components/upload/FilePreview.tsx` L1-L1 @c1d241af5610771c88fd62a2c8c66a421100ce4c
- `frontend/src/components/upload/UploadProgress.tsx` L1-L1 @57e5ca2d8b0840bac452d13c5a77b737bbd37dd2

## Open questions

None.
