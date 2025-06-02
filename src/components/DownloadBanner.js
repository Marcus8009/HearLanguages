// src/components/DownloadBanner.js - Updated for language-specific content
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store';

export default function DownloadBanner() {
  const { 
    downloadProgress, 
    learningLang, 
    knownLang, 
    difficulty,
    isCurrentContentDownloaded 
  } = useStore();

  // Check if current language combination is downloaded
  const isContentDownloaded = isCurrentContentDownloaded();
  const currentDownload = Object.entries(downloadProgress).find(([_, progress]) => progress < 100);

  // Don't show banner if content is already downloaded and no active downloads
  if (isContentDownloaded && !currentDownload) {
    return null;
  }

  // Don't show banner if no languages are selected yet
  if (!learningLang || !knownLang) {
    return null;
  }

  const getLangName = (code) => {
    const names = {
      'en': 'English',
      'zh': 'Chinese', 
      'ja': 'Japanese',
      'es': 'Spanish',
      'fr': 'French'
    };
    return names[code] || code.toUpperCase();
  };

  if (!currentDownload) {
    // No active download, but content not marked as downloaded
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
        Downloading {getLangName(learningLang)} ↔ {getLangName(knownLang)} ({difficulty}): {Math.round(currentDownload[1])}%
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
    fontSize: 14,
  },
});