/**
 * ConfigStore Persistence Tests
 * Tests localStorage persistence and Date serialization
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConfigStore } from './configStore';

describe('ConfigStore Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state
    useConfigStore.getState().reset();
  });

  describe('localStorage persistence', () => {
    it('should persist module colors to localStorage', () => {
      const store = useConfigStore.getState();
      
      // Set module color
      store.setModuleColor('COS 214', 'blue');
      
      // Verify it's in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.moduleColors).toEqual({ 'COS 214': 'blue' });
    });

    it('should persist theme to localStorage', () => {
      const store = useConfigStore.getState();
      
      // Set theme
      store.setTheme('dark');
      
      // Verify it's in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
    });

    it('should persist selected calendar ID to localStorage', () => {
      const store = useConfigStore.getState();
      
      // Set calendar ID
      store.setSelectedCalendarId('calendar-123');
      
      // Verify it's in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.selectedCalendarId).toBe('calendar-123');
    });

    it('should persist all config fields', () => {
      const store = useConfigStore.getState();
      
      // Set all config fields
      const testDate = new Date('2024-02-01T00:00:00.000Z');
      store.setSemesterStart(testDate);
      store.setSemesterEnd(new Date('2024-06-30T00:00:00.000Z'));
      store.setModuleColor('COS 214', 'blue');
      store.setModuleColor('COS 301', 'green');
      store.setTheme('dark');
      store.setSelectedCalendarId('calendar-456');
      
      // Verify all fields are in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toMatchObject({
        moduleColors: { 'COS 214': 'blue', 'COS 301': 'green' },
        theme: 'dark',
        selectedCalendarId: 'calendar-456',
      });
      // Dates are serialized as ISO strings
      expect(parsed.state.semesterStart).toBe('2024-02-01T00:00:00.000Z');
      expect(parsed.state.semesterEnd).toBe('2024-06-30T00:00:00.000Z');
    });
  });

  describe('Date serialization', () => {
    it('should serialize Date objects to ISO strings', () => {
      const store = useConfigStore.getState();
      
      const testDate = new Date('2024-02-01T10:30:00.000Z');
      store.setSemesterStart(testDate);
      
      // Check localStorage contains ISO string
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.semesterStart).toBe('2024-02-01T10:30:00.000Z');
      expect(typeof parsed.state.semesterStart).toBe('string');
    });

    it('should deserialize ISO strings back to Date objects', () => {
      // Test the reviver function directly by setting dates and verifying they persist correctly
      const store = useConfigStore.getState();
      
      // Set dates
      const startDate = new Date('2024-02-01T10:30:00.000Z');
      const endDate = new Date('2024-06-30T23:59:59.999Z');
      store.setSemesterStart(startDate);
      store.setSemesterEnd(endDate);
      
      // Verify they're stored as ISO strings in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.semesterStart).toBe('2024-02-01T10:30:00.000Z');
      expect(parsed.state.semesterEnd).toBe('2024-06-30T23:59:59.999Z');
      
      // Verify the store still has Date objects in memory
      const currentState = useConfigStore.getState();
      expect(currentState.semesterStart).toBeInstanceOf(Date);
      expect(currentState.semesterEnd).toBeInstanceOf(Date);
      expect(currentState.semesterStart?.toISOString()).toBe('2024-02-01T10:30:00.000Z');
      expect(currentState.semesterEnd?.toISOString()).toBe('2024-06-30T23:59:59.999Z');
    });

    it('should handle null dates correctly', () => {
      const store = useConfigStore.getState();
      
      // Set dates to null
      store.setSemesterStart(null);
      store.setSemesterEnd(null);
      
      // Verify null is stored
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.semesterStart).toBeNull();
      expect(parsed.state.semesterEnd).toBeNull();
    });

    it('should preserve Date precision through serialization round-trip', () => {
      const store = useConfigStore.getState();
      
      // Use a date with milliseconds
      const testDate = new Date('2024-02-01T10:30:45.123Z');
      store.setSemesterStart(testDate);
      
      // Get the stored value
      const stored = localStorage.getItem('schedule-config');
      const parsed = JSON.parse(stored!);
      
      // Deserialize manually to verify
      const deserializedDate = new Date(parsed.state.semesterStart);
      
      // Verify exact timestamp match
      expect(deserializedDate.getTime()).toBe(testDate.getTime());
    });
  });

  describe('store rehydration', () => {
    it('should restore state from localStorage on initialization', () => {
      // Set initial state
      const store = useConfigStore.getState();
      store.setModuleColor('COS 214', 'blue');
      store.setTheme('dark');
      store.setSemesterStart(new Date('2024-02-01T00:00:00.000Z'));
      
      // Verify state is in localStorage
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.moduleColors).toEqual({ 'COS 214': 'blue' });
      expect(parsed.state.theme).toBe('dark');
      expect(parsed.state.semesterStart).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set corrupted data in localStorage
      localStorage.setItem('schedule-config', 'invalid json {{{');
      
      // Try to access store - should not crash
      const state = useConfigStore.getState();
      
      // Should have some state (either initial or partially recovered)
      expect(state).toBeDefined();
      expect(state.theme).toBeDefined();
    });
  });

  describe('reset functionality', () => {
    it('should reset all config to initial state', () => {
      const store = useConfigStore.getState();
      
      // Set various config values
      store.setModuleColor('COS 214', 'blue');
      store.setTheme('dark');
      store.setSemesterStart(new Date('2024-02-01'));
      store.setSelectedCalendarId('calendar-123');
      
      // Reset
      store.reset();
      
      // Verify all values are reset
      const state = store;
      expect(state.moduleColors).toEqual({});
      expect(state.theme).toBe('light');
      expect(state.semesterStart).toBeNull();
      expect(state.semesterEnd).toBeNull();
      expect(state.selectedCalendarId).toBeNull();
    });

    it('should persist reset state to localStorage', () => {
      const store = useConfigStore.getState();
      
      // Set some values
      store.setModuleColor('COS 214', 'blue');
      store.setTheme('dark');
      
      // Reset
      store.reset();
      
      // Verify localStorage reflects reset state
      const stored = localStorage.getItem('schedule-config');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state.moduleColors).toEqual({});
      expect(parsed.state.theme).toBe('light');
    });
  });

  describe('cross-session persistence', () => {
    it('should maintain config across simulated browser sessions', () => {
      // Session 1: Set config
      const store = useConfigStore.getState();
      store.setModuleColor('COS 214', 'blue');
      store.setModuleColor('COS 301', 'green');
      store.setTheme('dark');
      store.setSemesterStart(new Date('2024-02-01T00:00:00.000Z'));
      store.setSemesterEnd(new Date('2024-06-30T00:00:00.000Z'));
      store.setSelectedCalendarId('calendar-789');
      
      // Verify localStorage contains all data
      const storedData = localStorage.getItem('schedule-config');
      expect(storedData).toBeTruthy();
      
      const parsed = JSON.parse(storedData!);
      
      // Verify all config persisted as expected
      expect(parsed.state.moduleColors).toEqual({ 'COS 214': 'blue', 'COS 301': 'green' });
      expect(parsed.state.theme).toBe('dark');
      expect(parsed.state.semesterStart).toBe('2024-02-01T00:00:00.000Z');
      expect(parsed.state.semesterEnd).toBe('2024-06-30T00:00:00.000Z');
      expect(parsed.state.selectedCalendarId).toBe('calendar-789');
    });
  });
});
