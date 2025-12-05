/**
 * useJobStatus Hook - Simplified for synchronous processing
 * No longer polls - events come directly from upload response
 * Returns status in expected format for backward compatibility
 */
'use client';

import { useMemo } from 'react';
import { useEventStore } from '@/stores/eventStore';

interface JobStatusData {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string | null;
}

interface UseJobStatusReturn {
  status: JobStatusData | null;
  isPolling: boolean;
  error: string | null;
}

/**
 * Hook for getting job status (no longer polls)
 * Events now come directly from upload, so this returns the stored status
 * @param _jobId - The job ID (unused now, kept for API compatibility)
 * @returns Job status from store in expected format
 */
export function useJobStatus(_jobId: string | null): UseJobStatusReturn {
  const jobStatus = useEventStore((state) => state.jobStatus);

  return useMemo(
    () => {
      // Map the store status to expected format
      // Store uses 'complete' but backend/expected format uses 'completed'
      let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed' | null = null;
      if (jobStatus === 'complete') {
        mappedStatus = 'completed';
      } else if (jobStatus === 'pending' || jobStatus === 'processing' || jobStatus === 'failed') {
        mappedStatus = jobStatus;
      }

      return {
        status: mappedStatus ? { status: mappedStatus } : null,
        isPolling: false,
        error: null,
      };
    },
    [jobStatus]
  );
}
