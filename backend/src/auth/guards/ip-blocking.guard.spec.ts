import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { IpBlockingGuard } from './ip-blocking.guard';
import { IpBlockingService } from '../ip-blocking.service';

describe('IpBlockingGuard', () => {
  let guard: IpBlockingGuard;
  let ipBlockingService: jest.Mocked<IpBlockingService>;

  const mockExecutionContext = (ip: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: {},
          socket: { remoteAddress: ip },
        }),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockIpBlockingService = {
      isBlocked: jest.fn(),
      getTimeUntilUnblock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpBlockingGuard,
        {
          provide: IpBlockingService,
          useValue: mockIpBlockingService,
        },
      ],
    }).compile();

    guard = module.get<IpBlockingGuard>(IpBlockingGuard);
    ipBlockingService = module.get(IpBlockingService) as jest.Mocked<IpBlockingService>;
  });

  it('should allow access for non-blocked IP', async () => {
    ipBlockingService.isBlocked.mockResolvedValue(null);

    const context = mockExecutionContext('192.168.1.100');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(ipBlockingService.isBlocked).toHaveBeenCalledWith('192.168.1.100');
  });

  it('should block access for blocked IP', async () => {
    const blockInfo = {
      ip: '192.168.1.100',
      attempts: 5,
      blockedAt: Date.now() - 1800000, // 30 minutes ago
      reason: 'Exceeded 5 failed authentication attempts',
    };
    ipBlockingService.isBlocked.mockResolvedValue(blockInfo);
    ipBlockingService.getTimeUntilUnblock.mockResolvedValue(1800000); // 30 minutes remaining

    const context = mockExecutionContext('192.168.1.100');

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(ipBlockingService.isBlocked).toHaveBeenCalledWith('192.168.1.100');
  });

  it('should extract IP from X-Forwarded-For header', async () => {
    ipBlockingService.isBlocked.mockResolvedValue(null);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '10.0.0.1',
          headers: {
            'x-forwarded-for': '203.0.113.1, 10.0.0.1',
          },
          socket: { remoteAddress: '10.0.0.1' },
        }),
      }),
    } as ExecutionContext;

    await guard.canActivate(context);

    // Should use the first IP from X-Forwarded-For
    expect(ipBlockingService.isBlocked).toHaveBeenCalledWith('203.0.113.1');
  });
});
