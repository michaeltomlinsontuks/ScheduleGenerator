# PDF Format Analysis

## Actual PDF Structures

### 1. Lectures PDF (`UP_MOD_XLS.pdf`)

**Header Text:** `Lectures`

**Table Columns:**
- Module
- Offered
- Group
- Lang
- Activity
- Day
- Time
- Venue
- Campus
- Study Prog

**Example Row:**
```
Module: COS 214
Offered: S2
Group: G01
Lang: E L
Activity: L1\nL2\nL3\nL4
Day: Monday\nTuesday\nThursday\nFriday
Time: 08:30 - 09:20\n07:30 - 08:20\n09:30 - 10:20\n12:30 - 13:20
Venue: Centenary 6\nIT 4-4\nIT 4-4\nIT 4-4
Campus: HATFIELD
```

**Key Characteristics:**
- Multi-day entries are newline-separated within single cells
- Each day has corresponding time and venue
- Current parser correctly handles this by splitting on newlines

---

### 2. Tests PDF (`UP_TST_PDF.pdf`)

**Header Text:** `Semester Tests`

**Table Columns:**
- Module
- Test
- Day
- Date
- Time
- Campus
- Venue

**Example Row:**
```
Module: COS 284
Test: Test1
Day: Saturday
Date: 23 Aug 2025
Time: 10:00 - 11:30
Campus: HATFIELD
Venue: Informatorium Blue Lab 1\nInformatorium Blue Lab 2\nInformatorium Blue Lab 3\nInformatorium Red Lab\nInformatorium Green Lab
```

**Key Characteristics:**
- Multiple venues are newline-separated
- Each venue should become a separate event
- Current parser correctly handles this

---

### 3. Exams PDF (`UP_EXAM_SS.pdf`)

**Header Text:** `Exams` ⚠️ (NOT "Examinations")

**Table Columns:**
- Status
- Module
- Paper
- Activity
- Date
- Start Time (note: NOT "Time", and no end time)
- Module Campus
- Exam Campus
- Venue
- Exam Comments

**Example Row:**
```
Status: FINAL
Module: COS 284
Paper: 1
Activity: Exam\nWritten
Date: 12 NOV 2025
Start Time: 07:30
Module Campus: HATF
Exam Campus: HATFIELD
Venue: IT Building CBT Labs\n1,2,3
Exam Comments: (empty)
```

**Key Characteristics:**
- Different structure from tests (has Status, Paper, Activity columns)
- Activity field contains "Exam\nWritten" (newline-separated)
- Venue format: "Building Name\nRoom details" (should be combined, not split)
- Only has start time, no end time (need to estimate duration)
- No "Day" column (only Date)

---

## Key Differences from Initial Assumptions

### ❌ Incorrect Assumptions:
1. Exam header is "Examinations" → **Actually "Exams"**
2. Exam structure similar to tests → **Actually quite different**
3. Exam venues should be split → **Actually should be combined**
4. Exam has "Exam" column → **Actually has "Activity" column with "Exam\nWritten"**

### ✅ Correct Assumptions:
1. Lectures header is "Lectures" ✓
2. Tests header is "Semester Tests" ✓
3. Lectures have recurring events ✓
4. Tests/Exams have specific dates ✓

---

## Implementation Impact

### Changes Required:

1. **Keyword Detection:**
   - Use "Exams" not "Examinations"
   - Check "Semester Tests" before "Exams" to avoid false positives

2. **Exam Parser:**
   - Extract from columns: Status, Module, Paper, Activity, Date, Start Time, Venue
   - Combine venue parts (don't split)
   - Clean Activity field (remove newlines)
   - Handle missing end time (estimate 3-hour duration)

3. **Event Summary:**
   - Lectures: `{Module} {Activity}`
   - Tests: `{Module} {Test}`
   - Exams: `{Module} {Activity}` (where Activity = "Exam Written")

4. **Venue Handling:**
   - Lectures: Split by newline (one per day)
   - Tests: Split by newline (one per venue)
   - Exams: Combine newlines (single venue string)

---

## Test Fixtures Needed

Based on actual PDFs:

1. **Lecture Fixture:**
   - Multi-day entry (4 days)
   - Corresponding times and venues
   - Forward-fill for Module, Offered, Group

2. **Test Fixture:**
   - Multi-venue entry (5+ venues)
   - Specific date format: "23 Aug 2025"
   - Time range: "10:00 - 11:30"

3. **Exam Fixture:**
   - Status: "FINAL"
   - Activity: "Exam\nWritten"
   - Venue: "IT Building CBT Labs\n1,2,3"
   - Start Time only: "07:30"
   - Date format: "12 NOV 2025"
