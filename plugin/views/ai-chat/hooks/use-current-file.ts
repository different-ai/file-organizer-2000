import { useEffect } from 'react';
import { FileContextItem } from '../use-context-items';
import { logger } from '../../../services/logger';

interface UseCurrentFileProps {
  fileName: string | null;
  fileContent: string;
  setCurrentFile: (file: FileContextItem | null) => void;
}

export function useCurrentFile({ 
  fileName, 
  fileContent, 
  setCurrentFile 
}: UseCurrentFileProps) {
  useEffect(() => {
    if (fileName && fileContent) {
      const currentFile: FileContextItem = {
        id: fileName,
        type: 'file',
        path: fileName,
        title: fileName,
        content: fileContent,
        reference: 'Current File',
        createdAt: Date.now()
      };

      logger.debug('Setting current file:', currentFile);
      setCurrentFile(currentFile);
    } else {
      // Clear current file if no file is selected
      setCurrentFile(null);
    }
  }, [fileName, fileContent, setCurrentFile]);
} 