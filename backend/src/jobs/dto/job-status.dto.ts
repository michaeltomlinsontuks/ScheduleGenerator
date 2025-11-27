import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, PdfType } from '../entities/job.entity.js';

export class JobStatusDto {
  @ApiProperty({ description: 'Unique job identifier' })
  @IsUUID()
  id!: string;

  @ApiProperty({ enum: JobStatus, description: 'Current job status' })
  @IsEnum(JobStatus)
  status!: JobStatus;

  @ApiProperty({ enum: PdfType, description: 'Type of PDF being processed' })
  @IsEnum(PdfType)
  pdfType!: PdfType;

  @ApiProperty({ description: 'Job creation timestamp' })
  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Job completion timestamp' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Error message if job failed' })
  @IsOptional()
  @IsString()
  error?: string | null;
}
