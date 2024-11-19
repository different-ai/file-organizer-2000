import React from 'react';
import { SelectedItem } from '../selected-item';
import { useContextItems } from '../use-context-items';

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
    items,
    toggleCurrentFile,
    removeItem
  } = useContextItems();

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const prefixMap = {
    file: '📄',
    folder: '📁',
    tag: '🏷️',
    youtube: '🎥',
    screenpipe: '📊'
  };

  const handleItemClick = (item: any) => {
    switch (item.type) {
      case 'file':
        onOpenFile(item.title);
        break;
      case 'folder':
        onOpenFolder(item.title);
        break;
      case 'youtube':
        window.open(`https://www.youtube.com/watch?v=${item.id.replace('youtube-', '')}`, "_blank");
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
              item={currentFile.name}
              onClick={() => onOpenFile(currentFile.name)}
              onRemove={toggleCurrentFile}
              prefix="📄 "
            />
          </div>
        )}

        {/* Files section */}
        {groupedItems.file?.length > 0 && (
          <div className="flex space-x-2">
            {groupedItems.file.map(item => (
              <SelectedItem
                key={item.id}
                item={item.title}
                onClick={() => handleItemClick(item)}
                onRemove={() => removeItem(item.id)}
                prefix={`${prefixMap[item.type]} `}
              />
            ))}
          </div>
        )}

        {/* Folders section */}
        {groupedItems.folder?.length > 0 && (
          <div className="flex space-x-2">
            {groupedItems.folder.map(item => (
              <SelectedItem
                key={item.id}
                item={item.title}
                onClick={() => handleItemClick(item)}
                onRemove={() => removeItem(item.id)}
                prefix={`${prefixMap[item.type]} `}
              />
            ))}
          </div>
        )}

        {/* Tags section */}
        {groupedItems.tag?.length > 0 && (
          <div className="flex space-x-2">
            {groupedItems.tag.map(item => (
              <SelectedItem
                key={item.id}
                item={item.title}
                onClick={() => handleItemClick(item)}
                onRemove={() => removeItem(item.id)}
                prefix={`${prefixMap[item.type]} `}
              />
            ))}
          </div>
        )}

        {/* Media section */}
        {(groupedItems.youtube?.length > 0 || groupedItems.screenpipe?.length > 0) && (
          <div className="flex space-x-2">
            {[...groupedItems.youtube || [], ...groupedItems.screenpipe || []].map(item => (
              <SelectedItem
                key={item.id}
                item={item.title}
                onClick={() => handleItemClick(item)}
                onRemove={() => removeItem(item.id)}
                prefix={`${prefixMap[item.type]} `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 