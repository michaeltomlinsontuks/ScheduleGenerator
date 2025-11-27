import * as fc from 'fast-check';
import { BadRequestException } from '@nestjs/common';
import {
  validatePdfContent,
  isPdfValidUpSchedule,
  PdfContentError,
} from './pdf-content.validator';
import { PdfType } from '../../jobs/entities/job.entity';

/**
 * **Feature: backend-implementation, Property 6: UP Schedule Content Detection**
 * **Validates: Requirements 2.3, 2.4**
 *
 * For any PDF buffer, the content validation function SHALL return a valid
 * PdfType (WEEKLY or TEST) if and only if the content contains "Lectures"
 * or "Semester Tests" keywords respectively.
 */
describe('PDF Content Validation - Property 6: UP Schedule Content Detection', () => {
  // Keywords that identify schedule types
  const WEEKLY_KEYWORDS = ['Lectures', 'LECTURES'];
  const TEST_KEYWORDS = ['Semester Tests', 'SEMESTER TESTS', 'Semester tests'];

  describe('Weekly schedule detection', () => {
    it('should return WEEKLY for any buffer containing "Lectures" keyword', () => {
      fc.assert(
        fc.property(
          // Generate random prefix and suffix strings
          fc.string(),
          fc.string(),
          fc.constantFrom(...WEEKLY_KEYWORDS),
          (prefix, suffix, keyword) => {
            // Ensure no test keywords are present
            const content = prefix + keyword + suffix;
            if (TEST_KEYWORDS.some((tk) => content.includes(tk))) {
              return true; // Skip this case - test keywords take precedence
            }

            const buffer = Buffer.from(content, 'utf-8');
            const result = validatePdfContent(buffer);
            return result === PdfType.WEEKLY;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Test schedule detection', () => {
    it('should return TEST for any buffer containing "Semester Tests" keyword', () => {
      fc.assert(
        fc.property(
          // Generate random prefix and suffix strings
          fc.string(),
          fc.string(),
          fc.constantFrom(...TEST_KEYWORDS),
          (prefix, suffix, keyword) => {
            const content = prefix + keyword + suffix;
            const buffer = Buffer.from(content, 'utf-8');
            const result = validatePdfContent(buffer);
            return result === PdfType.TEST;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should prioritize TEST over WEEKLY when both keywords are present', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom(...WEEKLY_KEYWORDS),
          fc.constantFrom(...TEST_KEYWORDS),
          fc.string(),
          (prefix, weeklyKeyword, testKeyword, suffix) => {
            // Content has both keywords
            const content = prefix + weeklyKeyword + ' ' + testKeyword + suffix;
            const buffer = Buffer.from(content, 'utf-8');
            const result = validatePdfContent(buffer);
            return result === PdfType.TEST;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Invalid content detection', () => {
    it('should throw for any buffer without schedule keywords', () => {
      fc.assert(
        fc.property(
          // Generate strings that don't contain any keywords
          fc.string().filter((s) => {
            const allKeywords = [...WEEKLY_KEYWORDS, ...TEST_KEYWORDS];
            return !allKeywords.some((keyword) => s.includes(keyword));
          }),
          (content) => {
            const buffer = Buffer.from(content, 'utf-8');
            try {
              validatePdfContent(buffer);
              return false; // Should have thrown
            } catch (error) {
              if (error instanceof BadRequestException) {
                const response = error.getResponse() as {
                  error: string;
                  message: string;
                };
                return response.error === PdfContentError.INVALID_PDF_CONTENT;
              }
              return false;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('isPdfValidUpSchedule helper', () => {
    it('should return isValid=true with pdfType for valid schedules', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom(...WEEKLY_KEYWORDS, ...TEST_KEYWORDS),
          fc.string(),
          (prefix, keyword, suffix) => {
            const content = prefix + keyword + suffix;
            const buffer = Buffer.from(content, 'utf-8');
            const result = isPdfValidUpSchedule(buffer);
            return (
              result.isValid === true &&
              (result.pdfType === PdfType.WEEKLY ||
                result.pdfType === PdfType.TEST)
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should return isValid=false for invalid content', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => {
            const allKeywords = [...WEEKLY_KEYWORDS, ...TEST_KEYWORDS];
            return !allKeywords.some((keyword) => s.includes(keyword));
          }),
          (content) => {
            const buffer = Buffer.from(content, 'utf-8');
            const result = isPdfValidUpSchedule(buffer);
            return result.isValid === false && result.pdfType === undefined;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
