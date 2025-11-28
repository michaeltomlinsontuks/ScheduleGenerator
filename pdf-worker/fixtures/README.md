# Test Fixtures for Multi-Mode PDF Support

This directory contains test fixtures for the multi-mode PDF support feature.

## Contents

### Python Data Files

- **`sample_tables.py`**: Contains sample table data structures for all three PDF modes
  - `LECTURE_TABLE`: Multi-day lecture schedule data
  - `TEST_TABLE`: Multi-venue test schedule data
  - `EXAM_TABLE`: Exam schedule data with combined venue information
  - `EXAM_TABLE_UNFINALISED`: Exam data with "Unfinalised" and "TBA" entries
  - `LECTURE_TABLE_SINGLE_DAY`: Edge case with single day
  - `TEST_TABLE_SINGLE_VENUE`: Edge case with single venue
  - `INVALID_TABLE`: Invalid table structure for error testing

### PDF Files

- **`lecture-schedule.pdf`**: Valid lecture schedule PDF
  - Header text: "Lectures"
  - Contains multi-day entries with newline-separated values
  - Tests lecture mode detection and parsing

- **`test-schedule.pdf`**: Valid test schedule PDF
  - Header text: "Semester Tests"
  - Contains multi-venue entries
  - Tests test mode detection and venue splitting

- **`exam-schedule.pdf`**: Valid exam schedule PDF
  - Header text: "Exams"
  - Contains exam data with combined venue information
  - Includes unfinalised exam entry
  - Tests exam mode detection and venue combination

- **`invalid-format.pdf`**: Invalid PDF without mode keywords
  - Header text: "Random Schedule Document"
  - Tests error handling for unrecognized formats

## Generating PDF Fixtures

The PDF files can be regenerated using the `generate_fixtures.py` script:

### Prerequisites

Install reportlab (not included in main requirements.txt):

```bash
pip install reportlab
```

### Generate PDFs

From the project root directory:

```bash
python pdf-worker/fixtures/generate_fixtures.py
```

This will create all four PDF files in the `pdf-worker/fixtures/` directory.

## Usage in Tests

### Backend Tests (TypeScript)

```typescript
import * as fs from 'fs';
import * as path from 'path';

const lecturePdf = fs.readFileSync(
  path.join(__dirname, '../../pdf-worker/fixtures/lecture-schedule.pdf')
);

const pdfType = await validatePdfContent(lecturePdf);
expect(pdfType).toBe(PdfType.LECTURE);
```

### Python Tests

```python
from fixtures.sample_tables import LECTURE_TABLE, TEST_TABLE, EXAM_TABLE

def test_lecture_parser():
    events = _parse_weekly_schedule([LECTURE_TABLE])
    assert len(events) > 0
```

Or with actual PDF files:

```python
import os

fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
lecture_pdf = os.path.join(fixtures_dir, 'lecture-schedule.pdf')

result = parse_pdf(lecture_pdf)
assert result['type'] == 'lecture'
```

## Fixture Characteristics

### Lecture Schedule
- **Modules**: COS 214, COS 284, COS 301
- **Multi-day entries**: COS 214 has 4 days, COS 284 has 2 days
- **Time format**: "HH:MM - HH:MM"
- **Venues**: Newline-separated, one per day

### Test Schedule
- **Modules**: COS 284, COS 214, COS 301
- **Multi-venue entries**: COS 284 has 5 venues, COS 214 has 2 venues
- **Date format**: "DD MMM YYYY" (e.g., "23 Aug 2025")
- **Time format**: "HH:MM - HH:MM"

### Exam Schedule
- **Modules**: COS 284, COS 214, COS 301
- **Status**: All "FINAL"
- **Activity**: "Exam\nWritten" (newline-separated)
- **Date format**: "DD MMM YYYY" (e.g., "12 NOV 2025")
- **Time format**: "HH:MM" (start time only)
- **Venue**: Building + room details combined (e.g., "IT Building CBT Labs\n1,2,3")
- **Unfinalised**: COS 301 has "Unfinalised" venue

### Invalid Format
- **Header**: "Random Schedule Document" (no valid mode keyword)
- **Columns**: Non-standard column names
- **Purpose**: Tests error handling for unrecognized PDFs

## Notes

- All PDFs are generated with realistic table structures based on actual UP schedule PDFs
- The fixtures match the structures documented in `PDF_ANALYSIS.md`
- Keyword detection is case-sensitive and position-dependent (top-left area)
- Multi-line cell values use `\n` as separator in the data structures
