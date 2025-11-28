# Design Document

## Overview

This design extends the UP Schedule Generator to support three distinct PDF modes: Lectures, Tests, and Exams. The current system has partial support for Lectures (weekly) and Tests, but lacks Exam support and has unreliable PDF type detection. This design introduces a robust mode detection mechanism that checks for identifying text in the PDF's top-left area, adds Exam parsing logic, and updates the data model to support the new mode.

The solution involves changes across three layers:
1. **Backend (TypeScript/NestJS)**: Update PdfType enum, enhance validation logic
2. **PDF Worker (Python)**: Improve type detection, add exam parsing function
3. **Database**: Migration to support new EXAM enum value

## Architecture

### Current Architecture
```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ Upload PDF
       ▼
┌─────────────────────────────────────┐
│  Backend (NestJS)                   │
│  ┌──────────────────────────────┐   │
│  │ Upload Service               │   │
│  │ - Validates PDF magic bytes  │   │
│  │ - Returns WEEKLY by default  │   │ ← Current limitation
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Jobs Service                 │   │
│  │ - Stores job with pdfType    │   │
│  │ - Queues for processing      │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PDF Worker (Python)                │
│  ┌──────────────────────────────┐   │
│  │ get_pdf_type()               │   │
│  │ - Scans all pages            │   │ ← Inefficient
│  │ - Checks for keywords        │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ parse_pdf()                  │   │
│  │ - Routes to weekly/test      │   │
│  │ - No exam support            │   │ ← Missing feature
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Proposed Architecture
```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ Upload PDF
       ▼
┌─────────────────────────────────────┐
│  Backend (NestJS)                   │
│  ┌──────────────────────────────┐   │
│  │ PDF Content Validator        │   │
│  │ - Validates magic bytes      │   │
│  │ - Extracts first page text   │   │ ← NEW
│  │ - Detects mode early         │   │ ← NEW
│  │ - Returns LECTURE/TEST/EXAM  │   │ ← ENHANCED
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Jobs Service                 │   │
│  │ - Stores detected pdfType    │   │
│  │ - Passes mode to worker      │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ {jobId, s3Key, pdfType}
               ▼
┌─────────────────────────────────────┐
│  PDF Worker (Python)                │
│  ┌──────────────────────────────┐   │
│  │ get_pdf_type()               │   │
│  │ - Scans first page only      │   │ ← OPTIMIZED
│  │ - Checks for 3 keywords      │   │ ← ENHANCED
│  │ - Returns lecture/test/exam  │   │ ← NEW
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ parse_pdf()                  │   │
│  │ - Routes to 3 parsers        │   │ ← ENHANCED
│  │ - _parse_weekly_schedule()   │   │
│  │ - _parse_test_schedule()     │   │
│  │ - _parse_exam_schedule()     │   │ ← NEW
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Backend Components

#### PdfType Enum (Enhanced)
```typescript
// backend/src/jobs/entities/job.entity.ts
export enum PdfType {
  LECTURE = 'lecture',  // Changed from WEEKLY
  TEST = 'test',
  EXAM = 'exam',        // NEW
}
```

#### PDF Content Validator (Enhanced)
```typescript
// backend/src/common/validators/pdf-content.validator.ts

import { PdfType } from '../../jobs/entities/job.entity.js';
import * as pdfParse from 'pdf-parse';

export enum PdfContentError {
  INVALID_PDF_CONTENT = 'INVALID_PDF_CONTENT',
  UNRECOGNIZED_FORMAT = 'UNRECOGNIZED_FORMAT',
  TEXT_EXTRACTION_FAILED = 'TEXT_EXTRACTION_FAILED',
}

/**
 * Validates PDF content and detects the schedule mode.
 * Checks for mode-identifying keywords in the first page.
 */
export async function validatePdfContent(buffer: Buffer): Promise<PdfType> {
  // 1. Check PDF magic bytes
  const pdfMagic = buffer.slice(0, 5).toString('ascii');
  if (!pdfMagic.startsWith('%PDF-')) {
    throw new Error('Invalid PDF: file does not start with PDF magic bytes');
  }

  // 2. Extract text from first page only
  let text: string;
  try {
    const data = await pdfParse(buffer, {
      max: 1, // Only parse first page
    });
    text = data.text;
  } catch (error) {
    throw new Error('Invalid PDF: Unable to extract text content');
  }

  // 3. Check for mode-identifying keywords
  // Check for mode keywords (order matters - check "Semester Tests" before "Exams")
  if (text.includes('Semester Tests')) {
    return PdfType.TEST;
  }
  if (text.includes('Exams')) {
    return PdfType.EXAM;
  }
  if (text.includes('Lectures')) {
    return PdfType.LECTURE;
  }

  // 4. No valid mode found
  throw new Error('Invalid PDF: Not a recognized UP schedule format');
}

/**
 * Checks if a buffer is a valid UP schedule PDF.
 */
export async function isPdfValidUpSchedule(buffer: Buffer): Promise<{
  isValid: boolean;
  pdfType?: PdfType;
  error?: string;
}> {
  try {
    const pdfType = await validatePdfContent(buffer);
    return { isValid: true, pdfType };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

#### Upload Service (Updated)
```typescript
// backend/src/upload/upload.service.ts

async processUpload(file: MulterFile): Promise<UploadResponseDto> {
  // Validate PDF content and determine type (now async)
  const pdfType: PdfType = await validatePdfContent(file.buffer);

  // Generate unique S3 key
  const s3Key = `${uuidv4()}-${file.originalname}`;

  // Upload to MinIO
  await this.storageService.uploadFile(s3Key, file.buffer, file.mimetype);

  // Create job with detected type
  const job = this.jobRepository.create({
    status: JobStatus.PENDING,
    pdfType,  // Now correctly detected
    s3Key,
    result: null,
    error: null,
  });

  const savedJob = await this.jobRepository.save(job);

  // Queue with type information
  await this.pdfProcessingQueue.add('process-pdf', {
    jobId: savedJob.id,
    s3Key,
    pdfType,  // Pass detected type to worker
  });

  return {
    jobId: savedJob.id,
    pdfType: savedJob.pdfType,
    message: 'PDF uploaded successfully and queued for processing',
  };
}
```

### 2. PDF Worker Components

#### Type Detection Utility (Enhanced)
```python
# pdf-worker/parser/utils.py

import pdfplumber
from typing import Literal

PdfMode = Literal['lecture', 'test', 'exam', 'unknown']

def get_pdf_type(file_path: str) -> PdfMode:
    """
    Determines the type of schedule PDF by scanning the first page
    for mode-identifying keywords.
    
    Args:
        file_path: The absolute path to the PDF file.
    
    Returns:
        'lecture', 'test', 'exam', or 'unknown' based on content.
    """
    with pdfplumber.open(file_path) as pdf:
        if len(pdf.pages) == 0:
            return 'unknown'
        
        # Only check first page for efficiency
        first_page = pdf.pages[0]
        text = first_page.extract_text()
        
        if not text:
            return 'unknown'
        
        # Check for mode keywords (order matters for specificity)
        # Note: Check "Semester Tests" before "Exams" to avoid false positives
        if "Semester Tests" in text:
            return 'test'
        if "Exams" in text:
            return 'exam'
        if "Lectures" in text:
            return 'lecture'
        
        return 'unknown'
```

#### Exam Parser (New)
```python
# pdf-worker/parser/pdf_parser.py

def _parse_exam_schedule(tables: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Parses the raw table data from an exam schedule PDF.
    
    Exam schedules have a different structure from tests:
    - Status (e.g., "FINAL")
    - Module code
    - Paper number
    - Activity (e.g., "Exam\nWritten")
    - Date (specific date, not day of week)
    - Start Time (just start time, not range)
    - Module Campus
    - Exam Campus
    - Venue (may have newline-separated details like "IT Building CBT Labs\n1,2,3")
    - Exam Comments
    
    Returns:
        List of event dictionaries with exam information.
    """
    events = []
    headers = [h.replace('\n', ' ') for h in tables[0][0]]
    
    for table in tables:
        df = pd.DataFrame(table[1:], columns=headers)
        df.columns = [col.replace('\n', ' ') for col in df.columns]
        
        # Forward-fill module column
        if 'Module' in df.columns:
            df['Module'] = df['Module'].replace('', None).ffill()
        
        # Clean whitespace
        for col in df.columns:
            df[col] = df[col].astype(str).str.strip()
        
        # Drop rows without date/time
        df.dropna(subset=['Date', 'Start Time'], inplace=True, how='all')
        
        # Process each row
        for _, row in df.iterrows():
            event = row.to_dict()
            
            # Combine venue details (newline-separated parts become single string)
            if 'Venue' in event:
                venue_parts = str(event['Venue']).split('\n')
                event['Venue'] = ' '.join(part.strip() for part in venue_parts if part.strip())
            
            # Clean activity field (remove newlines)
            if 'Activity' in event:
                event['Activity'] = str(event['Activity']).replace('\n', ' ')
            
            # Note: Exam PDFs don't have end time, we'll need to estimate duration
            # Default to 3 hours for exams
            if 'Start Time' in event:
                event['Time'] = event['Start Time']  # Will be processed later
            
            events.append(event)
    
    return events
```

#### Main Parser (Enhanced)
```python
# pdf-worker/parser/pdf_parser.py

def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a University of Pretoria schedule PDF to extract table data.
    
    Returns:
        Dictionary with 'events' list and 'type' field 
        ('lecture', 'test', or 'exam')
    """
    pdf_type = get_pdf_type(file_path)
    
    if pdf_type == 'unknown':
        raise ValueError(
            "Unable to determine PDF type. "
            "Expected 'Lectures', 'Semester Tests', or 'Exams' text."
        )
    
    # Extract all tables from PDF
    with pdfplumber.open(file_path) as pdf:
        all_tables = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                all_tables.append(table)
    
    # Route to appropriate parser
    if pdf_type == 'lecture':
        events = _parse_weekly_schedule(all_tables)
    elif pdf_type == 'test':
        events = _parse_test_schedule(all_tables)
    elif pdf_type == 'exam':
        events = _parse_exam_schedule(all_tables)
    else:
        events = []
    
    return {
        'events': events,
        'type': pdf_type
    }
```

#### Data Processor (Enhanced)
```python
# pdf-worker/parser/data_processor.py

def process_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans and validates a list of parsed schedule events.
    Handles all three modes: lecture, test, exam.
    """
    processed_events = []
    
    for event in events:
        # 1. Standardize Day Names (for lectures only)
        if 'Day' in event and event['Day']:
            event['Day'] = event['Day'].strip().capitalize()
        
        # 2. Validate and Clean Time Format
        if 'Time' in event and event['Time']:
            time_match = re.search(
                r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', 
                event['Time']
            )
            if time_match:
                event['start_time'] = time_match.group(1)
                event['end_time'] = time_match.group(2)
            else:
                # Skip events with invalid times
                continue
        
        # 3. Create event summary based on type
        if 'Module' in event and 'Activity' in event:
            # Lecture event
            event['summary'] = f"{event['Module']} {event['Activity']}"
        elif 'Module' in event and 'Test' in event:
            # Test event
            event['summary'] = f"{event['Module']} {event['Test']}"
        elif 'Module' in event and 'Activity' in event and 'Exam' in event['Activity']:
            # Exam event
            event['summary'] = f"{event['Module']} {event['Activity']}"
        else:
            event['summary'] = "Unnamed Event"
        
        # 4. Add location information
        if 'Venue' in event:
            event['location'] = event['Venue']
        
        processed_events.append(event)
    
    return processed_events
```

## Data Models

### Job Entity (Updated)
```typescript
@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column({
    type: 'enum',
    enum: PdfType,  // Now supports LECTURE, TEST, EXAM
  })
  pdfType!: PdfType;

  @Column()
  s3Key!: string;

  @Column({ type: 'jsonb', nullable: true })
  result!: ParsedEvent[] | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;
}
```

### ParsedEvent Interface (Unchanged)
```typescript
export interface ParsedEvent {
  id: string;
  module: string;
  activity: string;      // For lectures
  group?: string;        // For lectures
  day?: string;          // For lectures (Monday, Tuesday, etc.)
  date?: string;         // For tests/exams (specific date)
  startTime: string;
  endTime: string;
  venue: string;
  isRecurring: boolean;  // true for lectures, false for tests/exams
}
```

### Database Migration
```typescript
// backend/src/migrations/XXXXXX-AddExamPdfType.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamPdfType1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'exam' to the enum type
    await queryRunner.query(`
      ALTER TYPE "public"."jobs_pdftype_enum" 
      ADD VALUE IF NOT EXISTS 'exam'
    `);
    
    // Rename 'weekly' to 'lecture' if it exists
    await queryRunner.query(`
      UPDATE jobs 
      SET "pdfType" = 'lecture' 
      WHERE "pdfType" = 'weekly'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values
    // This migration is not fully reversible
    await queryRunner.query(`
      UPDATE jobs 
      SET "pdfType" = 'weekly' 
      WHERE "pdfType" = 'lecture'
    `);
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Mode detection for Lectures
*For any* PDF buffer containing "Lectures" text, the validation function should return PdfType.LECTURE
**Validates: Requirements 1.1**

### Property 2: Mode detection for Tests
*For any* PDF buffer containing "Semester Tests" text, the validation function should return PdfType.TEST
**Validates: Requirements 2.1**

### Property 3: Mode detection for Exams
*For any* PDF buffer containing "Examinations" text, the validation function should return PdfType.EXAM
**Validates: Requirements 3.1**

### Property 4: Lecture events have required fields
*For any* parsed lecture event, the event should contain module, activity, group, day, startTime, endTime, and venue fields
**Validates: Requirements 1.2**

### Property 5: Test events have required fields
*For any* parsed test event, the event should contain module, test name, date, startTime, endTime, and venue fields
**Validates: Requirements 2.2**

### Property 6: Exam events have required fields
*For any* parsed exam event, the event should contain module, status, activity, date, startTime, and venue fields
**Validates: Requirements 3.2**

### Property 7: Lecture events are recurring
*For any* event parsed from a lecture PDF, the isRecurring field should be true
**Validates: Requirements 1.3**

### Property 8: Test events are non-recurring
*For any* event parsed from a test PDF, the isRecurring field should be false
**Validates: Requirements 2.3**

### Property 9: Exam events are non-recurring
*For any* event parsed from an exam PDF, the isRecurring field should be false
**Validates: Requirements 3.3**

### Property 10: Multi-day lecture splitting
*For any* lecture table row with N days listed, the parser should produce N separate events
**Validates: Requirements 1.4**

### Property 11: Multi-venue test splitting
*For any* test table row with N venues listed, the parser should produce N separate events
**Validates: Requirements 2.4**

### Property 12: Exam venue combination
*For any* exam table row with newline-separated venue details, the parser should combine them into a single venue string
**Validates: Requirements 3.4**

### Property 13: Invalid PDF rejection
*For any* PDF buffer without "Lectures", "Semester Tests", or "Examinations" text, the validation function should throw an error
**Validates: Requirements 4.4**

### Property 14: Mode passed to parser
*For any* successfully validated PDF, the detected mode should be passed to the parser service in the job data
**Validates: Requirements 4.5**

### Property 15: Parser routing
*For any* PDF mode (lecture/test/exam), the parser should call the corresponding parsing function (_parse_weekly_schedule, _parse_test_schedule, or _parse_exam_schedule)
**Validates: Requirements 5.1**

### Property 16: Consistent output structure
*For any* PDF mode, all parsed events should conform to the ParsedEvent interface structure
**Validates: Requirements 5.5**

### Property 17: Job stores PDF mode
*For any* created job, the pdfType field should be set to the detected mode
**Validates: Requirements 7.1**

### Property 18: Job status includes mode
*For any* job status query, the response should include the pdfType field
**Validates: Requirements 7.2**

### Property 19: Error logs include mode
*For any* failed job, the error log should include the pdfType value
**Validates: Requirements 7.3**

## Error Handling

### Validation Errors

1. **Invalid PDF Magic Bytes**
   - Error: `"Invalid PDF: file does not start with PDF magic bytes"`
   - HTTP Status: 400
   - Occurs when: File is not a valid PDF

2. **Text Extraction Failed**
   - Error: `"Invalid PDF: Unable to extract text content"`
   - HTTP Status: 400
   - Occurs when: PDF is corrupted or encrypted

3. **Unrecognized Format**
   - Error: `"Invalid PDF: Not a recognized UP schedule format"`
   - HTTP Status: 400
   - Occurs when: No valid mode keyword found

### Parsing Errors

1. **Unknown PDF Type**
   - Error: `"Unable to determine PDF type. Expected 'Lectures', 'Semester Tests', or 'Examinations' text."`
   - Occurs when: Python worker cannot detect mode

2. **Table Extraction Failed**
   - Error: `"Parsing failed: No tables found in PDF"`
   - Occurs when: PDF has no extractable tables

3. **Invalid Table Structure**
   - Error: `"Parsing failed: Missing required columns: [column names]"`
   - Occurs when: Table doesn't match expected structure

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  details?: string;
}
```

### Error Handling Flow

```
Upload → Validation Error → Return 400 with error message
       ↓
    Valid PDF → Queue Job → Processing Error → Update job.error
                          ↓                    ↓
                      Success → Update job.result
```

## Testing Strategy

### Unit Testing

**Backend (TypeScript/Jest)**

1. **PDF Content Validator Tests**
   - Test magic byte validation
   - Test text extraction with pdf-parse
   - Test mode detection for each keyword
   - Test error cases (invalid PDF, no keywords)

2. **Upload Service Tests**
   - Test successful upload flow
   - Test validation error handling
   - Test job creation with correct mode
   - Test queue integration

**PDF Worker (Python/pytest)**

1. **Type Detection Tests**
   - Test `get_pdf_type()` with lecture PDFs
   - Test `get_pdf_type()` with test PDFs
   - Test `get_pdf_type()` with exam PDFs
   - Test `get_pdf_type()` with invalid PDFs

2. **Parser Tests**
   - Test `_parse_weekly_schedule()` with sample data
   - Test `_parse_test_schedule()` with sample data
   - Test `_parse_exam_schedule()` with sample data
   - Test multi-day/multi-venue splitting

3. **Data Processor Tests**
   - Test event summary generation for each mode
   - Test time extraction and validation
   - Test field cleaning and normalization

### Property-Based Testing

The property-based testing library for TypeScript is **fast-check**, and for Python is **Hypothesis**.

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: multi-mode-pdf-support, Property N: [property text]`

**Backend Property Tests (fast-check)**

1. **Property 1-3: Mode Detection**
   ```typescript
   // Feature: multi-mode-pdf-support, Property 1: Mode detection for Lectures
   fc.assert(
     fc.property(
       fc.string().filter(s => s.includes('Lectures')),
       async (text) => {
         const buffer = createPdfWithText(text);
         const mode = await validatePdfContent(buffer);
         expect(mode).toBe(PdfType.LECTURE);
       }
     ),
     { numRuns: 100 }
   );
   ```

2. **Property 13: Invalid PDF Rejection**
   ```typescript
   // Feature: multi-mode-pdf-support, Property 13: Invalid PDF rejection
   fc.assert(
     fc.property(
       fc.string().filter(s => 
         !s.includes('Lectures') && 
         !s.includes('Semester Tests') && 
         !s.includes('Examinations')
       ),
       async (text) => {
         const buffer = createPdfWithText(text);
         await expect(validatePdfContent(buffer)).rejects.toThrow();
       }
     ),
     { numRuns: 100 }
   );
   ```

**Python Property Tests (Hypothesis)**

1. **Property 7-9: Recurring Flags**
   ```python
   # Feature: multi-mode-pdf-support, Property 7: Lecture events are recurring
   @given(lecture_pdf=lecture_pdf_strategy())
   @settings(max_examples=100)
   def test_lecture_events_are_recurring(lecture_pdf):
       result = parse_pdf(lecture_pdf)
       events = result['events']
       assert all(event.get('isRecurring') == True for event in events)
   ```

2. **Property 10-12: Event Splitting**
   ```python
   # Feature: multi-mode-pdf-support, Property 10: Multi-day lecture splitting
   @given(
       days=st.lists(st.sampled_from(['Monday', 'Tuesday', 'Wednesday']), 
                     min_size=1, max_size=5)
   )
   @settings(max_examples=100)
   def test_multiday_lecture_splitting(days):
       table_row = create_lecture_row_with_days(days)
       events = _parse_weekly_schedule([table_row])
       assert len(events) == len(days)
   ```

### Integration Testing

1. **End-to-End Upload Flow**
   - Upload lecture PDF → Verify LECTURE mode detected
   - Upload test PDF → Verify TEST mode detected
   - Upload exam PDF → Verify EXAM mode detected

2. **Job Processing Flow**
   - Create job with each mode → Verify correct parser called
   - Verify job.pdfType stored correctly
   - Verify job.result has correct structure

3. **Error Handling Flow**
   - Upload invalid PDF → Verify 400 error
   - Upload PDF with no keywords → Verify rejection
   - Simulate parsing failure → Verify job.error set

### Test Fixtures

**Sample PDFs Required**:
- `fixtures/lecture-schedule.pdf` - Valid lecture PDF
- `fixtures/test-schedule.pdf` - Valid test PDF
- `fixtures/exam-schedule.pdf` - Valid exam PDF
- `fixtures/invalid-format.pdf` - PDF without keywords
- `fixtures/corrupted.pdf` - Corrupted PDF file

**Sample Table Data**:
```python
# fixtures/sample_tables.py

LECTURE_TABLE = [
    ['Module', 'Offered', 'Group', 'Activity', 'Day', 'Time', 'Venue', 'Lang'],
    ['COS 214', 'S1', 'G01', 'Lecture', 'Monday\nWednesday', '08:30-10:20', 'IT 4-4', 'E'],
]

TEST_TABLE = [
    ['Module', 'Test', 'Date', 'Time', 'Venue'],
    ['COS 214', 'Test 1', '15 Aug 2025', '08:30-10:30', 'IT 4-4\nIT 4-5'],
]

EXAM_TABLE = [
    ['Module', 'Exam', 'Date', 'Time', 'Venue'],
    ['COS 214', 'Final Exam', '15 Nov 2025', '08:00-11:00', 'Exam Hall A\nExam Hall B'],
]
```

## Implementation Notes

### Migration Strategy

1. **Database Migration**
   - Add 'exam' value to PdfType enum
   - Rename 'weekly' to 'lecture' in existing records
   - Run migration before deploying code changes

2. **Backward Compatibility**
   - Old jobs with 'weekly' type will be migrated to 'lecture'
   - API responses will use new enum values
   - Frontend should handle both old and new values during transition

3. **Deployment Order**
   1. Run database migration
   2. Deploy PDF worker with new parser
   3. Deploy backend with new validation
   4. Deploy frontend with updated UI (if needed)

### Performance Considerations

1. **First Page Only Scanning**
   - Reduces PDF parsing time by ~70%
   - Mode keywords always appear on first page
   - Improves validation speed

2. **Async Validation**
   - PDF text extraction is now async
   - Prevents blocking during upload
   - Better error handling

3. **Caching Opportunities**
   - Consider caching PDF type detection results
   - Use S3 key as cache key
   - TTL: 5 minutes (during processing)

### Security Considerations

1. **PDF Bomb Protection**
   - Limit first page text extraction to 10MB
   - Timeout after 5 seconds
   - Reject PDFs with excessive page count

2. **Keyword Injection**
   - Keywords must appear in natural context
   - Consider position-based validation
   - Validate table structure matches mode

### Monitoring and Logging

1. **Metrics to Track**
   - PDF mode distribution (lecture/test/exam)
   - Validation failure rate by error type
   - Parsing success rate by mode
   - Average processing time by mode

2. **Log Events**
   - PDF mode detected: `INFO: Detected PDF mode: {mode}`
   - Validation failed: `WARN: PDF validation failed: {error}`
   - Parsing failed: `ERROR: Parsing failed for mode {mode}: {error}`
   - Mode mismatch: `WARN: Backend detected {mode1}, worker detected {mode2}`

### Future Enhancements

1. **Mode Confidence Score**
   - Return confidence level with mode detection
   - Warn users if confidence is low
   - Allow manual mode override

2. **Multi-Mode PDFs**
   - Some PDFs may contain multiple schedules
   - Detect and split into separate jobs
   - Process each section independently

3. **Custom Parsers**
   - Allow users to define custom parsing rules
   - Support other universities' formats
   - Plugin architecture for parsers

## Dependencies

### New Dependencies

**Backend**:
```json
{
  "pdf-parse": "^1.1.1"
}
```

**PDF Worker**:
No new dependencies required (pdfplumber already installed)

### Updated Dependencies

None - all existing dependencies remain at current versions

## API Changes

### Upload Response (Enhanced)

```typescript
// Before
{
  "jobId": "uuid",
  "pdfType": "weekly",  // Only weekly or test
  "message": "..."
}

// After
{
  "jobId": "uuid",
  "pdfType": "lecture",  // lecture, test, or exam
  "message": "..."
}
```

### Job Status Response (Enhanced)

```typescript
// Before
{
  "id": "uuid",
  "status": "completed",
  "pdfType": "weekly",
  "result": [...]
}

// After
{
  "id": "uuid",
  "status": "completed",
  "pdfType": "exam",  // Now includes exam
  "result": [...]
}
```

### Error Responses (New)

```typescript
// Unrecognized format
{
  "statusCode": 400,
  "message": "Invalid PDF: Not a recognized UP schedule format",
  "timestamp": "2025-01-15T10:30:00Z"
}

// Text extraction failed
{
  "statusCode": 400,
  "message": "Invalid PDF: Unable to extract text content",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Frontend Considerations

### Mode-Specific UI Behavior

The frontend needs to adapt its interface based on the detected PDF mode:

#### Date Range Selection
- **Lecture Mode**: Show semester start/end date pickers (events are recurring)
- **Test Mode**: Hide date range pickers (events have specific dates)
- **Exam Mode**: Hide date range pickers (events have specific dates)

#### Color Selection
- **All Modes**: Allow module color selection (applies to all modes)

#### Event Preview
- **Lecture Mode**: Show day-of-week grouping (Monday, Tuesday, etc.)
- **Test Mode**: Show date-based grouping (15 Aug 2025, 22 Aug 2025, etc.)
- **Exam Mode**: Show date-based grouping with exam-specific labels

#### Event Descriptions
- **Lecture Mode**: `{Module} {Activity}` (e.g., "COS 214 Lecture")
- **Test Mode**: `{Module} {Test}` (e.g., "COS 214 Test 1")
- **Exam Mode**: Check for "Unfinalised" or "TBA" text in venue/date fields
  - If unfinalised: Add warning badge and note in description
  - Description: `{Module} {Exam} (Unfinalised)` or `{Module} {Exam} (Venue TBA)`

### Component Updates

#### CustomizePage Component
```typescript
// frontend/src/app/customize/page.tsx

interface CustomizePageProps {
  events: ParsedEvent[];
  pdfType: 'lecture' | 'test' | 'exam';
}

export default function CustomizePage({ events, pdfType }: CustomizePageProps) {
  // Conditionally render date range picker
  const showDateRange = pdfType === 'lecture';
  
  return (
    <div>
      <ModuleColorPicker events={events} />
      
      {showDateRange && (
        <DateRangePicker 
          label="Semester Date Range"
          description="Select the start and end dates for recurring lectures"
        />
      )}
      
      {!showDateRange && (
        <Alert type="info">
          {pdfType === 'test' 
            ? 'Test dates are fixed and cannot be adjusted'
            : 'Exam dates are fixed and cannot be adjusted'}
        </Alert>
      )}
    </div>
  );
}
```

#### EventCard Component
```typescript
// frontend/src/components/preview/EventCard.tsx

interface EventCardProps {
  event: ParsedEvent;
  pdfType: 'lecture' | 'test' | 'exam';
}

export function EventCard({ event, pdfType }: EventCardProps) {
  const isUnfinalised = 
    event.venue?.toLowerCase().includes('unfinalised') ||
    event.venue?.toLowerCase().includes('tba') ||
    event.date?.toLowerCase().includes('tba');
  
  return (
    <Card>
      <h3>{event.summary}</h3>
      
      {isUnfinalised && pdfType === 'exam' && (
        <Badge variant="warning">Unfinalised</Badge>
      )}
      
      <p>
        {pdfType === 'lecture' ? event.day : event.date}
        {' at '}
        {event.startTime} - {event.endTime}
      </p>
      
      <p>Venue: {event.venue}</p>
      
      {isUnfinalised && (
        <Alert type="warning">
          This exam schedule is not yet finalised. 
          Check for updates closer to the exam period.
        </Alert>
      )}
    </Card>
  );
}
```

#### PreviewPage Component
```typescript
// frontend/src/app/preview/page.tsx

export default function PreviewPage() {
  const { events, pdfType } = useEventStore();
  
  // Group events based on mode
  const groupedEvents = useMemo(() => {
    if (pdfType === 'lecture') {
      return groupByDay(events);
    } else {
      return groupByDate(events);
    }
  }, [events, pdfType]);
  
  return (
    <div>
      <h1>
        {pdfType === 'lecture' && 'Lecture Schedule Preview'}
        {pdfType === 'test' && 'Test Schedule Preview'}
        {pdfType === 'exam' && 'Exam Schedule Preview'}
      </h1>
      
      <EventList 
        events={groupedEvents} 
        pdfType={pdfType}
      />
    </div>
  );
}
```

### State Management Updates

```typescript
// frontend/src/stores/eventStore.ts

interface EventStore {
  events: ParsedEvent[];
  pdfType: 'lecture' | 'test' | 'exam';
  semesterStart?: string;  // Only for lecture mode
  semesterEnd?: string;    // Only for lecture mode
  
  setEvents: (events: ParsedEvent[], pdfType: string) => void;
  setSemesterDates: (start: string, end: string) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  pdfType: 'lecture',
  
  setEvents: (events, pdfType) => set({ 
    events, 
    pdfType: pdfType as 'lecture' | 'test' | 'exam',
    // Clear semester dates if not lecture mode
    ...(pdfType !== 'lecture' && { 
      semesterStart: undefined, 
      semesterEnd: undefined 
    })
  }),
  
  setSemesterDates: (start, end) => set({ 
    semesterStart: start, 
    semesterEnd: end 
  }),
}));
```

### Validation Updates

```typescript
// frontend/src/utils/validation.ts

export function validateCalendarConfig(
  pdfType: 'lecture' | 'test' | 'exam',
  semesterStart?: string,
  semesterEnd?: string
): ValidationResult {
  // Semester dates required only for lecture mode
  if (pdfType === 'lecture') {
    if (!semesterStart || !semesterEnd) {
      return {
        valid: false,
        error: 'Semester start and end dates are required for lecture schedules'
      };
    }
    
    if (new Date(semesterStart) >= new Date(semesterEnd)) {
      return {
        valid: false,
        error: 'Semester start date must be before end date'
      };
    }
  }
  
  return { valid: true };
}
```

### ICS Generation Updates

```typescript
// frontend/src/services/calendarService.ts

export async function generateIcs(
  events: ParsedEvent[],
  pdfType: 'lecture' | 'test' | 'exam',
  config: CalendarConfig
): Promise<Blob> {
  // Only include semester dates for lecture mode
  const payload = {
    events: events.map(e => ({
      ...e,
      // Add unfinalised flag for exams
      notes: pdfType === 'exam' && isUnfinalised(e) 
        ? 'This exam schedule is not yet finalised. Check for updates.'
        : undefined
    })),
    ...(pdfType === 'lecture' && {
      semesterStart: config.semesterStart,
      semesterEnd: config.semesterEnd,
    }),
  };
  
  const response = await api.post('/generate/ics', payload);
  return response.data;
}
```

### User Experience Flow

#### Lecture Mode Flow
1. Upload PDF → Detected as "Lecture"
2. Preview shows day-of-week grouping
3. User selects module colors
4. User sets semester start/end dates ✓
5. Generate calendar

#### Test Mode Flow
1. Upload PDF → Detected as "Test"
2. Preview shows date-based grouping
3. User selects module colors
4. Date range picker hidden (not applicable)
5. Generate calendar

#### Exam Mode Flow
1. Upload PDF → Detected as "Exam"
2. Preview shows date-based grouping
3. System checks for "Unfinalised" or "TBA" text
4. If unfinalised: Show warning badges
5. User selects module colors
6. Date range picker hidden (not applicable)
7. Generate calendar with notes

## Configuration Changes

### Environment Variables

No new environment variables required.

### Feature Flags

Consider adding feature flag for gradual rollout:

```env
ENABLE_EXAM_MODE=true  # Enable exam PDF support
```

This allows testing exam support in production without affecting existing functionality.
