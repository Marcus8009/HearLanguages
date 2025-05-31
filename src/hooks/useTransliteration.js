// src/hooks/useTransliteration.js
import { useState, useEffect } from 'react';
import { useStore } from '../store';

export function useTransliteration() {
  const { translitMode } = useStore();
  const [showTranslit, setShowTranslit] = useState(false);

  useEffect(() => {
    if (translitMode === 'auto') {
      setShowTranslit(true);
    }
  }, [translitMode]);

  const handleLongPress = () => {
    if (translitMode === 'longpress') {
      setShowTranslit(true);
    }
  };

  const handlePressOut = () => {
    if (translitMode === 'longpress') {
      setShowTranslit(false);
    }
  };

  return { showTranslit, handleLongPress, handlePressOut };
}