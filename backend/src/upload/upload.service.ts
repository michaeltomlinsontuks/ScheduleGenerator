import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus, PdfType } from '../jobs/entities/job.entity.js';
import { StorageService } from '../storage/storage.service.js';
import { validatePdfContent } from '../common/validators/pdf-content.validator.js';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { MulterFile } from '../common/pipes/file-validation.pipe.js';
import { PDF_PROCESSING_QUEUE } from '../jobs/jobs.module.js';
import { PdfJobData } from '../jobs/jobs.processor.js';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly storageService: StorageService,
    @InjectQueue(PDF_PROCESSING_QUEUE)
    private readonly pdfProcessingQueue: Queue<PdfJobData>,
  ) {}

  /**
   * Process an uploaded PDF file:
   * 1. Validate PDF content to determine type (lecture/test/exam)
   * 2. Upload to MinIO storage
   * 3. Create job record in database
   * 4. Queue job for processing
   * 5. Return job ID for status tracking
   *
   * @param file - The uploaded PDF file
   * @returns UploadResponseDto with job ID and PDF type
   * @throws BadRequestException if PDF validation fails
   */
  async processUpload(file: MulterFile): Promise<UploadResponseDto> {
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

    // Create job record with detected PDF type
    const job = this.jobRepository.create({
      status: JobStatus.PENDING,
      pdfType,
      s3Key,
      result: null,
      error: null,
    });

    const savedJob = await this.jobRepository.save(job);

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
}
