import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString } from 'class-validator';
import { PdfType } from '../../jobs/entities/job.entity.js';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the processing job',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  jobId!: string;

  @ApiProperty({
    description: 'Type of PDF detected (weekly or test schedule)',
    enum: PdfType,
    example: PdfType.WEEKLY,
  })
  @IsEnum(PdfType)
  pdfType!: PdfType;

  @ApiProperty({
    description: 'Status message',
    example: 'PDF uploaded successfully and queued for processing',
  })
  @IsString()
  message!: string;
}
