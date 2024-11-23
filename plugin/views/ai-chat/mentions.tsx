import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { FileText, Hash, Folder } from 'lucide-react';

interface MentionItem {
  id?: string;
  title: string;
  content?: string;
  type?: 'file' | 'tag' | 'folder';
  label?: string;
  path?: string;
}

interface MentionsProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

const ItemIcon = ({ type }: { type?: string }) => {
  const className = "w-4 h-4";
  
  switch (type) {
    case 'file':
      return <FileText className={className} />;
    case 'tag':
      return <Hash className={className} />;
    case 'folder':
      return <Folder className={className} />;
    default:
      return null;
  }
};



export const Mentions = forwardRef<
  { onKeyDown: (args: { event: KeyboardEvent }) => boolean },
  MentionsProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
      props.items.length ? (
        // do not indent list
        <ul className="max-h-[300px] overflow-y-auto bg-[--background-secondary] list-none p-0">
          {props.items.map((item, index) => (
            <li 
              key={item.path || item.title} 
              className="list-none"
            >
              <button
                className={`w-full text-left flex items-center gap-2 hover:bg-[--background-modifier-active-hover] ${
                  index === selectedIndex
                    ? "bg-[--background-modifier-active-hover] text-[--text-accent]"
                    : "text-[--text-normal]"
                }`}
                onClick={() => selectItem(index)}
              >
                <span className="text-[--text-muted] flex-shrink-0">
                  <ItemIcon type={item.type} />
                </span>
                
                <div className="flex-grow min-w-0">
                  <div className="font-medium truncate">
                    {item.title}
                  </div>
               </div>

                {item.type && (
                  <span className="text-xs text-[--text-muted] bg-[--background-secondary] px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {item.type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-3 text-sm text-[--text-muted] text-center">
        No matching items found
      </div>
    )
  );
});

export default Mentions;
