import React, { useRef } from "react";
import { moment } from "obsidian";
import { logger } from "../../../../services/logger";
import { addFileContext, useContextItems } from "../use-context-items";
import { ToolHandlerProps } from "./types";

interface DateRangeArgs {
  startDate: string;
  endDate: string;
}

export function DateRangeHandler({
  toolInvocation,
  handleAddResult,
  app,
}: ToolHandlerProps) {
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);

  const filterNotesByDateRange = async (startDate: string, endDate: string) => {
    const files = app.vault.getMarkdownFiles();
    const start = moment(startDate).startOf("day");
    const end = moment(endDate).endOf("day");

    const filteredFiles = files.filter(file => {
      const fileDate = moment(file.stat.mtime);
      const isWithinDateRange = fileDate.isBetween(start, end, null, "[]");
      const isSystemFolder = file.path.startsWith(".") || 
                           file.path.includes("templates/") || 
                           file.path.includes("backup/");
      return isWithinDateRange && !isSystemFolder;
    });

    return Promise.all(
      filteredFiles.map(async file => ({
        title: file.basename,
        content: await app.vault.read(file),
        path: file.path,
        reference: `Date range: ${startDate} to ${endDate}`,
      }))
    );
  };

  React.useEffect(() => {
    const handleDateRangeSearch = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { startDate, endDate } = toolInvocation.args as DateRangeArgs;
        
        try {
          const searchResults = await filterNotesByDateRange(startDate, endDate);
          
          // Clear existing context before adding new results
          clearAll();
          
          // Add each file to context
          searchResults.forEach(file => {
            addFileContext({
              path: file.path,
              title: file.title,
              content: file.content,
            });
          });
          
          handleAddResult(JSON.stringify(searchResults));
        } catch (error) {
          logger.error("Error filtering notes by date:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleDateRangeSearch();
  }, [toolInvocation, handleAddResult, app, clearAll]);

  const contextItems = useContextItems(state => state.items);

  return (
    <div className="text-sm text-[--text-muted]">
      {!("result" in toolInvocation) 
        ? "Filtering notes by date range..."
        : contextItems.length > 0
        ? `Found ${contextItems.length} notes within the specified date range`
        : "No files found within the specified date range"}
    </div>
  );
} 