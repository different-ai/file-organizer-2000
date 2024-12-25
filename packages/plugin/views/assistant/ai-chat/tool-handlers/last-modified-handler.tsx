import React, { useRef } from "react";
import { App } from "obsidian";
import { logger } from "../../../../services/logger";
import { addFileContext, useContextItems } from "../use-context-items";
import { ToolHandlerProps } from "./types";

interface LastModifiedArgs {
  count: number;
}

interface FileResult {
  title: string;
  content: string;
  path: string;
  reference: string;
}

export function LastModifiedHandler({
  toolInvocation,
  handleAddResult,
  app,
}: ToolHandlerProps) {
  const hasFetchedRef = useRef(false);
  const clearAll = useContextItems(state => state.clearAll);
  const files = useContextItems(state => state.files);

  const getLastModifiedFiles = async (count: number): Promise<FileResult[]> => {
    const files = app.vault.getMarkdownFiles();
    const sortedFiles = files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    const lastModifiedFiles = sortedFiles.slice(0, count);

    return Promise.all(
      lastModifiedFiles.map(async file => ({
        title: file.basename,
        content: await app.vault.read(file),
        path: file.path,
        reference: `Last modified: ${new Date(file.stat.mtime).toLocaleString()}`
      }))
    );
  };

  React.useEffect(() => {
    const handleLastModifiedSearch = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { count } = toolInvocation.args as LastModifiedArgs;
        
        try {
          const searchResults = await getLastModifiedFiles(count);
          
          // Clear existing context before adding new results
          clearAll();
          
          // Add each file to context with proper typing
          searchResults.forEach(file => {
            addFileContext({
              path: file.path,
              title: file.title,
              content: file.content,
            });
          });
          
          handleAddResult(JSON.stringify({
            success: true,
            files: searchResults,
            count: searchResults.length
          }));
        } catch (error) {
          logger.error("Error getting last modified files:", error);
          handleAddResult(JSON.stringify({ 
            success: false,
            error: error.message 
          }));
        }
      }
    };

    handleLastModifiedSearch();
  }, [toolInvocation, handleAddResult, app, clearAll]);

  // Use the files object directly from context instead of items
  const fileCount = Object.keys(files).length;

  return (
    <div className="text-sm text-[--text-muted]">
      {!("result" in toolInvocation) ? (
        "Fetching last modified files..."
      ) : fileCount > 0 ? (
        `Found ${fileCount} recently modified files`
      ) : (
        "No recently modified files found"
      )}
    </div>
  );
} 