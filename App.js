import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SentenceAudioScreen from './src/screens/SentenceAudioScreen';
import ReconstructionScreen from './src/screens/ReconstructionScreen';
import PictureScreen from './src/screens/PictureScreen';
import WordMatchScreen from './src/screens/WordMatchScreen';
import { useStore } from './src/store';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { learningLang, knownLang, downloadedBatches } = useStore();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'NotoSans': require('./src/assets/fonts/NotoSans-Regular.ttf'),
        'NotoSans-Bold': require('./src/assets/fonts/NotoSans-Bold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Determine if user has completed language selection and download
  const hasCompletedSetup = learningLang && knownLang && downloadedBatches.includes('batch01');

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={hasCompletedSetup ? "Dashboard" : "LanguageSelection"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4ECDC4',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontFamily: 'NotoSans-Bold',
          },
        }}
      >
        <Stack.Screen 
          name="LanguageSelection" 
          component={LanguageSelectionScreen} 
          options={{ 
            title: 'Choose Languages',
            headerLeft: null, // Prevent back navigation
          }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ 
            title: 'Language Learning',
            headerLeft: null, // Prevent back navigation to language selection
          }}
        />
        <Stack.Screen 
          name="SentenceAudio" 
          component={SentenceAudioScreen} 
          options={{ title: 'Sentence Audio' }}
        />
        <Stack.Screen 
          name="Reconstruction" 
          component={ReconstructionScreen} 
          options={{ title: 'Sentence Reconstruction' }}
        />
        <Stack.Screen 
          name="Picture" 
          component={PictureScreen} 
          options={{ title: 'Describe the Picture' }}
        />
        <Stack.Screen 
          name="WordMatch" 
          component={WordMatchScreen} 
          options={{ title: 'Word Matching' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}