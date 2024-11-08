import * as React from "react";
import { normalizePath, Notice, TFile } from "obsidian";
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

interface TitleSuggestion {
  score: number;
  title: string;
  reason: string;
}

export const RenameSuggestion: React.FC<RenameSuggestionProps> = ({
  plugin,
  file,
  refreshKey,
}) => {
  const [suggestions, setSuggestions] = React.useState<TitleSuggestion[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  const suggestTitles = React.useCallback(async () => {
    if (!file) return;
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const titles = await plugin.guessTitles(file.path, file.name);
      setSuggestions(titles);
    } catch (err) {
      console.error("Error fetching titles:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [file, plugin]);

  React.useEffect(() => {
    suggestTitles();
  }, [suggestTitles, refreshKey]);

  const handleTitleApply = async (title: string) => {
    if (!file?.parent) return;
    
    setLoading(true);
    try {
      await plugin.moveFile(file, title, file.parent.path);
      new Notice(`Renamed to ${title}`);
    } catch (error) {
      console.error("Error renaming file:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      new Notice(`Failed to rename: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <SkeletonLoader count={3} rows={4} width="70%" />;
  if (error) return <ErrorDisplay message={error.message} onRetry={suggestTitles} />;
  if (!suggestions.length) return <div>No title suggestions available</div>;

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg shadow-md">
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              className="px-3 py-1 bg-[--background-secondary] text-[--text-normal] rounded-md hover:bg-[--interactive-accent] hover:text-white transition-colors duration-200"
              onClick={() => handleTitleApply(suggestion.title)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              title={`Score of ${suggestion.score} because ${suggestion.reason}`}
            >
              {suggestion.title}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
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
