import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import RepeatSlider from '../components/RepeatSlider';
import SpeedSlider from '../components/SpeedSlider';
import { loadSentences } from '../utils/csvLoader';

export default function SentenceAudioScreen() {
  const { learningLang, knownLang, difficulty } = useStore();
  const { playAudio, isPlaying, setPlaybackRate } = useAudioPlayer();
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeats, setRepeats] = useState(3);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    // Load sentences filtered by current difficulty
    loadSentences('batch01', difficulty).then(setSentences);
  }, [difficulty]);

  const currentSentence = sentences[currentIndex];

  const handlePlay = async () => {
    if (!currentSentence) return;
    
    console.log(`🎵 Playing sentence: ${currentSentence.sentence_id} (${difficulty} level)`);
    
    // Use new audio structure: sentences/batch01/sent_001/A1/zh.mp3
    const learningAudioPath = `sentences/batch01/${currentSentence.sentence_id}/${difficulty}/${learningLang}.mp3`;
    const knownAudioPath = `sentences/batch01/${currentSentence.sentence_id}/${difficulty}/${knownLang}.mp3`;
    
    console.log(`🎵 Learning audio: ${learningAudioPath}`);
    console.log(`🎵 Known audio: ${knownAudioPath}`);
    
    // Repeat-before rule implementation
    const learningRepeats = Math.ceil(repeats / 2);
    const tailRepeats = repeats - learningRepeats;
    
    try {
      // Play learning language first
      for (let i = 0; i < learningRepeats; i++) {
        console.log(`🔊 Learning repeat ${i + 1}/${learningRepeats}`);
        await playAudio(learningAudioPath, speed);
        // Small delay between repeats
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Play known language once
      console.log(`🔊 Playing known language`);
      await playAudio(knownAudioPath, speed);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play learning language remaining times
      for (let i = 0; i < tailRepeats; i++) {
        console.log(`🔊 Learning tail repeat ${i + 1}/${tailRepeats}`);
        await playAudio(learningAudioPath, speed);
        if (i < tailRepeats - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`✅ Sentence playback completed`);
    } catch (error) {
      console.error(`❌ Error in sentence playback:`, error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {currentSentence && (
        <View style={styles.content}>
          {/* Difficulty indicator */}
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>Level: {difficulty}</Text>
          </View>

          <View style={styles.sentenceCard}>
            <Text style={styles.sentenceText}>
              {currentSentence[`${learningLang}_sentence`]}
            </Text>
            {currentSentence[`${learningLang}_tr`] && (
              <Text style={styles.transliteration}>
                {currentSentence[`${learningLang}_tr`]}
              </Text>
            )}
            <Text style={styles.translation}>
              {currentSentence[`${knownLang}_sentence`]}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={handlePlay}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'} Play</Text>
          </TouchableOpacity>

          <RepeatSlider value={repeats} onChange={setRepeats} />
          <SpeedSlider value={speed} onChange={(v) => { setSpeed(v); setPlaybackRate(v); }} />

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
      )}

      {sentences.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No sentences available for {difficulty} level</Text>
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
  },
  transliteration: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
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