import * as React from "react";
import { normalizePath, TFile } from "obsidian";
import FileOrganizer from "../../../index";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonLoader } from "../components/skeleton-loader";
import { TitleSuggestion } from "./title-suggestion-item";
import { useTitleSuggestions } from "./use-title-suggestions";

interface RenameSuggestionProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const titleSchema = z.object({
  names: z.array(z.string().max(60)).length(3),
});

export const RenameSuggestion: React.FC<RenameSuggestionProps> = ({
  plugin,
  file,
  refreshKey,
}) => {
  const { titles, isLoading, error, retry } = useTitleSuggestions(
    plugin,
    file,
    refreshKey
  );

  const handleTitleApply = (title: string) => {
    if (file && file.parent) {
      plugin.moveFile(file, title, file.parent.path);
    } else {
      console.error("File or file parent is null.");
    }
  };

  if (isLoading) return <SkeletonLoader count={3} rows={4} width="70%" />;
  if (error) return <ErrorDisplay message={error.message} onRetry={retry} />;
  if (!titles.length) return <div>No title suggestions available</div>;

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 bg-[--background-primary-alt] p-3 rounded-lg shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      variants={containerVariants}
      style={{
        display: "flex",
        justifyContent: "start",
        gap: "8px",
        flexDirection: "column",
      }}
    >
      <AnimatePresence>
        {titles.map((title, index) => (
          <TitleSuggestion
            key={index}
            title={title}
            onApply={handleTitleApply}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="error-container">
    <p>Error: {message}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);
