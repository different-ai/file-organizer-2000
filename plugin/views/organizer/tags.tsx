import * as React from "react";
import { TFile, requestUrl } from "obsidian";
import FileOrganizer from "../../index";
import { makeApiRequest } from "../../apiUtils";
import { sanitizeTag } from "../../../utils";
import { SkeletonLoader } from "./components/skeleton-loader";
import { motion, AnimatePresence } from "framer-motion";

// Base Tag Component
const BaseTag: React.FC<{
  tag: string;
  onClick: (tag: string) => void;
  className?: string;
}> = ({ tag, onClick, className }) => (
  <motion.span
    className={`inline-block rounded px-2 py-1 text-sm cursor-pointer transition-colors duration-200 ${className}`}
    onClick={() => onClick(tag)}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
  >
    {sanitizeTag(tag)}
  </motion.span>
);

// Existing Tag Component
const ExistingTag: React.FC<{ tag: string; onClick: (tag: string) => void }> = (props) => (
  <BaseTag
    {...props}
    className="bg-[--background-secondary] text-[--text-normal] hover:text-[--text-on-accent] hover:bg-[--interactive-accent] hover:font-medium"
  />
);

// New Tag Component
const NewTag: React.FC<{ tag: string; onClick: (tag: string) => void }> = (props) => (
  <BaseTag
    {...props}
    className="bg-transparent border border-dashed border-[--text-muted] text-[--text-muted] hover:text-[--text-on-accent] hover:bg-[--interactive-accent] hover:font-medium"
  />
);

interface SimilarTagsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const SimilarTags: React.FC<SimilarTagsProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const [existingTags, setExistingTags] = React.useState<string[]>([]);
  const [newTags, setNewTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);

  const getExistingTags = async (
    content: string,
    fileName: string,
    vaultTags: string[]
  ): Promise<string[]> => {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${plugin.getServerUrl()}/api/tags/existing`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ content, fileName, vaultTags }),
        throw: false,
        headers: {
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
        },
      })
    );
    const { generatedTags } = await response.json;
    return generatedTags;
  };

  const getNewTags = async (
    content: string,
    fileName: string
  ): Promise<string[]> => {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${plugin.getServerUrl()}/api/tags/new`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ content, fileName }),
        throw: false,
        headers: {
          Authorization: `Bearer ${plugin.settings.API_KEY}`,
        },
      })
    );
    const { generatedTags } = await response.json;
    return generatedTags;
  };

  React.useEffect(() => {
    const fetchTags = async () => {
      if (!file || !content) return;
      setLoading(true);
      setExistingTags([]);
      setNewTags([]);

      try {
        const vaultTags = await plugin.getAllVaultTags();

        const [existingTagsResult, newTagsResult] = await Promise.all([
          getExistingTags(content, file.basename, vaultTags),
          getNewTags(content, file.basename),
        ]);

        setExistingTags(existingTagsResult || []);
        setNewTags(newTagsResult || []);
      } catch (error) {
        console.error("Error in tag fetching process:", error);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };
    fetchTags();
  }, [file, content, refreshKey]);

  const handleTagClick = (tag: string) => {
    plugin.appendTag(file!, tag);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <SkeletonLoader
          count={4}
          width="60px"
          height="24px"
          className="p-2"
          rows={1}
        />
      );
    }
    if (initialLoadComplete && existingTags.length === 0 && newTags.length === 0) {
      return <div className="text-[--text-muted] p-2">No tags found</div>;
    }

    return (
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {existingTags.map((tag, index) => (
            <ExistingTag
              key={`existing-${index}`}
              tag={tag}
              onClick={handleTagClick}
            />
          ))}
          {newTags.map((tag, index) => (
            <NewTag
              key={`new-${index}`}
              tag={tag}
              onClick={handleTagClick}
            />
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
