import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store';
import DownloadBanner from '../components/DownloadBanner';
import TransliterationToggle from '../components/TransliterationToggle';

export default function DashboardScreen({ navigation }) {
  const { learningLang, knownLang } = useStore();

  const features = [
    { id: 'SentenceAudio', title: 'Sentence Audio', icon: '🔊', color: '#FF6B6B' },
    { id: 'Reconstruction', title: 'Sentence Reconstruction', icon: '🧩', color: '#4ECDC4' },
    { id: 'Picture', title: 'Describe the Picture', icon: '🖼️', color: '#45B7D1' },
    { id: 'WordMatch', title: 'Word Matching', icon: '🎯', color: '#96CEB4' },
  ];

  const getLangName = (code) => {
    const names = {
      'en': 'English',
      'zh': 'Chinese', 
      'ja': 'Japanese',
      'es': 'Spanish',
      'fr': 'French'
    };
    return names[code] || code.toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      <DownloadBanner />
      
      <View style={styles.header}>
        <Text style={styles.title}>
          Learning {getLangName(learningLang)} from {getLangName(knownLang)}
        </Text>
        <TransliterationToggle />
      </View>

      <View style={styles.grid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[styles.card, { backgroundColor: feature.color }]}
            onPress={() => navigation.navigate(feature.id)}
          >
            <Text style={styles.cardIcon}>{feature.icon}</Text>
            <Text style={styles.cardTitle}>{feature.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  card: {
    width: '45%',
    aspectRatio: 1,
    margin: '2.5%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: 'white',
    textAlign: 'center',
  },
});