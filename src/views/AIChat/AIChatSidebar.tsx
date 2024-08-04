import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import { UseChatOptions } from 'ai/react';

import FileOrganizer from "../..";
import ReactMarkdown from "react-markdown";
import Tiptap from "../components/TipTap";
import { debounce } from "obsidian";

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
  apiKey: string;
  inputRef: React.RefObject<HTMLDivElement>;
  history: { id: string; role: string; content: string }[];
  setHistory: (newHistory: { id: string; role: string; content: string }[]) => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  plugin,
  fileContent,
  fileName,
  apiKey,
  inputRef,
  history,
  setHistory,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [context, setContext] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<{ title: string; content: string }[]>([]);
  const [allFiles, setAllFiles] = useState<{ title: string; content: string }[]>([]);
  console.log(selectedFiles, "selectedFiles");

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,
    body: { fileContent, fileName, context, selectedFiles },
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    keepLastMessageOnError: true,
    onError: error => {
      console.error(error);
      setErrorMessage(
        "Connection failed. If the problem persists, please check your internet connection or VPN."
      );
    },
    onFinish: () => {
      setErrorMessage(null);
    },
  } as UseChatOptions);

  const formRef = useRef<HTMLFormElement>(null);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(e.target, "target");
    setErrorMessage(null); // Clear error message on new submit
    handleSubmit(e);
    setHistory([...history, ...messages]);
  };

  const handleRetry = (lastMessageContent: string) => {
    setErrorMessage(null); // Clear error message on retry
    handleInputChange({
      target: { value: lastMessageContent },
    } as React.ChangeEvent<HTMLInputElement>);

    // Remove the last message
    messages.pop();

    // Programmatically submit the form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }
    }, 0);
  };

  const handleRemoveFile = (fileTitle: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.title !== fileTitle));
  };

  const handleTiptapChange = async (newContent: string) => {
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

  const handleFileSelect = (files: { title: string; content: string }[]) => {
    setSelectedFiles(prevFiles => {
      const newFiles = files.filter(file => !prevFiles.some(prevFile => prevFile.title === file.title));
      return [...prevFiles, ...newFiles];
    });
  };

  const handleOpenFile = async (fileTitle: string) => {
    const file = plugin.app.vault.getFiles().find(f => f.basename === fileTitle);
    if (file) {
      await plugin.app.workspace.openLinkText(file.path, '', true);
    }
  };

  useEffect(() => {
    const loadAllFiles = async () => {
      const files = plugin.app.vault.getFiles();
      const fileData = await Promise.all(
        files.map(async (file) => ({
          title: file.basename,
          content: await plugin.app.vault.read(file),
        }))
      );
      setAllFiles(fileData);
    };

    loadAllFiles();
  }, [plugin.app.vault]);

  useEffect(() => {
    const newContext = selectedFiles.map(file => `File: ${file.title}\n\nContent:\n${file.content}`).join('\n\n');
    setContext(newContext);
  }, [selectedFiles]);

  return (
    <>
      <div className="chat-messages">
        {history.map(message => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <Avatar role={message.role as "user" | "assistant"} />
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <Avatar role={message.role as "user" | "assistant"} />
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
          <Button
            type="button"
            onClick={() => handleRetry(messages[messages.length - 1].content)}
            className="retry-button"
          >
            Retry
          </Button>
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSendMessage}
        className="chat-input-form"
      >
        <div className="tiptap-wrapper" ref={inputRef}>
          <Tiptap
            value={input}
            onChange={handleTiptapChange}
            onKeyDown={handleKeyDown}
            files={allFiles}
            onFileSelect={handleFileSelect}
            currentFileName={fileName || ""}
            currentFileContent={fileContent}
          />
        </div>
        <Button type="submit" className="send-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "20px", height: "20px" }}
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </Button>
      </form>
      <div className="selected-files">
        {selectedFiles.map(file => (
          <div
            key={file.title}
            className="selected-file"
            onClick={() => handleOpenFile(file.title)}
            style={{ cursor: 'pointer' }}
          >
            {file.title}
            <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.title); }} className="remove-file-button">
              x
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

interface AIChatSidebarProps {
  plugin: FileOrganizer;
  apiKey: string;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ plugin, apiKey }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<{ id: string; role: string; content: string }[][]>([[]]);
  const [currentConversationIndex, setCurrentConversationIndex] = useState<number>(0);

  const startNewConversation = () => {
    setConversations([...conversations, []]);
    setCurrentConversationIndex(conversations.length);
  };

  const handlePreviousConversation = () => {
    setCurrentConversationIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleNextConversation = () => {
    setCurrentConversationIndex((prevIndex) => Math.min(prevIndex + 1, conversations.length - 1));
  };

  useEffect(() => {
    const loadFileContent = async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        try {
          const content = await plugin.app.vault.read(activeFile);
          setFileContent(content);
          setFileName(activeFile.basename);
        } catch (error) {
          console.error(`Error reading file: ${error}`);
          setFileContent("");
          setFileName(null);
        }
      } else {
        setFileContent("");
        setFileName(null);
      }
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
      <div className="new-conversation-container">
        <Button onClick={startNewConversation} className="new-conversation-button" aria-label="New Conversation">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
      <ChatComponent
        key={currentConversationIndex}
        plugin={plugin}
        fileContent={fileContent}
        fileName={fileName}
        apiKey={apiKey}
        inputRef={inputRef}
        history={conversations[currentConversationIndex]}
        setHistory={(newHistory) => {
          const updatedConversations = [...conversations];
          updatedConversations[currentConversationIndex] = newHistory;
          setConversations(updatedConversations);
        }}
      />
    </Card>
  );
};

export default AIChatSidebar;