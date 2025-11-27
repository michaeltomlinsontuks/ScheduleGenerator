'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EventList, BulkActions, EventFilter } from '@/components/preview';
import { Button } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import type { ParsedEvent } from '@/types';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
const DAYS_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Preview Page - Display parsed events with selection and filtering
 * Requirements: 6.1, 6.2, 6.9
 */
export default function PreviewPage() {
  const router = useRouter();
  const [filterModule, setFilterModule] = useState<string>('all');
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');

  // Event store
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);
  const toggleEvent = useEventStore((state) => state.toggleEvent);
  const selectAll = useEventStore((state) => state.selectAll);
  const deselectAll = useEventStore((state) => state.deselectAll);

  // Config store for module colors
  const moduleColors = useConfigStore((state) => state.moduleColors);

  // Get unique modules for filter dropdown
  const uniqueModules = useMemo(() => {
    const modules = new Set(events.map((e) => e.moduleCode));
    return Array.from(modules).sort();
  }, [events]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, ParsedEvent[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };

    for (const event of events) {
      grouped[event.dayOfWeek as DayOfWeek].push(event);
    }

    // Sort events within each day by start time
    for (const day of DAYS_ORDER) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }, [events]);

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

  // Filter events for active day
  const filteredDayEvents = useMemo(() => {
    const dayEvents = eventsByDay[activeDay];
    if (filterModule && filterModule !== 'all') {
      return dayEvents.filter((e) => e.moduleCode === filterModule);
    }
    return dayEvents;
  }, [eventsByDay, activeDay, filterModule]);

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header with Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            Preview Your Schedule
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

      {/* Day Tabs */}
      <div className="tabs tabs-boxed mb-4 bg-base-200">
        {DAYS_ORDER.map((day) => (
          <button
            key={day}
            className={`tab ${activeDay === day ? 'tab-active' : ''}`}
            onClick={() => setActiveDay(day)}
          >
            {day}
            <span className="ml-1 text-xs opacity-70">
              ({eventsByDay[day].length})
            </span>
          </button>
        ))}
      </div>

      {/* Event List for Active Day */}
      <div className="card card-border bg-base-100 min-h-[50vh]">
        <div className="card-body">
          {filteredDayEvents.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDayEvents.map((event) => {
                const EventCard = require('@/components/preview/EventCard').EventCard;
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    selected={selectedIds.has(event.id)}
                    onToggle={() => toggleEvent(event.id)}
                    colorHex={getColorHex(event.moduleCode)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-base-content/60">
              No events found for {activeDay}
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
