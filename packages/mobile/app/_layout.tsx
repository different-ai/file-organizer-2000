import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useRouter } from 'expo-router';
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
import { processSharedFile, cleanupSharedFile } from '@/utils/share-handler';
import * as FileSystem from 'expo-file-system';

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
  const router = useRouter();

  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const handleIncomingURL = async (url: string | null) => {
    console.log('\n[RootLayout] ===== Starting URL Processing =====');
    console.log('[RootLayout] Raw incoming URL:', url);
    if (!url) {
      console.log('[RootLayout] No URL provided');
      return;
    }

    try {
      // Handle direct file URLs
      if (url.startsWith('file://')) {
        console.log('\n[RootLayout] === Processing File URL ===');
        console.log('[RootLayout] Original URL:', url);
        
        // First decode the URL to handle double-encoded spaces
        const decodedUrl = decodeURIComponent(decodeURIComponent(url));
        console.log('[RootLayout] After double decode:', decodedUrl);
        
        // Split URL into components for filename only
        const urlParts = decodedUrl.split('/');
        const fileName = urlParts.pop() || 'shared-file';
        console.log('[RootLayout] Extracted filename:', fileName);

        // Create shared file object with original URL
        const sharedFile = {
          uri: url,  // Use original URL
          mimeType: decodedUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
          name: fileName,
        };
        console.log('\n[RootLayout] Created shared file object:', JSON.stringify(sharedFile, null, 2));

        // Check if file exists before processing
        console.log('\n[RootLayout] === Checking File Existence ===');
        const fileInfo = await FileSystem.getInfoAsync(url);  // Check original URL
        console.log('[RootLayout] File info result:', JSON.stringify(fileInfo, null, 2));

        if (!fileInfo.exists) {
          // Try alternative paths
          console.log('\n[RootLayout] === Trying Alternative Paths ===');
          const alternativePaths = [
            url.replace('file://', ''),
            decodedUrl,
            url.replace(/%2520/g, '%20')
          ];

          let foundPath = null;
          for (const path of alternativePaths) {
            console.log('[RootLayout] Trying path:', path);
            const altFileInfo = await FileSystem.getInfoAsync(path);
            console.log('[RootLayout] Result for path:', { path, exists: altFileInfo.exists });
            if (altFileInfo.exists) {
              console.log('[RootLayout] Found file at alternative path:', path);
              sharedFile.uri = path;
              foundPath = path;
              break;
            }
          }

          if (!foundPath) {
            throw new Error(`File not found at path: ${url}\nTried alternative paths: ${alternativePaths.join('\n')}`);
          }
        }

        console.log('\n[RootLayout] === Processing File ===');
        const fileData = await processSharedFile(sharedFile);
        console.log('[RootLayout] Processed file data:', JSON.stringify(fileData, null, 2));
        
        console.log('\n[RootLayout] === Navigation ===');
        console.log('[RootLayout] Navigating to share screen');
        router.replace({
          pathname: '/(tabs)/share',
          params: { sharedFile: JSON.stringify(fileData) }
        });

        return;
      }

      // Handle share scheme URLs
      const { path, queryParams } = Linking.parse(url);
      console.log('[RootLayout] Parsed URL:', { path, queryParams });

      if (path === 'share') {
        console.log('[RootLayout] Processing share path');
        if (queryParams?.uri) {
          console.log('[RootLayout] Processing shared file with URI');
          const sharedFile = {
            uri: decodeURIComponent(queryParams.uri as string),
            mimeType: queryParams.type as string,
            name: queryParams.name as string,
          };
          console.log('[RootLayout] Shared file data:', sharedFile);

          const fileData = await processSharedFile(sharedFile);
          console.log('[RootLayout] Processed file data:', fileData);
          
          console.log('[RootLayout] Navigating to share screen');
          router.replace({
            pathname: '/(tabs)/share',
            params: { sharedFile: JSON.stringify(fileData) }
          });

          // Clean up temporary files after processing
          if (Platform.OS === 'android') {
            console.log('[RootLayout] Cleaning up Android temporary files');
            await cleanupSharedFile(sharedFile.uri);
          }
        } else if (queryParams?.text) {
          console.log('[RootLayout] Processing shared text');
          const textData = {
            text: decodeURIComponent(queryParams.text as string),
            mimeType: 'text/plain',
            name: 'shared-text.txt'
          };
          console.log('[RootLayout] Text data:', textData);

          console.log('[RootLayout] Navigating to share screen with text');
          router.replace({
            pathname: '/(tabs)/share',
            params: { sharedFile: JSON.stringify(textData) }
          });
        }
      }
    } catch (error) {
      console.error('[RootLayout] Error handling shared content:', error);
    }
  };

  // Add logging for URL handling setup
  useEffect(() => {
    console.log('[RootLayout] Setting up URL handlers');
    // Handle initial URL when app is opened from share
    Linking.getInitialURL().then(url => {
      console.log('[RootLayout] Initial URL:', url);
      handleIncomingURL(url);
    });

    // Listen for URLs while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[RootLayout] URL event received:', url);
      handleIncomingURL(url);
    });

    return () => {
      console.log('[RootLayout] Cleaning up URL listener');
      subscription.remove();
    };
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
