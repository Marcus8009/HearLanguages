// src/store/index.js - Updated for hierarchical manifest system
import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Language & Difficulty Selection
  learningLang: null,      // 'zh', 'ja', 'es', etc.
  knownLang: null,         // 'en', 'zh', etc.
  difficulty: 'A1',        // 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  
  // Download Management
  downloadProgress: {},    // { 'hierarchical': 45, 'ja_A1_batch001': 78 }
  downloadedBatches: [],   // ['ja_A1_batch001', 'en_A1_batch001', 'hierarchical']
  availableBatches: {},    // { 'A1': ['batch001', 'batch002'], 'A2': ['batch001'] }
  
  // Settings
  translitMode: 'auto',    // 'auto' or 'longpress'
  
  // Actions
  setLanguagePair: (learning, known) => set({ 
    learningLang: learning, 
    knownLang: known 
  }),
  
  setDifficulty: (level) => set({ difficulty: level }),
  
  setTranslitMode: (mode) => set({ translitMode: mode }),
  
  updateDownloadProgress: (batchKey, progress) => 
    set((state) => ({ 
      downloadProgress: { 
        ...state.downloadProgress, 
        [batchKey]: progress 
      } 
    })),
  
  markBatchDownloaded: (batchKey) => 
    set((state) => ({ 
      downloadedBatches: [...state.downloadedBatches, batchKey] 
    })),
  
  setAvailableBatches: (batchData) => set({ availableBatches: batchData }),
  
  clearAllContent: () => set({
    downloadProgress: {},
    downloadedBatches: [],
    availableBatches: {},
  }),
  
  resetApp: () => set({
    learningLang: null,
    knownLang: null,
    difficulty: 'A1',
    downloadProgress: {},
    downloadedBatches: [],
    availableBatches: {},
    translitMode: 'auto',
  }),
  
  // Utility functions
  isBatchDownloaded: (lang, difficulty, batch) => {
    const downloadedBatches = get().downloadedBatches;
    const sentenceBatchKey = `${lang}_${difficulty}_sentences_${batch}`;
    return downloadedBatches.includes(sentenceBatchKey);
  },
  getBatchKey: (lang, difficulty, batch) => {
    return `${lang}_${difficulty}_${batch}`;
  },
  
  getDownloadProgress: (lang, difficulty, batch) => {
    const batchKey = `${lang}_${difficulty}_${batch}`;
    return get().downloadProgress[batchKey] || 0;
  },
  
  // Only consider hierarchical download for content access
  hasAnyDownloadedContent: () => {
    // Only allow access if hierarchical download is marked as complete
    return get().downloadedBatches.includes('hierarchical');
  },
  
  getDownloadedBatchesForDifficulty: (difficulty) => {
    const { downloadedBatches, learningLang, knownLang } = get();
    return downloadedBatches.filter(batchKey => {
      if (batchKey === 'hierarchical') return true; // Include hierarchical downloads
      const [lang, diff, batch] = batchKey.split('_');
      return diff === difficulty && (lang === learningLang || lang === knownLang);
    });
  },
})); // ← Added missing closing parenthesis and semicolon