/**
 * Event Store - Manages parsed events and selection state
 * Requirements: 10.1
 */
import { create } from 'zustand';
import type { ParsedEvent, ProcessingJob } from '@/types';

interface EventState {
  events: ParsedEvent[];
  selectedIds: Set<string>;
  jobId: string | null;
  jobStatus: ProcessingJob['status'] | null;
}

interface EventActions {
  setEvents: (events: ParsedEvent[]) => void;
  setJobId: (jobId: string | null) => void;
  setJobStatus: (status: ProcessingJob['status'] | null) => void;
  toggleEvent: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelectedEvents: () => ParsedEvent[];
  reset: () => void;
}

type EventStore = EventState & EventActions;

const initialState: EventState = {
  events: [],
  selectedIds: new Set<string>(),
  jobId: null,
  jobStatus: null,
};

export const useEventStore = create<EventStore>((set, get) => ({
  ...initialState,

  setEvents: (events) => {
    // When events are set, select all by default
    const allIds = new Set(events.map((e) => e.id));
    set({ events, selectedIds: allIds });
  },

  setJobId: (jobId) => set({ jobId }),

  setJobStatus: (jobStatus) => set({ jobStatus }),

  toggleEvent: (id) => {
    const { selectedIds } = get();
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    set({ selectedIds: newSelectedIds });
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

  reset: () => set(initialState),
}));
