// src/hooks/useDownloader.js
// Updated to work with hierarchical manifest system + CSV downloads

import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';
import { buildUrl, MAX_CONCURRENT_DOWNLOADS, DEBUG_DOWNLOADS } from '../config/constants';

class HierarchicalContentDownloader {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.rootManifest = null;
    this.languageManifests = new Map();
    this.downloadedBatches = new Set();
    this.downloadedCSVs = new Set(); // Track CSV downloads
  }

  async downloadCSVFiles(targetLanguage, targetDifficulty) {
    // Convert batch001 format to batch01 for CSV URLs
    const batch = 'batch01'; // Your CSVs are in batch01 folder
    
    const csvFiles = [
      {
        name: `sentences_${batch}_v1.csv`,
        url: `${this.baseUrl}csv/${batch}/sentences_${batch}_v1.csv`,
        localPath: `csv/${batch}/sentences_${batch}_v1.csv`
      },
      {
        name: `words_v1.csv`, 
        url: `${this.baseUrl}csv/${batch}/words_v1.csv`,
        localPath: `csv/${batch}/words_v1.csv`
      },
      {
        name: `pictures_${batch}_v1.csv`,
        url: `${this.baseUrl}csv/${batch}/pictures_${batch}_v1.csv`, 
        localPath: `csv/${batch}/pictures_${batch}_v1.csv`
      }
    ];

    console.log(`📄 Downloading CSV files for ${targetLanguage} ${targetDifficulty}...`);
    
    let csvDownloaded = 0;
    
    for (const csvFile of csvFiles) {
      try {
        // Check if already downloaded
        const csvKey = `${targetLanguage}_${targetDifficulty}_${csvFile.name}`;
        if (this.downloadedCSVs.has(csvKey)) {
          console.log(`⏭️ Skipping already downloaded CSV: ${csvFile.name}`);
          csvDownloaded++;
          continue;
        }

        const localPath = FileSystem.documentDirectory + csvFile.localPath;
        
        // Create directory structure
        const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        
        console.log(`📥 Downloading ${csvFile.name}...`);
        const result = await FileSystem.downloadAsync(csvFile.url, localPath);
        
        if (result.status === 200) {
          console.log(`✅ Downloaded ${csvFile.name}`);
          this.downloadedCSVs.add(csvKey);
          csvDownloaded++;
        } else {
          console.warn(`⚠️ Failed to download ${csvFile.name}: HTTP ${result.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Error downloading ${csvFile.name}:`, error);
      }
    }
    
    console.log(`📊 CSV Download Summary: ${csvDownloaded}/${csvFiles.length} files downloaded`);
    return csvDownloaded;
  }

  async downloadRootManifest() {
    try {
      if (DEBUG_DOWNLOADS) console.log('📥 Downloading root manifest...');
      const url = `${this.baseUrl}manifests/root_manifest.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Root manifest not found: ${url} returned ${response.status}`);
      }
      
      this.rootManifest = await response.json();
      if (DEBUG_DOWNLOADS) {
        console.log('✅ Root manifest loaded');
        console.log(`📊 Available: ${this.rootManifest.total_languages} languages, ${this.rootManifest.total_content_files} files`);
      }
      
      return this.rootManifest;
    } catch (error) {
      console.error('💥 Failed to load root manifest:', error);
      throw error;
    }
  }

  async downloadLanguageManifest(language) {
    if (this.languageManifests.has(language)) {
      if (DEBUG_DOWNLOADS) console.log(`📋 Using cached manifest for ${language}`);
      return this.languageManifests.get(language);
    }

    try {
      if (DEBUG_DOWNLOADS) console.log(`📥 Downloading manifest for ${language}...`);
      const url = `${this.baseUrl}manifests/languages/${language}_manifest.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Language manifest for ${language} not found: ${url} returned ${response.status}`);
      }
      
      const languageManifest = await response.json();
      this.languageManifests.set(language, languageManifest);
      
      if (DEBUG_DOWNLOADS) {
        console.log(`✅ Language manifest loaded for ${language} (${languageManifest.language_name})`);
        console.log(`📊 Available difficulties: ${Object.keys(languageManifest.difficulties).join(', ')}`);
      }
      
      return languageManifest;
      
    } catch (error) {
      console.error(`💥 Failed to load language manifest for ${language}:`, error);
      throw error;
    }
  }

  async downloadBatchManifest(language, difficulty, contentType, batch) {
    try {
      const batchId = `${difficulty}_${contentType}_${language}_${batch}`;
      if (DEBUG_DOWNLOADS) console.log(`📥 Downloading batch manifest: ${batchId}`);
      
      const url = `${this.baseUrl}manifests/batches/${batchId}_manifest.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Batch manifest not found: ${url} returned ${response.status}`);
      }
      
      const batchManifest = await response.json();
      if (DEBUG_DOWNLOADS) {
        console.log(`✅ Batch manifest loaded: ${batchManifest.file_count} files, ${this.formatBytes(batchManifest.total_bytes || 0)}`);
      }
      
      return batchManifest;
      
    } catch (error) {
      console.error(`💥 Failed to load batch manifest:`, error);
      throw error;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getAvailableLanguages() {
    return this.rootManifest?.languages || [];
  }

  getContentCounts(language, difficulty) {
    const langInfo = this.rootManifest?.languages.find(l => l.code === language);
    return langInfo?.content_counts?.[difficulty] || {};
  }
}

export function useDownloader() {
  const { updateDownloadProgress, markBatchDownloaded, learningLang, knownLang, difficulty } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloader] = useState(() => new HierarchicalContentDownloader(buildUrl('')));

  // Helper to convert batch01 to batch001 format and vice versa
  const getBatchNumber = (batch) => {
    // You already use batch001 format, so keep it as is
    return batch === 'batch01' ? 'batch001' : batch;
  };

  const convertBatchToAppFormat = (batch) => {
    // Convert batch001 back to batch01 for app compatibility
    return batch.replace('batch', '').replace(/^0+/, '').padStart(2, '0');
  };

  const mapFileToAppStructure = (file, batch) => {
    // Your structure: languages/en/B1/batch001/audio/sentences/sent_501.mp3
    // App expects: sentences/batch01/sent_501/B1/en.mp3
    
    const parts = file.path.split('/');
    const language = parts[1]; // en, zh, ja, etc
    const difficulty = parts[2]; // B1, A1, etc
    const batchNum = parts[3]; // batch001
    const contentType = parts[5]; // sentences, words, pictures
    const filename = parts[6]; // sent_501.mp3, w_011.mp3, pic_023.mp3
    
    // Convert batch001 back to batch01
    const appBatch = convertBatchToAppFormat(batchNum);
    const appBatchName = `batch${appBatch}`;
    
    if (contentType === 'sentences') {
      // sentences/batch01/sent_501/B1/en.mp3
      const sentenceId = filename.replace('.mp3', '');
      return `sentences/${appBatchName}/${sentenceId}/${difficulty}/${language}.mp3`;
      
    } else if (contentType === 'words') {
      // words/en/w_011.mp3 (simplified structure for words)
      return `words/${language}/${filename}`;
      
    } else if (contentType === 'pictures') {
      // pictures/batch01/pic_023/B1/en.mp3
      const pictureId = filename.replace('.mp3', '');
      return `pictures/${appBatchName}/${pictureId}/${difficulty}/${language}.mp3`;
    }
    
    // Fallback - keep original structure
    return file.path;
  };

  const downloadAndMapFile = async (file, batch) => {
    // Download from your current structure
    const fileUrl = buildUrl(file.path);
    
    // Map to expected app structure
    const mappedPath = mapFileToAppStructure(file, batch);
    const localPath = FileSystem.documentDirectory + mappedPath;
    
    // Create directory structure
    const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    
    if (DEBUG_DOWNLOADS) {
      console.log(`⬇️ ${file.path} → ${mappedPath}`);
    }
    
    // Download file
    const result = await FileSystem.downloadAsync(fileUrl, localPath);
    
    if (result.status !== 200) {
      throw new Error(`HTTP ${result.status} downloading ${file.path}`);
    }
    
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (!fileInfo.exists) {
      throw new Error(`Downloaded file not found: ${localPath}`);
    }
    
    if (DEBUG_DOWNLOADS && file.bytes && Math.abs(fileInfo.size - file.bytes) > 100) {
      console.warn(`⚠️ Size difference for ${mappedPath}: expected ${file.bytes}, got ${fileInfo.size}`);
    }
  };

  // New hierarchical download method
  const downloadContentForLanguage = async (targetLanguage, targetDifficulty) => {
    if (isDownloading) {
      console.log(`⚠️ Download already in progress`);
      return;
    }
    setIsDownloading(true);
    try {
      // Download for both learningLang and knownLang if different
      const langsToDownload = [targetLanguage];
      if (knownLang && knownLang !== targetLanguage) {
        langsToDownload.push(knownLang);
      }
      const results = {};
      for (const lang of langsToDownload) {
        // Step 1: Ensure root manifest is loaded
        if (!downloader.rootManifest) {
          await downloader.downloadRootManifest();
        }
        // Step 2: Check if language/difficulty is available
        const langInfo = downloader.rootManifest.languages.find(l => l.code === lang);
        if (!langInfo) {
          const availableLanguages = downloader.rootManifest.languages.map(l => l.code).join(', ');
          throw new Error(`Language ${lang} not available. Available: ${availableLanguages}`);
        }
        if (!langInfo.difficulties.includes(targetDifficulty)) {
          throw new Error(`Difficulty ${targetDifficulty} not available for ${lang}. Available: ${langInfo.difficulties.join(', ')}`);
        }
        // Step 2.5: Download CSV files FIRST (NEW)
        try {
          await downloader.downloadCSVFiles(lang, targetDifficulty);
        } catch (csvError) {
          console.warn(`⚠️ CSV download failed: ${csvError.message}`);
          // Continue with audio download even if CSV fails
        }
        // Step 3: Download language manifest
        const languageManifest = await downloader.downloadLanguageManifest(lang);
        const difficultyInfo = languageManifest.difficulties[targetDifficulty];
        if (!difficultyInfo) {
          throw new Error(`No content found for ${lang} at ${targetDifficulty} level in language manifest`);
        }
        // Step 4: Download content by batches
        const contentTypes = ['sentences', 'words', 'pictures'];
        for (const contentType of contentTypes) {
          if (difficultyInfo[contentType]) {
            const batches = difficultyInfo[contentType].batches;
            for (const batch of batches) {
              try {
                const batchId = `${lang}_${targetDifficulty}_${contentType}_${batch}`;
                if (downloader.downloadedBatches.has(batchId)) continue;
                const batchManifest = await downloader.downloadBatchManifest(
                  lang, targetDifficulty, contentType, batch
                );
                const batchFiles = batchManifest.files || [];
                for (let i = 0; i < batchFiles.length; i += MAX_CONCURRENT_DOWNLOADS) {
                  const chunk = batchFiles.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
                  await Promise.allSettled(
                    chunk.map(async (file) => {
                      try {
                        await downloadAndMapFile(file, batch);
                      } catch (fileError) {
                        console.error(`❌ Failed to download ${file.path}:`, fileError.message);
                      }
                    })
                  );
                }
                downloader.downloadedBatches.add(batchId);
                // Mark batch as downloaded for this language/contentType/batch
                markBatchDownloaded(`${lang}_${targetDifficulty}_${contentType}_${batch}`);
              } catch (error) {
                console.warn(`⚠️ Failed to download batch ${batch} for ${contentType}:`, error);
              }
            }
          }
        }
      }
      // Mark 'hierarchical' as downloaded if both languages are done
      markBatchDownloaded('hierarchical');
      updateDownloadProgress('hierarchical', 100);
      setIsDownloading(false);
      return results;
    } catch (error) {
      updateDownloadProgress('hierarchical', 0);
      setIsDownloading(false);
      throw new Error(`Failed to download content: ${error.message}`);
    }
  };

  // Legacy batch download method (kept for compatibility)
  const downloadBatch = async (batch) => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const batchFormatted = getBatchNumber(batch);
      const currentDifficulty = difficulty || 'A1';
      const currentLanguage = learningLang || 'en';

      const manifestTypes = ['sentences', 'words', 'pictures'];
      const allFiles = [];

      for (const type of manifestTypes) {
        try {
          const batchManifest = await downloader.downloadBatchManifest(
            currentLanguage, currentDifficulty, type, batchFormatted
          );
          allFiles.push(...(batchManifest.files || []));
        } catch (error) {
          continue;
        }
      }

      if (allFiles.length === 0) {
        throw new Error(`No files found in any manifest for ${batch}`);
      }

      const totalFiles = allFiles.length;
      let completed = 0;
      const errors = [];

      updateDownloadProgress(batch, 0);

      for (let i = 0; i < totalFiles; i += MAX_CONCURRENT_DOWNLOADS) {
        const chunk = allFiles.slice(i, i + MAX_CONCURRENT_DOWNLOADS);

        await Promise.allSettled(
          chunk.map(async (file) => {
            try {
              await downloadAndMapFile(file, batch);
              completed++;
            } catch (fileError) {
              errors.push({
                file: file.path,
                error: fileError.message
              });
            }
          })
        );
      }

      const successCount = completed;
      const failureCount = errors.length;

      if (successCount > totalFiles * 0.8) {
        markBatchDownloaded(batch);
      } else {
        throw new Error(`Download incomplete: only ${successCount}/${totalFiles} files downloaded`);
      }

    } catch (error) {
      updateDownloadProgress(batch, 0);
      throw new Error(`Failed to download batch ${batch}: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadBatch,
    downloadContentForLanguage,
    isDownloading,
    getAvailableLanguages: () => downloader.getAvailableLanguages(),
    getContentCounts: (language, difficulty) => downloader.getContentCounts(language, difficulty)
  };
}