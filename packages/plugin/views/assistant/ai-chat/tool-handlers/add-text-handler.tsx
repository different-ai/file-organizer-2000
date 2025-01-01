import React, { useRef, useState } from "react";
import { App, TFile } from "obsidian";
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
          let targetFile: TFile;
          
          if (path) {
            targetFile = app.vault.getAbstractFileByPath(path) as TFile;
            if (!targetFile) {
              throw new Error(`File not found at path: ${path}`);
            }
          } else {
            // Get the active file
            targetFile = app.workspace.getActiveFile();
            if (!targetFile) {
              throw new Error("No active file found");
            }
          }

          // Get current content
          const currentContent = await app.vault.read(targetFile);
          
          // Get editor if it exists
          const editor = app.workspace.activeEditor?.editor;
          
          if (editor) {
            // If we have an editor, insert at cursor position
            const cursor = editor.getCursor();
            editor.replaceRange(content, cursor);
          } else {
            // Otherwise append to the end
            await app.vault.modify(targetFile, currentContent + "\n" + content);
          }
          
          logger.info(`Successfully added text to document: ${targetFile.path}`);
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