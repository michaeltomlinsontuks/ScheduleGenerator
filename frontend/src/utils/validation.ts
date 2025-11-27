/**
 * File validation utilities for upload functionality
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Accepted file types
 */
export const ACCEPTED_FILE_TYPES = ['application/pdf'];

/**
 * Accepted file extension
 */
export const ACCEPTED_EXTENSION = '.pdf';

/**
 * Validate file type is PDF
 */
export function validateFileType(file: File): ValidationResult {
  const isPdf = ACCEPTED_FILE_TYPES.includes(file.type) || 
                file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION);
  
  if (!isPdf) {
    return {
      valid: false,
      error: 'Please upload a PDF file',
    };
  }
  
  return { valid: true };
}

/**
 * Validate file size is under 10MB
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File must be under 10MB',
    };
  }
  
  return { valid: true };
}

/**
 * Validate a file for upload (type and size)
 */
export function validateFile(file: File): ValidationResult {
  const typeResult = validateFileType(file);
  if (!typeResult.valid) {
    return typeResult;
  }
  
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }
  
  return { valid: true };
}

/**
 * Format file size for display (e.g., "2.5 MB", "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
