'use client'
// ./components/FolderSelector.tsx

import { useEffect, useState } from 'react';

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
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: '', // Add the file content if needed
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
    <div>
      <button onClick={handleSelectFolder}>Select Folder</button>
      {selectedFolder && <p>Selected Folder: {selectedFolder}</p>}
    </div>
  );
}