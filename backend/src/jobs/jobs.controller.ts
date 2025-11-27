import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { JobStatusDto, JobResultDto } from './dto/index.js';
import { JobStatus } from './entities/job.entity.js';

@ApiTags('jobs')
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get job status by ID' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job status', type: JobStatusDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobStatusDto> {
    const job = await this.jobsService.getJobById(id);

    return {
      id: job.id,
      status: job.status,
      pdfType: job.pdfType,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
    };
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get job results (parsed events)' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job results', type: JobResultDto })
  @ApiResponse({ status: 400, description: 'Job not completed' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobResult(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobResultDto> {
    const job = await this.jobsService.getJobById(id);

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'JOB_NOT_COMPLETED',
        error: `Job is in ${job.status} status. Results are only available for completed jobs.`,
      });
    }

    return {
      id: job.id,
      events: job.result ?? [],
    };
  }
}
