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
    console.log('\n[processSharedFile] ===== Starting File Processing =====');
    console.log('[processSharedFile] Input file object:', JSON.stringify(file, null, 2));

    // Debug file system paths
    console.log('\n[processSharedFile] === File System Paths ===');
    console.log('[processSharedFile] FileSystem.documentDirectory:', FileSystem.documentDirectory);
    console.log('[processSharedFile] FileSystem.cacheDirectory:', FileSystem.cacheDirectory);

    // Check file existence
    console.log('\n[processSharedFile] === File Existence Check ===');
    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    console.log('[processSharedFile] File info result:', JSON.stringify(fileInfo, null, 2));
    
    if (!fileInfo.exists) {
      // Try alternative paths
      console.log('\n[processSharedFile] === Trying Alternative Paths ===');
      const alternativePaths = [
        file.uri.replace('file://', ''),
        decodeURIComponent(decodeURIComponent(file.uri)),
        file.uri.replace(/%2520/g, '%20')
      ];

      let foundPath = null;
      for (const path of alternativePaths) {
        console.log('[processSharedFile] Trying path:', path);
        const altFileInfo = await FileSystem.getInfoAsync(path);
        console.log('[processSharedFile] Result for path:', { path, exists: altFileInfo.exists });
        if (altFileInfo.exists) {
          console.log('[processSharedFile] Found file at alternative path:', path);
          foundPath = path;
          break;
        }
      }

      if (!foundPath) {
        throw new Error(`File does not exist. Tried paths:\n${alternativePaths.join('\n')}`);
      }
      file.uri = foundPath;
    }

    // Process filename and mime type
    console.log('\n[processSharedFile] === File Details Processing ===');
    const finalFileName = file.name || getFileNameFromUri(file.uri);
    console.log('[processSharedFile] Final filename:', finalFileName);
    
    const mimeType = file.mimeType || getMimeTypeFromExtension(finalFileName);
    console.log('[processSharedFile] Determined MIME type:', mimeType);

    // Handle file content
    console.log('\n[processSharedFile] === Content Processing ===');
    if (mimeType.startsWith('text/')) {
      console.log('[processSharedFile] Processing as text file');
      const text = await FileSystem.readAsStringAsync(file.uri);
      console.log('[processSharedFile] Successfully read text content');
      
      const result = {
        uri: file.uri,
        mimeType,
        name: finalFileName,
        text,
      };
      console.log('[processSharedFile] Returning text file result:', JSON.stringify(result, null, 2));
      return result;
    }

    console.log('[processSharedFile] Processing as binary file');
    console.log('[processSharedFile] Verifying file is readable');
    await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
    console.log('[processSharedFile] Successfully verified file is readable');

    const result = {
      uri: file.uri,
      mimeType,
      name: finalFileName,
    };
    console.log('\n[processSharedFile] === Final Result ===');
    console.log('[processSharedFile] Returning result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('\n[processSharedFile] === Error ===');
    console.error('[processSharedFile] Error details:', error);
    console.error('[processSharedFile] Error stack:', error.stack);
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