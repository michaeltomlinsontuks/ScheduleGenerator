import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logging interceptor that adds request ID and user ID to all log entries
 * Logs request start and completion with timing information
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip } = request;

    // Generate or retrieve request ID
    const requestId = request.headers['x-request-id'] || uuidv4();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);

    // Extract user ID from session if authenticated
    const userId = request.user?.id || 'anonymous';
    request.userId = userId;

    const startTime = Date.now();

    // Log request start
    this.logger.log({
      message: 'Incoming request',
      requestId,
      userId,
      method,
      url,
      ip,
      userAgent: request.headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful request completion
          this.logger.log({
            message: 'Request completed',
            requestId,
            userId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error (detailed error logging is handled by exception filter)
          this.logger.error({
            message: 'Request failed',
            requestId,
            userId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}
