import { api } from './api';

/**
 * Parsed event from PDF processing
 */
export interface ParsedEvent {
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
}

/**
 * Job status response from backend
 */
export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfType: 'weekly' | 'test';
  result?: ParsedEvent[];
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

/**
 * Job service for checking processing status
 */
export const jobService = {
  /**
   * Get the current status of a processing job
   * @param jobId - The job ID to check
   */
  getStatus: (jobId: string) => api.get<JobStatus>(`/api/jobs/${jobId}`),
};
