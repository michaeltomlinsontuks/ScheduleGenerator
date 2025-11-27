/**
 * Date formatting and validation utilities
 */

/**
 * Format a date as YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display (e.g., "Jan 15, 2025")
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date range for display (e.g., "Jan 15 - May 30, 2025")
 */
export function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 */
export function parseDate(dateStr: string): Date | null {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Validate that end date is after start date
 * Returns an error message if invalid, null if valid
 */
export function validateDateRange(start: Date | null, end: Date | null): string | null {
  if (!start || !end) {
    return null;
  }
  
  if (end <= start) {
    return 'End date must be after start date';
  }
  
  return null;
}

/**
 * Format time string (HH:MM) for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format a time range for display (e.g., "8:30 AM - 10:20 AM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
