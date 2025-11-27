import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service.js';

// Mock the minio module
jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn().mockResolvedValue(true),
      makeBucket: jest.fn().mockResolvedValue(undefined),
      putObject: jest.fn().mockResolvedValue({ etag: 'test-etag' }),
      getObject: jest.fn().mockImplementation(() => {
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(Buffer.from('test content'));
        stream.push(null);
        return Promise.resolve(stream);
      }),
      removeObject: jest.fn().mockResolvedValue(undefined),
      presignedGetObject: jest.fn().mockResolvedValue('https://signed-url.example.com'),
    })),
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let mockMinioClient: {
    bucketExists: jest.Mock;
    makeBucket: jest.Mock;
    putObject: jest.Mock;
    getObject: jest.Mock;
    removeObject: jest.Mock;
    presignedGetObject: jest.Mock;
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string | number | boolean> = {
        'minio.endpoint': 'localhost',
        'minio.port': 9000,
        'minio.useSSL': false,
        'minio.accessKey': 'minioadmin',
        'minio.secretKey': 'minioadmin',
        'minio.bucket': 'test-bucket',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    // Access the mocked client through the service
    mockMinioClient = (service as unknown as { minioClient: typeof mockMinioClient }).minioClient;
  });

  describe('onModuleInit', () => {
    it('should check if bucket exists on init', async () => {
      await service.onModuleInit();
      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
    });

    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValueOnce(false);
      await service.onModuleInit();
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('test-bucket');
    });

    it('should not create bucket if it already exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValueOnce(true);
      await service.onModuleInit();
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    it('should upload a file to MinIO', async () => {
      const key = 'test-key.pdf';
      const buffer = Buffer.from('test content');
      const contentType = 'application/pdf';

      await service.uploadFile(key, buffer, contentType);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        key,
        buffer,
        buffer.length,
        { 'Content-Type': contentType },
      );
    });
  });

  describe('downloadFile', () => {
    it('should download a file from MinIO', async () => {
      const key = 'test-key.pdf';

      const result = await service.downloadFile(key);

      expect(mockMinioClient.getObject).toHaveBeenCalledWith('test-bucket', key);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from MinIO', async () => {
      const key = 'test-key.pdf';

      await service.deleteFile(key);

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith('test-bucket', key);
    });
  });

  describe('getSignedUrl', () => {
    it('should return a signed URL for a file', async () => {
      const key = 'test-key.pdf';
      const expiresIn = 3600;

      const result = await service.getSignedUrl(key, expiresIn);

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'test-bucket',
        key,
        expiresIn,
      );
      expect(result).toBe('https://signed-url.example.com');
    });
  });
});
