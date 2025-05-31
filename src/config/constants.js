// src/config/constants.js
// --------------------------------------------------
// Central place to keep any URLs / fixed config.
// Updated with your actual CDN endpoint
// --------------------------------------------------

// Your CDN URL (production-ready, faster, cached globally)
// CDN URL (updated structure)
export const CDN_BASE = 'https://langappendpoint.azureedge.net';


// Fallback: Direct blob URL (for testing/backup)
// export const CDN_BASE = 'https://teststoreacc32.blob.core.windows.net/$web/v1'

export const buildUrl = (relativePath = '') => `${CDN_BASE}/${relativePath.replace(/^\/+/, '')}`;
export const MANIFEST_URL = `${CDN_BASE}/index_v1.json`;

/**
 * Helper – turn any relative path from the manifest
 * into a full URL.
 *   buildUrl('words/batch01/w_042/en.mp3')
 *   → https://langappendpoint.azureedge.net/$web/v1/words/batch01/w_042/en.mp3
 */

// Download settings
export const MAX_CONCURRENT_DOWNLOADS = 3;
export const SHORT_CACHE_SECONDS = 300; // for manifest refresh