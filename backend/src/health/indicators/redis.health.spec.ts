import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

import { createClient } from 'redis';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let mockRedisClient: {
    connect: jest.Mock;
    ping: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisClient = {
      connect: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string | number> = {
          'redis.host': 'localhost',
          'redis.port': 6379,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when Redis is reachable', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.quit.mockResolvedValue(undefined);

      const result = await indicator.isHealthy('redis');

      expect(result).toEqual({ redis: { status: 'up' } });
      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: { connectTimeout: 5000 },
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should throw HealthCheckError when Redis connection fails', async () => {
      const connectionError = new Error('Connection refused');
      mockRedisClient.connect.mockRejectedValue(connectionError);
      mockRedisClient.quit.mockResolvedValue(undefined);

      await expect(indicator.isHealthy('redis')).rejects.toThrow(
        HealthCheckError,
      );
    });

    it('should throw HealthCheckError when Redis ping fails', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'));
      mockRedisClient.quit.mockResolvedValue(undefined);

      await expect(indicator.isHealthy('redis')).rejects.toThrow(
        HealthCheckError,
      );
    });

    it('should handle quit errors gracefully during cleanup', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      mockRedisClient.quit.mockRejectedValue(new Error('Quit failed'));

      await expect(indicator.isHealthy('redis')).rejects.toThrow(
        HealthCheckError,
      );
    });
  });
});
