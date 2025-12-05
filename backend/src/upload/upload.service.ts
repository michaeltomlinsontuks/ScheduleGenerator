import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus, PdfType, ParsedEvent } from '../jobs/entities/job.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { ParserService } from '../parser/parser.service.js';
import { validatePdfContent } from '../common/validators/pdf-content.validator.js';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { MulterFile } from '../common/pipes/file-validation.pipe.js';
import { StorageQuotaExceededException } from './exceptions/storage-quota-exceeded.exception.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly parserService: ParserService,
  ) { }

  /**
   * Process an uploaded PDF file synchronously:
   * 1. Check user storage quota (if user is authenticated)
   * 2. Validate PDF content to determine type (lecture/test/exam)
   * 3. Call parser service to extract events
   * 4. Create job record in database with results
   * 5. Return job ID, events, and PDF type immediately
   *
   * @param file - The uploaded PDF file
   * @param userId - Optional user ID for quota tracking
   * @returns UploadResponseDto with job ID, events, and PDF type
   * @throws BadRequestException if PDF validation fails
   * @throws StorageQuotaExceededException if user quota is exceeded
   */
  async processUpload(
    file: MulterFile,
    userId?: string,
  ): Promise<UploadResponseDto> {
    const fileSize = file.buffer.length;

    // Check storage quota if user is authenticated
    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (user) {
        const wouldExceed =
          user.storageUsedBytes + fileSize > user.storageQuotaBytes;

        if (wouldExceed) {
          throw new StorageQuotaExceededException(
            user.storageUsedBytes,
            user.storageQuotaBytes,
            fileSize,
          );
        }
      }
    }

    // Validate PDF content and determine type
    let pdfType: PdfType;
    try {
      pdfType = await validatePdfContent(file.buffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PDF validation failed';
      throw new BadRequestException(message);
    }

    // Generate unique S3 key for storage (used for cleanup tracking)
    const s3Key = `${uuidv4()}-${file.originalname}`;

    // Create job record with pending status
    const job = this.jobRepository.create({
      status: JobStatus.PROCESSING,
      pdfType,
      s3Key,
      result: null,
      error: null,
      fileSizeBytes: fileSize,
      userId: userId ?? null,
    });
    const savedJob = await this.jobRepository.save(job);

    this.logger.log({
      message: 'Processing PDF synchronously',
      jobId: savedJob.id,
      pdfType,
      fileSize,
    });

    // Parse PDF synchronously
    let parsedEvents: ParsedEvent[];
    try {
      parsedEvents = await this.parserService.parsePdf(file.buffer, pdfType);

      // Update job with completed status and results
      savedJob.status = JobStatus.COMPLETED;
      savedJob.result = parsedEvents;
      savedJob.completedAt = new Date();

      // Set expiration to 24 hours after completion
      const expiresAt = new Date(savedJob.completedAt);
      expiresAt.setHours(expiresAt.getHours() + 24);
      savedJob.expiresAt = expiresAt;

      await this.jobRepository.save(savedJob);

      this.logger.log({
        message: 'PDF processed successfully',
        jobId: savedJob.id,
        eventCount: parsedEvents.length,
      });
    } catch (error) {
      // Update job with failed status
      savedJob.status = JobStatus.FAILED;
      savedJob.error = error instanceof Error ? error.message : 'Unknown error';
      savedJob.completedAt = new Date();
      await this.jobRepository.save(savedJob);

      this.logger.error({
        message: 'PDF processing failed',
        jobId: savedJob.id,
        error: savedJob.error,
      });

      throw new BadRequestException(`Failed to parse PDF: ${savedJob.error}`);
    }

    // Update user storage usage if authenticated
    if (userId) {
      await this.userRepository.increment(
        { id: userId },
        'storageUsedBytes',
        fileSize,
      );
    }

    return {
      jobId: savedJob.id,
      pdfType: savedJob.pdfType,
      status: 'completed',
      events: parsedEvents,
      message: 'PDF processed successfully',
    };
  }

  /**
   * Release storage quota when a job is deleted
   * @param jobId - The job ID to release storage for
   */
  async releaseStorageForJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['user'],
    });

    if (job && job.userId && job.fileSizeBytes > 0) {
      await this.userRepository.decrement(
        { id: job.userId },
        'storageUsedBytes',
        job.fileSizeBytes,
      );
    }
  }

  /**
   * Get storage usage for a user
   * @param userId - The user ID
   * @returns Storage usage information
   */
  async getStorageUsage(userId: string): Promise<{
    usedBytes: number;
    quotaBytes: number;
    usedPercentage: number;
    availableBytes: number;
  } | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      usedBytes: user.storageUsedBytes,
      quotaBytes: user.storageQuotaBytes,
      usedPercentage: Math.round(
        (user.storageUsedBytes / user.storageQuotaBytes) * 100,
      ),
      availableBytes: user.storageQuotaBytes - user.storageUsedBytes,
    };
  }
}
