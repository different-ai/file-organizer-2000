import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Button } from '../../components/Button';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';


export default function SettingsScreen() {
  const { signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Account</ThemedText>
        <Button
          onPress={() => signOut()}
          style={styles.button}
          textStyle={styles.buttonText}
        >
          Sign Out
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
  },
}); 