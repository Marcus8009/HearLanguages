// Updated csvLoader.js - Read CSVs from remote URLs
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Your CSV base URL
const CSV_BASE_URL = 'https://teststoreacc32.blob.core.windows.net/web/csv';

/** Read CSV from remote URL or local file */
export async function readCSV(pathOrUrl) {
  try {
    let text;

    // Always fetch from remote for now (since CSVs aren't downloaded locally)
    console.log(`📖 Fetching CSV from: ${pathOrUrl}`);
    const response = await fetch(pathOrUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${pathOrUrl}`);
    }
    
    text = await response.text();
    console.log(`📄 CSV content length: ${text?.length || 0}`);

    return parseCSV(text);
  } catch (err) {
    console.error('CSV read error:', err);
    console.error('URL attempted:', pathOrUrl);
    throw err;
  }
}

/* CSV parser (same as before) */
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

/** Load sentences from remote CSV */
export const loadSentencesForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    // Convert batch001 to batch01 for URL
    const batchForUrl = batch.replace('batch', '').replace(/^0+/, '').padStart(2, '0');
    const csvUrl = `${CSV_BASE_URL}/batch${batchForUrl}/sentences_batch${batchForUrl}_v1.csv`;
    
    console.log(`💬 Loading sentences from: ${csvUrl}`);
    
    const allSentences = await readCSV(csvUrl);
    
    // Filter by difficulty
    const filteredSentences = allSentences.filter(sentence => 
      sentence.difficulty === difficulty
    );
    
    console.log(`✅ Loaded ${filteredSentences.length} sentences for ${difficulty} ${batch}`);
    return filteredSentences;
    
  } catch (error) {
    console.error(`❌ Error loading sentences:`, error);
    return [];
  }
};

/** Load words from remote CSV */
export const loadWordsForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    const batchForUrl = batch.replace('batch', '').replace(/^0+/, '').padStart(2, '0');
    const csvUrl = `${CSV_BASE_URL}/batch${batchForUrl}/words_v1.csv`;
    
    console.log(`🔤 Loading words from: ${csvUrl}`);
    
    const allWords = await readCSV(csvUrl);
    
    // Filter by difficulty
    const filteredWords = allWords.filter(word => 
      word.difficulty === difficulty
    );
    
    console.log(`✅ Loaded ${filteredWords.length} words for ${difficulty} ${batch}`);
    return filteredWords;
    
  } catch (error) {
    console.error(`❌ Error loading words:`, error);
    return [];
  }
};

/** Load pictures from remote CSV */  
export const loadPicturesForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    const batchForUrl = batch.replace('batch', '').replace(/^0+/, '').padStart(2, '0');
    const csvUrl = `${CSV_BASE_URL}/batch${batchForUrl}/pictures_batch${batchForUrl}_v1.csv`;
    
    console.log(`🖼️ Loading pictures from: ${csvUrl}`);
    
    const allPictures = await readCSV(csvUrl);
    
    // Filter by difficulty  
    const filteredPictures = allPictures.filter(picture => 
      picture.difficulty === difficulty
    );
    
    console.log(`✅ Loaded ${filteredPictures.length} pictures for ${difficulty} ${batch}`);
    return filteredPictures;
    
  } catch (error) {
    console.error(`❌ Error loading pictures:`, error);
    return [];
  }
};