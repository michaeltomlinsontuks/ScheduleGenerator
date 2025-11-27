import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { UploadService } from './upload.service';
import { Job, JobStatus, PdfType } from '../jobs/entities/job.entity';
import { StorageService } from '../storage/storage.service';
import { MulterFile } from '../common/pipes/file-validation.pipe';
import { PDF_PROCESSING_QUEUE } from '../jobs/jobs.module';

// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('UploadService', () => {
  let service: UploadService;
  let jobRepository: jest.Mocked<Repository<Job>>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const mockJobRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getQueueToken(PDF_PROCESSING_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jobRepository = module.get(getRepositoryToken(Job));
    storageService = module.get(StorageService);
  });

  /**
   * **Feature: backend-implementation, Property 7: Valid Upload Returns Job ID**
   * **Validates: Requirements 2.5**
   *
   * For any valid UP schedule PDF upload, the Backend SHALL return a response
   * containing a valid UUID job ID.
   */
  describe('Property 7: Valid Upload Returns Job ID', () => {
    it('should return a valid UUID job ID for any valid weekly schedule upload', () => {
      return fc.assert(
        fc.asyncProperty(
          // Generate random file names
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0),
          async (filename) => {
            // Create a valid weekly schedule PDF content
            const content = `Some PDF content with Lectures keyword`;
            const buffer = Buffer.from(content, 'utf-8');

            const file: MulterFile = {
              fieldname: 'file',
              originalname: `${filename}.pdf`,
              encoding: '7bit',
              mimetype: 'application/pdf',
              size: buffer.length,
              buffer,
            };

            // Mock the job creation and save
            const mockJobId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
            const mockJob: Partial<Job> = {
              id: mockJobId,
              status: JobStatus.PENDING,
              pdfType: PdfType.WEEKLY,
              s3Key: 'test-key',
            };

            jobRepository.create.mockReturnValue(mockJob as Job);
            jobRepository.save.mockResolvedValue(mockJob as Job);
            storageService.uploadFile.mockResolvedValue(undefined);

            const result = await service.processUpload(file);

            // Verify the response contains a valid UUID
            return (
              UUID_V4_REGEX.test(result.jobId) &&
              result.pdfType === PdfType.WEEKLY &&
              typeof result.message === 'string' &&
              result.message.length > 0
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should return a valid UUID job ID for any valid test schedule upload', () => {
      return fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0),
          async (filename) => {
            // Create a valid test schedule PDF content
            const content = `Some PDF content with Semester Tests keyword`;
            const buffer = Buffer.from(content, 'utf-8');

            const file: MulterFile = {
              fieldname: 'file',
              originalname: `${filename}.pdf`,
              encoding: '7bit',
              mimetype: 'application/pdf',
              size: buffer.length,
              buffer,
            };

            const mockJobId = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
            const mockJob: Partial<Job> = {
              id: mockJobId,
              status: JobStatus.PENDING,
              pdfType: PdfType.TEST,
              s3Key: 'test-key',
            };

            jobRepository.create.mockReturnValue(mockJob as Job);
            jobRepository.save.mockResolvedValue(mockJob as Job);
            storageService.uploadFile.mockResolvedValue(undefined);

            const result = await service.processUpload(file);

            return (
              UUID_V4_REGEX.test(result.jobId) &&
              result.pdfType === PdfType.TEST &&
              typeof result.message === 'string' &&
              result.message.length > 0
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should store file in MinIO and create job record for any valid upload', () => {
      return fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0),
          fc.constantFrom('Lectures', 'Semester Tests'),
          async (filename, keyword) => {
            // Reset mocks before each iteration
            jest.clearAllMocks();

            const content = `PDF content with ${keyword}`;
            const buffer = Buffer.from(content, 'utf-8');

            const file: MulterFile = {
              fieldname: 'file',
              originalname: `${filename}.pdf`,
              encoding: '7bit',
              mimetype: 'application/pdf',
              size: buffer.length,
              buffer,
            };

            const expectedPdfType =
              keyword === 'Semester Tests' ? PdfType.TEST : PdfType.WEEKLY;
            const mockJobId = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
            const mockJob: Partial<Job> = {
              id: mockJobId,
              status: JobStatus.PENDING,
              pdfType: expectedPdfType,
              s3Key: 'test-key',
            };

            jobRepository.create.mockReturnValue(mockJob as Job);
            jobRepository.save.mockResolvedValue(mockJob as Job);
            storageService.uploadFile.mockResolvedValue(undefined);

            await service.processUpload(file);

            // Verify storage was called exactly once
            const uploadCalled = storageService.uploadFile.mock.calls.length === 1;
            // Verify job was created with correct status
            const createCalled = jobRepository.create.mock.calls.length === 1;
            const createArgs = jobRepository.create.mock.calls[0][0] as Partial<Job>;

            return (
              uploadCalled &&
              createCalled &&
              createArgs.status === JobStatus.PENDING &&
              createArgs.pdfType === expectedPdfType
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
