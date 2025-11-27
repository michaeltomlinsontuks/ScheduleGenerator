'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Alert } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuth } from '@/hooks/useAuth';
import { calendarService } from '@/services/calendarService';
import { formatDateRange } from '@/utils/dates';
import { getColorById } from '@/utils/colors';
import { mapEventsToConfig } from '@/utils/eventMapper';

/**
 * Generate Page - Display summary and output options
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3
 */
export default function GeneratePage() {
  const router = useRouter();
  const [isGeneratingIcs, setIsGeneratingIcs] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auth hook
  const { isAuthenticated, login } = useAuth();

  // Event store
  const events = useEventStore((state) => state.events);
  const selectedIds = useEventStore((state) => state.selectedIds);
  const getSelectedEvents = useEventStore((state) => state.getSelectedEvents);
  const resetEvents = useEventStore((state) => state.reset);

  // Config store
  const semesterStart = useConfigStore((state) => state.semesterStart);
  const semesterEnd = useConfigStore((state) => state.semesterEnd);
  const moduleColors = useConfigStore((state) => state.moduleColors);
  const selectedCalendarId = useConfigStore((state) => state.selectedCalendarId);
  const resetConfig = useConfigStore((state) => state.reset);

  // Calculate summary values
  const selectedEvents = useMemo(() => getSelectedEvents(), [getSelectedEvents, selectedIds]);
  
  const uniqueModules = useMemo(() => {
    const modules = new Set(selectedEvents.map((e) => e.moduleCode));
    return Array.from(modules).sort();
  }, [selectedEvents]);

  const dateRangeDisplay = useMemo(() => {
    if (semesterStart && semesterEnd) {
      return formatDateRange(semesterStart, semesterEnd);
    }
    return 'Not set';
  }, [semesterStart, semesterEnd]);

  // Handle ICS download using backend API
  const handleDownloadICS = async () => {
    if (!semesterStart || !semesterEnd) {
      setErrorMessage('Please set semester dates before generating the calendar.');
      setDownloadStatus('error');
      return;
    }

    setIsGeneratingIcs(true);
    setDownloadStatus('idle');
    setErrorMessage(null);

    try {
      // Map events to EventConfig format
      const eventConfigs = mapEventsToConfig(selectedEvents, moduleColors);
      
      // Call backend API to generate ICS
      const response = await calendarService.generateIcs({
        events: eventConfigs,
        semesterStart: semesterStart.toISOString(),
        semesterEnd: semesterEnd.toISOString(),
      });

      // Handle blob response and trigger download
      const blob = new Blob([response.data], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'schedule.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadStatus('success');
      setSuccessMessage(`Successfully generated calendar with ${selectedEvents.length} events!`);
    } catch (error) {
      console.error('Failed to generate ICS:', error);
      setDownloadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate calendar. Please try again.');
    } finally {
      setIsGeneratingIcs(false);
    }
  };

  // Handle Google Calendar sync
  const handleAddToGoogleCalendar = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!semesterStart || !semesterEnd) {
      setErrorMessage('Please set semester dates before syncing to Google Calendar.');
      setSyncStatus('error');
      return;
    }

    if (!selectedCalendarId) {
      setErrorMessage('Please select a calendar in the customize step.');
      setSyncStatus('error');
      return;
    }

    setIsSyncingCalendar(true);
    setSyncStatus('idle');
    setErrorMessage(null);

    try {
      // Map events to EventConfig format
      const eventConfigs = mapEventsToConfig(selectedEvents, moduleColors);
      
      // Call backend API to add events to Google Calendar
      const response = await calendarService.addEvents({
        events: eventConfigs,
        semesterStart: semesterStart.toISOString(),
        semesterEnd: semesterEnd.toISOString(),
        calendarId: selectedCalendarId,
      });

      setSyncStatus('success');
      setSuccessMessage(`Successfully added ${response.data.count} events to Google Calendar!`);
    } catch (error) {
      console.error('Failed to sync to Google Calendar:', error);
      setSyncStatus('error');
      
      // Handle 401 error with re-auth prompt
      const errorMsg = error instanceof Error ? error.message : 'Failed to sync to Google Calendar.';
      if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized')) {
        setErrorMessage('Your session has expired. Please sign in again to sync to Google Calendar.');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Handle upload another PDF
  const handleUploadAnother = () => {
    resetEvents();
    resetConfig();
    router.push('/upload');
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/customize');
  };

  // Clear alerts
  const clearAlerts = () => {
    setDownloadStatus('idle');
    setSyncStatus('idle');
    setErrorMessage(null);
    setSuccessMessage(null);
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
            Please go back and select events to generate your calendar.
          </p>
          <Button variant="primary" onClick={() => router.push('/preview')}>
            Go to Preview
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-base-content">
          Generate Your Calendar
        </h1>
        <p className="mt-2 text-base-content/70">
          Review your configuration and download your calendar
        </p>
      </div>

      {/* Status Alerts */}
      {(downloadStatus === 'success' || syncStatus === 'success') && successMessage && (
        <div className="mb-6">
          <Alert
            type="success"
            message={successMessage}
            onDismiss={clearAlerts}
          />
        </div>
      )}
      
      {(downloadStatus === 'error' || syncStatus === 'error') && errorMessage && (
        <div className="mb-6">
          <Alert
            type="error"
            message={errorMessage}
            onDismiss={clearAlerts}
          />
        </div>
      )}

      {/* Configuration Summary */}
      <Card bordered className="mb-6">
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Configuration Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selected Events */}
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-base-content/70">Selected Events</div>
            <div className="stat-value text-primary">{selectedEvents.length}</div>
          </div>

          {/* Module Count */}
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-base-content/70">Modules</div>
            <div className="stat-value text-primary">{uniqueModules.length}</div>
          </div>

          {/* Date Range */}
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-base-content/70">Date Range</div>
            <div className="stat-value text-sm text-primary">{dateRangeDisplay}</div>
          </div>
        </div>

        {/* Module Colors Preview */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-base-content/70 mb-2">Module Colors</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueModules.map((module) => {
              const colorId = moduleColors[module] || '1';
              const color = getColorById(colorId);
              return (
                <div
                  key={module}
                  className="flex items-center gap-2 px-3 py-1 bg-base-200 rounded-full"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color?.hex || '#7986cb' }}
                  />
                  <span className="text-sm text-base-content">{module}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Output Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Download ICS Card */}
        <Card bordered className="hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Download ICS
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              Download as an ICS file to import into any calendar app
            </p>
            <Button
              variant="primary"
              onClick={handleDownloadICS}
              loading={isGeneratingIcs}
              disabled={isGeneratingIcs || !semesterStart || !semesterEnd}
              className="w-full"
            >
              {isGeneratingIcs ? 'Generating...' : 'Download ICS File'}
            </Button>
          </div>
        </Card>

        {/* Google Calendar Card */}
        <Card bordered className="hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Add to Google Calendar
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              {isAuthenticated 
                ? 'Sync directly to your Google Calendar account'
                : 'Sign in with Google to sync your calendar'}
            </p>
            <Button
              variant={isAuthenticated ? 'primary' : 'outline'}
              onClick={handleAddToGoogleCalendar}
              loading={isSyncingCalendar}
              disabled={isSyncingCalendar || (isAuthenticated && (!semesterStart || !semesterEnd || !selectedCalendarId))}
              className="w-full"
            >
              {isSyncingCalendar 
                ? 'Syncing...' 
                : isAuthenticated 
                  ? 'Add to Google Calendar' 
                  : 'Sign in with Google'}
            </Button>
            {isAuthenticated && !selectedCalendarId && (
              <p className="text-xs text-warning mt-2">
                Please select a calendar in the customize step
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <Button variant="ghost" onClick={handleBack}>
          ← Back
        </Button>
        
        <Button variant="secondary" onClick={handleUploadAnother}>
          Upload Another PDF
        </Button>
      </div>
    </div>
  );
}
