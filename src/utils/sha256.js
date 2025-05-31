import * as Crypto from 'expo-crypto';

export async function calculateSHA256(content) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    content,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}