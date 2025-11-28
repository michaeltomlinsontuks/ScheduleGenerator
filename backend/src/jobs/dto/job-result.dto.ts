import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParsedEvent } from '../entities/job.entity.js';

export class ParsedEventDto implements ParsedEvent {
  @ApiProperty({
    description: 'Unique event identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Module code (e.g., COS 132, MAT 101)',
    example: 'COS 132',
  })
  @IsString()
  module!: string;

  @ApiProperty({
    description:
      'Activity type. For lectures: "Lecture", "Tutorial", "Practical". ' +
      'For tests: "Test 1", "Test 2". For exams: "Final Exam", "Supplementary Exam"',
    example: 'Lecture',
  })
  @IsString()
  activity!: string;

  @ApiPropertyOptional({
    description:
      'Group identifier for lecture events (e.g., G01, G02). ' +
      'Only present for lecture schedules.',
    example: 'G01',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({
    description:
      'Day of the week for recurring lecture events (Monday, Tuesday, etc.). ' +
      'Only present for lecture schedules where isRecurring is true.',
    example: 'Monday',
  })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({
    description:
      'Specific date for one-time events in ISO format (YYYY-MM-DD). ' +
      'Only present for test and exam schedules where isRecurring is false.',
    example: '2025-08-15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Start time in HH:MM format (24-hour)',
    example: '08:30',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must match format HH:MM (e.g., 08:30)',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time in HH:MM format (24-hour)',
    example: '09:20',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must match format HH:MM (e.g., 09:20)',
  })
  endTime!: string;

  @ApiProperty({
    description:
      'Venue/location of the event. May include building and room number.',
    example: 'IT 4-4',
  })
  @IsString()
  venue!: string;

  @ApiProperty({
    description:
      'Whether this is a recurring weekly event. ' +
      'true for lecture schedules (repeats every week on specified day). ' +
      'false for test and exam schedules (one-time events on specific dates).',
    example: true,
  })
  @IsBoolean()
  isRecurring!: boolean;
}

export class JobResultDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    type: [ParsedEventDto],
    description:
      'Array of parsed calendar events. ' +
      'Structure varies by PDF mode: ' +
      'Lecture events include day and group fields with isRecurring=true. ' +
      'Test and Exam events include date field with isRecurring=false.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedEventDto)
  events!: ParsedEventDto[];
}
