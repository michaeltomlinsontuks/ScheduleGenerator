import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class EventConfigDto {
  @ApiProperty({ description: 'Unique identifier for the event' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Event summary/title' })
  @IsString()
  summary!: string;

  @ApiProperty({ description: 'Event location/venue' })
  @IsString()
  location!: string;

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
    description: 'Whether this is a recurring weekly event',
  })
  @IsBoolean()
  isRecurring!: boolean;

  @ApiProperty({
    description: 'Google Calendar color ID',
    example: '1',
  })
  @IsString()
  colorId!: string;
}
