/**
 * useUpload Hook - Handles PDF file upload with progress tracking
 * Now returns events directly from synchronous processing
 */
'use client';

import { useState, useCallback } from 'react';
import { uploadService } from '@/services/uploadService';
import { useEventStore } from '@/stores/eventStore';
import type { ParsedEvent } from '@/types';

interface UseUploadReturn {
  upload: (file: File) => Promise<ParsedEvent[]>;
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
  const setEvents = useEventStore((state) => state.setEvents);
  const setJobId = useEventStore((state) => state.setJobId);
  const setJobStatus = useEventStore((state) => state.setJobStatus);

  /**
   * Upload a PDF file and get events directly
   * @param file - The PDF file to upload
   * @returns The parsed events on success
   */
  const upload = useCallback(
    async (file: File): Promise<ParsedEvent[]> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const response = await uploadService.uploadPdf(file, setProgress);
        const { jobId, events, pdfType, status } = response.data;

        // Store job ID for reference
        setJobId(jobId);

        if (status === 'completed' && events) {
          // Set events and mark as complete
          setEvents(events, pdfType);
          setJobStatus('complete');
          return events;
        } else {
          throw new Error('Processing failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        setJobStatus('failed');
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [setEvents, setJobId, setJobStatus]
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
