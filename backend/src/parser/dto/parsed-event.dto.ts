import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class ParsedEventDto {
  @ApiProperty({ description: 'Unique identifier for the event' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Module code (e.g., COS 132)' })
  @IsString()
  module!: string;

  @ApiProperty({ description: 'Activity type (e.g., Lecture, Tutorial)' })
  @IsString()
  activity!: string;

  @ApiPropertyOptional({ description: 'Group identifier if applicable' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({
    description: 'Day of the week for recurring events (e.g., Monday)',
  })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({
    description: 'Specific date for one-time events (ISO format)',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Start time in HH:MM format',
    example: '08:30',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must match format HH:MM (e.g., 08:30)',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time in HH:MM format',
    example: '09:20',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must match format HH:MM (e.g., 09:20)',
  })
  endTime!: string;

  @ApiProperty({ description: 'Venue/location of the event' })
  @IsString()
  venue!: string;

  @ApiProperty({
    description: 'Whether this is a recurring weekly event',
  })
  @IsBoolean()
  isRecurring!: boolean;
}
