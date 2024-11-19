import { create } from 'zustand';
import { logger } from '../../services/logger';

interface ContextItem {
  id: string;        // Unique identifier (path or generated id)
  type: 'file' | 'folder' | 'youtube' | 'screenpipe' | 'tag';
  title: string;     // Display name
  content: string;   // The actual content
  reference: string; // How to reference this in the UI
}

interface ContextItemsState {
  items: ContextItem[];
  currentFile: { id: string; title: string; content: string; name: string } | null;
  includeCurrentFile: boolean;

  // Simple actions
  addItem: (item: ContextItem) => void;
  removeItem: (id: string) => void;
  setCurrentFile: (file: { id: string; title: string; content: string; name: string } | null) => void;
  toggleCurrentFile: () => void;
  clearAll: () => void;
  getUnifiedContext: () => ContextItem[];
}

export const useContextItems = create<ContextItemsState>((set, get) => ({
  items: [],
  currentFile: null,
  includeCurrentFile: true,

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  setCurrentFile: (file) => set({ currentFile: file }),

  toggleCurrentFile: () => set((state) => ({ 
    includeCurrentFile: !state.includeCurrentFile 
  })),

  clearAll: () => set({ 
    items: [],
    includeCurrentFile: false
  }),

  getUnifiedContext: () => {
    const state = get();
    const contextItems = [...state.items];
    
    if (state.includeCurrentFile && state.currentFile) {
      contextItems.unshift({
        id: state.currentFile.id,
        type: 'file',
        title: state.currentFile.title,
        content: state.currentFile.content,
        reference: 'Current File'
      });
    }
    
    return contextItems;
  }
}));

// Helper functions
export const addFileContext = (
  file: { path: string; title: string; content: string }
) => {
  useContextItems.getState().addItem({
    id: file.path,
    type: 'file',
    title: file.title,
    content: file.content,
    reference: 'File'
  });
};

export const addYouTubeContext = (
  video: { videoId: string; title: string; transcript: string }
) => {
  useContextItems.getState().addItem({
    id: `youtube-${video.videoId}`,
    type: 'youtube',
    title: video.title,
    content: video.transcript,
    reference: 'YouTube Video'
  });
};

export const addFolderContext = (folder: string) => {
  useContextItems.getState().addItem({
    id: folder,
    type: 'folder',
    title: folder,
    content: `Folder: ${folder}`,
    reference: 'Folder'
  });
};

export const addTagContext = (tag: string) => {
  useContextItems.getState().addItem({
    id: tag,
    type: 'tag',
    title: tag,
    content: `Tag: ${tag}`,
    reference: 'Tag'
  });
};

export const addScreenpipeContext = (context: any | null) => {
  useContextItems.getState().addItem({
    id: 'screenpipe-context',
    type: 'screenpipe',
    title: 'Screenpipe Context',
    content: JSON.stringify(context),
    reference: 'Screenpipe Context'
  });
}; 