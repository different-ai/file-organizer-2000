import { useMemo } from 'react';
import { TFile, } from 'obsidian';
import { usePlugin } from '../provider';

export interface VaultFile {
  path: string;
  title: string;
  content?: string;
}

export interface VaultFolder {
  path: string;
  title: string;
}

export function useVaultItems() {
  const plugin = usePlugin();
  
  return useMemo(() => {
    // Get all markdown files
    const files: VaultFile[] = plugin.app.vault.getMarkdownFiles().map(file => ({
      path: file.path,
      title: file.basename,
      label: file.basename,
      type: 'file'
      // We don't load content by default for performance
      // Content can be loaded on demand when needed
    }));

    // Get all folders
    const folders: VaultFolder[] = plugin.app.vault.getAllFolders().map(folder => ({
      path: folder.path,
      title: folder.name,
      label: folder.name,
      type: 'folder'
    }));

    // Get all tags from metadata cache
    const tags = new Set<string>();
    plugin.app.metadataCache.getCachedFiles().forEach(filePath => {
      const cache = plugin.app.metadataCache.getCache(filePath);
      if (cache?.tags) {
        cache.tags.forEach(tagCache => {
          tags.add(tagCache.tag.replace('#', ''));
        });
      }
    });

    return {
      files,
      folders,
      tags: Array.from(tags).map(tag => ({
        path: tag,
        title: tag,
        label: tag,
        type: 'tag'
      })),
      // Helper to load file content when needed
      loadFileContent: async (path: string) => {
        const file = plugin.app.vault.getFileByPath(path);
        if (file instanceof TFile) {
          return await plugin.app.vault.read(file);
        }
        return null;
      }
    };
  }, [plugin]);
} 