import React, { useRef } from "react";
import { usePlugin } from "../../organizer/provider";
import { getDailyInformation } from "./screenpipe-utils";
import { logger } from "../../../services/logger";
import { addScreenpipeContext, useContextItems } from "../use-context-items";
import { ToolHandlerProps } from "./types";

interface ScreenpipeArgs {
  date?: string;
}

interface ScreenpipeResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function ScreenpipeHandler({
  toolInvocation,
  handleAddResult,
}: ToolHandlerProps) {
  const plugin = usePlugin();
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);
  const screenpipeData = useContextItems(state => state.screenpipe);

  React.useEffect(() => {
    const handleScreenpipeQuery = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        try {
          const { date = new Date().toISOString().split("T")[0] } = 
            toolInvocation.args as ScreenpipeArgs;
            
          const dailyInfo = await getDailyInformation(date, plugin);
          
          // Clear existing context before adding new data
          clearAll();
          
          // Add to context with proper typing
          addScreenpipeContext(dailyInfo);
          
          const result: ScreenpipeResult = {
            success: true,
            data: dailyInfo
          };
          
          handleAddResult(JSON.stringify(result));
        } catch (error) {
          logger.error("Error querying Screenpipe:", error);
          const errorResult: ScreenpipeResult = {
            success: false,
            error: error.message
          };
          handleAddResult(JSON.stringify(errorResult));
        }
      }
    };

    handleScreenpipeQuery();
  }, [toolInvocation, handleAddResult, plugin, clearAll]);

  // Use specific screenpipe data instead of generic items
  const hasData = Object.keys(screenpipeData).length > 0;

  return (
    <div className="text-sm">
      {!("result" in toolInvocation) ? (
        <div className="text-[--text-muted]">Fetching Screenpipe data...</div>
      ) : hasData ? (
        <div className="text-[--text-muted]">
          Screenpipe data successfully retrieved
          <div className="text-xs mt-1 opacity-75">
            {Object.keys(screenpipeData).length} items loaded
          </div>
        </div>
      ) : (
        <div className="text-[--text-error]">Failed to fetch Screenpipe data</div>
      )}
    </div>
  );
} 