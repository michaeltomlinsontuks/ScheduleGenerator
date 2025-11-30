import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JobsService } from './jobs.service';
import { Job, JobStatus, PdfType, ParsedEvent } from './entities/job.entity';
import { PDF_PROCESSING_QUEUE } from './jobs.module';
import { StorageService } from '../storage/storage.service';

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
const pdfTypeArb = fc.constantFrom(PdfType.LECTURE, PdfType.TEST, PdfType.EXAM);

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
  let cacheManager: any;
  let storageService: any;

  beforeEach(async () => {
    const mockJobRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockStorageService = {
      deleteFile: jest.fn(),
    };

    const mockPdfJobsTotal = {
      inc: jest.fn(),
    };

    const mockPdfProcessingDuration = {
      observe: jest.fn(),
    };

    const mockQueueJobsWaiting = {
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: getQueueToken(PDF_PROCESSING_QUEUE),
          useValue: mockQueue,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: 'PROM_METRIC_PDF_JOBS_TOTAL',
          useValue: mockPdfJobsTotal,
        },
        {
          provide: 'PROM_METRIC_PDF_PROCESSING_DURATION_SECONDS',
          useValue: mockPdfProcessingDuration,
        },
        {
          provide: 'PROM_METRIC_QUEUE_JOBS_WAITING',
          useValue: mockQueueJobsWaiting,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jobRepository = module.get(getRepositoryToken(Job));
    cacheManager = module.get(CACHE_MANAGER);
    storageService = module.get(StorageService);
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

            // Mock cache miss
            cacheManager.get.mockResolvedValue(null);
            jobRepository.findOne.mockResolvedValue(mockJob as Job);
            cacheManager.set.mockResolvedValue(undefined);

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
          // Mock cache miss and job not found
          cacheManager.get.mockResolvedValue(null);
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

            // Mock cache miss
            cacheManager.get.mockResolvedValue(null);
            jobRepository.findOne.mockResolvedValue(mockJob as Job);
            cacheManager.set.mockResolvedValue(undefined);

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

  describe('Time-based file retention', () => {
    describe('updateJobStatus', () => {
      it('should set expiresAt to 24 hours after completion when job completes', async () => {
        const jobId = 'test-job-id';
        const s3Key = 'test-file.pdf';
        const mockJob: Partial<Job> = {
          id: jobId,
          status: JobStatus.PROCESSING,
          pdfType: PdfType.LECTURE,
          s3Key,
          result: null,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          expiresAt: null,
        };

        jobRepository.findOne.mockResolvedValue(mockJob as Job);
        jobRepository.save.mockImplementation(async (job: Job) => job);
        cacheManager.del.mockResolvedValue(undefined);
        cacheManager.set.mockResolvedValue(undefined);

        const result = await service.updateJobStatus(
          jobId,
          JobStatus.COMPLETED,
          [],
        );

        expect(result.expiresAt).toBeDefined();
        expect(result.expiresAt).not.toBeNull();
        
        // Verify expiresAt is approximately 24 hours after completedAt
        const expectedExpiry = new Date(result.completedAt!);
        expectedExpiry.setHours(expectedExpiry.getHours() + 24);
        
        const timeDiff = Math.abs(
          result.expiresAt!.getTime() - expectedExpiry.getTime()
        );
        expect(timeDiff).toBeLessThan(1000); // Within 1 second
      });

      it('should set expiresAt to 24 hours after completion when job fails', async () => {
        const jobId = 'test-job-id';
        const s3Key = 'test-file.pdf';
        const mockJob: Partial<Job> = {
          id: jobId,
          status: JobStatus.PROCESSING,
          pdfType: PdfType.LECTURE,
          s3Key,
          result: null,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          expiresAt: null,
        };

        jobRepository.findOne.mockResolvedValue(mockJob as Job);
        jobRepository.save.mockImplementation(async (job: Job) => job);
        cacheManager.del.mockResolvedValue(undefined);
        cacheManager.set.mockResolvedValue(undefined);

        const result = await service.updateJobStatus(
          jobId,
          JobStatus.FAILED,
          undefined,
          'Test error',
        );

        expect(result.expiresAt).toBeDefined();
        expect(result.expiresAt).not.toBeNull();
        
        // Verify expiresAt is approximately 24 hours after completedAt
        const expectedExpiry = new Date(result.completedAt!);
        expectedExpiry.setHours(expectedExpiry.getHours() + 24);
        
        const timeDiff = Math.abs(
          result.expiresAt!.getTime() - expectedExpiry.getTime()
        );
        expect(timeDiff).toBeLessThan(1000); // Within 1 second
      });
    });

    describe('cleanupExpiredJobs', () => {
      it('should delete expired jobs and their files', async () => {
        const now = new Date();
        const expiredDate = new Date(now.getTime() - 1000); // 1 second ago
        
        const expiredJobs: Partial<Job>[] = [
          {
            id: 'expired-job-1',
            status: JobStatus.COMPLETED,
            pdfType: PdfType.LECTURE,
            s3Key: 'expired-file-1.pdf',
            result: [],
            error: null,
            createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25 hours ago
            completedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
            expiresAt: expiredDate,
          },
          {
            id: 'expired-job-2',
            status: JobStatus.FAILED,
            pdfType: PdfType.TEST,
            s3Key: 'expired-file-2.pdf',
            result: null,
            error: 'Test error',
            createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), // 26 hours ago
            completedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
            expiresAt: expiredDate,
          },
        ];

        jobRepository.find.mockResolvedValue(expiredJobs as Job[]);
        storageService.deleteFile.mockResolvedValue(undefined);
        cacheManager.del.mockResolvedValue(undefined);
        jobRepository.remove.mockResolvedValue(undefined);

        await service.cleanupExpiredJobs();

        // Verify storage files were deleted
        expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
        expect(storageService.deleteFile).toHaveBeenCalledWith('expired-file-1.pdf');
        expect(storageService.deleteFile).toHaveBeenCalledWith('expired-file-2.pdf');

        // Verify cache was invalidated
        expect(cacheManager.del).toHaveBeenCalledTimes(2);

        // Verify jobs were removed from database
        expect(jobRepository.remove).toHaveBeenCalledTimes(2);
      });

      it('should handle no expired jobs gracefully', async () => {
        jobRepository.find.mockResolvedValue([]);

        await service.cleanupExpiredJobs();

        expect(storageService.deleteFile).not.toHaveBeenCalled();
        expect(jobRepository.remove).not.toHaveBeenCalled();
      });

      it('should continue cleanup even if individual job deletion fails', async () => {
        const now = new Date();
        const expiredDate = new Date(now.getTime() - 1000);
        
        const expiredJobs: Partial<Job>[] = [
          {
            id: 'expired-job-1',
            status: JobStatus.COMPLETED,
            pdfType: PdfType.LECTURE,
            s3Key: 'expired-file-1.pdf',
            result: [],
            error: null,
            createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
            expiresAt: expiredDate,
          },
          {
            id: 'expired-job-2',
            status: JobStatus.COMPLETED,
            pdfType: PdfType.TEST,
            s3Key: 'expired-file-2.pdf',
            result: [],
            error: null,
            createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
            expiresAt: expiredDate,
          },
        ];

        jobRepository.find.mockResolvedValue(expiredJobs as Job[]);
        
        // First deletion fails, second succeeds
        storageService.deleteFile
          .mockRejectedValueOnce(new Error('Storage error'))
          .mockResolvedValueOnce(undefined);
        
        cacheManager.del.mockResolvedValue(undefined);
        jobRepository.remove.mockResolvedValue(undefined);

        await service.cleanupExpiredJobs();

        // Verify both deletions were attempted
        expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
        
        // Verify second job was still processed despite first failure
        expect(storageService.deleteFile).toHaveBeenCalledWith('expired-file-2.pdf');
      });
    });
  });
});
