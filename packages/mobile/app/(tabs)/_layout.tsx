import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

interface TabIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  console.log('[TabLayout] Rendered with auth state:', { isSignedIn, isLoaded });

  useEffect(() => {
    console.log('[TabLayout] Auth state changed:', { isSignedIn, isLoaded });
    if (isLoaded && !isSignedIn) {
      console.log('[TabLayout] User not signed in, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    console.log('[TabLayout] Not rendering tabs due to auth state');
    return null;
  }

  console.log('[TabLayout] Rendering tab navigation');
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#007AFF',
        headerShown: true 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="file-upload" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
