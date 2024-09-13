import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../index";

interface SimilarFolderBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const SimilarFolderBox: React.FC<SimilarFolderBoxProps> = ({ plugin, file, content, refreshKey }) => {
  const [existingFolders, setExistingFolders] = React.useState<string[]>([]);
  const [newFolders, setNewFolders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const suggestFolders = async () => {
      if (!content || !file) return;
      setExistingFolders([]);
      setNewFolders([]);
      setLoading(true);
      try {
        const [existingFoldersResult, newFoldersResult] = await Promise.all([
          plugin.getExistingFolders(content, file.path),
          plugin.getNewFolders(content, file.path),
        ]);

        const validExistingFolders = Array.isArray(existingFoldersResult) ? existingFoldersResult : [];
        const validNewFolders = Array.isArray(newFoldersResult) ? newFoldersResult : [];

        setExistingFolders(validExistingFolders);
        // Filter out new folders that are already in existing folders
        const uniqueNewFolders = validNewFolders.filter(
          folder => !validExistingFolders.includes(folder)
        );
        setNewFolders(uniqueNewFolders);
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(false);
      }
    };
    suggestFolders();
  }, [content, refreshKey, file, plugin]);

  const handleFolderClick = async (folder: string) => {
    if (file) {
      try {
        await plugin.moveFile(file, file.basename, folder);
        new Notice(`Moved ${file.basename} to ${folder}`);
      } catch (error) {
        console.error("Error moving file:", error);
        new Notice(`Failed to move ${file.basename} to ${folder}`);
      }
    }
  };

  return (
    <div className="assistant-section folder-section">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="folder-container">
          {existingFolders.map((folder, index) => (
            <button
              key={`existing-${index}`}
              className="folder-suggestion existing-folder"
              onClick={() => handleFolderClick(folder)}
            >
              {folder}
            </button>
          ))}
          {newFolders.map((folder, index) => (
            <button
              key={`new-${index}`}
              className="folder-suggestion new-folder"
              onClick={() => handleFolderClick(folder)}
            >
              {folder}
            </button>
          ))}
          {existingFolders.length === 0 && newFolders.length === 0 && (
            <div>No suitable folders found</div>
          )}
        </div>
      )}
    </div>
  );
};