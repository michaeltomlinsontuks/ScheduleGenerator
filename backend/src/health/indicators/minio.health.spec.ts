import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError } from '@nestjs/terminus';
import { MinioHealthIndicator } from './minio.health';

// Mock the minio module
jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn(),
  })),
}));

import * as Minio from 'minio';

describe('MinioHealthIndicator', () => {
  let indicator: MinioHealthIndicator;
  let mockBucketExists: jest.Mock;

  beforeEach(async () => {
    mockBucketExists = jest.fn();

    (Minio.Client as jest.Mock).mockImplementation(() => ({
      bucketExists: mockBucketExists,
    }));

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string | number | boolean> = {
          'minio.endpoint': 'localhost',
          'minio.port': 9000,
          'minio.useSSL': false,
          'minio.accessKey': 'minioadmin',
          'minio.secretKey': 'minioadmin',
          'minio.bucket': 'pdf-uploads',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioHealthIndicator,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    indicator = module.get<MinioHealthIndicator>(MinioHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when MinIO is reachable', async () => {
      mockBucketExists.mockResolvedValue(true);

      const result = await indicator.isHealthy('minio');

      expect(result).toEqual({ minio: { status: 'up' } });
      expect(mockBucketExists).toHaveBeenCalledWith('pdf-uploads');
    });

    it('should return healthy status even when bucket does not exist', async () => {
      // bucketExists returns false but doesn't throw - MinIO is still reachable
      mockBucketExists.mockResolvedValue(false);

      const result = await indicator.isHealthy('minio');

      expect(result).toEqual({ minio: { status: 'up' } });
    });

    it('should throw HealthCheckError when MinIO connection fails', async () => {
      const connectionError = new Error('Connection refused');
      mockBucketExists.mockRejectedValue(connectionError);

      await expect(indicator.isHealthy('minio')).rejects.toThrow(
        HealthCheckError,
      );
    });

    it('should include error message in health check error', async () => {
      const errorMessage = 'Network timeout';
      mockBucketExists.mockRejectedValue(new Error(errorMessage));

      try {
        await indicator.isHealthy('minio');
        fail('Expected HealthCheckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HealthCheckError);
        expect((error as HealthCheckError).message).toContain(
          'minio health check failed',
        );
      }
    });
  });
});
