import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import FileOrganizer from "../..";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Tiptap from "../components/TipTap";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => (
  <button {...props} className={`button ${props.className || ""}`}>
    {children}
  </button>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => (
  <div {...props} className={`card ${props.className || ""}`}>
    {children}
  </div>
);

export const Avatar: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { role: "user" | "assistant" }
> = ({ role, ...props }) => (
  <div {...props} className={`avatar ${role} ${props.className || ""}`}></div>
);

interface ChatComponentProps {
  plugin: FileOrganizer;
  fileContent: string;
  fileName: string | null;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  plugin,
  fileContent,
  fileName,
}) => {
  console.log(fileContent, "debug");
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,
    body: { fileContent, fileName },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleTiptapChange = (newContent: string) => {
    handleInputChange({
      target: { value: newContent },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <Avatar role={message.role as "user" | "assistant"} />
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="tiptap-wrapper">
          <Tiptap
            value={input}
            onChange={handleTiptapChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button type="submit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </Button>
      </form>
    </>
  );
};

interface AIChatSidebarProps {
  plugin: FileOrganizer;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ plugin }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const loadFileContent = async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        try {
          const content = await plugin.app.vault.read(activeFile);
          setFileContent(content);
          setFileName(activeFile.name);
        } catch (error) {
          logMessage(`Error reading file: ${error}`);
          setFileContent("");
          setFileName(null);
        }
      } else {
        setFileContent("");
        setFileName(null);
      }
      setKey(prevKey => prevKey + 1);
    };

    loadFileContent();

    // Set up event listener for file changes
    const onFileOpen = plugin.app.workspace.on("file-open", loadFileContent);

    return () => {
      plugin.app.workspace.offref(onFileOpen);
    };
  }, [plugin.app.workspace, plugin.app.vault]);

  return (
    <Card className="ai-chat-sidebar">
      <ChatComponent
        key={key}
        plugin={plugin}
        fileContent={fileContent}
        fileName={fileName}
      />
    </Card>
  );
};

export default AIChatSidebar;
