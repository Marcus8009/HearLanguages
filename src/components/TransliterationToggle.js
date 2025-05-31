import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store';

export default function TransliterationToggle() {
  const { translitMode, setTranslitMode } = useStore();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Transliteration:</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.option, translitMode === 'auto' && styles.optionActive]}
          onPress={() => setTranslitMode('auto')}
        >
          <Text style={[styles.optionText, translitMode === 'auto' && styles.optionTextActive]}>
            Auto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, translitMode === 'longpress' && styles.optionActive]}
          onPress={() => setTranslitMode('longpress')}
        >
          <Text style={[styles.optionText, translitMode === 'longpress' && styles.optionTextActive]}>
            Long-press
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'NotoSans',
    marginRight: 10,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  option: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  optionActive: {
    backgroundColor: '#4ECDC4',
  },
  optionText: {
    fontFamily: 'NotoSans',
    color: '#4ECDC4',
  },
  optionTextActive: {
    color: 'white',
  },
});