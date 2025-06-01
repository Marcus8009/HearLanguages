// src/config/constants.js
// Updated for your new manifest structure

// Your CDN URL (production-ready, faster, cached globally)
export const CDN_BASE = 'https://langappendpoint.azureedge.net';

// Fallback: Direct blob URL (for testing/backup) 
export const BLOB_BASE = 'https://teststoreacc32.blob.core.windows.net/web';

// Use CDN in production, blob storage for development/testing
export const getBaseUrl = () => {
  if (__DEV__) {
    // In development, you might want to use blob storage directly for easier debugging
    return BLOB_BASE;
  }
  return CDN_BASE;
};

export const buildUrl = (relativePath = '') => {
  const baseUrl = getBaseUrl();
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

// Updated URL builders for your new structure
export const getManifestUrl = (difficulty, contentType, batch) => {
  // Your manifests: A1_sentences_batch001_manifest.json
  return buildUrl(`${difficulty}_${contentType}_${batch}_manifest.json`);
};

export const getSentenceAudioUrl = (batch, sentenceId, difficulty, language) => {
  // Your structure: languages/en/A1/batch001/audio/sentences/sent_003.mp3
  return buildUrl(`languages/${language}/${difficulty}/${batch}/audio/sentences/${sentenceId}.mp3`);
};

export const getWordAudioUrl = (wordId, language, difficulty, batch) => {
  // Your structure: languages/en/A1/batch001/audio/words/w_003.mp3
  return buildUrl(`languages/${language}/${difficulty}/${batch}/audio/words/${wordId}.mp3`);
};

export const getPictureAudioUrl = (batch, pictureId, difficulty, language) => {
  // Your structure: languages/en/A1/batch001/audio/pictures/pic_003.mp3
  return buildUrl(`languages/${language}/${difficulty}/${batch}/audio/pictures/${pictureId}.mp3`);
};

export const getPictureUrl = (batch, filename) => {
  // You'll need to add picture files to your CDN
  const batchFormatted = batch.replace('batch', '').padStart(3, '0');
  const batchName = `batch${batchFormatted}`;
  
  return buildUrl(`pictures/${batchName}/${filename}`);
};

// Download settings
export const MAX_CONCURRENT_DOWNLOADS = 3;
export const SHORT_CACHE_SECONDS = 300; // for manifest refresh

// Debug mode - set to true to see detailed logging
export const DEBUG_DOWNLOADS = __DEV__;

// MISSING LANGUAGE CONSTANTS - Adding these to fix the error
export const DIFFICULTY_LEVELS = {
  A1: 'Beginner',
  A2: 'Elementary', 
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Proficient'
};

export const LANGUAGE_FLAGS = {
  'en': '🇺🇸',
  'zh': '🇨🇳',
  'ja': '🇯🇵', 
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'ru': '🇷🇺',
  'ko': '🇰🇷',
  'ar': '🇸🇦',
  'hi': '🇮🇳'
};

export const LANGUAGE_NAMES = {
  'en': 'English',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi'
};

// MISSING HELPER FUNCTIONS - Adding these to fix the error
export const getLangFlag = (langCode) => {
  return LANGUAGE_FLAGS[langCode] || '🌐';
};

export const getLangName = (langCode) => {
  return LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
};

export const getDifficultyName = (level) => {
  return DIFFICULTY_LEVELS[level] || level;
};

console.log(`🌐 CDN Configuration:
  Base URL: ${getBaseUrl()}
  Debug Mode: ${DEBUG_DOWNLOADS}
  Environment: ${__DEV__ ? 'Development' : 'Production'}
`);