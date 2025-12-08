import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PdfType, ParsedEvent } from '../common/types.js';
import { ParserService } from '../parser/parser.service.js';
import { validatePdfContent } from '../common/validators/pdf-content.validator.js';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { MulterFile } from '../common/pipes/file-validation.pipe.js';
import { StorageQuotaExceededException } from './exceptions/storage-quota-exceeded.exception.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit per file

  constructor(
    private readonly parserService: ParserService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Process an uploaded PDF file synchronously:
   * 1. Check file size limit
   * 2. Validate PDF content to determine type (lecture/test/exam)
   * 3. Call parser service to extract events
   * 4. Return job ID (random UUID), events, and PDF type immediately
   *
   * @param file - The uploaded PDF file
   * @param userId - Optional user ID (unused in stateless mode)
   * @returns UploadResponseDto with job ID, events, and PDF type
   * @throws BadRequestException if PDF validation fails
   * @throws StorageQuotaExceededException if file is too large
   */
  async processUpload(
    file: MulterFile,
    _userId?: string,
  ): Promise<UploadResponseDto> {
    const fileSize = file.buffer.length;

    // Check simple file size limit instead of database quota
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new StorageQuotaExceededException(
        fileSize,
        this.MAX_FILE_SIZE,
        fileSize,
      );
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

    // Generate random Job ID for frontend compatibility
    // In stateless mode, this ID is local to this request/response cycle
    const jobId = uuidv4();

    this.logger.log({
      message: 'Processing PDF synchronously (Stateless)',
      jobId,
      pdfType,
      fileSize,
    });

    // Parse PDF synchronously
    let parsedEvents: ParsedEvent[];
    let detectedSemesterDates: { semester: 'S1' | 'S2' | null; startDate: string | null; endDate: string | null } = {
      semester: null,
      startDate: null,
      endDate: null,
    };

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

        // If filtering removed ALL events, but we had events initially, it likely means
        // the user uploaded a file for a different semester (e.g. S2 file during S1).
        // In this case, we should return the events as-is and detect their semester.
        if (filteredEvents.length === 0 && parsedEvents.length > 0) {
          this.logger.warn({
            message: 'Semester filtering resulted in 0 events. Reverting to original events.',
            detectedSemester: semesterInfo.name,
            originalCount: parsedEvents.length,
          });
          filteredEvents = parsedEvents;

          // Detect the actual semester from the events
          const eventSemesters = new Set(parsedEvents.map(e => e.semester).filter(s => s && s !== 'Y'));
          if (eventSemesters.size === 1) {
            const actualSemester = eventSemesters.values().next().value as 'S1' | 'S2';
            const actualSemesterInfo = this.getSemesterDates(actualSemester);
            if (actualSemesterInfo) {
              detectedSemesterDates = {
                semester: actualSemester,
                startDate: actualSemesterInfo.start,
                endDate: actualSemesterInfo.end,
              };
            }
          }
        } else {
          // Events matched current semester, use those dates
          detectedSemesterDates = {
            semester: semesterInfo.name as 'S1' | 'S2',
            startDate: semesterInfo.start,
            endDate: semesterInfo.end,
          };
        }

        this.logger.log({
          message: 'Filtered events by semester',
          semester: semesterInfo.name,
          detectedSemester: detectedSemesterDates.semester,
          originalCount: parsedEvents.length,
          filteredCount: filteredEvents.length,
        });
      }

      this.logger.log({
        message: 'PDF processed successfully',
        jobId,
        eventCount: filteredEvents.length,
      });

      parsedEvents = filteredEvents; // Use filtered events for response
    } catch (error) {
      this.logger.error({
        message: 'PDF processing failed',
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new BadRequestException(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      jobId,
      pdfType,
      status: 'completed',
      events: parsedEvents,
      message: 'PDF processed successfully',
      semesterDates: detectedSemesterDates.semester ? detectedSemesterDates : undefined,
    };
  }

  /**
   * Release storage quota when a job is deleted
   * Deprecated: In stateless mode, no storage is used.
   */
  async releaseStorageForJob(_jobId: string): Promise<void> {
    // No-op in stateless mode
    return;
  }

  /**
   * Get storage usage for a user
   * Deprecated: Returns dummy values for stateless mode
   */
  async getStorageUsage(_userId: string): Promise<{
    usedBytes: number;
    quotaBytes: number;
    usedPercentage: number;
    availableBytes: number;
  } | null> {
    // Return dummy values indicating empty storage
    return {
      usedBytes: 0,
      quotaBytes: this.MAX_FILE_SIZE, // Show max file size as quota
      usedPercentage: 0,
      availableBytes: this.MAX_FILE_SIZE,
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

  /**
   * Get the start and end dates for a specific semester
   */
  private getSemesterDates(semester: 'S1' | 'S2'): { start: string; end: string } | null {
    const s1Start = this.configService.get<string>('FIRST_SEMESTER_START');
    const s1End = this.configService.get<string>('FIRST_SEMESTER_END');
    const s2Start = this.configService.get<string>('SECOND_SEMESTER_START');
    const s2End = this.configService.get<string>('SECOND_SEMESTER_END');

    if (semester === 'S1' && s1Start && s1End) {
      return { start: s1Start, end: s1End };
    }
    if (semester === 'S2' && s2Start && s2End) {
      return { start: s2Start, end: s2End };
    }
    return null;
  }
}
