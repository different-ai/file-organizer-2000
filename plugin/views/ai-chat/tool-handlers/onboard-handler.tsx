import React, { useState } from "react";
import { TFolder } from "obsidian";
import { ToolHandlerProps } from "./types";

interface FolderStructure {
  name: string;
  type: "folder";
  children: (FolderStructure | FileStructure)[];
  depth: number;
}

interface FileStructure {
  name: string;
  type: "file";
  depth: number;
}

export function OnboardHandler({
  toolInvocation,
  handleAddResult,
  app,
}: ToolHandlerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const analyzeFolderStructure = (
    folder: TFolder,
    depth = 0,
    maxDepth = 3
  ): FolderStructure => {
    if (depth >= maxDepth) return null;

    const structure: FolderStructure = {
      name: folder.name,
      type: "folder",
      children: [],
      depth,
    };

    // Get immediate children
    folder.children.forEach((child) => {
      if (child instanceof TFolder) {
        const subStructure = analyzeFolderStructure(child, depth + 1, maxDepth);
        if (subStructure) {
          structure.children.push(subStructure);
        }
      } else {
        structure.children.push({
          name: child.name,
          type: "file",
          depth: depth + 1,
        });
      }
    });

    return structure;
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const rootFolder = app.vault.getRoot();
      const structure = analyzeFolderStructure(rootFolder);
      
      // Filter out system folders and files
      const filteredStructure = {
        ...structure,
        children: structure.children.filter(
          (child) => !child.name.startsWith(".")
        ),
      };

      setIsValidated(true);
      handleAddResult(
        JSON.stringify({
          success: true,
          structure: filteredStructure,
          message: "Vault structure analyzed successfully",
        })
      );
    } catch (error) {
      handleAddResult(
        JSON.stringify({
          success: false,
          error: error.message,
        })
      );
    }
    setIsAnalyzing(false);
  };

  const renderStructurePreview = () => (
    <div className="text-xs mt-2 text-[--text-muted]">
      This will analyze your vault structure up to 3 levels deep to suggest optimal organization.
      The analysis will:
      <ul className="list-disc ml-4 mt-1">
        <li>Scan your folder hierarchy</li>
        <li>Analyze naming patterns</li>
        <li>Identify common groupings</li>
        <li>Suggest organizational improvements</li>
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 p-4 border border-[--background-modifier-border] rounded-md">
      <div className="text-[--text-normal]">
        Would you like to analyze your vault structure for better organization?
      </div>

      {renderStructurePreview()}

      {!isValidated && !("result" in toolInvocation) && (
        <div className="flex space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={
              "px-4 py-2 bg-[--background-modifier-accent] text-[--text-normal] rounded-md" +
              (isAnalyzing ? " cursor-not-allowed" : "")
            }
          >
            {isAnalyzing ? (
              <svg
                className="animate-spin h-4 w-4 text-[--text-normal]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3.148 7.935l3.801-3.041z"
                ></path>
              </svg>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      )}
    </div>
  );
} 