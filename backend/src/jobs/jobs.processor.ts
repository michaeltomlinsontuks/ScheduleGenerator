import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Injectable, Inject, Optional } from '@nestjs/common';
import { Job as BullJob } from 'bullmq';
import { JobsService } from './jobs.service.js';
import { StorageService } from '../storage/storage.service.js';
import { JobStatus, PdfType, ParsedEvent } from './entities/job.entity.js';
// Queue name constant defined in jobs.module.ts

export interface PdfJobData {
  jobId: string;
  s3Key: string;
  pdfType: PdfType;
}

/**
 * Interface for the parser service that will be implemented in task 6
 */
export interface IParserService {
  parsePdf(pdfBuffer: Buffer, pdfType: PdfType): Promise<ParsedEvent[]>;
}

export const PARSER_SERVICE = 'PARSER_SERVICE';

@Injectable()
@Processor('pdf-processing')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly storageService: StorageService,
    @Optional() @Inject(PARSER_SERVICE) private readonly parserService?: IParserService,
  ) {
    super();
  }

  async process(job: BullJob<PdfJobData>): Promise<ParsedEvent[]> {
    const { jobId, s3Key, pdfType } = job.data;
    this.logger.log(`Processing job ${jobId} with s3Key ${s3Key}`);

    try {
      // Update job status to processing
      await this.jobsService.updateJobStatus(jobId, JobStatus.PROCESSING);

      // Download PDF from MinIO
      this.logger.log(`Downloading PDF from MinIO: ${s3Key}`);
      const pdfBuffer = await this.storageService.downloadFile(s3Key);

      // Call parser service
      let parsedEvents: ParsedEvent[];
      
      if (this.parserService) {
        this.logger.log(`Parsing PDF with type: ${pdfType}`);
        parsedEvents = await this.parserService.parsePdf(pdfBuffer, pdfType);
      } else {
        // Parser service not yet implemented - return empty array
        // This will be replaced when ParserModule is implemented in task 6
        this.logger.warn('Parser service not available, returning empty results');
        parsedEvents = [];
      }

      // Update job status to completed with results
      await this.jobsService.updateJobStatus(
        jobId,
        JobStatus.COMPLETED,
        parsedEvents,
      );

      this.logger.log(`Job ${jobId} completed successfully with ${parsedEvents.length} events`);

      // Delete PDF from MinIO after successful processing
      await this.cleanupPdf(s3Key);

      return parsedEvents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${jobId} failed: ${errorMessage}`);

      // Update job status to failed with error message
      await this.jobsService.updateJobStatus(
        jobId,
        JobStatus.FAILED,
        undefined,
        errorMessage,
      );

      // Delete PDF from MinIO even on failure
      await this.cleanupPdf(s3Key);

      throw error;
    }
  }

  private async cleanupPdf(s3Key: string): Promise<void> {
    try {
      this.logger.log(`Cleaning up PDF from MinIO: ${s3Key}`);
      await this.storageService.deleteFile(s3Key);
    } catch (error) {
      // Log but don't throw - cleanup failure shouldn't fail the job
      this.logger.warn(`Failed to cleanup PDF ${s3Key}: ${error}`);
    }
  }
}
