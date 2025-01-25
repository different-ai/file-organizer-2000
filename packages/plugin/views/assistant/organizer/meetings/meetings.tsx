import * as React from "react";
import { getLinkpath, Notice, TFile } from "obsidian";
import FileOrganizer from "../../../../index";
import { SkeletonLoader } from "../components/skeleton-loader";
import { logger } from "../../../../services/logger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "../../../../components/ui/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

interface MeetingsProps {
  plugin: FileOrganizer;
  file: TFile | null;
  content: string;
  refreshKey: number;
}

interface TimeOption {
  label: string;
  value: number;
}

const timeOptions: TimeOption[] = [
  { label: "Last 15 minutes", value: 15 },
  { label: "Last 30 minutes", value: 30 },
  { label: "Last hour", value: 60 },
  { label: "Last 2 hours", value: 120 },
  { label: "Last 3 hours", value: 180 },
];

export const Meetings: React.FC<MeetingsProps> = ({
  plugin,
  file,
  content,
  refreshKey,
}) => {
  const [minutes, setMinutes] = React.useState(60); // Default to last hour
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isScreenpipeAvailable, setIsScreenpipeAvailable] = React.useState<boolean>(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = React.useState(false);

  // Check Screenpipe availability on component mount
  React.useEffect(() => {
    checkScreenpipeHealth();
  }, []);

  const checkScreenpipeHealth = async () => {
    try {
      const response = await fetch("http://localhost:3030/health");
      if (response.ok) {
        setIsScreenpipeAvailable(true);
        setError(null);
      } else {
        throw new Error("Screenpipe service is not responding");
      }
    } catch (err) {
      setIsScreenpipeAvailable(false);
      setError(
        "Screenpipe is not running. Please install it from https://screenpi.pe and ensure it is running locally."
      );
    }
  };

  const enhanceMeetingNotes = async () => {
    if (!file) return;
    if (!isScreenpipeAvailable) {
      new Notice("Please install and start Screenpipe first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate the start time based on minutes
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - minutes * 60_000).toISOString();

      // Fetch transcripts from Screenpipe
      let transcriptions = "";
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
        throw new Error(
          "No recent audio data found in the last " + minutes + " minutes"
        );
      }

      // Get the file's metadata cache to resolve links
      const fileCache = plugin.app.metadataCache.getFileCache(file);
      if (!fileCache || !fileCache.links) {
        logger.debug("No links found in file cache");
      }

      // Get resolved links for the current file
      const resolvedLinks =
        plugin.app.metadataCache.resolvedLinks[file.path] || {};
      const linkedFiles: TFile[] = [];

      // Collect all valid linked files
      Object.keys(resolvedLinks).forEach(linkPath => {
        const linkedFile = plugin.app.vault.getAbstractFileByPath(linkPath);
        if (linkedFile instanceof TFile) {
          linkedFiles.push(linkedFile);
        }
      });

      // Get content from linked files
      const linkContents = await Promise.all(
        linkedFiles.map(async linkedFile => {
          try {
            const content = await plugin.app.vault.read(linkedFile);
            return `# ${linkedFile.basename}\n\n${content}`;
          } catch (err) {
            logger.error(`Error reading linked file ${linkedFile.path}:`, err);
            return "";
          }
        })
      );

      const linkContentsString = linkContents
        .filter(content => content.length > 0)
        .join("\n\n");

      // Format the instruction for merging transcripts
      const formattingInstruction = `
      You're enhancer of meeting note you have access to the following context:

      Transcript
        ${transcriptions}
        
        Extra context from linked notes (only use this if it is relevant to the meeting):
        ${linkContentsString}
        
        Provide an updated version of these meeting notes in a cohesive style.

        Output directly in the note, without any additional text.
        Do not use backquotes or any other formatting. Just raw markdown.
      `;
      const fileContent = await plugin.app.vault.read(file);

      // Stream the formatted content into the current note line by line
      await plugin.streamFormatInCurrentNoteLineByLine({
        file,
        formattingInstruction,
        content: fileContent,
        chunkMode: "line", // Use line-by-line mode for more granular updates
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

  const getCurrentTimeOptionLabel = () => {
    const option = timeOptions.find(opt => opt.value === minutes);
    return option ? option.label : `Last ${minutes} minutes`;
  };

  return (
    <div className="">
      <div className="bg-background rounded-lg p-6 border border-border">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Enhance Meeting Note</h3>
            {error && (
              <Badge variant="destructive" className="text-xs">
                {error}
              </Badge>
            )}
          </div>

          {loading ? (
            <SkeletonLoader count={1} rows={4} width="100%" />
          ) : error && !isScreenpipeAvailable ? (
            <div className="space-y-4">
              <p className="text-sm">To use this feature, you need to:</p>
              <ol className="list-decimal ml-4 text-sm space-y-2">
                <li>
                  Visit{" "}
                  <a
                    href="https://screenpi.pe"
                    className="text-accent hover:underline"
                  >
                    screenpi.pe
                  </a>
                </li>
                <li>Download and install Screenpipe</li>
                <li>Start the Screenpipe application</li>
              </ol>
              <Button onClick={checkScreenpipeHealth} className="mt-4">
                Check Again
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className="flex items-center space-x-2 hover:text-black"
                >
                  <Clock className="h-4 w-4" />
                  <span>{getCurrentTimeOptionLabel()}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                {isTimeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 py-1 bg-background border border-border rounded-lg shadow-lg z-10">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={cn(
                          "w-full px-4 py-2 text-left hover:bg-muted",
                          minutes === option.value ? "bg-muted" : ""
                        )}
                        onClick={() => {
                          setMinutes(option.value);
                          setIsTimeDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={enhanceMeetingNotes}
                disabled={!isScreenpipeAvailable}
                className="flex-1"
              >
                Enhance Notes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
