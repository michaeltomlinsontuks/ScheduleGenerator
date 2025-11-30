import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health';
import { DatabaseHealthIndicator } from './indicators/database.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbIndicator: jest.Mocked<DatabaseHealthIndicator>;
  let redisIndicator: jest.Mocked<RedisHealthIndicator>;
  let minioIndicator: jest.Mocked<MinioHealthIndicator>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockDbIndicator = {
      isHealthy: jest.fn(),
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
        { provide: DatabaseHealthIndicator, useValue: mockDbIndicator },
        { provide: RedisHealthIndicator, useValue: mockRedisIndicator },
        { provide: MinioHealthIndicator, useValue: mockMinioIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    dbIndicator = module.get(DatabaseHealthIndicator);
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

      dbIndicator.isHealthy.mockResolvedValue({
        database: {
          status: 'up',
          totalConnections: 10,
          activeConnections: 2,
          idleConnections: 8,
        },
      });
      redisIndicator.isHealthy.mockResolvedValue({ redis: { status: 'up' } });
      minioIndicator.isHealthy.mockResolvedValue({ minio: { status: 'up' } });

      await controller.check();

      expect(dbIndicator.isHealthy).toHaveBeenCalledWith('database');
      expect(redisIndicator.isHealthy).toHaveBeenCalledWith('redis');
      expect(minioIndicator.isHealthy).toHaveBeenCalledWith('minio');
    });
  });

  describe('checkDatabase', () => {
    it('should return database health check with pool metrics', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
            totalConnections: 15,
            activeConnections: 5,
            idleConnections: 10,
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
            totalConnections: 15,
            activeConnections: 5,
            idleConnections: 10,
          },
        },
      };

      healthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.checkDatabase();

      expect(result).toEqual(expectedResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });
  });
});
