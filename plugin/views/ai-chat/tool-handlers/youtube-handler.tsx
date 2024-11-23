import React, { useRef } from "react";
import { getYouTubeTranscript, getYouTubeVideoTitle } from "../youtube-transcript";
import { logger } from "../../../services/logger";
import { addYouTubeContext, useContextItems } from "../use-context-items";

interface YouTubeHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
}

export function YouTubeHandler({
  toolInvocation,
  handleAddResult,
}: YouTubeHandlerProps) {
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);

  React.useEffect(() => {
    const handleYouTubeTranscript = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { videoId } = toolInvocation.args;
        try {
          const transcript = await getYouTubeTranscript(videoId);
          const title = await getYouTubeVideoTitle(videoId);
          
          addYouTubeContext({
            videoId,
            title,
            transcript
          });
          
          handleAddResult(JSON.stringify({ transcript, title, videoId }));
        } catch (error) {
          logger.error("Error fetching YouTube transcript:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleYouTubeTranscript();
  }, [toolInvocation, handleAddResult, clearAll]);

  const contextItems = useContextItems(state => state.items);

  if (!("result" in toolInvocation)) {
    return <div className="text-sm text-[--text-muted]">Fetching the video transcript...</div>;
  }

  if (contextItems.length > 0) {
    return <div className="text-sm text-[--text-muted]">YouTube transcript successfully retrieved</div>;
  }

  return <div className="text-sm text-[--text-error]">Failed to fetch YouTube transcript</div>;
} 