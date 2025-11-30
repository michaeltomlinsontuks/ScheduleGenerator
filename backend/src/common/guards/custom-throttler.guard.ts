import { Injectable, Logger } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { Response, Request } from 'express';

interface RequestWithContext extends Request {
  requestId?: string;
  userId?: string;
}

/**
 * Custom throttler guard that adds rate limit information to the response
 * This allows the RateLimitHeadersInterceptor to add appropriate headers
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, getTracker } =
      requestProps;
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    // Get the throttler key (usually IP address)
    const tracker = await getTracker(request, context);
    const throttlerName = throttler.name || 'default';
    const key = this.generateKey(context, tracker, throttlerName);

    // Get current count from storage
    const { totalHits, timeToExpire } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttlerName,
    );

    const remaining = Math.max(0, limit - totalHits);
    const resetTime = Date.now() + timeToExpire;

    // Attach rate limit info to response for the interceptor
    (response as any).rateLimitInfo = {
      limit,
      remaining,
      reset: resetTime,
    };

    // Add headers immediately
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTime);

    if (totalHits > limit) {
      // Calculate retry-after in seconds
      const retryAfter = Math.ceil(timeToExpire / 1000);
      response.setHeader('Retry-After', retryAfter);

      // Log rate limit violation
      this.logger.warn({
        message: 'Rate limit exceeded',
        requestId: request.requestId,
        userId: request.userId || 'anonymous',
        endpoint: request.url,
        method: request.method,
        ip: request.ip,
        throttlerName,
        limit,
        totalHits,
        retryAfter: `${retryAfter}s`,
      });

      throw new ThrottlerException();
    }

    return true;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the tracker
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}
