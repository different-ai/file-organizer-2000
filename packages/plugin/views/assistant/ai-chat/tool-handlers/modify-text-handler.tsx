import React, { useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { logger } from "../../../../services/logger";

interface ModifyTextHandlerProps {
  toolInvocation: any;
  handleAddResult: (result: string) => void;
  app: App;
}

export function ModifyTextHandler({
  toolInvocation,
  handleAddResult,
  app,
}: ModifyTextHandlerProps) {
  const hasFetchedRef = useRef(false);
  const [modifySuccess, setModifySuccess] = useState<boolean | null>(null);

  React.useEffect(() => {
    const handleModifyText = async () => {
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
          
          // Get editor if it exists
          const editor = app.workspace.activeEditor?.editor;
          
          if (editor) {
            // If we have an editor, replace the selected text or entire content
            const selection = editor.getSelection();
            if (selection) {
              // If there's selected text, replace just that
              editor.replaceSelection(content);
            } else {
              // If no selection, replace entire content
              editor.setValue(content);
            }
          } else {
            // If no editor is open, modify the entire file
            await app.vault.modify(targetFile, content);
          }
          
          logger.info(`Successfully modified text in document: ${targetFile.path}`);
          handleAddResult(`Successfully modified text in document${path ? `: ${path}` : ""}`);
          setModifySuccess(true);
        } catch (error) {
          logger.error("Error modifying text in document:", error);
          handleAddResult(`Error: ${error.message}`);
          setModifySuccess(false);
        }
      }
    };

    handleModifyText();
  }, [toolInvocation, handleAddResult, app]);

  if (modifySuccess === null) {
    return <div className="text-sm text-[--text-muted]">Modifying text in document...</div>;
  }

  if (modifySuccess) {
    return <div className="text-sm text-[--text-muted]">Text successfully modified in document</div>;
  }

  return <div className="text-sm text-[--text-error]">Failed to modify text in document</div>;
} 