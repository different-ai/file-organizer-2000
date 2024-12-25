import React, { useRef } from "react";
import { logger } from "../../../../services/logger";
import { addSearchContext, useContextItems } from "../use-context-items";
import { ToolHandlerProps } from "./types";

interface SearchArgs {
  query: string;
}

export function SearchHandler({
  toolInvocation,
  handleAddResult,
  app,
}: ToolHandlerProps) {
  const hasFetchedRef = useRef(false);

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
            path: file.path,
          };
        }
        return null;
      })
    );

    return searchResults.filter((result): result is NonNullable<typeof result> => 
      result !== null
    );
  };

  React.useEffect(() => {
    const handleSearchNotes = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { query } = toolInvocation.args as SearchArgs;
        
        try {
          const searchResults = await searchNotes(query);
          
          // Add search results to context
          addSearchContext(query, searchResults);
          
          handleAddResult(JSON.stringify(searchResults));
        } catch (error) {
          logger.error("Error searching notes:", error);
          handleAddResult(JSON.stringify({ error: error.message }));
        }
      }
    };

    handleSearchNotes();
  }, [toolInvocation, handleAddResult, app]);

  const searchResults = useContextItems(state => state.searchResults);

  return (
    <div className="text-sm text-[--text-muted]">
      {!("result" in toolInvocation)
        ? "Searching through your notes..."
        : Object.keys(searchResults).length > 0
        ? `Found ${Object.keys(searchResults).length} matching notes`
        : "No files matching that criteria were found"}
    </div>
  );
}
