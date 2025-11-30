export class StorageQuotaExceededDto {
  statusCode: number;
  message: string;
  error: string;
  details: {
    currentUsage: number;
    quota: number;
    fileSize: number;
    wouldExceedBy: number;
  };

  constructor(currentUsage: number, quota: number, fileSize: number) {
    this.statusCode = 413;
    this.message = 'STORAGE_QUOTA_EXCEEDED';
    this.error = 'Storage quota exceeded';
    this.details = {
      currentUsage,
      quota,
      fileSize,
      wouldExceedBy: currentUsage + fileSize - quota,
    };
  }
}
