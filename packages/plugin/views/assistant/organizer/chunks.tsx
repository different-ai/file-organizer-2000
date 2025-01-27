import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../../index";
import { logger } from "../../../services/logger";

interface DocumentChunksProps {
  plugin: FileOrganizer;
  activeFile: TFile;
}

export const AtomicNotes: React.FC<DocumentChunksProps> = ({ plugin, activeFile }) => {
  const [concepts, setConcepts] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<{ concept: string; content: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  const parseDocument = async () => {
    setLoading(true);
    try {
      const content = await plugin.app.vault.read(activeFile);
      const result = await plugin.identifyConceptsAndFetchChunks(content);
      setConcepts(result.map(c => c.name));
      setChunks(result.map(c => ({ concept: c.name, content: c.chunk })));
    } catch (error) {
      logger.error("Error parsing document:", error);
    } finally {
      setLoading(false);
    }
  };

  const createFileInSameFolder = async (title: string, chunkContent: string) => {
    try {
      // Get the parent folder path of the active file
      const folderPath = activeFile.parent?.path || "";
      
      // Create a sanitized filename
      const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, "-");
      const newFileName = `${sanitizedTitle}.md`;
      const fullPath = `${folderPath}/${newFileName}`;

      // Create the new file in the same folder
      await plugin.app.vault.create(fullPath, chunkContent);
    } catch (error) {
      logger.error("Error creating file in folder:", error);
    }
  };

  return (
    <div className="document-chunks">
      <button
        onClick={parseDocument}
        disabled={loading}
        className="bg-accent text-accent-foreground px-2 py-1"
      >
        {loading ? "Parsing..." : "Parse Document"}
      </button>
      {concepts.map((concept, index) => (
        <div key={index}>
          <h4>{concept}</h4>
          {chunks
            .filter(chunk => chunk.concept === concept)
            .map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="chunk-container">
                <p>{chunk.content}</p>
                <button
                  className="bg-accent text-accent-foreground px-2 py-1"
                  onClick={() => createFileInSameFolder(concept, chunk.content)}
                >
                  Create Note
                </button>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};