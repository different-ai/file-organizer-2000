import React, { useRef } from "react";
import { App } from "obsidian";
import { logger } from "../../../services/logger";
import { addFileContext, useContextItems } from "../use-context-items";

interface LastModifiedHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  app: App;
}

export function LastModifiedHandler({
  toolInvocation,
  handleAddResult,
  app,
}: LastModifiedHandlerProps) {
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);

  const getLastModifiedFiles = async (count: number) => {
    const files = app.vault.getMarkdownFiles();
    const sortedFiles = files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    const lastModifiedFiles = sortedFiles.slice(0, count);

    const fileContents = await Promise.all(
      lastModifiedFiles.map(async file => ({
        title: file.basename,
        content: await app.vault.read(file),
        path: file.path,
        reference: `Last modified: ${new Date(file.stat.mtime).toLocaleString()}`
      }))
    );

    return fileContents;
  };

  React.useEffect(() => {
    const handleLastModifiedSearch = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { count } = toolInvocation.args;
        try {
          const searchResults = await getLastModifiedFiles(count);
          
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
          logger.error("Error getting last modified files:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleLastModifiedSearch();
  }, [toolInvocation, handleAddResult, app, clearAll]);

  const contextItems = useContextItems(state => state.items);

  if (!("result" in toolInvocation)) {
    return <div className="text-sm text-[--text-muted]">Fetching last modified files...</div>;
  }

  if (contextItems.length > 0) {
    return <div className="text-sm text-[--text-muted]">Found {contextItems.length} recently modified files</div>;
  }

  return <div className="text-sm text-[--text-muted]">No recently modified files found</div>;
} 