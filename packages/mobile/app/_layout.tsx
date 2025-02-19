import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import Constants from 'expo-constants';
import { processSharedFile } from '@/utils/share-handler';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Handle incoming shared files
      const subscription = Linking.addEventListener('url', async ({ url }) => {
        try {
          const { path, queryParams } = Linking.parse(url);
          
          // Handle shared file URLs
          if (path === 'share' && queryParams?.uri) {
            const sharedFile = {
              uri: decodeURIComponent(queryParams.uri as string),
              mimeType: (queryParams.type as string) || 'application/octet-stream',
              name: (queryParams.name as string) || `shared-file-${Date.now()}`,
            };
            
            const fileData = await processSharedFile(sharedFile);
            // Navigate to home screen with the file data
            router.push({
              pathname: '/(tabs)',
              params: { sharedFile: JSON.stringify(fileData) }
            });
          }
        } catch (error) {
          console.error('Error handling shared file:', error);
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  if (!loaded) {
    return null;
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#f5f5f5',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
