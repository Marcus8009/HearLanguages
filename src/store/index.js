// src/store/index.js - Complete fixed store with all missing functions
import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Language selection
  learningLang: null,
  knownLang: null,
  difficulty: 'A1',
  translitMode: 'auto',
  
  // Download tracking
  downloadedContent: {},
  downloadProgress: {},
  isDownloading: false,
  
  // Content data
  sentences: [],
  words: [],
  pictures: [],
  
  // Actions
  setLanguages: (learning, known) => set({ 
    learningLang: learning, 
    knownLang: known 
  }),
  
  setDifficulty: (diff) => set({ difficulty: diff }),
  
  setTranslitMode: (mode) => set({ translitMode: mode }),
  
  setDownloadedContent: (contentKey, isDownloaded) => set((state) => ({
    downloadedContent: {
      ...state.downloadedContent,
      [contentKey]: isDownloaded
    }
  })),
  
  // FIXED: Function that can be called from App.js
  hasAnyDownloadedContent: () => {
    const state = get();
    return Object.keys(state.downloadedContent).length > 0;
  },
  
  // Check if specific language content is downloaded
  isLanguageContentDownloaded: (language, difficulty) => {
    const state = get();
    const contentKey = `${language}-${difficulty}`;
    return state.downloadedContent[contentKey] || false;
  },
  
  // ADDED: Batch-specific check (for compatibility with screens)
  isBatchDownloaded: (language, difficulty, batch) => {
    const state = get();
    const contentKey = `${language}-${difficulty}`;
    return state.downloadedContent[contentKey] || false;
  },
  
  // Check if both learning and known language content is downloaded
  isBothLanguagesDownloaded: () => {
    const state = get();
    if (!state.learningLang || !state.difficulty) return false;
    
    const learningKey = `${state.learningLang}-${state.difficulty}`;
    const learningDownloaded = state.downloadedContent[learningKey] || false;
    
    // If no known language set, only check learning language
    if (!state.knownLang) return learningDownloaded;
    
    const knownKey = `${state.knownLang}-${state.difficulty}`;
    const knownDownloaded = state.downloadedContent[knownKey] || false;
    
    return learningDownloaded && knownDownloaded;
  },
  
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setIsDownloading: (downloading) => set({ isDownloading: downloading }),
  setSentences: (sentences) => set({ sentences }),
  setWords: (words) => set({ words }),
  setPictures: (pictures) => set({ pictures }),
  
  // Reset function
  reset: () => set({
    learningLang: null,
    knownLang: null,
    difficulty: 'A1',
    translitMode: 'auto',
    downloadedContent: {},
    downloadProgress: {},
    isDownloading: false,
    sentences: [],
    words: [],
    pictures: [],
  }),
}));