import * as fc from 'fast-check';
import { BadRequestException } from '@nestjs/common';
import {
  FileValidationPipe,
  MulterFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPE,
  FileValidationError,
} from './file-validation.pipe';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  beforeEach(() => {
    pipe = new FileValidationPipe();
  });

  /**
   * **Feature: backend-implementation, Property 4: PDF Content Type Validation**
   * **Validates: Requirements 2.1**
   *
   * For any file uploaded to `/api/upload`, if the content type is not
   * `application/pdf`, the Backend SHALL reject the request with a 400 status code.
   */
  describe('Property 4: PDF Content Type Validation', () => {
    it('should reject any file with content type other than application/pdf', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary mime types that are NOT application/pdf
          fc.string().filter((s) => s !== ALLOWED_MIME_TYPE && s.length > 0),
          fc.nat({ max: MAX_FILE_SIZE }), // Valid file size
          (mimetype, size) => {
            const file: MulterFile = {
              fieldname: 'file',
              originalname: 'test.pdf',
              encoding: '7bit',
              mimetype,
              size,
              buffer: Buffer.alloc(size),
            };

            try {
              pipe.transform(file);
              return false; // Should have thrown
            } catch (error) {
              if (error instanceof BadRequestException) {
                const response = error.getResponse() as {
                  error: string;
                  message: string;
                };
                return response.error === FileValidationError.INVALID_FILE_TYPE;
              }
              return false;
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept files with content type application/pdf', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: MAX_FILE_SIZE }), // Valid file size
          (size) => {
            const file: MulterFile = {
              fieldname: 'file',
              originalname: 'test.pdf',
              encoding: '7bit',
              mimetype: ALLOWED_MIME_TYPE,
              size,
              buffer: Buffer.alloc(size),
            };

            const result = pipe.transform(file);
            return result === file;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: backend-implementation, Property 5: PDF Size Validation**
   * **Validates: Requirements 2.2**
   *
   * For any PDF file uploaded to `/api/upload`, if the file size exceeds
   * 10MB (10,485,760 bytes), the Backend SHALL reject the request with a 400 status code.
   */
  describe('Property 5: PDF Size Validation', () => {
    it('should reject any PDF file larger than 10MB', () => {
      fc.assert(
        fc.property(
          // Generate sizes larger than MAX_FILE_SIZE
          fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 2 }),
          (size) => {
            const file: MulterFile = {
              fieldname: 'file',
              originalname: 'test.pdf',
              encoding: '7bit',
              mimetype: ALLOWED_MIME_TYPE,
              size,
              buffer: Buffer.alloc(0), // Don't actually allocate huge buffers
            };

            try {
              pipe.transform(file);
              return false; // Should have thrown
            } catch (error) {
              if (error instanceof BadRequestException) {
                const response = error.getResponse() as {
                  error: string;
                  message: string;
                };
                return response.error === FileValidationError.FILE_TOO_LARGE;
              }
              return false;
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept PDF files at or under 10MB', () => {
      fc.assert(
        fc.property(
          // Generate sizes at or under MAX_FILE_SIZE
          fc.nat({ max: MAX_FILE_SIZE }),
          (size) => {
            const file: MulterFile = {
              fieldname: 'file',
              originalname: 'test.pdf',
              encoding: '7bit',
              mimetype: ALLOWED_MIME_TYPE,
              size,
              buffer: Buffer.alloc(0),
            };

            const result = pipe.transform(file);
            return result === file;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Edge cases', () => {
    it('should reject when no file is provided', () => {
      expect(() => pipe.transform(null as unknown as MulterFile)).toThrow(
        BadRequestException,
      );
    });

    it('should reject when file is undefined', () => {
      expect(() => pipe.transform(undefined as unknown as MulterFile)).toThrow(
        BadRequestException,
      );
    });
  });
});
