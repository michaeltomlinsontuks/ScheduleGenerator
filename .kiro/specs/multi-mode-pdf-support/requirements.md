# Requirements Document

## Introduction

The UP Schedule Generator currently only reliably processes Lecture schedule PDFs. This feature extends the system to support three distinct PDF modes: Lectures, Tests, and Exams. Each mode has a different table structure and data format that requires specific parsing logic. Additionally, the PDF validation mechanism needs to be improved to reliably detect the PDF mode by checking for mode-identifying text in the top-left corner of the PDF.

## Glossary

- **PDF Mode**: The type of schedule document being processed (Lectures, Tests, or Exams)
- **Parser Service**: The Python-based PDF parsing worker that extracts structured data from PDF files
- **PDF Type Detection**: The process of identifying which mode a PDF belongs to by scanning its content
- **Validator**: The TypeScript-based component that performs initial PDF validation before processing
- **Event Data**: Structured information about a calendar event extracted from a PDF
- **Weekly Schedule**: Recurring events that happen on specific days of the week (Lectures)
- **Test Schedule**: One-time events scheduled for specific dates (Tests)
- **Exam Schedule**: One-time events scheduled for specific dates (Exams)

## Requirements

### Requirement 1

**User Story:** As a student, I want to upload a Lecture schedule PDF, so that I can generate recurring weekly calendar events for my classes.

#### Acceptance Criteria

1. WHEN a user uploads a PDF containing "Lectures" text in the top-left area THEN the system SHALL identify it as a Lecture mode PDF
2. WHEN the system processes a Lecture mode PDF THEN the system SHALL extract module, activity, group, day, time, and venue information
3. WHEN the system extracts Lecture events THEN the system SHALL mark them as recurring events
4. WHEN a Lecture PDF has multiple activities on different days for the same module THEN the system SHALL create separate events for each day-time-venue combination

### Requirement 2

**User Story:** As a student, I want to upload a Test schedule PDF, so that I can generate one-time calendar events for my semester tests.

#### Acceptance Criteria

1. WHEN a user uploads a PDF containing "Semester Tests" text in the top-left area THEN the system SHALL identify it as a Test mode PDF
2. WHEN the system processes a Test mode PDF THEN the system SHALL extract module, test name, date, time, and venue information
3. WHEN the system extracts Test events THEN the system SHALL mark them as non-recurring events
4. WHEN a Test PDF has multiple venues for the same test THEN the system SHALL create separate events for each venue

### Requirement 3

**User Story:** As a student, I want to upload an Exam schedule PDF, so that I can generate one-time calendar events for my final exams.

#### Acceptance Criteria

1. WHEN a user uploads a PDF containing "Exams" text in the top-left area THEN the system SHALL identify it as an Exam mode PDF
2. WHEN the system processes an Exam mode PDF THEN the system SHALL extract module, status, activity, date, start time, and venue information
3. WHEN the system extracts Exam events THEN the system SHALL mark them as non-recurring events
4. WHEN an Exam PDF has venue information with newline-separated details THEN the system SHALL combine them into a single venue string

### Requirement 4

**User Story:** As a system administrator, I want the PDF validation to check for mode-identifying text early, so that invalid PDFs are rejected before expensive processing begins.

#### Acceptance Criteria

1. WHEN the system validates an uploaded PDF THEN the system SHALL extract text from the first page
2. WHEN the system scans the first page text THEN the system SHALL search for "Lectures", "Semester Tests", or "Exams" keywords
3. WHEN the system finds "Lectures" keyword THEN the system SHALL return LECTURE mode type
4. WHEN the system finds "Semester Tests" keyword THEN the system SHALL return TEST mode type
5. WHEN the system finds "Exams" keyword THEN the system SHALL return EXAM mode type
6. WHEN the system does not find any valid mode keyword THEN the system SHALL reject the PDF with an appropriate error message
7. WHEN the PDF validation completes successfully THEN the system SHALL pass the detected mode to the parser service

### Requirement 5

**User Story:** As a developer, I want the parser to handle all three PDF modes with mode-specific logic, so that each schedule type is parsed correctly.

#### Acceptance Criteria

1. WHEN the parser receives a PDF with a specified mode THEN the parser SHALL route to the appropriate mode-specific parsing function
2. WHEN the parser processes a Lecture mode PDF THEN the parser SHALL use the weekly schedule parsing logic
3. WHEN the parser processes a Test mode PDF THEN the parser SHALL use the test schedule parsing logic
4. WHEN the parser processes an Exam mode PDF THEN the parser SHALL use the exam schedule parsing logic
5. WHEN the parser completes processing THEN the parser SHALL return a consistent event structure regardless of mode

### Requirement 6

**User Story:** As a developer, I want clear error messages for unsupported PDFs, so that users understand why their upload was rejected.

#### Acceptance Criteria

1. WHEN a PDF does not contain any valid mode keyword THEN the system SHALL return an error message stating "Invalid PDF: Not a recognized UP schedule format"
2. WHEN a PDF is corrupted or unreadable THEN the system SHALL return an error message stating "Invalid PDF: Unable to extract text content"
3. WHEN the parser encounters an unexpected table structure THEN the system SHALL return an error message indicating the specific parsing failure

### Requirement 7

**User Story:** As a system architect, I want the PDF mode to be stored with job records, so that processing can be tracked and debugged by mode type.

#### Acceptance Criteria

1. WHEN a job is created for PDF processing THEN the system SHALL store the detected PDF mode in the job entity
2. WHEN a job status is queried THEN the system SHALL include the PDF mode in the response
3. WHEN processing fails THEN the system SHALL include the PDF mode in error logs for debugging
