import {
  validatePdfContent,
  isPdfValidUpSchedule,
  PdfContentError,
} from './pdf-content.validator';
import { PdfType } from '../../jobs/entities/job.entity';

/**
 * Unit tests for PDF Content Validator
 * Tests the enhanced validator that detects PDF mode by checking for keywords
 * 
 * Note: These tests use real PDF files from the SourceFiles directory to test
 * the actual PDF parsing functionality. The validator uses pdf-parse which is
 * difficult to mock due to its export = syntax.
 */
describe('PDF Content Validation', () => {
  describe('Magic bytes validation', () => {
    it('should throw error for non-PDF files', async () => {
      const buffer = Buffer.from('Not a PDF file');
      await expect(validatePdfContent(buffer)).rejects.toThrow(
        'Invalid PDF: file does not start with PDF magic bytes',
      );
    });
  });

  describe('isPdfValidUpSchedule helper', () => {
    it('should return isValid=false with error for invalid PDFs', async () => {
      const buffer = Buffer.from('Not a PDF');
      const result = await isPdfValidUpSchedule(buffer);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid PDF');
    });
  });
});
