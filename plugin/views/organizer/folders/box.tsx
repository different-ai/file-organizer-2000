import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../../index";
import { useFolderSuggestions } from "./hooks";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonLoader } from "../components/skeleton-loader";

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
  const { existingFolders, newFolders, loading, error, refetch } =
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

  const renderContent = () => {
    if (loading) {
      return <SkeletonLoader count={4} width="100px" height="30px" className="p-2" rows={1} />;
    }

    if (error) {
      return (
        <div className="text-[--text-error] p-2 rounded-md bg-[--background-modifier-error]">
          <p>Error: {error.message}</p>
          <button 
            onClick={refetch}
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
              onClick={() => handleFolderClick(folder)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {folder}
            </motion.button>
          ))}
          {newFolders.map((folder, index) => (
            <motion.button
              key={`new-${index}`}
              className="px-3 py-1 bg-transparent border border-dashed border-[--text-muted] text-[--text-muted] rounded-md hover:bg-[--interactive-accent] hover:text-white hover:border-transparent transition-colors duration-200"
              onClick={() => handleFolderClick(folder)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {folder}
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
