'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleColorPicker, DateRangePicker, CalendarSelector } from '@/components/customize';
import { Button, Card } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuth } from '@/hooks/useAuth';
import { useCalendars } from '@/hooks/useCalendars';

/**
 * Customize Page - Assign colors to modules and set semester dates
 * Requirements: 7.1, 7.7, 7.8, 7.9
 */
export default function CustomizePage() {
  const router = useRouter();

  // Auth hook - Requirements: 4.1
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Calendar hook - Requirements: 4.1, 4.2, 4.4
  const { calendars, isLoading: isCalendarsLoading, fetchCalendars, createCalendar } = useCalendars();

  // Event store
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);
  const getSelectedEvents = useEventStore((state) => state.getSelectedEvents);

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
    const modules = new Set(selectedEvents.map((e) => e.moduleCode));
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
  const isValid = useMemo(() => {
    return (
      semesterStart !== null &&
      semesterEnd !== null &&
      !dateError &&
      selectedIds.size > 0
    );
  }, [semesterStart, semesterEnd, dateError, selectedIds.size]);

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

  // If no events, show empty state
  if (events.length === 0 || selectedIds.size === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-base-content mb-4">
            No Events Selected
          </h1>
          <p className="text-base-content/70 mb-6">
            Please go back and select events to customize.
          </p>
          <Button variant="primary" onClick={handleBack}>
            Go to Preview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-base-content">
          Customize Your Calendar
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          Assign colors to your modules and set your semester dates
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Module Colors */}
        <Card bordered className="h-fit">
          <ModuleColorPicker
            modules={uniqueModules}
            colors={moduleColors}
            onChange={setModuleColor}
          />
        </Card>

        {/* Right Column - Date Range */}
        <Card bordered className="h-fit">
          <DateRangePicker
            startDate={semesterStart}
            endDate={semesterEnd}
            onStartChange={setSemesterStart}
            onEndChange={setSemesterEnd}
            error={dateError}
          />
        </Card>
      </div>

      {/* Calendar Selector - Full Width Bottom */}
      {/* Requirements: 4.1, 4.2, 4.3, 4.4 */}
      {isAuthenticated && (
        <Card bordered className="mb-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Google Calendar Integration</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Select a calendar to sync your events to Google Calendar, or create a new one.
            </p>
            <CalendarSelector
              calendars={calendars}
              selectedId={selectedCalendarId}
              onSelect={setSelectedCalendarId}
              onCreate={handleCreateCalendar}
              isLoading={isCalendarsLoading}
            />
          </div>
        </Card>
      )}

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

      {!isValid && !dateError && (
        <p className="text-center text-warning text-sm mt-2">
          Please set both start and end dates to continue
        </p>
      )}
    </div>
  );
}
