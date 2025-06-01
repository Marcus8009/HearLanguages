// src/screens/SentenceAudioScreen.js - Updated for new architecture
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useStore } from '../store';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import RepeatSlider from '../components/RepeatSlider';
import SpeedSlider from '../components/SpeedSlider';
import { loadSentencesForLearning } from '../utils/csvLoader';
import { LOCAL_PATHS } from '../config/constants';

export default function SentenceAudioScreen({ route }) {
  const { learningLang, knownLang, difficulty, isBatchDownloaded } = useStore();
  const { playAudio, isPlaying, setPlaybackRate } = useAudioPlayer();
  
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeats, setRepeats] = useState(3);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [currentBatch, setCurrentBatch] = useState('batch001');
  const [availableBatches, setAvailableBatches] = useState([]);

  // Get batch from navigation params or use default
  useEffect(() => {
    const batch = route?.params?.batch || 'batch001';
    setCurrentBatch(batch);
  }, [route?.params?.batch]);

  // Load sentences when batch, difficulty, or languages change
  useEffect(() => {
    loadSentencesForCurrentBatch();
    findAvailableBatches();
  }, [learningLang, knownLang, difficulty, currentBatch]);

  const loadSentencesForCurrentBatch = async () => {
    if (!learningLang || !knownLang) return;

    setLoading(true);
    try {
      console.log(`🎵 Loading sentences for ${currentBatch} ${difficulty}`);
      
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

      const loadedSentences = await loadSentencesForLearning(
        learningLang, 
        knownLang, 
        difficulty, 
        currentBatch
      );
      
      if (loadedSentences.length === 0) {
        Alert.alert(
          'No Content',
          `No sentences found for ${difficulty} level in ${currentBatch}`,
          [{ text: 'OK' }]
        );
      }
      
      setSentences(loadedSentences);
      setCurrentIndex(0); // Reset to first sentence
      
    } catch (error) {
      console.error('Failed to load sentences:', error);
      Alert.alert(
        'Loading Error',
        'Failed to load sentences. Please try again.',
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

  const currentSentence = sentences[currentIndex];

  const handlePlay = async () => {
    if (!currentSentence || isPlaying) return;
    
    console.log(`🎵 Playing sentence: ${currentSentence.sentence_id} (${difficulty} level)`);
    
    // Build audio paths using the new structure
    const learningAudioPath = LOCAL_PATHS.getBatchAudioPath(
      learningLang, 
      difficulty, 
      currentBatch, 
      'sentences', 
      currentSentence.sentence_id
    );
    
    const knownAudioPath = LOCAL_PATHS.getBatchAudioPath(
      knownLang, 
      difficulty, 
      currentBatch, 
      'sentences', 
      currentSentence.sentence_id
    );
    
    console.log(`🎵 Learning audio: ${learningAudioPath}`);
    console.log(`🎵 Known audio: ${knownAudioPath}`);
    
    // Repeat-before rule implementation
    const learningRepeats = Math.ceil(repeats / 2);
    const tailRepeats = repeats - learningRepeats;
    
    try {
      // Play learning language first (repeat-before)
      for (let i = 0; i < learningRepeats; i++) {
        console.log(`🔊 Learning repeat ${i + 1}/${learningRepeats}`);
        await playAudio(learningAudioPath, speed);
        // Small delay between repeats
        if (i < learningRepeats - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Small pause before known language
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play known language once
      console.log(`🔊 Playing known language`);
      await playAudio(knownAudioPath, speed);
      
      // Small pause before tail repeats
      if (tailRepeats > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Play learning language remaining times
      for (let i = 0; i < tailRepeats; i++) {
        console.log(`🔊 Learning tail repeat ${i + 1}/${tailRepeats}`);
        await playAudio(learningAudioPath, speed);
        if (i < tailRepeats - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`✅ Sentence playback completed`);
    } catch (error) {
      console.error(`❌ Error in sentence playback:`, error);
      Alert.alert(
        'Playback Error',
        'Failed to play audio. The audio file may be missing or corrupted.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
  };

  const getFieldForLanguage = (sentence, field, lang) => {
    if (lang === 'zh') return sentence[`zh_${field}`];
    if (lang === 'ja') return sentence[`ja_${field}`];
    if (lang === 'es') return sentence[`es_${field}`];
    if (lang === 'fr') return sentence[`fr_${field}`];
    if (lang === 'en') return sentence[`en_${field}`];
    return sentence[field] || '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sentences...</Text>
      </View>
    );
  }

  if (sentences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Sentences Available</Text>
        <Text style={styles.emptyText}>
          No sentences found for {difficulty} level in {currentBatch}
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

        {/* Sentence Card */}
        <View style={styles.sentenceCard}>
          <Text style={styles.sentenceText}>
            {getFieldForLanguage(currentSentence, 'sentence', learningLang)}
          </Text>
          
          {getFieldForLanguage(currentSentence, 'tr', learningLang) && (
            <Text style={styles.transliteration}>
              {getFieldForLanguage(currentSentence, 'tr', learningLang)}
            </Text>
          )}
          
          <Text style={styles.translation}>
            {getFieldForLanguage(currentSentence, 'sentence', knownLang)}
          </Text>
        </View>

        {/* Play Button */}
        <TouchableOpacity 
          style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
          onPress={handlePlay}
          disabled={isPlaying}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️ Playing...' : '▶️ Play'}
          </Text>
        </TouchableOpacity>

        {/* Controls */}
        <RepeatSlider value={repeats} onChange={setRepeats} />
        <SpeedSlider value={speed} onChange={(v) => { setSpeed(v); setPlaybackRate(v); }} />

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.counter}>{currentIndex + 1} / {sentences.length}</Text>
          
          <TouchableOpacity 
            style={[styles.navButton, currentIndex === sentences.length - 1 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
            disabled={currentIndex === sentences.length - 1}
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
  sentenceCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sentenceText: {
    fontSize: 24,
    fontFamily: 'NotoSans',
    marginBottom: 10,
    lineHeight: 32,
    color: '#333',
  },
  transliteration: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  translation: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'NotoSans',
    lineHeight: 24,
  },
  playButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  playButtonDisabled: {
    backgroundColor: '#ccc',
  },
  playButtonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'NotoSans-Bold',
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