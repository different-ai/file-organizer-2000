import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../../index";

interface SimilarTagsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const SimilarTags: React.FC<SimilarTagsProps> = ({ plugin, file, content, refreshKey }) => {
  const [existingTags, setExistingTags] = React.useState<string[]>([]);
  const [newTags, setNewTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchTags = async () => {
      if (!file || !content) return;
      setLoading(true);
      try {
        const vaultTags = await plugin.getAllVaultTags();
        const [existingTagsResult, newTagsResult] = await Promise.all([
          plugin.getExistingTags(content, file.basename, vaultTags),
          plugin.getNewTags(content, file.basename),
        ]);
        
        console.log('Existing tags:', existingTagsResult);
        console.log('New tags:', newTagsResult);

        setExistingTags(existingTagsResult || []);
        setNewTags((newTagsResult || []).filter(tag => !(existingTagsResult || []).includes(tag)));
      } catch (error) {
        console.error("Error fetching tags:", error);
        setExistingTags([]);
        setNewTags([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [file, content, refreshKey]);

  const handleTagClick = (tag: string) => {
    plugin.appendTag(file!, tag);
  };

  if (loading) return <div>Loading tags...</div>;

  return (
    <div className="tags-container">
      {existingTags.map((tag, index) => (
        <span key={`existing-${index}`} className="tag existing-tag" onClick={() => handleTagClick(tag)}>
          #{tag}
        </span>
      ))}
      {newTags.map((tag, index) => (
        <span key={`new-${index}`} className="tag new-tag" onClick={() => handleTagClick(tag)}>
          #{tag}
        </span>
      ))}
      {existingTags.length === 0 && newTags.length === 0 && <div>No tags found</div>}
    </div>
  );
};