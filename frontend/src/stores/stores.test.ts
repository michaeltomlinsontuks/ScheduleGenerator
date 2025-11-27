/**
 * Store Tests - Verify Zustand stores work correctly
 * Checkpoint 12: Review State Management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from './eventStore';
import { useConfigStore } from './configStore';
import type { ParsedEvent } from '@/types';

// Mock events for testing
const mockEvents: ParsedEvent[] = [
  {
    id: '1',
    moduleCode: 'COS 214',
    moduleName: 'Data Structures',
    eventType: 'lecture',
    dayOfWeek: 'Monday',
    startTime: '08:30',
    endTime: '10:20',
    location: 'IT 4-1',
  },
  {
    id: '2',
    moduleCode: 'COS 214',
    moduleName: 'Data Structures',
    eventType: 'tutorial',
    dayOfWeek: 'Tuesday',
    startTime: '14:30',
    endTime: '15:20',
    location: 'IT 2-3',
    group: 'T01',
  },
  {
    id: '3',
    moduleCode: 'STK 220',
    moduleName: 'Statistics',
    eventType: 'lecture',
    dayOfWeek: 'Wednesday',
    startTime: '10:30',
    endTime: '12:20',
    location: 'Aula',
  },
];

describe('eventStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEventStore.getState().reset();
  });

  it('should initialize with empty state', () => {
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
    expect(state.jobId).toBeNull();
    expect(state.jobStatus).toBeNull();
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
    useEventStore.getState().setEvents(mockEvents);
    useEventStore.getState().setJobId('job-123');
    useEventStore.getState().setJobStatus('complete');
    
    useEventStore.getState().reset();
    
    const state = useEventStore.getState();
    expect(state.events).toEqual([]);
    expect(state.selectedIds.size).toBe(0);
    expect(state.jobId).toBeNull();
    expect(state.jobStatus).toBeNull();
  });
});

describe('configStore', () => {
  beforeEach(() => {
    // Reset store before each test
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
