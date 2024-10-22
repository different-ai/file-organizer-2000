import React from "react";
import { motion } from "framer-motion";
import { getYouTubeTranscript, getYouTubeVideoTitle } from "./youtube-transcript";

interface ToolInvocationHandlerProps {
  toolInvocation: any; // Replace 'any' with a more specific type if available
  addToolResult: (result: { toolCallId: string; result: string }) => void;
  results: any; // Add results prop to handle when no search results are found
  onYoutubeTranscript: (transcript: string, title: string, videoId: string) => void;
}

function ToolInvocationHandler({ toolInvocation, addToolResult, results, onYoutubeTranscript, append }: ToolInvocationHandlerProps) {
  const toolCallId = toolInvocation.toolCallId;
  const handleAddResult = (result: string) => addToolResult({ toolCallId, result });

  const getToolTitle = (toolName: string) => {
    switch (toolName) {
      case "getNotesForDateRange": return "Fetching Notes";
      case "searchNotes": return "Searching Notes";
      case "askForConfirmation": return "Confirmation Required";
      case "getYoutubeVideoId": return "YouTube Transcript";
      case "modifyCurrentNote": return "Note Modification";
      case "getLastModifiedFiles": return "Recent File Activity";
      case "queryScreenpipe": return "Querying Screenpipe Data";
      case "analyzeProductivity": return "Analyzing Productivity";
      case "summarizeMeeting": return "Summarizing Meeting";
      case "trackProjectTime": return "Tracking Project Time";
      default: return "Tool Invocation";
    }
  };

  const handleYouTubeTranscript = async () => {
    const { videoId } = toolInvocation.args;
    try {
      const transcript = await getYouTubeTranscript(videoId);
      const title = await getYouTubeVideoTitle(videoId);
      console.log("transcript", transcript);
      onYoutubeTranscript(transcript, title, videoId);
      handleAddResult(JSON.stringify({ transcript, title, videoId }));
      return { transcript, title, videoId };
    } catch (error) {
      console.error("Error fetching YouTube transcript:", error);
      handleAddResult(JSON.stringify({ error: error.message }));
      return { error: error.message };
    }
  };

  // TODO: Add a loading state for the tool invocation
  // show no files found if searchNotes and no results
  const renderContent = () => {
    if (toolInvocation.toolName === "searchNotes" && (!results || results.length === 0)) {
      return (
        <div className="text-sm text-[--text-muted]">
          <p>No files matching that criteria were found</p>
        </div>
      );
    }

    switch (toolInvocation.toolName) {
      case "getNotesForDateRange":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? `All notes modified within the following time period were added to the AI context: ${toolInvocation.result}`
              : "Retrieving your notes for the specified time period..."}
          </div>
        );

      case "searchNotes":
        return (
          <div className="text-sm text-[--text-muted]">
            {"result" in toolInvocation
              ? `Notes that containted ${toolInvocation.result} were added to the AI context`
              : "Scouring your notes for relevant information..."}
          </div>
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

      case "getYoutubeVideoId":
        if (!("result" in toolInvocation)) {
          console.log("Starting YouTube transcript fetch...");
          console.log("Tool invocation:", toolInvocation);
          handleYouTubeTranscript()
            .then((response) => {
              console.log("YouTube transcript fetch response:", response);
            })
            .catch((error) => {
              console.error("Error in handleYouTubeTranscript:", error);
            });
          return <div className="text-sm text-[--text-muted]">Fetching the video transcript...</div>;
        }
        console.log("YouTube transcript result received:", toolInvocation.result);
        let result;
        try {
          result = toolInvocation.result;
          console.log("Parsed result:", result);
        } catch (error) {
          console.error("Error parsing toolInvocation.result:", error);
          return <div className="text-sm text-[--text-muted]">Error parsing the transcript result</div>;
        }
        return (
          <div className="text-sm text-[--text-muted]">
            {result.error
              ? `Oops! Couldn't fetch the transcript: ${result.error}`
              : "YouTube transcript successfully retrieved"}
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
        if ("result" in toolInvocation) {
          const count = toolInvocation.result;
          
          if (count) {
            return (
              <div className="text-sm text-[--text-muted]">
                You've modified {count} file{count > 1 ? 's' : ''} recently
              </div>
            );
          }

          return (
            <div className="text-sm text-[--text-muted]">
              Hmm, I couldn't determine your recent file activity
            </div>
          );
        } else {
          return <div className="text-sm text-[--text-muted]">Checking your recent file activity...</div>;
        }

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
      className="bg-[--background-secondary] rounded-lg p-3 my-2 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="m-0 mb-2 text-[--text-normal] text-sm font-semibold">
        {getToolTitle(toolInvocation.toolName)}
      </h4>
      <div className="text-sm text-[--text-muted]">
        {renderContent()}
      </div>
    </motion.div>
  );
}

export default ToolInvocationHandler;
