import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../../index";

interface RenameSuggestionProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const RenameSuggestion: React.FC<RenameSuggestionProps> = ({ plugin, file, content, refreshKey }) => {
  const [titles, setTitles] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const suggestTitles = async () => {
      if (!file || !content) {
        setError("File or content is missing");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const suggestedTitles = await plugin.generateMultipleNamesFromContent(content, file.basename);
        setTitles(suggestedTitles);
      } catch (error) {
        console.error("Error generating titles:", error);
        setError("Failed to generate titles");
      } finally {
        setLoading(false);
      }
    };
    suggestTitles();
  }, [file, content, refreshKey]);

  const handleTitleClick = (title: string) => {
    if (file && file.parent) {
      plugin.moveFile(file, title, file.parent.path);
    } else {
      console.error("File or file parent is null.");
    }
  };

  if (loading) return <div>Loading title suggestions...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!titles) return <div>No title suggestions available</div>;

  return (
    <div className="title-container">
      {titles.length > 0 ? (
        titles.map((title, index) => (
          <button key={index} className="title-suggestion" onClick={() => handleTitleClick(title)}>
            {title}
          </button>
        ))
      ) : (
        <div>No title suggestions found</div>
      )}
    </div>
  );
};