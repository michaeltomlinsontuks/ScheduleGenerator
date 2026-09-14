<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/demo/storage-test
researched_at_commit: 8a84688ccc96fc0bd5e0b08159d356ee260ba029
sources:
  - path: frontend/src/app/demo/storage-test/page.tsx
    blob_sha: 7d6f185b4a0927c0e4d4a293a9a816e033d31788
-->

# Research: frontend/src/app/demo/storage-test

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-demo-storage-test.11b8801d`

The unit frontend/src/app/demo/storage-test contains a single source file, page.tsx, a Next.js client component that exports a default StorageTestPage function.

- `frontend/src/app/demo/storage-test/page.tsx` L1-L1 @7d6f185b4a0927c0e4d4a293a9a816e033d31788
- `frontend/src/app/demo/storage-test/page.tsx` L21-L21 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.97daf1d3`

The page is a storage error handling demo that demonstrates toast notifications and storage error handling for the session-state-persistence feature.

- `frontend/src/app/demo/storage-test/page.tsx` L3-L8 @7d6f185b4a0927c0e4d4a293a9a816e033d31788
- `frontend/src/app/demo/storage-test/page.tsx` L138-L142 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.d9d2a95e`

The page imports toast notification utilities (showErrorToast, showWarningToast, showSuccessToast, showInfoToast) from '@/utils/toast', the event and config stores, and workflow and all-state clearing utilities from '@/utils/stateManagement'.

- `frontend/src/app/demo/storage-test/page.tsx` L10-L19 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.fcc2acd2`

The page keeps a testResults state array of timestamped strings, appended by addResult, and clearResults resets it to an empty array.

- `frontend/src/app/demo/storage-test/page.tsx` L22-L22 @7d6f185b4a0927c0e4d4a293a9a816e033d31788
- `frontend/src/app/demo/storage-test/page.tsx` L26-L28 @7d6f185b4a0927c0e4d4a293a9a816e033d31788
- `frontend/src/app/demo/storage-test/page.tsx` L129-L131 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.93113a28`

testToastNotifications displays all four toast types (info, success, warning, error) with staggered delays and records a result line.

- `frontend/src/app/demo/storage-test/page.tsx` L30-L36 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.6bcf8695`

testEventStoreOperations sets a test event in the event store and records success or failure, showing a success toast on success.

- `frontend/src/app/demo/storage-test/page.tsx` L38-L58 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.cdd6c67a`

testConfigStoreOperations sets semester start and end dates and a module color in the config store, recording success or failure.

- `frontend/src/app/demo/storage-test/page.tsx` L60-L71 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.7f334e38`

testClearWorkflowState and testClearAllState clear workflow state and all state respectively, recording success or failure.

- `frontend/src/app/demo/storage-test/page.tsx` L73-L80 @7d6f185b4a0927c0e4d4a293a9a816e033d31788
- `frontend/src/app/demo/storage-test/page.tsx` L82-L89 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.9a0c5fad`

testStorageQuota writes ten 1MB strings to sessionStorage, treats a QuotaExceededError as expected behavior, and removes the test keys in a finally block.

- `frontend/src/app/demo/storage-test/page.tsx` L91-L117 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.1151c4eb`

testStorageDisabled records step-by-step instructions for testing disabled storage and shows an info toast pointing to the console.

- `frontend/src/app/demo/storage-test/page.tsx` L119-L127 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

### `research.frontend-src-app-demo-storage-test.86a3d1b0`

The page renders buttons for each test, the current event store state (events count and selected count), a console log of test results, and testing tips.

- `frontend/src/app/demo/storage-test/page.tsx` L133-L264 @7d6f185b4a0927c0e4d4a293a9a816e033d31788

## Open questions

None.
