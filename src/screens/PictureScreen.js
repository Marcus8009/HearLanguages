// src/screens/PictureScreen.js - Fully corrected for new architecture
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useStore } from '../store';
import { loadPicturesForLearning } from '../utils/csvLoader';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import * as FileSystem from 'expo-file-system';

export default function PictureScreen({ route, navigation }) {
  const { learningLang, knownLang, difficulty, isBatchDownloaded } = useStore();
  const { playAudio } = useAudioPlayer();
  
  const [pictures, setPictures] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentBatch, setCurrentBatch] = useState('batch001');
  const [availableBatches, setAvailableBatches] = useState([]);

  // Get batch from navigation params or use default
  useEffect(() => {
    const batch = route?.params?.batch || 'batch001';
    setCurrentBatch(batch);
  }, [route?.params?.batch]);

  // Load pictures when batch, difficulty, or languages change
  useEffect(() => {
    loadPicturesForCurrentBatch();
    findAvailableBatches();
  }, [learningLang, knownLang, difficulty, currentBatch]);

  // Timer effect for current picture
  useEffect(() => {
    if (pictures[currentIndex] && !showAnswer) {
      const displayMs = pictures[currentIndex].display_ms || 10000;
      setTimeRemaining(displayMs / 1000);
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowAnswer(true);
            // Auto-play audio when answer appears
            setTimeout(() => {
              handlePlayAnswer();
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentIndex, pictures, showAnswer]);

  const loadPicturesForCurrentBatch = async () => {
    if (!learningLang || !knownLang) return;

    setLoading(true);
    try {
      console.log(`🖼️ Loading pictures for ${currentBatch} ${difficulty}`);
      
      // Check if batch is downloaded
      if (!isBatchDownloaded(learningLang, difficulty, currentBatch) || 
          !isBatchDownloaded(knownLang, difficulty, currentBatch)) {
        Alert.alert(
          'Content Not Available',
          `${currentBatch} is not downloaded yet. Please download it from the Dashboard first.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const loadedPictures = await loadPicturesForLearning(
        learningLang, 
        knownLang, 
        difficulty, 
        currentBatch
      );
      
      if (loadedPictures.length === 0) {
        Alert.alert(
          'No Content',
          `No pictures found for ${difficulty} level in ${currentBatch}`,
          [{ text: 'OK' }]
        );
      }
      
      setPictures(loadedPictures);
      setCurrentIndex(0);
      setShowAnswer(false);
      
    } catch (error) {
      console.error('Failed to load pictures:', error);
      Alert.alert(
        'Loading Error',
        'Failed to load pictures. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const findAvailableBatches = async () => {
    // Find all downloaded batches for current difficulty
    const batches = [];
    for (let i = 1; i <= 5; i++) {
      const batch = `batch${i.toString().padStart(3, '0')}`;
      if (isBatchDownloaded(learningLang, difficulty, batch) && 
          isBatchDownloaded(knownLang, difficulty, batch)) {
        batches.push(batch);
      }
    }
    setAvailableBatches(batches);
  };

  const currentPicture = pictures[currentIndex];

  const handlePlayAnswer = async () => {
    if (!currentPicture || !currentPicture.picture_id) return;
    
    // FIXED: Use dynamic currentBatch instead of hard-coded batch001
    const audioPath = `languages/${learningLang}/${difficulty}/${currentBatch}/audio/pictures/${currentPicture.picture_id}.mp3`;
    console.log(`🔊 Playing picture answer audio: ${audioPath}`);
    await playAudio(audioPath);
  };

  // FIXED: Determine correct image batch based on picture ID
  const getBatchForPicture = (pictureId) => {
    const picNum = parseInt(pictureId.replace('pic_', ''));
    if (picNum <= 10) return 'batch001';  // A1 first 10
    if (picNum <= 12) return 'batch002';  // A1 remaining 2
    if (picNum <= 22) return 'batch003';  // A2 all 10
    if (picNum <= 30) return 'batch004';  // B1 all 8
    if (picNum <= 38) return 'batch005';  // B2 all 8
    if (picNum <= 44) return 'batch006';  // C1 all 6
    return 'batch007';                    // C2 all 6
  };

  const getImageUri = (filename) => {
    if (!filename) return null;
    // Extract picture ID from filename (pic_001.jpg -> pic_001)
    const pictureId = filename.replace('.jpg', '');
    const imageBatch = getBatchForPicture(pictureId);
    const localPath = `${FileSystem.documentDirectory}shared/images/${imageBatch}/${filename}`;
    console.log(`🖼️ Image path: ${localPath} (batch: ${imageBatch})`);
    return localPath;
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex(Math.min(pictures.length - 1, currentIndex + 1));
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
  };

  const getFieldForLanguage = (picture, field, lang) => {
    if (lang === 'zh') return picture[`zh_${field}`];
    if (lang === 'ja') return picture[`ja_${field}`];
    if (lang === 'es') return picture[`es_${field}`];
    if (lang === 'fr') return picture[`fr_${field}`];
    if (lang === 'en') return picture[`en_${field}`];
    return picture[field] || '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading pictures...</Text>
      </View>
    );
  }

  if (pictures.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Pictures Available</Text>
        <Text style={styles.emptyText}>
          No pictures found for {difficulty} level in {currentBatch}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Batch Selector */}
        {availableBatches.length > 1 && (
          <View style={styles.batchSelector}>
            <Text style={styles.batchSelectorTitle}>Batch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableBatches.map((batch) => (
                <TouchableOpacity
                  key={batch}
                  style={[
                    styles.batchButton,
                    currentBatch === batch && styles.batchButtonActive
                  ]}
                  onPress={() => handleBatchChange(batch)}
                >
                  <Text style={[
                    styles.batchButtonText,
                    currentBatch === batch && styles.batchButtonTextActive
                  ]}>
                    {batch.replace('batch', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Difficulty Badge */}
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>Level: {difficulty}</Text>
        </View>

        {/* Picture */}
        <Image
          source={{ uri: getImageUri(currentPicture.file) }}
          style={styles.image}
          resizeMode="contain"
          onError={(error) => {
            console.error(`❌ Image load error for ${currentPicture.file}:`, error);
          }}
          onLoad={() => {
            console.log(`✅ Image loaded: ${currentPicture.file}`);
          }}
        />

        {/* Timer or Answer */}
        {!showAnswer ? (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time remaining: {timeRemaining}s</Text>
            <Text style={styles.instruction}>Describe what you see!</Text>
            <TouchableOpacity 
              style={styles.showAnswerButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.showAnswerButtonText}>Show Answer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.answerContainer}>
            <Text style={styles.answerTitle}>Model Answer:</Text>
            
            <Text style={styles.answerText}>
              {getFieldForLanguage(currentPicture, 'sentence', learningLang)}
            </Text>
            
            {getFieldForLanguage(currentPicture, 'tr', learningLang) && (
              <Text style={styles.transliteration}>
                {getFieldForLanguage(currentPicture, 'tr', learningLang)}
              </Text>
            )}
            
            <Text style={styles.translation}>
              {getFieldForLanguage(currentPicture, 'sentence', knownLang)}
            </Text>
            
            <TouchableOpacity style={styles.playButton} onPress={handlePlayAnswer}>
              <Text style={styles.playButtonText}>🔊 Play Audio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.counter}>{currentIndex + 1} / {pictures.length}</Text>
          
          <TouchableOpacity 
            style={[styles.navButton, (currentIndex === pictures.length - 1 || !showAnswer) && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={currentIndex === pictures.length - 1 || !showAnswer}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'NotoSans',
  },
  backButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
  },
  batchSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  batchSelectorTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 10,
  },
  batchButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  batchButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  batchButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#666',
  },
  batchButtonTextActive: {
    color: 'white',
  },
  difficultyBadge: {
    alignSelf: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 15,
  },
  difficultyText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
  },
  timerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  timerText: {
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 18,
    fontFamily: 'NotoSans',
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  showAnswerButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  showAnswerButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
  },
  answerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
  },
  answerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    color: '#333',
  },
  answerText: {
    fontSize: 20,
    fontFamily: 'NotoSans',
    marginBottom: 10,
    lineHeight: 28,
    color: '#333',
  },
  transliteration: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 22,
  },
  translation: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'NotoSans',
    marginBottom: 20,
    lineHeight: 24,
  },
  playButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
    fontSize: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  navButtonText: {
    fontFamily: 'NotoSans-Bold',
    color: '#333',
  },
  counter: {
    fontFamily: 'NotoSans-Bold',
    fontSize: 16,
    color: '#333',
  },
});