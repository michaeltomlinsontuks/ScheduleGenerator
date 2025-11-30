# Implementation Plan

- [x] 1. Create storage utility module with error handling
  - Create `frontend/src/utils/storage.ts` with storage adapter functions
  - Implement `isStorageAvailable()` to detect storage support
  - Implement `getStorageAdapter()` with in-memory fallback
  - Implement `createInMemoryStorage()` for fallback storage
  - Implement `clearWorkflowStorage()` to clear session data
  - Implement `checkStorageQuota()` for quota monitoring
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ]* 1.1 Write property test for storage fallback
  - **Property 8: Storage Fallback on Unavailability**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 2. Add persistence to EventStore with sessionStorage
  - Update `frontend/src/stores/eventStore.ts` to use Zustand persist middleware
  - Configure sessionStorage as storage backend
  - Implement custom storage with Set serialization (replacer/reviver)
  - Add `partialize` function to select state for persistence
  - Add `onRehydrateStorage` error handler
  - Add `clearWorkflowState()` method to clear workflow data
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2_

- [ ]* 2.1 Write property test for state restoration
  - **Property 1: State Restoration After Refresh**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.2 Write property test for Set serialization
  - **Property 10: Set Serialization Round-Trip**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 2.3 Write property test for error handling
  - **Property 2: Graceful Error Handling for Corrupted Data**
  - **Validates: Requirements 1.5**

- [ ]* 2.4 Write property test for job state persistence
  - **Property 3: Job State Persistence**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 2.5 Write property test for nested object integrity
  - **Property 11: Nested Object Integrity**
  - **Validates: Requirements 6.5**

- [x] 3. Update ConfigStore to ensure localStorage persistence
  - Verify `frontend/src/stores/configStore.ts` uses localStorage (already implemented)
  - Ensure Date serialization works correctly with existing dateStorage
  - Verify `partialize` includes all config fields
  - Test that config persists across browser sessions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3, 6.4_

- [ ]* 3.1 Write property test for config persistence
  - **Property 5: Configuration Persistence in LocalStorage**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ]* 3.2 Write property test for Date serialization
  - **Property 6: Date Serialization Round-Trip**
  - **Validates: Requirements 3.5, 6.3, 6.4**

- [x] 4. Create state management utility module
  - Create `frontend/src/utils/stateManagement.ts`
  - Implement `clearWorkflowState()` to clear only workflow data
  - Implement `clearAllState()` to clear everything except theme
  - Add error handling and logging
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 4.1 Write property test for workflow state clearing
  - **Property 7: Workflow State Clearing Preserves Config**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Create workflow guard hook for navigation protection
  - Create `frontend/src/hooks/useWorkflowGuard.ts`
  - Implement guard logic for preview, customize, and generate pages
  - Add redirect logic when requirements not met
  - Add console logging for debugging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 5.1 Write unit tests for workflow guard hook
  - Test redirect when events missing
  - Test redirect when selections missing
  - Test no redirect when state valid
  - Test for each workflow page

- [x] 6. Update preview page with workflow guard and state restoration
  - Add `useWorkflowGuard('preview')` hook to `frontend/src/app/preview/page.tsx`
  - Remove existing empty state redirect logic (now handled by guard)
  - Verify state restoration works on page refresh
  - Test navigation from upload page
  - _Requirements: 1.1, 1.2, 7.1, 7.5_

- [x] 7. Update customize page with workflow guard and state restoration
  - Add `useWorkflowGuard('customize')` hook to `frontend/src/app/customize/page.tsx`
  - Remove existing empty state redirect logic (now handled by guard)
  - Verify state restoration works on page refresh
  - Test navigation from preview page
  - _Requirements: 1.1, 1.2, 7.2, 7.5_

- [x] 8. Update generate page with workflow guard and state restoration
  - Add `useWorkflowGuard('generate')` hook to `frontend/src/app/generate/page.tsx`
  - Remove existing empty state redirect logic (now handled by guard)
  - Verify state restoration works on page refresh
  - Test navigation from customize page
  - _Requirements: 1.1, 1.2, 7.3, 7.5_

- [x] 9. Update generate page with state clearing after calendar generation
  - Import `clearWorkflowState` from `utils/stateManagement`
  - Call `clearWorkflowState()` after successful ICS download
  - Call `clearWorkflowState()` after successful Google Calendar sync
  - Update "Upload Another PDF" button to call `clearAllState()`
  - Add user feedback for state clearing
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Update upload page to handle job resume
  - Check for existing jobId in eventStore on page mount
  - If jobId exists and no events, resume polling for job status
  - Display "Resuming job..." message when resuming
  - Clear job state on job failure
  - Store job state when new job starts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 10.1 Write property test for job state clearing
  - **Property 4: Job State Clearing on Failure**
  - **Validates: Requirements 2.4**

- [x] 11. Add storage error handling and user notifications
  - Add try-catch blocks around storage operations in stores
  - Display toast notifications for storage errors
  - Log storage errors to console for debugging
  - Test with storage disabled in browser
  - Test with quota exceeded scenario
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 11.1 Write property test for quota handling
  - **Property 9: Storage Quota Handling**
  - **Validates: Requirements 5.3**

- [x] 12. Update existing store tests to account for persistence
  - Update `frontend/src/stores/stores.test.ts`
  - Mock sessionStorage and localStorage in tests
  - Test that eventStore uses sessionStorage
  - Test that configStore uses localStorage
  - Test store rehydration behavior
  - Add tests for serialization edge cases
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Manual testing across workflow
  - Test complete workflow: upload → preview → customize → generate
  - Test page refresh at each step
  - Test browser back/forward buttons
  - Test "Upload Another PDF" clears state
  - Test calendar generation clears workflow state
  - Test config persists across browser restart
  - Test new tab starts fresh
  - Test private/incognito mode
  - Document any issues found
  - _Requirements: All_

- [x] 15. Browser compatibility testing
  - Test in Chrome (latest)
  - Test in Firefox (latest)
  - Test in Safari (latest)
  - Test in Edge (latest)
  - Test with storage disabled
  - Test with quota limits
  - Document browser-specific issues
  - _Requirements: 5.1, 5.5_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
