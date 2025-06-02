// src/utils/csvLoader.js - Fixed for your actual structure
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const localPath = (relative) =>
  `${FileSystem.documentDirectory}${relative.replace(/^\/+/, '')}`;

export async function readCSV(pathOrUrl) {
  try {
    let text;
    if (Platform.OS === 'web') {
      const res = await fetch(pathOrUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } else {
      const info = await FileSystem.getInfoAsync(pathOrUrl);
      if (!info.exists) {
        throw new Error(`File not found: ${pathOrUrl}`);
      }
      text = await FileSystem.readAsStringAsync(pathOrUrl);
    }
    return parseCSV(text);
  } catch (err) {
    console.error('CSV read error:', err);
    throw err;
  }
}

const parseCSV = (content) => {
  if (!content?.trim()) return [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });
};

// Fixed loaders that work with your batch naming
export const loadWords = async (language, difficulty = 'A1') => {
  try {
    console.log(`🔤 Loading words for ${language} ${difficulty}`);
    
    // Use batch01 for CSV files (your naming convention)
    const csvPath = localPath(`csv/batch01/words_v1.csv`);
    const allWords = await readCSV(csvPath);
    
    // Filter by difficulty and language
    const filteredWords = allWords.filter(word => {
      const matchesDifficulty = word.difficulty === difficulty;
      const hasLanguageData = word[`${language}_word`] || word.base_en;
      return matchesDifficulty && hasLanguageData;
    });
    
    console.log(`✅ Loaded ${filteredWords.length} words`);
    return filteredWords;
  } catch (error) {
    console.error('Error loading words:', error);
    return [];
  }
};

export const loadSentences = async (language, difficulty = 'A1') => {
  try {
    console.log(`💬 Loading sentences for ${language} ${difficulty}`);
    
    const csvPath = localPath(`csv/batch01/sentences_batch01_v1.csv`);
    const allSentences = await readCSV(csvPath);
    
    // Filter sentences that have content for the requested language
    const filteredSentences = allSentences.filter(sentence => {
      const hasLanguageData = sentence[`${language}_sentence`] || sentence.base_en;
      return hasLanguageData;
    });
    
    console.log(`✅ Loaded ${filteredSentences.length} sentences`);
    return filteredSentences;
  } catch (error) {
    console.error('Error loading sentences:', error);
    return [];
  }
};

export const loadPictures = async (language, difficulty = 'A1') => {
  try {
    console.log(`🖼️ Loading pictures for ${language} ${difficulty}`);
    
    const csvPath = localPath(`csv/batch01/pictures_batch01_v1.csv`);
    const allPictures = await readCSV(csvPath);
    
    // Pictures seem to be universal, just return all
    console.log(`✅ Loaded ${allPictures.length} pictures`);
    return allPictures;
  } catch (error) {
    console.error('Error loading pictures:', error);
    return [];
  }
};

// Helper to get audio file path (using batch001 naming for audio)
export const getAudioPath = (contentType, filename, language, difficulty = 'A1') => {
  // Audio files use batch001 naming
  return localPath(`languages/${language}/${difficulty}/batch001/audio/${contentType}/${filename}`);
};

// ADDED: Functions that your screens expect
export const loadSentencesForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    console.log(`💬 Loading sentences for learning: ${learningLang}/${difficulty}/${batch}`);
    return await loadSentences(learningLang, difficulty);
  } catch (error) {
    console.error('Error in loadSentencesForLearning:', error);
    return [];
  }
};

export const loadWordsForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    console.log(`🔤 Loading words for learning: ${learningLang}/${difficulty}/${batch}`);
    return await loadWords(learningLang, difficulty);
  } catch (error) {
    console.error('Error in loadWordsForLearning:', error);
    return [];
  }
};

export const loadPicturesForLearning = async (learningLang, knownLang, difficulty, batch) => {
  try {
    console.log(`🖼️ Loading pictures for learning: ${learningLang}/${difficulty}/${batch}`);
    return await loadPictures(learningLang, difficulty);
  } catch (error) {
    console.error('Error in loadPicturesForLearning:', error);
    return [];
  }
};

// Debug helper
export const debugFiles = async () => {
  try {
    const baseDir = FileSystem.documentDirectory;
    console.log(`📁 Base: ${baseDir}`);
    
    // Check CSV files
    const csvDir = localPath('csv/batch01/');
    const csvInfo = await FileSystem.getInfoAsync(csvDir);
    console.log(`📂 CSV folder exists: ${csvInfo.exists}`);
    
    if (csvInfo.exists) {
      const csvFiles = await FileSystem.readDirectoryAsync(csvDir);
      console.log(`📂 CSV files:`, csvFiles);
    }
    
    // Check audio files
    const audioDir = localPath('languages/');
    const audioInfo = await FileSystem.getInfoAsync(audioDir);
    console.log(`📂 Audio languages folder exists: ${audioInfo.exists}`);
    
    if (audioInfo.exists) {
      const languages = await FileSystem.readDirectoryAsync(audioDir);
      console.log(`📂 Downloaded languages:`, languages);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
};