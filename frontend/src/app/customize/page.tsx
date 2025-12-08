'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleColorPicker, DateRangePicker, CalendarSelector } from '@/components/customize';
import { Button, Card, Alert } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuth } from '@/hooks/useAuth';
import { useCalendars } from '@/hooks/useCalendars';
import { useWorkflowGuard } from '@/hooks/useWorkflowGuard';

/**
 * Customize Page - Assign colors to modules and set semester dates
 * Requirements: 7.1, 7.7, 7.8, 7.9, 1.1, 2.1, 3.1, 7.2, 7.5
 */
export default function CustomizePage() {
  const router = useRouter();

  // Workflow guard - Requirements: 7.2, 7.5
  // Redirects to preview page if no events or selections exist
  useWorkflowGuard('customize');

  // Auth hook - Requirements: 4.1
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth();

  // Calendar hook - Requirements: 4.1, 4.2, 4.4
  const { calendars, isLoading: isCalendarsLoading, error: calendarsError, fetchCalendars, createCalendar } = useCalendars();

  // Event store
  const selectedIds = useEventStore((state) => state.selectedIds);
  const getSelectedEvents = useEventStore((state) => state.getSelectedEvents);
  const pdfType = useEventStore((state) => state.pdfType);

  // Config store
  const semesterStart = useConfigStore((state) => state.semesterStart);
  const semesterEnd = useConfigStore((state) => state.semesterEnd);
  const moduleColors = useConfigStore((state) => state.moduleColors);
  const selectedCalendarId = useConfigStore((state) => state.selectedCalendarId);
  const setSemesterStart = useConfigStore((state) => state.setSemesterStart);
  const setSemesterEnd = useConfigStore((state) => state.setSemesterEnd);
  const setModuleColor = useConfigStore((state) => state.setModuleColor);
  const setSelectedCalendarId = useConfigStore((state) => state.setSelectedCalendarId);

  // Get unique modules from selected events
  const uniqueModules = useMemo(() => {
    const selectedEvents = getSelectedEvents();
    const modules = new Set(selectedEvents.map((e) => e.module));
    return Array.from(modules).sort();
  }, [getSelectedEvents, selectedIds]);

  // Validate date range
  const dateError = useMemo(() => {
    if (semesterStart && semesterEnd) {
      if (semesterEnd <= semesterStart) {
        return 'End date must be after start date';
      }
    }
    return undefined;
  }, [semesterStart, semesterEnd]);

  // Check if form is valid
  // Requirements: 1.1, 2.1, 3.1 - Only require semester dates for lecture mode
  const isValid = useMemo(() => {
    const hasSelectedEvents = selectedIds.size > 0;

    // For lecture mode, require semester dates
    if (pdfType === 'lecture') {
      return (
        semesterStart !== null &&
        semesterEnd !== null &&
        !dateError &&
        hasSelectedEvents
      );
    }

    // For test/exam modes, semester dates are not required
    return hasSelectedEvents;
  }, [pdfType, semesterStart, semesterEnd, dateError, selectedIds.size]);

  // Initialize default colors for modules that don't have one
  useEffect(() => {
    uniqueModules.forEach((module, index) => {
      if (!moduleColors[module]) {
        // Assign colors in rotation (1-11)
        const colorId = String((index % 11) + 1);
        setModuleColor(module, colorId);
      }
    });
  }, [uniqueModules, moduleColors, setModuleColor]);

  // Fetch calendars when authenticated - Requirements: 4.1
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchCalendars();
    }
  }, [isAuthenticated, isAuthLoading, fetchCalendars]);

  // Handle calendar creation - Requirements: 4.4
  const handleCreateCalendar = async (name: string) => {
    const newCalendar = await createCalendar(name);
    setSelectedCalendarId(newCalendar.id);
  };

  const handleBack = () => {
    router.push('/preview');
  };

  const handleGenerate = () => {
    router.push('/generate');
  };

  // Get page title based on mode - Requirements: 1.1, 2.1, 3.1
  const pageTitle = useMemo(() => {
    switch (pdfType) {
      case 'lecture':
        return 'Customize Your Lecture Schedule';
      case 'test':
        return 'Customize Your Test Schedule';
      case 'exam':
        return 'Customize Your Exam Schedule';
      default:
        return 'Customize Your Calendar';
    }
  }, [pdfType]);

  const pageSubtitle = useMemo(() => {
    if (pdfType === 'lecture') {
      return 'Assign colors to your modules and set your semester dates';
    }
    return 'Assign colors to your modules';
  }, [pdfType]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      {/* Page Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-base-content">
          {pageTitle}
        </h1>
        <p className="mt-0.5 text-sm text-base-content/70">
          {pageSubtitle}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Left Column - Module Colors */}
        <Card bordered className="h-fit">
          <ModuleColorPicker
            modules={uniqueModules}
            colors={moduleColors}
            onChange={setModuleColor}
          />
        </Card>

        {/* Right Column - Date Range & Calendar Integration */}
        <div className="space-y-3">
          {/* Conditionally render DateRangePicker only for lecture mode - Requirements: 1.1, 2.1, 3.1 */}
          {pdfType === 'lecture' ? (
            <Card bordered>
              <DateRangePicker
                startDate={semesterStart}
                endDate={semesterEnd}
                onStartChange={setSemesterStart}
                onEndChange={setSemesterEnd}
                error={dateError}
              />
            </Card>
          ) : (
            /* Show info alert for test/exam modes - Requirements: 2.1, 3.1 */
            <Alert
              type="info"
              message={
                pdfType === 'test'
                  ? 'Test schedules use fixed dates from the PDF. No semester date range is needed.'
                  : pdfType === 'exam'
                    ? 'Exam schedules use fixed dates from the PDF. No semester date range is needed.'
                    : 'Events use fixed dates from the PDF. No semester date range is needed.'
              }
            />
          )}

          {/* Calendar Selector or Login - Below Date Range */}
          {/* Requirements: 4.1, 4.2, 4.3, 4.4 */}
          <Card bordered>
            <div className="p-3">
              <h3 className="text-base font-semibold mb-1">Google Calendar Integration</h3>
              <p className="text-xs text-base-content/70 mb-2">
                {isAuthenticated
                  ? 'Select a calendar to sync your events to Google Calendar, or create a new one.'
                  : 'Sign in with Google to sync your events to Google Calendar.'}
              </p>
              {isAuthenticated ? (
                <CalendarSelector
                  calendars={calendars}
                  selectedId={selectedCalendarId}
                  onSelect={setSelectedCalendarId}
                  onCreate={handleCreateCalendar}
                  isLoading={isCalendarsLoading}
                  error={calendarsError}
                />
              ) : (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => login()}
                    className="google-signin-btn px-6 py-3"
                    aria-label="Sign in with Google"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="ml-3">Continue with Google</span>
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={!isValid}
        >
          Generate Calendar →
        </Button>
      </div>

      {!isValid && !dateError && pdfType === 'lecture' && (
        <p className="text-center text-warning text-sm mt-2">
          Please set both start and end dates to continue
        </p>
      )}
    </div>
  );
}
