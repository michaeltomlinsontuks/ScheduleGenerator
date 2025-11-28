# Implementation Plan

- [x] 1. Update backend data model and enums
  - Add EXAM value to PdfType enum in job.entity.ts
  - Rename WEEKLY to LECTURE in PdfType enum
  - Create database migration to update enum and existing records
  - _Requirements: 7.1_

- [ ]* 1.1 Write property test for job entity
  - **Property 17: Job stores PDF mode**
  - **Validates: Requirements 7.1**

- [x] 2. Enhance PDF content validator in backend
  - Install pdf-parse dependency
  - Update validatePdfContent() to be async
  - Implement first-page text extraction
  - Add keyword detection for "Lectures", "Semester Tests", "Examinations"
  - Map keywords to PdfType enum values
  - Add error handling for unrecognized formats
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 2.1 Write property test for lecture mode detection
  - **Property 1: Mode detection for Lectures**
  - **Validates: Requirements 1.1**

- [ ]* 2.2 Write property test for test mode detection
  - **Property 2: Mode detection for Tests**
  - **Validates: Requirements 2.1**

- [ ]* 2.3 Write property test for exam mode detection
  - **Property 3: Mode detection for Exams**
  - **Validates: Requirements 3.1**

- [ ]* 2.4 Write property test for invalid PDF rejection
  - **Property 13: Invalid PDF rejection**
  - **Validates: Requirements 4.4**

- [x] 3. Update upload service to use async validation
  - Update processUpload() to await validatePdfContent()
  - Update error handling for new validation errors
  - Ensure pdfType is correctly passed to job queue
  - _Requirements: 4.5_

- [ ]* 3.1 Write property test for mode passed to parser
  - **Property 14: Mode passed to parser**
  - **Validates: Requirements 4.5**

- [ ]* 3.2 Write unit tests for upload service
  - Test successful upload with each mode
  - Test validation error handling
  - Test job creation with correct pdfType

- [x] 4. Enhance Python PDF type detection
  - Update get_pdf_type() in utils.py to check first page only
  - Add "Examinations" keyword detection
  - Return 'lecture', 'test', 'exam', or 'unknown'
  - Update return type annotation
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 4.1 Write unit tests for get_pdf_type()
  - Test with lecture PDF fixture
  - Test with test PDF fixture
  - Test with exam PDF fixture
  - Test with invalid PDF fixture

- [x] 5. Implement exam schedule parser
  - Create _parse_exam_schedule() function in pdf_parser.py
  - Extract module, exam name, date, time, venue from tables
  - Handle multiple venues per exam (split into separate events)
  - Forward-fill module and exam columns
  - Clean and validate data
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 5.1 Write property test for exam events have required fields
  - **Property 6: Exam events have required fields**
  - **Validates: Requirements 3.2**

- [ ]* 5.2 Write property test for multi-venue exam splitting
  - **Property 12: Multi-venue exam splitting**
  - **Validates: Requirements 3.4**

- [ ]* 5.3 Write unit tests for _parse_exam_schedule()
  - Test with sample exam table data
  - Test multi-venue splitting
  - Test forward-fill logic

- [x] 6. Update main parse_pdf() function
  - Add routing for 'exam' mode to _parse_exam_schedule()
  - Update error message for unknown types
  - Ensure consistent return structure for all modes
  - _Requirements: 5.1, 5.5_

- [ ]* 6.1 Write property test for parser routing
  - **Property 15: Parser routing**
  - **Validates: Requirements 5.1**

- [ ]* 6.2 Write property test for consistent output structure
  - **Property 16: Consistent output structure**
  - **Validates: Requirements 5.5**

- [x] 7. Update data processor for exam events
  - Update process_events() to handle exam events
  - Generate summary as "{Module} {Exam}"
  - Ensure isRecurring logic works for all modes
  - Add location field from venue
  - _Requirements: 3.2, 3.3_

- [ ]* 7.1 Write property test for exam events are non-recurring
  - **Property 9: Exam events are non-recurring**
  - **Validates: Requirements 3.3**

- [ ]* 7.2 Write unit tests for process_events()
  - Test exam event summary generation
  - Test time extraction for exams
  - Test field cleaning

- [x] 8. Verify existing lecture and test parsers
  - Ensure _parse_weekly_schedule() still works correctly
  - Ensure _parse_test_schedule() still works correctly
  - Update any hardcoded 'weekly' references to 'lecture'
  - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4_

- [ ]* 8.1 Write property test for lecture events have required fields
  - **Property 4: Lecture events have required fields**
  - **Validates: Requirements 1.2**

- [ ]* 8.2 Write property test for lecture events are recurring
  - **Property 7: Lecture events are recurring**
  - **Validates: Requirements 1.3**

- [ ]* 8.3 Write property test for multi-day lecture splitting
  - **Property 10: Multi-day lecture splitting**
  - **Validates: Requirements 1.4**

- [ ]* 8.4 Write property test for test events have required fields
  - **Property 5: Test events have required fields**
  - **Validates: Requirements 2.2**

- [ ]* 8.5 Write property test for test events are non-recurring
  - **Property 8: Test events are non-recurring**
  - **Validates: Requirements 2.3**

- [ ]* 8.6 Write property test for multi-venue test splitting
  - **Property 11: Multi-venue test splitting**
  - **Validates: Requirements 2.4**

- [x] 9. Update job status endpoints
  - Ensure GET /api/jobs/:id returns pdfType in response
  - Update JobStatusDto to include pdfType field
  - Update error logging to include pdfType
  - _Requirements: 7.2, 7.3_

- [ ]* 9.1 Write property test for job status includes mode
  - **Property 18: Job status includes mode**
  - **Validates: Requirements 7.2**

- [ ]* 9.2 Write property test for error logs include mode
  - **Property 19: Error logs include mode**
  - **Validates: Requirements 7.3**

- [ ]* 9.3 Write unit tests for job status endpoint
  - Test response includes pdfType
  - Test error response includes pdfType

- [x] 10. Update frontend event store
  - Add pdfType field to EventStore interface
  - Update setEvents() to accept and store pdfType
  - Clear semesterStart/semesterEnd when pdfType is not 'lecture'
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]* 10.1 Write unit tests for event store
  - Test pdfType storage
  - Test semester date clearing for non-lecture modes

- [x] 11. Update customize page for mode-specific UI
  - Conditionally render DateRangePicker only for lecture mode
  - Show info alert for test/exam modes explaining fixed dates
  - Keep ModuleColorPicker visible for all modes
  - Update page title based on mode
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]* 11.1 Write unit tests for customize page
  - Test date range picker visibility by mode
  - Test alert messages for test/exam modes

- [x] 12. Update preview page for mode-specific grouping
  - Implement groupByDay() for lecture mode
  - Implement groupByDate() for test/exam modes
  - Update page title based on mode
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]* 12.1 Write unit tests for preview page
  - Test event grouping by mode
  - Test page title rendering

- [x] 13. Update EventCard component for unfinalised exams
  - Detect "Unfinalised" or "TBA" text in venue/date fields
  - Show warning badge for unfinalised exams
  - Add alert message explaining unfinalised status
  - _Requirements: 3.1_

- [ ]* 13.1 Write unit tests for EventCard
  - Test unfinalised detection
  - Test badge rendering
  - Test alert rendering

- [x] 14. Update calendar service for mode-specific generation
  - Update generateIcs() to conditionally include semester dates
  - Add notes field for unfinalised exams
  - Update validation to require semester dates only for lecture mode
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]* 14.1 Write unit tests for calendar service
  - Test ICS generation for each mode
  - Test semester date inclusion/exclusion
  - Test unfinalised exam notes

- [x] 15. Create test fixtures
  - Create fixtures/lecture-schedule.pdf
  - Create fixtures/test-schedule.pdf
  - Create fixtures/exam-schedule.pdf
  - Create fixtures/invalid-format.pdf
  - Create sample table data in fixtures/sample_tables.py
  - _Requirements: All_

- [x] 16. Run database migration
  - Execute migration to add EXAM enum value
  - Verify existing jobs are migrated from 'weekly' to 'lecture'
  - Test rollback procedure
  - _Requirements: 7.1_

- [x] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Integration testing
  - Test end-to-end upload flow for lecture PDF
  - Test end-to-end upload flow for test PDF
  - Test end-to-end upload flow for exam PDF
  - Test error handling for invalid PDFs
  - Test job processing with each mode
  - _Requirements: All_

- [ ]* 18.1 Write E2E tests
  - Test lecture PDF upload and processing
  - Test test PDF upload and processing
  - Test exam PDF upload and processing
  - Test invalid PDF rejection

- [x] 19. Update API documentation
  - Update Swagger docs with new PdfType enum values
  - Document new error responses
  - Add examples for each mode
  - _Requirements: 6.1, 6.2_

- [x] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
