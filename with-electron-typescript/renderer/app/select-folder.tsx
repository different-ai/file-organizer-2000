"use client";

// renderer/app/select-folder.tsx
import React, { useState, useEffect } from "react";
import { FileMetadata } from "../../electron-src/preload";

function SelectFolder() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [destinationFolder, setDestinationFolder] = useState("");
  const [proposedChanges, setProposedChanges] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.electron.onFolderSelected((event, folderPath) => {
      setSelectedFolder(folderPath);
    });

    window.electron.onDestinationFolderSelected((event, folderPath) => {
      setDestinationFolder(folderPath);
    });

    return () => {
      window.electron.stopOnFolderSelected();
      window.electron.stopOnDestinationFolderSelected();
    };
  }, []);

  const handleSelectFolder = () => {
    if (!isLoading) {
      window.electron.selectFolder();
    }
  };

  const handleSelectDestinationFolder = () => {
    if (!isLoading) {
      window.electron.selectDestinationFolder();
    }
  };

  const handleProcessFiles = () => {
    if (!isLoading) {
      window.electron.processFiles(selectedFolder, destinationFolder);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mt-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectFolder}
            className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
          >
            Select Source Folder
          </button>
          {selectedFolder && (
            <p className="text-gray-500 dark:text-gray-400">
              Selected Folder: {selectedFolder}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectDestinationFolder}
            className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
          >
            Select Destination Folder
          </button>
          {destinationFolder && (
            <p className="text-gray-500 dark:text-gray-400">
              Destination Folder: {destinationFolder}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleProcessFiles}
          disabled={!selectedFolder || !destinationFolder}
          className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
        >
          Process Files
        </button>
      </div>
    </div>
  );
}

export default SelectFolder;
