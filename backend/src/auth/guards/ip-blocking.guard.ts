import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { IpBlockingService } from '../ip-blocking.service.js';
import { Request } from 'express';

/**
 * Guard that checks if an IP address is blocked before allowing access
 */
@Injectable()
export class IpBlockingGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockingGuard.name);

  constructor(private readonly ipBlockingService: IpBlockingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    const blockInfo = await this.ipBlockingService.isBlocked(ip);

    if (blockInfo) {
      const timeRemaining = await this.ipBlockingService.getTimeUntilUnblock(ip);
      const minutesRemaining = Math.ceil(timeRemaining / 60000);

      this.logger.warn({
        message: 'Blocked IP attempted access',
        ip,
        reason: blockInfo.reason,
        blockedAt: new Date(blockInfo.blockedAt).toISOString(),
        timeRemaining: `${minutesRemaining} minutes`,
      });

      throw new ForbiddenException({
        statusCode: 403,
        message: 'IP_BLOCKED',
        error: `Your IP address has been temporarily blocked due to multiple failed authentication attempts. Please try again in ${minutesRemaining} minutes.`,
        retryAfter: Math.ceil(timeRemaining / 1000), // seconds
      });
    }

    return true;
  }

  /**
   * Extracts the client IP address from the request
   * Handles proxied requests by checking X-Forwarded-For header
   */
  private getClientIp(request: Request): string {
    // Check X-Forwarded-For header (for proxied requests)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Fall back to direct connection IP
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
