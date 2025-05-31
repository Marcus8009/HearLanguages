// csvLoader.js - Updated with difficulty filtering support
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/** Convert relative path into an absolute path under the app's Documents dir. */
const localPath = (relative) =>
  `${FileSystem.documentDirectory}${relative.replace(/^\/+/, '')}`;

/** ------------------------------------------------------------------ */
/** Low-level helper – read a CSV file from URL (web) or local file.   */
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
/*  Difficulty-aware convenience wrappers                             */
/* ------------------------------------------------------------------ */

export const loadWords = async (difficulty = null) => {
  try {
    const filePath = localPath('csv/batch01/words_v1.csv');
    console.log(`🔤 Loading words from: ${filePath}`);
    
    const allWords = await readCSV(filePath);
    
    if (difficulty) {
      const filteredWords = allWords.filter(word => word.difficulty === difficulty);
      console.log(`🎯 Filtered to ${filteredWords.length} words for difficulty ${difficulty}`);
      return filteredWords;
    }
    
    return allWords;
  } catch (e) {
    console.error('Error loading words:', e);
    return [];
  }
};

export const loadSentences = async (batch, difficulty = null) => {
  try {
    const filePath = localPath(`csv/${batch}/sentences_${batch}_v1.csv`);
    console.log(`💬 Loading sentences from: ${filePath}`);
    
    const allSentences = await readCSV(filePath);
    
    if (difficulty) {
      const filteredSentences = allSentences.filter(sentence => sentence.difficulty === difficulty);
      console.log(`🎯 Filtered to ${filteredSentences.length} sentences for difficulty ${difficulty}`);
      return filteredSentences;
    }
    
    return allSentences;
  } catch (e) {
    console.error('Error loading sentences:', e);
    return [];
  }
};

export const loadPictures = async (batch, difficulty = null) => {
  try {
    console.log(`🖼️ Loading pictures for batch: ${batch}${difficulty ? `, difficulty: ${difficulty}` : ''}`);
    
    const picturesPath = localPath(`csv/${batch}/pictures_${batch}_v1.csv`);
    const allPictures = await readCSV(picturesPath);
    
    if (difficulty) {
      const filteredPictures = allPictures.filter(picture => picture.difficulty === difficulty);
      console.log(`🎯 Filtered to ${filteredPictures.length} pictures for difficulty ${difficulty}`);
      return filteredPictures;
    }
    
    console.log(`📊 Loaded ${allPictures.length} pictures (all difficulties)`);
    return allPictures;
  } catch (e) {
    console.error('Error loading pictures:', e);
    return [];
  }
};

// Helper to get all available difficulties from any CSV
export const getAvailableDifficulties = async (type = 'sentences', batch = 'batch01') => {
  try {
    let data = [];
    switch (type) {
      case 'words':
        data = await loadWords();
        break;
      case 'sentences':
        data = await loadSentences(batch);
        break;
      case 'pictures':
        data = await loadPictures(batch);
        break;
    }
    
    const difficulties = [...new Set(data.map(item => item.difficulty))].sort();
    console.log(`📊 Available difficulties for ${type}:`, difficulties);
    return difficulties;
  } catch (error) {
    console.error(`Error getting difficulties for ${type}:`, error);
    return [];
  }
};

// Debug helper - list downloaded files
export const listDownloadedFiles = async () => {
  try {
    const baseDir = FileSystem.documentDirectory;
    console.log(`📁 Base directory: ${baseDir}`);
    
    // Check what's in the root
    const rootContents = await FileSystem.readDirectoryAsync(baseDir);
    console.log(`📂 Root contents:`, rootContents);
    
    // Check csv folder specifically  
    const csvDir = baseDir + 'csv/';
    const csvDirInfo = await FileSystem.getInfoAsync(csvDir);
    
    if (csvDirInfo.exists) {
      const csvContents = await FileSystem.readDirectoryAsync(csvDir);
      console.log(`📂 CSV folder contents:`, csvContents);
      
      // Check batch01 folder
      const batch01Dir = csvDir + 'batch01/';
      const batch01Info = await FileSystem.getInfoAsync(batch01Dir);
      
      if (batch01Info.exists) {
        const batch01Contents = await FileSystem.readDirectoryAsync(batch01Dir);
        console.log(`📂 Batch01 contents:`, batch01Contents);
      }
    }
    
    return rootContents;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};