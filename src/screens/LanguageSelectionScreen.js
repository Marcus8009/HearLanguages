difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fdfc',
  },
  difficultyCode: {
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  difficultyName: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 5,
  },
  difficultyDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
    textAlign: 'center',
  },import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store';
import { useDownloader } from '../hooks/useDownloader';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
];

const DIFFICULTY_LEVELS = [
  { code: 'A1', name: 'Beginner', description: 'Basic words and phrases' },
  { code: 'A2', name: 'Elementary', description: 'Simple sentences and situations' },
  { code: 'B1', name: 'Intermediate', description: 'Clear standard speech' },
  { code: 'B2', name: 'Upper-Intermediate', description: 'Complex texts and ideas' },
  { code: 'C1', name: 'Advanced', description: 'Sophisticated language use' },
  { code: 'C2', name: 'Proficient', description: 'Near-native fluency' },
];

export default function LanguageSelectionScreen({ navigation }) {
  const { setLanguagePair, setDifficulty, downloadProgress, markBatchDownloaded } = useStore();
  const { downloadBatch, isDownloading } = useDownloader();
  const [learningLang, setLearningLang] = useState(null);
  const [knownLang, setKnownLang] = useState(null);
  const [difficulty, setDifficultyLocal] = useState('A1');
  const [step, setStep] = useState(1); // 1: select learning, 2: select known, 3: select difficulty, 4: download

  const getLangData = (code) => LANGUAGES.find(l => l.code === code);

  const handleLearningLanguageSelect = (langCode) => {
    console.log(`📚 Selected learning language: ${langCode}`);
    setLearningLang(langCode);
    setStep(2);
  };

  const handleKnownLanguageSelect = (langCode) => {
    if (langCode === learningLang) {
      Alert.alert('Invalid Selection', 'Known language must be different from learning language.');
      return;
    }
    console.log(`🏠 Selected known language: ${langCode}`);
    setKnownLang(langCode);
    setStep(3); // Go to difficulty selection
  };

  const handleDifficultySelect = (level) => {
    console.log(`📚 Selected difficulty: ${level}`);
    setDifficultyLocal(level);
    setStep(4); // Go to download
  };

  const handleStartDownload = async () => {
    if (!learningLang || !knownLang || !difficulty) return;

    console.log(`🚀 Starting download for ${learningLang} ↔ ${knownLang} at ${difficulty} level`);
    
    // Set language pair and difficulty in store
    setLanguagePair(learningLang, knownLang);
    setDifficulty(difficulty);
    
    try {
      // Download content for the selected language pair
      await downloadBatch('batch01');
      
      console.log('✅ Download completed successfully');
      
      // Navigate to main app
      navigation.replace('Dashboard');
    } catch (error) {
      console.error('❌ Download failed:', error);
      Alert.alert(
        'Download Failed', 
        'Failed to download language content. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: handleStartDownload },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setLearningLang(null);
    } else if (step === 3) {
      setStep(2);
      setKnownLang(null);
    } else if (step === 4) {
      setStep(3);
      setDifficultyLocal('A1');
    }
  };

  const renderLanguageGrid = (selectedLang, onSelect, excludeLang = null) => (
    <View style={styles.languageGrid}>
      {LANGUAGES.filter(lang => lang.code !== excludeLang).map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageCard,
            selectedLang === lang.code && styles.languageCardSelected
          ]}
          onPress={() => onSelect(lang.code)}
        >
          <Text style={styles.languageFlag}>{lang.flag}</Text>
          <Text style={styles.languageName}>{lang.name}</Text>
          <Text style={styles.languageNative}>{lang.nativeName}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const currentDownload = Object.entries(downloadProgress).find(([_, progress]) => progress < 100);
  const downloadProgressPercent = currentDownload ? Math.round(currentDownload[1]) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Language Learning</Text>
        <Text style={styles.subtitle}>Choose your languages to get started</Text>
      </View>

      {/* Step 1: Select Learning Language */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>What language do you want to learn?</Text>
          <Text style={styles.stepSubtitle}>Select your target language</Text>
          {renderLanguageGrid(learningLang, handleLearningLanguageSelect)}
        </View>
      )}

      {/* Step 2: Select Known Language */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryLabel}>Learning:</Text>
            <View style={styles.selectedLanguage}>
              <Text style={styles.selectedFlag}>{getLangData(learningLang)?.flag}</Text>
              <Text style={styles.selectedName}>{getLangData(learningLang)?.name}</Text>
            </View>
          </View>

          <Text style={styles.stepTitle}>What language do you already know?</Text>
          <Text style={styles.stepSubtitle}>Select your native/fluent language</Text>
          {renderLanguageGrid(knownLang, handleKnownLanguageSelect, learningLang)}

          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Select Difficulty */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryLabel}>Learning:</Text>
            <View style={styles.selectedLanguage}>
              <Text style={styles.selectedFlag}>{getLangData(learningLang)?.flag}</Text>
              <Text style={styles.selectedName}>{getLangData(learningLang)?.name}</Text>
            </View>
            <Text style={styles.summaryLabel}>from:</Text>
            <View style={styles.selectedLanguage}>
              <Text style={styles.selectedFlag}>{getLangData(knownLang)?.flag}</Text>
              <Text style={styles.selectedName}>{getLangData(knownLang)?.name}</Text>
            </View>
          </View>

          <Text style={styles.stepTitle}>Choose your difficulty level</Text>
          <Text style={styles.stepSubtitle}>Based on CEFR language proficiency levels</Text>
          
          <View style={styles.difficultyGrid}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.code}
                style={[
                  styles.difficultyCard,
                  difficulty === level.code && styles.difficultyCardSelected
                ]}
                onPress={() => handleDifficultySelect(level.code)}
              >
                <Text style={styles.difficultyCode}>{level.code}</Text>
                <Text style={styles.difficultyName}>{level.name}</Text>
                <Text style={styles.difficultyDescription}>{level.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 4: Download Content */}
      {step === 4 && (
        <View style={styles.stepContainer}>
          <View style={styles.finalSummary}>
            <Text style={styles.summaryTitle}>Ready to start learning!</Text>
            
            <View style={styles.languagePairDisplay}>
              <View style={styles.langDisplay}>
                <Text style={styles.finalFlag}>{getLangData(learningLang)?.flag}</Text>
                <Text style={styles.finalLangName}>{getLangData(learningLang)?.name}</Text>
                <Text style={styles.finalLangLabel}>Learning</Text>
              </View>
              
              <Text style={styles.arrow}>→</Text>
              
              <View style={styles.langDisplay}>
                <Text style={styles.finalFlag}>{getLangData(knownLang)?.flag}</Text>
                <Text style={styles.finalLangName}>{getLangData(knownLang)?.name}</Text>
                <Text style={styles.finalLangLabel}>From</Text>
              </View>
            </View>

            {!isDownloading && !currentDownload && (
              <TouchableOpacity style={styles.startButton} onPress={handleStartDownload}>
                <Text style={styles.startButtonText}>Download Content & Start Learning</Text>
              </TouchableOpacity>
            )}

            {(isDownloading || currentDownload) && (
              <View style={styles.downloadContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.downloadText}>
                  Downloading learning content... {downloadProgressPercent}%
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${downloadProgressPercent}%` }]} 
                  />
                </View>
                <Text style={styles.downloadNote}>
                  This may take a few minutes depending on your internet connection
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Change Languages</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'NotoSans',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  languageCard: {
    width: '45%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fdfc',
  },
  languageFlag: {
    fontSize: 48,
    marginBottom: 10,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  selectionSummary: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 15,
    fontFamily: 'NotoSans',
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  selectedName: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
  },
  finalSummary: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 28,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  languagePairDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 40,
    elevation: 3,
  },
  langDisplay: {
    alignItems: 'center',
  },
  finalFlag: {
    fontSize: 48,
    marginBottom: 10,
  },
  finalLangName: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginBottom: 5,
  },
  finalLangLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
  },
  arrow: {
    fontSize: 32,
    color: '#4ECDC4',
    marginHorizontal: 30,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginBottom: 20,
    elevation: 3,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    color: 'white',
    textAlign: 'center',
  },
  downloadContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    elevation: 2,
  },
  downloadText: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 15,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  downloadNote: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
    textAlign: 'center',
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
  },
});