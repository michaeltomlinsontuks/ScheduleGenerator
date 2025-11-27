/**
 * Config Store - Manages semester dates, module colors, and theme
 * Requirements: 10.2, 10.3, 10.4
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// Custom storage to handle Date serialization
const dateStorage = createJSONStorage<ConfigState>(() => localStorage, {
  reviver: (_key, value) => {
    // Revive date strings back to Date objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  },
});

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSemesterStart: (date) => set({ semesterStart: date }),

      setSemesterEnd: (date) => set({ semesterEnd: date }),

      setModuleColor: (module, colorId) =>
        set((state) => ({
          moduleColors: { ...state.moduleColors, [module]: colorId },
        })),

      setTheme: (theme) => set({ theme }),

      setSelectedCalendarId: (calendarId) => set({ selectedCalendarId: calendarId }),

      reset: () => set(initialState),
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
    }
  )
);
