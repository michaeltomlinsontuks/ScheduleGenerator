/**
 * useUpload Hook - Handles PDF file upload with progress tracking
 * Requirements: 2.1, 2.2, 8.2
 */
'use client';

import { useState, useCallback } from 'react';
import { uploadService } from '@/services/uploadService';
import { useEventStore } from '@/stores/eventStore';

interface UseUploadReturn {
  upload: (file: File) => Promise<string>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for managing PDF file uploads
 * @returns Upload state and functions
 */
export function useUpload(): UseUploadReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setJobId = useEventStore((state) => state.setJobId);

  /**
   * Upload a PDF file and track progress
   * @param file - The PDF file to upload
   * @returns The job ID on success
   */
  const upload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const response = await uploadService.uploadPdf(file, setProgress);
        const jobId = response.data.jobId;
        setJobId(jobId);
        return jobId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [setJobId]
  );

  /**
   * Reset the upload state
   */
  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    upload,
    progress,
    isUploading,
    error,
    reset,
  };
}
