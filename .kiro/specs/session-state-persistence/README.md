# Session State Persistence Spec

## Overview

This spec implements sessionStorage-based state persistence for the UP Schedule Generator frontend to fix navigation and refresh issues. The solution uses Zustand's persist middleware to maintain workflow state throughout the browser session while automatically clearing data when the browser closes.

## Problem Statement

The frontend currently lacks proper state persistence, causing:
- Data loss when users refresh pages
- Broken back/forward navigation
- Lost work when accidentally navigating away
- No ability to resume PDF processing jobs after refresh

## Solution

Implement sessionStorage persistence for workflow state (events, selections, job tracking) and maintain localStorage persistence for user preferences (colors, dates, theme). This provides:
- ✅ State survives page refresh and navigation
- ✅ Automatic cleanup when browser closes
- ✅ Job resume capability
- ✅ Graceful error handling
- ✅ No backend changes required

## Key Design Decisions

1. **SessionStorage for Workflow State**: Automatically cleared when browser closes, perfect for temporary workflow data
2. **LocalStorage for Preferences**: Persists across sessions for user convenience
3. **Zustand Persist Middleware**: Leverages existing library, minimal custom code
4. **In-Memory Fallback**: Graceful degradation when storage unavailable
5. **Navigation Guards**: Prevent accessing pages without required data

## Files

- `requirements.md` - User stories and acceptance criteria
- `design.md` - Architecture, components, and correctness properties
- `tasks.md` - Implementation task list with 16 main tasks
- `README.md` - This file

## Implementation Approach

### Phase 1: Core Persistence (Tasks 1-4)
- Storage utilities with error handling
- EventStore with sessionStorage
- ConfigStore verification
- State management utilities

### Phase 2: Navigation & Guards (Tasks 5-8)
- Workflow guard hook
- Update all workflow pages
- Add state restoration

### Phase 3: State Clearing (Tasks 9-10)
- Clear state after calendar generation
- Job resume on upload page

### Phase 4: Error Handling & Testing (Tasks 11-16)
- Storage error handling
- Update existing tests
- Manual testing
- Browser compatibility

## Testing Strategy

- **Unit Tests**: Store persistence, serialization, error handling
- **Property Tests** (optional): 11 properties for comprehensive coverage
- **Integration Tests**: Workflow navigation, job resume
- **Manual Tests**: Cross-browser, storage disabled, quota limits

## Success Criteria

- [ ] Users can refresh any page without losing data
- [ ] Back/forward buttons work correctly
- [ ] State cleared when browser closes
- [ ] State cleared after calendar generation
- [ ] Jobs can be resumed after refresh
- [ ] Config persists across browser sessions
- [ ] Graceful handling of storage errors
- [ ] All tests pass

## Getting Started

To begin implementation:

1. Review the requirements document
2. Review the design document
3. Open `tasks.md` and click "Start task" on task 1
4. Follow the task list sequentially

## Notes

- Optional property-based tests are marked with `*` in tasks.md
- Two checkpoints ensure tests pass before proceeding
- No backend changes required
- Minimal impact on existing code
