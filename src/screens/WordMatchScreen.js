import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store';
import { loadWords } from '../utils/csvLoader';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { CDN_BASE } from '../config/constants.js'

export default function WordMatchScreen() {
  const { learningLang, knownLang } = useStore();
  const { playAudio } = useAudioPlayer();
  const [words, setWords] = useState([]);
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadWords().then(setWords);
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      // Generate 7x7 grid with word pairs
      const selectedWords = words.slice(0, 24); // 24 pairs for 48 cells (leaving 1 empty)
      const gridCells = [];
      
      selectedWords.forEach((word) => {
        gridCells.push({
          word: word[`${learningLang}_word`],
          lang: 'learning',
          id: word.word_id,
          matched: false,
        });
        gridCells.push({
          word: word[`${knownLang}_word`],
          lang: 'known',
          id: word.word_id,
          matched: false,
        });
      });
      
      // Add empty cell
      gridCells.push({ word: '', lang: 'known', id: 'empty', matched: false });
      
      // Shuffle
      setGrid(gridCells.sort(() => Math.random() - 0.5));
    }
  }, [words, learningLang, knownLang]);

  const handleCellPress = async (index) => {
    const cell = grid[index];
    if (cell.matched || cell.id === 'empty') return;

    // Play audio if it's a learning language word
    if (cell.lang === 'learning') {
      const audioUrl = `${CDN_BASE}/words/${learningLang}/${cell.id}_${cell.word}.mp3`;
      playAudio(audioUrl);
    }

    if (selected === null) {
      setSelected(index);
    } else {
      const selectedCell = grid[selected];
      
      if (cell.id === selectedCell.id && cell.lang !== selectedCell.lang) {
        // Match!
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Matches: {score}</Text>
        <TouchableOpacity 
          style={[styles.undoButton, !lastMatch && styles.undoButtonDisabled]}
          onPress={handleUndo}
          disabled={!lastMatch}
        >
          <Text style={styles.undoButtonText}>↩️ Undo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((cell, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.cell,
                cell.matched && styles.cellMatched,
                selected === index && styles.cellSelected,
                cell.id === 'empty' && styles.cellEmpty,
              ]}
              onPress={() => handleCellPress(index)}
              disabled={cell.matched || cell.id === 'empty'}
            >
              <Text style={[
                styles.cellText,
                cell.lang === 'learning' && styles.learningText,
              ]}>
                {cell.word}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {score === 24 && (
        <View style={styles.winMessage}>
          <Text style={styles.winText}>🎉 Congratulations! All matched!</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  score: {
    fontSize: 20,
    fontFamily: 'NotoSans-Bold',
  },
  undoButton: {
    padding: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  undoButtonDisabled: {
    backgroundColor: '#ccc',
  },
  undoButtonText: {
    color: 'white',
    fontFamily: 'NotoSans-Bold',
  },
  gridContainer: {
    padding: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cell: {
    width: '13%',
    aspectRatio: 1,
    margin: '0.5%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    elevation: 2,
  },
  cellSelected: {
    backgroundColor: '#FFE66D',
  },
  cellMatched: {
    backgroundColor: '#96CEB4',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  cellText: {
    fontSize: 12,
    fontFamily: 'NotoSans',
    textAlign: 'center',
  },
  learningText: {
    fontFamily: 'NotoSans-Bold',
  },
  winMessage: {
    margin: 20,
    padding: 20,
    backgroundColor: '#96CEB4',
    borderRadius: 15,
    alignItems: 'center',
  },
  winText: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    color: 'white',
  },
});