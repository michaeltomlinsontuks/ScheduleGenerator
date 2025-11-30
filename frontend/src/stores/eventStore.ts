/**
 * Event Store - Manages parsed events and selection state
 * Requirements: 10.1, 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ParsedEvent, ProcessingJob } from '@/types';
import { useConfigStore } from './configStore';
import { getStorageAdapter } from '@/utils/storage';
import { showErrorToast, showWarningToast } from '@/utils/toast';

export type PdfType = 'lecture' | 'test' | 'exam';

interface EventState {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  jobId: string | null;
  jobStatus: ProcessingJob['status'] | null;
  pdfType: PdfType | null;
}

interface EventActions {
  setEvents: (events: ParsedEvent[], pdfType?: PdfType) => void;
  setJobId: (jobId: string | null) => void;
  setJobStatus: (status: ProcessingJob['status'] | null) => void;
  toggleEvent: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedEvents: () => ParsedEvent[];
  reset: () => void;
  clearWorkflowState: () => void;
}

type EventStore = EventState & EventActions;

const initialState: EventState = {
  events: [],
  selectedIds: new Set<string>(),
  jobId: null,
  jobStatus: null,
  pdfType: null,
};

// Custom storage with Set serialization and error handling
const eventStorage = createJSONStorage<EventState>(() => getStorageAdapter('sessionStorage'), {
  // Serialize: Convert Set to Array
  replacer: (key, value) => {
    try {
      if (key === 'selectedIds' && value instanceof Set) {
        return Array.from(value);
      }
      return value;
    } catch (error) {
      console.error('Error serializing event store:', error);
      showErrorToast('Failed to save event data. Please try again.');
      return value;
    }
  },
  // Deserialize: Convert Array back to Set
  reviver: (key, value) => {
    try {
      if (key === 'selectedIds' && Array.isArray(value)) {
        return new Set(value);
      }
      return value;
    } catch (error) {
      console.error('Error deserializing event store:', error);
      showWarningToast('Some event data could not be restored.');
      return value;
    }
  },
});

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setEvents: (events, pdfType) => {
        try {
          // When events are set, select all by default
          const allIds = new Set(events.map((e) => e.id));
          set({ events, selectedIds: allIds, pdfType: pdfType || null });
          
          // Clear semester dates if pdfType is not 'lecture'
          if (pdfType && pdfType !== 'lecture') {
            const configStore = useConfigStore.getState();
            configStore.setSemesterStart(null);
            configStore.setSemesterEnd(null);
          }
        } catch (error) {
          console.error('Failed to set events:', error);
          showErrorToast('Failed to save events. Please try uploading again.');
          throw error;
        }
      },

      setJobId: (jobId) => set({ jobId }),

      setJobStatus: (jobStatus) => set({ jobStatus }),

      toggleEvent: (id) => {
        try {
          const { selectedIds } = get();
          const newSelectedIds = new Set(selectedIds);
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          set({ selectedIds: newSelectedIds });
        } catch (error) {
          console.error('Failed to toggle event:', error);
          showErrorToast('Failed to update selection. Please try again.');
        }
      },

      selectAll: () => {
        const { events } = get();
        const allIds = new Set(events.map((e) => e.id));
        set({ selectedIds: allIds });
      },

      deselectAll: () => {
        set({ selectedIds: new Set<string>() });
      },

      getSelectedEvents: () => {
        const { events, selectedIds } = get();
        return events.filter((e) => selectedIds.has(e.id));
      },

      reset: () => set({ ...initialState, selectedIds: new Set<string>() }),

      clearWorkflowState: () => {
        set({ ...initialState, selectedIds: new Set<string>() });
      },
    }),
    {
      name: 'schedule-events',
      storage: eventStorage,
      partialize: (state) => ({
        events: state.events,
        selectedIds: state.selectedIds,
        jobId: state.jobId,
        jobStatus: state.jobStatus,
        pdfType: state.pdfType,
      }),
      // Handle storage errors gracefully
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate event store:', error);
          showWarningToast(
            'Could not restore your previous session. Starting fresh.',
            7000
          );
          // Reset to initial state on error
          useEventStore.getState().reset();
        }
      },
    }
  )
);
