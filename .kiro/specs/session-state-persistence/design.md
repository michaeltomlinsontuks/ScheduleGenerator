# Design Document

## Overview

This design implements sessionStorage-based state persistence for the UP Schedule Generator frontend using Zustand's persist middleware. The solution maintains workflow state throughout the browser session while automatically clearing data when the browser closes, providing a seamless user experience without the complexity of server-side session management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Tab Session                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Upload     │─────▶│   Preview    │                     │
│  │   Page       │      │   Page       │                     │
│  └──────────────┘      └──────────────┘                     │
│         │                      │                             │
│         │                      ▼                             │
│         │              ┌──────────────┐                     │
│         │              │  Customize   │                     │
│         │              │   Page       │                     │
│         │              └──────────────┘                     │
│         │                      │                             │
│         │                      ▼                             │
│         │              ┌──────────────┐                     │
│         └─────────────▶│  Generate    │                     │
│                        │   Page       │                     │
│                        └──────────────┘                     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Zustand Stores                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  EventStore (sessionStorage)                       │     │
│  │  - events: ParsedEvent[]                           │     │
│  │  - selectedIds: Set<string>                        │     │
│  │  - jobId: string | null                            │     │
│  │  - jobStatus: JobStatus | null                     │     │
│  │  - pdfType: PdfType | null                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ConfigStore (localStorage)                        │     │
│  │  - semesterStart: Date | null                      │     │
│  │  - semesterEnd: Date | null                        │     │
│  │  - moduleColors: Record<string, string>            │     │
│  │  - theme: 'light' | 'dark'                         │     │
│  │  - selectedCalendarId: string | null               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  AuthStore (in-memory only)                        │     │
│  │  - isAuthenticated: boolean                        │     │
│  │  - user: AuthUser | null                           │     │
│  │  - isLoading: boolean                              │     │
│  │  - error: string | null                            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Storage Strategy

**SessionStorage (Workflow State)**
- Cleared automatically when browser tab closes
- Used for: events, selections, job tracking, PDF type
- Survives: page refresh, navigation, back/forward buttons
- Isolated per tab

**LocalStorage (User Preferences)**
- Persists across browser sessions
- Used for: module colors, semester dates, theme, calendar selection
- Survives: browser close/reopen
- Shared across tabs

**In-Memory (Transient State)**
- Cleared on page refresh
- Used for: authentication state, loading states, UI state
- Fastest access, no serialization overhead

## Components and Interfaces

### 1. Enhanced EventStore with Persistence

```typescript
// frontend/src/stores/eventStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ParsedEvent, ProcessingJob } from '@/types';
import { useConfigStore } from './configStore';

export type PdfType = 'lecture' | 'test' | 'exam';

interface EventState {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  jobId: string | null;
  jobStatus: ProcessingJob['status'] | null;
  pdfType: PdfType | null;
}

interface EventActions {
  setEvents: (events: ParsedEvent[], pdfType?: PdfType) => void;
  setJobId: (jobId: string | null) => void;
  setJobStatus: (status: ProcessingJob['status'] | null) => void;
  toggleEvent: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedEvents: () => ParsedEvent[];
  reset: () => void;
  clearWorkflowState: () => void;
}

type EventStore = EventState & EventActions;

const initialState: EventState = {
  events: [],
  selectedIds: new Set<string>(),
  jobId: null,
  jobStatus: null,
  pdfType: null,
};

// Custom storage with Set serialization
const eventStorage = createJSONStorage<EventState>(() => sessionStorage, {
  // Serialize: Convert Set to Array
  replacer: (key, value) => {
    if (key === 'selectedIds' && value instanceof Set) {
      return Array.from(value);
    }
    return value;
  },
  // Deserialize: Convert Array back to Set
  reviver: (key, value) => {
    if (key === 'selectedIds' && Array.isArray(value)) {
      return new Set(value);
    }
    return value;
  },
});

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setEvents: (events, pdfType) => {
        const allIds = new Set(events.map((e) => e.id));
        set({ events, selectedIds: allIds, pdfType: pdfType || null });
        
        if (pdfType && pdfType !== 'lecture') {
          const configStore = useConfigStore.getState();
          configStore.setSemesterStart(null);
          configStore.setSemesterEnd(null);
        }
      },

      setJobId: (jobId) => set({ jobId }),

      setJobStatus: (jobStatus) => set({ jobStatus }),

      toggleEvent: (id) => {
        const { selectedIds } = get();
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
        set({ selectedIds: newSelectedIds });
      },

      selectAll: () => {
        const { events } = get();
        const allIds = new Set(events.map((e) => e.id));
        set({ selectedIds: allIds });
      },

      deselectAll: () => {
        set({ selectedIds: new Set<string>() });
      },

      getSelectedEvents: () => {
        const { events, selectedIds } = get();
        return events.filter((e) => selectedIds.has(e.id));
      },

      reset: () => set({ ...initialState, selectedIds: new Set<string>() }),

      clearWorkflowState: () => {
        set({ ...initialState, selectedIds: new Set<string>() });
      },
    }),
    {
      name: 'schedule-events',
      storage: eventStorage,
      partialize: (state) => ({
        events: state.events,
        selectedIds: state.selectedIds,
        jobId: state.jobId,
        jobStatus: state.jobStatus,
        pdfType: state.pdfType,
      }),
      // Handle storage errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate event store:', error);
          // Reset to initial state on error
          useEventStore.getState().reset();
        }
      },
    }
  )
);
```

### 2. Storage Utility Module

```typescript
// frontend/src/utils/storage.ts

/**
 * Storage utility for handling browser storage operations with error handling
 */

export type StorageType = 'localStorage' | 'sessionStorage';

export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

/**
 * Check if storage is available and working
 */
export function isStorageAvailable(type: StorageType): boolean {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get storage adapter with fallback to in-memory storage
 */
export function getStorageAdapter(type: StorageType): StorageAdapter {
  if (isStorageAvailable(type)) {
    return window[type];
  }

  // Fallback to in-memory storage
  console.warn(`${type} is not available, using in-memory storage`);
  return createInMemoryStorage();
}

/**
 * Create in-memory storage adapter for fallback
 */
function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

/**
 * Clear all workflow-related data from sessionStorage
 */
export function clearWorkflowStorage(): void {
  try {
    const storage = getStorageAdapter('sessionStorage');
    storage.removeItem('schedule-events');
  } catch (error) {
    console.error('Failed to clear workflow storage:', error);
  }
}

/**
 * Check storage quota and available space
 */
export async function checkStorageQuota(): Promise<{
  available: boolean;
  usage?: number;
  quota?: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = usage < quota * 0.9; // 90% threshold

      return { available, usage, quota };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }

  return { available: true };
}
```

### 3. Navigation Guard Hook

```typescript
// frontend/src/hooks/useWorkflowGuard.ts

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventStore } from '@/stores/eventStore';

export type WorkflowPage = 'preview' | 'customize' | 'generate';

interface WorkflowRequirements {
  preview: () => boolean;
  customize: () => boolean;
  generate: () => boolean;
}

/**
 * Hook to guard workflow pages and redirect if requirements not met
 */
export function useWorkflowGuard(page: WorkflowPage) {
  const router = useRouter();
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);

  useEffect(() => {
    const requirements: WorkflowRequirements = {
      preview: () => events.length > 0,
      customize: () => events.length > 0 && selectedIds.size > 0,
      generate: () => events.length > 0 && selectedIds.size > 0,
    };

    const redirects: Record<WorkflowPage, string> = {
      preview: '/upload',
      customize: '/preview',
      generate: '/customize',
    };

    if (!requirements[page]()) {
      console.log(`Workflow guard: redirecting from ${page} to ${redirects[page]}`);
      router.push(redirects[page]);
    }
  }, [page, events.length, selectedIds.size, router]);
}
```

### 4. State Clearing Utility

```typescript
// frontend/src/utils/stateManagement.ts

import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { clearWorkflowStorage } from './storage';

/**
 * Clear all workflow state after successful calendar generation
 */
export function clearWorkflowState(): void {
  try {
    // Clear event store
    useEventStore.getState().clearWorkflowState();
    
    // Clear sessionStorage
    clearWorkflowStorage();
    
    console.log('Workflow state cleared successfully');
  } catch (error) {
    console.error('Failed to clear workflow state:', error);
  }
}

/**
 * Clear all state including preferences (for "Upload Another PDF")
 */
export function clearAllState(): void {
  try {
    // Clear workflow state
    clearWorkflowState();
    
    // Clear config store (but keep theme preference)
    const currentTheme = useConfigStore.getState().theme;
    useConfigStore.getState().reset();
    useConfigStore.getState().setTheme(currentTheme);
    
    console.log('All state cleared successfully');
  } catch (error) {
    console.error('Failed to clear all state:', error);
  }
}
```

## Data Models

### Persisted State Schema

```typescript
// SessionStorage Schema
interface PersistedEventState {
  state: {
    events: ParsedEvent[];
    selectedIds: string[]; // Serialized from Set
    jobId: string | null;
    jobStatus: 'pending' | 'processing' | 'complete' | 'failed' | null;
    pdfType: 'lecture' | 'test' | 'exam' | null;
  };
  version: number;
}

// LocalStorage Schema
interface PersistedConfigState {
  state: {
    semesterStart: string | null; // ISO date string
    semesterEnd: string | null; // ISO date string
    moduleColors: Record<string, string>;
    theme: 'light' | 'dark';
    selectedCalendarId: string | null;
  };
  version: number;
}
```

### Storage Keys

```typescript
const STORAGE_KEYS = {
  EVENTS: 'schedule-events',
  CONFIG: 'schedule-config',
} as const;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: State Restoration After Refresh

*For any* workflow state (events, selections, jobId, pdfType), storing it in the event store and then creating a new store instance should restore the exact same state from sessionStorage.

**Validates: Requirements 1.1, 1.2**

### Property 2: Graceful Error Handling for Corrupted Data

*For any* corrupted or invalid data in sessionStorage (malformed JSON, wrong data types, missing fields), attempting to rehydrate the store should reset to initial state without throwing errors.

**Validates: Requirements 1.5**

### Property 3: Job State Persistence

*For any* job ID and status, setting them in the event store should persist them to sessionStorage and restore them correctly after rehydration.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Job State Clearing on Failure

*For any* job state in the store, calling the clear job state method should remove all job-related data from both memory and sessionStorage.

**Validates: Requirements 2.4**

### Property 5: Configuration Persistence in LocalStorage

*For any* configuration value (module colors, semester dates, calendar ID, theme), setting it in the config store should persist to localStorage and survive store rehydration.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Date Serialization Round-Trip

*For any* valid Date object, storing it in the config store should serialize it as an ISO string in localStorage, and rehydrating should restore it as an equivalent Date object.

**Validates: Requirements 3.5, 6.3, 6.4**

### Property 7: Workflow State Clearing Preserves Config

*For any* workflow state and configuration state, clearing workflow state should remove all event data from sessionStorage while maintaining all configuration data in localStorage.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 8: Storage Fallback on Unavailability

*For any* storage operation, if sessionStorage is unavailable (throws error, quota exceeded, or disabled), the system should fall back to in-memory storage without crashing.

**Validates: Requirements 5.1, 5.2, 5.5**

### Property 9: Storage Quota Handling

*For any* storage operation that exceeds quota, the system should detect the error, clear old data, and retry the operation successfully.

**Validates: Requirements 5.3**

### Property 10: Set Serialization Round-Trip

*For any* Set of strings (selectedIds), storing it in the event store should serialize it as an Array in sessionStorage, and rehydrating should restore it as an equivalent Set with the same members.

**Validates: Requirements 6.1, 6.2**

### Property 11: Nested Object Integrity

*For any* nested object structure (events with nested properties), storing it in the event store should maintain complete data structure integrity through serialization and deserialization.

**Validates: Requirements 6.5**

## Error Handling

### Storage Errors

1. **Storage Unavailable**
   - Detection: Try-catch around storage operations
   - Fallback: In-memory storage adapter
   - User Impact: Warning toast notification
   - Recovery: Automatic fallback, no user action needed

2. **Quota Exceeded**
   - Detection: QuotaExceededError exception
   - Fallback: Clear old workflow data, retry operation
   - User Impact: Warning notification about storage limits
   - Recovery: Automatic cleanup and retry

3. **Parse Errors**
   - Detection: JSON.parse exceptions during rehydration
   - Fallback: Reset to initial state
   - User Impact: Silent recovery, log error to console
   - Recovery: User starts fresh workflow

4. **Serialization Errors**
   - Detection: Try-catch around JSON.stringify
   - Fallback: Skip persistence for that operation
   - User Impact: State not persisted, works in-memory only
   - Recovery: Continue with in-memory state

### Data Validation Errors

1. **Invalid State Shape**
   - Detection: Type checking during rehydration
   - Fallback: Reset to initial state
   - User Impact: Silent recovery
   - Recovery: Fresh start

2. **Corrupted Set/Date Objects**
   - Detection: Type checking in reviver functions
   - Fallback: Use default values (empty Set, null Date)
   - User Impact: Partial state recovery
   - Recovery: User may need to re-select events or dates

### Navigation Errors

1. **Missing Required Data**
   - Detection: Workflow guard checks on page mount
   - Fallback: Redirect to appropriate previous page
   - User Impact: Automatic redirect with console log
   - Recovery: User follows workflow from correct step

## Testing Strategy

### Unit Tests

**Store Persistence Tests**
- Test event store persists to sessionStorage
- Test config store persists to localStorage
- Test auth store does NOT persist
- Test store rehydration on initialization
- Test partial state persistence (partialize function)

**Serialization Tests**
- Test Set to Array conversion and back
- Test Date to ISO string conversion and back
- Test nested object serialization
- Test handling of undefined/null values
- Test large data structures

**Error Handling Tests**
- Test storage unavailable scenario
- Test quota exceeded scenario
- Test corrupted JSON in storage
- Test invalid data types in storage
- Test missing required fields

**State Clearing Tests**
- Test clearWorkflowState removes only workflow data
- Test clearAllState removes everything except theme
- Test reset() method behavior
- Test storage cleanup after clearing

### Integration Tests

**Workflow Navigation Tests**
- Test navigation from upload → preview → customize → generate
- Test back button maintains state
- Test forward button maintains state
- Test direct URL access with/without state
- Test workflow guards redirect correctly

**Job Resume Tests**
- Test job state persists during processing
- Test job state restored after refresh
- Test job completion updates persisted state
- Test job failure clears persisted state

**Cross-Tab Behavior Tests**
- Test new tab starts with fresh state
- Test localStorage config shared across tabs
- Test sessionStorage isolated per tab

### Property-Based Tests

**Property Test Framework**: fast-check (TypeScript property testing library)

**Test Configuration**: Minimum 100 iterations per property test

**Property 1: State Restoration Round-Trip**
```typescript
// Generate random workflow state, persist it, rehydrate, verify equality
fc.assert(
  fc.property(
    fc.array(fc.record({ /* ParsedEvent shape */ })),
    fc.array(fc.string()),
    fc.option(fc.string()),
    (events, selectedIds, jobId) => {
      // Test implementation
    }
  ),
  { numRuns: 100 }
);
```

**Property 2: Set Serialization Invariant**
```typescript
// For any Set, serialize then deserialize should equal original
fc.assert(
  fc.property(
    fc.set(fc.string()),
    (originalSet) => {
      const serialized = Array.from(originalSet);
      const deserialized = new Set(serialized);
      return setsAreEqual(originalSet, deserialized);
    }
  ),
  { numRuns: 100 }
);
```

**Property 3: Date Serialization Invariant**
```typescript
// For any Date, serialize then deserialize should be equivalent
fc.assert(
  fc.property(
    fc.date(),
    (originalDate) => {
      const serialized = originalDate.toISOString();
      const deserialized = new Date(serialized);
      return originalDate.getTime() === deserialized.getTime();
    }
  ),
  { numRuns: 100 }
);
```

**Property 4: Error Recovery Invariant**
```typescript
// For any corrupted data, rehydration should not crash
fc.assert(
  fc.property(
    fc.anything(), // Generate random invalid data
    (corruptedData) => {
      try {
        // Attempt to rehydrate with corrupted data
        const store = createStoreWithData(corruptedData);
        // Should either succeed or reset to initial state
        return true;
      } catch (error) {
        // Should never throw
        return false;
      }
    }
  ),
  { numRuns: 100 }
);
```

**Property 5: Workflow State Clearing Preserves Config**
```typescript
// For any workflow and config state, clearing workflow preserves config
fc.assert(
  fc.property(
    fc.record({ /* workflow state */ }),
    fc.record({ /* config state */ }),
    (workflowState, configState) => {
      // Set both states
      setWorkflowState(workflowState);
      setConfigState(configState);
      
      // Clear workflow
      clearWorkflowState();
      
      // Verify config unchanged
      return configEquals(getConfigState(), configState);
    }
  ),
  { numRuns: 100 }
);
```

### Manual Testing Checklist

- [ ] Upload PDF, refresh page, verify events restored
- [ ] Select events, navigate back, verify selections maintained
- [ ] Customize colors, close browser, reopen, verify colors persisted
- [ ] Set semester dates, refresh, verify dates restored as Date objects
- [ ] Start job, refresh during processing, verify job continues
- [ ] Complete workflow, verify state cleared after generation
- [ ] Click "Upload Another PDF", verify all workflow state cleared
- [ ] Open in new tab, verify fresh state
- [ ] Test in private/incognito mode
- [ ] Test with storage disabled (browser settings)
- [ ] Test with full storage quota

## Performance Considerations

### Storage Size Optimization

**Estimated Storage Usage**:
- Events: ~1KB per event × 100 events = ~100KB
- Selections: ~50 bytes per ID × 100 IDs = ~5KB
- Job state: ~100 bytes
- Config: ~2KB
- **Total: ~107KB per session**

**SessionStorage Limit**: Typically 5-10MB per origin
**Headroom**: ~98× current usage, plenty of room for growth

### Serialization Performance

**Benchmarks** (estimated):
- Serialize 100 events: ~5ms
- Deserialize 100 events: ~8ms
- Set conversion: <1ms
- Date conversion: <1ms

**Impact**: Negligible on user experience (<10ms per operation)

### Rehydration Strategy

**On Page Load**:
1. Zustand persist middleware automatically rehydrates from storage
2. Happens synchronously before first render
3. No loading state needed for persisted data
4. Fallback to initial state if rehydration fails

**Optimization**: Use `partialize` to only persist necessary state, reducing serialization overhead

## Migration Strategy

### Phase 1: Add Persistence to EventStore
- Add persist middleware to eventStore
- Configure sessionStorage adapter
- Add Set serialization logic
- Test with existing functionality

### Phase 2: Update Page Components
- Add workflow guard hooks to pages
- Update state clearing logic in generate page
- Test navigation flows

### Phase 3: Add Storage Utilities
- Implement storage adapter with fallback
- Add error handling utilities
- Add quota checking

### Phase 4: Testing and Validation
- Write unit tests for all stores
- Write integration tests for workflows
- Write property-based tests
- Manual testing across browsers

### Rollback Plan

If issues arise:
1. Remove persist middleware from stores
2. Revert to in-memory only state
3. Users lose state on refresh (current behavior)
4. No data corruption risk

## Browser Compatibility

**SessionStorage Support**: All modern browsers (IE8+)
**LocalStorage Support**: All modern browsers (IE8+)
**Storage API**: Modern browsers only (Chrome 52+, Firefox 57+, Safari 11.1+)

**Fallback Strategy**:
- Primary: Native sessionStorage/localStorage
- Fallback: In-memory storage adapter
- Detection: Try-catch on storage operations

## Security Considerations

### Data Sensitivity

**SessionStorage Data**:
- Events: Public schedule data (low sensitivity)
- Job IDs: Temporary identifiers (low sensitivity)
- No PII or authentication tokens stored

**LocalStorage Data**:
- Module colors: User preferences (no sensitivity)
- Semester dates: Academic calendar (no sensitivity)
- Calendar ID: Google Calendar identifier (low sensitivity)

**Risk Assessment**: Low - no sensitive data persisted

### XSS Protection

**Mitigation**:
- Next.js automatic XSS protection
- No eval() or innerHTML usage
- Sanitized data from backend
- CSP headers in production

**Storage Access**: Only accessible from same origin, protected by browser same-origin policy

## Future Enhancements

### Potential Improvements

1. **Compression**: Use LZ-string to compress large event arrays
2. **Versioning**: Add schema version for migration support
3. **Partial Updates**: Only persist changed state, not full state
4. **Background Sync**: Sync state to backend for cross-device support
5. **State Snapshots**: Allow users to save/restore workflow snapshots
6. **Analytics**: Track storage usage and errors for monitoring

### Not Included in This Design

- Server-side session storage
- Cross-device state sync
- Persistent undo/redo history
- State export/import functionality
- Encrypted storage
