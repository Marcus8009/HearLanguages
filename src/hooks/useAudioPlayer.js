// src/hooks/useAudioPlayer.js
// Updated to work with new file structure and local files

import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getSentenceAudioUrl, getWordAudioUrl, getPictureAudioUrl } from '../config/constants';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playAudio = async (pathOrUrl, rate = 1.0) => {
    try {
      setIsPlaying(true);
      console.log(`🔊 Playing audio: ${pathOrUrl}`);
      
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      let audioUri;
      
      if (pathOrUrl.startsWith('http')) {
        // Remote URL - use directly
        audioUri = pathOrUrl;
      } else if (pathOrUrl.startsWith('file://')) {
        // Already a file URI - use directly
        audioUri = pathOrUrl;
      } else {
        // Local path - convert to file URI
        audioUri = FileSystem.documentDirectory + pathOrUrl.replace(/^\/+/, '');
      }

      console.log(`🎵 Audio URI: ${audioUri}`);

      // Check if local file exists
      if (audioUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          console.error(`❌ Audio file not found: ${audioUri}`);
          setIsPlaying(false);
          return;
        }
        console.log(`✅ Audio file exists, size: ${fileInfo.size} bytes`);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate }
      );
      
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log(`🎵 Audio finished playing`);
          setIsPlaying(false);
        }
        if (status.error) {
          console.error(`❌ Audio playback error:`, status.error);
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
      console.log(`▶️ Audio started playing`);
      
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  // Helper methods for different audio types
  const playSentenceAudio = async (batch, sentenceId, difficulty, language, rate = 1.0) => {
    // Try local file first
    const localPath = `sentences/${batch}/${sentenceId}/${difficulty}/${language}.mp3`;
    const localUri = FileSystem.documentDirectory + localPath;
    
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log(`🎵 Playing local sentence audio: ${localPath}`);
      await playAudio(localUri, rate);
    } else {
      // Fallback to remote URL
      const remoteUrl = getSentenceAudioUrl(batch, sentenceId, difficulty, language);
      console.log(`🌐 Playing remote sentence audio: ${remoteUrl}`);
      await playAudio(remoteUrl, rate);
    }
  };

  const playWordAudio = async (wordId, language, difficulty, batch = 'batch01', rate = 1.0) => {
    // Try local file first
    const localPath = `words/${language}/${wordId}.mp3`;
    const localUri = FileSystem.documentDirectory + localPath;
    
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log(`🎵 Playing local word audio: ${localPath}`);
      await playAudio(localUri, rate);
    } else {
      // Fallback to remote URL
      const remoteUrl = getWordAudioUrl(wordId, language, difficulty, batch);
      console.log(`🌐 Playing remote word audio: ${remoteUrl}`);
      await playAudio(remoteUrl, rate);
    }
  };

  const playPictureAudio = async (batch, pictureId, difficulty, language, rate = 1.0) => {
    // Try local file first
    const localPath = `pictures/${batch}/${pictureId}/${difficulty}/${language}.mp3`;
    const localUri = FileSystem.documentDirectory + localPath;
    
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log(`🎵 Playing local picture audio: ${localPath}`);
      await playAudio(localUri, rate);
    } else {
      // Fallback to remote URL
      const remoteUrl = getPictureAudioUrl(batch, pictureId, difficulty, language);
      console.log(`🌐 Playing remote picture audio: ${remoteUrl}`);
      await playAudio(remoteUrl, rate);
    }
  };

  const setPlaybackRate = async (rate) => {
    if (soundRef.current) {
      await soundRef.current.setRateAsync(rate, true);
    }
  };

  return { 
    playAudio, 
    playSentenceAudio,
    playWordAudio, 
    playPictureAudio,
    isPlaying, 
    setPlaybackRate 
  };
}