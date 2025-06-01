// src/utils/index.js - Main utility exports
// This allows clean imports like: import { loadWordsForLearning, loadContentManifest } from '@/utils'

// CSV Loading functions
export {
  readCSV,
  loadMasterWords,
  loadMasterSentences, 
  loadMasterPictures,
  getWordsForBatch,
  getSentencesForBatch,
  getPicturesForBatch,
  getBatchCount,
  getAvailableBatches,
  loadBatchContent,
  loadWordsForLearning,
  loadSentencesForLearning,
  loadPicturesForLearning,
  getContentOverview,
  logContentStats
} from './csvLoader';

// Manifest functions
export {
  loadContentManifest,
  loadBatchManifest,
  getAvailableBatchesFromManifest,
  verifyFile,
  verifyBatch,
  getContentStats,
  isBatchAvailable,
  getDownloadProgress,
  loadManifest,
  listAvailableManifests
} from './manifest';

// SHA256 utilities (if needed)
export {
  calculateSHA256
} from './sha256';