import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SharedFileViewer } from '../components/SharedFileViewer';
import { View, StyleSheet } from 'react-native';

export default function SharedScreen() {
  const { url } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!url) {
      // If no URL is provided, go back to the home screen
      router.replace('/');
    }
  }, [url, router]);

  return (
    <View style={styles.container}>
      <SharedFileViewer fileUri={url as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 