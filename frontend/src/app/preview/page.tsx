'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BulkActions, EventFilter } from '@/components/preview';
import { Button } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import type { ParsedEvent } from '@/types';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
const DAYS_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Preview Page - Display parsed events with selection and filtering
 * Requirements: 6.1, 6.2, 6.9, 1.1, 2.1, 3.1
 */
export default function PreviewPage() {
  const router = useRouter();
  const [filterModule, setFilterModule] = useState<string>('all');
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [activeDate, setActiveDate] = useState<string>('');

  // Event store
  const events = useEventStore((state) => state.events);
  const pdfType = useEventStore((state) => state.pdfType);
  const selectedIds = useEventStore((state) => state.selectedIds);
  const toggleEvent = useEventStore((state) => state.toggleEvent);
  const selectAll = useEventStore((state) => state.selectAll);
  const deselectAll = useEventStore((state) => state.deselectAll);

  // Config store for module colors
  const moduleColors = useConfigStore((state) => state.moduleColors);

  // Get unique modules for filter dropdown
  const uniqueModules = useMemo(() => {
    const modules = new Set(events.map((e) => e.module));
    return Array.from(modules).sort();
  }, [events]);

  // Group events by day (for lecture mode)
  const groupByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, ParsedEvent[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };

    for (const event of events) {
      if (event.day) {
        grouped[event.day as DayOfWeek].push(event);
      }
    }

    // Sort events within each day by start time
    for (const day of DAYS_ORDER) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }, [events]);

  // Group events by date (for test/exam modes)
  const groupByDate = useMemo(() => {
    const grouped: Record<string, ParsedEvent[]> = {};

    for (const event of events) {
      // For test/exam events, we need to extract the date
      // Assuming events have a 'date' field or we can derive it from other fields
      const eventDate = (event as any).date || 'Unknown Date';
      
      if (!grouped[eventDate]) {
        grouped[eventDate] = [];
      }
      grouped[eventDate].push(event);
    }

    // Sort events within each date by start time
    for (const date in grouped) {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }, [events]);

  // Get sorted date keys for test/exam modes
  const sortedDates = useMemo(() => {
    return Object.keys(groupByDate).sort((a, b) => {
      // Try to parse as dates for proper sorting
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.localeCompare(b);
    });
  }, [groupByDate]);

  // Set initial active date when dates are available
  useMemo(() => {
    if (pdfType !== 'lecture' && sortedDates.length > 0 && !activeDate) {
      setActiveDate(sortedDates[0]);
    }
  }, [pdfType, sortedDates, activeDate]);

  // Summary stats
  const totalEvents = events.length;
  const selectedCount = selectedIds.size;
  const moduleCount = uniqueModules.length;

  const handleContinue = () => {
    router.push('/customize');
  };

  const handleBack = () => {
    router.push('/upload');
  };

  // Get color hex for a module
  const getColorHex = (moduleCode: string): string | undefined => {
    const colorId = moduleColors[moduleCode];
    if (!colorId) return undefined;
    const colors: Record<string, string> = {
      '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
      '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
      '9': '#3f51b5', '10': '#0b8043', '11': '#d50000',
    };
    return colors[colorId];
  };

  // Filter events based on mode
  const filteredEvents = useMemo(() => {
    let eventsToFilter: ParsedEvent[];
    
    if (pdfType === 'lecture') {
      // Use day-based grouping for lectures
      eventsToFilter = groupByDay[activeDay];
    } else {
      // Use date-based grouping for tests/exams
      eventsToFilter = groupByDate[activeDate] || [];
    }
    
    if (filterModule && filterModule !== 'all') {
      return eventsToFilter.filter((e) => e.module === filterModule);
    }
    return eventsToFilter;
  }, [pdfType, groupByDay, groupByDate, activeDay, activeDate, filterModule]);

  // If no events, show empty state
  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-base-content mb-4">
            No Events Found
          </h1>
          <p className="text-base-content/70 mb-6">
            Please upload a PDF schedule first to preview events.
          </p>
          <Button variant="primary" onClick={handleBack}>
            Go to Upload
          </Button>
        </div>
      </div>
    );
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (pdfType) {
      case 'lecture':
        return 'Lecture Schedule Preview';
      case 'test':
        return 'Test Schedule Preview';
      case 'exam':
        return 'Exam Schedule Preview';
      default:
        return 'Preview Your Schedule';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header with Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            {getPageTitle()}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Review and select events to include
          </p>
        </div>
        
        {/* Compact Summary Stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-primary">{totalEvents}</div>
            <div className="text-base-content/60">Events</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-primary">{moduleCount}</div>
            <div className="text-base-content/60">Modules</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-primary">{selectedCount}</div>
            <div className="text-base-content/60">Selected</div>
          </div>
        </div>
      </div>

      {/* Controls: Bulk Actions and Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <BulkActions
          totalCount={totalEvents}
          selectedCount={selectedCount}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />
        
        <EventFilter
          modules={uniqueModules}
          selectedModule={filterModule}
          onChange={setFilterModule}
        />
      </div>

      {/* Day/Date Tabs - Show days for lectures, dates for tests/exams */}
      {pdfType === 'lecture' ? (
        <div className="tabs tabs-boxed mb-4 bg-base-200">
          {DAYS_ORDER.map((day) => (
            <button
              key={day}
              className={`tab ${activeDay === day ? 'tab-active' : ''}`}
              onClick={() => setActiveDay(day)}
            >
              {day}
              <span className="ml-1 text-xs opacity-70">
                ({groupByDay[day].length})
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="tabs tabs-boxed mb-4 bg-base-200 overflow-x-auto">
          {sortedDates.map((date) => (
            <button
              key={date}
              className={`tab ${activeDate === date ? 'tab-active' : ''}`}
              onClick={() => setActiveDate(date)}
            >
              {date}
              <span className="ml-1 text-xs opacity-70">
                ({groupByDate[date].length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Event List */}
      <div className="card card-border bg-base-100 min-h-[50vh]">
        <div className="card-body">
          {filteredEvents.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const EventCard = require('@/components/preview/EventCard').EventCard;
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    selected={selectedIds.has(event.id)}
                    onToggle={() => toggleEvent(event.id)}
                    colorHex={getColorHex(event.module)}
                    pdfType={pdfType || undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-base-content/60">
              No events found
              {pdfType === 'lecture' ? ` for ${activeDay}` : ` on ${activeDate}`}
              {filterModule && filterModule !== 'all' ? ` in ${filterModule}` : ''}.
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={selectedCount === 0}
        >
          Continue →
        </Button>
      </div>

      {selectedCount === 0 && (
        <p className="text-center text-warning text-sm mt-2">
          Please select at least one event to continue
        </p>
      )}
    </div>
  );
}
