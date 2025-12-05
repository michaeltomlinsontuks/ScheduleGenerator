import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class EventConfigDto {
  @ApiProperty({
    description: 'Unique identifier for the event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description:
      'Event summary/title. ' +
      'For lectures: "{Module} {Activity}" (e.g., "COS 132 Lecture"). ' +
      'For tests: "{Module} {Test}" (e.g., "COS 132 Test 1"). ' +
      'For exams: "{Module} {Exam}" (e.g., "COS 132 Final Exam")',
    example: 'COS 132 Lecture',
  })
  @IsString()
  summary!: string;

  @ApiProperty({
    description: 'Event location/venue (e.g., IT 4-4, Exam Hall A)',
    example: 'IT 4-4',
  })
  @IsString()
  location!: string;

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

  @ApiPropertyOptional({
    description:
      'Day of the week for recurring lecture events (Monday, Tuesday, etc.). ' +
      'Only present when isRecurring is true.',
    example: 'Monday',
  })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({
    description:
      'Specific date for one-time events in ISO format (YYYY-MM-DD). ' +
      'Only present for test and exam events when isRecurring is false.',
    example: '2025-08-15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description:
      'Whether this is a recurring weekly event. ' +
      'true for lecture schedules (repeats every week). ' +
      'false for test and exam schedules (one-time events).',
    example: true,
  })
  @IsBoolean()
  isRecurring!: boolean;

  @ApiProperty({
    description:
      'Google Calendar color ID (1-11). Used to visually distinguish different modules.',
    example: '1',
  })
  @IsString()
  colorId!: string;

  @ApiPropertyOptional({
    description:
      'Additional notes for the event. ' +
      'Commonly used for unfinalised exams to indicate "Venue TBA" or "Date TBA".',
    example: 'Venue TBA - Check official schedule for updates',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Semester (e.g., S1, S2, Y). Used for filtering events.',
    example: 'S1',
  })
  @IsOptional()
  @IsString()
  semester?: string;
}
