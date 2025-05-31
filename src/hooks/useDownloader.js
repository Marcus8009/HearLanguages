// Replace your useDownloader.js with this simplified version for testing

import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';

const MAX_CONCURRENT = 3;

export function useDownloader() {
  const { updateDownloadProgress, markBatchDownloaded } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadBatch = async (batch) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    console.log(`🚀 Starting download for batch: ${batch}`);
    
    try {
      // HARDCODED CDN_BASE for testing - remove import issues
      const CDN_BASE = 'https://langappendpoint.azureedge.net';
      
      // Step 1: Download manifest
      const manifestUrl = `${CDN_BASE}/csv/${batch}/manifest_${batch}_v1.json`;
      console.log(`📥 Downloading manifest: ${manifestUrl}`);
      
      // First test: Can we fetch it?
      const response = await fetch(manifestUrl);
      console.log(`📊 Response status: ${response.status}, ok: ${response.ok}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const manifestText = await response.text();
      console.log(`📄 Manifest text length: ${manifestText.length}`);
      console.log(`📄 Manifest preview: ${manifestText.substring(0, 100)}...`);
      
      // Parse JSON
      let manifest;
      try {
        manifest = JSON.parse(manifestText);
        console.log(`✅ JSON parsed successfully`);
        console.log(`📁 Files in manifest: ${manifest.files?.length || 0}`);
      } catch (jsonError) {
        console.error(`❌ JSON parsing failed:`, jsonError);
        console.error(`📄 Full response: ${manifestText}`);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
      
      // Save manifest locally
      const manifestLocalPath = FileSystem.documentDirectory + `manifest_${batch}.json`;
      await FileSystem.writeAsStringAsync(manifestLocalPath, manifestText);
      console.log(`💾 Manifest saved to: ${manifestLocalPath}`);
      
      // Step 2: Download files
      if (!manifest.files || manifest.files.length === 0) {
        console.log(`⚠️ No files to download in manifest`);
        markBatchDownloaded(batch);
        return;
      }
      
      console.log(`📦 Starting download of ${manifest.files.length} files...`);
      
      let completed = 0;
      const totalFiles = manifest.files.length;
      
      // Download files in chunks
      for (let i = 0; i < manifest.files.length; i += MAX_CONCURRENT) {
        const chunk = manifest.files.slice(i, i + MAX_CONCURRENT);
        console.log(`📦 Downloading chunk ${Math.floor(i/MAX_CONCURRENT) + 1}/${Math.ceil(totalFiles/MAX_CONCURRENT)}`);
        
        await Promise.all(chunk.map(async (file, index) => {
          try {
            const fileUrl = `${CDN_BASE}/${file.path}`;
            const localPath = FileSystem.documentDirectory + file.path;
            
            // Create directory
            const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
            
            //console.log(`⬇️ Downloading: ${file.path}`);
            const result = await FileSystem.downloadAsync(fileUrl, localPath);
            
            completed++;
            const progress = (completed / totalFiles) * 100;
            updateDownloadProgress(batch, progress);
            
            if (completed % 10 === 0 || completed === totalFiles) {
              console.log(`📈 Progress: ${Math.round(progress)}% (${completed}/${totalFiles})`);
            }
            
          } catch (fileError) {
            console.error(`❌ Failed to download ${file.path}:`, fileError);
            // Don't throw - continue with other files
          }
        }));
      }
      
      markBatchDownloaded(batch);
      console.log(`🎉 Batch ${batch} download completed! ${completed}/${totalFiles} files downloaded.`);
      
    } catch (error) {
      console.error('💥 Download error:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadBatch, isDownloading };
}