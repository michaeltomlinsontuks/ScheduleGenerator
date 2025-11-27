# Design Document - UP Schedule Generator V3 Backend

## Overview

The backend is a NestJS application that provides a REST API for the UP Schedule Generator. It handles PDF uploads, orchestrates asynchronous processing via BullMQ, integrates with Google Calendar API, and generates ICS files. The architecture follows NestJS modular patterns with clear separation between controllers, services, and data access layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NestJS Application                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Upload    │  │    Jobs     │  │    Auth     │  │  Calendar   │        │
│  │  Controller │  │  Controller │  │  Controller │  │  Controller │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   Upload    │  │    Jobs     │  │    Auth     │  │  Calendar   │        │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └──────┬──────┘        │
│         │                │                                  │               │
│  ┌──────▼──────┐  ┌──────▼──────┐                   ┌──────▼──────┐        │
│  │   Storage   │  │    Jobs     │                   │     ICS     │        │
│  │   Service   │  │  Processor  │                   │   Service   │        │
│  └──────┬──────┘  └──────┬──────┘                   └─────────────┘        │
│         │                │                                                  │
└─────────┼────────────────┼──────────────────────────────────────────────────┘
          │                │
          ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │   MinIO   │    │   Redis   │    │ PostgreSQL│    │  Python   │
    │ (Storage) │    │  (Queue)  │    │   (DB)    │    │  Parser   │
    └───────────┘    └───────────┘    └───────────┘    └───────────┘
```

## Components and Interfaces

### 1. AppModule (Root Module)

The root module imports all feature modules and configures global providers.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UploadModule,
    StorageModule,
    JobsModule,
    ParserModule,
    CalendarModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 2. ConfigModule

Centralized configuration management using environment variables.

```typescript
// configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET || 'pdf-uploads',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
```

### 3. UploadModule

Handles PDF file uploads with validation.

**Controller Interface:**
```typescript
@Controller('api/upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadPdf(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ): Promise<UploadResponseDto>
}
```

**Service Interface:**
```typescript
interface UploadService {
  processUpload(file: Express.Multer.File): Promise<UploadResponseDto>;
  validatePdfContent(buffer: Buffer): Promise<PdfType>;
}
```

### 4. StorageModule

MinIO S3 operations for temporary PDF storage.

**Service Interface:**
```typescript
interface StorageService {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}
```

### 5. JobsModule

Job queue management and status tracking.

**Controller Interface:**
```typescript
@Controller('api/jobs')
export class JobsController {
  @Get(':id')
  async getJobStatus(@Param('id') id: string): Promise<JobStatusDto>
  
  @Get(':id/result')
  async getJobResult(@Param('id') id: string): Promise<JobResultDto>
}
```

**Service Interface:**
```typescript
interface JobsService {
  createJob(s3Key: string, pdfType: PdfType): Promise<Job>;
  getJobById(id: string): Promise<Job>;
  updateJobStatus(id: string, status: JobStatus, result?: ParsedEvent[], error?: string): Promise<Job>;
}
```

**Processor Interface:**
```typescript
@Processor('pdf-processing')
export class JobsProcessor {
  @Process()
  async processPdf(job: BullJob<PdfJobData>): Promise<ParsedEvent[]>
}
```

### 6. ParserModule

Communication with Python PDF parser service.

**Service Interface:**
```typescript
interface ParserService {
  parsePdf(pdfBuffer: Buffer, pdfType: PdfType): Promise<ParsedEvent[]>;
}
```

### 7. AuthModule

Google OAuth authentication.

**Controller Interface:**
```typescript
@Controller('api/auth')
export class AuthController {
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void>
  
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req): Promise<AuthResponseDto>
  
  @Get('status')
  async getAuthStatus(@Req() req): Promise<AuthStatusDto>
  
  @Post('logout')
  async logout(@Req() req): Promise<void>
}
```

### 8. CalendarModule

Google Calendar API and ICS generation.

**Controller Interface:**
```typescript
@Controller('api')
export class CalendarController {
  @Get('calendars')
  async listCalendars(@Req() req): Promise<CalendarListDto>
  
  @Post('calendars')
  async createCalendar(@Req() req, @Body() dto: CreateCalendarDto): Promise<CalendarDto>
  
  @Post('calendars/events')
  async addEvents(@Req() req, @Body() dto: AddEventsDto): Promise<void>
  
  @Post('generate/ics')
  async generateIcs(@Body() dto: GenerateIcsDto, @Res() res): Promise<void>
}
```

**ICS Service Interface:**
```typescript
interface IcsService {
  generateIcs(events: EventConfigDto[], semesterStart: string, semesterEnd: string): string;
  createRecurringEvent(event: EventConfigDto, semesterStart: string, semesterEnd: string): string;
  createSingleEvent(event: EventConfigDto): string;
}
```

**Google Calendar Service Interface:**
```typescript
interface GoogleCalendarService {
  listCalendars(accessToken: string): Promise<Calendar[]>;
  createCalendar(accessToken: string, name: string): Promise<Calendar>;
  addEvents(accessToken: string, calendarId: string, events: EventConfigDto[], semesterStart: string, semesterEnd: string): Promise<void>;
}
```

### 9. HealthModule

Health check endpoints.

**Controller Interface:**
```typescript
@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult>
}
```

## Data Models

### Job Entity

```typescript
@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Column({ type: 'enum', enum: PdfType })
  pdfType: PdfType;

  @Column()
  s3Key: string;

  @Column({ type: 'jsonb', nullable: true })
  result: ParsedEvent[] | null;

  @Column({ nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date | null;
}

enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

enum PdfType {
  WEEKLY = 'weekly',
  TEST = 'test',
}
```

### ParsedEvent DTO

```typescript
export class ParsedEventDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  module: string;

  @ApiProperty()
  @IsString()
  activity: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @ApiProperty()
  @IsString()
  venue: string;

  @ApiProperty()
  @IsBoolean()
  isRecurring: boolean;
}
```

### EventConfig DTO

```typescript
export class EventConfigDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty()
  @IsBoolean()
  isRecurring: boolean;

  @ApiProperty()
  @IsString()
  colorId: string;
}
```

### GenerateIcs DTO

```typescript
export class GenerateIcsDto {
  @ApiProperty({ type: [EventConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventConfigDto)
  events: EventConfigDto[];

  @ApiProperty()
  @IsDateString()
  semesterStart: string;

  @ApiProperty()
  @IsDateString()
  semesterEnd: string;
}
```

### Upload Response DTO

```typescript
export class UploadResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  pdfType: PdfType;

  @ApiProperty()
  message: string;
}
```

### Job Status DTO

```typescript
export class JobStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ enum: PdfType })
  pdfType: PdfType;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  error?: string;
}
```

### Job Result DTO

```typescript
export class JobResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [ParsedEventDto] })
  events: ParsedEventDto[];
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties have been identified:

### Property 1: Configuration Loading Consistency

*For any* set of environment variables, when the ConfigService is queried for a configuration value, it SHALL return the value from the corresponding environment variable or the defined default.

**Validates: Requirements 1.1**

### Property 2: Error Response Format Consistency

*For any* unhandled exception thrown by the Backend, the HTTP response SHALL contain a JSON body with `statusCode` (number), `message` (string), and `timestamp` (ISO date string) fields.

**Validates: Requirements 1.5**

### Property 3: CORS Origin Validation

*For any* HTTP request with an Origin header, the Backend SHALL include CORS headers only when the Origin matches the configured frontend URL.

**Validates: Requirements 1.4**

### Property 4: PDF Content Type Validation

*For any* file uploaded to `/api/upload`, if the content type is not `application/pdf`, the Backend SHALL reject the request with a 400 status code.

**Validates: Requirements 2.1**

### Property 5: PDF Size Validation

*For any* PDF file uploaded to `/api/upload`, if the file size exceeds 10MB (10,485,760 bytes), the Backend SHALL reject the request with a 400 status code.

**Validates: Requirements 2.2**

### Property 6: UP Schedule Content Detection

*For any* PDF buffer, the content validation function SHALL return a valid PdfType (WEEKLY or TEST) if and only if the content contains "Lectures" or "Semester Tests" keywords respectively.

**Validates: Requirements 2.3, 2.4**

### Property 7: Valid Upload Returns Job ID

*For any* valid UP schedule PDF upload, the Backend SHALL return a response containing a valid UUID job ID.

**Validates: Requirements 2.5**

### Property 8: Job Status Retrieval

*For any* valid job ID in the database, requesting `/api/jobs/:id` SHALL return a status that is one of: pending, processing, completed, or failed.

**Validates: Requirements 3.1**

### Property 9: Non-Existent Job Returns 404

*For any* UUID that does not exist in the jobs table, requesting `/api/jobs/:id` SHALL return a 404 status code with JOB_NOT_FOUND error.

**Validates: Requirements 3.2**

### Property 10: Job State Transition Integrity

*For any* job, when processing completes, the job record SHALL have either (status=completed AND result contains ParsedEvent array) OR (status=failed AND error contains error message).

**Validates: Requirements 3.3, 3.4, 4.3, 4.4**

### Property 11: Completed Job Results Retrieval

*For any* job with status=completed, requesting `/api/jobs/:id/result` SHALL return the same ParsedEvent array stored in the job record.

**Validates: Requirements 3.5**

### Property 12: PDF Cleanup After Processing

*For any* job that transitions to completed or failed status, the PDF file with the job's s3Key SHALL no longer exist in MinIO storage.

**Validates: Requirements 4.5**

### Property 13: Auth Status Consistency

*For any* session, the `/api/auth/status` endpoint SHALL return `authenticated: true` if and only if valid Google credentials exist in the session.

**Validates: Requirements 5.3**

### Property 14: Logout Clears Session

*For any* authenticated session, after calling `/api/auth/logout`, subsequent calls to `/api/auth/status` SHALL return `authenticated: false`.

**Validates: Requirements 5.4**

### Property 15: ICS Generation Validity

*For any* array of EventConfigDto objects, the generated ICS string SHALL be parseable as valid iCalendar format and contain exactly one VEVENT for each non-recurring event and one VEVENT with RRULE for each recurring event.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 16: ICS Recurring Event RRULE

*For any* EventConfigDto with isRecurring=true, the generated VEVENT SHALL contain an RRULE with FREQ=WEEKLY and UNTIL set to the semester end date.

**Validates: Requirements 7.2**

### Property 17: ICS Single Event No RRULE

*For any* EventConfigDto with isRecurring=false, the generated VEVENT SHALL NOT contain an RRULE property.

**Validates: Requirements 7.3**

### Property 18: DTO Validation Rejects Invalid Data

*For any* request body that violates DTO validation rules (missing required fields, invalid formats, wrong types), the Backend SHALL return a 400 status with validation error details.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 19: Time Format Validation

*For any* string value for startTime or endTime fields, the validation SHALL accept only strings matching the pattern `^\d{2}:\d{2}$` (e.g., "08:30", "14:00").

**Validates: Requirements 10.2**

### Property 20: Date String Validation

*For any* string value for semesterStart or semesterEnd fields, the validation SHALL accept only valid ISO 8601 date strings.

**Validates: Requirements 10.3**

## Error Handling

### HTTP Exception Filter

A global exception filter catches all unhandled exceptions and transforms them into standardized error responses:

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';
    
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_FILE_TYPE | 400 | Uploaded file is not a PDF |
| FILE_TOO_LARGE | 400 | File exceeds 10MB limit |
| INVALID_PDF_CONTENT | 400 | PDF is not a UP schedule |
| JOB_NOT_FOUND | 404 | Job ID does not exist |
| PROCESSING_FAILED | 500 | PDF parsing failed |
| GOOGLE_AUTH_FAILED | 401 | OAuth authentication error |
| CALENDAR_API_ERROR | 500 | Google Calendar API error |

### Validation Errors

Validation errors return detailed information about which fields failed:

```typescript
{
  statusCode: 400,
  message: "Validation failed",
  errors: [
    { field: "startTime", message: "startTime must match /^\\d{2}:\\d{2}$/" },
    { field: "semesterStart", message: "semesterStart must be a valid ISO date string" }
  ],
  timestamp: "2025-11-27T10:00:00.000Z"
}
```

## Testing Strategy

### Property-Based Testing Framework

The backend will use **fast-check** for property-based testing in TypeScript/Jest. This library provides:
- Arbitrary generators for primitive and complex types
- Shrinking for minimal failing examples
- Integration with Jest test runner

### Unit Tests

Unit tests cover specific examples and edge cases:

- **ConfigService**: Test loading of each configuration key
- **FileValidationPipe**: Test PDF validation with valid/invalid files
- **JobsService**: Test CRUD operations and status transitions
- **IcsService**: Test ICS generation for various event configurations
- **DTO Validation**: Test validation decorators with edge cases

### Property-Based Tests

Each correctness property will have a corresponding property-based test:

```typescript
// Example: Property 19 - Time Format Validation
import * as fc from 'fast-check';

describe('Time Format Validation', () => {
  // **Feature: backend-implementation, Property 19: Time Format Validation**
  it('should accept only HH:MM format strings', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const isValid = /^\d{2}:\d{2}$/.test(input);
        const validationResult = validateTimeFormat(input);
        return validationResult.isValid === isValid;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Test Configuration

- Minimum 100 iterations per property-based test
- Each property test tagged with: `**Feature: backend-implementation, Property {number}: {property_text}**`
- Jest configuration with coverage thresholds:
  - Statements: 80%
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%

### E2E Tests

End-to-end tests verify complete workflows:

- Upload flow: PDF upload → job creation → status polling → result retrieval
- ICS generation: Events submission → ICS file download
- OAuth flow: Google authentication → calendar listing → event creation

### Test File Structure

```
backend/
├── src/
│   ├── upload/
│   │   ├── upload.service.ts
│   │   └── upload.service.spec.ts
│   ├── jobs/
│   │   ├── jobs.service.ts
│   │   └── jobs.service.spec.ts
│   ├── calendar/
│   │   ├── ics.service.ts
│   │   └── ics.service.spec.ts
│   └── common/
│       ├── pipes/
│       │   ├── file-validation.pipe.ts
│       │   └── file-validation.pipe.spec.ts
│       └── filters/
│           ├── http-exception.filter.ts
│           └── http-exception.filter.spec.ts
└── test/
    ├── app.e2e-spec.ts
    ├── upload.e2e-spec.ts
    └── calendar.e2e-spec.ts
```
