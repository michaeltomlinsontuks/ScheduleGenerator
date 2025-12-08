import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PdfType, ParsedEvent } from '../../common/types.js';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the processing job',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  jobId!: string;

  @ApiProperty({
    description: 'Type of PDF detected based on content analysis',
    enum: PdfType,
    enumName: 'PdfType',
    example: PdfType.LECTURE,
  })
  @IsEnum(PdfType)
  pdfType!: PdfType;

  @ApiProperty({
    description: 'Processing status',
    enum: ['completed', 'failed'],
    example: 'completed',
  })
  @IsString()
  status!: 'completed' | 'failed';

  @ApiProperty({
    description: 'Parsed calendar events from the PDF',
    type: 'array',
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @IsOptional()
  events?: ParsedEvent[];

  @ApiProperty({
    description: 'Status message',
    example: 'PDF processed successfully',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Detected semester dates based on PDF content',
    required: false,
    example: { semester: 'S1', startDate: '2026-02-09', endDate: '2026-05-22' },
  })
  @IsOptional()
  semesterDates?: {
    semester: 'S1' | 'S2' | null;
    startDate: string | null;
    endDate: string | null;
  };
}
