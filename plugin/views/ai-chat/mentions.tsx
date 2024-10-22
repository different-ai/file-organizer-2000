import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

interface MentionItem {
  id?: string;
  title: string;
  content?: string;
  type?: string;
  label?: string;
  path?: string;
  icon?: string; // New property for item icons
}

interface MentionsProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

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
    <div className="">
      {props.items.length ? (
        <ul className="py-1 list-none">
          {props.items.map((item, index) => (
            <li key={item.path || item.title} className="list-none">
              <button
                className={`w-full text-left px-4 py-2 flex items-center space-x-2 ${
                  index === selectedIndex
                    ? "bg-[--background-modifier-active-hover] text-[--text-accent]"
                    : "text-[--text-normal] hover:bg-[--background-modifier-hover]"
                }`}
                onClick={() => selectItem(index)}
              >
                {item.icon && (
                  <span className="text-[--text-muted]">{item.icon}</span>
                )}
                <span className="flex-grow truncate">{item.title}</span>
                {item.type && (
                  <span className="text-xs text-[--text-muted] bg-[--background-secondary] px-1.5 py-0.5 rounded-full">
                    {item.type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-2 text-sm text-[--text-muted]">
          No results found
        </div>
      )}
    </div>
  );
});

export default Mentions;
