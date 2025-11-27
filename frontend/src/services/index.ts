/**
 * API Services barrel export
 */

// Base API client and types
export { api, parseApiError } from './api';
export type { ApiError } from './api';

// Auth service
export { authService } from './authService';
export type { AuthUser, AuthStatus } from './authService';

// Upload service
export { uploadService } from './uploadService';
export type { UploadResponse } from './uploadService';

// Job service
export { jobService } from './jobService';
export type { JobStatus, ParsedEvent } from './jobService';

// Calendar service
export { calendarService } from './calendarService';
export type {
  Calendar,
  CalendarListResponse,
  EventConfig,
  GenerateIcsRequest,
  AddEventsRequest,
  AddEventsResponse,
} from './calendarService';
