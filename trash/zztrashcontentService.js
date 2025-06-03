C:\Users\hp\Documents\GenAI\language-learn-mvp\src\utils\zztrashcontentService.js
// contentService.js
// Manages downloading CSVs and loading parsed data for a given batch.
import * as FileSystem from 'expo-file-system';
import { readCSV } from './csvLoader';
import { buildUrl } from './constants';

/**
 * Download the sentences CSV for a batch into the app's documentDirectory.
 * Logs each step for easy debugging.
 * @param {string} batch - e.g. 'batch01'
 * @returns {Promise<string>} Local file URI of the downloaded CSV
 */
export async function downloadBatch(batch = 'batch01') {
  // 1. Construct remote URL
  const remote = buildUrl(`csv/${batch}/sentences_${batch}_v1.csv`);
  console.log('Downloading batch from:', remote);

  // 2. Ensure local directory exists
  const localDir = FileSystem.documentDirectory + `csv/${batch}/`;
  const localFile = localDir + `sentences_${batch}_v1.csv`;
  await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });

  // 3. Download remote CSV to local file
  const { uri, status } = await FileSystem.downloadAsync(remote, localFile);
  console.log(`Downloaded (${status}) →`, uri);

  // 4. Verify file exists
  const info = await FileSystem.getInfoAsync(uri);
  console.log('File exists?', info.exists);

  return uri;
}

/**
 * Load and parse the sentences CSV for a batch.
 * Automatically downloads the CSV first if not already present.
 * @param {string} batch - e.g. 'batch01'
 * @returns {Promise<Array<Object>>} Parsed CSV rows
 */
export async function loadBatchSentences(batch = 'batch01') {
  try {
    // Ensure CSV is downloaded and present
    const fileUri = await downloadBatch(batch);

    // Delegate parsing to csvLoader.readCSV
    const data = await readCSV(fileUri);
    return data;
  } catch (error) {
    console.error(`Error in loadBatchSentences for ${batch}:`, error);
    return [];
  }
}
