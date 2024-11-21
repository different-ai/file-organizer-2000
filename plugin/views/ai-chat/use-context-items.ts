import { create } from 'zustand';

// Base types
interface BaseContextItem {
  id: string;
  reference: string;
  createdAt: number;
}

// Specific item types
interface FileContextItem extends BaseContextItem {
  type: 'file';
  path: string;
  title: string;
  content: string;
}

interface FolderContextItem extends BaseContextItem {
  type: 'folder';
  path: string;
  name: string;
}

interface YouTubeContextItem extends BaseContextItem {
  type: 'youtube';
  videoId: string;
  title: string;
  transcript: string;
}

interface TagContextItem extends BaseContextItem {
  type: 'tag';
  name: string;
}

interface ScreenpipeContextItem extends BaseContextItem {
  type: 'screenpipe';
  data: any;
}

type ContextCollections = {
  files: Record<string, FileContextItem>;
  folders: Record<string, FolderContextItem>;
  youtubeVideos: Record<string, YouTubeContextItem>;
  tags: Record<string, TagContextItem>;
  screenpipe: Record<string, ScreenpipeContextItem>;
};

interface ContextItemsState extends ContextCollections {
  currentFile: FileContextItem | null;
  includeCurrentFile: boolean;

  // Actions for each type
  addFile: (file: FileContextItem) => void;
  addFolder: (folder: FolderContextItem) => void;
  addYouTubeVideo: (video: YouTubeContextItem) => void;
  addTag: (tag: TagContextItem) => void;
  addScreenpipe: (data: ScreenpipeContextItem) => void;
  
  // Generic actions
  removeItem: (type: ContextItemType, id: string) => void;
  setCurrentFile: (file: FileContextItem | null) => void;
  toggleCurrentFile: () => void;
  clearAll: () => void;
  
  // Getters
  getUnifiedContext: () => BaseContextItem[];
  getItemsByType: (type: ContextItemType) => BaseContextItem[];
}

export const useContextItems = create<ContextItemsState>((set, get) => ({
  // Initial state
  files: {},
  folders: {},
  youtubeVideos: {},
  tags: {},
  screenpipe: {},
  currentFile: null,
  includeCurrentFile: true,

  // Add actions
  addFile: (file) => set((state) => ({
    files: { ...state.files, [file.id]: file }
  })),

  addFolder: (folder) => set((state) => ({
    folders: { ...state.folders, [folder.id]: folder }
  })),

  addYouTubeVideo: (video) => set((state) => ({
    youtubeVideos: { ...state.youtubeVideos, [video.id]: video }
  })),

  addTag: (tag) => set((state) => ({
    tags: { ...state.tags, [tag.id]: tag }
  })),

  addScreenpipe: (data) => set((state) => ({
    screenpipe: { ...state.screenpipe, [data.id]: data }
  })),

  // Remove action
  removeItem: (type, id) => set((state) => {
    const collectionMap: Record<ContextItemType, keyof ContextCollections> = {
      file: 'files',
      folder: 'folders',
      youtube: 'youtubeVideos',
      tag: 'tags',
      screenpipe: 'screenpipe'
    };

    const collectionKey = collectionMap[type];
    const collection = { ...state[collectionKey] };
    delete collection[id];

    return { [collectionKey]: collection } as Partial<ContextCollections>;
  }),

  setCurrentFile: (file) => set({ currentFile: file }),

  toggleCurrentFile: () => set((state) => ({ 
    includeCurrentFile: !state.includeCurrentFile 
  })),

  clearAll: () => set({ 
    files: {},
    folders: {},
    youtubeVideos: {},
    tags: {},
    screenpipe: {},
    includeCurrentFile: false,
    currentFile: null
  }),

  getUnifiedContext: () => {
    const state = get();
    const allItems = [
      ...Object.values(state.files),
      ...Object.values(state.folders),
      ...Object.values(state.youtubeVideos),
      ...Object.values(state.tags),
      ...Object.values(state.screenpipe)
    ].sort((a, b) => b.createdAt - a.createdAt);

    if (state.includeCurrentFile && state.currentFile) {
      allItems.unshift(state.currentFile);
    }

    return allItems;
  },

  getItemsByType: (type) => {
    const state = get();
    const collectionMap: Record<ContextItemType, keyof ContextCollections> = {
      file: 'files',
      folder: 'folders',
      youtube: 'youtubeVideos',
      tag: 'tags',
      screenpipe: 'screenpipe'
    };

    return Object.values(state[collectionMap[type]]);
  }
}));

// Helper functions with timestamps
export const addFileContext = (file: { path: string; title: string; content: string }) => {
  useContextItems.getState().addFile({
    id: file.path,
    type: 'file',
    path: file.path,
    title: file.title,
    content: file.content,
    reference: 'File',
    createdAt: Date.now()
  });
};

export const addYouTubeContext = (video: { videoId: string; title: string; transcript: string }) => {
  useContextItems.getState().addYouTubeVideo({
    id: `youtube-${video.videoId}`,
    type: 'youtube',
    videoId: video.videoId,
    title: video.title,
    transcript: video.transcript,
    reference: 'YouTube Video',
    createdAt: Date.now()
  });
};

export const addFolderContext = (folderPath: string) => {
  useContextItems.getState().addFolder({
    id: folderPath,
    type: 'folder',
    path: folderPath,
    name: folderPath.split('/').pop() || folderPath,
    reference: 'Folder',
    createdAt: Date.now()
  });
};

export const addTagContext = (tagName: string) => {
  useContextItems.getState().addTag({
    id: `tag-${tagName}`,
    type: 'tag',
    name: tagName,
    reference: 'Tag',
    createdAt: Date.now()
  });
};

export const addScreenpipeContext = (data: any) => {
  useContextItems.getState().addScreenpipe({
    id: 'screenpipe-context',
    type: 'screenpipe',
    data,
    reference: 'Screenpipe Context',
    createdAt: Date.now()
  });
};

// Add export for types
export type ContextItemType = 'file' | 'folder' | 'youtube' | 'tag' | 'screenpipe';
export type { 
  FileContextItem,
  FolderContextItem,
  YouTubeContextItem,
  TagContextItem,
  ScreenpipeContextItem,
  BaseContextItem
}; 