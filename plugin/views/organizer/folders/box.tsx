import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../../index";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonLoader } from "../components/skeleton-loader";
import { FolderSuggestion } from "../../../index";

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
  const [suggestions, setSuggestions] = React.useState<FolderSuggestion[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
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
  const existingFolders = suggestions.filter(s => !s.isNewFolder);
  const newFolders = suggestions.filter(s => s.isNewFolder);

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

  const renderContent = () => {
    if (loading) {
      return <SkeletonLoader count={4} width="100px" height="30px" rows={1} />;
    }

    if (error) {
      return (
        <div className="text-[--text-error] p-2 rounded-md bg-[--background-modifier-error]">
          <p>Error: {error.message}</p>
          <button 
            className="mt-2 px-3 py-1 bg-[--interactive-accent] text-white rounded-md hover:bg-[--interactive-accent-hover]"
          >
            Retry
          </button>
        </div>
      );
    }

    if (existingFolders.length === 0 && newFolders.length === 0) {
      return <div className="text-[--text-muted] p-2">No suitable folders found</div>;
    }

    return (
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {existingFolders.map((folder, index) => (
            <motion.button
              key={`existing-${index}`}
              className="px-3 py-1 bg-[--background-secondary] text-[--text-normal] rounded-md hover:bg-[--interactive-accent] hover:text-white transition-colors duration-200"
              onClick={() => handleFolderClick(folder.folder)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              title={`Reason: ${folder.reason}`}
            >
              {folder.folder}
            </motion.button>
          ))}
          {newFolders.map((folder, index) => (
            <motion.button
              key={`new-${index}`}
              className="px-3 py-1 bg-transparent border border-dashed border-[--text-muted] text-[--text-muted] rounded-md hover:bg-[--interactive-accent] hover:text-white hover:border-transparent transition-colors duration-200"
              onClick={() => handleFolderClick(folder.folder)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              title={`Reason: ${folder.reason}`}
            >
              {folder.folder}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg shadow-md">
      {renderContent()}
    </div>
  );
};
