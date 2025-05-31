import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
export default function SpeedSlider({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Speed: {value.toFixed(1)}x</Text>
      <Slider
        style={styles.slider}
        minimumValue={0.5}
        maximumValue={2.0}
        step={0.1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#4ECDC4"
        maximumTrackTintColor="#e0e0e0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontFamily: 'NotoSans-Bold',
    marginBottom: 5,
  },
  slider: {
    height: 40,
  },
});