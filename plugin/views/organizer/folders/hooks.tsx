import { useState, useEffect } from "react";
import FileOrganizer from "../../../index";
import { TFile } from "obsidian";

interface UseFolderSuggestionsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const useFolderSuggestions = ({
  plugin,
  file,
  content,
  refreshKey,
}: UseFolderSuggestionsProps) => {
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [newFolders, setNewFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);



  useEffect(() => {
    const suggestFolders = async () => {
      if (!file) return;
      setExistingFolders([]);
      setNewFolders([]);
      setLoading(true);
      setError(null);
      try {
        const [existingFoldersResult, newFoldersResult] = await Promise.all([
          plugin.getExistingFolders(content, file.path),
          plugin.getNewFolders(content, file.path),
        ]);

        const validExistingFolders = Array.isArray(existingFoldersResult)
          ? existingFoldersResult
          : [];
        const validNewFolders = Array.isArray(newFoldersResult)
          ? newFoldersResult
          : [];

        setExistingFolders(validExistingFolders);
        // Filter out new folders that are already in existing folders
        const uniqueNewFolders = validNewFolders.filter(
          (folder) => !validExistingFolders.includes(folder)
        );
        setNewFolders(uniqueNewFolders);
      } catch (err) {
        console.error("Error fetching folders:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    suggestFolders();
  }, [content, refreshKey, file, plugin]);

  return { existingFolders, newFolders, loading, error, };
};