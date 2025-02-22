import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '@/constants/config';
import { MaterialIcons } from '@expo/vector-icons';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface SharedFile {
  uri: string;
  mimeType?: string;
  name?: string;
  text?: string;
}

export default function ShareScreen() {
  const params = useLocalSearchParams<{ sharedFile?: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<string | null>(null);

  console.log('[ShareScreen] Rendered with params:', params);

  useEffect(() => {
    const processSharedFile = async () => {
      console.log('[ShareScreen] Checking for shared file in params');
      if (!params.sharedFile) {
        console.log('[ShareScreen] No shared file found in params');
        return;
      }
      
      try {
        console.log('[ShareScreen] Parsing shared file data');
        const fileData: SharedFile = JSON.parse(params.sharedFile);
        console.log('[ShareScreen] Parsed file data:', fileData);
        
        setStatus('uploading');
        console.log('[ShareScreen] Status set to uploading');

        const token = await getToken();
        if (!token) {
          console.log('[ShareScreen] No auth token found');
          throw new Error('Authentication required');
        }
        console.log('[ShareScreen] Got auth token');

        const fileName = fileData.name || `shared-${Date.now()}.${fileData.mimeType?.split('/')[1] || 'file'}`;
        const mimeType = fileData.mimeType || 'application/octet-stream';
        console.log('[ShareScreen] Prepared file details:', { fileName, mimeType });

        const fileUri = fileData.text
          ? `${FileSystem.cacheDirectory}${fileName}`
          : fileData.uri.replace('file://', '');
        console.log('[ShareScreen] File URI:', fileUri);

        if (fileData.text) {
          console.log('[ShareScreen] Writing text to file');
          await FileSystem.writeAsStringAsync(fileUri, fileData.text);
        }

        console.log('[ShareScreen] Reading file content');
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('[ShareScreen] File content read successfully');

        console.log('[ShareScreen] Uploading file');
        const uploadResponse = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: fileName,
            type: mimeType,
            base64: fileContent,
          }),
        });

        if (!uploadResponse.ok) {
          console.log('[ShareScreen] Upload failed:', uploadResponse.status);
          throw new Error('Upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('[ShareScreen] Upload successful:', uploadResult);
        const { fileId } = uploadResult;

        setStatus('processing');
        console.log('[ShareScreen] Status set to processing');

        console.log('[ShareScreen] Processing file');
        const processResponse = await fetch(`${API_URL}/api/process-file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileId }),
        });

        if (!processResponse.ok) {
          console.log('[ShareScreen] Processing failed:', processResponse.status);
          throw new Error('Processing failed');
        }

        console.log('[ShareScreen] Processing completed successfully');
        setStatus('completed');
        setResult('File processed successfully');
      } catch (error) {
        console.error('[ShareScreen] Error processing shared file:', error);
        setStatus('error');
        setResult(error instanceof Error ? error.message : 'Failed to process file');
      }
    };

    processSharedFile();
  }, [params.sharedFile]);

  const handleBackToHome = () => {
    console.log('[ShareScreen] Navigating back to home');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Content</Text>
      {status === 'idle' && !params.sharedFile && (
        <Text style={styles.message}>No content shared yet</Text>
      )}
      {(status === 'uploading' || status === 'processing') && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>
            {status === 'uploading' ? 'Uploading...' : 'Processing...'}
          </Text>
        </View>
      )}
      {status === 'completed' && (
        <View style={styles.resultContainer}>
          <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.resultText}>{result}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBackToHome}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.resultContainer}>
          <MaterialIcons name="error" size={24} color="#f44336" />
          <Text style={styles.errorText}>{result}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleBackToHome}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  resultText: {
    fontSize: 16,
    color: '#4CAF50',
    marginVertical: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});