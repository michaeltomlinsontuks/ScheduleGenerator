import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import type { MulterFile } from '../common/pipes/file-validation.pipe.js';

@ApiTags('Upload')
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a UP schedule PDF',
    description:
      'Upload a PDF file containing a University of Pretoria schedule. The file will be validated and queued for processing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload (max 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type, file too large, or invalid PDF content',
  })
  async uploadPdf(
    @UploadedFile(new FileValidationPipe()) file: MulterFile,
  ): Promise<UploadResponseDto> {
    return this.uploadService.processUpload(file);
  }
}
