import * as React from "react";
import { normalizePath, TFile } from "obsidian";
import FileOrganizer from "../../../index";
import { experimental_useObject as useObject } from "ai/react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

interface RenameSuggestionProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}
export const titleSchema = z.object({
  names: z.array(z.string().max(60)).length(3),
});

const SkeletonLoader: React.FC = () => (
  <div className="skeleton-loader">
    {[1, 2, 3].map(i => (
      <div key={i} className="skeleton-item"></div>
    ))}
  </div>
);

export const RenameSuggestion: React.FC<RenameSuggestionProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const { object, submit, isLoading, error } = useObject({
    api: `${plugin.getServerUrl()}/api/title/multiple-stream`,

    schema: titleSchema,
    fetch: async (URL, req) => {
      console.log(req?.body, "req?.body");
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: req?.body,
      });
      return response;
    },
  });

  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    if (file && content) {
      const renameInstructions = plugin.settings.renameInstructions;
      const vaultTitles = plugin.settings.useVaultTitles
        ? plugin.getRandomVaultTitles(20)
        : [];

      //ole log all the values
      console.log(file.basename, "file.basename");
      console.log(content, "content");
      console.log(renameInstructions, "renameInstructions");
      console.log(vaultTitles, "vaultTitles");

      submit({
        document: content,
        renameInstructions,
        currentName: file.basename,
        vaultTitles,
      });
    }
  }, [file, content, refreshKey, plugin, retryCount]);

  const handleTitleClick = (title: string) => {
    if (file && file.parent) {
      plugin.moveFile(file, title, file.parent.path);
    } else {
      console.error("File or file parent is null.");
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  if (isLoading) return <SkeletonLoader />;
  if (error)
    return (
      <div className="error-container">
        <p>Error: {error.message}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  if (!object?.names) return <div>No title suggestions available</div>;

  return (
    <motion.div
      className="grid grid-cols-1 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {object.names.map((title, index) => (
          <motion.button
            key={index}
            variants={itemVariants}
            // Removed whileHover prop
            whileTap={{ scale: 0.95 }}
            className="title-suggestion"
            onClick={() => handleTitleClick(normalizePath(title))}
          >
            <span className="">{title}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
