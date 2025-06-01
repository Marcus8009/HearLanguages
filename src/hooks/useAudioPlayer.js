// src/hooks/useAudioPlayer.js - Enhanced with better error handling and queuing
import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const soundRef = useRef(null);
  const queueRef = useRef([]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('🔊 Audio mode configured');
      } catch (error) {
        console.error('❌ Audio setup failed:', error);
      }
    };

    setupAudio();

    return () => {
      cleanup();
    };
  }, []);

  // Process audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [audioQueue, isProcessingQueue]);

  const cleanup = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTrack(null);
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    setIsProcessingQueue(true);
    
    while (queueRef.current.length > 0) {
      const { uri, rate, delay } = queueRef.current.shift();
      
      try {
        await playAudioFile(uri, rate);
        
        // Add delay between queue items if specified
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error('❌ Queue playback error:', error);
        // Continue with next item in queue
      }
    }
    
    setIsProcessingQueue(false);
    setAudioQueue([]);
  }, []);

  const playAudioFile = useCallback(async (uri, rate = 1.0) => {
    try {
      // Clean up previous sound
      await cleanup();

      // Determine if it's a local file or remote URL
      let audioUri;
      if (uri.startsWith('http')) {
        audioUri = uri;
      } else if (uri.startsWith('file://')) {
        audioUri = uri;
      } else {
        audioUri = FileSystem.documentDirectory + uri.replace(/^\/+/, '');
      }

      console.log(`🎵 Loading audio: ${audioUri}`);
      setCurrentTrack(audioUri);

      // Check if local file exists
      if (audioUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          throw new Error(`Audio file not found: ${audioUri}`);
        }
      }

      // Create and configure audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true, 
          rate: rate,
          volume: 1.0,
          isMuted: false,
        }
      );
      
      soundRef.current = sound;
      setIsPlaying(true);

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log(`✅ Audio finished: ${audioUri}`);
            setIsPlaying(false);
            setCurrentTrack(null);
          }
          
          if (status.error) {
            console.error(`❌ Playback error:`, status.error);
            setIsPlaying(false);
            setCurrentTrack(null);
          }
        }
      });

      // Start playback
      await sound.playAsync();
      console.log(`▶️ Playing: ${audioUri} at ${rate}x speed`);
      
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      setIsPlaying(false);
      setCurrentTrack(null);
      throw error;
    }
  }, [cleanup]);

  const playAudio = useCallback(async (uriOrPath, rate = 1.0) => {
    // Stop any current playback
    if (isPlaying) {
      await cleanup();
    }
    
    return playAudioFile(uriOrPath, rate);
  }, [playAudioFile, isPlaying, cleanup]);

  const queueAudio = useCallback((audioItems) => {
    // audioItems: [{ uri, rate?, delay? }, ...]
    const newQueue = audioItems.map(item => ({
      uri: item.uri,
      rate: item.rate || 1.0,
      delay: item.delay || 0,
    }));
    
    queueRef.current = [...queueRef.current, ...newQueue];
    setAudioQueue(prev => [...prev, ...newQueue]);
    
    console.log(`🎵 Queued ${audioItems.length} audio items`);
  }, []);

  const playSequence = useCallback(async (audioItems) => {
    // Clear existing queue
    queueRef.current = [];
    setAudioQueue([]);
    
    // Add new items to queue
    queueAudio(audioItems);
  }, [queueAudio]);

  const stopAudio = useCallback(async () => {
    // Clear queue
    queueRef.current = [];
    setAudioQueue([]);
    setIsProcessingQueue(false);
    
    // Stop current playback
    await cleanup();
  }, [cleanup]);

  const setPlaybackRate = useCallback(async (rate) => {
    setPlaybackRateState(rate);
    
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(rate, true);
        console.log(`🎵 Playback rate set to ${rate}x`);
      } catch (error) {
        console.warn('⚠️ Failed to set playback rate:', error);
      }
    }
  }, []);

  const pauseAudio = useCallback(async () => {
    if (soundRef.current && isPlaying) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        console.log('⏸️ Audio paused');
      } catch (error) {
        console.error('❌ Pause failed:', error);
      }
    }
  }, [isPlaying]);

  const resumeAudio = useCallback(async () => {
    if (soundRef.current && !isPlaying) {
      try {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        console.log('▶️ Audio resumed');
      } catch (error) {
        console.error('❌ Resume failed:', error);
      }
    }
  }, [isPlaying]);

  // Utility function for repeat-before pattern used in sentence audio
  const playRepeatBefore = useCallback(async (learningUri, knownUri, repeats = 3, rate = 1.0) => {
    const learningRepeats = Math.ceil(repeats / 2);
    const tailRepeats = repeats - learningRepeats;
    
    const sequence = [];
    
    // Learning language repeats (front)
    for (let i = 0; i < learningRepeats; i++) {
      sequence.push({
        uri: learningUri,
        rate: rate,
        delay: i < learningRepeats - 1 ? 300 : 500 // Longer pause before known language
      });
    }
    
    // Known language once
    sequence.push({
      uri: knownUri,
      rate: rate,
      delay: tailRepeats > 0 ? 500 : 0 // Pause before tail repeats
    });
    
    // Learning language repeats (tail)
    for (let i = 0; i < tailRepeats; i++) {
      sequence.push({
        uri: learningUri,
        rate: rate,
        delay: i < tailRepeats - 1 ? 300 : 0
      });
    }
    
    console.log(`🎵 Playing repeat-before sequence: ${learningRepeats} + 1 + ${tailRepeats} = ${repeats + 1} total`);
    await playSequence(sequence);
  }, [playSequence]);

  return {
    // State
    isPlaying,
    currentTrack,
    playbackRate,
    audioQueue: audioQueue.length,
    isProcessingQueue,
    
    // Basic playback
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    setPlaybackRate,
    
    // Advanced playback
    queueAudio,
    playSequence,
    playRepeatBefore,
    
    // Utilities
    cleanup,
  };
}