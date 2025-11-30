import { HttpException, HttpStatus } from '@nestjs/common';
import { StorageQuotaExceededDto } from '../dto/storage-quota-exceeded.dto.js';

export class StorageQuotaExceededException extends HttpException {
  constructor(currentUsage: number, quota: number, fileSize: number) {
    const response = new StorageQuotaExceededDto(
      currentUsage,
      quota,
      fileSize,
    );
    super(response, HttpStatus.PAYLOAD_TOO_LARGE);
  }
}
