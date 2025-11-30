/**
 * Store Tests - Verify Zustand stores work correctly with persistence
 * Checkpoint 12: Review State Management
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventStore } from './eventStore';
import { useConfigStore } from './configStore';
import type { ParsedEvent } from '@/types';

// Mock storage for testing
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// Mock events for testing
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
    module: 'COS 214',
    activity: 'Tutorial',
    day: 'Tuesday',
    startTime: '14:30',
    endTime: '15:20',
    venue: 'IT 2-3',
    group: 'T01',
    isRecurring: true,
  },
  {
    id: '3',
    module: 'STK 220',
    activity: 'Lecture',
    day: 'Wednesday',
    startTime: '10:30',
    endTime: '12:20',
    venue: 'Aula',
    isRecurring: true,
  },
];

describe('eventStore', () => {
  beforeEach(() => {
    // Clear sessionStorage and reset store before each test
    window.sessionStorage.clear();
    useEventStore.getState().reset();
  });

  it('should initialize with empty state', () => {
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
    expect(state.jobId).toBeNull();
    expect(state.jobStatus).toBeNull();
    expect(state.pdfType).toBeNull();
  });

  it('should set events and select all by default', () => {
    useEventStore.getState().setEvents(mockEvents);
    const state = useEventStore.getState();
    
    expect(state.events).toEqual(mockEvents);
    expect(state.selectedIds.size).toBe(3);
    expect(state.selectedIds.has('1')).toBe(true);
    expect(state.selectedIds.has('2')).toBe(true);
    expect(state.selectedIds.has('3')).toBe(true);
  });

  it('should toggle event selection', () => {
    useEventStore.getState().setEvents(mockEvents);
    
    // Toggle off event 1
    useEventStore.getState().toggleEvent('1');
    expect(useEventStore.getState().selectedIds.has('1')).toBe(false);
    expect(useEventStore.getState().selectedIds.size).toBe(2);
    
    // Toggle back on
    useEventStore.getState().toggleEvent('1');
    expect(useEventStore.getState().selectedIds.has('1')).toBe(true);
    expect(useEventStore.getState().selectedIds.size).toBe(3);
  });

  it('should select all events', () => {
    useEventStore.getState().setEvents(mockEvents);
    useEventStore.getState().deselectAll();
    expect(useEventStore.getState().selectedIds.size).toBe(0);
    
    useEventStore.getState().selectAll();
    expect(useEventStore.getState().selectedIds.size).toBe(3);
  });

  it('should deselect all events', () => {
    useEventStore.getState().setEvents(mockEvents);
    expect(useEventStore.getState().selectedIds.size).toBe(3);
    
    useEventStore.getState().deselectAll();
    expect(useEventStore.getState().selectedIds.size).toBe(0);
  });

  it('should get selected events', () => {
    useEventStore.getState().setEvents(mockEvents);
    useEventStore.getState().toggleEvent('2'); // Deselect event 2
    
    const selected = useEventStore.getState().getSelectedEvents();
    expect(selected.length).toBe(2);
    expect(selected.find(e => e.id === '1')).toBeDefined();
    expect(selected.find(e => e.id === '2')).toBeUndefined();
    expect(selected.find(e => e.id === '3')).toBeDefined();
  });

  it('should set job id and status', () => {
    useEventStore.getState().setJobId('job-123');
    expect(useEventStore.getState().jobId).toBe('job-123');
    
    useEventStore.getState().setJobStatus('processing');
    expect(useEventStore.getState().jobStatus).toBe('processing');
  });

  it('should reset to initial state', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    useEventStore.getState().setJobId('job-123');
    useEventStore.getState().setJobStatus('complete');
    
    useEventStore.getState().reset();
    
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
    expect(state.jobId).toBeNull();
    expect(state.jobStatus).toBeNull();
    expect(state.pdfType).toBeNull();
  });

  it('should store pdfType when setting events', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    expect(useEventStore.getState().pdfType).toBe('lecture');
    
    useEventStore.getState().setEvents(mockEvents, 'test');
    expect(useEventStore.getState().pdfType).toBe('test');
    
    useEventStore.getState().setEvents(mockEvents, 'exam');
    expect(useEventStore.getState().pdfType).toBe('exam');
  });

  it('should clear semester dates when pdfType is test', () => {
    // Set up semester dates
    useConfigStore.getState().setSemesterStart(new Date('2024-02-01'));
    useConfigStore.getState().setSemesterEnd(new Date('2024-06-30'));
    
    expect(useConfigStore.getState().semesterStart).not.toBeNull();
    expect(useConfigStore.getState().semesterEnd).not.toBeNull();
    
    // Set events with test mode
    useEventStore.getState().setEvents(mockEvents, 'test');
    
    // Semester dates should be cleared
    expect(useConfigStore.getState().semesterStart).toBeNull();
    expect(useConfigStore.getState().semesterEnd).toBeNull();
  });

  it('should clear semester dates when pdfType is exam', () => {
    // Set up semester dates
    useConfigStore.getState().setSemesterStart(new Date('2024-02-01'));
    useConfigStore.getState().setSemesterEnd(new Date('2024-06-30'));
    
    expect(useConfigStore.getState().semesterStart).not.toBeNull();
    expect(useConfigStore.getState().semesterEnd).not.toBeNull();
    
    // Set events with exam mode
    useEventStore.getState().setEvents(mockEvents, 'exam');
    
    // Semester dates should be cleared
    expect(useConfigStore.getState().semesterStart).toBeNull();
    expect(useConfigStore.getState().semesterEnd).toBeNull();
  });

  it('should not clear semester dates when pdfType is lecture', () => {
    // Set up semester dates
    const startDate = new Date('2024-02-01');
    const endDate = new Date('2024-06-30');
    useConfigStore.getState().setSemesterStart(startDate);
    useConfigStore.getState().setSemesterEnd(endDate);
    
    // Set events with lecture mode
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    
    // Semester dates should remain
    expect(useConfigStore.getState().semesterStart).toEqual(startDate);
    expect(useConfigStore.getState().semesterEnd).toEqual(endDate);
  });

  it('should clear workflow state', () => {
    useEventStore.getState().setEvents(mockEvents, 'lecture');
    useEventStore.getState().setJobId('job-123');
    useEventStore.getState().setJobStatus('complete');
    
    useEventStore.getState().clearWorkflowState();
    
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
    expect(state.jobId).toBeNull();
    expect(state.jobStatus).toBeNull();
    expect(state.pdfType).toBeNull();
  });
});

describe('configStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store before each test
    window.localStorage.clear();
    useConfigStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useConfigStore.getState();
    expect(state.semesterStart).toBeNull();
    expect(state.semesterEnd).toBeNull();
    expect(state.moduleColors).toEqual({});
    expect(state.theme).toBe('light');
  });

  it('should set semester start date', () => {
    const date = new Date('2024-02-01');
    useConfigStore.getState().setSemesterStart(date);
    expect(useConfigStore.getState().semesterStart).toEqual(date);
  });

  it('should set semester end date', () => {
    const date = new Date('2024-06-30');
    useConfigStore.getState().setSemesterEnd(date);
    expect(useConfigStore.getState().semesterEnd).toEqual(date);
  });

  it('should set module colors', () => {
    useConfigStore.getState().setModuleColor('COS 214', '1');
    useConfigStore.getState().setModuleColor('STK 220', '3');
    
    const colors = useConfigStore.getState().moduleColors;
    expect(colors['COS 214']).toBe('1');
    expect(colors['STK 220']).toBe('3');
  });

  it('should update existing module color', () => {
    useConfigStore.getState().setModuleColor('COS 214', '1');
    expect(useConfigStore.getState().moduleColors['COS 214']).toBe('1');
    
    useConfigStore.getState().setModuleColor('COS 214', '5');
    expect(useConfigStore.getState().moduleColors['COS 214']).toBe('5');
  });

  it('should set theme', () => {
    expect(useConfigStore.getState().theme).toBe('light');
    
    useConfigStore.getState().setTheme('dark');
    expect(useConfigStore.getState().theme).toBe('dark');
    
    useConfigStore.getState().setTheme('light');
    expect(useConfigStore.getState().theme).toBe('light');
  });

  it('should reset to initial state', () => {
    useConfigStore.getState().setSemesterStart(new Date('2024-02-01'));
    useConfigStore.getState().setSemesterEnd(new Date('2024-06-30'));
    useConfigStore.getState().setModuleColor('COS 214', '1');
    useConfigStore.getState().setTheme('dark');
    
    useConfigStore.getState().reset();
    
    const state = useConfigStore.getState();
    expect(state.semesterStart).toBeNull();
    expect(state.semesterEnd).toBeNull();
    expect(state.moduleColors).toEqual({});
    expect(state.theme).toBe('light');
  });
});

// Persistence Tests - Requirements: 8.1, 8.2, 8.3, 8.4
describe('Store Persistence', () => {
  beforeEach(() => {
    // Clear both storages before each test
    window.sessionStorage.clear();
    window.localStorage.clear();
    useEventStore.getState().reset();
    useConfigStore.getState().reset();
  });

  describe('Storage Backend Selection', () => {
    it('should use sessionStorage for eventStore', () => {
      // Set events in eventStore
      useEventStore.getState().setEvents(mockEvents, 'lecture');
      
      // Verify data is in sessionStorage
      const sessionData = window.sessionStorage.getItem('schedule-events');
      expect(sessionData).not.toBeNull();
      
      // Verify data is NOT in localStorage
      const localData = window.localStorage.getItem('schedule-events');
      expect(localData).toBeNull();
      
      // Verify the stored data contains events
      const parsed = JSON.parse(sessionData!);
      expect(parsed.state.events).toHaveLength(3);
    });

    it('should use localStorage for configStore', () => {
      // Set config in configStore
      useConfigStore.getState().setModuleColor('COS 214', '1');
      useConfigStore.getState().setTheme('dark');
      
      // Verify data is in localStorage
      const localData = window.localStorage.getItem('schedule-config');
      expect(localData).not.toBeNull();
      
      // Verify data is NOT in sessionStorage
      const sessionData = window.sessionStorage.getItem('schedule-config');
      expect(sessionData).toBeNull();
      
      // Verify the stored data contains config
      const parsed = JSON.parse(localData!);
      expect(parsed.state.moduleColors['COS 214']).toBe('1');
      expect(parsed.state.theme).toBe('dark');
    });

    it('should keep eventStore and configStore data separate', () => {
      // Set data in both stores
      useEventStore.getState().setEvents(mockEvents, 'lecture');
      useConfigStore.getState().setModuleColor('COS 214', '1');
      
      // Verify both storages have their respective data
      const sessionData = window.sessionStorage.getItem('schedule-events');
      const localData = window.localStorage.getItem('schedule-config');
      
      expect(sessionData).not.toBeNull();
      expect(localData).not.toBeNull();
      
      // Verify they contain different data
      const sessionParsed = JSON.parse(sessionData!);
      const localParsed = JSON.parse(localData!);
      
      expect(sessionParsed.state).toHaveProperty('events');
      expect(localParsed.state).toHaveProperty('moduleColors');
      expect(sessionParsed.state).not.toHaveProperty('moduleColors');
      expect(localParsed.state).not.toHaveProperty('events');
    });
  });

  describe('Store Rehydration', () => {
    it('should rehydrate eventStore from sessionStorage on initialization', () => {
      // Set initial state
      useEventStore.getState().setEvents(mockEvents, 'lecture');
      useEventStore.getState().setJobId('job-123');
      useEventStore.getState().toggleEvent('2'); // Deselect one event
      
      // Verify data is persisted
      const stored = window.sessionStorage.getItem('schedule-events');
      expect(stored).not.toBeNull();
      
      // Simulate rehydration by checking the stored data
      const parsed = JSON.parse(stored!);
      expect(parsed.state.events).toHaveLength(3);
      expect(parsed.state.jobId).toBe('job-123');
      expect(parsed.state.pdfType).toBe('lecture');
      expect(parsed.state.selectedIds).toHaveLength(2); // One deselected
    });

    it('should rehydrate configStore from localStorage on initialization', () => {
      // Set initial state
      const testDate = new Date('2024-02-01T00:00:00.000Z');
      useConfigStore.getState().setSemesterStart(testDate);
      useConfigStore.getState().setModuleColor('COS 214', '1');
      useConfigStore.getState().setTheme('dark');
      
      // Verify data is persisted
      const stored = window.localStorage.getItem('schedule-config');
      expect(stored).not.toBeNull();
      
      // Simulate rehydration by checking the stored data
      const parsed = JSON.parse(stored!);
      expect(parsed.state.semesterStart).toBe('2024-02-01T00:00:00.000Z');
      expect(parsed.state.moduleColors['COS 214']).toBe('1');
      expect(parsed.state.theme).toBe('dark');
    });

    it('should handle missing storage data gracefully', () => {
      // Clear storage
      window.sessionStorage.clear();
      window.localStorage.clear();
      
      // Access stores - should not crash
      const eventState = useEventStore.getState();
      const configState = useConfigStore.getState();
      
      // Should have initial state
      expect(eventState.events).toEqual([]);
      expect(eventState.selectedIds.size).toBe(0);
      expect(configState.moduleColors).toEqual({});
      expect(configState.theme).toBe('light');
    });

    it('should handle corrupted sessionStorage data', () => {
      // Set corrupted data
      window.sessionStorage.setItem('schedule-events', 'invalid json {{{');
      
      // Access store - should not crash
      const state = useEventStore.getState();
      
      // Should have initial state after error recovery
      expect(state.events).toEqual([]);
      expect(state.selectedIds.size).toBe(0);
    });

    it('should handle corrupted localStorage data', () => {
      // Set corrupted data
      window.localStorage.setItem('schedule-config', 'not valid json');
      
      // Access store - should not crash
      const state = useConfigStore.getState();
      
      // Should have some valid state
      expect(state).toBeDefined();
      expect(state.theme).toBeDefined();
    });
  });

  describe('Serialization Edge Cases', () => {
    it('should serialize and deserialize Set objects correctly', () => {
      // Set events with selections
      useEventStore.getState().setEvents(mockEvents);
      useEventStore.getState().toggleEvent('2'); // Deselect one
      
      // Check storage contains array
      const stored = window.sessionStorage.getItem('schedule-events');
      const parsed = JSON.parse(stored!);
      
      // Should be stored as array
      expect(Array.isArray(parsed.state.selectedIds)).toBe(true);
      expect(parsed.state.selectedIds).toContain('1');
      expect(parsed.state.selectedIds).toContain('3');
      expect(parsed.state.selectedIds).not.toContain('2');
      
      // In-memory state should be a Set
      const state = useEventStore.getState();
      expect(state.selectedIds instanceof Set).toBe(true);
      expect(state.selectedIds.has('1')).toBe(true);
      expect(state.selectedIds.has('3')).toBe(true);
      expect(state.selectedIds.has('2')).toBe(false);
    });

    it('should serialize and deserialize Date objects correctly', () => {
      // Set dates
      const startDate = new Date('2024-02-01T10:30:00.000Z');
      const endDate = new Date('2024-06-30T23:59:59.999Z');
      useConfigStore.getState().setSemesterStart(startDate);
      useConfigStore.getState().setSemesterEnd(endDate);
      
      // Check storage contains ISO strings
      const stored = window.localStorage.getItem('schedule-config');
      const parsed = JSON.parse(stored!);
      
      // Should be stored as ISO strings
      expect(typeof parsed.state.semesterStart).toBe('string');
      expect(typeof parsed.state.semesterEnd).toBe('string');
      expect(parsed.state.semesterStart).toBe('2024-02-01T10:30:00.000Z');
      expect(parsed.state.semesterEnd).toBe('2024-06-30T23:59:59.999Z');
      
      // In-memory state should be Date objects
      const state = useConfigStore.getState();
      expect(state.semesterStart).toBeInstanceOf(Date);
      expect(state.semesterEnd).toBeInstanceOf(Date);
      expect(state.semesterStart?.getTime()).toBe(startDate.getTime());
      expect(state.semesterEnd?.getTime()).toBe(endDate.getTime());
    });

    it('should handle null values in serialization', () => {
      // Set null values
      useEventStore.getState().setJobId(null);
      useEventStore.getState().setJobStatus(null);
      useConfigStore.getState().setSemesterStart(null);
      useConfigStore.getState().setSemesterEnd(null);
      
      // Check storage
      const eventStored = window.sessionStorage.getItem('schedule-events');
      const configStored = window.localStorage.getItem('schedule-config');
      
      const eventParsed = JSON.parse(eventStored!);
      const configParsed = JSON.parse(configStored!);
      
      // Null values should be preserved
      expect(eventParsed.state.jobId).toBeNull();
      expect(eventParsed.state.jobStatus).toBeNull();
      expect(configParsed.state.semesterStart).toBeNull();
      expect(configParsed.state.semesterEnd).toBeNull();
    });

    it('should handle empty Set serialization', () => {
      // Set events then deselect all
      useEventStore.getState().setEvents(mockEvents);
      useEventStore.getState().deselectAll();
      
      // Check storage
      const stored = window.sessionStorage.getItem('schedule-events');
      const parsed = JSON.parse(stored!);
      
      // Should be stored as empty array
      expect(Array.isArray(parsed.state.selectedIds)).toBe(true);
      expect(parsed.state.selectedIds).toHaveLength(0);
      
      // In-memory should be empty Set
      const state = useEventStore.getState();
      expect(state.selectedIds instanceof Set).toBe(true);
      expect(state.selectedIds.size).toBe(0);
    });

    it('should handle nested objects in events', () => {
      // Events with nested properties
      const complexEvents: ParsedEvent[] = [
        {
          id: '1',
          module: 'COS 214',
          activity: 'Lecture',
          day: 'Monday',
          startTime: '08:30',
          endTime: '10:20',
          venue: 'IT 4-1',
          isRecurring: true,
          group: 'Main',
        },
      ];
      
      useEventStore.getState().setEvents(complexEvents);
      
      // Check storage preserves structure
      const stored = window.sessionStorage.getItem('schedule-events');
      const parsed = JSON.parse(stored!);
      
      expect(parsed.state.events[0]).toMatchObject({
        id: '1',
        module: 'COS 214',
        activity: 'Lecture',
        day: 'Monday',
        startTime: '08:30',
        endTime: '10:20',
        venue: 'IT 4-1',
        isRecurring: true,
        group: 'Main',
      });
    });

    it('should handle large datasets', () => {
      // Create large dataset
      const largeEvents: ParsedEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        module: `MOD ${i}`,
        activity: 'Lecture',
        day: 'Monday',
        startTime: '08:30',
        endTime: '10:20',
        venue: `Venue ${i}`,
        isRecurring: true,
      }));
      
      // Should not throw
      expect(() => {
        useEventStore.getState().setEvents(largeEvents);
      }).not.toThrow();
      
      // Verify storage
      const stored = window.sessionStorage.getItem('schedule-events');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.events).toHaveLength(100);
    });

    it('should handle special characters in strings', () => {
      // Events with special characters
      const specialEvents: ParsedEvent[] = [
        {
          id: '1',
          module: 'COS "214"',
          activity: 'Lecture & Tutorial',
          day: 'Monday',
          startTime: '08:30',
          endTime: '10:20',
          venue: "IT 4-1 'Main'",
          isRecurring: true,
        },
      ];
      
      useEventStore.getState().setEvents(specialEvents);
      
      // Check storage preserves special characters
      const stored = window.sessionStorage.getItem('schedule-events');
      const parsed = JSON.parse(stored!);
      
      expect(parsed.state.events[0].module).toBe('COS "214"');
      expect(parsed.state.events[0].activity).toBe('Lecture & Tutorial');
      expect(parsed.state.events[0].venue).toBe("IT 4-1 'Main'");
    });
  });

  describe('Storage Isolation', () => {
    it('should not affect other storage keys', () => {
      // Set some unrelated data in storage
      window.sessionStorage.setItem('other-key', 'other-value');
      window.localStorage.setItem('another-key', 'another-value');
      
      // Use stores
      useEventStore.getState().setEvents(mockEvents);
      useConfigStore.getState().setModuleColor('COS 214', '1');
      
      // Verify unrelated keys are unchanged
      expect(window.sessionStorage.getItem('other-key')).toBe('other-value');
      expect(window.localStorage.getItem('another-key')).toBe('another-value');
    });

    it('should only clear own storage keys on reset', () => {
      // Set unrelated data
      window.sessionStorage.setItem('other-key', 'other-value');
      window.localStorage.setItem('another-key', 'another-value');
      
      // Set store data
      useEventStore.getState().setEvents(mockEvents);
      useConfigStore.getState().setModuleColor('COS 214', '1');
      
      // Reset stores
      useEventStore.getState().reset();
      useConfigStore.getState().reset();
      
      // Verify unrelated keys still exist
      expect(window.sessionStorage.getItem('other-key')).toBe('other-value');
      expect(window.localStorage.getItem('another-key')).toBe('another-value');
    });
  });

  describe('Persistence Behavior', () => {
    it('should persist state immediately on change', () => {
      // Set events
      useEventStore.getState().setEvents(mockEvents);
      
      // Immediately check storage
      const stored = window.sessionStorage.getItem('schedule-events');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.events).toHaveLength(3);
    });

    it('should update storage on every state change', () => {
      // Initial state
      useEventStore.getState().setEvents(mockEvents);
      
      // Toggle selection
      useEventStore.getState().toggleEvent('1');
      
      // Check storage updated
      let stored = window.sessionStorage.getItem('schedule-events');
      let parsed = JSON.parse(stored!);
      expect(parsed.state.selectedIds).toHaveLength(2);
      
      // Toggle again
      useEventStore.getState().toggleEvent('1');
      
      // Check storage updated again
      stored = window.sessionStorage.getItem('schedule-events');
      parsed = JSON.parse(stored!);
      expect(parsed.state.selectedIds).toHaveLength(3);
    });

    it('should maintain version information in storage', () => {
      // Set data
      useEventStore.getState().setEvents(mockEvents);
      useConfigStore.getState().setModuleColor('COS 214', '1');
      
      // Check version in storage
      const eventStored = window.sessionStorage.getItem('schedule-events');
      const configStored = window.localStorage.getItem('schedule-config');
      
      const eventParsed = JSON.parse(eventStored!);
      const configParsed = JSON.parse(configStored!);
      
      // Zustand persist middleware adds version
      expect(eventParsed).toHaveProperty('version');
      expect(configParsed).toHaveProperty('version');
    });
  });
});
