// src/screens/ReconstructionScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store';
import { loadSentences } from '../utils/csvLoader';

export default function ReconstructionScreen() {
  const { learningLang, knownLang, translitMode } = useStore();
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [showTranslit, setShowTranslit] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    loadSentences('batch01').then(setSentences);
  }, []);

  useEffect(() => {
    if (sentences[currentIndex]) {
      const sentence = sentences[currentIndex][`${learningLang}_sentence`];
      const words = sentence.split(/\s+/).filter(Boolean);
      setShuffledWords([...words].sort(() => Math.random() - 0.5));
      setSelectedWords([]);
      setIsCorrect(null);
      setShowTranslit(translitMode === 'auto');
    }
  }, [currentIndex, sentences, learningLang, translitMode]);

  const handleWordPress = (word, index) => {
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);
    
    const newShuffled = [...shuffledWords];
    newShuffled.splice(index, 1);
    setShuffledWords(newShuffled);
    
    // Check if complete
    if (newShuffled.length === 0) {
      const correct = sentences[currentIndex][`${learningLang}_sentence`];
      const attempt = newSelected.join(' ');
      setIsCorrect(attempt === correct);
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

  const currentSentence = sentences[currentIndex];

  return (
    <ScrollView style={styles.container}>
      {currentSentence && (
        <View style={styles.content}>
          <View style={styles.translationCard}>
            <Text style={styles.translation}>
              {currentSentence[`${knownLang}_sentence`]}
            </Text>
          </View>

          <View style={styles.reconstructionArea}>
            <View style={styles.selectedArea}>
              {selectedWords.map((word, idx) => (
                <TouchableOpacity
                  key={`selected-${idx}`}
                  style={styles.selectedWord}
                  onPress={() => handleSelectedPress(idx)}
                >
                  <Text style={styles.wordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {showTranslit && currentSentence[`${learningLang}_tr`] && (
              <Text style={styles.transliteration}>
                {currentSentence[`${learningLang}_tr`]}
              </Text>
            )}

            <View style={styles.wordBank}>
              {shuffledWords.map((word, idx) => (
                <TouchableOpacity
                  key={`shuffled-${idx}`}
                  style={styles.wordButton}
                  onPress={() => handleWordPress(word, idx)}
                  onLongPress={() => translitMode === 'longpress' && setShowTranslit(true)}
                  onPressOut={() => translitMode === 'longpress' && setShowTranslit(false)}
                >
                  <Text style={styles.wordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isCorrect !== null && (
              <View style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>
                <Text style={styles.feedbackText}>
                  {isCorrect ? '✅ Correct!' : '❌ Try again'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.navigation}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            
            <Text style={styles.counter}>{currentIndex + 1} / {sentences.length}</Text>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))}
              disabled={currentIndex === sentences.length - 1 || !isCorrect}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  translationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  translation: {
    fontSize: 18,
    fontFamily: 'NotoSans',
  },
  reconstructionArea: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    minHeight: 300,
  },
  selectedArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
    paddingBottom: 10,
  },
  selectedWord: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  wordText: {
    fontSize: 16,
    fontFamily: 'NotoSans',
  },
  transliteration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  feedback: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
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
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  navButtonText: {
    fontFamily: 'NotoSans',
  },
  counter: {
    fontFamily: 'NotoSans-Bold',
  },
});