import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job, JobStatus, PdfType, ParsedEvent } from './entities/job.entity';

// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Arbitrary for generating valid UUIDs
const uuidArb = fc.uuid().filter((id) => UUID_V4_REGEX.test(id));

// Arbitrary for generating valid job statuses
const jobStatusArb = fc.constantFrom(
  JobStatus.PENDING,
  JobStatus.PROCESSING,
  JobStatus.COMPLETED,
  JobStatus.FAILED,
);

// Arbitrary for generating valid PDF types
const pdfTypeArb = fc.constantFrom(PdfType.WEEKLY, PdfType.TEST);

// Arbitrary for generating valid date strings (YYYY-MM-DD format)
const dateStringArb = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) =>
        `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      )
    )
  );

// Arbitrary for generating parsed events
const parsedEventArb: fc.Arbitrary<ParsedEvent> = fc.record({
  id: uuidArb,
  module: fc.string({ minLength: 1, maxLength: 10 }),
  activity: fc.constantFrom('Lecture', 'Tutorial', 'Practical'),
  group: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: undefined }),
  day: fc.option(fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), { nil: undefined }),
  date: fc.option(dateStringArb, { nil: undefined }),
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

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: jest.Mocked<Repository<Job>>;

  beforeEach(async () => {
    const mockJobRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jobRepository = module.get(getRepositoryToken(Job));
  });

  /**
   * **Feature: backend-implementation, Property 8: Job Status Retrieval**
   * **Validates: Requirements 3.1**
   *
   * For any valid job ID in the database, requesting `/api/jobs/:id` SHALL return
   * a status that is one of: pending, processing, completed, or failed.
   */
  describe('Property 8: Job Status Retrieval', () => {
    it('should return a valid job status for any existing job', () => {
      return fc.assert(
        fc.asyncProperty(
          uuidArb,
          jobStatusArb,
          pdfTypeArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          async (jobId, status, pdfType, s3Key) => {
            const mockJob: Partial<Job> = {
              id: jobId,
              status,
              pdfType,
              s3Key,
              result: null,
              error: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: null,
            };

            jobRepository.findOne.mockResolvedValue(mockJob as Job);

            const result = await service.getJobById(jobId);

            // Verify the returned status is one of the valid statuses
            const validStatuses = [
              JobStatus.PENDING,
              JobStatus.PROCESSING,
              JobStatus.COMPLETED,
              JobStatus.FAILED,
            ];

            return (
              validStatuses.includes(result.status) &&
              result.id === jobId &&
              result.pdfType === pdfType
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: backend-implementation, Property 9: Non-Existent Job Returns 404**
   * **Validates: Requirements 3.2**
   *
   * For any UUID that does not exist in the jobs table, requesting `/api/jobs/:id`
   * SHALL return a 404 status code with JOB_NOT_FOUND error.
   */
  describe('Property 9: Non-Existent Job Returns 404', () => {
    it('should throw NotFoundException for any non-existent job ID', () => {
      return fc.assert(
        fc.asyncProperty(uuidArb, async (jobId) => {
          // Simulate job not found
          jobRepository.findOne.mockResolvedValue(null);

          try {
            await service.getJobById(jobId);
            return false; // Should have thrown
          } catch (error) {
            if (error instanceof NotFoundException) {
              const response = error.getResponse() as { message: string };
              return response.message === 'JOB_NOT_FOUND';
            }
            return false;
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: backend-implementation, Property 11: Completed Job Results Retrieval**
   * **Validates: Requirements 3.5**
   *
   * For any job with status=completed, requesting `/api/jobs/:id/result` SHALL return
   * the same ParsedEvent array stored in the job record.
   */
  describe('Property 11: Completed Job Results Retrieval', () => {
    it('should return the same parsed events stored in a completed job', () => {
      return fc.assert(
        fc.asyncProperty(
          uuidArb,
          pdfTypeArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(parsedEventArb, { minLength: 0, maxLength: 10 }),
          async (jobId, pdfType, s3Key, events) => {
            const mockJob: Partial<Job> = {
              id: jobId,
              status: JobStatus.COMPLETED,
              pdfType,
              s3Key,
              result: events,
              error: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: new Date(),
            };

            jobRepository.findOne.mockResolvedValue(mockJob as Job);

            const result = await service.getJobById(jobId);

            // Verify the result array matches what was stored
            return (
              result.status === JobStatus.COMPLETED &&
              result.result !== null &&
              result.result.length === events.length &&
              JSON.stringify(result.result) === JSON.stringify(events)
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
