import * as React from "react";
import { TFile } from "obsidian";
import FileOrganizer from "../../index";
import { logger } from "../../services/logger";

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

  const addToInbox = async (title: string, chunkContent: string) => {
    try {
      await plugin.createFileInInbox(title, chunkContent);
    } catch (error) {
      logger.error("Error adding to inbox:", error);
    }
  };

  return (
    <div className="document-chunks">
      <button onClick={parseDocument} disabled={loading}>
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
                <button onClick={() => addToInbox(concept, chunk.content)}>Add to Inbox</button>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};