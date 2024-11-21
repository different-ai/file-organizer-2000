import { logger } from "../../../services/logger";
import { 
  TagContextItem, 
  SearchContextItem, 
  FolderContextItem,
  FileContextItem,
} from "../use-context-items";

interface UseContextGeneratorProps {
  currentFile: FileContextItem | null;
  folders: Record<string, FolderContextItem>;
  files: Record<string, FileContextItem>;
  tags: Record<string, TagContextItem>;
  searchResults: Record<string, SearchContextItem>;
}

interface CreateContextStringParams {
  currentFile: FileContextItem | null;
  folders: FolderContextItem[];
  files: FileContextItem[];
  tags: TagContextItem[];
  searches: SearchContextItem[];
}

// Helper functions to make the code more composable
const createSectionHeader = (title: string) => `## ${title}\n\n`;
const createFileEntry = (path: string) => `  └── 📄 ${path}\n`;
const createSeparator = () => `---\n\n`;

const createCurrentFileSection = (currentFile: FileContextItem | null): string => {
  if (!currentFile) return '';
  return `## Current File\n\n📄 ${currentFile.path}\n\n### Content\n\n${currentFile.content}\n\n${createSeparator()}`;
};

const createSearchSection = (searches: SearchContextItem[]): string => {
  if (searches.length === 0) return '';
  
  let section = createSectionHeader('Search Results');
  searches.forEach(search => {
    section += `🔍 Search: "${search.query}"\n`;
    search.results.forEach(result => section += createFileEntry(result.path));
    section += '\n';
  });
  return section;
};

const createTagsSection = (tags: TagContextItem[]): string => {
  if (tags.length === 0) return '';
  
  let section = createSectionHeader('Tags and Tagged Files');
  tags.forEach(tag => {
    section += `#${tag.name}\n`;
    tag.files?.forEach(file => section += createFileEntry(file.path));
    section += '\n';
  });
  return section;
};

const createFoldersSection = (folders: FolderContextItem[]): string => {
  if (folders.length === 0) return '';
  
  let section = createSectionHeader('Folders');
  folders.forEach(folder => {
    section += `📁 Folder: ${folder.path}\n`;
    folder.files?.forEach(file => section += createFileEntry(file.path));
    section += '\n';
  });
  return section;
};

const createFilesSection = (files: FileContextItem[]): string => {
  if (files.length === 0) return '';
  
  let section = createSectionHeader('Individual Files');
  files.forEach(file => section += `📄 ${file.path}\n`);
  section += '\n';
  return section;
};

const createContentsSection = (
  tags: TagContextItem[], 
  folders: FolderContextItem[], 
  files: FileContextItem[], 
  searches: SearchContextItem[]
): string => {
  let section = createSectionHeader('File Contents');

  // Tagged files content
  tags.forEach(tag => {
    tag.files?.forEach(file => {
      section += `### 📄 ${file.path} (tagged with #${tag.name})\n\n${file.content}\n\n${createSeparator()}`;
    });
  });

  // Folder files content
  folders.forEach(folder => {
    folder.files?.forEach(file => {
      section += `### 📄 ${file.path}\n\n${file.content}\n\n${createSeparator()}`;
    });
  });

  // Individual files content
  files.forEach(file => {
    section += `### 📄 ${file.path}\n\n${file.content}\n\n${createSeparator()}`;
  });

  // Search results content
  if (searches.length > 0) {
    section += createSectionHeader('Search Result Contents');
    searches.forEach(search => {
      section += `### 🔍 Search: "${search.query}"\n\n`;
      search.results.forEach(result => {
        section += `#### 📄 ${result.path}\n\n${result.content}\n\n${createSeparator()}`;
      });
    });
  }

  return section;
};

export const useContextGenerator = ({ 
  currentFile,
  folders, 
  files, 
  tags, 
  searchResults 
}: UseContextGeneratorProps) => {
  const createContextString = ({
    currentFile,
    folders,
    files,
    tags,
    searches
  }: CreateContextStringParams): string => {
    const sections = [
      "# Available Content\n\n",
      createCurrentFileSection(currentFile),
      createSearchSection(searches),
      createTagsSection(tags),
      createFoldersSection(folders),
      createFilesSection(files),
      createContentsSection(tags, folders, files, searches)
    ];

    return sections.filter(Boolean).join('');
  };

  const generateContext = (): string => {
    const processedFolders = Object.values(folders);
    const processedTags = Object.values(tags);
    const processedFiles = Object.values(files);
    const processedSearches = Object.values(searchResults);

    const contextString = createContextString({
      currentFile,
      folders: processedFolders,
      files: processedFiles,
      tags: processedTags,
      searches: processedSearches
    });
    
    logger.debug("Generated context string", { 
      currentFile: !!currentFile,
      foldersCount: processedFolders.length,
      filesCount: processedFiles.length,
      tagsCount: processedTags.length,
      searchesCount: processedSearches.length
    });
    
    return contextString;
  };

  return { generateContext };
}; 