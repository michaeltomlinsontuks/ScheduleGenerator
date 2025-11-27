import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { JobsProcessor, PdfJobData, PARSER_SERVICE, IParserService } from './jobs.processor';
import { JobsService } from './jobs.service';
import { StorageService } from '../storage/storage.service';
import { JobStatus, PdfType, ParsedEvent } from './entities/job.entity';
import { Job as BullJob } from 'bullmq';

// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Arbitrary for generating valid UUIDs
const uuidArb = fc.uuid().filter((id) => UUID_V4_REGEX.test(id));

// Arbitrary for generating valid PDF types
const pdfTypeArb = fc.constantFrom(PdfType.WEEKLY, PdfType.TEST);

// Arbitrary for generating valid date strings (YYYY-MM-DD format)
// Using integer-based generation to avoid invalid date issues
const validDateArb = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }) // Use 28 to avoid month-end issues
).map(([year, month, day]) => 
  `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
);

// Arbitrary for generating parsed events
const parsedEventArb: fc.Arbitrary<ParsedEvent> = fc.record({
  id: uuidArb,
  module: fc.string({ minLength: 1, maxLength: 10 }),
  activity: fc.constantFrom('Lecture', 'Tutorial', 'Practical'),
  group: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: undefined }),
  day: fc.option(fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), { nil: undefined }),
  date: fc.option(validDateArb, { nil: undefined }),
  startTime: fc.integer({ min: 0, max: 23 }).chain((h) =>
    fc.integer({ min: 0, max: 59 }).map((m) =>
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    )
  ),
  endTime: fc.integer({ min: 0, max: 23 }).chain((h) =>
    fc.integer({ min: 0, max: 59 }).map((m) =>
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    )
  ),
  venue: fc.string({ minLength: 1, maxLength: 20 }),
  isRecurring: fc.boolean(),
});

// Arbitrary for generating job data
const pdfJobDataArb = fc.record({
  jobId: uuidArb,
  s3Key: fc.string({ minLength: 1, maxLength: 50 }).map((s) => `${s}.pdf`),
  pdfType: pdfTypeArb,
});

describe('JobsProcessor', () => {
  let processor: JobsProcessor;
  let jobsService: jest.Mocked<JobsService>;
  let storageService: jest.Mocked<StorageService>;
  let parserService: jest.Mocked<IParserService>;

  beforeEach(async () => {
    const mockJobsService = {
      updateJobStatus: jest.fn(),
      getJobById: jest.fn(),
    };

    const mockStorageService = {
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockParserService = {
      parsePdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsProcessor,
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: PARSER_SERVICE,
          useValue: mockParserService,
        },
      ],
    }).compile();

    processor = module.get<JobsProcessor>(JobsProcessor);
    jobsService = module.get(JobsService);
    storageService = module.get(StorageService);
    parserService = module.get(PARSER_SERVICE);
  });

  /**
   * **Feature: backend-implementation, Property 10: Job State Transition Integrity**
   * **Validates: Requirements 3.3, 3.4, 4.3, 4.4**
   *
   * For any job, when processing completes, the job record SHALL have either
   * (status=completed AND result contains ParsedEvent array) OR
   * (status=failed AND error contains error message).
   */
  describe('Property 10: Job State Transition Integrity', () => {
    it('should transition to COMPLETED with results on successful processing', () => {
      return fc.assert(
        fc.asyncProperty(
          pdfJobDataArb,
          fc.array(parsedEventArb, { minLength: 0, maxLength: 10 }),
          async (jobData, events) => {
            // Reset mocks
            jest.clearAllMocks();

            const pdfBuffer = Buffer.from('mock pdf content');
            storageService.downloadFile.mockResolvedValue(pdfBuffer);
            parserService.parsePdf.mockResolvedValue(events);
            jobsService.updateJobStatus.mockResolvedValue({} as any);
            storageService.deleteFile.mockResolvedValue(undefined);

            const mockBullJob = {
              data: jobData,
            } as BullJob<PdfJobData>;

            await processor.process(mockBullJob);

            // Verify state transitions
            const updateCalls = jobsService.updateJobStatus.mock.calls;

            // Should have been called twice: once for PROCESSING, once for COMPLETED
            if (updateCalls.length !== 2) return false;

            // First call should set status to PROCESSING
            const [firstId, firstStatus] = updateCalls[0];
            if (firstId !== jobData.jobId || firstStatus !== JobStatus.PROCESSING) {
              return false;
            }

            // Second call should set status to COMPLETED with results
            const [secondId, secondStatus, secondResult] = updateCalls[1];
            return (
              secondId === jobData.jobId &&
              secondStatus === JobStatus.COMPLETED &&
              Array.isArray(secondResult) &&
              secondResult.length === events.length
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should transition to FAILED with error message on processing failure', () => {
      return fc.assert(
        fc.asyncProperty(
          pdfJobDataArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          async (jobData, errorMessage) => {
            // Reset mocks
            jest.clearAllMocks();

            const pdfBuffer = Buffer.from('mock pdf content');
            storageService.downloadFile.mockResolvedValue(pdfBuffer);
            parserService.parsePdf.mockRejectedValue(new Error(errorMessage));
            jobsService.updateJobStatus.mockResolvedValue({} as any);
            storageService.deleteFile.mockResolvedValue(undefined);

            const mockBullJob = {
              data: jobData,
            } as BullJob<PdfJobData>;

            try {
              await processor.process(mockBullJob);
              return false; // Should have thrown
            } catch {
              // Verify state transitions
              const updateCalls = jobsService.updateJobStatus.mock.calls;

              // Should have been called twice: once for PROCESSING, once for FAILED
              if (updateCalls.length !== 2) return false;

              // First call should set status to PROCESSING
              const [firstId, firstStatus] = updateCalls[0];
              if (firstId !== jobData.jobId || firstStatus !== JobStatus.PROCESSING) {
                return false;
              }

              // Second call should set status to FAILED with error
              const [secondId, secondStatus, , secondError] = updateCalls[1];
              return (
                secondId === jobData.jobId &&
                secondStatus === JobStatus.FAILED &&
                secondError === errorMessage
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: backend-implementation, Property 12: PDF Cleanup After Processing**
   * **Validates: Requirements 4.5**
   *
   * For any job that transitions to completed or failed status, the PDF file
   * with the job's s3Key SHALL no longer exist in MinIO storage.
   */
  describe('Property 12: PDF Cleanup After Processing', () => {
    it('should delete PDF from MinIO after successful processing', () => {
      return fc.assert(
        fc.asyncProperty(
          pdfJobDataArb,
          fc.array(parsedEventArb, { minLength: 0, maxLength: 5 }),
          async (jobData, events) => {
            // Reset mocks
            jest.clearAllMocks();

            const pdfBuffer = Buffer.from('mock pdf content');
            storageService.downloadFile.mockResolvedValue(pdfBuffer);
            parserService.parsePdf.mockResolvedValue(events);
            jobsService.updateJobStatus.mockResolvedValue({} as any);
            storageService.deleteFile.mockResolvedValue(undefined);

            const mockBullJob = {
              data: jobData,
            } as BullJob<PdfJobData>;

            await processor.process(mockBullJob);

            // Verify deleteFile was called with the correct s3Key
            const deleteCalls = storageService.deleteFile.mock.calls;
            return (
              deleteCalls.length === 1 &&
              deleteCalls[0][0] === jobData.s3Key
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should delete PDF from MinIO after failed processing', () => {
      return fc.assert(
        fc.asyncProperty(
          pdfJobDataArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          async (jobData, errorMessage) => {
            // Reset mocks
            jest.clearAllMocks();

            const pdfBuffer = Buffer.from('mock pdf content');
            storageService.downloadFile.mockResolvedValue(pdfBuffer);
            parserService.parsePdf.mockRejectedValue(new Error(errorMessage));
            jobsService.updateJobStatus.mockResolvedValue({} as any);
            storageService.deleteFile.mockResolvedValue(undefined);

            const mockBullJob = {
              data: jobData,
            } as BullJob<PdfJobData>;

            try {
              await processor.process(mockBullJob);
            } catch {
              // Expected to throw
            }

            // Verify deleteFile was called with the correct s3Key
            const deleteCalls = storageService.deleteFile.mock.calls;
            return (
              deleteCalls.length === 1 &&
              deleteCalls[0][0] === jobData.s3Key
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
