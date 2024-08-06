import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat, UseChatOptions } from "@ai-sdk/react";

import FileOrganizer from "../..";
import ReactMarkdown from "react-markdown";
import Tiptap from "./tiptap";
import { TFolder, TFile } from "obsidian";
import { ToolInvocation } from "ai";
import { Button } from "./button";
import { Avatar } from "./avatar";

interface ToolInvocationHandlerProps {
  toolInvocation: ToolInvocation;
  addToolResult: (params: { toolCallId: string; result: string }) => void;
}

interface ToolInvocationHandlerProps {
  toolInvocation: ToolInvocation;
  addToolResult: (params: { toolCallId: string; result: string }) => void;
}

export const ToolInvocationHandler: React.FC<ToolInvocationHandlerProps> = ({
  toolInvocation,
  addToolResult,
}) => {
  const toolCallId = toolInvocation.toolCallId;
  const handleAddResult = (result: string) =>
    addToolResult({ toolCallId, result });

  switch (toolInvocation.toolName) {
    case "getNotesForDateRange":
      if ("result" in toolInvocation) {
        try {
          console.log(toolInvocation.result, "toolInvocation.result");
          return <div>Found {toolInvocation.result.length} notes</div>;
        } catch (error) {
          console.error("Error parsing JSON:", error);
          return <div>Error parsing date range data</div>;
        }
      } else {
        return <div>Getting notes...</div>;
      }

    case "askForConfirmation":
      return (
        <div>
          {toolInvocation.args.message}
          <div>
            {"result" in toolInvocation ? (
              <b>{toolInvocation.result}</b>
            ) : (
              <>
                <Button onClick={() => handleAddResult("Yes")}>Yes</Button>
                <Button onClick={() => handleAddResult("No")}>No</Button>
              </>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

interface ChatComponentProps {
  plugin: FileOrganizer;
  fileContent: string;
  fileName: string | null;
  apiKey: string;
  inputRef: React.RefObject<HTMLDivElement>;
  history: { id: string; role: string; content: string }[];
  setHistory: (
    newHistory: { id: string; role: string; content: string }[]
  ) => void;
}

const filterNotesByDateRange = async (
  plugin: FileOrganizer,
  startDate: string,
  endDate: string
) => {
  const files = plugin.getAllUserMarkdownFiles();
  const filteredFiles = files.filter(file => {
    const fileDate = new Date(file.stat.mtime);
    return fileDate >= new Date(startDate) && fileDate <= new Date(endDate);
  });

  const fileContents = await Promise.all(
    filteredFiles.map(async file => ({
      title: file.basename,
      content: await plugin.app.vault.read(file),
    }))
  );

  return fileContents;
};

const SelectedItem = ({
  item,
  onRemove,
  prefix = "",
  onClick,
}: {
  item: string;
  onRemove: () => void;
  prefix?: string;
  onClick: () => void;
}) => (
  <div key={item} className={`selected-file`}>
    <button onClick={onClick} className="sanitized-button">
      {prefix}
      {item}
    </button>
    <button onClick={onRemove} className="remove-button">
      x
    </button>
  </div>
);

export const ChatComponent: React.FC<ChatComponentProps> = ({
  plugin,
  fileContent,
  fileName,
  apiKey,
  inputRef,
  history,
  setHistory,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    { title: string; content: string; reference: string; path: string }[]
  >([]);
  const [allFiles, setAllFiles] = useState<
    { title: string; content: string; path: string }[]
  >([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allFolders, setAllFolders] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [unifiedContext, setUnifiedContext] = useState<
    { title: string; content: string; path: string }[]
  >([]);
  console.log(unifiedContext, "unifiedContext");

  // Log all the selected stuff
  useEffect(() => {
    console.log(selectedFiles, "selectedFiles");
    console.log(selectedTags, "selectedTags");
    console.log(selectedFolders, "selectedFolders");
  }, [selectedFiles, selectedTags, selectedFolders]);

  const {
    isLoading: isGenerating,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    addToolResult,
  } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,

    body: { unifiedContext },
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
    maxToolRoundtrips: 5,
    async onToolCall({ toolCall }) {
      console.log(toolCall, "toolCall");
      if (toolCall.toolName === "getNotesForDateRange") {
        const args = toolCall.args as { startDate: string; endDate: string };
        const { startDate, endDate } = args;
        const filteredNotes = await filterNotesByDateRange(
          plugin,
          startDate,
          endDate
        );

        // Add filtered Markdown notes to selectedFiles
        setSelectedFiles(prevFiles => [
          ...prevFiles,
          ...filteredNotes.map(note => ({
            title: note.title,
            content: note.content,
            reference: `Date range: ${startDate} to ${endDate}`,
            path: note.title, // Assuming title can be used as a unique identifier
          })),
        ]);

        return JSON.stringify(filteredNotes);
      }
    },
  } as UseChatOptions);

  const formRef = useRef<HTMLFormElement>(null);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(e.target, "target");
    setErrorMessage(null);
    handleSubmit(e);
    setHistory([...history, ...messages]);
  };

  const handleCancelGeneration = () => {
    stop();
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

  const handleRemoveFile = useCallback((fileTitle: string) => {
    setSelectedFiles(prevFiles =>
      prevFiles.filter(file => file.title !== fileTitle)
    );
    setUnifiedContext(prevContext =>
      prevContext.filter(file => file.title !== fileTitle)
    );
  }, []);

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

  const handleFileSelect = (
    files: { title: string; content: string; reference: string; path: string }[]
  ) => {
    setSelectedFiles(prevFiles => {
      const newFiles = files.filter(
        file => !prevFiles.some(prevFile => prevFile.title === file.title)
      );
      return [...prevFiles, ...newFiles];
    });
  };

  const handleOpenFile = async (fileTitle: string) => {
    const file = plugin.app.vault
      .getFiles()
      .find(f => f.basename === fileTitle);
    if (file) {
      await plugin.app.workspace.openLinkText(file.path, "", true);
    }
  };
  const handleOpenFolder = (folderPath: string) => {
    const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
      // Reveal the folder in the file explorer
      const fileExplorerLeaf =
        plugin.app.workspace.getLeavesOfType("file-explorer")[0];
      if (fileExplorerLeaf) {
        plugin.app.workspace.revealLeaf(fileExplorerLeaf);
        // Focus on the folder in the file explorer
        plugin.app.workspace.setActiveLeaf(fileExplorerLeaf);
        // Expand the folder in the file explorer
        const fileExplorer = fileExplorerLeaf.view as any;
        if (fileExplorer && typeof fileExplorer.expandFolder === 'function') {
          fileExplorer.expandFolder(folder);
        }
      }
    }
  };

  const handleTagSelect = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const handleFolderSelect = async (folders: string[]) => {
    setSelectedFolders(folders);
  };

  useEffect(() => {
    const loadAllFiles = async () => {
      const files = plugin.getAllUserMarkdownFiles();
      const fileData = await Promise.all(
        files.map(async file => ({
          title: file.basename,
          content: await plugin.app.vault.read(file),
          path: file.path,
        }))
      );
      setAllFiles(fileData);
    };

    loadAllFiles();
  }, [plugin.app.vault]);

  useEffect(() => {
    const loadTagsAndFolders = async () => {
      const tags = await plugin.getAllTags();
      setAllTags(tags);

      const folders = plugin.getAllFolders();
      setAllFolders(folders);
    };

    loadTagsAndFolders();
  }, [plugin]);

  useEffect(() => {
    const updateUnifiedContext = async () => {
      const contextFiles = new Map<
        string,
        { title: string; content: string; path: string }
      >();

      // Add selected files
      selectedFiles.forEach(file => {
        contextFiles.set(file.path, {
          title: file.title,
          content: file.content,
          path: file.path,
        });
      });

      // Add current file if it's explicitly selected
      if (
        selectedFiles.some(file => file.title === fileName) &&
        fileName &&
        fileContent
      ) {
        contextFiles.set(fileName, {
          title: fileName,
          content: fileContent,
          path: fileName,
        });
      }

      // Add files with selected tags
      if (selectedTags.length > 0) {
        const filesWithTags = allFiles.filter(file =>
          selectedTags.some(tag => file.content.includes(`#${tag}`))
        );
        filesWithTags.forEach(file => {
          contextFiles.set(file.path, file);
        });
      }

      if (selectedFolders.length > 0) {
        const folderContents = await Promise.all(
          selectedFolders.map(async folderPath => {
            const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
            if (folder instanceof TFolder) {
              const files = folder.children.filter(
                (file): file is TFile =>
                  file instanceof TFile && file.extension === "md"
              );
              return await Promise.all(
                files.map(async file => ({
                  title: file.basename,
                  content: await plugin.app.vault.read(file),
                  path: file.path,
                }))
              );
            }
            return [];
          })
        );
        folderContents.flat().forEach(file => {
          contextFiles.set(file.path, file);
        });
      }

      // Convert Map to array
      const uniqueFiles = Array.from(contextFiles.values());

      setUnifiedContext(uniqueFiles);
    };

    updateUnifiedContext();
  }, [
    selectedFiles,
    selectedTags,
    selectedFolders,
    allFiles,
    fileName,
    fileContent,
    plugin.app.vault,
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, history]);

  return (
    <div className="chat-component">
      <div className="chat-messages">
        <div className="chat-messages-inner">
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
                {message.toolInvocations?.map(
                  (toolInvocation: ToolInvocation) => (
                    <ToolInvocationHandler
                      key={toolInvocation.toolCallId}
                      toolInvocation={toolInvocation}
                      addToolResult={addToolResult}
                    />
                  )
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
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

      <div className="chat-input-container">
        <div className="selected-files">
          {selectedFiles.map(file => (
            <SelectedItem
              key={file.title}
              item={file.title}
              onClick={() => handleOpenFile(file.title)}
              onRemove={() => handleRemoveFile(file.title)}
            />
          ))}

          {selectedFolders.map(folder => (
            <SelectedItem
              key={folder}
              item={folder}
              onClick={() => handleOpenFolder(folder)}
              onRemove={() =>
                setSelectedFolders(folders => folders.filter(f => f !== folder))
              }
            />
          ))}
        </div>

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
              tags={allTags}
              folders={allFolders}
              onFileSelect={handleFileSelect}
              onTagSelect={handleTagSelect}
              onFolderSelect={handleFolderSelect}
              currentFileName={fileName || ""}
              currentFileContent={fileContent}
            />
          </div>
          <Button type="submit" className="send-button" disabled={isGenerating}>
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

        {isGenerating && (
          <Button onClick={handleCancelGeneration} className="cancel-button">
            Cancel Generation
          </Button>
        )}
      </div>
    </div>
  );
};
