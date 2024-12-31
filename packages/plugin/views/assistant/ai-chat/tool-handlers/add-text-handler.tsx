import React, { useRef, useState } from "react";
import { App } from "obsidian";
import { addTextToDocument } from "../../../../handlers/commandHandlers";
import { logger } from "../../../../services/logger";

interface AddTextHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  app: App;
}

export function AddTextHandler({
  toolInvocation,
  handleAddResult,
  app,
}: AddTextHandlerProps) {
  const hasFetchedRef = useRef(false);
  const [addSuccess, setAddSuccess] = useState<boolean | null>(null);

  React.useEffect(() => {
    const handleAddText = async () => {
      if (!hasFetchedRef.current && !("result" in toolInvocation)) {
        hasFetchedRef.current = true;
        const { content, path } = toolInvocation.args;
        try {
          await addTextToDocument(app, content, path);
          handleAddResult(`Successfully added text to document${path ? `: ${path}` : ""}`);
          setAddSuccess(true);
        } catch (error) {
          logger.error("Error adding text to document:", error);
          handleAddResult(`Error: ${error.message}`);
          setAddSuccess(false);
        }
      }
    };

    handleAddText();
  }, [toolInvocation, handleAddResult, app]);

  if (addSuccess === null) {
    return <div className="text-sm text-[--text-muted]">Adding text to document...</div>;
  }

  if (addSuccess) {
    return <div className="text-sm text-[--text-muted]">Text successfully added to document</div>;
  }

  return <div className="text-sm text-[--text-error]">Failed to add text to document</div>;
} 