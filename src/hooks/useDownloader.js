// src/hooks/useDownloader.js - Reduced console logs
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';

const MAX_CONCURRENT = 3;
const BASE_URL = 'https://teststoreacc32.blob.core.windows.net/web';

export function useDownloader() {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [currentFile, setCurrentFile] = useState('');
  const { setDownloadedContent } = useStore();

  const getBatchName = (format) => {
    if (format === 'audio') return 'batch001';
    if (format === 'csv') return 'batch01';
    return 'batch001';
  };

  const downloadLanguageContent = async (learningLanguage, knownLanguage, selectedDifficulty) => {
    if (!learningLanguage || !selectedDifficulty) {
      throw new Error('Learning language and difficulty are required');
    }

    setDownloading(true);
    setProgress(0);

    try {
      const languages = [learningLanguage];
      if (knownLanguage && knownLanguage !== learningLanguage) {
        languages.push(knownLanguage);
      }

      let totalFiles = 0;
      let downloadedFiles = 0;
      const allDownloads = [];

      // Step 1: Download language manifests
      for (const lang of languages) {
        const langManifestUrl = `${BASE_URL}/manifests/languages/${lang}_manifest.json`;
        const langManifestPath = `${FileSystem.documentDirectory}manifests/languages/${lang}_manifest.json`;
        
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}manifests/languages/`, 
          { intermediates: true }
        );
        
        await FileSystem.downloadAsync(langManifestUrl, langManifestPath);
        
        const manifestText = await FileSystem.readAsStringAsync(langManifestPath);
        const manifest = JSON.parse(manifestText);
        
        const difficultyData = manifest.difficulties[selectedDifficulty];
        if (!difficultyData) continue;

        // Step 2: Download batch manifests and queue files
        for (const [contentType, typeData] of Object.entries(difficultyData)) {
          for (const audioBatch of typeData.batches) {
            if (audioBatch.startsWith('shared_')) continue;
            
            const batchManifestUrl = `${BASE_URL}/manifests/batches/${selectedDifficulty}_${contentType}_${lang}_${audioBatch}_manifest.json`;
            const batchManifestPath = `${FileSystem.documentDirectory}manifests/batches/${selectedDifficulty}_${contentType}_${lang}_${audioBatch}_manifest.json`;
            
            try {
              await FileSystem.makeDirectoryAsync(
                `${FileSystem.documentDirectory}manifests/batches/`, 
                { intermediates: true }
              );
              
              await FileSystem.downloadAsync(batchManifestUrl, batchManifestPath);
              
              const batchText = await FileSystem.readAsStringAsync(batchManifestPath);
              const batchManifest = JSON.parse(batchText);
              
              // Add audio files to download queue
              for (const file of batchManifest.files) {
                allDownloads.push({
                  url: `${BASE_URL}/${file.path}`,
                  localPath: `${FileSystem.documentDirectory}${file.path}`,
                  type: 'audio',
                  filename: file.path.split('/').pop()
                });
              }
              
              totalFiles += batchManifest.files.length;
              
              // Add CSV file to download queue
              const csvBatch = getBatchName('csv');
              const csvFilename = `${contentType}_${csvBatch}_v1.csv`;
              const csvUrl = `${BASE_URL}/csv/${csvBatch}/${csvFilename}`;
              const csvPath = `${FileSystem.documentDirectory}csv/${csvBatch}/${csvFilename}`;
              
              allDownloads.push({
                url: csvUrl,
                localPath: csvPath,
                type: 'csv',
                filename: csvFilename
              });
              totalFiles += 1;
              
            } catch (error) {
              // Silently continue with other batches
            }
          }
        }
      }

      console.log(`🚀 Downloading ${totalFiles} files...`);

      // Step 3: Download all files
      const downloadFile = async (fileInfo) => {
        try {
          setCurrentFile(fileInfo.filename);
          
          const dir = fileInfo.localPath.substring(0, fileInfo.localPath.lastIndexOf('/'));
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

          await FileSystem.downloadAsync(fileInfo.url, fileInfo.localPath);
          
          downloadedFiles++;
          const progressPercent = (downloadedFiles / totalFiles) * 100;
          setProgress(progressPercent);
          
          // Only log every 50 files or at major milestones
          if (downloadedFiles % 50 === 0 || downloadedFiles === totalFiles) {
            console.log(`📦 Progress: ${downloadedFiles}/${totalFiles} files (${Math.round(progressPercent)}%)`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed: ${fileInfo.filename}`);
        }
      };

      // Download with concurrency control
      for (let i = 0; i < allDownloads.length; i += MAX_CONCURRENT) {
        const batch = allDownloads.slice(i, i + MAX_CONCURRENT);
        await Promise.all(batch.map(downloadFile));
      }

      // Step 4: Mark content as downloaded
      const contentKey = `${learningLanguage}-${selectedDifficulty}`;
      setDownloadedContent(contentKey, true);
      
      if (knownLanguage && knownLanguage !== learningLanguage) {
        const knownContentKey = `${knownLanguage}-${selectedDifficulty}`;
        setDownloadedContent(knownContentKey, true);
      }

      console.log(`✅ Download complete: ${contentKey}`);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw error;
    } finally {
      setDownloading(false);
      setCurrentFile('');
      setProgress(0);
    }
  };

  const isContentDownloaded = (language, selectedDifficulty) => {
    const { downloadedContent } = useStore.getState();
    const contentKey = `${language}-${selectedDifficulty}`;
    return downloadedContent[contentKey] || false;
  };

  return {
    downloadLanguageContent,
    isContentDownloaded,
    progress,
    downloading,
    currentFile
  };
}