# Task 14: Manual Testing Instructions

## Overview

Task 14 requires **manual testing** that must be performed by a human tester. As an AI agent, I cannot directly interact with browsers, refresh pages, or observe UI behavior. However, I have prepared comprehensive documentation to guide you through the testing process.

## What I've Prepared

### 1. Comprehensive Manual Testing Guide
**Location**: `.kiro/specs/session-state-persistence/MANUAL_TESTING_GUIDE.md`

This document includes:
- ✅ Complete testing checklist with 10 major test scenarios
- ✅ Step-by-step instructions for each test
- ✅ Expected results for verification
- ✅ Pass/Fail checkboxes for tracking
- ✅ Space to document issues found
- ✅ DevTools inspection guide
- ✅ Common issues and solutions
- ✅ Browser compatibility testing matrix
- ✅ Test summary and sign-off section

### 2. Test Coverage

The manual testing guide covers all requirements from the spec:

| Requirement | Test Scenarios |
|-------------|----------------|
| 1.1, 1.2 - State restoration on refresh | Sections 2.1-2.5 |
| 1.3 - Auto-clear on tab close | Section 5 |
| 1.4 - Fresh state in new tab | Section 6 |
| 1.5 - Error handling | Section 9 |
| 2.1-2.5 - Job resume | Section 2.2 |
| 3.1-3.5 - Config persistence | Section 5 |
| 4.1-4.4 - State clearing | Section 4 |
| 5.1-5.5 - Storage errors | Section 9 |
| 7.1-7.5 - Navigation guards | Section 8 |
| All - Complete workflow | Section 1 |

## How to Proceed

### Option 1: Perform Manual Testing Yourself

1. **Start the application**:
   ```bash
   docker compose up -d
   ```

2. **Open the testing guide**:
   ```bash
   open .kiro/specs/session-state-persistence/MANUAL_TESTING_GUIDE.md
   ```

3. **Follow the checklist**:
   - Work through each test scenario
   - Check off pass/fail for each test
   - Document any issues found
   - Fill in the test summary at the end

4. **Report results**:
   - Save the completed guide with your results
   - Share any critical issues found
   - Decide if fixes are needed before marking task complete

### Option 2: Delegate to QA Team

If you have a QA team or another team member:
1. Share the `MANUAL_TESTING_GUIDE.md` with them
2. Ask them to complete the testing checklist
3. Review their findings
4. Address any issues they discover

### Option 3: Automated E2E Testing (Partial Coverage)

Some scenarios can be automated with Playwright. I can help create additional E2E tests for:
- ✅ Complete workflow navigation
- ✅ Page refresh scenarios (simulated)
- ✅ Browser back/forward navigation
- ❌ Browser restart (cannot be automated)
- ❌ Incognito mode behavior (limited automation)
- ❌ Storage disabled scenarios (limited automation)

Would you like me to create additional E2E tests to automate what's possible?

## What Cannot Be Automated

The following scenarios require human observation and cannot be fully automated:

1. **Browser Restart Testing**: Requires closing and reopening the browser application
2. **Incognito Mode**: Limited automation support for private browsing
3. **Storage Disabled**: Browser settings changes require manual intervention
4. **Visual Verification**: Confirming UI displays correctly
5. **Cross-Browser Testing**: Requires testing in multiple browser applications
6. **DevTools Inspection**: Manual verification of storage contents

## Current Implementation Status

All code implementation for session state persistence is complete:
- ✅ EventStore with sessionStorage persistence
- ✅ ConfigStore with localStorage persistence
- ✅ Storage utility with error handling and fallback
- ✅ Workflow guard hooks
- ✅ State management utilities
- ✅ All pages updated with guards and state clearing
- ✅ Unit tests passing
- ✅ Integration tests passing

**What's needed**: Manual verification that everything works as expected in real browser environments.

## Marking Task Complete

Once manual testing is complete, you can mark task 14 as complete by:

1. Reviewing the completed testing guide
2. Verifying all critical tests passed
3. Addressing any issues found (or creating follow-up tasks)
4. Updating the task status in `tasks.md`

## Questions?

If you have questions about:
- How to perform a specific test
- What to look for in DevTools
- How to interpret results
- Whether an issue is critical

Please let me know and I can provide additional guidance!

## Next Steps

**Choose one of the following**:

1. **"I'll do the manual testing"** - Use the guide and report back with results
2. **"Create more E2E tests"** - I'll automate what's possible with Playwright
3. **"Skip for now"** - Mark task as complete and move to task 15 (browser compatibility)
4. **"I found issues"** - Share the issues and I'll help fix them

What would you like to do?
