import React from "react";  
import { getYouTubeTranscript, getYouTubeVideoTitle } from "../youtube-transcript";
import { logMessage } from "../../../../utils";
import { ToolInvocation } from "ai";

interface YouTubeHandlerProps {
  toolInvocation: ToolInvocation;
  handleAddResult: (result: any) => void;
  onYoutubeTranscript: (transcript: string, title: string, videoId: string) => void;
}

export function YouTubeHandler({
  toolInvocation,
  handleAddResult,
  onYoutubeTranscript,
}: YouTubeHandlerProps) {
  // Add a ref to track if we've attempted the fetch
  const hasFetchedRef = React.useRef(false);

  React.useEffect(() => {
    const fetchTranscript = async () => {
      // Only fetch if we haven't tried yet and don't have a result
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { videoId } = toolInvocation.args;
        logMessage('toolInvocation', toolInvocation);
        
        try {
          const transcript = await getYouTubeTranscript(videoId);
          const title = await getYouTubeVideoTitle(videoId);
          const result = { transcript, title, videoId };
          logMessage('result', result);
          
          handleAddResult({ 
            toolCallId: toolInvocation.toolCallId,
            result
          });
          onYoutubeTranscript(transcript, title, videoId);
        } catch (error) {
          console.error("Error fetching YouTube transcript:", error);
          handleAddResult({ 
            toolCallId: toolInvocation.toolCallId,
            result: { error: error.message }
          });
        }
      }
    };

    fetchTranscript();
  }, [toolInvocation, handleAddResult, onYoutubeTranscript]);

  // Simple status display
  return (
    <div className="text-sm text-[--text-muted]">
      {!("result" in toolInvocation) 
        ? "Fetching the video transcript..." 
        : "YouTube transcript successfully retrieved"}
    </div>
  );
}
