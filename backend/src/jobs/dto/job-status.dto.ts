import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, PdfType } from '../entities/job.entity.js';

export class JobStatusDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    enum: JobStatus,
    enumName: 'JobStatus',
    description:
      'Current job status. ' +
      'PENDING: Job is queued and waiting to be processed. ' +
      'PROCESSING: Job is currently being processed by the PDF worker. ' +
      'COMPLETED: Job finished successfully, results are available. ' +
      'FAILED: Job failed, check error field for details.',
    example: JobStatus.COMPLETED,
  })
  @IsEnum(JobStatus)
  status!: JobStatus;

  @ApiProperty({
    enum: PdfType,
    enumName: 'PdfType',
    description:
      'Type of PDF being processed (detected during upload). ' +
      'LECTURE: Recurring weekly schedule. ' +
      'TEST: One-time semester test schedule. ' +
      'EXAM: One-time final exam schedule.',
    example: PdfType.LECTURE,
  })
  @IsEnum(PdfType)
  pdfType!: PdfType;

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Job completion timestamp (null if not completed)',
    example: '2025-01-15T10:30:15.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date | null;

  @ApiPropertyOptional({
    description:
      'Error message if job failed. Common errors include: ' +
      '"Parsing failed: No tables found in PDF", ' +
      '"Parsing failed: Missing required columns", ' +
      '"Unable to determine PDF type"',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  error?: string | null;
}
