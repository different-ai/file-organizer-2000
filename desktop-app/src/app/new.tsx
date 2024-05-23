'use client'
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

const FileWatcherComponent = () => {
  const [files, setFiles] = useState<{ path: string, content: string }[]>([]);

  useEffect(() => {
    const unlisten = listen('file-added', event => {
      console.log('New file added:', event.payload);
      setFiles(prevFiles => [...prevFiles, {
        path: event.payload.file_path,
        content: event.payload.content
      }]);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return (
    <div>
      <div>Listening for file changes...</div>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <div>Path: {file.path}</div>
            <div>Content (base64): {file.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileWatcherComponent;
