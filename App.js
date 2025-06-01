// App.js - Updated for new batch-based architecture
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
  const { learningLang, knownLang, hasAnyDownloadedContent } = useStore();

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'NotoSans': require('./src/assets/fonts/NotoSans-Regular.ttf'),
          'NotoSans-Bold': require('./src/assets/fonts/NotoSans-Bold.ttf'),
        });
        console.log('✅ Fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.error('❌ Font loading failed:', error);
        // Continue without fonts if loading fails
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  // Determine initial route based on app state
  const getInitialRouteName = () => {
    if (!learningLang || !knownLang) {
      // No language pair selected
      return "LanguageSelection";
    } else if (hasAnyDownloadedContent()) {
      // Languages selected and content downloaded
      return "Dashboard";
    } else {
      // Languages selected but no content - go to dashboard to download
      return "Dashboard";
    }
  };

  const initialRouteName = getInitialRouteName();
  console.log(`🚀 App starting with route: ${initialRouteName}`);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRouteName}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4ECDC4',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontFamily: fontsLoaded ? 'NotoSans-Bold' : 'System',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
        }}
      >
        {/* Language Selection Screen */}
        <Stack.Screen 
          name="LanguageSelection" 
          component={LanguageSelectionScreen} 
          options={{ 
            title: 'Choose Languages',
            headerLeft: null, // Prevent back navigation
          }}
        />
        
        {/* Main Dashboard Screen */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ 
            title: 'Language Learning',
            headerLeft: null, // Prevent back navigation to language selection
          }}
        />
        
        {/* Learning Activity Screens */}
        <Stack.Screen 
          name="SentenceAudio" 
          component={SentenceAudioScreen} 
          options={{ 
            title: 'Sentence Audio',
            headerBackTitle: 'Dashboard',
          }}
        />
        
        <Stack.Screen 
          name="Reconstruction" 
          component={ReconstructionScreen} 
          options={{ 
            title: 'Sentence Reconstruction',
            headerBackTitle: 'Dashboard',
          }}
        />
        
        <Stack.Screen 
          name="Picture" 
          component={PictureScreen} 
          options={{ 
            title: 'Describe the Picture',
            headerBackTitle: 'Dashboard',
          }}
        />
        
        <Stack.Screen 
          name="WordMatch" 
          component={WordMatchScreen} 
          options={{ 
            title: 'Word Matching',
            headerBackTitle: 'Dashboard',
          }}
        />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}