import * as React from "react";
import { TFile, requestUrl } from "obsidian";
import FileOrganizer from "../../../index";
import { makeApiRequest } from "../../../apiUtils";
import { sanitizeTag } from "../../../../utils";
import { TagSkeletonLoader } from "./tag-skeleton-loader";
import { motion, AnimatePresence } from "framer-motion";

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
          getNewTags(content, file.basename)
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

  if (loading) return <TagSkeletonLoader />;
  if (initialLoadComplete && existingTags.length === 0 && newTags.length === 0) {
    return <div>No tags found</div>;
  }

  return (
    <motion.div
      className="tags-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {existingTags.map((tag, index) => (
          <motion.span
            key={`existing-${index}`}
            className="tag existing-tag"
            onClick={() => handleTagClick(tag)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {sanitizeTag(tag)}
          </motion.span>
        ))}
        {newTags.map((tag, index) => (
          <motion.span
            key={`new-${index}`}
            className="tag new-tag"
            onClick={() => handleTagClick(tag)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {sanitizeTag(tag)}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
