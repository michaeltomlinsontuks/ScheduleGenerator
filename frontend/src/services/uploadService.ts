import { api } from './api';
import type { ParsedEvent } from '@/types';

/**
 * Response from PDF upload endpoint - now includes events directly
 */
export interface UploadResponse {
  jobId: string;
  pdfType: 'lecture' | 'test' | 'exam';
  status: 'completed' | 'failed';
  events: ParsedEvent[];
  message: string;
}

/**
 * Upload service for PDF file operations
 */
export const uploadService = {
  /**
   * Upload a PDF file for processing
   * Returns parsed events immediately (synchronous processing)
   * @param file - The PDF file to upload
   * @param onProgress - Optional callback for upload progress (0-100)
   */
  uploadPdf: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<UploadResponse>('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },
};
