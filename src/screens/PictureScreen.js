import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store';
import { loadPictures } from '../utils/csvLoader';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import * as FileSystem from 'expo-file-system';

export default function PictureScreen() {
  const { learningLang, knownLang, difficulty } = useStore();
  const { playAudio } = useAudioPlayer();
  const [pictures, setPictures] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    loadPictures('batch01').then((loadedPictures) => {
      // Filter pictures by current difficulty level
      const filteredPictures = loadedPictures.filter(pic => pic.difficulty === difficulty);
      console.log(`🖼️ Loaded ${filteredPictures.length} pictures for difficulty ${difficulty}`);
      setPictures(filteredPictures);
      setCurrentIndex(0); // Reset to first picture
      setShowAnswer(false);
    });
  }, [difficulty]);

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

  const currentPicture = pictures[currentIndex];

  const handlePlayAnswer = async () => {
    if (!currentPicture || !currentPicture.picture_id) return;
    
    // FIXED: Use new audio structure with difficulty
    // pictures/batch01/pic_001/A1/zh.mp3
    const audioPath = `pictures/batch01/${currentPicture.picture_id}/${difficulty}/${learningLang}.mp3`;
    console.log(`🔊 Playing picture answer audio: ${audioPath}`);
    await playAudio(audioPath);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex(Math.min(pictures.length - 1, currentIndex + 1));
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  // Generate local image URI
  const getImageUri = (filename) => {
    if (!filename) return null;
    const localPath = `${FileSystem.documentDirectory}pictures/batch01/${filename}`;
    console.log(`🖼️ Image path: ${localPath}`);
    return localPath;
  };

  // Get current sentence based on language and difficulty
  const getCurrentSentence = () => {
    if (!currentPicture) return null;
    return {
      learning: currentPicture[`${learningLang}_sentence`],
      learningTr: currentPicture[`${learningLang}_tr`],
      known: currentPicture[`${knownLang}_sentence`],
    };
  };

  const sentence = getCurrentSentence();

  return (
    <ScrollView style={styles.container}>
      {currentPicture && (
        <View style={styles.content}>
          {/* Difficulty indicator */}
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>Level: {difficulty}</Text>
          </View>

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

          {!showAnswer ? (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>Time remaining: {timeRemaining}s</Text>
              <Text style={styles.instruction}>Describe what you see!</Text>
            </View>
          ) : (
            <View style={styles.answerContainer}>
              <Text style={styles.answerTitle}>Model Answer:</Text>
              <Text style={styles.answerText}>
                {sentence?.learning}
              </Text>
              {sentence?.learningTr && (
                <Text style={styles.transliteration}>
                  {sentence.learningTr}
                </Text>
              )}
              <Text style={styles.translation}>
                {sentence?.known}
              </Text>
              
              <TouchableOpacity style={styles.playButton} onPress={handlePlayAnswer}>
                <Text style={styles.playButtonText}>🔊 Play Audio</Text>
              </TouchableOpacity>
            </View>
          )}

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
      )}

      {pictures.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pictures available for {difficulty} level</Text>
          <Text style={styles.emptySubtext}>Try selecting a different difficulty level</Text>
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
  },
  timerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
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
  },
  answerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  answerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 10,
  },
  answerText: {
    fontSize: 20,
    fontFamily: 'NotoSans',
    marginBottom: 10,
    lineHeight: 28,
  },
  transliteration: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
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
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  navButtonText: {
    fontFamily: 'NotoSans',
  },
  counter: {
    fontFamily: 'NotoSans-Bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'NotoSans',
    color: '#999',
    textAlign: 'center',
  },
});