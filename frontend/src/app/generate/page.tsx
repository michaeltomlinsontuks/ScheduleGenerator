'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Alert } from '@/components/common';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowGuard } from '@/hooks/useWorkflowGuard';
import { calendarService } from '@/services/calendarService';
import { formatDateRange } from '@/utils/dates';
import { getColorById } from '@/utils/colors';
import { mapEventsToConfig } from '@/utils/eventMapper';
import { clearWorkflowState, clearAllState } from '@/utils/stateManagement';

/**
 * Generate Page - Display summary and output options
 * Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.5
 */
export default function GeneratePage() {
  // Guard this page - redirect if requirements not met
  useWorkflowGuard('generate');

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
  const pdfType = useEventStore((state) => state.pdfType);

  // Config store
  const semesterStart = useConfigStore((state) => state.semesterStart);
  const semesterEnd = useConfigStore((state) => state.semesterEnd);
  const moduleColors = useConfigStore((state) => state.moduleColors);
  const selectedCalendarId = useConfigStore((state) => state.selectedCalendarId);
  const resetConfig = useConfigStore((state) => state.reset);

  // Calculate summary values
  const selectedEvents = useMemo(() => getSelectedEvents(), [getSelectedEvents, selectedIds]);

  const uniqueModules = useMemo(() => {
    const modules = new Set(selectedEvents.map((e) => e.module));
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
    // Only require semester dates for lecture mode
    if (pdfType === 'lecture' && (!semesterStart || !semesterEnd)) {
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
        semesterStart: semesterStart?.toISOString(),
        semesterEnd: semesterEnd?.toISOString(),
        pdfType: pdfType || undefined,
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
      setSuccessMessage(`Successfully generated calendar with ${selectedEvents.length} events! Your workflow state has been cleared.`);

      // Clear workflow state after successful download
      try {
        clearWorkflowState();
      } catch (clearError) {
        console.error('Failed to clear workflow state after download:', clearError);
        // Don't fail the download if state clearing fails
      }
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

    // Only require semester dates for lecture mode
    if (pdfType === 'lecture' && (!semesterStart || !semesterEnd)) {
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
        semesterStart: semesterStart?.toISOString(),
        semesterEnd: semesterEnd?.toISOString(),
        calendarId: selectedCalendarId,
        pdfType: pdfType || undefined,
      });

      setSyncStatus('success');
      setSuccessMessage(`Successfully added ${response.data.count} events to Google Calendar! Your workflow state has been cleared.`);

      // Clear workflow state after successful sync
      try {
        clearWorkflowState();
      } catch (clearError) {
        console.error('Failed to clear workflow state after sync:', clearError);
        // Don't fail the sync if state clearing fails
      }
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
    try {
      // Clear all state (workflow + config, but preserve theme)
      clearAllState();
      router.push('/upload');
    } catch (error) {
      console.error('Failed to clear state when uploading another PDF:', error);
      // Fallback to manual reset if clearAllState fails
      resetEvents();
      resetConfig();
      router.push('/upload');
    }
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
              disabled={isGeneratingIcs || (pdfType === 'lecture' && (!semesterStart || !semesterEnd))}
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
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={handleAddToGoogleCalendar}
                loading={isSyncingCalendar}
                disabled={isSyncingCalendar || (pdfType === 'lecture' && (!semesterStart || !semesterEnd)) || !selectedCalendarId}
                className="w-full"
              >
                {isSyncingCalendar ? 'Syncing...' : 'Add to Google Calendar'}
              </Button>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={login}
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
