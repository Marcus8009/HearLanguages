// src/config/constants.js
export const ENDPOINTS = {
  // Base CDN URL - replace with your actual server URL
  CDN_BASE: 'https://langappendpoint.azureedge.net', // Replace with your actual server URL
  
  // Get batch manifest for a specific language/difficulty/batch
  getBatchManifest: (lang, difficulty, batch) => 
    `${ENDPOINTS.CDN_BASE}/languages/${lang}/${difficulty}/${batch}/manifest.json`,
  
  // Get batch content file (words, sentences, pictures)
  getBatchContent: (lang, difficulty, batch, contentType) => 
    `${ENDPOINTS.CDN_BASE}/languages/${lang}/${difficulty}/${batch}/${contentType}.csv`,
  
  // Get difficulty-level manifest
  getDifficultyManifest: (lang, difficulty) => 
    `${ENDPOINTS.CDN_BASE}/languages/${lang}/${difficulty}/manifest.json`,
};

export const LOCAL_PATHS = {
  // Get local path for batch manifest
  getBatchManifestPath: (lang, difficulty, batch) => 
    `languages/${lang}/${difficulty}/${batch}/manifest.json`,
  
  // Get local path for batch content
  getBatchContentPath: (lang, difficulty, batch, contentType) => 
    `languages/${lang}/${difficulty}/${batch}/${contentType}.csv`,
};

export const DOWNLOAD_CONFIG = {
  MAX_CONCURRENT_DOWNLOADS: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  TIMEOUT: 30000, // ms
};

// Language configurations
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
];

export const DIFFICULTY_LEVELS = [
  { code: 'A1', name: 'Beginner', description: 'Basic words and phrases' },
  { code: 'A2', name: 'Elementary', description: 'Simple sentences and situations' },
  { code: 'B1', name: 'Intermediate', description: 'Clear standard speech' },
  { code: 'B2', name: 'Upper-Intermediate', description: 'Complex texts and ideas' },
  { code: 'C1', name: 'Advanced', description: 'Sophisticated language use' },
  { code: 'C2', name: 'Proficient', description: 'Near-native fluency' },
];