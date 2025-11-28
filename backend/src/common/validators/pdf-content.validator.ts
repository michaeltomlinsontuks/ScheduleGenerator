import { PdfType } from '../../jobs/entities/job.entity.js';
import { PDFParse } from 'pdf-parse';

export enum PdfContentError {
  INVALID_PDF_CONTENT = 'INVALID_PDF_CONTENT',
  UNRECOGNIZED_FORMAT = 'UNRECOGNIZED_FORMAT',
  TEXT_EXTRACTION_FAILED = 'TEXT_EXTRACTION_FAILED',
}

/**
 * Validates PDF content and detects the schedule mode.
 * Checks for mode-identifying keywords in the first page.
 *
 * @param buffer - The PDF file buffer to validate
 * @returns Promise<PdfType> - The detected PDF type (LECTURE, TEST, or EXAM)
 * @throws Error if the buffer is invalid or doesn't contain recognized keywords
 */
export async function validatePdfContent(buffer: Buffer): Promise<PdfType> {
  // 1. Check PDF magic bytes (%PDF-)
  const pdfMagic = buffer.slice(0, 5).toString('ascii');
  if (!pdfMagic.startsWith('%PDF-')) {
    throw new Error('Invalid PDF: file does not start with PDF magic bytes');
  }

  // 2. Extract text from first page only
  let text: string;
  try {
    const parser = new PDFParse({ data: buffer });
    const info = await parser.getText({ first: 1 });
    text = info.pages[0]?.text || '';
  } catch (error) {
    throw new Error('Invalid PDF: Unable to extract text content');
  }

  // 3. Check for mode-identifying keywords
  // Check for mode keywords (order matters - check "Semester Tests" before "Exams")
  if (text.includes('Semester Tests')) {
    return PdfType.TEST;
  }
  if (text.includes('Exams')) {
    return PdfType.EXAM;
  }
  if (text.includes('Lectures')) {
    return PdfType.LECTURE;
  }

  // 4. No valid mode found
  throw new Error('Invalid PDF: Not a recognized UP schedule format');
}

/**
 * Checks if a buffer is a valid UP schedule PDF without throwing.
 * Useful for validation checks where you want a boolean result.
 *
 * @param buffer - The file buffer to check
 * @returns Promise with isValid boolean, optional pdfType, and optional error message
 */
export async function isPdfValidUpSchedule(buffer: Buffer): Promise<{
  isValid: boolean;
  pdfType?: PdfType;
  error?: string;
}> {
  try {
    const pdfType = await validatePdfContent(buffer);
    return { isValid: true, pdfType };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
