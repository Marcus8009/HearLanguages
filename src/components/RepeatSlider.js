import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function RepeatSlider({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Repeats: {value}</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
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