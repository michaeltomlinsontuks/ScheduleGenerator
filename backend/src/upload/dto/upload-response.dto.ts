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
    description:
      'Type of PDF detected based on content analysis. ' +
      'LECTURE: Contains "Lectures" text, recurring weekly events. ' +
      'TEST: Contains "Semester Tests" text, one-time test events. ' +
      'EXAM: Contains "Exams" text, one-time exam events.',
    enum: PdfType,
    enumName: 'PdfType',
    example: PdfType.LECTURE,
    examples: {
      lecture: {
        summary: 'Lecture Schedule',
        value: 'lecture',
      },
      test: {
        summary: 'Test Schedule',
        value: 'test',
      },
      exam: {
        summary: 'Exam Schedule',
        value: 'exam',
      },
    },
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
