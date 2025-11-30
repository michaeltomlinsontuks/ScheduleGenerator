# Quick Test Checklist - Session State Persistence

## 5-Minute Smoke Test

Use this for quick verification that core functionality works.

### Prerequisites
- [ ] Services running: `docker compose up -d`
- [ ] Browser: Chrome or Firefox
- [ ] Test file: `SourceFiles/UP_MOD_XLS.pdf`

### Core Tests (5 minutes)

#### 1. Basic Workflow (2 min)
- [ ] Upload PDF → Preview → Customize → Generate
- [ ] All steps work without errors

#### 2. Refresh Test (1 min)
- [ ] At customize page, refresh browser
- [ ] Events and selections restored
- [ ] No errors in console

#### 3. Back Button Test (1 min)
- [ ] At generate page, click back button
- [ ] Returns to customize with state intact
- [ ] Click forward, returns to generate

#### 4. State Clearing Test (1 min)
- [ ] Download ICS file
- [ ] Navigate to /upload
- [ ] Page shows empty state (workflow cleared)

### Result
- ⬜ All passed - Core functionality works
- ⬜ Issues found - See detailed guide

---

## 15-Minute Full Test

Use this for comprehensive verification before deployment.

### 1. Complete Workflow (3 min)
- [ ] Upload → Preview → Customize → Generate
- [ ] Select/deselect events
- [ ] Change module colors
- [ ] Set semester dates
- [ ] Verify all data persists

### 2. Refresh at Each Step (4 min)
- [ ] Refresh on preview - events restored
- [ ] Refresh on customize - selections + colors restored
- [ ] Refresh on generate - all state restored
- [ ] Check DevTools for errors

### 3. Navigation Tests (3 min)
- [ ] Back/forward buttons maintain state
- [ ] Direct URL access to /preview redirects to /upload
- [ ] Direct URL access to /customize redirects appropriately

### 4. State Clearing (2 min)
- [ ] Download ICS clears workflow state
- [ ] "Upload Another PDF" clears all state
- [ ] Config persists after browser restart

### 5. New Tab Test (2 min)
- [ ] Open new tab
- [ ] Navigate to app
- [ ] Verify fresh state (isolated from other tab)

### 6. Incognito Test (1 min)
- [ ] Open incognito window
- [ ] Complete workflow
- [ ] Refresh works
- [ ] Close incognito, state cleared

### Result
- ⬜ All passed - Ready for deployment
- ⬜ Issues found - Review detailed guide

---

## Critical Issues Checklist

If any of these fail, **do not deploy**:

- [ ] ❌ State lost on refresh (data loss)
- [ ] ❌ Application crashes on refresh
- [ ] ❌ Infinite redirect loops
- [ ] ❌ Cannot complete workflow
- [ ] ❌ Storage errors crash app

## Minor Issues Checklist

These can be addressed post-deployment:

- [ ] ⚠️ Console warnings (non-blocking)
- [ ] ⚠️ Slow performance on large datasets
- [ ] ⚠️ UI glitches (cosmetic)
- [ ] ⚠️ Browser-specific quirks

---

## DevTools Quick Check

### SessionStorage (Workflow State)
1. Open DevTools → Application → Session Storage
2. Look for `schedule-events` key
3. Should contain: events, selectedIds, jobId, pdfType

### LocalStorage (Config)
1. Open DevTools → Application → Local Storage
2. Look for `schedule-config` key
3. Should contain: semesterStart, semesterEnd, moduleColors, theme

### Console
1. Open DevTools → Console
2. Look for workflow guard messages (normal)
3. Look for error messages (investigate)

---

## Quick Commands

### Start Services
```bash
docker compose up -d
```

### Check Services
```bash
docker compose ps
```

### View Logs
```bash
docker compose logs -f frontend
```

### Stop Services
```bash
docker compose down
```

---

## Report Template

**Date**: _______________
**Tester**: _______________
**Browser**: _______________

**Smoke Test**: ⬜ Pass / ⬜ Fail
**Full Test**: ⬜ Pass / ⬜ Fail

**Issues Found**:
```
[List any issues]
```

**Ready for Deployment**: ⬜ Yes / ⬜ No
