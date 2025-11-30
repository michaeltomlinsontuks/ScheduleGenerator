import { Test, TestingModule } from '@nestjs/testing';
import { QueryTimeoutInterceptor } from './query-timeout.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, delay } from 'rxjs';

describe('QueryTimeoutInterceptor', () => {
  let interceptor: QueryTimeoutInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: QueryTimeoutInterceptor,
          useFactory: () => new QueryTimeoutInterceptor(1000), // 1 second timeout for tests
        },
      ],
    }).compile();

    interceptor = module.get<QueryTimeoutInterceptor>(QueryTimeoutInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow requests that complete within timeout', async () => {
    const mockExecutionContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of('test response').pipe(delay(100)), // 100ms delay
    };

    const result = await interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .toPromise();

    expect(result).toBe('test response');
  });

  it('should throw RequestTimeoutException for requests exceeding timeout', async () => {
    const mockExecutionContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of('test response').pipe(delay(2000)), // 2 second delay (exceeds 1s timeout)
    };

    await expect(
      interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise(),
    ).rejects.toMatchObject({
      message: 'REQUEST_TIMEOUT',
      response: {
        statusCode: 408,
        message: 'REQUEST_TIMEOUT',
        error: 'Request exceeded 1 second timeout',
      },
    });
  });
});
