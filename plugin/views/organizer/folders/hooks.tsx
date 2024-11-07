import { useState, useEffect } from "react";
import FileOrganizer from "../../../index";
import { TFile } from "obsidian";
import { logMessage } from "../../../../utils";

interface UseFolderSuggestionsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

interface FolderSuggestion {
  isNewFolder: boolean;
  folder: string;
  reason: string;
}

export const useFolderSuggestions = ({
  plugin,
  file,
  content,
  refreshKey,
}: UseFolderSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<FolderSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const suggestFolders = async () => {
      if (!file) return;
      setSuggestions([]);
      setLoading(true);
      setError(null);
      
      try {
        const folderSuggestions = await plugin.guessRelevantFolders(content, file.path);
        setSuggestions(folderSuggestions);
      } catch (err) {
        console.error("Error fetching folders:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    suggestFolders();
  }, [content, refreshKey, file, plugin]);

  // Derive existing and new folders from suggestions
  const existingFolders = suggestions
    .filter(s => !s.isNewFolder)
    .map(s => s.folder);
    
  const newFolders = suggestions
    .filter(s => s.isNewFolder)
    .map(s => s.folder);

  return { 
    existingFolders, 
    newFolders, 
    suggestions, // Include full suggestions with reasons
    loading, 
    error 
  };
};
