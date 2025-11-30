# Manual Testing Guide: Session State Persistence

## Purpose
This document provides a comprehensive manual testing checklist for verifying session state persistence functionality in the UP Schedule Generator. These tests verify that workflow state persists correctly across page refreshes, browser navigation, and various browser configurations.

## Prerequisites

### Environment Setup
- [ ] All Docker services running: `docker compose up -d`
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend accessible at http://localhost:3001
- [ ] Test PDF files available in `SourceFiles/` directory

### Browser Setup
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version) - macOS only
- [ ] Edge (latest version)

### Test Data
- [ ] `SourceFiles/UP_MOD_XLS.pdf` - Lecture schedule (weekly recurring)
- [ ] `SourceFiles/UP_TST_PDF.pdf` - Test schedule (one-time events)
- [ ] `SourceFiles/UP_EXAM_SS.pdf` - Exam schedule (one-time events)

## Test Scenarios

### 1. Complete Workflow Test (Happy Path)

**Objective**: Verify state persists through the entire workflow

**Steps**:
1. Open http://localhost:3000 in a fresh browser tab
2. Click "Get Started" to navigate to upload page
3. Upload `UP_MOD_XLS.pdf` (lecture schedule)
4. Wait for processing to complete
5. Verify you're redirected to preview page
6. Verify all parsed events are displayed
7. Select/deselect a few events
8. Click "Next" to go to customize page
9. Change module colors for 2-3 modules
10. Set semester start date (e.g., Feb 10, 2025)
11. Set semester end date (e.g., May 30, 2025)
12. Click "Next" to go to generate page
13. Verify selected events and customizations are shown

**Expected Results**:
- ✅ All events persist through navigation
- ✅ Event selections persist through navigation
- ✅ Module colors persist through navigation
- ✅ Semester dates persist through navigation
- ✅ No data loss at any step

**Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
```
[Document any issues here]
```

---

### 2. Page Refresh at Each Step

**Objective**: Verify state restoration after page refresh

#### 2.1 Refresh on Upload Page (No Job)
**Steps**:
1. Navigate to http://localhost:3000/upload
2. Refresh the page (Cmd+R / Ctrl+R)
3. Verify page loads correctly

**Expected Results**:
- ✅ Page loads with empty state
- ✅ No errors in console
- ✅ Upload form is functional

**Status**: ⬜ Pass / ⬜ Fail

#### 2.2 Refresh During Job Processing
**Steps**:
1. Navigate to upload page
2. Upload a PDF file
3. Immediately refresh the page while processing
4. Observe behavior

**Expected Results**:
- ✅ Job ID is restored from sessionStorage
- ✅ Polling continues for job status
- ✅ "Resuming job..." message is displayed
- ✅ Events appear when job completes

**Status**: ⬜ Pass / ⬜ Fail

#### 2.3 Refresh on Preview Page
**Steps**:
1. Complete upload and navigate to preview page
2. Select some events (not all)
3. Refresh the page (Cmd+R / Ctrl+R)
4. Verify state

**Expected Results**:
- ✅ All events are restored
- ✅ Event selections are restored
- ✅ Selected count matches pre-refresh state
- ✅ No console errors

**Status**: ⬜ Pass / ⬜ Fail

#### 2.4 Refresh on Customize Page
**Steps**:
1. Navigate to customize page
2. Change 2-3 module colors
3. Set semester dates
4. Refresh the page (Cmd+R / Ctrl+R)
5. Verify state

**Expected Results**:
- ✅ Events are restored
- ✅ Selections are restored
- ✅ Module colors are restored
- ✅ Semester dates are restored as Date objects
- ✅ No console errors

**Status**: ⬜ Pass / ⬜ Fail

#### 2.5 Refresh on Generate Page
**Steps**:
1. Navigate to generate page
2. Refresh the page (Cmd+R / Ctrl+R)
3. Verify state

**Expected Results**:
- ✅ Events are restored
- ✅ Selections are restored
- ✅ Customizations are restored
- ✅ Calendar preview is correct
- ✅ No console errors

**Status**: ⬜ Pass / ⬜ Fail

---

### 3. Browser Back/Forward Navigation

**Objective**: Verify state persists with browser navigation

**Steps**:
1. Complete workflow: Upload → Preview → Customize → Generate
2. Click browser back button 3 times
3. Verify you're on preview page with correct state
4. Click browser forward button 2 times
5. Verify you're on generate page with correct state
6. Click back button to customize
7. Change a module color
8. Click forward button
9. Verify color change is reflected

**Expected Results**:
- ✅ Back button maintains all state
- ✅ Forward button maintains all state
- ✅ State changes persist through navigation
- ✅ No data loss or corruption

**Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
```
[Document any issues here]
```

---

### 4. State Clearing Tests

#### 4.1 Clear After ICS Download
**Steps**:
1. Complete workflow to generate page
2. Click "Download ICS" button
3. Wait for download to complete
4. Check sessionStorage in DevTools (Application → Storage → Session Storage)
5. Navigate to upload page

**Expected Results**:
- ✅ Workflow state is cleared from sessionStorage
- ✅ `schedule-events` key is removed or empty
- ✅ Config preferences remain in localStorage
- ✅ Upload page shows empty state

**Status**: ⬜ Pass / ⬜ Fail

#### 4.2 Clear After Google Calendar Sync
**Steps**:
1. Complete workflow to generate page
2. Authenticate with Google (if not already)
3. Click "Sync to Google Calendar"
4. Wait for sync to complete
5. Check sessionStorage in DevTools
6. Navigate to upload page

**Expected Results**:
- ✅ Workflow state is cleared from sessionStorage
- ✅ Config preferences remain in localStorage
- ✅ Upload page shows empty state

**Status**: ⬜ Pass / ⬜ Fail

#### 4.3 Clear with "Upload Another PDF"
**Steps**:
1. Complete workflow to generate page
2. Click "Upload Another PDF" button
3. Check both sessionStorage and localStorage in DevTools
4. Verify upload page state

**Expected Results**:
- ✅ All workflow state is cleared
- ✅ Module colors are cleared
- ✅ Semester dates are cleared
- ✅ Calendar selection is cleared
- ✅ Theme preference is preserved
- ✅ Upload page shows empty state

**Status**: ⬜ Pass / ⬜ Fail

---

### 5. Configuration Persistence Across Browser Restart

**Objective**: Verify localStorage persists across browser sessions

**Steps**:
1. Complete workflow and set:
   - Module colors for 3 modules
   - Semester start date
   - Semester end date
   - Select a Google Calendar
   - Change theme to dark mode
2. Note the exact values
3. Close the browser completely (quit application)
4. Reopen browser and navigate to http://localhost:3000/upload
5. Upload a PDF and navigate to customize page
6. Verify configuration

**Expected Results**:
- ✅ Module colors are restored
- ✅ Semester dates are restored
- ✅ Calendar selection is restored
- ✅ Theme preference is restored
- ✅ Dates are proper Date objects (not strings)

**Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
```
[Document any issues here]
```

---

### 6. New Tab Behavior

**Objective**: Verify sessionStorage isolation between tabs

**Steps**:
1. In Tab 1: Complete workflow to customize page
2. Note the events and selections
3. Open a new tab (Cmd+T / Ctrl+T)
4. In Tab 2: Navigate to http://localhost:3000
5. In Tab 2: Navigate to upload page
6. Verify Tab 2 state
7. In Tab 2: Upload a different PDF
8. Switch back to Tab 1
9. Verify Tab 1 state is unchanged

**Expected Results**:
- ✅ Tab 2 starts with fresh/empty state
- ✅ Tab 1 maintains its own state
- ✅ Tabs are isolated (sessionStorage is per-tab)
- ✅ localStorage config is shared between tabs

**Status**: ⬜ Pass / ⬜ Fail

---

### 7. Private/Incognito Mode

**Objective**: Verify functionality in private browsing mode

#### 7.1 Chrome Incognito
**Steps**:
1. Open Chrome Incognito window (Cmd+Shift+N / Ctrl+Shift+N)
2. Navigate to http://localhost:3000
3. Complete full workflow
4. Refresh page at customize step
5. Close and reopen incognito window
6. Navigate to http://localhost:3000

**Expected Results**:
- ✅ Application works normally in incognito
- ✅ State persists on refresh within session
- ✅ State is cleared when incognito window closes
- ✅ No errors related to storage

**Status**: ⬜ Pass / ⬜ Fail

#### 7.2 Firefox Private Window
**Steps**:
1. Open Firefox Private Window (Cmd+Shift+P / Ctrl+Shift+P)
2. Navigate to http://localhost:3000
3. Complete full workflow
4. Refresh page at customize step
5. Close and reopen private window
6. Navigate to http://localhost:3000

**Expected Results**:
- ✅ Application works normally in private mode
- ✅ State persists on refresh within session
- ✅ State is cleared when private window closes
- ✅ No errors related to storage

**Status**: ⬜ Pass / ⬜ Fail

#### 7.3 Safari Private Browsing
**Steps**:
1. Open Safari Private Window (Cmd+Shift+N)
2. Navigate to http://localhost:3000
3. Complete full workflow
4. Refresh page at customize step
5. Close and reopen private window
6. Navigate to http://localhost:3000

**Expected Results**:
- ✅ Application works normally in private mode
- ✅ State persists on refresh within session
- ✅ State is cleared when private window closes
- ✅ No errors related to storage

**Status**: ⬜ Pass / ⬜ Fail

---

### 8. Navigation Guards

**Objective**: Verify proper redirects when accessing pages without required data

#### 8.1 Direct Access to Preview Without Events
**Steps**:
1. Open fresh browser tab
2. Navigate directly to http://localhost:3000/preview
3. Observe behavior

**Expected Results**:
- ✅ Redirected to /upload
- ✅ Console log shows: "Workflow guard: redirecting from preview to /upload"
- ✅ No errors or crashes

**Status**: ⬜ Pass / ⬜ Fail

#### 8.2 Direct Access to Customize Without Selections
**Steps**:
1. Upload PDF and navigate to preview
2. Deselect all events
3. Navigate directly to http://localhost:3000/customize
4. Observe behavior

**Expected Results**:
- ✅ Redirected to /preview
- ✅ Console log shows: "Workflow guard: redirecting from customize to /preview"
- ✅ No errors or crashes

**Status**: ⬜ Pass / ⬜ Fail

#### 8.3 Direct Access to Generate Without Selections
**Steps**:
1. Open fresh browser tab
2. Navigate directly to http://localhost:3000/generate
3. Observe behavior

**Expected Results**:
- ✅ Redirected to /customize (or /preview if no events)
- ✅ Console log shows appropriate redirect message
- ✅ No errors or crashes

**Status**: ⬜ Pass / ⬜ Fail

---

### 9. Storage Error Handling

#### 9.1 Storage Disabled
**Steps**:
1. Open Chrome DevTools
2. Go to Application → Storage
3. Check "Block third-party cookies" or disable storage
4. Navigate to http://localhost:3000
5. Try to complete workflow
6. Check console for errors

**Expected Results**:
- ✅ Application falls back to in-memory storage
- ✅ Warning message displayed to user
- ✅ Console shows: "sessionStorage is not available, using in-memory storage"
- ✅ Workflow functions (but state lost on refresh)
- ✅ No crashes or unhandled errors

**Status**: ⬜ Pass / ⬜ Fail

#### 9.2 Storage Quota Exceeded (Simulated)
**Steps**:
1. Open DevTools Console
2. Run this code to fill storage:
```javascript
try {
  for (let i = 0; i < 10000; i++) {
    sessionStorage.setItem('test' + i, 'x'.repeat(10000));
  }
} catch (e) {
  console.log('Storage full:', e);
}
```
3. Try to upload PDF and complete workflow
4. Observe behavior

**Expected Results**:
- ✅ Application detects quota exceeded
- ✅ Old data is cleared automatically
- ✅ Operation retries successfully
- ✅ User sees warning about storage limits
- ✅ No crashes

**Status**: ⬜ Pass / ⬜ Fail

---

### 10. Browser Compatibility

#### 10.1 Chrome (Latest)
**Steps**:
1. Open Chrome
2. Run complete workflow test (Section 1)
3. Run page refresh tests (Section 2)
4. Check DevTools console for errors

**Expected Results**:
- ✅ All functionality works
- ✅ No console errors
- ✅ State persists correctly

**Status**: ⬜ Pass / ⬜ Fail
**Chrome Version**: _____________

#### 10.2 Firefox (Latest)
**Steps**:
1. Open Firefox
2. Run complete workflow test (Section 1)
3. Run page refresh tests (Section 2)
4. Check Browser Console for errors

**Expected Results**:
- ✅ All functionality works
- ✅ No console errors
- ✅ State persists correctly

**Status**: ⬜ Pass / ⬜ Fail
**Firefox Version**: _____________

#### 10.3 Safari (Latest)
**Steps**:
1. Open Safari
2. Run complete workflow test (Section 1)
3. Run page refresh tests (Section 2)
4. Check Web Inspector console for errors

**Expected Results**:
- ✅ All functionality works
- ✅ No console errors
- ✅ State persists correctly

**Status**: ⬜ Pass / ⬜ Fail
**Safari Version**: _____________

#### 10.4 Edge (Latest)
**Steps**:
1. Open Edge
2. Run complete workflow test (Section 1)
3. Run page refresh tests (Section 2)
4. Check DevTools console for errors

**Expected Results**:
- ✅ All functionality works
- ✅ No console errors
- ✅ State persists correctly

**Status**: ⬜ Pass / ⬜ Fail
**Edge Version**: _____________

---

## DevTools Inspection Guide

### Checking SessionStorage
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Application tab (Chrome/Edge) or Storage tab (Firefox)
3. Expand Session Storage
4. Click on http://localhost:3000
5. Look for `schedule-events` key
6. Inspect the JSON value

### Checking LocalStorage
1. Same as above, but expand Local Storage
2. Look for `schedule-config` key
3. Verify Date strings are in ISO format
4. Verify module colors are stored

### Checking Console Logs
1. Open DevTools Console tab
2. Look for workflow guard messages
3. Look for storage error messages
4. Look for rehydration messages

---

## Common Issues and Solutions

### Issue: State not persisting on refresh
**Possible Causes**:
- Browser storage disabled
- Private/incognito mode
- Storage quota exceeded
- Serialization error

**Debug Steps**:
1. Check DevTools → Application → Storage
2. Check Console for errors
3. Verify storage is enabled in browser settings

### Issue: Dates not deserializing correctly
**Possible Causes**:
- Date reviver function not working
- Invalid ISO string in storage

**Debug Steps**:
1. Check localStorage value for dates
2. Verify ISO string format
3. Check console for deserialization errors

### Issue: Set objects not restoring
**Possible Causes**:
- Set serialization not working
- Array not converting back to Set

**Debug Steps**:
1. Check sessionStorage value for selectedIds
2. Verify it's stored as array
3. Check reviver function in eventStore

---

## Test Summary

### Overall Results
- Total Tests: _____ / _____
- Passed: _____
- Failed: _____
- Blocked: _____

### Critical Issues Found
```
[List any critical issues that block functionality]
```

### Minor Issues Found
```
[List any minor issues or improvements needed]
```

### Browser-Specific Issues
```
[List any issues specific to certain browsers]
```

### Recommendations
```
[List any recommendations for improvements or fixes]
```

---

## Sign-Off

**Tester Name**: _____________________
**Date**: _____________________
**Environment**: Development / Staging / Production
**Overall Status**: ⬜ Pass / ⬜ Pass with Issues / ⬜ Fail

**Notes**:
```
[Any additional notes or observations]
```
