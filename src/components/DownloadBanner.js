import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store';
import { useDownloader } from '../hooks/useDownloader';

export default function DownloadBanner() {
  const { downloadProgress, downloadedBatches } = useStore();
  const { downloadBatch } = useDownloader();

  useEffect(() => {
    // Auto-download batch01 on app start - but only if not already downloaded
    if (!downloadedBatches.includes('batch01')) {
      console.log('🚀 DownloadBanner: Starting auto-download of batch01');
      downloadBatch('batch01');
    } else {
      console.log('✅ DownloadBanner: batch01 already downloaded');
    }
  }, [downloadedBatches]); // FIXED: Added dependency array

  const currentDownload = Object.entries(downloadProgress).find(([_, progress]) => progress < 100);

  if (!currentDownload && downloadedBatches.includes('batch01')) {
    // Download complete - don't show banner
    return null;
  }

  if (!currentDownload) {
    // No active download, but batch01 not marked as downloaded
    // This might happen if download is starting
    return (
      <View style={styles.banner}>
        <ActivityIndicator size="small" color="white" />
        <Text style={styles.text}>Preparing download...</Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <ActivityIndicator size="small" color="white" />
      <Text style={styles.text}>
        Downloading {currentDownload[0]}: {Math.round(currentDownload[1])}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontFamily: 'NotoSans',
    marginLeft: 10,
  },
});