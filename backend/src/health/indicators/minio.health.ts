import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint') ?? 'localhost',
      port: this.configService.get<number>('minio.port') ?? 9000,
      useSSL: this.configService.get<boolean>('minio.useSSL') ?? false,
      accessKey: this.configService.get<string>('minio.accessKey') ?? '',
      secretKey: this.configService.get<string>('minio.secretKey') ?? '',
    });
    this.bucket =
      this.configService.get<string>('minio.bucket') ?? 'pdf-uploads';
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if we can connect to MinIO by checking bucket existence
      await this.minioClient.bucketExists(this.bucket);
      return this.getStatus(key, true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
