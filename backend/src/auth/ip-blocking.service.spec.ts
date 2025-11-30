import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IpBlockingService } from './ip-blocking.service';

describe('IpBlockingService', () => {
  let service: IpBlockingService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpBlockingService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<IpBlockingService>(IpBlockingService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt', async () => {
      cacheManager.get.mockResolvedValue(null);

      const shouldBlock = await service.recordFailedAttempt('192.168.1.100');

      expect(shouldBlock).toBe(false);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'auth:failed:192.168.1.100',
        1,
        900000,
      );
    });

    it('should increment failed attempts', async () => {
      cacheManager.get.mockResolvedValue(2);

      const shouldBlock = await service.recordFailedAttempt('192.168.1.100');

      expect(shouldBlock).toBe(false);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'auth:failed:192.168.1.100',
        3,
        900000,
      );
    });

    it('should block IP after 5 failed attempts', async () => {
      cacheManager.get.mockResolvedValue(4);

      const shouldBlock = await service.recordFailedAttempt('192.168.1.100');

      expect(shouldBlock).toBe(true);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'auth:blocked:192.168.1.100',
        expect.objectContaining({
          ip: '192.168.1.100',
          attempts: 4,
          reason: 'Exceeded 5 failed authentication attempts',
        }),
        3600000,
      );
    });
  });

  describe('isBlocked', () => {
    it('should return null for non-blocked IP', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.isBlocked('192.168.1.100');

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith('auth:blocked:192.168.1.100');
    });

    it('should return block info for blocked IP', async () => {
      const blockInfo = {
        ip: '192.168.1.100',
        attempts: 5,
        blockedAt: Date.now(),
        reason: 'Exceeded 5 failed authentication attempts',
      };
      cacheManager.get.mockResolvedValue(blockInfo);

      const result = await service.isBlocked('192.168.1.100');

      expect(result).toEqual(blockInfo);
    });
  });

  describe('unblockIP', () => {
    it('should return false if IP is not blocked', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.unblockIP('192.168.1.100');

      expect(result).toBe(false);
      expect(cacheManager.del).not.toHaveBeenCalled();
    });

    it('should unblock IP and clear failed attempts', async () => {
      const blockInfo = {
        ip: '192.168.1.100',
        attempts: 5,
        blockedAt: Date.now(),
        reason: 'Exceeded 5 failed authentication attempts',
      };
      cacheManager.get.mockResolvedValue(blockInfo);

      const result = await service.unblockIP('192.168.1.100');

      expect(result).toBe(true);
      expect(cacheManager.del).toHaveBeenCalledWith('auth:blocked:192.168.1.100');
      expect(cacheManager.del).toHaveBeenCalledWith('auth:failed:192.168.1.100');
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts for IP', async () => {
      await service.clearFailedAttempts('192.168.1.100');

      expect(cacheManager.del).toHaveBeenCalledWith('auth:failed:192.168.1.100');
    });
  });

  describe('getFailedAttempts', () => {
    it('should return 0 for IP with no failed attempts', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getFailedAttempts('192.168.1.100');

      expect(result).toBe(0);
    });

    it('should return failed attempt count', async () => {
      cacheManager.get.mockResolvedValue(3);

      const result = await service.getFailedAttempts('192.168.1.100');

      expect(result).toBe(3);
    });
  });

  describe('getTimeUntilUnblock', () => {
    it('should return 0 for non-blocked IP', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getTimeUntilUnblock('192.168.1.100');

      expect(result).toBe(0);
    });

    it('should return time remaining for blocked IP', async () => {
      const blockedAt = Date.now() - 1800000; // 30 minutes ago
      const blockInfo = {
        ip: '192.168.1.100',
        attempts: 5,
        blockedAt,
        reason: 'Exceeded 5 failed authentication attempts',
      };
      cacheManager.get.mockResolvedValue(blockInfo);

      const result = await service.getTimeUntilUnblock('192.168.1.100');

      // Should be approximately 30 minutes remaining (1800000ms)
      expect(result).toBeGreaterThan(1700000);
      expect(result).toBeLessThan(1900000);
    });
  });
});
