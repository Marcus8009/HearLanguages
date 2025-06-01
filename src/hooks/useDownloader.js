// src/hooks/useDownloader.js - Updated for new batch-based architecture
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { useStore } from '../store';
import { ENDPOINTS, DOWNLOAD_CONFIG, LOCAL_PATHS } from '../config/constants';

export function useDownloader() {
  const { updateDownloadProgress, markBatchDownloaded } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Download a single batch for both learning and known languages
   */
  const downloadBatch = async (learningLang, knownLang, difficulty, batch) => {
    if (isDownloading) {
      console.log('⚠️ Download already in progress, skipping');
      return;
    }
    
    setIsDownloading(true);
    console.log(`🚀 Starting download: ${learningLang}↔${knownLang} ${difficulty} ${batch}`);
    
    try {
      // Download both language packs in parallel
      const [learningSuccess, knownSuccess] = await Promise.all([
        downloadLanguagePack(learningLang, difficulty, batch),
        downloadLanguagePack(knownLang, difficulty, batch)
      ]);
      
      if (learningSuccess && knownSuccess) {
        // Mark batch as downloaded only if both succeed
        const learningBatchKey = `${learningLang}_${difficulty}_${batch}`;
        const knownBatchKey = `${knownLang}_${difficulty}_${batch}`;
        
        markBatchDownloaded(learningBatchKey);
        markBatchDownloaded(knownBatchKey);
        
        console.log(`✅ Batch download completed: ${learningLang}↔${knownLang} ${difficulty} ${batch}`);
        return true;
      } else {
        throw new Error(`Failed to download complete batch data`);
      }
      
    } catch (error) {
      console.error('💥 Batch download failed:', error);
      throw error;
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Download content pack for a single language
   */
  const downloadLanguagePack = async (lang, difficulty, batch) => {
    console.log(`📦 Downloading language pack: ${lang} ${difficulty} ${batch}`);
    
    const batchKey = `${lang}_${difficulty}_${batch}`;
    
    try {
      // Step 1: Download batch manifest
      const manifestUrl = ENDPOINTS.getBatchManifest(lang, difficulty, batch);
      console.log(`📋 Downloading manifest: ${manifestUrl}`);
      
      const manifestResponse = await fetchWithRetry(manifestUrl);
      const manifestText = await manifestResponse.text();
      const manifest = JSON.parse(manifestText);
      
      console.log(`📊 Manifest loaded: ${manifest.files?.length || 0} files`);
      
      // Save manifest locally
      const manifestPath = LOCAL_PATHS.getBatchManifestPath(lang, difficulty, batch);
      const manifestLocalPath = `${FileSystem.documentDirectory}${manifestPath}`;
      await ensureDirectoryExists(manifestLocalPath);
      await FileSystem.writeAsStringAsync(manifestLocalPath, manifestText);
      
      // Step 2: Download content files
      const contentFiles = ['words.csv', 'sentences.csv', 'pictures.csv'];
      const contentPromises = contentFiles.map(async (filename) => {
        const remoteUrl = ENDPOINTS.getBatchContent(lang, difficulty, batch, filename.replace('.csv', ''));
        const localPath = LOCAL_PATHS.getBatchContentPath(lang, difficulty, batch, filename.replace('.csv', ''));
        const fullLocalPath = `${FileSystem.documentDirectory}${localPath}`;
        
        return downloadFile(remoteUrl, fullLocalPath, batchKey, filename);
      });
      
      // Step 3: Download audio files (if manifest specifies them)
      const audioPromises = [];
      if (manifest.files) {
        const audioFiles = manifest.files.filter(file => file.path.includes('/audio/'));
        
        for (const audioFile of audioFiles) {
          const remoteUrl = `${ENDPOINTS.CDN_BASE}/languages/${lang}/${difficulty}/${batch}/${audioFile.path}`;
          const fullLocalPath = `${FileSystem.documentDirectory}languages/${lang}/${difficulty}/${batch}/${audioFile.path}`;
          
          audioPromises.push(
            downloadFile(remoteUrl, fullLocalPath, batchKey, audioFile.path, audioFile.sha256)
          );
        }
      }
      
      // Execute downloads with concurrency limit
      const allDownloads = [...contentPromises, ...audioPromises];
      await downloadWithConcurrencyLimit(allDownloads, DOWNLOAD_CONFIG.MAX_CONCURRENT_DOWNLOADS);
      
      // Update progress to 100%
      updateDownloadProgress(batchKey, 100);
      
      console.log(`✅ Language pack downloaded: ${lang} ${difficulty} ${batch}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Language pack download failed for ${lang} ${difficulty} ${batch}:`, error);
      updateDownloadProgress(batchKey, 0); // Reset progress on failure
      return false;
    }
  };

  /**
   * Download a single file with progress tracking
   */
  const downloadFile = async (remoteUrl, localPath, batchKey, filename, expectedSha256 = null) => {
    try {
      console.log(`⬇️ Downloading: ${filename}`);
      
      // Ensure directory exists
      await ensureDirectoryExists(localPath);
      
      // Download file
      const result = await FileSystem.downloadAsync(remoteUrl, localPath);
      
      // Verify SHA-256 if provided
      if (expectedSha256) {
        const fileContent = await FileSystem.readAsStringAsync(localPath);
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          fileContent,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        
        if (hash !== expectedSha256) {
          throw new Error(`SHA-256 mismatch for ${filename}`);
        }
      }
      
      console.log(`✅ Downloaded: ${filename}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error);
      throw error;
    }
  };

  /**
   * Fetch with retry logic
   */
  const fetchWithRetry = async (url, attempts = DOWNLOAD_CONFIG.RETRY_ATTEMPTS) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, { 
          timeout: DOWNLOAD_CONFIG.TIMEOUT 
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
        
      } catch (error) {
        console.warn(`⚠️ Fetch attempt ${i + 1}/${attempts} failed for ${url}:`, error.message);
        
        if (i === attempts - 1) {
          throw error; // Last attempt failed
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, DOWNLOAD_CONFIG.RETRY_DELAY * (i + 1)));
      }
    }
  };

  /**
   * Download multiple files with concurrency control
   */
  const downloadWithConcurrencyLimit = async (downloadPromises, maxConcurrent) => {
    const results = [];
    
    for (let i = 0; i < downloadPromises.length; i += maxConcurrent) {
      const chunk = downloadPromises.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
      
      // Update overall progress
      const progress = (results.length / downloadPromises.length) * 100;
      console.log(`📈 Download progress: ${Math.round(progress)}%`);
    }
    
    return results;
  };

  /**
   * Ensure directory exists for a file path
   */
  const ensureDirectoryExists = async (filePath) => {
    const directory = filePath.substring(0, filePath.lastIndexOf('/'));
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  };

  /**
   * Check available batches on the server
   */
  const fetchAvailableBatches = async (lang, difficulty) => {
    try {
      const manifestUrl = ENDPOINTS.getDifficultyManifest(lang, difficulty);
      const response = await fetchWithRetry(manifestUrl);
      const manifest = await response.json();
      
      return manifest.batches || [];
    } catch (error) {
      console.error(`❌ Failed to fetch available batches for ${lang} ${difficulty}:`, error);
      return [];
    }
  };

  /**
   * Clear all downloaded content
   */
  const clearAllContent = async () => {
    try {
      const languagesDir = FileSystem.documentDirectory + 'languages/';
      const dirInfo = await FileSystem.getInfoAsync(languagesDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(languagesDir);
        console.log('🗑️ All downloaded content cleared');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing content:', error);
      return false;
    }
  };

  return {
    downloadBatch,
    downloadLanguagePack,
    fetchAvailableBatches,
    clearAllContent,
    isDownloading,
  };
}