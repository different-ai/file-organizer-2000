"use client";
// ./components/FolderSelector.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "./label";
import { Input } from "./input";

export default function FolderSelector() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    const folderPath = await (window as any).electron.selectFolder();
    setSelectedFolder(folderPath);
  };

  useEffect(() => {
    if (selectedFolder) {
      (window as any).electron.watchFolder(selectedFolder);
    }
  }, [selectedFolder]);

  useEffect(() => {
    (window as any).electron.onNewFile(async (filename: string) => {
      if (selectedFolder) {
        const response = await fetch("/api/folders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "", // Add the file content if needed
            fileName: filename,
            folders: [], // Add the list of existing folders
          }),
        });

        const { folder } = await response.json();
        console.log(`Suggested folder for ${filename}: ${folder}`);
        // Handle the suggested folder, e.g., move the file to the folder
      }
    });
  }, [selectedFolder]);

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
          File Organizer 2000
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Select a folder and let our AI-powered organizer sort your files for
          you.
        </p>
        <div className="mt-8">
          <Button
            onClick={handleSelectFolder}
            className="inline-flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus:ring-gray-100"
            size="lg"
          >
            <FolderIcon className="w-6 h-6 mr-2" />
            Select Folder
          </Button>
          {selectedFolder && (
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Selected Folder: {selectedFolder}
            </p>
          )}
          <div className="w-full mt-4">
            <Label className="sr-only" htmlFor="openai-key">
              OpenAI API Key
            </Label>
            <Input
              className="w-full"
              id="openai-key"
              placeholder="Enter your OpenAI API key to use this feature"
              type="password"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You'll need to enter your OpenAI API key to use the file organizing
            feature. You can get your API key from the OpenAI website.
          </p>
        </div>
      </div>
    </main>
  );
}

function FolderIcon(props) {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}
