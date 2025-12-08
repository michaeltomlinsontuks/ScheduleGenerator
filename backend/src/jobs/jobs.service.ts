import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class JobsService {


  /**
   * Get a job by its ID
   * @param id - The job UUID
   * @returns The job if found
   * @throws NotFoundException if job doesn't exist
   */
  async getJobById(id: string): Promise<any> {
    // In stateless mode, jobs are not stored.
    // If we wanted to support "get job status", we'd need to return the job ID
    // with the upload response (which we do) and the frontend would
    // likely direct the user to the result immediately.
    // Since we don't store jobs, we can't retrieve them later.
    throw new NotFoundException({
      statusCode: 404,
      message: 'JOB_NOT_FOUND',
      error: `Job with ID ${id} not found (Stateless Mode)`,
    });
  }
}
