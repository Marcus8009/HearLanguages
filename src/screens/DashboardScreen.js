// src/screens/DashboardScreen.js - Updated for new batch management
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
import { useDownloader } from '../hooks/useDownloader';
import TransliterationToggle from '../components/TransliterationToggle';
import { getLangName, getLangFlag, getDifficultyName, DIFFICULTY_LEVELS } from '../config/constants';

export default function DashboardScreen({ navigation }) {
  const { 
    learningLang, 
    knownLang, 
    difficulty, 
    setDifficulty,
    downloadProgress, 
    downloadedBatches, 
    isBatchDownloaded,
    getBatchKey,
    getDownloadProgress,
    clearAllContent 
  } = useStore();

  const { downloadBatch, isDownloading, fetchAvailableBatches, clearAllContent: clearDownloads } = useDownloader();
  
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Learning features configuration
  const features = [
    { id: 'SentenceAudio', title: 'Sentence Audio', icon: '🔊', color: '#FF6B6B' },
    { id: 'Reconstruction', title: 'Sentence Reconstruction', icon: '🧩', color: '#4ECDC4' },
    { id: 'Picture', title: 'Describe the Picture', icon: '🖼️', color: '#45B7D1' },
    { id: 'WordMatch', title: 'Word Matching', icon: '🎯', color: '#96CEB4' },
  ];

  // Load available batches when difficulty changes
  useEffect(() => {
    if (learningLang && difficulty) {
      loadAvailableBatches();
    }
  }, [learningLang, difficulty]);

  const loadAvailableBatches = async () => {
    setLoadingBatches(true);
    try {
      // For development, we'll assume batches batch001-batch005 are available
      // In production, this would fetch from the server
      const batches = ['batch001', 'batch002', 'batch003', 'batch004', 'batch005'];
      setAvailableBatches(batches);
    } catch (error) {
      console.error('Failed to load available batches:', error);
      setAvailableBatches(['batch001']); // Fallback to at least one batch
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
      await downloadBatch(learningLang, knownLang, difficulty, batch);
      Alert.alert('Success', `${batch} downloaded successfully!`);
    } catch (error) {
      Alert.alert(
        'Download Failed', 
        `Failed to download ${batch}. Please check your internet connection and try again.`,
        [
          { text: 'Retry', onPress: () => handleDownloadBatch(batch) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
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
          onPress: async () => {
            const success = await clearDownloads();
            if (success) {
              clearAllContent();
              Alert.alert('Success', 'All content cleared successfully');
            } else {
              Alert.alert('Error', 'Failed to clear some content');
            }
          }
        }
      ]
    );
  };

  const handleChangeLanguages = () => {
    navigation.navigate('LanguageSelection');
  };

  const getBatchStatus = (batch) => {
    const learningDownloaded = isBatchDownloaded(learningLang, difficulty, batch);
    const knownDownloaded = isBatchDownloaded(knownLang, difficulty, batch);
    const learningProgress = getDownloadProgress(learningLang, difficulty, batch);
    const knownProgress = getDownloadProgress(knownLang, difficulty, batch);
    
    if (learningDownloaded && knownDownloaded) {
      return { status: 'downloaded', progress: 100 };
    } else if (learningProgress > 0 || knownProgress > 0) {
      return { status: 'downloading', progress: Math.max(learningProgress, knownProgress) };
    } else {
      return { status: 'available', progress: 0 };
    }
  };

  const canAccessFeatures = () => {
    // Check if at least one batch is fully downloaded
    return availableBatches.some(batch => {
      const { status } = getBatchStatus(batch);
      return status === 'downloaded';
    });
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
      {/* Header with language pair and difficulty */}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.difficultyScroll}>
          {Object.keys(DIFFICULTY_LEVELS).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.difficultyButtonActive
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[
                styles.difficultyCode,
                difficulty === level && styles.difficultyCodeActive
              ]}>
                {level}
              </Text>
              <Text style={[
                styles.difficultyName,
                difficulty === level && styles.difficultyNameActive
              ]}>
                {getDifficultyName(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Batch Management */}
      <View style={styles.batchSection}>
        <Text style={styles.sectionTitle}>Content Batches</Text>
        {loadingBatches ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4ECDC4" />
            <Text style={styles.loadingText}>Loading available batches...</Text>
          </View>
        ) : (
          <View style={styles.batchList}>
            {availableBatches.map((batch) => {
              const { status, progress } = getBatchStatus(batch);
              return (
                <View key={batch} style={styles.batchItem}>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{batch.replace('batch', 'Batch ')}</Text>
                    <Text style={styles.batchContent}>50 words • 50 sentences • 10 pictures</Text>
                  </View>
                  
                  <View style={styles.batchActions}>
                    {status === 'downloaded' ? (
                      <View style={styles.statusContainer}>
                        <Text style={styles.downloadedText}>✅ Downloaded</Text>
                        <TouchableOpacity 
                          style={styles.learnButton}
                          onPress={() => navigation.navigate('SentenceAudio', { batch })}
                        >
                          <Text style={styles.learnButtonText}>Learn</Text>
                        </TouchableOpacity>
                      </View>
                    ) : status === 'downloading' ? (
                      <View style={styles.statusContainer}>
                        <ActivityIndicator size="small" color="#4ECDC4" />
                        <Text style={styles.downloadingText}>
                          Downloading... {Math.round(progress)}%
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.downloadButton}
                        onPress={() => handleDownloadBatch(batch)}
                        disabled={isDownloading}
                      >
                        <Text style={styles.downloadButtonText}>📱 Download</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Learning Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Learning Activities</Text>
        {!canAccessFeatures() && (
          <Text style={styles.noContentText}>
            Download at least one batch to access learning activities
          </Text>
        )}
        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.card, 
                { backgroundColor: feature.color },
                !canAccessFeatures() && styles.cardDisabled
              ]}
              onPress={() => navigation.navigate(feature.id)}
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
          <Text style={styles.settingButtonText}>🌍 Change Languages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton} onPress={handleClearContent}>
          <Text style={styles.settingButtonText}>🗑️ Clear All Content</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  setupTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    color: '#333',
  },
  setupMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'NotoSans',
  },
  setupButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  languagePair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  languageInfo: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginBottom: 5,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  arrow: {
    fontSize: 24,
    color: '#4ECDC4',
    marginHorizontal: 30,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    color: '#333',
  },
  difficultySection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  difficultyScroll: {
    flexDirection: 'row',
  },
  difficultyButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  difficultyCode: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 4,
  },
  difficultyCodeActive: {
    color: 'white',
  },
  difficultyName: {
    fontSize: 12,
    fontFamily: 'NotoSans',
    color: '#666',
  },
  difficultyNameActive: {
    color: 'white',
  },
  batchSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  batchList: {
    gap: 15,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 4,
  },
  batchContent: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  batchActions: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  downloadedText: {
    color: '#28a745',
    fontFamily: 'NotoSans-Bold',
    fontSize: 14,
  },
  downloadingText: {
    color: '#4ECDC4',
    fontFamily: 'NotoSans',
    fontSize: 14,
    marginLeft: 8,
  },
  learnButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  learnButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
    fontSize: 14,
  },
  downloadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
    fontSize: 14,
  },
  featuresSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  noContentText: {
    color: '#999',
    fontFamily: 'NotoSans',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: 'white',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 40,
  },
  settingButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans',
    color: '#333',
  },
});