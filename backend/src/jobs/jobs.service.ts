import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { Queue } from 'bullmq';
import { Repository, LessThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Cache } from 'cache-manager';
import { Job, JobStatus, PdfType, ParsedEvent } from './entities/job.entity.js';
import { PDF_PROCESSING_QUEUE } from './jobs.module.js';
import { StorageService } from '../storage/storage.service.js';

export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1, // Lower number = higher priority
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectQueue('pdf-processing')
    private readonly pdfQueue: Queue,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectMetric('pdf_jobs_total')
    private readonly pdfJobsTotal: Counter<string>,
    @InjectMetric('pdf_processing_duration_seconds')
    private readonly pdfProcessingDuration: Histogram<string>,
    @InjectMetric('queue_jobs_waiting')
    private readonly queueJobsWaiting: Gauge<string>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get cache key for a job
   * @param jobId - The job UUID
   * @returns Cache key string
   */
  private getCacheKey(jobId: string): string {
    return `job:${jobId}`;
  }

  /**
   * Get TTL based on job status
   * Completed/failed jobs: 1 hour (3600000ms)
   * Pending/processing jobs: 1 minute (60000ms)
   * @param status - The job status
   * @returns TTL in milliseconds
   */
  private getTTL(status: JobStatus): number {
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      return 3600000; // 1 hour
    }
    return 60000; // 1 minute
  }

  /**
   * Invalidate cache for a job
   * @param jobId - The job UUID
   */
  private async invalidateCache(jobId: string): Promise<void> {
    const cacheKey = this.getCacheKey(jobId);
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Create a new job record and add to processing queue
   * @param s3Key - The S3/MinIO key where the PDF is stored
   * @param pdfType - The type of PDF (lecture, test, or exam)
   * @param priority - Job priority (default: NORMAL)
   * @returns The created job
   */
  async createJob(
    s3Key: string,
    pdfType: PdfType,
    priority: JobPriority = JobPriority.NORMAL,
  ): Promise<Job> {
    const job = this.jobRepository.create({
      status: JobStatus.PENDING,
      pdfType,
      s3Key,
      result: null,
      error: null,
    });

    const savedJob = await this.jobRepository.save(job);

    // Log job creation with metadata
    this.logger.log({
      message: 'Job created',
      jobId: savedJob.id,
      pdfType,
      s3Key,
      priority: JobPriority[priority],
      status: JobStatus.PENDING,
      createdAt: savedJob.createdAt.toISOString(),
    });

    // Increment pdf_jobs_total counter
    this.pdfJobsTotal.inc({ type: pdfType });

    // Add to queue with priority
    await this.pdfQueue.add(
      'process-pdf',
      {
        jobId: savedJob.id,
        s3Key,
        pdfType,
      },
      {
        priority,
        jobId: savedJob.id, // Use job ID for deduplication
      },
    );

    return savedJob;
  }

  /**
   * Get a job by its ID
   * Checks cache first, then falls back to database
   * @param id - The job UUID
   * @returns The job if found
   * @throws NotFoundException if job doesn't exist
   */
  async getJobById(id: string): Promise<Job> {
    const cacheKey = this.getCacheKey(id);

    // Try to get from cache first
    const cachedJob = await this.cacheManager.get<Job>(cacheKey);
    if (cachedJob) {
      return cachedJob;
    }

    // If not in cache, get from database
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'JOB_NOT_FOUND',
        error: `Job with ID ${id} not found`,
      });
    }

    // Cache the job with appropriate TTL based on status
    const ttl = this.getTTL(job.status);
    await this.cacheManager.set(cacheKey, job, ttl);

    return job;
  }

  /**
   * Update job status and optionally set result or error
   * Invalidates cache on update
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
    // Invalidate cache before updating
    await this.invalidateCache(id);

    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'JOB_NOT_FOUND',
        error: `Job with ID ${id} not found`,
      });
    }

    const previousStatus = job.status;
    job.status = status;

    if (result !== undefined) {
      job.result = result;
    }

    if (error !== undefined) {
      job.error = error;
    }

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
      
      // Set expiration to 24 hours after completion
      const expiresAt = new Date(job.completedAt);
      expiresAt.setHours(expiresAt.getHours() + 24);
      job.expiresAt = expiresAt;
      
      // Track processing duration
      const durationSeconds = (job.completedAt.getTime() - job.createdAt.getTime()) / 1000;
      this.pdfProcessingDuration.observe(
        { type: job.pdfType, status: status.toLowerCase() },
        durationSeconds,
      );
    }

    const updatedJob = await this.jobRepository.save(job);

    // Log job status change
    const logData: any = {
      message: 'Job status changed',
      jobId: id,
      previousStatus,
      newStatus: status,
      pdfType: job.pdfType,
      s3Key: job.s3Key,
    };

    if (status === JobStatus.COMPLETED) {
      const durationSeconds = (updatedJob.completedAt!.getTime() - job.createdAt.getTime()) / 1000;
      logData.duration = `${durationSeconds.toFixed(2)}s`;
      logData.eventCount = result?.length || 0;
      this.logger.log(logData);
    } else if (status === JobStatus.FAILED) {
      logData.error = error;
      this.logger.error(logData);
    } else {
      this.logger.log(logData);
    }

    // Cache the updated job with appropriate TTL
    const ttl = this.getTTL(updatedJob.status);
    const cacheKey = this.getCacheKey(id);
    await this.cacheManager.set(cacheKey, updatedJob, ttl);

    return updatedJob;
  }

  /**
   * Get queue metrics for monitoring
   * @returns Queue statistics including waiting, active, completed, failed, and delayed job counts
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.pdfQueue.getWaitingCount(),
      this.pdfQueue.getActiveCount(),
      this.pdfQueue.getCompletedCount(),
      this.pdfQueue.getFailedCount(),
      this.pdfQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }

  /**
   * Update queue metrics gauge
   * Runs every 10 seconds to keep metrics fresh
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateQueueMetrics(): Promise<void> {
    try {
      const waiting = await this.pdfQueue.getWaitingCount();
      this.queueJobsWaiting.set({ queue: PDF_PROCESSING_QUEUE }, waiting);
    } catch (error) {
      this.logger.error('Failed to update queue metrics', error);
    }
  }

  /**
   * Clean up expired jobs and their associated files
   * Runs every hour to delete jobs that have expired (24 hours after completion)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredJobs(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all expired jobs
      const expiredJobs = await this.jobRepository.find({
        where: {
          expiresAt: LessThan(now),
        },
      });

      if (expiredJobs.length === 0) {
        this.logger.debug('No expired jobs to clean up');
        return;
      }

      this.logger.log({
        message: 'Starting cleanup of expired jobs',
        count: expiredJobs.length,
        timestamp: now.toISOString(),
      });

      let successCount = 0;
      let errorCount = 0;

      // Delete each expired job and its associated file
      for (const job of expiredJobs) {
        try {
          // Delete the file from storage
          await this.storageService.deleteFile(job.s3Key);
          
          // Invalidate cache
          await this.invalidateCache(job.id);
          
          // Delete the job record
          await this.jobRepository.remove(job);
          
          successCount++;
          
          this.logger.debug({
            message: 'Deleted expired job',
            jobId: job.id,
            s3Key: job.s3Key,
            completedAt: job.completedAt?.toISOString(),
            expiresAt: job.expiresAt?.toISOString(),
          });
        } catch (error) {
          errorCount++;
          this.logger.error({
            message: 'Failed to delete expired job',
            jobId: job.id,
            s3Key: job.s3Key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.logger.log({
        message: 'Completed cleanup of expired jobs',
        totalExpired: expiredJobs.length,
        successCount,
        errorCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to run cleanup job',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
