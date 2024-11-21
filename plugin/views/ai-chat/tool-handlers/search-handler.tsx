import React, { useRef } from "react";
import { App } from "obsidian";
import { logger } from "../../../services/logger";
import { addSearchContext, useContextItems } from "../use-context-items";

interface SearchHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  app: App;
}

export function SearchHandler({
  toolInvocation,
  handleAddResult,
  app,
}: SearchHandlerProps) {
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
            reference: `Search query: ${query}`,
            path: file.path,
          };
        }
        return null;
      })
    );

    return searchResults.filter(result => result !== null);
  };

  React.useEffect(() => {
    const handleSearchNotes = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { query } = toolInvocation.args;
        try {
          const searchResults = await searchNotes(query);

          // Clear existing context and add new search results
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

  if (!("result" in toolInvocation)) {
    return (
      <div className="text-sm text-[--text-muted]">
        Searching through your notes...
      </div>
    );
  }

  if (Object.keys(searchResults).length > 0) {
    return (
      <div className="text-sm text-[--text-muted]">
        Found {Object.keys(searchResults).length} matching notes
      </div>
    );
  }

  return (
    <div className="text-sm text-[--text-muted]">
      No files matching that criteria were found
    </div>
  );
}
