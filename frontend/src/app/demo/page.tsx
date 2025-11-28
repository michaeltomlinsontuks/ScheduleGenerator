'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Alert, Card, Loading, Modal } from '@/components/common';
import { Stepper } from '@/components/layout';
import { EventList, BulkActions, EventFilter } from '@/components/preview';
import { ModuleColorPicker, DateRangePicker } from '@/components/customize';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import type { ParsedEvent } from '@/types';

// Mock events for testing preview components
const MOCK_EVENTS: ParsedEvent[] = [
  { id: '1', module: 'COS 214', activity: 'Lecture', day: 'Monday', startTime: '08:30', endTime: '10:20', venue: 'IT 4-1', isRecurring: true },
  { id: '2', module: 'COS 214', activity: 'Practical', day: 'Tuesday', startTime: '14:30', endTime: '17:20', venue: 'IT Lab 2', group: 'P01', isRecurring: true },
  { id: '3', module: 'STK 220', activity: 'Lecture', day: 'Monday', startTime: '11:30', endTime: '12:20', venue: 'Aula', isRecurring: true },
  { id: '4', module: 'STK 220', activity: 'Tutorial', day: 'Wednesday', startTime: '09:30', endTime: '10:20', venue: 'EMB 2-150', group: 'T02', isRecurring: true },
  { id: '5', module: 'WTW 220', activity: 'Lecture', day: 'Tuesday', startTime: '08:30', endTime: '09:20', venue: 'Aula', isRecurring: true },
  { id: '6', module: 'WTW 220', activity: 'Lecture', day: 'Thursday', startTime: '08:30', endTime: '09:20', venue: 'Aula', isRecurring: true },
  { id: '7', module: 'COS 214', activity: 'Tutorial', day: 'Friday', startTime: '10:30', endTime: '11:20', venue: 'IT 4-3', group: 'T01', isRecurring: true },
];

export default function DemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [filterModule, setFilterModule] = useState<string>('all');

  // Event store for preview demo
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);
  const setEvents = useEventStore((state) => state.setEvents);
  const toggleEvent = useEventStore((state) => state.toggleEvent);
  const selectAll = useEventStore((state) => state.selectAll);
  const deselectAll = useEventStore((state) => state.deselectAll);

  // Load mock events on mount
  useEffect(() => {
    if (events.length === 0) {
      setEvents(MOCK_EVENTS, 'lecture');
    }
  }, [events.length, setEvents]);

  // Get unique modules for filter
  const uniqueModules = Array.from(new Set(events.map((e) => e.module))).sort();

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
  };

  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold">Common Components Demo</h1>
      <p className="text-base-content/70">
        This page showcases all common UI components for review.
      </p>

      {/* Button Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Component</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">States</h3>
          <div className="flex flex-wrap gap-4">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </section>

      {/* Stepper Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Stepper Component</h2>
        
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Interactive Stepper</h3>
          <Card bordered className="p-6">
            <Stepper currentStep={currentStep} />
            <div className="flex justify-center gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
              >
                Previous
              </Button>
              <Button 
                size="sm"
                disabled={currentStep === 4}
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Step States</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-base-content/70 mb-2">Step 1 (Upload) - Current</p>
              <Stepper currentStep={1} />
            </div>
            <div>
              <p className="text-sm text-base-content/70 mb-2">Step 2 (Preview) - Step 1 completed</p>
              <Stepper currentStep={2} />
            </div>
            <div>
              <p className="text-sm text-base-content/70 mb-2">Step 3 (Customize) - Steps 1-2 completed</p>
              <Stepper currentStep={3} />
            </div>
            <div>
              <p className="text-sm text-base-content/70 mb-2">Step 4 (Generate) - Steps 1-3 completed</p>
              <Stepper currentStep={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Alert Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alert Component</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Types</h3>
          <div className="space-y-2">
            <Alert type="info" message="This is an info alert message." />
            <Alert type="success" message="This is a success alert message." />
            <Alert type="warning" message="This is a warning alert message." />
            <Alert type="error" message="This is an error alert message." />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dismissible Alerts</h3>
          <div className="space-y-2">
            {!dismissedAlerts.has('dismiss-info') && (
              <Alert 
                type="info" 
                message="Click the X to dismiss this alert." 
                onDismiss={() => dismissAlert('dismiss-info')}
              />
            )}
            {!dismissedAlerts.has('dismiss-success') && (
              <Alert 
                type="success" 
                message="This success alert can be dismissed." 
                onDismiss={() => dismissAlert('dismiss-success')}
              />
            )}
          </div>
          {dismissedAlerts.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissedAlerts(new Set())}
            >
              Reset dismissed alerts
            </Button>
          )}
        </div>
      </section>

      {/* Loading Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading Component</h2>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sizes</h3>
          <div className="flex flex-wrap items-center gap-8">
            <Loading size="sm" />
            <Loading size="md" />
            <Loading size="lg" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">With Text</h3>
          <div className="space-y-2">
            <Loading size="sm" text="Loading..." />
            <Loading size="md" text="Processing your request..." />
            <Loading size="lg" text="Please wait..." />
          </div>
        </div>
      </section>


      {/* Card Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Card Component</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <h3 className="card-title">Basic Card</h3>
            <p>This is a basic card without a border.</p>
          </Card>
          
          <Card bordered>
            <h3 className="card-title">Bordered Card</h3>
            <p>This card has a visible border.</p>
          </Card>
          
          <Card bordered className="shadow-lg">
            <h3 className="card-title">Card with Shadow</h3>
            <p>This card has a border and shadow.</p>
            <div className="card-actions justify-end mt-4">
              <Button size="sm">Action</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Modal Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal Component</h2>
        
        <div className="space-y-4">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
          >
            <p className="py-4">
              This is the modal content. You can put any content here.
            </p>
            <p className="text-sm text-base-content/70">
              Click the X button, press Escape, or click outside to close.
            </p>
            <div className="modal-action">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </Modal>
        </div>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Combined Example</h2>
        
        <Card bordered>
          <h3 className="card-title">Upload Status</h3>
          <Alert type="info" message="Your file is being processed..." />
          <div className="flex items-center gap-4 mt-4">
            <Loading size="sm" text="Processing..." />
          </div>
          <div className="card-actions justify-end mt-4">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm" disabled>Continue</Button>
          </div>
        </Card>
      </section>

      {/* Preview Components Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Preview Components Demo</h2>
        <p className="text-base-content/70">
          Testing EventList, EventCard, BulkActions, and EventFilter with mock events.
        </p>

        {/* Summary Card */}
        <Card bordered className="mb-6">
          <div className="flex flex-wrap gap-6 justify-center text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <div className="text-sm text-base-content/70">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{uniqueModules.length}</div>
              <div className="text-sm text-base-content/70">Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{selectedIds.size}</div>
              <div className="text-sm text-base-content/70">Selected</div>
            </div>
          </div>
        </Card>

        {/* Controls: Bulk Actions and Filter */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <BulkActions
            totalCount={events.length}
            selectedCount={selectedIds.size}
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
        />

        {/* Reset Button */}
        <div className="mt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setEvents(MOCK_EVENTS, 'lecture')}
          >
            Reset Mock Events
          </Button>
        </div>
      </section>

      {/* Customize Components Section */}
      <CustomizeDemo uniqueModules={uniqueModules} />

      {/* Navigation to Customize Page */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Navigate to Customize Page</h2>
        <p className="text-base-content/70">
          Test the full customize page with the mock events loaded above.
        </p>
        <Link href="/customize">
          <Button variant="primary">Go to Customize Page →</Button>
        </Link>
      </section>
    </div>
  );
}

/**
 * Customize Demo Component - Tests ModuleColorPicker and DateRangePicker
 */
function CustomizeDemo({ uniqueModules }: { uniqueModules: string[] }) {
  // Config store
  const semesterStart = useConfigStore((state) => state.semesterStart);
  const semesterEnd = useConfigStore((state) => state.semesterEnd);
  const moduleColors = useConfigStore((state) => state.moduleColors);
  const setSemesterStart = useConfigStore((state) => state.setSemesterStart);
  const setSemesterEnd = useConfigStore((state) => state.setSemesterEnd);
  const setModuleColor = useConfigStore((state) => state.setModuleColor);
  const reset = useConfigStore((state) => state.reset);

  // Date validation
  const dateError = semesterStart && semesterEnd && semesterEnd <= semesterStart
    ? 'End date must be after start date'
    : undefined;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Customize Components Demo</h2>
      <p className="text-base-content/70">
        Testing ModuleColorPicker and DateRangePicker with localStorage persistence.
      </p>

      {/* Module Color Picker */}
      <Card bordered className="mb-6">
        <ModuleColorPicker
          modules={uniqueModules}
          colors={moduleColors}
          onChange={setModuleColor}
        />
      </Card>

      {/* Date Range Picker */}
      <Card bordered className="mb-6">
        <DateRangePicker
          startDate={semesterStart}
          endDate={semesterEnd}
          onStartChange={setSemesterStart}
          onEndChange={setSemesterEnd}
          error={dateError}
        />
      </Card>

      {/* Current Config State */}
      <Card bordered className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Current Config State (from localStorage)</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Semester Start:</strong> {semesterStart?.toLocaleDateString() || 'Not set'}</p>
          <p><strong>Semester End:</strong> {semesterEnd?.toLocaleDateString() || 'Not set'}</p>
          <p><strong>Module Colors:</strong></p>
          <pre className="bg-base-200 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(moduleColors, null, 2)}
          </pre>
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset Config
          </Button>
        </div>
      </Card>
    </section>
  );
}
