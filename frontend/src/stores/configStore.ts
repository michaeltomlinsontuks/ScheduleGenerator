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

const getInitialDate = (envVar: string | undefined): Date | null => {
  if (!envVar) return null;
  const date = new Date(envVar);
  return isNaN(date.getTime()) ? null : date;
};

// Helper to get current semester dates based on environment variables
const getCurrentSemesterDefaults = () => {
  const now = new Date();

  // Parse Env Vars
  const s1Start = process.env.NEXT_PUBLIC_FIRST_SEMESTER_START ? new Date(process.env.NEXT_PUBLIC_FIRST_SEMESTER_START) : null;
  const s1End = process.env.NEXT_PUBLIC_FIRST_SEMESTER_END ? new Date(process.env.NEXT_PUBLIC_FIRST_SEMESTER_END) : null;
  const s2Start = process.env.NEXT_PUBLIC_SECOND_SEMESTER_START ? new Date(process.env.NEXT_PUBLIC_SECOND_SEMESTER_START) : null;
  const s2End = process.env.NEXT_PUBLIC_SECOND_SEMESTER_END ? new Date(process.env.NEXT_PUBLIC_SECOND_SEMESTER_END) : null;

  // Check if dates are valid
  const isS1Valid = s1Start && s1End && !isNaN(s1Start.getTime()) && !isNaN(s1End.getTime());
  const isS2Valid = s2Start && s2End && !isNaN(s2Start.getTime()) && !isNaN(s2End.getTime());

  // Determine current semester
  // 1. If currently IN a semester, return it
  if (isS1Valid && now >= s1Start && now <= s1End) {
    return { start: s1Start, end: s1End };
  }

  if (isS2Valid && now >= s2Start && now <= s2End) {
    return { start: s2Start, end: s2End };
  }

  // 2. If in a break, return the NEXT semester

  // Before S1 -> S1 is next
  if (isS1Valid && now < s1Start) {
    return { start: s1Start, end: s1End };
  }

  // Between S1 and S2 -> S2 is next
  if (isS2Valid && isS1Valid && now > s1End && now < s2Start) {
    return { start: s2Start, end: s2End };
  }

  // After S2 -> Next year's S1 is next
  if (isS1Valid && isS2Valid && now > s2End) {
    return { start: s1Start, end: s1End };
  }

  // Check legacy env vars as last resort
  const legacyStart = getInitialDate(process.env.NEXT_PUBLIC_SEMESTER_START_DATE);
  const legacyEnd = getInitialDate(process.env.NEXT_PUBLIC_SEMESTER_END_DATE);

  return { start: legacyStart, end: legacyEnd };
};

const defaultDates = getCurrentSemesterDefaults();

const initialState: ConfigState = {
  semesterStart: defaultDates.start,
  semesterEnd: defaultDates.end,
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
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate config store:', error);
          showWarningToast(
            'Could not restore your preferences. Using default settings.',
            7000
          );
          // Reset to initial state on error
          useConfigStore.getState().reset();
        } else if (state) {
          // Apply environment variable defaults if persisted values are null
          // This handles the case where a user has visited before (so storage exists with nulls)
          // but we now want to provide a default starting point.
          const envStart = getInitialDate(process.env.NEXT_PUBLIC_SEMESTER_START_DATE);
          const envEnd = getInitialDate(process.env.NEXT_PUBLIC_SEMESTER_END_DATE);

          if (state.semesterStart === null && envStart) {
            state.setSemesterStart(envStart);
          }
          if (state.semesterEnd === null && envEnd) {
            state.setSemesterEnd(envEnd);
          }
        }
      },
    }
  )
);
