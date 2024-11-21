import React from 'react';
import { SelectedItem } from '../selected-item';
import { ContextItemType, useContextItems } from '../use-context-items';


interface ContextItemsProps {
  onOpenFile: (fileTitle: string) => void;
  onOpenFolder: (folder: string) => void;
}

export const ContextItems: React.FC<ContextItemsProps> = ({
  onOpenFile,
  onOpenFolder,
}) => {
  const {
    currentFile,
    includeCurrentFile,
    files,
    folders,
    youtubeVideos,
    tags,
    screenpipe,
    removeItem,
    toggleCurrentFile
  } = useContextItems();

  const prefixMap = {
    file: '📄',
    folder: '📁',
    tag: '🏷️',
    youtube: '🎥',
    screenpipe: '📊'
  } as const;

  const handleItemClick = (type: ContextItemType, id: string, title: string) => {
    switch (type) {
      case 'file':
        onOpenFile(title);
        break;
      case 'folder':
        onOpenFolder(title);
        break;
      case 'youtube':
        const videoId = id.replace('youtube-', '');
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
        break;
      case 'tag':
        // Add tag handling if needed
        break;
      case 'screenpipe':
        // Add screenpipe handling if needed
        break;
    }
  };

  return (
    <div className="flex-grow overflow-x-auto">
      <div className="flex flex-col space-y-2">
        {/* Current file section */}
        {currentFile && includeCurrentFile && (
          <div className="flex space-x-2">
            <SelectedItem
              key="current-file"
              item={currentFile.title}
              onClick={() => onOpenFile(currentFile.title)}
              onRemove={toggleCurrentFile}
              prefix={`${prefixMap.file} `}
            />
          </div>
        )}

        {/* Files section */}
        {Object.values(files).length > 0 && (
          <div className="flex space-x-2">
            {Object.values(files).map(file => (
              <SelectedItem
                key={file.id}
                item={file.title}
                onClick={() => handleItemClick('file', file.id, file.title)}
                onRemove={() => removeItem('file', file.id)}
                prefix={`${prefixMap.file} `}
              />
            ))}
          </div>
        )}

        {/* Folders section */}
        {Object.values(folders).length > 0 && (
          <div className="flex space-x-2">
            {Object.values(folders).map(folder => (
              <SelectedItem
                key={folder.id}
                item={folder.name}
                onClick={() => handleItemClick('folder', folder.id, folder.name)}
                onRemove={() => removeItem('folder', folder.id)}
                prefix={`${prefixMap.folder} `}
              />
            ))}
          </div>
        )}

        {/* Tags section */}
        {Object.values(tags).length > 0 && (
          <div className="flex space-x-2">
            {Object.values(tags).map(tag => (
              <SelectedItem
                key={tag.id}
                item={tag.name}
                onClick={() => handleItemClick('tag', tag.id, tag.name)}
                onRemove={() => removeItem('tag', tag.id)}
                prefix={`${prefixMap.tag} `}
              />
            ))}
          </div>
        )}

        {/* Media section (YouTube and Screenpipe) */}
        {(Object.values(youtubeVideos).length > 0 || Object.values(screenpipe).length > 0) && (
          <div className="flex space-x-2">
            {/* YouTube items */}
            {Object.values(youtubeVideos).map(video => (
              <SelectedItem
                key={video.id}
                item={video.title}
                onClick={() => handleItemClick('youtube', video.id, video.title)}
                onRemove={() => removeItem('youtube', video.id)}
                prefix={`${prefixMap.youtube} `}
              />
            ))}
            {/* Screenpipe items */}
            {Object.values(screenpipe).map(item => (
              <SelectedItem
                key={item.id}
                item={item.reference}
                onClick={() => handleItemClick('screenpipe', item.id, item.reference)}
                onRemove={() => removeItem('screenpipe', item.id)}
                prefix={`${prefixMap.screenpipe} `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 