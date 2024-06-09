"use client";
import React, { useEffect, useState } from "react";
import { FileMetadata } from "../../types";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";

function SelectFolder() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [proposedChanges, setProposedChanges] = useState<FileMetadata[]>([]);

  useEffect(() => {
    const handleFolderSelected = (event: Electron.IpcRendererEvent, folderPath: string) => {
      setSelectedFolder(folderPath);
    };

    const handleProposedChanges = (event: Electron.IpcRendererEvent, changes: FileMetadata[]) => {
      setProposedChanges(changes);
    };

    window.electron.onFolderSelected(handleFolderSelected);
    window.electron.onProposedChanges(handleProposedChanges);

    return () => {
      window.electron.stopOnFolderSelected(handleFolderSelected);
    };
  }, []);

  const handleSelectFolder = () => {
    window.electron.selectFolder();
  };

  const handleValidateChange = (change: FileMetadata) => {
    window.electron.validateChange(change);
  };

  const handleApplyChanges = () => {
    window.electron.applyChanges();
  };

  const handleUndo = () => {
    window.electron.undo();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">File Changes Preview</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Review the proposed changes to your files before committing.
          </p>
          <div className="flex justify-between items-center mt-4 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectFolder}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              >
                Select Folder
              </button>
              {selectedFolder && <p className="text-gray-500 dark:text-gray-400">Selected Folder: {selectedFolder}</p>}
            </div>
            <Button onClick={handleApplyChanges}>Apply All Changes</Button>
          </div>
        </div>
        <div className="grid gap-4">
          {proposedChanges.map((change, index) => (
            <Card key={`${change.previousFolder}/${change.previousName}`}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <FileIcon className="w-8 h-8" />
                  <div className="grid gap-1">
                    <CardTitle>{change.previousName} → {change.newName}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Previous location:</span>
                        <span>{change.previousFolder}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">New location:</span>
                        <span>{change.newFolder}</span>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => handleValidateChange(change)}>Apply Changes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function FileIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export default SelectFolder;
