import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

/**
 * Interceptor that adds rate limit headers to responses
 * 
 * Headers added:
 * - X-RateLimit-Limit: Maximum number of requests allowed in the time window
 * - X-RateLimit-Remaining: Number of requests remaining in the current window
 * - X-RateLimit-Reset: Unix timestamp when the rate limit window resets
 */
@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // Get rate limit info from the throttler guard
        // The throttler guard adds this info to the response object
        const rateLimitInfo = (response as any).rateLimitInfo;

        if (rateLimitInfo) {
          response.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
          response.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
          response.setHeader('X-RateLimit-Reset', rateLimitInfo.reset);
        } else {
          // If no rate limit info is available, extract from throttler metadata
          // This is a fallback for when the guard doesn't provide the info
          const handler = context.getHandler();
          const throttleMetadata = Reflect.getMetadata('throttle', handler);
          
          if (throttleMetadata) {
            const limit = throttleMetadata.default?.limit || 100;
            const ttl = throttleMetadata.default?.ttl || 60000;
            const resetTime = Date.now() + ttl;
            
            // We can't determine remaining without tracking, so we'll omit it
            response.setHeader('X-RateLimit-Limit', limit);
            response.setHeader('X-RateLimit-Reset', resetTime);
          }
        }
      }),
    );
  }
}
