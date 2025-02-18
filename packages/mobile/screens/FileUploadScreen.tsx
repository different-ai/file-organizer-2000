import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { API_URL } from '@/constants/config';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadResult {
  status: UploadStatus;
  text?: string;
  error?: string;
}

export default function FileUploadScreen() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const { getToken } = useAuth();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.canceled) {
        return;
      }

      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error('Error picking document:', error);
      setUploadResult({ status: 'error', error: 'Failed to pick document' });
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setUploadResult({ status: 'error', error: 'Camera permission denied' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      await uploadFile(result.assets[0]);
    } catch (error) {
      console.error('Error taking photo:', error);
      setUploadResult({ status: 'error', error: 'Failed to take photo' });
    }
  };

  const uploadFile = async (file: { uri: string; mimeType?: string; name?: string }) => {
    try {
      setStatus('uploading');
      setUploadResult(null);

      const token = await getToken();
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name || 'upload.file',
      } as unknown as Blob);

      // Step 1: Upload file
      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setStatus('processing');

      // Step 2: Process file
      const processResponse = await fetch(`${API_URL}/api/process-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: uploadData.fileId }),
      });

      const processData = await processResponse.json();
      if (!processResponse.ok) {
        throw new Error(processData.error || 'Processing failed');
      }

      // Step 3: Poll for results
      const result = await pollForResults(uploadData.fileId, token);
      setUploadResult(result);
      setStatus(result.status);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      setStatus('error');
    }
  };

  const pollForResults = async (fileId: number, token: string): Promise<UploadResult> => {
    let attempts = 0;
    const maxAttempts = 30; // 1 minute max (2s intervals)

    while (attempts < maxAttempts) {
      const response = await fetch(`${API_URL}/api/file-status?fileId=${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.error) {
        return { status: 'error', error: data.error };
      }

      if (data.status === 'completed') {
        return { status: 'completed', text: data.text };
      }

      if (data.status === 'error') {
        return { status: 'error', error: data.error };
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }

    return { status: 'error', error: 'Processing timeout' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickDocument}
          disabled={status === 'uploading' || status === 'processing'}
        >
          <MaterialIcons name="file-upload" size={24} color="white" />
          <Text style={styles.buttonText}>Pick Document</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={takePhoto}
          disabled={status === 'uploading' || status === 'processing'}
        >
          <MaterialIcons name="camera-alt" size={24} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {(status === 'uploading' || status === 'processing') && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>
            {status === 'uploading' ? 'Uploading...' : 'Processing...'}
          </Text>
        </View>
      )}

      {uploadResult && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.statusText,
            uploadResult.status === 'completed' ? styles.successText : styles.errorText
          ]}>
            {uploadResult.status === 'completed' ? 'Completed' : 'Error'}
          </Text>
          
          {uploadResult.error ? (
            <Text style={styles.errorText}>{uploadResult.error}</Text>
          ) : uploadResult.text ? (
            <View style={styles.textContainer}>
              <Text style={styles.label}>Extracted Text:</Text>
              <Text style={styles.extractedText}>{uploadResult.text}</Text>
            </View>
          ) : null}
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
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  textContainer: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  extractedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  errorText: {
    color: '#f44336',
    fontWeight: '600',
  },
}); 