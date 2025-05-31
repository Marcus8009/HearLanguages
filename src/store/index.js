import { create } from 'zustand';

export const useStore = create((set) => ({
  learningLang: null,
  knownLang: null,
  difficulty: 'A1', // ← NEW: Default difficulty
  translitMode: 'auto',
  downloadProgress: {},
  downloadedBatches: [],
  
  setLanguagePair: (learning, known) => set({ learningLang: learning, knownLang: known }),
  setDifficulty: (level) => set({ difficulty: level }), // ← NEW: Set difficulty
  setTranslitMode: (mode) => set({ translitMode: mode }),
  updateDownloadProgress: (batch, progress) => 
    set((state) => ({ downloadProgress: { ...state.downloadProgress, [batch]: progress } })),
  markBatchDownloaded: (batch) => 
    set((state) => ({ downloadedBatches: [...state.downloadedBatches, batch] })),
  resetApp: () => set({
    learningLang: null,
    knownLang: null,
    difficulty: 'A1',
    downloadProgress: {},
    downloadedBatches: [],
  }),
}));