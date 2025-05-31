import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useStore } from '../store';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

export default function LanguageSelector() {
  const { learningLang, knownLang, setLanguagePair } = useStore();
  const [showModal, setShowModal] = React.useState(false);
  const [selecting, setSelecting] = React.useState(null); // 'learning' or 'known'

  const getLangName = (code) => LANGUAGES.find(l => l.code === code)?.name || code;
  const getLangFlag = (code) => LANGUAGES.find(l => l.code === code)?.flag || '🌍';

  const handleLanguageSelect = (langCode) => {
    if (selecting === 'learning') {
      if (langCode !== knownLang) {
        setLanguagePair(langCode, knownLang);
      }
    } else if (selecting === 'known') {
      if (langCode !== learningLang) {
        setLanguagePair(learningLang, langCode);
      }
    }
    setShowModal(false);
    setSelecting(null);
  };

  const openLanguageSelector = (type) => {
    setSelecting(type);
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Settings</Text>
      
      <View style={styles.languagePair}>
        {/* Learning Language */}
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => openLanguageSelector('learning')}
        >
          <Text style={styles.label}>Learning:</Text>
          <View style={styles.languageDisplay}>
            <Text style={styles.flag}>{getLangFlag(learningLang)}</Text>
            <Text style={styles.languageName}>{getLangName(learningLang)}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.arrow}>→</Text>

        {/* Known Language */}
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => openLanguageSelector('known')}
        >
          <Text style={styles.label}>From:</Text>
          <View style={styles.languageDisplay}>
            <Text style={styles.flag}>{getLangFlag(knownLang)}</Text>
            <Text style={styles.languageName}>{getLangName(knownLang)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {selecting === 'learning' ? 'Learning' : 'Known'} Language
            </Text>
            
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((lang) => {
                const isDisabled = selecting === 'learning' 
                  ? lang.code === knownLang 
                  : lang.code === learningLang;
                
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      isDisabled && styles.languageOptionDisabled
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                    disabled={isDisabled}
                  >
                    <Text style={styles.optionFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.optionName,
                      isDisabled && styles.optionNameDisabled
                    ]}>
                      {lang.name}
                    </Text>
                    {isDisabled && (
                      <Text style={styles.disabledText}>
                        (Currently {selecting === 'learning' ? 'known' : 'learning'})
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 15,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  languagePair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'NotoSans',
    marginBottom: 5,
  },
  languageDisplay: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
    marginBottom: 5,
  },
  languageName: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#333',
  },
  arrow: {
    fontSize: 24,
    marginHorizontal: 15,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionDisabled: {
    opacity: 0.5,
  },
  optionFlag: {
    fontSize: 24,
    marginRight: 15,
  },
  optionName: {
    fontSize: 16,
    fontFamily: 'NotoSans',
    flex: 1,
  },
  optionNameDisabled: {
    color: '#999',
  },
  disabledText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
  },
});