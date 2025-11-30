# API Documentation Updates - Task 19

## Summary

Updated comprehensive API documentation for the multi-mode PDF support feature. All endpoints, DTOs, and error responses now include detailed mode-specific examples and descriptions for LECTURE, TEST, and EXAM modes.

## Changes Made

### 1. New Files Created

#### `backend/src/common/dto/error-response.dto.ts`
- Created standardized error response DTO
- Includes statusCode, message, timestamp, path, and details fields
- Used across all error responses for consistency

#### `backend/API_DOCUMENTATION.md`
- Comprehensive API documentation covering all endpoints
- Mode-specific behavior explanations
- Complete workflow examples
- Error handling guide
- Data model definitions

### 2. Enhanced Controllers

#### `backend/src/upload/upload.controller.ts`
- Added detailed operation description explaining mode detection
- Added comprehensive error response examples:
  - Invalid file type
  - File too large
  - Invalid PDF magic bytes
  - Text extraction failed
  - Unrecognized format
- Added success response examples for all three modes (lecture, test, exam)

#### `backend/src/jobs/jobs.controller.ts`
- Enhanced GET `/api/jobs/:id` endpoint:
  - Added detailed descriptions for all job statuses
  - Added examples for pending, processing, completed, and failed jobs
  - Added mode-specific examples
- Enhanced GET `/api/jobs/:id/result` endpoint:
  - Added detailed descriptions explaining mode differences
  - Added complete event examples for lecture, test, and exam modes
  - Added error response examples

#### `backend/src/calendar/calendar.controller.ts`
- Enhanced POST `/api/calendars/events` endpoint:
  - Added mode-specific validation requirements
  - Added detailed error response schemas
- Enhanced POST `/api/generate/ics` endpoint:
  - Added mode-specific validation requirements
  - Added detailed error response schemas

### 3. Enhanced DTOs

#### `backend/src/upload/dto/upload-response.dto.ts`
- Enhanced pdfType field with detailed descriptions for each mode
- Added examples for lecture, test, and exam modes

#### `backend/src/jobs/dto/job-status.dto.ts`
- Enhanced all fields with detailed descriptions
- Added examples for all enum values
- Added common error message examples

#### `backend/src/jobs/dto/job-result.dto.ts`
- Enhanced ParsedEventDto with mode-specific field descriptions
- Added detailed examples for each field
- Explained when fields are present/absent based on mode

#### `backend/src/calendar/dto/event-config.dto.ts`
- Enhanced all fields with mode-specific descriptions
- Added examples showing typical values for each mode
- Explained field usage across different modes

#### `backend/src/calendar/dto/add-events.dto.ts`
- Enhanced semesterStart/semesterEnd with requirement explanations
- Added mode-specific validation requirements
- Enhanced pdfType field with detailed mode descriptions

#### `backend/src/calendar/dto/generate-ics.dto.ts`
- Enhanced semesterStart/semesterEnd with requirement explanations
- Added mode-specific validation requirements
- Enhanced pdfType field with detailed mode descriptions

## Documentation Coverage

### Endpoints Documented

1. **POST /api/upload**
   - Success responses with examples for all 3 modes
   - 5 different error scenarios with examples

2. **GET /api/jobs/:id**
   - Success responses with examples for all 4 job statuses
   - Error responses with examples

3. **GET /api/jobs/:id/result**
   - Success responses with examples for all 3 modes
   - Error responses with examples

4. **POST /api/calendars/events**
   - Enhanced with mode-specific validation requirements
   - Detailed error responses

5. **POST /api/generate/ics**
   - Enhanced with mode-specific validation requirements
   - Detailed error responses

### Error Responses Documented

#### Upload Errors (Requirements 6.1, 6.2)
1. Invalid file type (FILE_TYPE_NOT_ALLOWED)
2. File too large (FILE_TOO_LARGE)
3. Invalid PDF magic bytes
4. Text extraction failed
5. Unrecognized format

#### Job Errors
1. Job not found (404)
2. Job not completed (400)

#### Calendar Errors
1. Missing semester dates (MISSING_SEMESTER_DATES)
2. Not authenticated (GOOGLE_AUTH_REQUIRED)

### Mode-Specific Examples

#### Lecture Mode
- Upload response example
- Job status example
- Event structure with day field and isRecurring=true
- Semester date requirements

#### Test Mode
- Upload response example
- Job status example
- Event structure with date field and isRecurring=false
- Optional semester dates

#### Exam Mode
- Upload response example
- Job status example
- Event structure with date field and isRecurring=false
- Optional semester dates
- Unfinalised exam handling

## Swagger/OpenAPI Integration

All documentation is integrated with NestJS Swagger decorators:
- `@ApiOperation` - Endpoint descriptions
- `@ApiResponse` - Response schemas and examples
- `@ApiProperty` - DTO field descriptions and examples
- `@ApiPropertyOptional` - Optional field descriptions
- `@ApiParam` - Path parameter descriptions

The interactive Swagger UI is available at `/api/docs` and includes:
- All endpoint documentation
- Request/response schemas
- Example values for all modes
- Error response examples
- Try-it-out functionality

## Validation

- ✅ Backend compiles successfully
- ✅ All tests pass (71 tests)
- ✅ No TypeScript errors
- ✅ All DTOs properly typed
- ✅ All examples are valid JSON

## Requirements Validation

### Requirement 6.1: Clear error messages for unsupported PDFs
✅ Documented all error messages:
- "Invalid PDF: Not a recognized UP schedule format"
- "Invalid PDF: Unable to extract text content"
- "Invalid PDF: file does not start with PDF magic bytes"

### Requirement 6.2: Error response format
✅ Documented standardized error response format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/upload",
  "details": "Additional details"
}
```

### Additional Documentation
✅ Documented new PdfType enum values (LECTURE, TEST, EXAM)
✅ Added examples for each mode
✅ Explained mode-specific behavior
✅ Documented validation requirements

## Files Modified

1. `backend/src/common/dto/error-response.dto.ts` (NEW)
2. `backend/src/upload/upload.controller.ts`
3. `backend/src/upload/dto/upload-response.dto.ts`
4. `backend/src/jobs/jobs.controller.ts`
5. `backend/src/jobs/dto/job-status.dto.ts`
6. `backend/src/jobs/dto/job-result.dto.ts`
7. `backend/src/calendar/calendar.controller.ts`
8. `backend/src/calendar/dto/event-config.dto.ts`
9. `backend/src/calendar/dto/add-events.dto.ts`
10. `backend/src/calendar/dto/generate-ics.dto.ts`
11. `backend/API_DOCUMENTATION.md` (NEW)

## Next Steps

The API documentation is now complete and comprehensive. Developers can:
1. Access interactive documentation at `/api/docs`
2. View detailed examples for all three PDF modes
3. Understand error responses and how to handle them
4. See mode-specific validation requirements
5. Use the comprehensive API_DOCUMENTATION.md as a reference

## Testing

To verify the Swagger documentation:
```bash
cd backend
npm run start:dev
# Visit http://localhost:3001/api/docs
```

The Swagger UI will show all endpoints with:
- Detailed descriptions
- Request/response schemas
- Example values for all modes
- Error response examples
- Try-it-out functionality
