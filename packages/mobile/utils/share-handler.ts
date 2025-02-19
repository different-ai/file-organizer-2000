import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

interface SharedFile {
  uri: string;
  mimeType?: string;
  name?: string;
  text?: string;
}

export const getMimeTypeFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
};

export const getFileNameFromUri = (uri: string): string => {
  const parts = decodeURIComponent(uri).split('/');
  return parts[parts.length - 1] || `shared-file-${Date.now()}`;
};

export const processSharedFile = async (file: SharedFile): Promise<SharedFile> => {
  try {
    const fileUri = Platform.select({
      ios: file.uri.replace('file://', ''),
      android: file.uri,
      default: file.uri,
    });

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Get file name and mime type if not provided
    const fileName = file.name || getFileNameFromUri(fileUri);
    const mimeType = file.mimeType || getMimeTypeFromExtension(fileName);

    // For text files, read the content directly
    if (mimeType.startsWith('text/')) {
      const text = await FileSystem.readAsStringAsync(fileUri);
      return {
        uri: fileUri,
        mimeType,
        name: fileName,
        text,
      };
    }

    // For other files, ensure they're readable
    await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

    return {
      uri: fileUri,
      mimeType,
      name: fileName,
    };
  } catch (error) {
    console.error('Error processing shared file:', error);
    throw error;
  }
};

export const cleanupSharedFile = async (uri: string): Promise<void> => {
  try {
    // Only delete files in the temporary directory
    if (uri.includes(FileSystem.cacheDirectory || '') || uri.includes(FileSystem.documentDirectory || '')) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error('Error cleaning up shared file:', error);
  }
};

export const isShareAvailable = async () => {
  return await Sharing.isAvailableAsync();
}; 