# Browser Compatibility Testing Guide

## Overview

This guide provides step-by-step instructions for conducting comprehensive browser compatibility testing for the session state persistence feature.

## Prerequisites

- Access to Chrome, Firefox, Safari, and Edge browsers (latest versions)
- UP Schedule Generator application running locally or deployed
- Sample PDF files for testing (available in `SourceFiles/`)
- Browser DevTools knowledge (basic)

## Testing Resources

### 1. Browser Test Script
**File**: `browser-test-script.html`  
**Purpose**: Standalone HTML page that tests storage APIs directly  
**Usage**: Open in each browser to verify storage functionality

### 2. Browser Compatibility Report
**File**: `BROWSER_COMPATIBILITY_TESTING.md`  
**Purpose**: Comprehensive testing checklist and results documentation  
**Usage**: Follow checklist and document findings

### 3. Application Demo Page
**File**: `frontend/src/app/demo/storage-test/page.tsx`  
**Purpose**: In-app storage testing interface  
**Usage**: Navigate to `/demo/storage-test` in running application

## Quick Start

### Option 1: Standalone Test Script (Fastest)

1. Open `browser-test-script.html` in each browser
2. Click "Run All Tests"
3. Review results
4. Document any failures

### Option 2: Full Application Testing (Comprehensive)

1. Start the application
2. Follow the workflow testing steps below
3. Test in each browser
4. Document results in compatibility report

## Detailed Testing Procedures

### Test 1: Standard Storage Operations

**Objective**: Verify basic storage functionality works correctly

**Steps**:
1. Open application in browser
2. Open DevTools (F12) → Application/Storage tab
3. Upload a PDF file
4. Navigate to preview page
5. Check sessionStorage for `schedule-events` key
6. Verify data is present and valid JSON
7. Refresh the page (F5)
8. Verify events are still displayed
9. Check that data was restored from storage
10. Close the tab
11. Open new tab to application
12. Verify sessionStorage is empty (fresh start)

**Expected Results**:
- ✅ Data stored in sessionStorage after upload
- ✅ Data restored after page refresh
- ✅ Data cleared after tab close
- ✅ New tab starts with empty state

**DevTools Commands**:
```javascript
// Check sessionStorage
console.log(sessionStorage.getItem('schedule-events'));

// Check localStorage
console.log(localStorage.getItem('schedule-config'));

// Verify data structure
const events = JSON.parse(sessionStorage.getItem('schedule-events'));
console.log('Events:', events);
```

### Test 2: Storage Disabled

**Objective**: Verify graceful fallback when storage is disabled

**Chrome**:
1. Settings → Privacy and security → Cookies and other site data
2. Select "Block third-party cookies"
3. Or select "Block all cookies" for stricter test
4. Open application
5. Attempt to upload PDF
6. Verify warning message appears
7. Verify application continues to function
8. Check console for errors (should be none)

**Firefox**:
1. Preferences → Privacy & Security
2. Under Cookies and Site Data, select "Custom"
3. Check "Cookies" and select "All cookies"
4. Open application
5. Follow same verification steps as Chrome

**Safari**:
1. Preferences → Privacy
2. Check "Block all cookies"
3. Open application
4. Follow same verification steps as Chrome

**Edge**:
1. Settings → Cookies and site permissions
2. Select "Block all cookies"
3. Open application
4. Follow same verification steps as Chrome

**Expected Results**:
- ✅ Application detects storage unavailability
- ✅ Warning message displayed to user
- ✅ Application falls back to in-memory storage
- ✅ Core functionality remains operational
- ✅ No console errors or crashes

### Test 3: Private/Incognito Mode

**Objective**: Verify storage works in private browsing mode

**Steps for Each Browser**:

**Chrome Incognito** (Ctrl+Shift+N / Cmd+Shift+N):
1. Open new incognito window
2. Navigate to application
3. Complete full workflow (upload → preview → customize → generate)
4. Verify state persists during session
5. Open DevTools and check storage
6. Close incognito window
7. Open new incognito window
8. Navigate to application
9. Verify state is cleared (fresh start)

**Firefox Private Window** (Ctrl+Shift+P / Cmd+Shift+P):
1. Follow same steps as Chrome Incognito

**Safari Private Browsing** (Cmd+Shift+N):
1. Follow same steps as Chrome Incognito
2. Note: Safari may have stricter storage limits in private mode

**Edge InPrivate** (Ctrl+Shift+N / Cmd+Shift+N):
1. Follow same steps as Chrome Incognito

**Expected Results**:
- ✅ sessionStorage available in private mode
- ✅ localStorage available in private mode
- ✅ State persists during private session
- ✅ All data cleared when private window closes
- ✅ No data leakage to normal browsing mode

### Test 4: Storage Quota Limits

**Objective**: Verify application handles quota exceeded errors

**Method 1: Using Test Script**:
1. Open `browser-test-script.html`
2. Click "Fill Storage (Quota Test)"
3. Observe quota exceeded error handling
4. Verify automatic cleanup

**Method 2: Using DevTools**:
1. Open application
2. Open DevTools Console
3. Run quota test script:

```javascript
// Fill sessionStorage to trigger quota error
async function testQuota() {
    try {
        const chunk = 'x'.repeat(1024 * 1024); // 1MB chunks
        let i = 0;
        while (true) {
            sessionStorage.setItem(`test-${i}`, chunk);
            console.log(`Stored ${i + 1} MB`);
            i++;
        }
    } catch (e) {
        console.log('Quota exceeded:', e);
        console.log('Cleaning up...');
        
        // Cleanup
        for (let j = 0; j < sessionStorage.length; j++) {
            const key = sessionStorage.key(j);
            if (key && key.startsWith('test-')) {
                sessionStorage.removeItem(key);
            }
        }
        console.log('Cleanup complete');
    }
}

testQuota();
```

4. Verify error is caught
5. Verify cleanup occurs
6. Verify application continues to function

**Expected Results**:
- ✅ QuotaExceededError is caught
- ✅ Application clears old data automatically
- ✅ Operation retries successfully
- ✅ User sees quota warning message
- ✅ No data corruption

**Browser-Specific Limits**:
- Chrome: ~10MB per origin
- Firefox: ~10MB per origin
- Safari: ~5MB per origin (2.5MB in private mode)
- Edge: ~10MB per origin

### Test 5: Complex Data Serialization

**Objective**: Verify Sets, Dates, and nested objects serialize correctly

**Steps**:
1. Open application
2. Upload PDF and select some events
3. Open DevTools Console
4. Run serialization tests:

```javascript
// Test Set serialization
const testSet = new Set(['id1', 'id2', 'id3']);
const serialized = JSON.stringify(Array.from(testSet));
const deserialized = new Set(JSON.parse(serialized));
console.log('Set round-trip:', 
    testSet.size === deserialized.size && 
    [...testSet].every(id => deserialized.has(id))
);

// Test Date serialization
const testDate = new Date('2025-01-15T10:00:00Z');
const dateStr = testDate.toISOString();
const dateRestored = new Date(dateStr);
console.log('Date round-trip:', 
    testDate.getTime() === dateRestored.getTime()
);

// Test nested objects
const testObj = {
    events: [
        { id: '1', nested: { prop: 'value' } }
    ],
    config: { colors: { COS214: '#ff0000' } }
};
const objStr = JSON.stringify(testObj);
const objRestored = JSON.parse(objStr);
console.log('Object round-trip:', 
    JSON.stringify(testObj) === JSON.stringify(objRestored)
);
```

5. Verify all tests pass
6. Check actual stored data:

```javascript
// Check real stored data
const events = JSON.parse(sessionStorage.getItem('schedule-events'));
console.log('Stored events:', events);
console.log('Selected IDs type:', typeof events.state.selectedIds);
console.log('Selected IDs:', events.state.selectedIds);
```

**Expected Results**:
- ✅ Sets serialize to Arrays
- ✅ Arrays deserialize to Sets
- ✅ Dates serialize to ISO strings
- ✅ ISO strings deserialize to Dates
- ✅ Nested objects maintain structure
- ✅ No data loss during round-trip

### Test 6: Complete Workflow Integration

**Objective**: Verify state persistence throughout entire workflow

**Steps**:
1. **Upload Page**:
   - Upload PDF file
   - Verify job state stored
   - Refresh page during processing
   - Verify job resumes

2. **Preview Page**:
   - Verify events displayed
   - Refresh page
   - Verify events restored
   - Navigate back to upload
   - Navigate forward to preview
   - Verify state maintained

3. **Customize Page**:
   - Select/deselect events
   - Set module colors
   - Set semester dates
   - Refresh page
   - Verify selections restored
   - Verify colors restored
   - Verify dates restored as Date objects

4. **Generate Page**:
   - Generate ICS file
   - Verify workflow state cleared
   - Verify config persists
   - Click "Upload Another PDF"
   - Verify all state cleared
   - Verify theme persists

**Expected Results**:
- ✅ State persists at each step
- ✅ Refresh doesn't lose data
- ✅ Back/forward buttons work correctly
- ✅ Workflow state clears after generation
- ✅ Config persists across workflows
- ✅ Theme persists across everything

## Performance Testing

### Serialization Performance

**Test Script**:
```javascript
// Test serialization performance
function benchmarkSerialization() {
    const events = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: '2025-01-15',
        time: '10:00',
        venue: 'Room 101',
        module: 'COS 214'
    }));

    // Serialize
    const serializeStart = performance.now();
    const serialized = JSON.stringify(events);
    const serializeTime = performance.now() - serializeStart;

    // Deserialize
    const deserializeStart = performance.now();
    const deserialized = JSON.parse(serialized);
    const deserializeTime = performance.now() - deserializeStart;

    console.log('Serialization Results:');
    console.log(`- Serialize 100 events: ${serializeTime.toFixed(2)}ms`);
    console.log(`- Deserialize 100 events: ${deserializeTime.toFixed(2)}ms`);
    console.log(`- Data size: ${(serialized.length / 1024).toFixed(2)} KB`);
}

benchmarkSerialization();
```

**Expected Performance**:
- Serialize: < 10ms
- Deserialize: < 15ms
- Total overhead: < 25ms (negligible)

## Documenting Results

### Update Compatibility Report

After testing each browser, update `BROWSER_COMPATIBILITY_TESTING.md`:

1. Check off completed test items
2. Document any issues found
3. Add browser-specific notes
4. Update performance benchmarks
5. Add screenshots if needed

### Issue Template

When documenting issues, use this format:

```markdown
### Issue: [Brief Description]

**Browser**: [Browser Name and Version]
**Severity**: Critical / High / Medium / Low
**Reproducibility**: Always / Sometimes / Rare

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Workaround**:
[If available]

**Screenshots/Logs**:
[If applicable]
```

## Common Issues and Solutions

### Issue: Storage Not Available

**Symptoms**: Warning message, in-memory fallback active

**Possible Causes**:
- Cookies disabled in browser settings
- Private browsing with strict settings
- Browser extension blocking storage
- Corporate policy restrictions

**Solution**:
- Enable cookies in browser settings
- Disable blocking extensions
- Use normal browsing mode
- Contact IT if corporate policy issue

### Issue: Quota Exceeded

**Symptoms**: QuotaExceededError in console

**Possible Causes**:
- Too much data stored
- Other sites using storage
- Browser limit reached

**Solution**:
- Clear browser storage
- Close other tabs
- Use browser cleanup tools
- Application should auto-cleanup

### Issue: Data Not Persisting

**Symptoms**: State lost on refresh

**Possible Causes**:
- Storage disabled
- Serialization error
- Browser bug
- Incorrect storage key

**Solution**:
- Check DevTools storage tab
- Verify storage enabled
- Check console for errors
- Clear storage and retry

## Automated Testing

### Running Unit Tests

```bash
cd frontend
npm run test -- storage.test.ts
npm run test -- eventStore.persistence.test.ts
npm run test -- configStore.persistence.test.ts
```

### Running E2E Tests

```bash
cd e2e
npm run test
```

## Reporting

### Test Summary Template

```markdown
## Browser: [Name]
**Version**: [Version Number]
**Platform**: [OS]
**Date**: [Test Date]

### Test Results
- Standard Operations: ✅ Pass / ❌ Fail
- Storage Disabled: ✅ Pass / ❌ Fail
- Private Mode: ✅ Pass / ❌ Fail
- Quota Limits: ✅ Pass / ❌ Fail
- Serialization: ✅ Pass / ❌ Fail
- Workflow: ✅ Pass / ❌ Fail

### Issues Found
[List any issues]

### Notes
[Any additional observations]
```

## Next Steps

After completing browser testing:

1. ✅ Update compatibility report with results
2. ✅ Create bug reports for critical issues
3. ✅ Update user documentation with browser requirements
4. ✅ Add browser compatibility badge to README
5. ✅ Schedule regular compatibility testing

## Resources

- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Can I Use - Web Storage](https://caniuse.com/namevalue-storage)
- [Browser DevTools Documentation](https://developer.chrome.com/docs/devtools/)

---

**Last Updated**: November 30, 2025  
**Maintained By**: Development Team
