import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { JobStatusDto, JobResultDto } from './dto/index.js';
import { JobStatus } from './entities/job.entity.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@ApiTags('jobs')
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Get(':id')
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 100 checks per minute
  @ApiOperation({
    summary: 'Get job status by ID',
    description:
      'Retrieve the current status of a PDF processing job. ' +
      'The response includes the detected PDF mode (lecture, test, or exam), ' +
      'processing status, and any error messages if the job failed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job UUID returned from the upload endpoint',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: JobStatusDto,
    examples: {
      pending: {
        summary: 'Pending Job',
        value: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'pending',
          pdfType: 'lecture',
          createdAt: '2025-01-15T10:30:00.000Z',
          completedAt: null,
          error: null,
        },
      },
      processing: {
        summary: 'Processing Job',
        value: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'processing',
          pdfType: 'test',
          createdAt: '2025-01-15T10:30:00.000Z',
          completedAt: null,
          error: null,
        },
      },
      completed: {
        summary: 'Completed Job',
        value: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
          pdfType: 'exam',
          createdAt: '2025-01-15T10:30:00.000Z',
          completedAt: '2025-01-15T10:30:15.000Z',
          error: null,
        },
      },
      failed: {
        summary: 'Failed Job',
        value: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'failed',
          pdfType: 'lecture',
          createdAt: '2025-01-15T10:30:00.000Z',
          completedAt: '2025-01-15T10:30:10.000Z',
          error: 'Parsing failed: No tables found in PDF',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
        summary: 'Job Not Found',
        value: {
          statusCode: 404,
          message: 'Job not found',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/jobs/550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get job results (parsed events)',
    description:
      'Retrieve the parsed calendar events from a completed job. ' +
      'The structure of events varies by PDF mode: ' +
      'Lecture events include day and are recurring, ' +
      'Test and Exam events include specific dates and are non-recurring.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job UUID returned from the upload endpoint',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job results retrieved successfully',
    type: JobResultDto,
    examples: {
      lectureEvents: {
        summary: 'Lecture Schedule Events',
        value: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          events: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              module: 'COS 132',
              activity: 'Lecture',
              group: 'G01',
              day: 'Monday',
              startTime: '08:30',
              endTime: '09:20',
              venue: 'IT 4-4',
              isRecurring: true,
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              module: 'COS 132',
              activity: 'Lecture',
              group: 'G01',
              day: 'Wednesday',
              startTime: '08:30',
              endTime: '09:20',
              venue: 'IT 4-4',
              isRecurring: true,
            },
          ],
        },
      },
      testEvents: {
        summary: 'Test Schedule Events',
        value: {
          id: '660e8400-e29b-41d4-a716-446655440001',
          events: [
            {
              id: '223e4567-e89b-12d3-a456-426614174000',
              module: 'COS 132',
              activity: 'Test 1',
              date: '2025-08-15',
              startTime: '08:30',
              endTime: '10:30',
              venue: 'IT 4-4',
              isRecurring: false,
            },
            {
              id: '223e4567-e89b-12d3-a456-426614174001',
              module: 'COS 214',
              activity: 'Test 1',
              date: '2025-08-15',
              startTime: '08:30',
              endTime: '10:30',
              venue: 'IT 4-5',
              isRecurring: false,
            },
          ],
        },
      },
      examEvents: {
        summary: 'Exam Schedule Events',
        value: {
          id: '770e8400-e29b-41d4-a716-446655440002',
          events: [
            {
              id: '323e4567-e89b-12d3-a456-426614174000',
              module: 'COS 132',
              activity: 'Final Exam',
              date: '2025-11-15',
              startTime: '08:00',
              endTime: '11:00',
              venue: 'Exam Hall A',
              isRecurring: false,
            },
            {
              id: '323e4567-e89b-12d3-a456-426614174001',
              module: 'COS 214',
              activity: 'Final Exam',
              date: '2025-11-16',
              startTime: '14:00',
              endTime: '17:00',
              venue: 'Exam Hall B',
              isRecurring: false,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Job not completed',
    type: ErrorResponseDto,
    examples: {
      notCompleted: {
        summary: 'Job Not Completed',
        value: {
          statusCode: 400,
          message: 'JOB_NOT_COMPLETED',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/jobs/550e8400-e29b-41d4-a716-446655440000/result',
          details:
            'Job is in processing status. Results are only available for completed jobs.',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
        summary: 'Job Not Found',
        value: {
          statusCode: 404,
          message: 'Job not found',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/jobs/550e8400-e29b-41d4-a716-446655440000/result',
        },
      },
    },
  })
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
