import React, { useEffect, useRef, useState } from "react";
import { ChatComponent } from "./chat";
import FileOrganizer from "../../..";
import { Card } from "./card";
import { Button } from "./button";
interface AIChatSidebarProps {
  plugin: FileOrganizer;
  apiKey: string;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ plugin, apiKey }) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<
    { id: string; role: string; content: string }[][]
  >([[]]);
  const [currentConversationIndex, setCurrentConversationIndex] =
    useState<number>(0);

  const startNewConversation = () => {
    setConversations([...conversations, []]);
    setCurrentConversationIndex(conversations.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl/Cmd + N is pressed and the input ref is focused
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); // Prevent default browser behavior
        startNewConversation();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [conversations]); // Include conversations in dependencies since startNewConversation uses it

  return (
    <Card className="flex flex-col h-full max-h-screen bg-[--ai-chat-background] text-[--ai-chat-text] p-0 m-0">
      <div className="flex justify-end">
        <Button
          onClick={startNewConversation}
          className="h-6 w-6 p-1 rounded-full bg-[--interactive-accent] text-[--text-on-accent] hover:bg-[--interactive-accent-hover] transition-colors duration-200 absolute top-2 right-2"
          aria-label="New Conversation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
      <ChatComponent
        key={currentConversationIndex}
        plugin={plugin}
        apiKey={apiKey}
        inputRef={inputRef}
      />
    </Card>
  );
};

export default AIChatSidebar;
