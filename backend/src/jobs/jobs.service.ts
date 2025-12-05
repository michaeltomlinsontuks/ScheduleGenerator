import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job } from './entities/job.entity.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) { }

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

      // Delete each expired job
      for (const job of expiredJobs) {
        try {
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
