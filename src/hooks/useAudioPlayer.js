import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

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

  const playAudio = async (uriOrPath, rate = 1.0) => {
    try {
      setIsPlaying(true);
      console.log(`🔊 Playing audio: ${uriOrPath}`);
      
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Check if it's a local file path or remote URL
      let audioUri;
      if (uriOrPath.startsWith('http')) {
        // Remote URL - use directly
        audioUri = uriOrPath;
      } else if (uriOrPath.startsWith('file://')) {
        // Already a file URI - use directly
        audioUri = uriOrPath;
      } else {
        // Relative path - convert to local file URI
        audioUri = FileSystem.documentDirectory + uriOrPath.replace(/^\/+/, '');
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

  const setPlaybackRate = async (rate) => {
    if (soundRef.current) {
      await soundRef.current.setRateAsync(rate, true);
    }
  };

  return { playAudio, isPlaying, setPlaybackRate };
}