// src/screens/WordMatchScreen.js - FIXED: useStore hook usage
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useStore } from '../store';
import { loadWordsForLearning } from '../utils/csvLoader';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export default function WordMatchScreen({ route, navigation }) {
  // FIXED: Move all useStore calls to top level
  const { learningLang, knownLang, difficulty, isBatchDownloaded } = useStore();
  const { playAudio } = useAudioPlayer();
  
  const [words, setWords] = useState([]);
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentBatch, setCurrentBatch] = useState('batch001');
  const [availableBatches, setAvailableBatches] = useState([]);

  const GRID_SIZE = 7;
  const MAX_PAIRS = 24;

  useEffect(() => {
    const batch = route?.params?.batch || 'batch001';
    setCurrentBatch(batch);
  }, [route?.params?.batch]);

  useEffect(() => {
    loadWordsForCurrentBatch();
    findAvailableBatches();
  }, [learningLang, knownLang, difficulty, currentBatch]);

  useEffect(() => {
    if (words.length > 0) {
      generateGrid();
    }
  }, [words, learningLang, knownLang]);

  const loadWordsForCurrentBatch = async () => {
    if (!learningLang || !knownLang) return;

    setLoading(true);
    try {
      if (!isBatchDownloaded(learningLang, difficulty, currentBatch) || 
          !isBatchDownloaded(knownLang, difficulty, currentBatch)) {
        Alert.alert(
          'Content Not Available',
          `${currentBatch} is not downloaded yet. Please download it from the Dashboard first.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const loadedWords = await loadWordsForLearning(
        learningLang, 
        knownLang, 
        difficulty, 
        currentBatch
      );
      
      if (loadedWords.length === 0) {
        Alert.alert('No Content', `No words found for ${difficulty} level in ${currentBatch}`);
      }
      
      setWords(loadedWords);
      setScore(0);
      setSelected(null);
      setLastMatch(null);
      
    } catch (error) {
      console.error('Failed to load words:', error);
      Alert.alert('Loading Error', 'Failed to load words. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findAvailableBatches = async () => {
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

  const generateGrid = () => {
    const selectedWords = words.slice(0, Math.min(words.length, MAX_PAIRS));
    const gridCells = [];
    
    selectedWords.forEach((word) => {
      gridCells.push({
        word: getFieldForLanguage(word, 'word', learningLang),
        lang: 'learning',
        id: word.word_id,
        matched: false,
        wordData: word
      });
      
      gridCells.push({
        word: getFieldForLanguage(word, 'word', knownLang),
        lang: 'known',
        id: word.word_id,
        matched: false,
        wordData: word
      });
    });
    
    const totalCells = GRID_SIZE * GRID_SIZE;
    const emptyCells = totalCells - gridCells.length;
    for (let i = 0; i < emptyCells; i++) {
      gridCells.push({
        word: '',
        lang: 'empty',
        id: `empty_${i}`,
        matched: false
      });
    }
    
    const shuffledGrid = gridCells.sort(() => Math.random() - 0.5);
    setGrid(shuffledGrid);
  };

  // FIXED: Removed useStore call from inside function
  const handleCellPress = async (index) => {
    const cell = grid[index];
    if (cell.matched || cell.id === 'empty') return;

    // Play audio if it's a learning language word
    if (cell.lang === 'learning') {
      // FIXED: Use difficulty from hook at top level
      const audioPath = `languages/${learningLang}/${difficulty}/${currentBatch}/audio/words/${cell.id}.mp3`;
      await playAudio(audioPath);
    }

    if (selected === null) {
      setSelected(index);
    } else {
      const selectedCell = grid[selected];
      
      if (cell.id === selectedCell.id && cell.lang !== selectedCell.lang) {
        const newGrid = [...grid];
        newGrid[index].matched = true;
        newGrid[selected].matched = true;
        setGrid(newGrid);
        setScore(score + 1);
        setLastMatch([selected, index]);
      }
      
      setSelected(null);
    }
  };

  const handleUndo = () => {
    if (lastMatch) {
      const newGrid = [...grid];
      newGrid[lastMatch[0]].matched = false;
      newGrid[lastMatch[1]].matched = false;
      setGrid(newGrid);
      setScore(score - 1);
      setLastMatch(null);
    }
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
  };

  const handleRestart = () => {
    Alert.alert(
      'Restart Game',
      'Are you sure you want to restart the current game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', onPress: generateGrid }
      ]
    );
  };

  const getFieldForLanguage = (word, field, lang) => {
    if (lang === 'zh') return word[`zh_${field}`];
    if (lang === 'ja') return word[`ja_${field}`];
    if (lang === 'es') return word[`es_${field}`];
    if (lang === 'fr') return word[`fr_${field}`];
    if (lang === 'en') return word[`en_${field}`];
    return word[field] || '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading words...</Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Words Available</Text>
        <Text style={styles.emptyText}>
          No words found for {difficulty} level in {currentBatch}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPairs = Math.floor((grid.length - grid.filter(cell => cell.lang === 'empty').length) / 2);
  const isGameComplete = score === totalPairs;

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

        {/* Game Header */}
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>Matches: {score}/{totalPairs}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{difficulty}</Text>
            </View>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.controlButton, !lastMatch && styles.controlButtonDisabled]}
              onPress={handleUndo}
              disabled={!lastMatch}
            >
              <Text style={styles.controlButtonText}>↩️ Undo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleRestart}>
              <Text style={styles.controlButtonText}>🔄 Restart</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap matching word pairs. Learning language words ({learningLang.toUpperCase()}) will play audio.
          </Text>
        </View>

        {/* Game Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {grid.map((cell, index) => (
              <TouchableOpacity
                key={`${cell.id}-${index}`}
                style={[
                  styles.cell,
                  cell.matched && styles.cellMatched,
                  selected === index && styles.cellSelected,
                  cell.lang === 'empty' && styles.cellEmpty,
                  cell.lang === 'learning' && styles.cellLearning,
                ]}
                onPress={() => handleCellPress(index)}
                disabled={cell.matched || cell.lang === 'empty'}
              >
                <Text style={[
                  styles.cellText,
                  cell.lang === 'learning' && styles.learningText,
                  cell.matched && styles.matchedText,
                ]}>
                  {cell.word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Game Complete Message */}
        {isGameComplete && (
          <View style={styles.winMessage}>
            <Text style={styles.winText}>🎉 Perfect! All words matched!</Text>
            <TouchableOpacity style={styles.playAgainButton} onPress={generateGrid}>
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { fontSize: 16, color: '#666', fontFamily: 'NotoSans' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f5f5f5' },
  emptyTitle: { fontSize: 20, fontFamily: 'NotoSans-Bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, fontFamily: 'NotoSans' },
  backButton: { backgroundColor: '#4ECDC4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  backButtonText: { color: 'white', fontFamily: 'NotoSans-Bold' },
  batchSelector: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  batchSelectorTitle: { fontSize: 14, fontFamily: 'NotoSans-Bold', color: '#333', marginBottom: 10 },
  batchButton: { backgroundColor: '#f8f9fa', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  batchButtonActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  batchButtonText: { fontSize: 14, fontFamily: 'NotoSans-Bold', color: '#666' },
  batchButtonTextActive: { color: 'white' },
  header: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  scoreContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  score: { fontSize: 20, fontFamily: 'NotoSans-Bold', color: '#333' },
  difficultyBadge: { backgroundColor: '#4ECDC4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  difficultyText: { color: 'white', fontFamily: 'NotoSans-Bold', fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'space-around' },
  controlButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  controlButtonDisabled: { backgroundColor: '#f0f0f0', opacity: 0.5 },
  controlButtonText: { fontFamily: 'NotoSans-Bold', color: '#333', fontSize: 14 },
  instructions: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, marginBottom: 20 },
  instructionText: { fontSize: 14, color: '#856404', fontFamily: 'NotoSans', textAlign: 'center', lineHeight: 20 },
  gridContainer: { backgroundColor: 'white', borderRadius: 12, padding: 10, elevation: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cell: { width: '13%', aspectRatio: 1, margin: '0.5%', backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', borderRadius: 8, elevation: 1, borderWidth: 2, borderColor: 'transparent' },
  cellLearning: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
  cellSelected: { backgroundColor: '#FFE66D', borderColor: '#ffc107', elevation: 3 },
  cellMatched: { backgroundColor: '#96CEB4', borderColor: '#28a745' },
  cellEmpty: { backgroundColor: 'transparent', elevation: 0, borderWidth: 0 },
  cellText: { fontSize: 11, fontFamily: 'NotoSans', textAlign: 'center', color: '#333', paddingHorizontal: 2 },
  learningText: { fontFamily: 'NotoSans-Bold', color: '#1976d2' },
  matchedText: { color: 'white' },
  winMessage: { backgroundColor: '#d4edda', borderRadius: 12, padding: 20, marginTop: 20, alignItems: 'center', elevation: 2 },
  winText: { fontSize: 18, fontFamily: 'NotoSans-Bold', color: '#155724', marginBottom: 15, textAlign: 'center' },
  playAgainButton: { backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  playAgainButtonText: { color: 'white', fontFamily: 'NotoSans-Bold', fontSize: 16 },
});