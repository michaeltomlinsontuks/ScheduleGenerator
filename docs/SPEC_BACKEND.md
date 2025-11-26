# Backend Specification - UP Schedule Generator V3

## Overview

NestJS API providing PDF upload, processing orchestration, Google Calendar integration, and ICS file generation. Includes Swagger documentation and Jest testing.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10+ | API framework |
| TypeScript | 5+ | Type safety |
| PostgreSQL | 16+ | Database |
| TypeORM | 0.3+ | ORM |
| BullMQ | 5+ | Job queue |
| Redis | 7+ | Queue backend |
| MinIO SDK | 7+ | S3 client |
| Passport | 0.7+ | Authentication |
| Swagger | 7+ | API documentation |
| Jest | 29+ | Testing |
| class-validator | 0.14+ | DTO validation |

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── config/
│   │   ├── config.module.ts       # Configuration module
│   │   ├── config.service.ts      # Environment config service
│   │   └── configuration.ts       # Config factory
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   └── api-file.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── file-validation.pipe.ts
│   │   └── guards/
│   │       └── optional-auth.guard.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts     # OAuth endpoints
│   │   ├── auth.service.ts        # OAuth logic
│   │   ├── strategies/
│   │   │   └── google.strategy.ts # Passport Google strategy
│   │   ├── guards/
│   │   │   └── google-auth.guard.ts
│   │   └── dto/
│   │       └── auth-response.dto.ts
│   │
│   ├── upload/
│   │   ├── upload.module.ts
│   │   ├── upload.controller.ts   # File upload endpoint
│   │   ├── upload.service.ts      # Upload handling
│   │   └── dto/
│   │       ├── upload-response.dto.ts
│   │       └── upload-file.dto.ts
│   │
│   ├── storage/
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts     # MinIO operations
│   │   └── storage.config.ts
│   │
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── jobs.controller.ts     # Job status endpoint
│   │   ├── jobs.service.ts        # Job management
│   │   ├── jobs.processor.ts      # BullMQ processor
│   │   ├── entities/
│   │   │   └── job.entity.ts      # TypeORM entity
│   │   └── dto/
│   │       ├── job-status.dto.ts
│   │       └── job-result.dto.ts
│   │
│   ├── parser/
│   │   ├── parser.module.ts
│   │   ├── parser.service.ts      # Calls Python worker
│   │   └── dto/
│   │       └── parsed-event.dto.ts
│   │
│   ├── calendar/
│   │   ├── calendar.module.ts
│   │   ├── calendar.controller.ts # Calendar endpoints
│   │   ├── calendar.service.ts    # Google Calendar API
│   │   ├── ics.service.ts         # ICS file generation
│   │   └── dto/
│   │       ├── generate-ics.dto.ts
│   │       ├── add-events.dto.ts
│   │       ├── calendar-list.dto.ts
│   │       └── event-config.dto.ts
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts   # Health check endpoint
│
├── test/
│   ├── app.e2e-spec.ts
│   ├── upload.e2e-spec.ts
│   └── calendar.e2e-spec.ts
│
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## Modules

### 1. AppModule (Root)
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ /* config */ }),
    BullModule.forRootAsync({ /* redis config */ }),
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

### 2. AuthModule
Handles Google OAuth for calendar access.

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiate OAuth flow |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/auth/logout` | Clear session |

**Google Strategy Scopes**:
```typescript
scope: [
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]
```

### 3. UploadModule
Handles PDF file uploads.

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload PDF file |

**Validation**:
- File type: `application/pdf`
- Max size: 10MB
- Quick content validation (check for UP schedule keywords)

**Flow**:
1. Receive file via multipart/form-data
2. Validate file type and size
3. Quick PDF scan for "Lectures" or "Semester Tests"
4. Upload to MinIO
5. Create job record in PostgreSQL
6. Add job to BullMQ queue
7. Return job ID

### 4. StorageModule
MinIO S3 operations.

**Service Methods**:
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

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs/:id` | Get job status |
| GET | `/api/jobs/:id/result` | Get job result (events) |

**Job Entity**:
```typescript
@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JobStatus })
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
```

**BullMQ Processor**:
```typescript
@Processor('pdf-processing')
export class JobsProcessor {
  @Process()
  async processPdf(job: Job<PdfJobData>): Promise<ParsedEvent[]> {
    // 1. Download PDF from MinIO
    // 2. Call Python parser service
    // 3. Update job status
    // 4. Delete PDF from MinIO
    // 5. Return parsed events
  }
}
```

### 6. ParserModule
Communicates with Python PDF parser worker.

**Service Methods**:
```typescript
interface ParserService {
  parsePdf(pdfBuffer: Buffer, pdfType: PdfType): Promise<ParsedEvent[]>;
}
```

**Communication Options**:
1. **HTTP**: Python Flask/FastAPI service
2. **Message Queue**: Redis pub/sub
3. **Child Process**: Spawn Python script

Recommended: HTTP with internal Docker network.

### 7. CalendarModule
Google Calendar API and ICS generation.

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/calendars` | List user's calendars |
| POST | `/api/calendars` | Create new calendar |
| POST | `/api/calendars/events` | Add events to calendar |
| POST | `/api/generate/ics` | Generate ICS file |

**ICS Service**:
```typescript
interface IcsService {
  generateIcs(events: EventConfig[]): string;
}
```

**Google Calendar Service**:
```typescript
interface GoogleCalendarService {
  listCalendars(accessToken: string): Promise<Calendar[]>;
  createCalendar(accessToken: string, name: string): Promise<Calendar>;
  addEvents(accessToken: string, calendarId: string, events: EventConfig[]): Promise<void>;
}
```

---

## DTOs

### ParsedEventDto
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

### GenerateIcsDto
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

### EventConfigDto
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
  startTime: string;

  @ApiProperty()
  @IsString()
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

### AddEventsDto
```typescript
export class AddEventsDto extends GenerateIcsDto {
  @ApiProperty()
  @IsString()
  calendarId: string;
}
```

---

## API Documentation (Swagger)

### Setup
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('UP Schedule Generator API')
  .setDescription('API for converting UP PDF schedules to calendar events')
  .setVersion('3.0')
  .addBearerAuth()
  .addOAuth2()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Swagger UI Access
- URL: `http://localhost:3001/api/docs`
- JSON: `http://localhost:3001/api/docs-json`

---

## Error Handling

### HTTP Exception Filter
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
| Code | Status | Description |
|------|--------|-------------|
| INVALID_FILE_TYPE | 400 | Not a PDF file |
| FILE_TOO_LARGE | 400 | Exceeds 10MB limit |
| INVALID_PDF_CONTENT | 400 | Not a UP schedule PDF |
| JOB_NOT_FOUND | 404 | Job ID doesn't exist |
| PROCESSING_FAILED | 500 | PDF parsing failed |
| GOOGLE_AUTH_FAILED | 401 | OAuth error |
| CALENDAR_API_ERROR | 500 | Google Calendar API error |

---

## Testing

### Unit Tests
```typescript
// jobs.service.spec.ts
describe('JobsService', () => {
  let service: JobsService;
  let repository: MockRepository<Job>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useClass: MockRepository },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  describe('createJob', () => {
    it('should create a new job with pending status', async () => {
      // ...
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      // ...
    });

    it('should throw NotFoundException for invalid ID', async () => {
      // ...
    });
  });
});
```

### E2E Tests
```typescript
// upload.e2e-spec.ts
describe('UploadController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/upload (POST) - valid PDF', () => {
    return request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', './test/fixtures/valid-schedule.pdf')
      .expect(201)
      .expect((res) => {
        expect(res.body.jobId).toBeDefined();
      });
  });

  it('/api/upload (POST) - invalid file type', () => {
    return request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', './test/fixtures/document.docx')
      .expect(400);
  });
});
```

### Test Coverage Target
- Minimum 80% coverage
- All controllers tested
- All services tested
- Critical paths E2E tested

---

## Configuration

### Environment Variables
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
    bucket: process.env.MINIO_BUCKET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
});
```

---

## Security

### CORS Configuration
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Helmet
```typescript
app.use(helmet());
```

### Rate Limiting (Future)
```typescript
// Not in MVP, but structure for future
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per 60 seconds
```

---

## Logging

### Winston Logger
```typescript
const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});
```

---

## Health Checks

### Endpoint
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // Add Redis, MinIO checks
    ]);
  }
}
```

---

## Database Migrations

### TypeORM CLI
```bash
# Generate migration
npm run typeorm migration:generate -- -n CreateJobsTable

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```
