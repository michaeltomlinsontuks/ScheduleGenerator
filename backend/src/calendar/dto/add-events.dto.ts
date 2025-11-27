import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsString, ValidateNested } from 'class-validator';
import { EventConfigDto } from './event-config.dto.js';

export class AddEventsDto {
  @ApiProperty({
    description: 'Google Calendar ID to add events to',
    example: 'primary',
  })
  @IsString()
  calendarId!: string;

  @ApiProperty({
    type: [EventConfigDto],
    description: 'Array of events to add to the calendar',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventConfigDto)
  events!: EventConfigDto[];

  @ApiProperty({
    description: 'Semester start date in ISO format',
    example: '2025-02-10',
  })
  @IsDateString()
  semesterStart!: string;

  @ApiProperty({
    description: 'Semester end date in ISO format',
    example: '2025-06-06',
  })
  @IsDateString()
  semesterEnd!: string;
}
