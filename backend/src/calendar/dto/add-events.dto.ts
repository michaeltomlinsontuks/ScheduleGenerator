import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EventConfigDto } from './event-config.dto.js';
import { PdfType } from '../../common/types.js';

export class AddEventsDto {
  @ApiProperty({
    description:
      'Google Calendar ID to add events to. Use "primary" for the user\'s primary calendar.',
    example: 'primary',
  })
  @IsString()
  calendarId!: string;

  @ApiProperty({
    type: [EventConfigDto],
    description:
      'Array of events to add to the calendar. ' +
      'Event structure varies by mode: ' +
      'Lecture events have day field and isRecurring=true. ' +
      'Test and Exam events have date field and isRecurring=false.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventConfigDto)
  events!: EventConfigDto[];

  @ApiPropertyOptional({
    description:
      'Semester start date in ISO format (YYYY-MM-DD). ' +
      'REQUIRED for lecture mode (recurring events). ' +
      'Optional for test and exam modes (one-time events).',
    example: '2025-02-10',
  })
  @IsOptional()
  @IsDateString()
  semesterStart?: string;

  @ApiPropertyOptional({
    description:
      'Semester end date in ISO format (YYYY-MM-DD). ' +
      'REQUIRED for lecture mode (recurring events). ' +
      'Optional for test and exam modes (one-time events).',
    example: '2025-06-06',
  })
  @IsOptional()
  @IsDateString()
  semesterEnd?: string;

  @ApiPropertyOptional({
    enum: PdfType,
    enumName: 'PdfType',
    description:
      'PDF mode type. ' +
      'LECTURE: Recurring weekly events, requires semester dates. ' +
      'TEST: One-time test events, semester dates optional. ' +
      'EXAM: One-time exam events, semester dates optional.',
    example: 'lecture',
  })
  @IsOptional()
  @IsEnum(PdfType)
  pdfType?: PdfType;
}
