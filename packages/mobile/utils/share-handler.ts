import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

interface SharedFile {
  uri: string;
  mimeType?: string;
  name?: string;
}

export const processSharedFile = async (sharedFile: SharedFile) => {
  try {
    // For Android, we need to copy the file to app's cache directory
    // as we might not have permission to read from the original location
    if (Platform.OS === 'android') {
      const fileInfo = await FileSystem.getInfoAsync(sharedFile.uri);
      if (!fileInfo.exists) {
        throw new Error('Shared file does not exist');
      }

      // Generate a temporary filename
      const timestamp = new Date().getTime();
      const extension = sharedFile.name?.split('.').pop() || 'tmp';
      const tempFilename = `${timestamp}.${extension}`;
      const tempFilePath = `${FileSystem.cacheDirectory}${tempFilename}`;

      // Copy file to our cache directory
      await FileSystem.copyAsync({
        from: sharedFile.uri,
        to: tempFilePath,
      });

      // Update the uri to point to our copied file
      sharedFile.uri = tempFilePath;
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(sharedFile.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare the file data
    const fileData = {
      name: sharedFile.name || `shared-file-${new Date().getTime()}`,
      type: sharedFile.mimeType || 'application/octet-stream',
      base64,
    };

    return fileData;
  } catch (error) {
    console.error('Error processing shared file:', error);
    throw error;
  }
};

export const isShareAvailable = async () => {
  return await Sharing.isAvailableAsync();
}; 