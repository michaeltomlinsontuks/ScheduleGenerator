import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
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

      // Filter events based on current semester for lecture modes
      // Tests and exams are usually not semester-specific, but we filter them too
      const semesterInfo = this.getCurrentSemesterInfo();
      let filteredEvents = parsedEvents;

      if (semesterInfo) {
        filteredEvents = parsedEvents.filter(event => {
          if (!event.semester) return true; // Keep events with no semester info
          // Keep Year modules ('Y') or matching semester (e.g. 'S1' matches 'S1')
          return event.semester === 'Y' || event.semester === semesterInfo.name;
        });

        // FIX: If filtering removed ALL events, but we had events initially, it likely means
        // the user uploaded a file for a different semester (e.g. S2 file during S1).
        // In this case, we should return the events as-is rather than an empty list.
        if (filteredEvents.length === 0 && parsedEvents.length > 0) {
          this.logger.warn({
            message: 'Semester filtering resulted in 0 events. Reverting to original events.',
            detectedSemester: semesterInfo.name,
            originalCount: parsedEvents.length,
          });
          filteredEvents = parsedEvents;
        }

        this.logger.log({
          message: 'Filtered events by semester',
          semester: semesterInfo.name,
          originalCount: parsedEvents.length,
          filteredCount: filteredEvents.length,
        });
      }

      // Update job with completed status and results
      savedJob.status = JobStatus.COMPLETED;
      savedJob.result = filteredEvents;
      savedJob.completedAt = new Date();

      // Set expiration to 24 hours after completion
      const expiresAt = new Date(savedJob.completedAt);
      expiresAt.setHours(expiresAt.getHours() + 24);
      savedJob.expiresAt = expiresAt;

      await this.jobRepository.save(savedJob);

      this.logger.log({
        message: 'PDF processed successfully',
        jobId: savedJob.id,
        eventCount: filteredEvents.length,
      });

      parsedEvents = filteredEvents; // Use filtered events for response
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

  /**
   * Determine current semester based on today's date and env vars
   * Returns the semester name and date range, or null if not configured
   */
  private getCurrentSemesterInfo(): { name: string; start: string; end: string } | null {
    const now = new Date();
    const s1Start = this.configService.get<string>('FIRST_SEMESTER_START');
    const s1End = this.configService.get<string>('FIRST_SEMESTER_END');
    const s2Start = this.configService.get<string>('SECOND_SEMESTER_START');
    const s2End = this.configService.get<string>('SECOND_SEMESTER_END');

    if (!s1Start || !s1End || !s2Start || !s2End) {
      return null;
    }

    const dS1Start = new Date(s1Start);
    const dS1End = new Date(s1End);
    const dS2Start = new Date(s2Start);
    const dS2End = new Date(s2End);

    // 1. If we are currently IN a semester, return it
    if (now >= dS1Start && now <= dS1End) {
      return { name: 'S1', start: s1Start, end: s1End };
    }
    if (now >= dS2Start && now <= dS2End) {
      return { name: 'S2', start: s2Start, end: s2End };
    }

    // 2. If we are in a break, return the NEXT semester

    // Before S1 starts -> S1 is next
    if (now < dS1Start) {
      return { name: 'S1', start: s1Start, end: s1End };
    }

    // Between S1 end and S2 start -> S2 is next
    if (now > dS1End && now < dS2Start) {
      return { name: 'S2', start: s2Start, end: s2End };
    }

    // After S2 ends -> next year's S1 (using current year's dates)
    // Note: Ideally, env vars should be updated for the new year
    if (now > dS2End) {
      return { name: 'S1', start: s1Start, end: s1End };
    }

    return null;
  }
}
