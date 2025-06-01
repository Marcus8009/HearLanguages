// src/utils/csvLoader.js - Updated for corrected batch architecture
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/** Convert relative path into an absolute path under the app's Documents dir. */
const localPath = (relative) =>
  `${FileSystem.documentDirectory}${relative.replace(/^\/+/, '')}`;

/** ------------------------------------------------------------------ */
/** Low-level helper – read a CSV file from local storage              */
/** Returns an array of plain objects keyed by the CSV headers.        */
/** ------------------------------------------------------------------ */
export async function readCSV(pathOrUrl) {
  try {
    let text;

    if (Platform.OS === 'web') {
      /* ----------- Web / PWA --------------- */
      const res = await fetch(pathOrUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${pathOrUrl}`);
      text = await res.text();
    } else {
      /* ----------- Native (iOS/Android) ---- */
      console.log(`📖 Reading CSV from: ${pathOrUrl}`);
      
      // Check if file exists first
      const info = await FileSystem.getInfoAsync(pathOrUrl);
      console.log(`📁 File info:`, info);
      
      if (!info.exists) {
        throw new Error(`File not found at ${pathOrUrl}`);
      }
      
      text = await FileSystem.readAsStringAsync(pathOrUrl, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log(`📄 CSV content length: ${text?.length || 0}`);
    }

    return parseCSV(text);
  } catch (err) {
    console.error('CSV read error:', err);
    console.error('Path attempted:', pathOrUrl);
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  CSV → Array<Object>  (minimal parser; handles CR/LF, trims cells)  */
/* ------------------------------------------------------------------ */
const parseCSV = (content) => {
  if (!content || content.trim().length === 0) {
    console.warn('Empty CSV content');
    return [];
  }

  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn('CSV has no data rows');
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  console.log(`📊 CSV headers: ${headers.join(', ')}`);

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });

  console.log(`📊 Parsed ${rows.length} CSV rows`);
  return rows;
};

/* ------------------------------------------------------------------ */
/*  UPDATED ARCHITECTURE: Load master CSV files (NEW format)          */
/* ------------------------------------------------------------------ */

/**
 * Load the master words CSV file (words_v1NEW.csv)
 */
export const loadMasterWords = async () => {
  try {
    const filePath = localPath('csv/words_v1NEW.csv');
    console.log(`🔤 Loading master words from: ${filePath}`);
    
    const words = await readCSV(filePath);
    console.log(`✅ Loaded ${words.length} words from master CSV`);
    return words;
  } catch (e) {
    console.error(`❌ Error loading master words:`, e);
    return [];
  }
};

/**
 * Load the master sentences CSV file (sentences_batch01_v1NEW.csv)
 */
export const loadMasterSentences = async () => {
  try {
    const filePath = localPath('csv/batch01/sentences_batch01_v1NEW.csv');
    console.log(`💬 Loading master sentences from: ${filePath}`);
    
    const sentences = await readCSV(filePath);
    console.log(`✅ Loaded ${sentences.length} sentences from master CSV`);
    return sentences;
  } catch (e) {
    console.error(`❌ Error loading master sentences:`, e);
    return [];
  }
};

/**
 * Load the master pictures CSV file (pictures_batch01_v1NEW.csv)
 */
export const loadMasterPictures = async () => {
  try {
    const filePath = localPath('csv/batch01/pictures_batch01_v1NEW.csv');
    console.log(`🖼️ Loading master pictures from: ${filePath}`);
    
    const pictures = await readCSV(filePath);
    console.log(`✅ Loaded ${pictures.length} pictures from master CSV`);
    return pictures;
  } catch (e) {
    console.error(`❌ Error loading master pictures:`, e);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  BATCH FILTERING: Extract data for specific batches                */
/* ------------------------------------------------------------------ */

/**
 * Filter words for a specific difficulty and batch
 * Words are batched at 50 per batch
 */
export const getWordsForBatch = async (difficulty, batchNumber = 1) => {
  try {
    const allWords = await loadMasterWords();
    const difficultyWords = allWords.filter(word => word.difficulty === difficulty);
    
    // Calculate batch bounds (50 words per batch)
    const batchSize = 50;
    const startIndex = (batchNumber - 1) * batchSize;
    const endIndex = startIndex + batchSize;
    
    const batchWords = difficultyWords.slice(startIndex, endIndex);
    const batchStr = batchNumber.toString().padStart(3, '0');
    console.log(`✅ Filtered ${batchWords.length} words for ${difficulty} batch${batchStr}`);
    return batchWords;
  } catch (e) {
    console.error(`❌ Error filtering words for ${difficulty} batch ${batchNumber}:`, e);
    return [];
  }
};

/**
 * Filter sentences for a specific difficulty and batch
 * Sentences are batched at 50 per batch
 */
export const getSentencesForBatch = async (difficulty, batchNumber = 1) => {
  try {
    const allSentences = await loadMasterSentences();
    const difficultySentences = allSentences.filter(sentence => sentence.difficulty === difficulty);
    
    // Calculate batch bounds (50 sentences per batch)
    const batchSize = 50;
    const startIndex = (batchNumber - 1) * batchSize;
    const endIndex = startIndex + batchSize;
    
    const batchSentences = difficultySentences.slice(startIndex, endIndex);
    const batchStr = batchNumber.toString().padStart(3, '0');
    console.log(`✅ Filtered ${batchSentences.length} sentences for ${difficulty} batch${batchStr}`);
    return batchSentences;
  } catch (e) {
    console.error(`❌ Error filtering sentences for ${difficulty} batch ${batchNumber}:`, e);
    return [];
  }
};

/**
 * Filter pictures for a specific difficulty and batch
 * Pictures are batched at 10 per batch
 */
export const getPicturesForBatch = async (difficulty, batchNumber = 1) => {
  try {
    const allPictures = await loadMasterPictures();
    const difficultyPictures = allPictures.filter(picture => picture.difficulty === difficulty);
    
    // Calculate batch bounds (10 pictures per batch)
    const batchSize = 10;
    const startIndex = (batchNumber - 1) * batchSize;
    const endIndex = startIndex + batchSize;
    
    const batchPictures = difficultyPictures.slice(startIndex, endIndex);
    const batchStr = batchNumber.toString().padStart(3, '0');
    console.log(`✅ Filtered ${batchPictures.length} pictures for ${difficulty} batch${batchStr}`);
    return batchPictures;
  } catch (e) {
    console.error(`❌ Error filtering pictures for ${difficulty} batch ${batchNumber}:`, e);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  BATCH STRUCTURE HELPERS                                           */
/* ------------------------------------------------------------------ */

/**
 * Calculate how many batches exist for a difficulty and content type
 */
export const getBatchCount = async (difficulty, contentType) => {
  try {
    let allItems = [];
    let batchSize = 50;
    
    switch (contentType) {
      case 'words':
        allItems = await loadMasterWords();
        batchSize = 50;
        break;
      case 'sentences':
        allItems = await loadMasterSentences();
        batchSize = 50;
        break;
      case 'pictures':
        allItems = await loadMasterPictures();
        batchSize = 10;
        break;
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
    
    const difficultyItems = allItems.filter(item => item.difficulty === difficulty);
    const batchCount = Math.ceil(difficultyItems.length / batchSize);
    
    console.log(`📊 ${difficulty} ${contentType}: ${difficultyItems.length} items = ${batchCount} batches`);
    return batchCount;
  } catch (e) {
    console.error(`❌ Error calculating batch count for ${difficulty} ${contentType}:`, e);
    return 0;
  }
};

/**
 * Get available batch numbers for a difficulty and content type
 */
export const getAvailableBatches = async (difficulty, contentType) => {
  try {
    const batchCount = await getBatchCount(difficulty, contentType);
    return Array.from({ length: batchCount }, (_, i) => i + 1);
  } catch (e) {
    console.error(`❌ Error getting available batches for ${difficulty} ${contentType}:`, e);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  LEARNING SCREEN CONVENIENCE FUNCTIONS                             */
/* ------------------------------------------------------------------ */

/**
 * Load all content for a specific difficulty and batch
 * Returns combined data with words, sentences, and pictures
 */
export const loadBatchContent = async (difficulty, batchNumber = 1) => {
  try {
    const batchStr = batchNumber.toString().padStart(3, '0');
    console.log(`🔄 Loading all content for ${difficulty} batch${batchStr}`);
    
    const [words, sentences, pictures] = await Promise.all([
      getWordsForBatch(difficulty, batchNumber),
      getSentencesForBatch(difficulty, batchNumber),
      getPicturesForBatch(difficulty, batchNumber)
    ]);
    
    const batchContent = {
      difficulty,
      batch: `batch${batchStr}`,
      words,
      sentences,
      pictures,
      counts: {
        words: words.length,
        sentences: sentences.length,
        pictures: pictures.length,
        total: words.length + sentences.length + pictures.length
      }
    };
    
    console.log(`✅ Loaded batch content: ${batchContent.counts.total} total items`);
    return batchContent;
  } catch (e) {
    console.error(`❌ Error loading batch content for ${difficulty} batch ${batchNumber}:`, e);
    const batchStr = batchNumber.toString().padStart(3, '0');
    return {
      difficulty,
      batch: `batch${batchStr}`,
      words: [],
      sentences: [],
      pictures: [],
      counts: { words: 0, sentences: 0, pictures: 0, total: 0 }
    };
  }
};

/**
 * Load words for current language pair and difficulty
 */
export const loadWordsForLearning = async (learningLang, knownLang, difficulty, batchNumber = 1) => {
  const words = await getWordsForBatch(difficulty, batchNumber);
  console.log(`✅ Loaded ${words.length} words for learning (${learningLang}↔${knownLang})`);
  return words;
};

/**
 * Load sentences for current language pair and difficulty
 */
export const loadSentencesForLearning = async (learningLang, knownLang, difficulty, batchNumber = 1) => {
  const sentences = await getSentencesForBatch(difficulty, batchNumber);
  console.log(`✅ Loaded ${sentences.length} sentences for learning (${learningLang}↔${knownLang})`);
  return sentences;
};

/**
 * Load pictures for current language pair and difficulty
 */
export const loadPicturesForLearning = async (learningLang, knownLang, difficulty, batchNumber = 1) => {
  const pictures = await getPicturesForBatch(difficulty, batchNumber);
  console.log(`✅ Loaded ${pictures.length} pictures for learning (${learningLang}↔${knownLang})`);
  return pictures;
};

/* ------------------------------------------------------------------ */
/*  CONTENT OVERVIEW FUNCTIONS                                        */
/* ------------------------------------------------------------------ */

/**
 * Get overview of all available content
 */
export const getContentOverview = async () => {
  try {
    console.log(`📊 Generating content overview...`);
    
    const [allWords, allSentences, allPictures] = await Promise.all([
      loadMasterWords(),
      loadMasterSentences(),
      loadMasterPictures()
    ]);
    
    // Group by difficulty
    const difficulties = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const overview = {};
    
    for (const difficulty of difficulties) {
      const difficultyWords = allWords.filter(item => item.difficulty === difficulty);
      const difficultySentences = allSentences.filter(item => item.difficulty === difficulty);
      const difficultyPictures = allPictures.filter(item => item.difficulty === difficulty);
      
      overview[difficulty] = {
        words: {
          count: difficultyWords.length,
          batches: Math.ceil(difficultyWords.length / 50)
        },
        sentences: {
          count: difficultySentences.length,
          batches: Math.ceil(difficultySentences.length / 50)
        },
        pictures: {
          count: difficultyPictures.length,
          batches: Math.ceil(difficultyPictures.length / 10)
        }
      };
    }
    
    console.log(`✅ Content overview generated:`, overview);
    return overview;
  } catch (e) {
    console.error(`❌ Error generating content overview:`, e);
    return {};
  }
};

/**
 * Debug helper - log content statistics
 */
export const logContentStats = async () => {
  try {
    const overview = await getContentOverview();
    
    console.log(`\n📊 CONTENT STATISTICS:`);
    console.log(`========================`);
    
    for (const [difficulty, stats] of Object.entries(overview)) {
      console.log(`\n${difficulty}:`);
      console.log(`  🔤 Words: ${stats.words.count} items (${stats.words.batches} batches)`);
      console.log(`  💬 Sentences: ${stats.sentences.count} items (${stats.sentences.batches} batches)`);
      console.log(`  🖼️ Pictures: ${stats.pictures.count} items (${stats.pictures.batches} batches)`);
    }
    
    // Calculate totals
    const totals = Object.values(overview).reduce((acc, stats) => ({
      words: acc.words + stats.words.count,
      sentences: acc.sentences + stats.sentences.count,
      pictures: acc.pictures + stats.pictures.count,
      wordBatches: acc.wordBatches + stats.words.batches,
      sentenceBatches: acc.sentenceBatches + stats.sentences.batches,
      pictureBatches: acc.pictureBatches + stats.pictures.batches
    }), { words: 0, sentences: 0, pictures: 0, wordBatches: 0, sentenceBatches: 0, pictureBatches: 0 });
    
    console.log(`\n📈 TOTALS:`);
    console.log(`  🔤 ${totals.words} words (${totals.wordBatches} batches)`);
    console.log(`  💬 ${totals.sentences} sentences (${totals.sentenceBatches} batches)`);
    console.log(`  🖼️ ${totals.pictures} pictures (${totals.pictureBatches} batches)`);
    console.log(`  📦 ${totals.wordBatches + totals.sentenceBatches + totals.pictureBatches} total batches`);
    
  } catch (e) {
    console.error(`❌ Error logging content stats:`, e);
  }
};