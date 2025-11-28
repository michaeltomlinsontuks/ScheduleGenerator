import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid PDF: Not a recognized UP schedule format',
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2025-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Request path that caused the error',
    example: '/api/upload',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: 'Expected "Lectures", "Semester Tests", or "Exams" text in PDF',
  })
  details?: string;
}
