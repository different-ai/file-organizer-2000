import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="folder" size={48} color="#007AFF" />
        <Text style={styles.title}>Welcome to File Organizer</Text>
        {user && (
          <Text style={styles.userInfo}>
            {user.emailAddresses[0]?.emailAddress}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.description}>
          Upload files or take photos to organize your documents. Our AI will help categorize and extract information from your files.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureItem}>
          <MaterialIcons name="upload-file" size={24} color="#007AFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>File Upload</Text>
            <Text style={styles.featureDescription}>Upload PDFs and images for processing</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="camera-alt" size={24} color="#007AFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Camera Capture</Text>
            <Text style={styles.featureDescription}>Take photos of documents directly</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="text-snippet" size={24} color="#007AFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Text Extraction</Text>
            <Text style={styles.featureDescription}>AI-powered text extraction from files</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  featureText: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});
