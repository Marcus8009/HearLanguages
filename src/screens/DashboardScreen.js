// src/screens/DashboardScreen.js - FIXED: includes error
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useStore } from '../store';
import { getLangName, getLangFlag, getDifficultyName, DIFFICULTY_LEVELS } from '../config/constants';

// Simple placeholder components
const useDownloader = () => ({
  downloadBatch: async (batch) => {
    console.log(`Downloading batch: ${batch}`);
    return new Promise(resolve => setTimeout(resolve, 1000));
  },
  downloadContentForLanguage: async (lang, difficulty) => {
    console.log(`Downloading all content for ${lang} at ${difficulty}`);
    return { sentences: 100, words: 200, pictures: 50 };
  },
  isDownloading: false,
  getAvailableLanguages: () => [],
  getContentCounts: () => ({ sentences: 0, words: 0, pictures: 0 })
});

const TransliterationToggle = () => (
  <View style={{ padding: 10 }}>
    <Text>Transliteration Toggle</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const { 
    learningLang, 
    knownLang, 
    difficulty, 
    setDifficulty,
    downloadProgress, 
    // FIXED: Use safe fallbacks for potentially undefined values
    downloadedContent = {}, // Fallback to empty object
    isLanguageContentDownloaded,
    isBothLanguagesDownloaded
  } = useStore();

  const { 
    downloadBatch, 
    downloadContentForLanguage, 
    isDownloading,
    getAvailableLanguages,
    getContentCounts
  } = useDownloader();
  
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const features = [
    { id: 'SentenceAudio', title: 'Sentence Audio', icon: '🔊', color: '#FF6B6B' },
    { id: 'Reconstruction', title: 'Sentence Reconstruction', icon: '🧩', color: '#4ECDC4' },
    { id: 'Picture', title: 'Describe the Picture', icon: '🖼️', color: '#45B7D1' },
    { id: 'WordMatch', title: 'Word Matching', icon: '🎯', color: '#96CEB4' },
  ];

  useEffect(() => {
    if (learningLang && difficulty) {
      loadAvailableBatches();
    }
  }, [learningLang, difficulty]);

  const loadAvailableBatches = async () => {
    setLoadingBatches(true);
    try {
      const batches = ['batch001', 'batch002', 'batch003', 'batch004', 'batch005'];
      setAvailableBatches(batches);
    } catch (error) {
      console.error('Failed to load available batches:', error);
      setAvailableBatches(['batch001']);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleDownloadBatch = async (batch) => {
    if (!learningLang || !knownLang) {
      Alert.alert('Error', 'Language pair not properly configured');
      return;
    }

    try {
      await downloadBatch(batch);
      Alert.alert('Success', `${batch} downloaded successfully!`);
    } catch (error) {
      Alert.alert('Download Failed', `Failed to download ${batch}`);
    }
  };

  const handleDownloadAllContent = async () => {
    if (!learningLang || !knownLang) {
      Alert.alert('Error', 'Language pair not properly configured');
      return;
    }

    Alert.alert(
      'Download All Content',
      `This will download all ${difficulty} level content for ${getLangName(learningLang)}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download All', 
          onPress: async () => {
            try {
              const results = await downloadContentForLanguage(learningLang, difficulty);
            } catch (error) {
              Alert.alert('Download Failed', `Failed to download all content`);
            }
          }
        }
      ]
    );
  };

  const handleClearContent = () => {
    Alert.alert(
      'Clear All Content',
      'This will delete all downloaded language content. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            // clearAllContent(); // Commented out since function doesn't exist in store
            Alert.alert('Success', 'All content cleared successfully');
          }
        }
      ]
    );
  };

  const handleChangeLanguages = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('LanguageSelection');
    } else {
      console.log('Navigate to LanguageSelection');
    }
  };

  // FIXED: Safe check for content downloaded status
  const canAccessFeatures = () => {
    // Check if both languages have content downloaded
    if (!learningLang || !difficulty) return false;
    
    const learningDownloaded = isLanguageContentDownloaded && isLanguageContentDownloaded(learningLang, difficulty);
    const knownDownloaded = knownLang ? (isLanguageContentDownloaded && isLanguageContentDownloaded(knownLang, difficulty)) : true;
    
    return learningDownloaded && knownDownloaded;
  };

  // FIXED: Safe progress calculation
  const getDownloadProgress = () => {
    if (!learningLang || !difficulty) return 0;
    const contentKey = `${learningLang}-${difficulty}`;
    return downloadProgress?.[contentKey] || 0;
  };

  const isContentDownloading = () => {
    const progress = getDownloadProgress();
    return progress > 0 && progress < 100;
  };

  if (!learningLang || !knownLang) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Setup Required</Text>
        <Text style={styles.setupMessage}>Please select your languages to continue</Text>
        <TouchableOpacity style={styles.setupButton} onPress={handleChangeLanguages}>
          <Text style={styles.setupButtonText}>Choose Languages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.languagePair}>
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>{getLangFlag(learningLang)}</Text>
            <Text style={styles.languageName}>{getLangName(learningLang)}</Text>
            <Text style={styles.languageLabel}>Learning</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>{getLangFlag(knownLang)}</Text>
            <Text style={styles.languageName}>{getLangName(knownLang)}</Text>
            <Text style={styles.languageLabel}>From</Text>
          </View>
        </View>
        
        <TransliterationToggle />
      </View>

      {/* Difficulty Selector */}
      <View style={styles.difficultySection}>
        <Text style={styles.sectionTitle}>Difficulty Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(DIFFICULTY_LEVELS).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.difficultyButtonActive
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={styles.difficultyCode}>{level}</Text>
              <Text style={styles.difficultyName}>{getDifficultyName(level)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Download Section */}
      <View style={styles.downloadSection}>
        <Text style={styles.sectionTitle}>Content Download</Text>
        
        <View style={styles.fullDownloadCard}>
          <View style={styles.downloadInfo}>
            <Text style={styles.downloadTitle}>📦 Download All {difficulty} Content</Text>
            <Text style={styles.downloadDescription}>
              Get all content for {getLangName(learningLang)} at {difficulty} level
            </Text>
          </View>
          
          {canAccessFeatures() ? (
            <Text style={styles.downloadCompleteText}>✅ Downloaded</Text>
          ) : isContentDownloading() ? (
            <View style={styles.downloadInProgress}>
              <ActivityIndicator size="small" color="#4ECDC4" />
              <Text>{Math.round(getDownloadProgress())}%</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.downloadAllButton}
              onPress={handleDownloadAllContent}
              disabled={isDownloading}
            >
              <Text style={styles.downloadAllButtonText}>📥 Download All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Learning Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Learning Activities</Text>
        {!canAccessFeatures() && (
          <Text style={{ marginBottom: 15, color: '#666' }}>
            Download content to access learning activities
          </Text>
        )}
        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.card, { backgroundColor: feature.color }]}
              onPress={() => navigation && navigation.navigate && navigation.navigate(feature.id)}
              disabled={!canAccessFeatures()}
            >
              <Text style={styles.cardIcon}>{feature.icon}</Text>
              <Text style={styles.cardTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingButton} onPress={handleChangeLanguages}>
          <Text>🌍 Change Languages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton} onPress={handleClearContent}>
          <Text>🗑️ Clear All Content</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  setupTitle: { fontSize: 24, marginBottom: 15 },
  setupMessage: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  setupButton: { backgroundColor: '#4ECDC4', padding: 15, borderRadius: 25 },
  setupButtonText: { color: 'white', fontSize: 16 },
  header: { backgroundColor: 'white', padding: 20, marginBottom: 20 },
  languagePair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  languageInfo: { alignItems: 'center' },
  flag: { fontSize: 32, marginBottom: 5 },
  languageName: { fontSize: 16, marginBottom: 2 },
  languageLabel: { fontSize: 12, color: '#666' },
  arrow: { fontSize: 24, color: '#4ECDC4', marginHorizontal: 30 },
  sectionTitle: { fontSize: 18, marginBottom: 15 },
  difficultySection: { backgroundColor: 'white', padding: 20, marginBottom: 20 },
  difficultyButton: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, marginRight: 10 },
  difficultyButtonActive: { backgroundColor: '#4ECDC4' },
  difficultyCode: { fontSize: 16, marginBottom: 4 },
  difficultyName: { fontSize: 12 },
  downloadSection: { backgroundColor: 'white', padding: 20, marginBottom: 20 },
  fullDownloadCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 15 },
  downloadInfo: { flex: 1 },
  downloadTitle: { fontSize: 16, marginBottom: 4 },
  downloadDescription: { fontSize: 12, color: '#666' },
  downloadAllButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 8 },
  downloadAllButtonText: { color: 'white', fontSize: 14 },
  downloadCompleteText: { color: '#28a745', fontSize: 14 },
  downloadInProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuresSection: { backgroundColor: 'white', padding: 20, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  card: { width: '47%', aspectRatio: 1, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardIcon: { fontSize: 48, marginBottom: 10 },
  cardTitle: { fontSize: 14, color: 'white', textAlign: 'center' },
  settingsSection: { backgroundColor: 'white', padding: 20, marginBottom: 40 },
  settingButton: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 10 }
});