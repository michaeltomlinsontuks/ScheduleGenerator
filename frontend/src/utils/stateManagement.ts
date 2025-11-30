/**
 * State Management Utility
 * 
 * Provides centralized functions for clearing application state.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { useEventStore } from '@/stores/eventStore';
import { useConfigStore } from '@/stores/configStore';
import { clearWorkflowStorage } from './storage';
import { showErrorToast, showSuccessToast } from './toast';

/**
 * Clear all workflow state after successful calendar generation
 * 
 * This function clears:
 * - All events from the event store
 * - All selections
 * - Job tracking state
 * - PDF type
 * - SessionStorage data
 * 
 * This function preserves:
 * - Configuration preferences (module colors, semester dates, theme, calendar selection)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function clearWorkflowState(): void {
  try {
    // Clear event store (events, selections, job state)
    useEventStore.getState().clearWorkflowState();
    
    // Clear sessionStorage
    clearWorkflowStorage();
    
    console.log('Workflow state cleared successfully');
  } catch (error) {
    console.error('Failed to clear workflow state:', error);
    showErrorToast('Failed to clear workflow data. Please try again.');
    // Re-throw to allow caller to handle if needed
    throw error;
  }
}

/**
 * Clear all state including preferences (for "Upload Another PDF")
 * 
 * This function clears:
 * - All workflow state (via clearWorkflowState)
 * - Configuration preferences (module colors, semester dates, calendar selection)
 * 
 * This function preserves:
 * - Theme preference (user's light/dark mode choice)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function clearAllState(): void {
  try {
    // Clear workflow state first
    clearWorkflowState();
    
    // Preserve theme before resetting config
    const currentTheme = useConfigStore.getState().theme;
    
    // Clear config store
    useConfigStore.getState().reset();
    
    // Restore theme preference
    useConfigStore.getState().setTheme(currentTheme);
    
    console.log('All state cleared successfully (theme preserved)');
    showSuccessToast('All data cleared. Ready for a new schedule!');
  } catch (error) {
    console.error('Failed to clear all state:', error);
    showErrorToast('Failed to clear all data. Please refresh the page.');
    // Re-throw to allow caller to handle if needed
    throw error;
  }
}
