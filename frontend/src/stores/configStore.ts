/**
 * Config Store - Manages semester dates, module colors, and theme
 * Requirements: 10.2, 10.3, 10.4
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getStorageAdapter } from '@/utils/storage';
import { showErrorToast, showWarningToast } from '@/utils/toast';

interface ConfigState {
  semesterStart: Date | null;
  semesterEnd: Date | null;
  moduleColors: Record<string, string>;
  theme: 'light' | 'dark';
  selectedCalendarId: string | null;
}

interface ConfigActions {
  setSemesterStart: (date: Date | null) => void;
  setSemesterEnd: (date: Date | null) => void;
  setModuleColor: (module: string, colorId: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSelectedCalendarId: (calendarId: string | null) => void;
  reset: () => void;
}

type ConfigStore = ConfigState & ConfigActions;

const initialState: ConfigState = {
  semesterStart: null,
  semesterEnd: null,
  moduleColors: {},
  theme: 'light',
  selectedCalendarId: null,
};

// Custom storage to handle Date serialization with error handling
const dateStorage = createJSONStorage<ConfigState>(() => getStorageAdapter('localStorage'), {
  // Serialize: Convert Date to ISO string
  replacer: (_key, value) => {
    try {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    } catch (error) {
      console.error('Error serializing config store:', error);
      showErrorToast('Failed to save configuration. Please try again.');
      return value;
    }
  },
  // Deserialize: Convert ISO string back to Date
  reviver: (_key, value) => {
    try {
      // Revive date strings back to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value);
      }
      return value;
    } catch (error) {
      console.error('Error deserializing config store:', error);
      showWarningToast('Some configuration data could not be restored.');
      return value;
    }
  },
});

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSemesterStart: (date) => {
        try {
          set({ semesterStart: date });
        } catch (error) {
          console.error('Failed to set semester start:', error);
          showErrorToast('Failed to save semester start date.');
          throw error;
        }
      },

      setSemesterEnd: (date) => {
        try {
          set({ semesterEnd: date });
        } catch (error) {
          console.error('Failed to set semester end:', error);
          showErrorToast('Failed to save semester end date.');
          throw error;
        }
      },

      setModuleColor: (module, colorId) => {
        try {
          set((state) => ({
            moduleColors: { ...state.moduleColors, [module]: colorId },
          }));
        } catch (error) {
          console.error('Failed to set module color:', error);
          showErrorToast('Failed to save module color.');
        }
      },

      setTheme: (theme) => {
        try {
          set({ theme });
        } catch (error) {
          console.error('Failed to set theme:', error);
          showErrorToast('Failed to save theme preference.');
        }
      },

      setSelectedCalendarId: (calendarId) => {
        try {
          set({ selectedCalendarId: calendarId });
        } catch (error) {
          console.error('Failed to set calendar ID:', error);
          showErrorToast('Failed to save calendar selection.');
        }
      },

      reset: () => {
        try {
          set(initialState);
        } catch (error) {
          console.error('Failed to reset config store:', error);
          showErrorToast('Failed to reset configuration.');
        }
      },
    }),
    {
      name: 'schedule-config',
      storage: dateStorage,
      partialize: (state) => ({
        moduleColors: state.moduleColors,
        theme: state.theme,
        semesterStart: state.semesterStart,
        semesterEnd: state.semesterEnd,
        selectedCalendarId: state.selectedCalendarId,
      }),
      // Handle storage errors gracefully
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate config store:', error);
          showWarningToast(
            'Could not restore your preferences. Using default settings.',
            7000
          );
          // Reset to initial state on error
          useConfigStore.getState().reset();
        }
      },
    }
  )
);
