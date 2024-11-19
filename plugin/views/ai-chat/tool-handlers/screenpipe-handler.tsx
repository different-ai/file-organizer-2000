import React, { useRef } from "react";
import { usePlugin } from "../../organizer/provider";
import { getDailyInformation } from "./screenpipe-utils";
import { logger } from "../../../services/logger";
import { addScreenpipeContext, useContextItems } from "../use-context-items";

interface ScreenpipeHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
}

export function ScreenpipeHandler({
  toolInvocation,
  handleAddResult,
}: ScreenpipeHandlerProps) {
  const plugin = usePlugin();
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);

  React.useEffect(() => {
    const handleScreenpipeQuery = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        try {
          const today = new Date().toISOString().split("T")[0];
          const dailyInfo = await getDailyInformation(today, plugin);
          
          clearAll();
          addScreenpipeContext(dailyInfo);
          
          handleAddResult(JSON.stringify(dailyInfo));
        } catch (error) {
          logger.error("Error querying Screenpipe:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleScreenpipeQuery();
  }, [toolInvocation, handleAddResult, plugin, clearAll]);

  const contextItems = useContextItems(state => state.items);

  if (!("result" in toolInvocation)) {
    return <div className="text-sm text-[--text-muted]">Fetching Screenpipe data...</div>;
  }

  if (contextItems.length > 0) {
    return <div className="text-sm text-[--text-muted]">Screenpipe data successfully retrieved</div>;
  }

  return <div className="text-sm text-[--text-error]">Failed to fetch Screenpipe data</div>;
} 