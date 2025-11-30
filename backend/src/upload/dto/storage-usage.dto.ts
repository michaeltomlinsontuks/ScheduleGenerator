export class StorageUsageDto {
  usedBytes: number;
  quotaBytes: number;
  usedPercentage: number;
  availableBytes: number;

  constructor(usedBytes: number, quotaBytes: number) {
    this.usedBytes = usedBytes;
    this.quotaBytes = quotaBytes;
    this.usedPercentage = Math.round((usedBytes / quotaBytes) * 100);
    this.availableBytes = quotaBytes - usedBytes;
  }
}
