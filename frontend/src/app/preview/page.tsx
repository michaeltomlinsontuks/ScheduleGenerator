'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper } from '@/components/layout';
import { EventList, BulkActions, EventFilter } from '@/components/preview';
import { Button, Card } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';

/**
 * Preview Page - Display parsed events with selection and filtering
 * Requirements: 6.1, 6.2, 6.9
 */
export default function PreviewPage() {
  const router = useRouter();
  const [filterModule, setFilterModule] = useState<string>('all');

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

  // If no events, show empty state
  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Stepper currentStep={2} />
        
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Stepper currentStep={2} />
      
      <div className="mt-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-base-content">
            Preview Your Schedule
          </h1>
          <p className="mt-2 text-base-content/70">
            Review and select the events you want to include in your calendar
          </p>
        </div>

        {/* Summary Card */}
        <Card bordered className="mb-6">
          <div className="flex flex-wrap gap-6 justify-center text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{totalEvents}</div>
              <div className="text-sm text-base-content/70">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{moduleCount}</div>
              <div className="text-sm text-base-content/70">Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{selectedCount}</div>
              <div className="text-sm text-base-content/70">Selected</div>
            </div>
          </div>
        </Card>

        {/* Controls: Bulk Actions and Filter */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
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

        {/* Event List */}
        <EventList
          events={events}
          selectedIds={selectedIds}
          onToggle={toggleEvent}
          filterModule={filterModule}
          moduleColors={moduleColors}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
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
    </div>
  );
}
