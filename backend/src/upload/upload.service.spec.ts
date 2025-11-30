import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { UploadService } from './upload.service';
import { Job, JobStatus, PdfType } from '../jobs/entities/job.entity';
import { User } from '../auth/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { MulterFile } from '../common/pipes/file-validation.pipe';
import { PDF_PROCESSING_QUEUE } from '../jobs/jobs.module';
import { StorageQuotaExceededException } from './exceptions/storage-quota-exceeded.exception';
import * as validator from '../common/validators/pdf-content.validator';

// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mock the validator module
jest.mock('../common/validators/pdf-content.validator');

describe('UploadService', () => {
  let service: UploadService;
  let jobRepository: jest.Mocked<Repository<Job>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const mockJobRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
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
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
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
    userRepository = module.get(getRepositoryToken(User));
    storageService = module.get(StorageService);

    // Reset mocks
    jest.clearAllMocks();
  });

  /**
   * **Feature: backend-implementation, Property 7: Valid Upload Returns Job ID**
   * **Validates: Requirements 2.5**
   *
   * For any valid UP schedule PDF upload, the Backend SHALL return a response
   * containing a valid UUID job ID.
   */
  describe('Property 7: Valid Upload Returns Job ID', () => {
    it('should return a valid UUID job ID for any valid lecture schedule upload', () => {
      return fc.assert(
        fc.asyncProperty(
          // Generate random file names
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length > 0),
          async (filename) => {
            // Mock the validator to return LECTURE
            jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.LECTURE);

            // Create a valid lecture schedule PDF content with magic bytes
            const content = `Some PDF content with Lectures keyword`;
            const buffer = Buffer.concat([
              Buffer.from('%PDF-1.4\n'),
              Buffer.from(content, 'utf-8'),
            ]);

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
              pdfType: PdfType.LECTURE,
              s3Key: 'test-key',
            };

            jobRepository.create.mockReturnValue(mockJob as Job);
            jobRepository.save.mockResolvedValue(mockJob as Job);
            storageService.uploadFile.mockResolvedValue(undefined);

            const result = await service.processUpload(file);

            // Verify the response contains a valid UUID
            return (
              UUID_V4_REGEX.test(result.jobId) &&
              result.pdfType === PdfType.LECTURE &&
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
            // Mock the validator to return TEST
            jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.TEST);

            // Create a valid test schedule PDF content with magic bytes
            const content = `Some PDF content with Semester Tests keyword`;
            const buffer = Buffer.concat([
              Buffer.from('%PDF-1.4\n'),
              Buffer.from(content, 'utf-8'),
            ]);

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
          fc.string(),
          async (filename, content) => {
            // Reset mocks before each iteration
            jest.clearAllMocks();

            // Mock the validator to return LECTURE
            jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.LECTURE);

            const buffer = Buffer.concat([
              Buffer.from('%PDF-1.4\n'),
              Buffer.from(content, 'utf-8'),
            ]);

            const file: MulterFile = {
              fieldname: 'file',
              originalname: `${filename}.pdf`,
              encoding: '7bit',
              mimetype: 'application/pdf',
              size: buffer.length,
              buffer,
            };

            // Validator now detects type based on content
            const mockJobId = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
            const mockJob: Partial<Job> = {
              id: mockJobId,
              status: JobStatus.PENDING,
              pdfType: PdfType.LECTURE,
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
              createArgs.pdfType === PdfType.LECTURE
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Storage Quota Enforcement', () => {
    it('should reject upload when user quota is exceeded', async () => {
      // Create a large file that will exceed quota
      const largeBuffer = Buffer.alloc(5000000); // 5MB file
      const buffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        largeBuffer,
      ]);

      const file: MulterFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      };

      const userId = 'user-123';
      const mockUser: Partial<User> = {
        id: userId,
        email: 'test@example.com',
        storageUsedBytes: 50000000, // 50MB used
        storageQuotaBytes: 52428800, // 50MB quota (5MB file would exceed)
      };

      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(service.processUpload(file, userId)).rejects.toThrow(
        StorageQuotaExceededException,
      );

      // Verify that storage and job creation were never called
      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(jobRepository.save).not.toHaveBeenCalled();
    });

    it('should allow upload when user has sufficient quota', async () => {
      // Mock the validator to return LECTURE
      jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.LECTURE);

      const buffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('Some PDF content with Lectures keyword', 'utf-8'),
      ]);

      const file: MulterFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      };

      const userId = 'user-123';
      const mockUser: Partial<User> = {
        id: userId,
        email: 'test@example.com',
        storageUsedBytes: 1000000, // 1MB used
        storageQuotaBytes: 52428800, // 50MB quota
      };

      const mockJobId = 'job-123';
      const mockJob: Partial<Job> = {
        id: mockJobId,
        status: JobStatus.PENDING,
        pdfType: PdfType.LECTURE,
        s3Key: 'test-key',
        fileSizeBytes: buffer.length,
        userId,
      };

      userRepository.findOne.mockResolvedValue(mockUser as User);
      jobRepository.create.mockReturnValue(mockJob as Job);
      jobRepository.save.mockResolvedValue(mockJob as Job);
      storageService.uploadFile.mockResolvedValue(undefined);
      userRepository.increment.mockResolvedValue(undefined as any);

      const result = await service.processUpload(file, userId);

      expect(result.jobId).toBe(mockJobId);
      expect(userRepository.increment).toHaveBeenCalledWith(
        { id: userId },
        'storageUsedBytes',
        buffer.length,
      );
    });

    it('should allow upload for unauthenticated users (no quota check)', async () => {
      // Mock the validator to return LECTURE
      jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.LECTURE);

      const buffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('Some PDF content with Lectures keyword', 'utf-8'),
      ]);

      const file: MulterFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      };

      const mockJobId = 'job-123';
      const mockJob: Partial<Job> = {
        id: mockJobId,
        status: JobStatus.PENDING,
        pdfType: PdfType.LECTURE,
        s3Key: 'test-key',
        fileSizeBytes: buffer.length,
        userId: null,
      };

      jobRepository.create.mockReturnValue(mockJob as Job);
      jobRepository.save.mockResolvedValue(mockJob as Job);
      storageService.uploadFile.mockResolvedValue(undefined);

      const result = await service.processUpload(file);

      expect(result.jobId).toBe(mockJobId);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.increment).not.toHaveBeenCalled();
    });

    it('should return correct storage usage for a user', async () => {
      const userId = 'user-123';
      const mockUser: Partial<User> = {
        id: userId,
        email: 'test@example.com',
        storageUsedBytes: 26214400, // 25MB used
        storageQuotaBytes: 52428800, // 50MB quota
      };

      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.getStorageUsage(userId);

      expect(result).toEqual({
        usedBytes: 26214400,
        quotaBytes: 52428800,
        usedPercentage: 50,
        availableBytes: 26214400,
      });
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent';
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.getStorageUsage(userId);

      expect(result).toBeNull();
    });
  });
});
