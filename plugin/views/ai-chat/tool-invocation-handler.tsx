import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  getYouTubeTranscript,
  getYouTubeVideoTitle,
} from "./youtube-transcript";
import { App } from "obsidian";
import { moment } from "obsidian";

interface ToolInvocationHandlerProps {
  toolInvocation: any; // Replace 'any' with a more specific type if available
  addToolResult: (result: { toolCallId: string; result: string }) => void;
  results: any; // Add results prop to handle when no search results are found
  onYoutubeTranscript: (
    transcript: string,
    title: string,
    videoId: string
  ) => void;
  onSearchResults: (
    results: {
      title: string;
      content: string;
      reference: string;
      path: string;
    }[]
  ) => void;
  onDateRangeResults: (results: any[]) => void;
  onLastModifiedResults: (results: any[]) => void; // Add this
  app: App;
}

// New YouTube Handler Component
function YouTubeHandler({
  toolInvocation,
  handleAddResult,
  onYoutubeTranscript,
}: {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  onYoutubeTranscript: (
    transcript: string,
    title: string,
    videoId: string
  ) => void;
}) {
  const handleYouTubeTranscript = async () => {
    const { videoId } = toolInvocation.args;
    try {
      const transcript = await getYouTubeTranscript(videoId);
      const title = await getYouTubeVideoTitle(videoId);
      handleAddResult(JSON.stringify({ transcript, title, videoId }));
      return { transcript, title, videoId };
    } catch (error) {
      console.error("Error fetching YouTube transcript:", error);
      handleAddResult(JSON.stringify({ error: error.message }));
      return { error: error.message };
    }
  };

  if (!("result" in toolInvocation)) {
    handleYouTubeTranscript();
    return (
      <div className="text-sm text-[--text-muted]">
        Fetching the video transcript...
      </div>
    );
  }

  let result;
  try {
    result = toolInvocation.result;
  } catch (error) {
    return (
      <div className="text-sm text-[--text-muted]">
        Error parsing the transcript result
      </div>
    );
  }

  return (
    <div className="text-sm text-[--text-muted]">
      {result.error
        ? `Oops! Couldn't fetch the transcript: ${result.error}`
        : "YouTube transcript successfully retrieved"}
    </div>
  );
}

// New Search Handler Component
function SearchHandler({
  toolInvocation,
  handleAddResult,
  onSearchResults,
  app,
}: {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  onSearchResults: (results: any[]) => void;
  app: App;
}) {
  const [results, setResults] = useState<any[]>([]);
  const hasFetchedRef = React.useRef(false);

  const searchNotes = async (query: string) => {
    const files = app.vault.getMarkdownFiles();
    const searchTerms = query.toLowerCase().split(/\s+/);

    const searchResults = await Promise.all(
      files.map(async file => {
        const content = await app.vault.read(file);
        const lowerContent = content.toLowerCase();

        const allTermsPresent = searchTerms.every(term => {
          const regex = new RegExp(`(^|\\W)${term}(\\W|$)`, "i");
          return regex.test(lowerContent);
        });

        if (allTermsPresent) {
          return {
            title: file.basename,
            content: content,
            reference: `Search query: ${query}`,
            path: file.path,
          };
        }
        return null;
      })
    );

    return searchResults.filter(result => result !== null);
  };

  React.useEffect(() => {
    const handleSearchNotes = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { query } = toolInvocation.args;
        try {
          const searchResults = await searchNotes(query);
          setResults(searchResults);
          onSearchResults(searchResults);
          handleAddResult(JSON.stringify(searchResults));
        } catch (error) {
          console.error("Error searching notes:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleSearchNotes();
  }, [toolInvocation, handleAddResult, onSearchResults, app]);

  if (!("result" in toolInvocation)) {
    return (
      <div className="text-sm text-[--text-muted]">
        Searching through your notes...
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <div className="text-sm text-[--text-muted]">
        Found {results.length} matching notes
      </div>
    );
  }

  return (
    <div className="text-sm text-[--text-muted]">
      No files matching that criteria were found
    </div>
  );
}

// New DateRange Handler Component
function DateRangeHandler({
  toolInvocation,
  handleAddResult,
  onDateRangeResults,
  app,
}: {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  onDateRangeResults: (results: any[]) => void;
  app: App;
}) {
  const [results, setResults] = useState<any[]>([]);
  const hasFetchedRef = React.useRef(false);

  const filterNotesByDateRange = async (startDate: string, endDate: string) => {
    const files = app.vault.getMarkdownFiles();
    const start = moment(startDate).startOf("day");
    const end = moment(endDate).endOf("day");

    const filteredFiles = files.filter(file => {
      const fileDate = moment(file.stat.mtime);
      const isWithinDateRange = fileDate.isBetween(start, end, null, "[]");

      // Filter out system folders (you might want to adjust these based on your needs)
      const isSystemFolder =
        file.path.startsWith(".") ||
        file.path.includes("templates/") ||
        file.path.includes("backup/");

      return isWithinDateRange && !isSystemFolder;
    });

    const fileContents = await Promise.all(
      filteredFiles.map(async file => ({
        title: file.basename,
        content: await app.vault.read(file),
        path: file.path,
        reference: `Date range: ${startDate} to ${endDate}`,
      }))
    );

    return fileContents;
  };

  React.useEffect(() => {
    const handleDateRangeSearch = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { startDate, endDate } = toolInvocation.args;
        try {
          const searchResults = await filterNotesByDateRange(startDate, endDate);
          setResults(searchResults);
          onDateRangeResults(searchResults);
          handleAddResult(JSON.stringify(searchResults));
        } catch (error) {
          console.error("Error filtering notes by date:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleDateRangeSearch();
  }, [toolInvocation, handleAddResult, onDateRangeResults, app]);

  if (!("result" in toolInvocation)) {
    return (
      <div className="text-sm text-[--text-muted]">
        Filtering notes by date range...
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <div className="text-sm text-[--text-muted]">
        Found {results.length} notes within the specified date range
      </div>
    );
  }

  return (
    <div className="text-sm text-[--text-muted]">
      No files found within the specified date range
    </div>
  );
}

// New LastModified Handler Component
function LastModifiedHandler({
  toolInvocation,
  handleAddResult,
  onLastModifiedResults,
  app,
}: {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  onLastModifiedResults: (results: any[]) => void;
  app: App;
}) {
  const [results, setResults] = useState<any[]>([]);
  const hasFetchedRef = React.useRef(false);

  const getLastModifiedFiles = async (count: number) => {
    const files = app.vault.getMarkdownFiles();
    const sortedFiles = files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    const lastModifiedFiles = sortedFiles.slice(0, count);

    const fileContents = await Promise.all(
      lastModifiedFiles.map(async file => ({
        title: file.basename,
        content: await app.vault.read(file),
        path: file.path,
      }))
    );

    return fileContents; // Make sure to stringify the result
  };

  React.useEffect(() => {
    const handleLastModifiedSearch = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { count } = toolInvocation.args;
        try {
          const searchResults = await getLastModifiedFiles(count);
          setResults(searchResults);
          onLastModifiedResults(searchResults);
          handleAddResult(JSON.stringify(searchResults));
        } catch (error) {
          console.error("Error getting last modified files:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleLastModifiedSearch();
  }, [toolInvocation, handleAddResult, onLastModifiedResults, app]);

  if (!("result" in toolInvocation)) {
    return (
      <div className="text-sm text-[--text-muted]">
        Fetching last modified files...
      </div>
    );
  }

  if (results && results.length > 0) {
    return (
      <div className="text-sm text-[--text-muted]">
        Found {results.length} recently modified files
      </div>
    );
  }

  return (
    <div className="text-sm text-[--text-muted]">
      No recently modified files found
    </div>
  );
}

// Main ToolInvocationHandler component
function ToolInvocationHandler({
  toolInvocation,
  addToolResult,
  results,
  onYoutubeTranscript,
  onSearchResults,
  onDateRangeResults,
  onLastModifiedResults,
  app,
}: ToolInvocationHandlerProps) {
  const toolCallId = toolInvocation.toolCallId;
  const handleAddResult = (result: string) =>
    addToolResult({ toolCallId, result });

  const getToolTitle = (toolName: string) => {
    switch (toolName) {
      case "getNotesForDateRange":
        return "Fetching Notes";
      case "getSearchQuery":
        return "Searching Notes";
      case "askForConfirmation":
        return "Confirmation Required";
      case "getYoutubeVideoId":
        return "YouTube Transcript";
      case "modifyCurrentNote":
        return "Note Modification";
      case "getLastModifiedFiles":
        return "Recent File Activity";
      case "queryScreenpipe":
        return "Querying Screenpipe Data";
      case "analyzeProductivity":
        return "Analyzing Productivity";
      case "summarizeMeeting":
        return "Summarizing Meeting";
      case "trackProjectTime":
        return "Tracking Project Time";
      default:
        return "Tool Invocation";
    }
  };

  const renderContent = () => {
    switch (toolInvocation.toolName) {
      case "getSearchQuery":
        return (
          <SearchHandler
            toolInvocation={toolInvocation}
            handleAddResult={handleAddResult}
            onSearchResults={onSearchResults}
            app={app}
          />
        );

      case "getYoutubeVideoId":
        return (
          <YouTubeHandler
            toolInvocation={toolInvocation}
            handleAddResult={handleAddResult}
            onYoutubeTranscript={onYoutubeTranscript}
          />
        );

      case "getNotesForDateRange":
        return (
          <DateRangeHandler
            toolInvocation={toolInvocation}
            handleAddResult={handleAddResult}
            onDateRangeResults={onDateRangeResults}
            app={app}
          />
        );

      case "askForConfirmation":
        return (
          <div className="text-sm text-[--text-muted]">
            <p>{toolInvocation.args.message}</p>
            {"result" in toolInvocation ? (
              <b>{toolInvocation.result}</b>
            ) : (
              <div>
                <button className="bg-[--background-primary] text-white rounded-md px-2 py-1 hover:bg-[--background-secondary]">
                  Confirm
                </button>
                <button className="bg-[--background-primary] text-white rounded-md px-2 py-1 hover:bg-[--background-secondary]">
                  Cancel
                </button>
              </div>
            )}
          </div>
        );

      case "modifyCurrentNote":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? `Changes applied: ${toolInvocation.result}`
              : "Applying changes to your note..."}
          </div>
        );

      case "getLastModifiedFiles":
        return (
          <LastModifiedHandler
            toolInvocation={toolInvocation}
            handleAddResult={handleAddResult}
            onLastModifiedResults={onLastModifiedResults}
            app={app}
          />
        );

      case "queryScreenpipe":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? "Screenpipe data successfully queried and added to context"
              : "Querying Screenpipe data..."}
          </div>
        );

      case "analyzeProductivity":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? `Productivity analysis completed for the last ${toolInvocation.args.days} days`
              : `Analyzing productivity for the last ${toolInvocation.args.days} days...`}
          </div>
        );

      case "summarizeMeeting":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? "Meeting summary generated"
              : "Summarizing meeting audio..."}
          </div>
        );

      case "trackProjectTime":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? `Project time tracked for "${toolInvocation.args.projectKeyword}" over the last ${toolInvocation.args.days} days`
              : `Tracking time for project "${toolInvocation.args.projectKeyword}" over the last ${toolInvocation.args.days} days...`}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg p-3 my-2 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="m-0 mb-2 text-[--text-normal] text-sm font-semibold">
        {getToolTitle(toolInvocation.toolName)}
      </h4>
      <div className="text-sm text-[--text-muted]">{renderContent()}</div>
    </motion.div>
  );
}

export default ToolInvocationHandler;
