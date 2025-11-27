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
  @ApiProperty({ description: 'Unique event identifier' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Module code' })
  @IsString()
  module!: string;

  @ApiProperty({ description: 'Activity type (e.g., Lecture, Tutorial)' })
  @IsString()
  activity!: string;

  @ApiPropertyOptional({ description: 'Group identifier' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Day of the week' })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({ description: 'Specific date for one-time events' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '08:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must match format HH:MM (e.g., 08:30)',
  })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '09:20' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must match format HH:MM (e.g., 09:20)',
  })
  endTime!: string;

  @ApiProperty({ description: 'Venue/location' })
  @IsString()
  venue!: string;

  @ApiProperty({ description: 'Whether this is a recurring event' })
  @IsBoolean()
  isRecurring!: boolean;
}

export class JobResultDto {
  @ApiProperty({ description: 'Unique job identifier' })
  @IsUUID()
  id!: string;

  @ApiProperty({ type: [ParsedEventDto], description: 'Array of parsed events' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedEventDto)
  events!: ParsedEventDto[];
}
