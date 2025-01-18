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

  const enhanceMeetingNotes = async () => {
    if (!file) return;

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

      // Stream the formatted content into the current note line by line
      await plugin.streamFormatInCurrentNoteLineByLine({
        file,
        formattingInstruction,
        content,
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
          <button onClick={() => setError(null)} className="retry-button">
            Retry
          </button>
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
          <button onClick={enhanceMeetingNotes} className="mod-cta">
            Enhance Meeting Notes
          </button>
        </>
      )}
    </div>
  );
};
