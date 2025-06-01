// src/screens/ReconstructionScreen.js - Updated for new architecture
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useStore } from '../store';
import { loadSentencesForLearning } from '../utils/csvLoader';

export default function ReconstructionScreen({ route }) {
  const { learningLang, knownLang, difficulty, translitMode, isBatchDownloaded } = useStore();
  
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [showTranslit, setShowTranslit] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
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

  // Set up word reconstruction when sentence changes
  useEffect(() => {
    if (sentences[currentIndex]) {
      setupWordReconstruction();
      setShowTranslit(translitMode === 'auto');
    }
  }, [currentIndex, sentences, learningLang, translitMode]);

  const loadSentencesForCurrentBatch = async () => {
    if (!learningLang || !knownLang) return;

    setLoading(true);
    try {
      console.log(`🧩 Loading sentences for reconstruction: ${currentBatch} ${difficulty}`);
      
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
      setCurrentIndex(0);
      
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

  const setupWordReconstruction = () => {
    const currentSentence = sentences[currentIndex];
    if (!currentSentence) return;

    const sentence = getFieldForLanguage(currentSentence, 'sentence', learningLang);
    const words = sentence.split(/\s+/).filter(Boolean);
    
    // Shuffle the words
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setSelectedWords([]);
    setIsCorrect(null);
  };

  const handleWordPress = (word, index) => {
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);
    
    const newShuffled = [...shuffledWords];
    newShuffled.splice(index, 1);
    setShuffledWords(newShuffled);
    
    // Check if reconstruction is complete
    if (newShuffled.length === 0) {
      const correctSentence = getFieldForLanguage(sentences[currentIndex], 'sentence', learningLang);
      const attempt = newSelected.join(' ');
      const correct = attempt === correctSentence;
      setIsCorrect(correct);
      
      console.log(`🧩 Reconstruction attempt: "${attempt}"`);
      console.log(`🎯 Correct answer: "${correctSentence}"`);
      console.log(`✅ Result: ${correct ? 'CORRECT' : 'INCORRECT'}`);
    }
  };

  const handleSelectedPress = (index) => {
    const word = selectedWords[index];
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setShuffledWords([...shuffledWords, word]);
    setIsCorrect(null);
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
  };

  const handleReset = () => {
    setupWordReconstruction();
  };

  const getFieldForLanguage = (sentence, field, lang) => {
    if (lang === 'zh') return sentence[`zh_${field}`];
    if (lang === 'ja') return sentence[`ja_${field}`];
    if (lang === 'es') return sentence[`es_${field}`];
    if (lang === 'fr') return sentence[`fr_${field}`];
    if (lang === 'en') return sentence[`en_${field}`];
    return sentence[field] || '';
  };

  const currentSentence = sentences[currentIndex];

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

        {/* Translation Card */}
        <View style={styles.translationCard}>
          <Text style={styles.translationTitle}>Translate this:</Text>
          <Text style={styles.translation}>
            {getFieldForLanguage(currentSentence, 'sentence', knownLang)}
          </Text>
        </View>

        {/* Reconstruction Area */}
        <View style={styles.reconstructionArea}>
          <Text style={styles.reconstructionTitle}>Tap words to build the sentence:</Text>
          
          {/* Selected Words Area */}
          <View style={styles.selectedArea}>
            {selectedWords.length === 0 ? (
              <Text style={styles.placeholder}>Tap words below to start...</Text>
            ) : (
              selectedWords.map((word, idx) => (
                <TouchableOpacity
                  key={`selected-${idx}-${word}`}
                  style={styles.selectedWord}
                  onPress={() => handleSelectedPress(idx)}
                >
                  <Text style={styles.wordText}>{word}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Transliteration Hint */}
          {showTranslit && getFieldForLanguage(currentSentence, 'tr', learningLang) && (
            <View style={styles.transliterationContainer}>
              <Text style={styles.transliterationLabel}>Pronunciation guide:</Text>
              <Text style={styles.transliteration}>
                {getFieldForLanguage(currentSentence, 'tr', learningLang)}
              </Text>
            </View>
          )}

          {/* Word Bank */}
          <View style={styles.wordBank}>
            {shuffledWords.map((word, idx) => (
              <TouchableOpacity
                key={`shuffled-${idx}-${word}`}
                style={styles.wordButton}
                onPress={() => handleWordPress(word, idx)}
                onLongPress={() => translitMode === 'longpress' && setShowTranslit(true)}
                onPressOut={() => translitMode === 'longpress' && setShowTranslit(false)}
              >
                <Text style={styles.wordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback */}
          {isCorrect !== null && (
            <View style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>
              <Text style={styles.feedbackText}>
                {isCorrect ? '🎉 Perfect! Well done!' : '❌ Not quite right. Try again!'}
              </Text>
              {!isCorrect && (
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

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
            style={[styles.navButton, (currentIndex === sentences.length - 1 || !isCorrect) && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
            disabled={currentIndex === sentences.length - 1 || !isCorrect}
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
  translationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  translationTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#666',
    marginBottom: 10,
  },
  translation: {
    fontSize: 18,
    fontFamily: 'NotoSans',
    color: '#333',
    lineHeight: 24,
  },
  reconstructionArea: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    minHeight: 400,
    elevation: 2,
  },
  reconstructionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 15,
  },
  selectedArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 80,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'NotoSans',
  },
  selectedWord: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    elevation: 1,
  },
  transliterationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  transliterationLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
    color: '#666',
    marginBottom: 5,
  },
  transliteration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'NotoSans',
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  wordButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    margin: 4,
    borderRadius: 8,
  },
  wordText: {
    fontSize: 16,
    fontFamily: 'NotoSans',
    color: '#333',
  },
  feedback: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  correct: {
    backgroundColor: '#d4edda',
  },
  incorrect: {
    backgroundColor: '#f8d7da',
  },
  feedbackText: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
    fontSize: 14,
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