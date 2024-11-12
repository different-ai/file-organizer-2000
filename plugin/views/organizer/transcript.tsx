import * as React from "react";
import { TFile, Notice } from "obsidian";
import FileOrganizer from "../../index";
import { logger } from "../../services/logger";

interface TranscriptionButtonProps {
  plugin: FileOrganizer;
  file: TFile;
  content: string;
}

export const TranscriptionButton: React.FC<TranscriptionButtonProps> = ({ plugin, file, content }) => {
  const [transcribing, setTranscribing] = React.useState<boolean>(false);

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      const audioRegex = /!\[\[(.*\.(mp3|wav|m4a|ogg|webm))]]/i;
      const match = content.match(audioRegex);
      if (match) {
        const audioFileName = match[1];

        const audioFile = plugin.app.metadataCache.getFirstLinkpathDest(
          audioFileName,
          "."
        );

        if (!(audioFile instanceof TFile)) {
          logger.error("Audio file not found");
          new Notice("Audio file not found");
          return;
        }
        if (audioFile instanceof TFile) {
          const transcript = await plugin.generateTranscriptFromAudio(
            audioFile
          );
          await plugin.appendTranscriptToActiveFile(
            file,
            audioFileName,
            transcript
          );
          new Notice("Transcript added to the file");
        }
      }
    } catch (error) {
      logger.error("Error transcribing audio:", error);
      new Notice("Error transcribing audio");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <button
      className="transcribe-button"
      onClick={handleTranscribe}
      disabled={transcribing}
    >
      {transcribing ? "Transcribing..." : "Transcribe Audio"}
    </button>
  );
};