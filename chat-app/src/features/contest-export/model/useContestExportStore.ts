// S-08: Zustand for client UI state
// N-04: boolean is 접두사

import { create } from 'zustand';

export interface ContestExportStoreState {
  isExportPanelOpen: boolean;
}

export interface ContestExportStoreActions {
  openExportPanel: () => void;
  closeExportPanel: () => void;
  toggleExportPanel: () => void;
}

export const useContestExportStore = create<ContestExportStoreState & ContestExportStoreActions>()(
  (set) => ({
    isExportPanelOpen: false,
    openExportPanel: () => set({ isExportPanelOpen: true }),
    closeExportPanel: () => set({ isExportPanelOpen: false }),
    toggleExportPanel: () => set((prev) => ({ isExportPanelOpen: !prev.isExportPanelOpen })),
  }),
);
