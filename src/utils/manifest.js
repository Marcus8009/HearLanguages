import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

/* ------------------------------------------------------------------ */
/*  UPDATED MANIFEST SYSTEM FOR NEW BATCH STRUCTURE                   */
/* ------------------------------------------------------------------ */

/**
 * Load the main content manifest (v2 format)
 */
export async function loadContentManifest() {
  try {
    const path = FileSystem.documentDirectory + 'manifests/content_manifest_v2.json';
    
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      console.warn('Content manifest not found at:', path);
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(path);
    const manifest = JSON.parse(content);
    
    console.log('✅ Loaded content manifest v2:', {
      difficulties: manifest.content_info?.difficulties?.length || 0,
      languages: manifest.content_info?.languages?.length || 0,
      totalFiles: manifest.files?.length || 0
    });
    
    return manifest;
  } catch (error) {
    console.error('❌ Error loading content manifest:', error);
    return null;
  }
}

/**
 * Load a specific batch manifest
 */
export async function loadBatchManifest(difficulty, contentType, batch) {
  try {
    const filename = `${difficulty}_${contentType}_${batch}_manifest.json`;
    const path = FileSystem.documentDirectory + `manifests/${filename}`;
    
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      console.warn(`Batch manifest not found: ${filename}`);
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(path);
    const manifest = JSON.parse(content);
    
    console.log(`✅ Loaded batch manifest: ${difficulty} ${contentType} ${batch} (${manifest.files?.length || 0} files)`);
    return manifest;
  } catch (error) {
    console.error(`❌ Error loading batch manifest for ${difficulty} ${contentType} ${batch}:`, error);
    return null;
  }
}

/**
 * Get available batches for a difficulty and content type from manifest
 */
export async function getAvailableBatchesFromManifest(difficulty, contentType) {
  try {
    const manifest = await loadContentManifest();
    if (!manifest || !manifest.content_info || !manifest.content_info.batch_structure) {
      console.warn('No batch structure found in manifest');
      return [];
    }
    
    const batchStructure = manifest.content_info.batch_structure[difficulty];
    if (!batchStructure) {
      console.warn(`No batch structure found for difficulty ${difficulty}`);
      return [];
    }
    
    const batchKey = `${contentType}_batches`;
    const batches = batchStructure[batchKey] || [];
    
    console.log(`📊 Available ${contentType} batches for ${difficulty}:`, batches);
    return batches;
  } catch (error) {
    console.error(`❌ Error getting available batches for ${difficulty} ${contentType}:`, error);
    return [];
  }
}

/**
 * Verify a file exists and matches expected SHA-256
 */
export async function verifyFile(filePath, expectedSha256) {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) {
      console.warn(`File not found for verification: ${filePath}`);
      return false;
    }
    
    // For binary files (audio/images), read as base64 then convert
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    const isValid = hash === expectedSha256;
    if (!isValid) {
      console.warn(`SHA-256 mismatch for ${filePath}: expected ${expectedSha256}, got ${hash}`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`❌ Error verifying file ${filePath}:`, error);
    return false;
  }
}

/**
 * Verify all files in a batch
 */
export async function verifyBatch(difficulty, contentType, batch) {
  try {
    console.log(`🔍 Verifying batch: ${difficulty} ${contentType} ${batch}`);
    
    const manifest = await loadBatchManifest(difficulty, contentType, batch);
    if (!manifest || !manifest.files) {
      console.warn(`No manifest found for batch verification`);
      return false;
    }
    
    const verificationPromises = manifest.files.map(async (fileInfo) => {
      const filePath = FileSystem.documentDirectory + fileInfo.path;
      const isValid = await verifyFile(filePath, fileInfo.sha256);
      
      if (!isValid) {
        console.warn(`❌ Verification failed: ${fileInfo.path}`);
      }
      
      return { path: fileInfo.path, valid: isValid };
    });
    
    const results = await Promise.all(verificationPromises);
    const validFiles = results.filter(r => r.valid).length;
    const totalFiles = results.length;
    
    const isValid = validFiles === totalFiles;
    
    console.log(`📊 Batch verification ${difficulty} ${contentType} ${batch}: ${validFiles}/${totalFiles} files valid`);
    
    if (!isValid) {
      const invalidFiles = results.filter(r => !r.valid).map(r => r.path);
      console.warn(`❌ Invalid files:`, invalidFiles);
    }
    
    return isValid;
  } catch (error) {
    console.error(`❌ Error verifying batch ${difficulty} ${contentType} ${batch}:`, error);
    return false;
  }
}

/**
 * Get content statistics from manifest
 */
export async function getContentStats() {
  try {
    const manifest = await loadContentManifest();
    if (!manifest) {
      return null;
    }
    
    const stats = {
      total_files: manifest.files?.length || 0,
      by_type: {},
      by_language: {},
      by_difficulty: {},
      totals: manifest.content_info?.totals || {}
    };
    
    // Analyze files
    if (manifest.files) {
      manifest.files.forEach(file => {
        // By type
        const type = file.type || 'unknown';
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
        
        // By language (for audio files)
        if (file.language) {
          stats.by_language[file.language] = (stats.by_language[file.language] || 0) + 1;
        }
        
        // By difficulty (for audio files)
        if (file.difficulty) {
          stats.by_difficulty[file.difficulty] = (stats.by_difficulty[file.difficulty] || 0) + 1;
        }
      });
    }
    
    console.log('📊 Content statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting content stats:', error);
    return null;
  }
}

/**
 * Check if a specific batch is available locally
 */
export async function isBatchAvailable(difficulty, contentType, batch) {
  try {
    // Check if batch manifest exists
    const manifest = await loadBatchManifest(difficulty, contentType, batch);
    if (!manifest) {
      return false;
    }
    
    // Check if all files in the batch exist
    const fileChecks = await Promise.all(
      manifest.files.map(async (fileInfo) => {
        const filePath = FileSystem.documentDirectory + fileInfo.path;
        const info = await FileSystem.getInfoAsync(filePath);
        return info.exists;
      })
    );
    
    const allFilesExist = fileChecks.every(exists => exists);
    
    console.log(`📊 Batch ${difficulty} ${contentType} ${batch} available: ${allFilesExist}`);
    return allFilesExist;
  } catch (error) {
    console.error(`❌ Error checking batch availability for ${difficulty} ${contentType} ${batch}:`, error);
    return false;
  }
}

/**
 * Get download progress for content
 */
export async function getDownloadProgress() {
  try {
    const manifest = await loadContentManifest();
    if (!manifest) {
      return { total: 0, downloaded: 0, percentage: 0 };
    }
    
    const totalFiles = manifest.files.length;
    let downloadedFiles = 0;
    
    // Check each file exists
    for (const fileInfo of manifest.files) {
      const filePath = FileSystem.documentDirectory + fileInfo.path;
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        downloadedFiles++;
      }
    }
    
    const percentage = totalFiles > 0 ? Math.round((downloadedFiles / totalFiles) * 100) : 0;
    
    const progress = {
      total: totalFiles,
      downloaded: downloadedFiles,
      percentage
    };
    
    console.log('📊 Download progress:', progress);
    return progress;
  } catch (error) {
    console.error('❌ Error getting download progress:', error);
    return { total: 0, downloaded: 0, percentage: 0 };
  }
}

/**
 * Legacy support - load old format manifest (if needed)
 */
export async function loadManifest(batch) {
  try {
    console.warn('⚠️ Using legacy loadManifest function. Consider upgrading to loadContentManifest()');
    
    const path = FileSystem.documentDirectory + `manifest_${batch}.json`;
    const info = await FileSystem.getInfoAsync(path);
    
    if (!info.exists) {
      console.warn(`Legacy manifest not found: manifest_${batch}.json`);
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error loading legacy manifest:', error);
    return null;
  }
}

/**
 * Debug helper - list all available manifests
 */
export async function listAvailableManifests() {
  try {
    const manifestsDir = FileSystem.documentDirectory + 'manifests/';
    const info = await FileSystem.getInfoAsync(manifestsDir);
    
    if (!info.exists) {
      console.log('📂 No manifests directory found');
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(manifestsDir);
    const manifestFiles = files.filter(f => f.endsWith('.json'));
    
    console.log('📊 Available manifests:', manifestFiles);
    return manifestFiles;
  } catch (error) {
    console.error('❌ Error listing manifests:', error);
    return [];
  }
}