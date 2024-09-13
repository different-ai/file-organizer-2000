import * as React from "react";
import { TFile, requestUrl } from "obsidian";
import FileOrganizer from "../../../index";
import { makeApiRequest } from "../../../apiUtils";
import { sanitizeTag } from "../../../../utils";

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
  const [loading, setLoading] = React.useState(false);

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

        // Fetch existing and new tags concurrently
        getExistingTags(content, file.basename, vaultTags)
          .then(existingTagsResult => {
            console.log("Existing tags:", existingTagsResult);
            setExistingTags(existingTagsResult || []);
          })
          .catch(error =>
            console.error("Error fetching existing tags:", error)
          );

        getNewTags(content, file.basename)
          .then(newTagsResult => {
            console.log("New tags:", newTagsResult);
            setNewTags(newTagsResult || []);
          })
          .catch(error => console.error("Error fetching new tags:", error));
      } catch (error) {
        console.error("Error in tag fetching process:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [file, content, refreshKey]);

  const handleTagClick = (tag: string) => {
    plugin.appendTag(file!, tag);
  };

  return (
    <div className="tags-container">
      {loading && <div>Loading tags...</div>}
      {existingTags.map((tag, index) => (
        <span
          key={`existing-${index}`}
          className="tag existing-tag"
          onClick={() => handleTagClick(tag)}
        >
          {sanitizeTag(tag)}
        </span>
      ))}
      {newTags.map((tag, index) => (
        <span
          key={`new-${index}`}
          className="tag new-tag"
          onClick={() => handleTagClick(tag)}
        >
          {sanitizeTag(tag)}
        </span>
      ))}
      {!loading && existingTags.length === 0 && newTags.length === 0 && (
        <div>No tags found</div>
      )}
    </div>
  );
};
