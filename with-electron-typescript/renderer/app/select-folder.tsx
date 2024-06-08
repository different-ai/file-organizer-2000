"use client";
import React, { useEffect, useState } from "react";

function SelectFolder() {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [organizedFiles, setOrganizedFiles] = useState([]);

  useEffect(() => {
    const handleFolderSelected = (event, folderPath) => {
      setSelectedFolder(folderPath);
    };

    const handleNewFile = (event, file) => {
      setOrganizedFiles((prevFiles) => [...prevFiles, file]);
    };

    window.electron.onFolderSelected(handleFolderSelected);
    window.electron.onNewFile(handleNewFile);

    return () => {
      window.electron.stopOnNewFile(handleNewFile);
    };
  }, []);

  const handleSelectFolder = () => {
    window.electron.selectFolder();
  };

  return (
    <div>
      <button onClick={handleSelectFolder}>Select Folder</button>
      {selectedFolder && <p>Selected Folder: {selectedFolder}</p>}
      <ul>
        {organizedFiles.map((file) => (
          <li key={file.path}>
            {file.path} - Type: {file.type}, Folder: {file.folder}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SelectFolder;
