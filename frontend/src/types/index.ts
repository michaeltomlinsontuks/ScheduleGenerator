/**
 * Type definitions for UP Schedule Generator V3 Frontend
 */

/**
 * A schedule event extracted from the PDF
 */
export interface ParsedEvent {
  id: string;
  moduleCode: string;
  moduleName?: string;
  eventType: 'lecture' | 'tutorial' | 'practical' | 'test';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  location?: string;
  group?: string;
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
