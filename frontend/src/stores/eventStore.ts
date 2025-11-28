/**
 * Event Store - Manages parsed events and selection state
 * Requirements: 10.1
 */
import { create } from 'zustand';
import type { ParsedEvent, ProcessingJob } from '@/types';
import { useConfigStore } from './configStore';

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
}

type EventStore = EventState & EventActions;

const initialState: EventState = {
  events: [],
  selectedIds: new Set<string>(),
  jobId: null,
  jobStatus: null,
  pdfType: null,
};

export const useEventStore = create<EventStore>((set, get) => ({
  ...initialState,

  setEvents: (events, pdfType) => {
    // When events are set, select all by default
    const allIds = new Set(events.map((e) => e.id));
    set({ events, selectedIds: allIds, pdfType: pdfType || null });
    
    // Clear semester dates if pdfType is not 'lecture'
    if (pdfType && pdfType !== 'lecture') {
      const configStore = useConfigStore.getState();
      configStore.setSemesterStart(null);
      configStore.setSemesterEnd(null);
    }
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

  reset: () => set({ ...initialState, selectedIds: new Set<string>() }),
}));
