/**
 * Type definitions for UP Schedule Generator V3 Frontend
 */

/**
 * A schedule event extracted from the PDF
 * Matches the backend ParsedEvent structure
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
 * Processing job status from the backend
 */
export interface ProcessingJob {
  jobId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress?: number;
  events?: ParsedEvent[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Request payload for generating calendar output
 */
export interface GenerateRequest {
  events: ParsedEvent[];
  moduleColors: Record<string, string>;
  semesterStart: string;
  semesterEnd: string;
  outputType: 'ics' | 'google';
  calendarId?: string;
}
