'use client';

/**
 * Storage Error Handling Demo Page
 * 
 * This page demonstrates the storage error handling and toast notifications
 * implemented in task 11 of the session-state-persistence spec.
 */

import { useState } from 'react';
import {
  showErrorToast,
  showWarningToast,
  showSuccessToast,
  showInfoToast,
} from '@/utils/toast';
import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { clearWorkflowState, clearAllState } from '@/utils/stateManagement';

export default function StorageTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const eventStore = useEventStore();
  const configStore = useConfigStore();

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testToastNotifications = () => {
    showInfoToast('This is an info message');
    setTimeout(() => showSuccessToast('This is a success message'), 500);
    setTimeout(() => showWarningToast('This is a warning message'), 1000);
    setTimeout(() => showErrorToast('This is an error message'), 1500);
    addResult('Displayed all toast types');
  };

  const testEventStoreOperations = () => {
    try {
      // Test setting events
      eventStore.setEvents([
        {
          id: 'test-1',
          module: 'TEST 101',
          activity: 'Lecture',
          day: 'Monday',
          startTime: '08:00',
          endTime: '10:00',
          venue: 'Test Location',
          isRecurring: true,
        },
      ], 'lecture');
      addResult('✓ Successfully set events in store');
      showSuccessToast('Events saved successfully');
    } catch (error) {
      addResult(`✗ Failed to set events: ${error}`);
    }
  };

  const testConfigStoreOperations = () => {
    try {
      // Test setting config
      configStore.setSemesterStart(new Date('2024-02-01'));
      configStore.setSemesterEnd(new Date('2024-06-30'));
      configStore.setModuleColor('TEST 101', 'blue');
      addResult('✓ Successfully set config in store');
      showSuccessToast('Configuration saved successfully');
    } catch (error) {
      addResult(`✗ Failed to set config: ${error}`);
    }
  };

  const testClearWorkflowState = () => {
    try {
      clearWorkflowState();
      addResult('✓ Successfully cleared workflow state');
    } catch (error) {
      addResult(`✗ Failed to clear workflow state: ${error}`);
    }
  };

  const testClearAllState = () => {
    try {
      clearAllState();
      addResult('✓ Successfully cleared all state');
    } catch (error) {
      addResult(`✗ Failed to clear all state: ${error}`);
    }
  };

  const testStorageQuota = () => {
    try {
      // Try to fill storage with large data
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      for (let i = 0; i < 10; i++) {
        sessionStorage.setItem(`large-data-${i}`, largeData);
      }
      addResult('✓ Storage quota test completed (no quota exceeded)');
      showInfoToast('Storage has plenty of space');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        addResult('✓ Storage quota exceeded (expected behavior)');
        showWarningToast('Storage quota exceeded - this is expected');
      } else {
        addResult(`✗ Unexpected error: ${error}`);
      }
    } finally {
      // Clean up
      for (let i = 0; i < 10; i++) {
        try {
          sessionStorage.removeItem(`large-data-${i}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  };

  const testStorageDisabled = () => {
    addResult('ℹ To test storage disabled:');
    addResult('  1. Open browser DevTools');
    addResult('  2. Go to Application/Storage tab');
    addResult('  3. Disable storage for this site');
    addResult('  4. Refresh the page');
    addResult('  5. You should see a warning toast about in-memory storage');
    showInfoToast('Check console for instructions on testing disabled storage');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-4">Storage Error Handling Test Page</h1>
            <p className="text-base-content/70 mb-6">
              This page demonstrates the storage error handling and toast notifications
              implemented for the session-state-persistence feature.
            </p>

            <div className="divider">Toast Notifications</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={testToastNotifications}
                className="btn btn-primary"
              >
                Test All Toast Types
              </button>
            </div>

            <div className="divider">Store Operations</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={testEventStoreOperations}
                className="btn btn-secondary"
              >
                Test Event Store
              </button>
              <button
                onClick={testConfigStoreOperations}
                className="btn btn-secondary"
              >
                Test Config Store
              </button>
              <button
                onClick={testClearWorkflowState}
                className="btn btn-warning"
              >
                Clear Workflow State
              </button>
              <button
                onClick={testClearAllState}
                className="btn btn-error"
              >
                Clear All State
              </button>
            </div>

            <div className="divider">Error Scenarios</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={testStorageQuota}
                className="btn btn-accent"
              >
                Test Storage Quota
              </button>
              <button
                onClick={testStorageDisabled}
                className="btn btn-accent"
              >
                Test Storage Disabled
              </button>
            </div>

            <div className="divider">Current State</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Events</div>
                  <div className="stat-value text-2xl">{eventStore.events.length}</div>
                  <div className="stat-desc">in event store</div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Selected</div>
                  <div className="stat-value text-2xl">{eventStore.selectedIds.size}</div>
                  <div className="stat-desc">events selected</div>
                </div>
              </div>
            </div>

            <div className="divider">Test Results</div>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Console Log</h3>
              <button onClick={clearResults} className="btn btn-sm btn-ghost">
                Clear
              </button>
            </div>
            
            <div className="mockup-code max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <pre data-prefix="$" className="text-base-content/50">
                  <code>No tests run yet. Click a button above to start testing.</code>
                </pre>
              ) : (
                testResults.map((result, index) => (
                  <pre key={index} data-prefix={`${index + 1}`}>
                    <code>{result}</code>
                  </pre>
                ))
              )}
            </div>

            <div className="divider">Instructions</div>
            
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-bold">Testing Tips</h3>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Toast notifications appear in the top-right corner</li>
                  <li>Check browser console for detailed error logs</li>
                  <li>Refresh the page to test state persistence</li>
                  <li>Open DevTools → Application → Storage to inspect stored data</li>
                  <li>Try disabling storage in DevTools to test fallback behavior</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
