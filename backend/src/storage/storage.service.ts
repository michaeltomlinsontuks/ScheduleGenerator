import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint') ?? 'localhost',
      port: this.configService.get<number>('minio.port') ?? 9000,
      useSSL: this.configService.get<boolean>('minio.useSSL') ?? false,
      accessKey: this.configService.get<string>('minio.accessKey') ?? '',
      secretKey: this.configService.get<string>('minio.secretKey') ?? '',
    });
    this.bucket = this.configService.get<string>('minio.bucket') ?? 'pdf-uploads';
  }

  async onModuleInit(): Promise<void> {
    const bucketExists = await this.minioClient.bucketExists(this.bucket);
    if (!bucketExists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': contentType,
    });
  }

  async downloadFile(key: string): Promise<Buffer> {
    const stream = await this.minioClient.getObject(this.bucket, key);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteFile(key: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, key);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, key, expiresIn);
  }
}
