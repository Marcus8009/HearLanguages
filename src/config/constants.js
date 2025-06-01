// src/config/constants.js - Updated for new directory structure
// --------------------------------------------------
// Central place to keep URLs and configuration
// Updated for the new batch-based architecture
// --------------------------------------------------

// Your CDN URL (updated for new structure)
export const CDN_BASE = 'https://langappendpoint.azureedge.net';

// API endpoints for new structure
export const ENDPOINTS = {
  // Root language index
  LANGUAGE_INDEX: `${CDN_BASE}/languages/index.json`,
  
  // Language-specific index
  getLanguageIndex: (lang) => `${CDN_BASE}/languages/${lang}/index.json`,
  
  // Difficulty manifest
  getDifficultyManifest: (lang, difficulty) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/manifest.json`,
  
  // Batch manifest
  getBatchManifest: (lang, difficulty, batch) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/${batch}/manifest.json`,
  
  // Content files
  getBatchContent: (lang, difficulty, batch, type) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/${batch}/content/${type}.csv`,
  
  // Audio files
  getWordAudio: (lang, difficulty, batch, wordId) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/${batch}/audio/words/${wordId}.mp3`,
  
  getSentenceAudio: (lang, difficulty, batch, sentenceId) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/${batch}/audio/sentences/${sentenceId}.mp3`,
  
  getPictureAudio: (lang, difficulty, batch, pictureId) => 
    `${CDN_BASE}/languages/${lang}/${difficulty}/${batch}/audio/pictures/${pictureId}.mp3`,
  
  // Shared images (language-independent)
  getPictureImage: (batch, pictureId) => 
    `${CDN_BASE}/languages/shared/images/${batch}/${pictureId}.jpg`,
};

// Content structure configuration
export const CONTENT_CONFIG = {
  // Batch sizes for development phase
  WORDS_PER_BATCH: 50,
  SENTENCES_PER_BATCH: 50, 
  PICTURES_PER_BATCH: 10,
  
  // Development phase totals (250 words, 50 pictures)
  DEV_TOTAL_BATCHES: 5,
  DEV_TOTAL_WORDS: 250,
  DEV_TOTAL_PICTURES: 50,
  
  // Production scale targets (5000 words, 1000 pictures)
  PROD_TOTAL_BATCHES: 100,
  PROD_TOTAL_WORDS: 5000,
  PROD_TOTAL_PICTURES: 1000,
};

// Supported languages
export const LANGUAGES = {
  'zh': { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  'ja': { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  'es': { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  'fr': { name: 'French', native: 'Français', flag: '🇫🇷' },
  'en': { name: 'English', native: 'English', flag: '🇺🇸' },
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  'A1': { name: 'Beginner', description: 'Basic words and phrases' },
  'A2': { name: 'Elementary', description: 'Simple sentences and situations' },
  'B1': { name: 'Intermediate', description: 'Clear standard speech' },
  'B2': { name: 'Upper-Intermediate', description: 'Complex texts and ideas' },
  'C1': { name: 'Advanced', description: 'Sophisticated language use' },
  'C2': { name: 'Proficient', description: 'Near-native fluency' },
};

// Download settings
export const DOWNLOAD_CONFIG = {
  MAX_CONCURRENT_DOWNLOADS: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  TIMEOUT: 30000, // 30 seconds
};

// Cache settings
export const CACHE_CONFIG = {
  SHORT_CACHE_SECONDS: 300, // 5 minutes for manifests
  LONG_CACHE_SECONDS: 31536000, // 1 year for audio/images
};

// Helper functions
export const buildUrl = (relativePath = '') => 
  `${CDN_BASE}/${relativePath.replace(/^\/+/, '')}`;

export const getLangName = (code) => LANGUAGES[code]?.name || code.toUpperCase();

export const getLangFlag = (code) => LANGUAGES[code]?.flag || '🌍';

export const getDifficultyName = (code) => DIFFICULTY_LEVELS[code]?.name || code;

export const getDifficultyDescription = (code) => DIFFICULTY_LEVELS[code]?.description || '';

// Local storage paths for downloaded content
export const LOCAL_PATHS = {
  getBatchContentPath: (lang, difficulty, batch, type) => 
    `languages/${lang}/${difficulty}/${batch}/content/${type}.csv`,
  
  getBatchAudioPath: (lang, difficulty, batch, type, id) => 
    `languages/${lang}/${difficulty}/${batch}/audio/${type}/${id}.mp3`,
  
  getSharedImagePath: (batch, pictureId) =>
    `languages/shared/images/${batch}/${pictureId}.jpg`,
  
  getBatchManifestPath: (lang, difficulty, batch) =>
    `languages/${lang}/${difficulty}/${batch}/manifest.json`,
};