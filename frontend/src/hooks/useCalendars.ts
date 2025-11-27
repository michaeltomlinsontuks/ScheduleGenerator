/**
 * useCalendars Hook - Manages Google Calendar list and creation
 * Requirements: 4.1, 4.2, 4.4, 8.4
 */
'use client';

import { useState, useCallback } from 'react';
import { calendarService, Calendar } from '@/services/calendarService';

interface UseCalendarsReturn {
  calendars: Calendar[];
  isLoading: boolean;
  error: string | null;
  fetchCalendars: () => Promise<void>;
  createCalendar: (name: string, description?: string) => Promise<Calendar>;
}

/**
 * Hook for managing Google Calendar operations
 * @returns Calendar list, loading state, error, and calendar functions
 */
export function useCalendars(): UseCalendarsReturn {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all calendars for the authenticated user
   */
  const fetchCalendars = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await calendarService.listCalendars();
      setCalendars(response.data.calendars);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendars';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new calendar and add it to the local state
   * @param name - Name for the new calendar
   * @param description - Optional description
   * @returns The created calendar
   */
  const createCalendar = useCallback(
    async (name: string, description?: string): Promise<Calendar> => {
      setError(null);

      try {
        const response = await calendarService.createCalendar(name, description);
        const newCalendar = response.data;
        setCalendars((prev) => [...prev, newCalendar]);
        return newCalendar;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create calendar';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  return {
    calendars,
    isLoading,
    error,
    fetchCalendars,
    createCalendar,
  };
}
