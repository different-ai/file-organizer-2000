import React, { useRef } from "react";
import { App } from "obsidian";
import { moment } from "obsidian";
import { logger } from "../../../services/logger";
import { addFileContext, useContextItems } from "../use-context-items";

interface DateRangeHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  app: App;
}

export function DateRangeHandler({
  toolInvocation,
  handleAddResult,
  app,
}: DateRangeHandlerProps) {
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);

  const filterNotesByDateRange = async (startDate: string, endDate: string) => {
    const files = app.vault.getMarkdownFiles();
    const start = moment(startDate).startOf("day");
    const end = moment(endDate).endOf("day");

    const filteredFiles = files.filter(file => {
      const fileDate = moment(file.stat.mtime);
      const isWithinDateRange = fileDate.isBetween(start, end, null, "[]");

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
          
          // Clear existing context and add new results
          clearAll();
          searchResults.forEach(file => {
            addFileContext({
              path: file.path,
              title: file.title,
              content: file.content
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

  if (!("result" in toolInvocation)) {
    return <div className="text-sm text-[--text-muted]">Filtering notes by date range...</div>;
  }

  if (contextItems.length > 0) {
    return <div className="text-sm text-[--text-muted]">Found {contextItems.length} notes within the specified date range</div>;
  }

  return <div className="text-sm text-[--text-muted]">No files found within the specified date range</div>;
} 