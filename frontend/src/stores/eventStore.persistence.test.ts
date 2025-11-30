/**
 * EventStore Persistence Tests - Verify sessionStorage persistence
 * Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from './eventStore';
import type { ParsedEvent } from '@/types';

const mockEvents: ParsedEvent[] = [
  {
    id: '1',
    module: 'COS 214',
    activity: 'Lecture',
    day: 'Monday',
    startTime: '08:30',
    endTime: '10:20',
    venue: 'IT 4-1',
    isRecurring: true,
  },
  {
    id: '2',
    module: 'STK 220',
    activity: 'Tutorial',
    day: 'Tuesday',
    startTime: '14:30',
    endTime: '15:20',
    venue: 'IT 2-3',
    isRecurring: true,
  },
];

describe('eventStore persistence', () => {
  beforeEach(() => {
    // Clear storage and reset store
    window.sessionStorage.clear();
    useEventStore.getState().reset();
  });

  it('should persist events to sessionStorage', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    
    // Check that data is in sessionStorage
    const stored = window.sessionStorage.getItem('schedule-events');
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.state.events).toHaveLength(2);
    expect(parsed.state.pdfType).toBe('lecture');
  });

  it('should persist selectedIds as array in sessionStorage', () => {
    useEventStore.getState().setEvents(mockEvents);
    useEventStore.getState().toggleEvent('2'); // Deselect one
    
    const stored = window.sessionStorage.getItem('schedule-events');
    const parsed = JSON.parse(stored!);
    
    // Should be stored as array
    expect(Array.isArray(parsed.state.selectedIds)).toBe(true);
    expect(parsed.state.selectedIds).toContain('1');
    expect(parsed.state.selectedIds).not.toContain('2');
  });

  it('should restore selectedIds as Set from sessionStorage', () => {
    // Set up initial state with selections
    useEventStore.getState().setEvents(mockEvents);
    useEventStore.getState().toggleEvent('2'); // Deselect event 2
    
    // Verify it's stored as array in sessionStorage
    const stored = window.sessionStorage.getItem('schedule-events');
    const parsed = JSON.parse(stored!);
    expect(Array.isArray(parsed.state.selectedIds)).toBe(true);
    
    // Verify the in-memory state is a Set
    const state = useEventStore.getState();
    expect(state.selectedIds instanceof Set).toBe(true);
    expect(state.selectedIds.has('1')).toBe(true);
    expect(state.selectedIds.has('2')).toBe(false);
  });

  it('should persist job state', () => {
    useEventStore.getState().setJobId('job-123');
    useEventStore.getState().setJobStatus('processing');
    
    const stored = window.sessionStorage.getItem('schedule-events');
    const parsed = JSON.parse(stored!);
    
    expect(parsed.state.jobId).toBe('job-123');
    expect(parsed.state.jobStatus).toBe('processing');
  });

  it('should clear workflow state from sessionStorage', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    useEventStore.getState().setJobId('job-123');
    
    // Verify data is in storage
    expect(window.sessionStorage.getItem('schedule-events')).not.toBeNull();
    
    useEventStore.getState().clearWorkflowState();
    
    // Check storage is updated
    const stored = window.sessionStorage.getItem('schedule-events');
    const parsed = JSON.parse(stored!);
    
    expect(parsed.state.events).toEqual([]);
    expect(parsed.state.selectedIds).toEqual([]);
    expect(parsed.state.jobId).toBeNull();
    expect(parsed.state.pdfType).toBeNull();
  });

  it('should handle corrupted storage gracefully', () => {
    // Set invalid JSON in storage
    window.sessionStorage.setItem('schedule-events', 'invalid json');
    
    // Should not crash and should reset to initial state
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
  });

  it('should only persist specified state fields', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    
    const stored = window.sessionStorage.getItem('schedule-events');
    const parsed = JSON.parse(stored!);
    
    // Should have partialize fields
    expect(parsed.state).toHaveProperty('events');
    expect(parsed.state).toHaveProperty('selectedIds');
    expect(parsed.state).toHaveProperty('jobId');
    expect(parsed.state).toHaveProperty('jobStatus');
    expect(parsed.state).toHaveProperty('pdfType');
    
    // Should not have action methods
    expect(parsed.state).not.toHaveProperty('setEvents');
    expect(parsed.state).not.toHaveProperty('toggleEvent');
  });
});
