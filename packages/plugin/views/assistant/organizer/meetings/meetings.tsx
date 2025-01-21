import * as React from "react";
import { Notice, TFile } from "obsidian";
import FileOrganizer from "../../../../index";
import { SkeletonLoader } from "../components/skeleton-loader";
import { logger } from "../../../../services/logger";

interface MeetingsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

export const Meetings: React.FC<MeetingsProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const [minutes, setMinutes] = React.useState(5);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isScreenpipeAvailable, setIsScreenpipeAvailable] = React.useState<boolean>(false);

  // Check Screenpipe availability on component mount
  React.useEffect(() => {
    checkScreenpipeHealth();
  }, []);

  const checkScreenpipeHealth = async () => {
    try {
      const response = await fetch('http://localhost:3030/health');
      if (response.ok) {
        setIsScreenpipeAvailable(true);
        setError(null);
      } else {
        throw new Error('Screenpipe service is not responding');
      }
    } catch (err) {
      setIsScreenpipeAvailable(false);
      setError(
        'Screenpipe is not running. Please install it from https://screenpi.pe and ensure it is running locally.'
      );
    }
  };

  const enhanceMeetingNotes = async () => {
    if (!file) return;
    if (!isScreenpipeAvailable) {
      new Notice('Please install and start Screenpipe first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate the start time based on minutes
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - minutes * 60_000).toISOString();

      // Fetch transcripts from Screenpipe
      let transcriptions = '';
      let hasContent = false;
      
      const queryUrl = `http://localhost:3030/search?content_type=audio&start_time=${startTime}&end_time=${endTime}`;
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error: status ${response.status}`);
      }

      const data = await response.json();
      // Combine all transcriptions from the results
      transcriptions = data.data
        .map((item: any) => item.content.transcription)
        .join("\n");
      
      hasContent = transcriptions.trim().length > 0;

      if (!hasContent) {
        throw new Error("No recent audio data found in the last " + minutes + " minutes");
      }

      // Format the instruction for merging transcripts
      const formattingInstruction = `
        You have the following recent transcript from the meeting:
        ${transcriptions}
        
        Merge/improve the current meeting notes below with any details from the new transcript:
        ${content}
        
        Provide an updated version of these meeting notes in a cohesive style.
      `;

      const links = await plugin.getCurrentFileLinks(file);
      // files from all links
      const linksFiles = links.map(link => plugin.app.vault.getFileByPath(link.link));
      // get file from link
      console.log("links", links);
      // get all link content and inject into the content
      const linkContents = await Promise.all(linksFiles.map(link => plugin.app.vault.read(link)));
      const linkContentsString = linkContents.join("\n\n");
      const contentWithLinks = `${content}\n\n${linkContentsString}`;

      // Stream the formatted content into the current note line by line
      await plugin.streamFormatInCurrentNoteLineByLine({
        file,
        formattingInstruction,
        content: contentWithLinks,
        chunkMode: 'line', // Use line-by-line mode for more granular updates
      });

      new Notice("Meeting notes successfully enhanced!");
    } catch (err) {
      logger.error("Error enhancing meeting notes:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      new Notice(`Failed to enhance meeting notes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[--background-primary-alt] text-[--text-normal] p-4 rounded-lg shadow-md">
      {loading ? (
        <SkeletonLoader count={1} rows={4} width="100%" />
      ) : error ? (
        <div className="error-container">
          <p>Error: {error}</p>
          {!isScreenpipeAvailable && (
            <div className="mt-2">
              <p className="text-sm">
                To use this feature, you need to:
              </p>
              <ol className="list-decimal ml-4 text-sm">
                <li>Visit <a href="https://screenpi.pe" className="text-[--text-accent] hover:underline">screenpi.pe</a></li>
                <li>Download and install Screenpipe</li>
                <li>Start the Screenpipe application</li>
              </ol>
              <button onClick={checkScreenpipeHealth} className="mt-2 mod-cta">
                Check Again
              </button>
            </div>
          )}
          {isScreenpipeAvailable && (
            <button onClick={() => setError(null)} className="retry-button">
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <label>Last X minutes:</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              min={1}
              className="input-minutes"
            />
          </div>
          <button 
            onClick={enhanceMeetingNotes} 
            className="mod-cta"
            disabled={!isScreenpipeAvailable}
          >
            Enhance Meeting Notes
          </button>
          {!isScreenpipeAvailable && (
            <p className="text-sm mt-2 text-[--text-muted]">
              Please install and start Screenpipe to use this feature
            </p>
          )}
        </>
      )}
    </div>
  );
};
