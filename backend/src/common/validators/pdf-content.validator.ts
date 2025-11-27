import { PdfType } from '../../jobs/entities/job.entity.js';

export enum PdfContentError {
  INVALID_PDF_CONTENT = 'INVALID_PDF_CONTENT',
}

/**
 * Validates that the buffer is a valid PDF file by checking the magic bytes.
 * The actual content type (weekly vs test) is determined by the PDF worker
 * which uses pdfplumber to extract and analyze the text content.
 *
 * @param buffer - The PDF file buffer to validate
 * @returns PdfType.WEEKLY as default - actual type determined by PDF worker
 * @throws Error if the buffer doesn't start with PDF magic bytes
 */
export function validatePdfContent(buffer: Buffer): PdfType {
  // Check PDF magic bytes (%PDF-)
  const pdfMagic = buffer.slice(0, 5).toString('ascii');
  if (!pdfMagic.startsWith('%PDF-')) {
    throw new Error('Invalid PDF: file does not start with PDF magic bytes');
  }

  // Return WEEKLY as default - the PDF worker will determine the actual type
  // after parsing the content with pdfplumber
  return PdfType.WEEKLY;
}

/**
 * Checks if a buffer is a valid PDF file without throwing.
 * Useful for validation checks where you want a boolean result.
 *
 * @param buffer - The file buffer to check
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
