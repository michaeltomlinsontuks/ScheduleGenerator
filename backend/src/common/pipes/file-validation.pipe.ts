import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_MIME_TYPE = 'application/pdf';

export enum FileValidationError {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NO_FILE_PROVIDED = 'NO_FILE_PROVIDED',
}

@Injectable()
export class FileValidationPipe implements PipeTransform<MulterFile, MulterFile> {
  transform(file: MulterFile): MulterFile {
    if (!file) {
      throw new BadRequestException({
        error: FileValidationError.NO_FILE_PROVIDED,
        message: 'No file provided',
      });
    }

    if (file.mimetype !== ALLOWED_MIME_TYPE) {
      throw new BadRequestException({
        error: FileValidationError.INVALID_FILE_TYPE,
        message: `Invalid file type. Expected ${ALLOWED_MIME_TYPE}, received ${file.mimetype}`,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException({
        error: FileValidationError.FILE_TOO_LARGE,
        message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }

    return file;
  }
}
