import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export async function loadManifest(batch) {
  try {
    const path = FileSystem.documentDirectory + `manifest_${batch}.json`;
    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading manifest:', error);
    return null;
  }
}

export async function verifyFile(filePath, expectedSha256) {
  try {
    const content = await FileSystem.readAsStringAsync(filePath);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash === expectedSha256;
  } catch (error) {
    console.error('Error verifying file:', error);
    return false;
  }
}