import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CalendarDto {
  @ApiProperty({ description: 'Calendar ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Calendar name/summary' })
  @IsString()
  summary!: string;

  @ApiPropertyOptional({ description: 'Calendar description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary calendar' })
  @IsOptional()
  @IsBoolean()
  primary?: boolean;

  @ApiPropertyOptional({ description: 'Calendar background color' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;
}

export class CalendarListDto {
  @ApiProperty({ type: [CalendarDto], description: 'List of calendars' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarDto)
  calendars!: CalendarDto[];
}

export class CreateCalendarDto {
  @ApiProperty({ description: 'Name for the new calendar' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
