import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../../index";
import { useFolderSuggestions } from "./hooks";

interface SimilarFolderBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const SimilarFolderBox: React.FC<SimilarFolderBoxProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const { existingFolders, newFolders, loading, error,  } =
    useFolderSuggestions({
      plugin,
      file,
      content,
      refreshKey,
    });

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="assistant-section folder-section">
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
    </div>
  );
};