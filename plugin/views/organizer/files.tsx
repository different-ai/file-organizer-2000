import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../index";

interface SimilarFilesBoxProps {
  plugin: FileOrganizer;
  file: TFile | null;
}

export const SimilarFilesBox: React.FC<SimilarFilesBoxProps> = ({ plugin, file }) => {
  const [filePaths, setFilePaths] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchSimilarFiles = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const similarFiles = await plugin._experimentalGenerateSimilarFiles(file);
      setFilePaths(similarFiles);
    } catch (error) {
      console.error("Error fetching similar files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (filePath: string) => {
    plugin.app.workspace.openLinkText(filePath, "/", false);
  };

  return (
    <div className="assistant-section files-section">
      {!filePaths.length && !loading && (
        <button onClick={fetchSimilarFiles} className="load-similar-files-button">
          Load Similar Files
        </button>
      )}
      {loading && <div>Loading similar files...</div>}
      <div className="files-container">
        {filePaths.map((filePath, index) => (
          <div key={index} className="file">
            <a href="#" onClick={() => handleFileClick(filePath)}>
              {filePath}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};