// src/screens/LanguageSelectionScreen.js - Fixed navigation
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useStore } from '../store';
import { useDownloader } from '../hooks/useDownloader';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' }
];

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function LanguageSelectionScreen({ navigation }) {
  const { 
    learningLang, 
    knownLang, 
    difficulty, 
    setLanguages, 
    setDifficulty,
    isBothLanguagesDownloaded 
  } = useStore();
  
  const { downloadLanguageContent, downloading, progress, currentFile } = useDownloader();
  
  const [selectedLearning, setSelectedLearning] = useState(learningLang);
  const [selectedKnown, setSelectedKnown] = useState(knownLang);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty);

  const handleDownload = async () => {
    if (!selectedLearning || !selectedDifficulty) {
      Alert.alert('Missing Selection', 'Please select a language to learn and difficulty level.');
      return;
    }

    try {
      setLanguages(selectedLearning, selectedKnown);
      setDifficulty(selectedDifficulty);
      
      await downloadLanguageContent(selectedLearning, selectedKnown, selectedDifficulty);
      
      Alert.alert(
        'Download Complete', 
        'Content downloaded successfully!',
        [{ 
          text: 'OK', 
          onPress: () => {
            // FIXED: Navigate to Dashboard (which exists in your App.js)
            navigation.navigate('Dashboard');
          }
        }]
      );
      
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Please try again.');
    }
  };

  const canProceed = () => {
    return selectedLearning && selectedDifficulty && isBothLanguagesDownloaded();
  };

  const getLanguageName = (code) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
        Select Languages
      </Text>
      
      {/* Learning Language */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
          Language to Learn:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={{
                backgroundColor: selectedLearning === lang.code ? '#007AFF' : '#fff',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedLearning === lang.code ? '#007AFF' : '#ddd',
                minWidth: 100,
              }}
              onPress={() => setSelectedLearning(lang.code)}
              disabled={downloading}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 16,
                color: selectedLearning === lang.code ? '#fff' : '#333',
                fontWeight: selectedLearning === lang.code ? '600' : 'normal'
              }}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Known Language */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
          Language You Know (Optional):
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: !selectedKnown ? '#007AFF' : '#fff',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: !selectedKnown ? '#007AFF' : '#ddd',
              minWidth: 100,
            }}
            onPress={() => setSelectedKnown(null)}
            disabled={downloading}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 16,
              color: !selectedKnown ? '#fff' : '#333',
              fontWeight: !selectedKnown ? '600' : 'normal'
            }}>
              None
            </Text>
          </TouchableOpacity>
          {LANGUAGES.filter(lang => lang.code !== selectedLearning).map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={{
                backgroundColor: selectedKnown === lang.code ? '#007AFF' : '#fff',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedKnown === lang.code ? '#007AFF' : '#ddd',
                minWidth: 100,
              }}
              onPress={() => setSelectedKnown(lang.code)}
              disabled={downloading}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 16,
                color: selectedKnown === lang.code ? '#fff' : '#333',
                fontWeight: selectedKnown === lang.code ? '600' : 'normal'
              }}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
          Difficulty Level:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={{
                backgroundColor: selectedDifficulty === diff ? '#007AFF' : '#fff',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedDifficulty === diff ? '#007AFF' : '#ddd',
                minWidth: 60,
              }}
              onPress={() => setSelectedDifficulty(diff)}
              disabled={downloading}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 16,
                color: selectedDifficulty === diff ? '#fff' : '#333',
                fontWeight: selectedDifficulty === diff ? '600' : 'normal'
              }}>
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Download Section */}
      <View style={{ marginBottom: 30 }}>
        {downloading ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10, fontSize: 16 }}>
              Downloading... {Math.round(progress)}%
            </Text>
            {currentFile && (
              <Text style={{ marginTop: 5, fontSize: 12, color: '#666' }}>
                {currentFile}
              </Text>
            )}
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: (!selectedLearning || !selectedDifficulty) ? '#ccc' : '#007AFF',
                paddingVertical: 15,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleDownload}
              disabled={!selectedLearning || !selectedDifficulty}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                Download Content
              </Text>
            </TouchableOpacity>
            
            {selectedLearning && selectedDifficulty && (
              <Text style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: '#666' }}>
                Will download: {getLanguageName(selectedLearning)} {selectedDifficulty}
                {selectedKnown && ` + ${getLanguageName(selectedKnown)} ${selectedDifficulty}`}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Proceed Button - FIXED navigation */}
      {canProceed() && (
        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            paddingVertical: 15,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 20,
          }}
          onPress={() => {
            // FIXED: Navigate to Dashboard
            navigation.navigate('Dashboard');
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
            Continue to App
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}