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
  const [progress, setProgress] = React.useState<string>("");

  const parseDocument = async () => {
    setLoading(true);
    setProgress("Starting analysis...");
    setConcepts([]);
    setChunks([]);

    try {
      const content = await plugin.app.vault.read(activeFile);
      
      // Handle streaming updates through the progress callback
      const allConcepts = await plugin.identifyConceptsAndFetchChunks(
        content,
        (newConcepts) => {
          // Update concepts (names only)
          setConcepts(prev => {
            const newNames = newConcepts.map(c => c.name);
            return Array.from(new Set([...prev, ...newNames]));
          });
          
          // Update chunks (full data)
          setChunks(prev => {
            const newChunks = newConcepts.map(c => ({
              concept: c.name,
              content: c.chunk
            }));
            return [...prev, ...newChunks];
          });

          setProgress(`Processing concepts: ${newConcepts.length} found...`);
        }
      );

      setProgress("Analysis complete!");
    } catch (error) {
      logger.error("Error parsing document:", error);
      setProgress("Error occurred during analysis");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(""), 3000);
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
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={parseDocument} 
          disabled={loading}
          className={`px-4 py-2 rounded ${loading ? 'bg-gray-300' : 'bg-[--interactive-accent]'}`}
        >
          {loading ? "Analyzing..." : "Analyze Document"}
        </button>
        {progress && (
          <span className="text-[--text-muted] text-sm">{progress}</span>
        )}
      </div>

      <div className="space-y-4">
        {concepts.map((concept, index) => (
          <div 
            key={index}
            className="p-4 rounded bg-[--background-primary-alt]"
          >
            <h4 className="text-[--text-normal] font-medium mb-2">{concept}</h4>
            {chunks
              .filter(chunk => chunk.concept === concept)
              .map((chunk, chunkIndex) => (
                <div 
                  key={chunkIndex} 
                  className="chunk-container p-3 rounded bg-[--background-secondary] mb-2"
                >
                  <p className="text-[--text-normal] mb-2">{chunk.content}</p>
                  <button 
                    onClick={() => addToInbox(concept, chunk.content)}
                    className="text-sm px-3 py-1 rounded bg-[--interactive-accent] text-[--text-on-accent]"
                  >
                    Add to Inbox
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};