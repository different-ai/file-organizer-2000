import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_URL, API_CONFIG } from '@/constants/config';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface SharedFile {
  uri: string;
  mimeType?: string;
  name?: string;
  text?: string;
}

export interface UploadResult {
  status: UploadStatus;
  text?: string;
  error?: string;
  fileId?: number;
}

export interface UploadResponse {
  success: boolean;
  fileId: number;
  status: string;
}

/**
 * Prepares a file for upload by normalizing paths and generating appropriate filename and mimetype
 */
export const prepareFile = async (file: SharedFile): Promise<{
  fileName: string;
  mimeType: string;
  fileUri: string;
  base64Content: string;
}> => {
  // Determine filename
  const uriParts = file.uri.split('.');
  const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
  const fileName = file.name || `shared-${Date.now()}.${file.mimeType?.split('/')[1] || fileExtension || 'file'}`;
  
  // Determine mimetype
  let mimeType = file.mimeType;
  if (!mimeType) {
    switch (fileExtension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
  }

  // Ensure PDF files are correctly identified regardless of case
  if (mimeType.toLowerCase().includes('pdf')) {
    mimeType = 'application/pdf';
  }

  // Handle platform-specific file URI format
  const fileUri = file.text
    ? `${FileSystem.cacheDirectory}${fileName}`
    : Platform.select({
        ios: file.uri.replace('file://', ''),
        android: file.uri,
        default: file.uri,
      });

  // Write text content to file if needed
  if (file.text) {
    await FileSystem.writeAsStringAsync(fileUri, file.text);
  }

  // Verify file exists on iOS
  if (Platform.OS === 'ios' && !file.text) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
  }

  // Read file content as base64
  const base64Content = await FileSystem.readAsStringAsync(
    fileUri,
    { encoding: FileSystem.EncodingType.Base64 }
  );

  return {
    fileName,
    mimeType,
    fileUri,
    base64Content,
  };
};

/**
 * Uploads a file to the server
 */
export const uploadFile = async (
  file: SharedFile, 
  token: string
): Promise<UploadResponse> => {
  const { fileName, mimeType, base64Content } = await prepareFile(file);
  
  const uploadResponse = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: fileName,
      type: mimeType,
      base64: base64Content,
    }),
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse
      .json()
      .catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || 'Upload failed');
  }

  return await uploadResponse.json();
};

/**
 * Processes a file with retry logic
 */
export const processFile = async (fileId: number, token: string): Promise<void> => {
  let retryCount = 0;
  let processResponse;

  while (retryCount < API_CONFIG.maxRetries) {
    try {
      processResponse = await fetch(`${API_URL}/api/process-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (processResponse.ok) {
        return;
      }

      // Check if we should retry based on status code
      if (processResponse.status >= 500 || processResponse.status === 429) {
        // Server error or rate limit - retry
        retryCount++;
        if (retryCount < API_CONFIG.maxRetries) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Retrying process request (${retryCount}/${API_CONFIG.maxRetries}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Not retryable status code or max retries reached
      const errorData = await processResponse
        .json()
        .catch(() => ({ error: 'Processing failed' }));
      throw new Error(errorData.error || 'Processing failed');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out');
      }
      
      retryCount++;
      if (retryCount < API_CONFIG.maxRetries) {
        const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1);
        console.log(`Retrying after error (${retryCount}/${API_CONFIG.maxRetries}) after ${delay}ms:`, 
          error instanceof Error ? error.message : 'Unknown error');
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Processing failed after maximum retry attempts');
};

/**
 * Polls for file processing results
 */
export const pollForResults = async (
  fileId: number,
  token: string
): Promise<UploadResult> => {
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${API_URL}/api/file-status?fileId=${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to check file status' }));
        return { 
          status: 'error', 
          error: errorData.error || 'Failed to check file status' 
        };
      }
      
      const data = await response.json();

      if (data.error) return { status: 'error', error: data.error, fileId };
      if (data.status === 'completed') return { status: 'completed', text: data.text, fileId };
      if (data.status === 'error') return { status: 'error', error: data.error, fileId };

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to check file status',
        fileId
      };
    }
  }

  return { status: 'error', error: 'Processing timeout', fileId };
};

/**
 * Handles the entire file processing workflow: upload, process, and poll for results
 */
export const handleFileProcess = async (
  file: SharedFile,
  token: string,
  onStatusChange?: (status: UploadStatus) => void,
): Promise<UploadResult> => {
  try {
    // Update status to uploading
    onStatusChange?.('uploading');
    
    // Upload file
    const uploadData = await uploadFile(file, token);
    
    // Update status to processing
    onStatusChange?.('processing');
    
    // Process file
    await processFile(uploadData.fileId, token);
    
    // Poll for results
    const result = await pollForResults(uploadData.fileId, token);
    
    // Update final status
    onStatusChange?.(result.status);
    
    return result;
  } catch (error) {
    console.error('File processing error:', error);
    const errorResult: UploadResult = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to process file'
    };
    onStatusChange?.('error');
    return errorResult;
  }
}; 