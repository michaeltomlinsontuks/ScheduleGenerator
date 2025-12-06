import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IpBlockingService } from '../ip-blocking.service.js';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor(private readonly ipBlockingService: IpBlockingService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    try {
      const result = (await super.canActivate(context)) as boolean;

      // If authentication succeeded, clear any failed attempts for this IP
      if (result) {
        await this.ipBlockingService.clearFailedAttempts(ip);
      }

      // Trigger session login
      await super.logIn(request);

      return result;
    } catch (error) {
      // Record failed authentication attempt
      const shouldBlock = await this.ipBlockingService.recordFailedAttempt(ip);

      if (shouldBlock) {
        this.logger.warn({
          message: 'IP blocked due to repeated failed authentication attempts',
          ip,
        });
      }

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Get request for authentication options
   * This allows us to pass the returnUrl as the OAuth state parameter
   */
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const returnUrl = request.query.returnUrl as string | undefined;

    // Pass returnUrl in the state parameter so it survives the OAuth redirect
    return {
      state: returnUrl ? JSON.stringify({ returnUrl }) : undefined,
    };
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
