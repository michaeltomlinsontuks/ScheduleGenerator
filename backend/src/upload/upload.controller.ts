import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Session,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadService } from './upload.service.js';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { StorageQuotaExceededDto } from './dto/storage-quota-exceeded.dto.js';
import type { MulterFile } from '../common/pipes/file-validation.pipe.js';
import type { SessionUser } from '../auth/auth.service.js';

interface SessionData {
  passport?: {
    user?: SessionUser;
  };
}

@ApiTags('Upload')
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a Tuks schedule PDF',
    description:
      'Upload a PDF file containing a Tuks schedule. ' +
      'The system automatically detects the PDF mode (Lecture, Test, or Exam) ' +
      'by scanning for identifying keywords on the first page. ' +
      'The file will be validated and queued for processing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'PDF file to upload (max 10MB). Must contain "Lectures", "Semester Tests", or "Exams" text.',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF uploaded successfully and queued for processing',
    type: UploadResponseDto,
    examples: {
      lecture: {
        summary: 'Lecture Schedule Upload',
        value: {
          jobId: '550e8400-e29b-41d4-a716-446655440000',
          pdfType: 'lecture',
          message: 'PDF uploaded successfully and queued for processing',
        },
      },
      test: {
        summary: 'Test Schedule Upload',
        value: {
          jobId: '660e8400-e29b-41d4-a716-446655440001',
          pdfType: 'test',
          message: 'PDF uploaded successfully and queued for processing',
        },
      },
      exam: {
        summary: 'Exam Schedule Upload',
        value: {
          jobId: '770e8400-e29b-41d4-a716-446655440002',
          pdfType: 'exam',
          message: 'PDF uploaded successfully and queued for processing',
        },
      },
    },
  })
  @ApiResponse({
    status: 413,
    description: 'Payload Too Large - Storage quota exceeded',
    type: StorageQuotaExceededDto,
    examples: {
      quotaExceeded: {
        summary: 'Storage Quota Exceeded',
        value: {
          statusCode: 413,
          message: 'STORAGE_QUOTA_EXCEEDED',
          error: 'Storage quota exceeded',
          details: {
            currentUsage: 48000000,
            quota: 52428800,
            fileSize: 5000000,
            wouldExceedBy: 571200,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid file type, file too large, invalid PDF content, or unrecognized format',
    type: ErrorResponseDto,
    examples: {
      invalidFileType: {
        summary: 'Invalid File Type',
        value: {
          statusCode: 400,
          message: 'FILE_TYPE_NOT_ALLOWED',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/upload',
          details: 'Only PDF files are allowed',
        },
      },
      fileTooLarge: {
        summary: 'File Too Large',
        value: {
          statusCode: 400,
          message: 'FILE_TOO_LARGE',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/upload',
          details: 'File size exceeds 10MB limit',
        },
      },
      invalidPdfMagicBytes: {
        summary: 'Invalid PDF Magic Bytes',
        value: {
          statusCode: 400,
          message: 'Invalid PDF: file does not start with PDF magic bytes',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/upload',
        },
      },
      textExtractionFailed: {
        summary: 'Text Extraction Failed',
        value: {
          statusCode: 400,
          message: 'Invalid PDF: Unable to extract text content',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/upload',
          details: 'PDF may be corrupted or encrypted',
        },
      },
      unrecognizedFormat: {
        summary: 'Unrecognized Format',
        value: {
          statusCode: 400,
          message: 'Invalid PDF: Not a recognized Tuks schedule format',
          timestamp: '2025-01-15T10:30:00.000Z',
          path: '/api/upload',
          details:
            'Expected "Lectures", "Semester Tests", or "Exams" text in PDF',
        },
      },
    },
  })
  async uploadPdf(
    @UploadedFile(new FileValidationPipe()) file: MulterFile,
    @Session() session: SessionData,
  ): Promise<UploadResponseDto> {
    const userId = session.passport?.user?.id;
    return this.uploadService.processUpload(file, userId);
  }
}
