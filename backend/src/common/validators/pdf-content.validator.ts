import { BadRequestException } from '@nestjs/common';
import { PdfType } from '../../jobs/entities/job.entity.js';

export enum PdfContentError {
  INVALID_PDF_CONTENT = 'INVALID_PDF_CONTENT',
}

// Keywords that identify a weekly schedule PDF
const WEEKLY_SCHEDULE_KEYWORDS = ['Lectures', 'LECTURES'];

// Keywords that identify a test schedule PDF
const TEST_SCHEDULE_KEYWORDS = ['Semester Tests', 'SEMESTER TESTS', 'Semester tests'];

/**
 * Validates PDF content and determines the type of UP schedule.
 * Scans the PDF buffer for specific keywords to identify if it's a
 * weekly schedule (contains "Lectures") or test schedule (contains "Semester Tests").
 *
 * @param buffer - The PDF file buffer to validate
 * @returns PdfType - Either WEEKLY or TEST based on content
 * @throws BadRequestException if the PDF is not a valid UP schedule
 */
export function validatePdfContent(buffer: Buffer): PdfType {
  // Convert buffer to string for keyword search
  // PDF text content can be extracted by searching the raw buffer
  const content = buffer.toString('utf-8');

  // Check for weekly schedule keywords
  const hasWeeklyKeywords = WEEKLY_SCHEDULE_KEYWORDS.some((keyword) =>
    content.includes(keyword),
  );

  // Check for test schedule keywords
  const hasTestKeywords = TEST_SCHEDULE_KEYWORDS.some((keyword) =>
    content.includes(keyword),
  );

  if (hasTestKeywords) {
    return PdfType.TEST;
  }

  if (hasWeeklyKeywords) {
    return PdfType.WEEKLY;
  }

  throw new BadRequestException({
    error: PdfContentError.INVALID_PDF_CONTENT,
    message:
      'Invalid PDF content. The file does not appear to be a valid UP schedule.',
  });
}

/**
 * Checks if a PDF buffer contains UP schedule content without throwing.
 * Useful for validation checks where you want a boolean result.
 *
 * @param buffer - The PDF file buffer to check
 * @returns Object with isValid boolean and optional pdfType
 */
export function isPdfValidUpSchedule(buffer: Buffer): {
  isValid: boolean;
  pdfType?: PdfType;
} {
  try {
    const pdfType = validatePdfContent(buffer);
    return { isValid: true, pdfType };
  } catch {
    return { isValid: false };
  }
}
