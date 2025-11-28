import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus, PdfType, ParsedEvent } from './entities/job.entity.js';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Create a new job record
   * @param s3Key - The S3/MinIO key where the PDF is stored
   * @param pdfType - The type of PDF (lecture, test, or exam)
   * @returns The created job
   */
  async createJob(s3Key: string, pdfType: PdfType): Promise<Job> {
    const job = this.jobRepository.create({
      status: JobStatus.PENDING,
      pdfType,
      s3Key,
      result: null,
      error: null,
    });

    return this.jobRepository.save(job);
  }

  /**
   * Get a job by its ID
   * @param id - The job UUID
   * @returns The job if found
   * @throws NotFoundException if job doesn't exist
   */
  async getJobById(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'JOB_NOT_FOUND',
        error: `Job with ID ${id} not found`,
      });
    }

    return job;
  }

  /**
   * Update job status and optionally set result or error
   * @param id - The job UUID
   * @param status - The new status
   * @param result - Optional parsed events array (for completed jobs)
   * @param error - Optional error message (for failed jobs)
   * @returns The updated job
   */
  async updateJobStatus(
    id: string,
    status: JobStatus,
    result?: ParsedEvent[],
    error?: string,
  ): Promise<Job> {
    const job = await this.getJobById(id);

    job.status = status;

    if (result !== undefined) {
      job.result = result;
    }

    if (error !== undefined) {
      job.error = error;
    }

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
    }

    return this.jobRepository.save(job);
  }
}
