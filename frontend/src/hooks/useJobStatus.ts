/**
 * useJobStatus Hook - Polls job status and updates event store on completion
 * Requirements: 2.3, 2.4, 2.5, 8.3
 */
'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { jobService, JobStatus } from '@/services/jobService';
import { useEventStore } from '@/stores/eventStore';
import type { ParsedEvent } from '@/types';
import { create } from 'zustand';

interface UseJobStatusReturn {
  status: JobStatus | null;
  isPolling: boolean;
  error: string | null;
}

/**
 * Map backend ParsedEvent to frontend ParsedEvent type
 */
function mapParsedEvent(event: {
  id: string;
  module: string;
  activity: string;
  group?: string;
  day?: string;
  date?: string;
  startTime: string;
  endTime: string;
  venue: string;
  isRecurring: boolean;
}): ParsedEvent {
  return {
    id: event.id,
    moduleCode: event.module,
    eventType: event.activity.toLowerCase() as ParsedEvent['eventType'],
    dayOfWeek: (event.day || 'Monday') as ParsedEvent['dayOfWeek'],
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.venue,
    group: event.group,
  };
}

// Internal store for job polling state
interface JobPollingState {
  status: JobStatus | null;
  isPolling: boolean;
  error: string | null;
  currentJobId: string | null;
  intervalId: NodeJS.Timeout | null;
  startPolling: (
    jobId: string,
    onComplete: (events: ParsedEvent[]) => void,
    onStatusChange: (status: 'pending' | 'processing' | 'complete' | 'failed') => void
  ) => void;
  stopPolling: () => void;
  reset: () => void;
}

const useJobPollingStore = create<JobPollingState>((set, get) => ({
  status: null,
  isPolling: false,
  error: null,
  currentJobId: null,
  intervalId: null,

  startPolling: (jobId, onComplete, onStatusChange) => {
    const state = get();
    
    // Stop any existing polling
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    // Reset state for new job
    set({
      status: null,
      isPolling: true,
      error: null,
      currentJobId: jobId,
    });

    const pollStatus = async () => {
      const currentState = get();
      if (currentState.currentJobId !== jobId) return;

      try {
        const response = await jobService.getStatus(jobId);
        const jobStatus = response.data;

        // Map backend status to frontend status type
        const frontendStatus =
          jobStatus.status === 'completed' ? 'complete' : jobStatus.status;
        onStatusChange(frontendStatus as 'pending' | 'processing' | 'complete' | 'failed');

        if (jobStatus.status === 'completed') {
          const intervalId = get().intervalId;
          if (intervalId) clearInterval(intervalId);
          set({ status: jobStatus, isPolling: false, intervalId: null });
          if (jobStatus.result) {
            const mappedEvents = jobStatus.result.map(mapParsedEvent);
            onComplete(mappedEvents);
          }
        } else if (jobStatus.status === 'failed') {
          const intervalId = get().intervalId;
          if (intervalId) clearInterval(intervalId);
          set({
            status: jobStatus,
            isPolling: false,
            error: jobStatus.error || 'Job processing failed',
            intervalId: null,
          });
        } else {
          set({ status: jobStatus });
        }
      } catch (err) {
        const intervalId = get().intervalId;
        if (intervalId) clearInterval(intervalId);
        set({
          isPolling: false,
          error: err instanceof Error ? err.message : 'Failed to fetch job status',
          intervalId: null,
        });
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 1 second
    const intervalId = setInterval(pollStatus, 1000);
    set({ intervalId });
  },

  stopPolling: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({ isPolling: false, intervalId: null, currentJobId: null });
  },

  reset: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({
      status: null,
      isPolling: false,
      error: null,
      currentJobId: null,
      intervalId: null,
    });
  },
}));

/**
 * Hook for polling job status
 * @param jobId - The job ID to poll, or null to disable polling
 * @returns Job status, polling state, and error
 */
export function useJobStatus(jobId: string | null): UseJobStatusReturn {
  const setEvents = useEventStore((state) => state.setEvents);
  const setJobStatus = useEventStore((state) => state.setJobStatus);
  
  const { status, isPolling, error, currentJobId, startPolling, stopPolling } =
    useJobPollingStore();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleComplete = useCallback(
    (events: ParsedEvent[]) => {
      setEvents(events);
    },
    [setEvents]
  );

  const handleStatusChange = useCallback(
    (status: 'pending' | 'processing' | 'complete' | 'failed') => {
      setJobStatus(status);
    },
    [setJobStatus]
  );

  // Start/stop polling based on jobId changes
  useEffect(() => {
    if (jobId && jobId !== currentJobId) {
      startPolling(jobId, handleComplete, handleStatusChange);
    } else if (!jobId && currentJobId) {
      stopPolling();
    }

    return () => {
      // Cleanup on unmount
      if (jobId) {
        stopPolling();
      }
    };
  }, [jobId, currentJobId, startPolling, stopPolling, handleComplete, handleStatusChange]);

  return useMemo(
    () => ({
      status,
      isPolling,
      error,
    }),
    [status, isPolling, error]
  );
}
