import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus, PdfType } from '../jobs/entities/job.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { StorageService } from '../storage/storage.service.js';
import { validatePdfContent } from '../common/validators/pdf-content.validator.js';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { MulterFile } from '../common/pipes/file-validation.pipe.js';
import { PDF_PROCESSING_QUEUE } from '../jobs/jobs.module.js';
import { PdfJobData } from '../jobs/jobs.processor.js';
import { StorageQuotaExceededException } from './exceptions/storage-quota-exceeded.exception.js';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    @InjectQueue(PDF_PROCESSING_QUEUE)
    private readonly pdfProcessingQueue: Queue<PdfJobData>,
  ) {}

  /**
   * Process an uploaded PDF file:
   * 1. Check user storage quota (if user is authenticated)
   * 2. Validate PDF content to determine type (lecture/test/exam)
   * 3. Upload to MinIO storage
   * 4. Create job record in database
   * 5. Update user storage usage
   * 6. Queue job for processing
   * 7. Return job ID for status tracking
   *
   * @param file - The uploaded PDF file
   * @param userId - Optional user ID for quota tracking
   * @returns UploadResponseDto with job ID and PDF type
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
    // Validate PDF content and determine type (async operation)
    let pdfType: PdfType;
    try {
      pdfType = await validatePdfContent(file.buffer);
    } catch (error) {
      // Convert validation errors to BadRequestException (400 status)
      const message =
        error instanceof Error ? error.message : 'PDF validation failed';
      throw new BadRequestException(message);
    }

    // Generate unique S3 key for storage
    const s3Key = `${uuidv4()}-${file.originalname}`;

    // Upload file to MinIO
    await this.storageService.uploadFile(s3Key, file.buffer, file.mimetype);

    // Create job record with detected PDF type and user association
    const job = this.jobRepository.create({
      status: JobStatus.PENDING,
      pdfType,
      s3Key,
      result: null,
      error: null,
      fileSizeBytes: fileSize,
      userId: userId ?? null,
    });

    const savedJob = await this.jobRepository.save(job);

    // Update user storage usage if authenticated
    if (userId) {
      await this.userRepository.increment(
        { id: userId },
        'storageUsedBytes',
        fileSize,
      );
    }

    // Queue job for processing with BullMQ, passing detected pdfType
    await this.pdfProcessingQueue.add('process-pdf', {
      jobId: savedJob.id,
      s3Key,
      pdfType, // Ensure pdfType is correctly passed to job queue
    });

    return {
      jobId: savedJob.id,
      pdfType: savedJob.pdfType,
      message: 'PDF uploaded successfully and queued for processing',
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
