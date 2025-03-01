import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { SharedFile, UploadStatus, handleFileProcess } from '@/utils/file-handler';
import { ProcessingStatus } from '@/components/processing-status';

export default function ShareScreen() {
  const params = useLocalSearchParams<{ sharedFile?: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [sharedFileData, setSharedFileData] = useState<SharedFile | null>(null);

  // Parse the shared file data from params
  useEffect(() => {
    if (params.sharedFile && !processingStarted) {
      try {
        const fileData: SharedFile = JSON.parse(params.sharedFile);
        setSharedFileData(fileData);
        console.log('[ShareScreen] Parsed shared file data:', fileData);
      } catch (error) {
        console.error('[ShareScreen] Error parsing shared file data:', error);
        setStatus('error');
        setResult('Invalid shared file data');
      }
    }
  }, [params.sharedFile, processingStarted]);

  // Process the shared file when data is available
  useEffect(() => {
    if (sharedFileData && !processingStarted) {
      processSharedFile(sharedFileData);
      setProcessingStarted(true);
    }
  }, [sharedFileData, processingStarted]);

  const processSharedFile = async (fileData: SharedFile) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Handle the entire file processing workflow
      const uploadResult = await handleFileProcess(
        fileData,
        token,
        (newStatus) => setStatus(newStatus)
      );

      // Update result based on the processing outcome
      if (uploadResult.status === 'completed') {
        setResult('File processed successfully');
      } else if (uploadResult.status === 'error') {
        setResult(uploadResult.error || 'Processing failed');
      }
    } catch (error) {
      console.error('[ShareScreen] Error processing shared file:', error);
      setStatus('error');
      setResult(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  const handleRetry = () => {
    if (sharedFileData) {
      setStatus('uploading');
      setResult(null);
      processSharedFile(sharedFileData);
    }
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <MaterialIcons name="share" size={36} color="#007AFF" />
      <Text style={styles.title}>Share Content</Text>
      <Text style={styles.subtitle}>
        Process and organize shared files automatically
      </Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {renderHeader()}

        {status === 'idle' && !sharedFileData && (
          <View style={styles.emptyState}>
            <MaterialIcons name="info-outline" size={48} color="#8e8e93" />
            <Text style={styles.emptyStateText}>No content shared yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Use the share sheet from another app to send files to Note Companion
            </Text>
          </View>
        )}

        <ProcessingStatus
          status={status}
          result={result}
          onRetry={handleRetry}
          onBackToHome={handleBackToHome}
          showDetails={true}
        />

        {(status === 'completed' || status === 'error') && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips</Text>
            <View style={styles.tipItem}>
              <MaterialIcons name="lightbulb" size={18} color="#FFC107" />
              <Text style={styles.tipText}>Share PDFs, images, or text from any app</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="lightbulb" size={18} color="#FFC107" />
              <Text style={styles.tipText}>Use the iOS Shortcut for Apple Notes</Text>
            </View>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => router.push('/help')}
            >
              <Text style={styles.helpButtonText}>Learn More</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginVertical: 24,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 4,
  },
});