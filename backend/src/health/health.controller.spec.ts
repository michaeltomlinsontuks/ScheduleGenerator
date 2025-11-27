import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbIndicator: jest.Mocked<TypeOrmHealthIndicator>;
  let redisIndicator: jest.Mocked<RedisHealthIndicator>;
  let minioIndicator: jest.Mocked<MinioHealthIndicator>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockDbIndicator = {
      pingCheck: jest.fn(),
    };

    const mockRedisIndicator = {
      isHealthy: jest.fn(),
    };

    const mockMinioIndicator = {
      isHealthy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: mockDbIndicator },
        { provide: RedisHealthIndicator, useValue: mockRedisIndicator },
        { provide: MinioHealthIndicator, useValue: mockMinioIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    dbIndicator = module.get(TypeOrmHealthIndicator);
    redisIndicator = module.get(RedisHealthIndicator);
    minioIndicator = module.get(MinioHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result with all dependencies healthy', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          minio: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          minio: { status: 'up' },
        },
      };

      healthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.check();

      expect(result).toEqual(expectedResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should call all health indicators', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };

      healthCheckService.check.mockImplementation(async (indicators) => {
        // Execute all indicator functions to verify they're called correctly
        for (const indicator of indicators) {
          await indicator();
        }
        return expectedResult;
      });

      dbIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });
      redisIndicator.isHealthy.mockResolvedValue({ redis: { status: 'up' } });
      minioIndicator.isHealthy.mockResolvedValue({ minio: { status: 'up' } });

      await controller.check();

      expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(redisIndicator.isHealthy).toHaveBeenCalledWith('redis');
      expect(minioIndicator.isHealthy).toHaveBeenCalledWith('minio');
    });
  });
});
