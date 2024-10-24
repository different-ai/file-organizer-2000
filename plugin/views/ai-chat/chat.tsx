import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useChat, UseChatOptions } from "@ai-sdk/react";
import { TFolder, TFile, moment, App, debounce } from "obsidian";

import FileOrganizer from "../..";
import Tiptap from "./tiptap";
import { Button } from "./button";
import { usePlugin } from "./provider";

import { logMessage } from "../../../utils";
import { SelectedItem } from "./selected-item";
import { MessageRenderer } from "./message-renderer";
import ToolInvocationHandler from "./tool-invocation-handler";
import { convertToCoreMessages, streamText, ToolInvocation } from "ai";
import { ollama } from "ollama-ai-provider";
import { getChatSystemPrompt } from "../../../web/lib/prompts/chat-prompt";
import { ContextLimitIndicator } from "./context-limit-indicator";
import { ModelSelector } from "./model-selector";
import { ModelType } from "./types";

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
  onDateRangeResults: (
    results: {
      title: string;
      content: string;
      reference: string;
      path: string;
    }[]
  ) => void;
  onLastModifiedResults: (
    results: {
      title: string;
      content: string;
      reference: string;
      path: string;
    }[]
  ) => void;
}

const filterNotesByDateRange = async (
  startDate: string,
  endDate: string,
  plugin: FileOrganizer
) => {
  logMessage(startDate, endDate, "startDate, endDate");
  const files = plugin.getAllUserMarkdownFiles();
  logMessage(files.length, "total files");

  const start = moment(startDate).startOf("day");
  const end = moment(endDate).endOf("day");

  const filteredFiles = files.filter(file => {
    // Get the file's modification date
    const fileDate = moment(file.stat.mtime);

    // Check if the file's date is within the specified range
    const isWithinDateRange = fileDate.isBetween(start, end, null, "[]");

    // Check if the file is in the logs folder
    const isInLogsFolder = file.path.startsWith(plugin.settings.logFolderPath);
    const isInTemplatesFolder = file.path.startsWith(
      plugin.settings.templatePaths
    );
    const isInBackupsFolder = file.path.startsWith(
      plugin.settings.backupFolderPath
    );

    logMessage(
      `File: ${file.basename}, ` +
        `Date: ${fileDate.format("YYYY-MM-DD")}, ` +
        `In Date Range: ${isWithinDateRange}, ` +
        `Not in Logs Folder: ${!isInLogsFolder}`
    );

    // Include the file if it's within the date range  + not in the logs folder + not in the templates folder + not in the backups folder
    return (
      isWithinDateRange &&
      !isInLogsFolder &&
      !isInTemplatesFolder &&
      !isInBackupsFolder
    );
  });

  logMessage(filteredFiles.length, "filteredFiles");

  const fileContents = await Promise.all(
    filteredFiles.map(async file => ({
      title: file.basename,
      content: await app.vault.read(file),
      path: file.path,
    }))
  );

  return fileContents;
};

export const ChatComponent: React.FC<ChatComponentProps> = ({
  fileContent,
  fileName,
  apiKey,
  inputRef,
  history,
  setHistory,
  onDateRangeResults,
  onLastModifiedResults,
}) => {
  const plugin = usePlugin();
  const app = plugin.app;
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
    { title: string; content: string; path: string; reference: string }[]
  >([]);
  const [selectedYouTubeVideos, setSelectedYouTubeVideos] = useState<
    { videoId: string; title: string; transcript: string }[]
  >([]);
  const [screenpipeContext, setScreenpipeContext] = useState<any>(null);

  logMessage(unifiedContext, "unifiedContext");

  // Log all the selected stuff
  useEffect(() => {
    // logMessage(selectedFiles, "selectedFiles");
    logMessage(selectedTags, "selectedTags");
    logMessage(selectedFolders, "selectedFolders");
    logMessage(selectedYouTubeVideos, "selectedYouTubeVideos");
  }, [selectedFiles, selectedTags, selectedFolders, selectedYouTubeVideos]);

  // Create a memoized body object that updates when its dependencies change
  const chatBody = useMemo(
    () => ({
      unifiedContext,
      enableScreenpipe: plugin.settings.enableScreenpipe,
      currentDatetime: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    }),
    [unifiedContext, plugin.settings.enableScreenpipe]
  );

  const {
    isLoading: isGenerating,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    addToolResult,
  } = useChat({
    maxSteps: 2,
    api: `${plugin.getServerUrl()}/api/chat`,
    body: chatBody,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    fetch: async (url, options) => {
      logMessage(plugin.settings.showLocalLLMInChat, "showLocalLLMInChat");
      logMessage(selectedModel, "selectedModel");
      // local llm disabled or using gpt-4o
      if (!plugin.settings.showLocalLLMInChat) {
        // return normal server fetch
        return fetch(url, options);
      }
      if (selectedModel === "gpt-4o") {
        return fetch(url, options);
      }

      if (selectedModel === "llama3.2") {
        const { messages, unifiedContext } = JSON.parse(options.body as string);

        const contextString = unifiedContext
          .map(file => {
            // this should be better formatted Start with path, title, reference, content
            return `Path: ${file.path}\nTitle: ${file.title}\nReference: ${file.reference}\nContent:\n${file.content}`;
          })
          .join("\n\n-------\n\n");
        console.log(contextString, "contextString");

        const result = await streamText({
          model: ollama("llama3.2"),
          system: getChatSystemPrompt(
            contextString,
            plugin.settings.enableScreenpipe,
            moment().format("YYYY-MM-DDTHH:mm:ssZ")
          ),
          messages: convertToCoreMessages(messages),
        });

        return result.toDataStreamResponse();
      }

      // Default fetch behavior for remote API
      return fetch(url, options);
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
    logMessage(e.target, "target");
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

  const handleRemoveFile = useCallback((filePath: string) => {
    setSelectedFiles(prevFiles =>
      prevFiles.filter(file => file.path !== filePath)
    );
    setUnifiedContext(prevContext =>
      prevContext.filter(file => file.path !== filePath)
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
        file => !prevFiles.some(prevFile => prevFile.path === file.path)
      );
      return [...prevFiles, ...newFiles];
    });
  };

  const handleOpenFile = async (fileTitle: string) => {
    const file = app.vault.getFiles().find(f => f.basename === fileTitle);
    if (file) {
      await app.workspace.openLinkText(file.path, "", true);
    }
  };
  const handleOpenFolder = (folderPath: string) => {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
      // Reveal the folder in the file explorer
      const fileExplorerLeaf =
        app.workspace.getLeavesOfType("file-explorer")[0];
      if (fileExplorerLeaf) {
        app.workspace.revealLeaf(fileExplorerLeaf);
        // Focus on the folder in the file explorer
        app.workspace.setActiveLeaf(fileExplorerLeaf);
        // Expand the folder in the file explorer
        const fileExplorer = fileExplorerLeaf.view as any;
        if (fileExplorer && typeof fileExplorer.expandFolder === "function") {
          fileExplorer.expandFolder(folder);
        }
      }
    }
  };

  const handleTagSelect = (newTags: string[]) => {
    setSelectedTags(prevTags => {
      const updatedTags = [
        ...new Set([
          ...prevTags,
          ...newTags.map(tag => (tag.startsWith("#") ? tag : `#${tag}`)),
        ]),
      ];
      return updatedTags;
    });
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
      const tags = await plugin.getAllVaultTags();
      setAllTags(tags);

      const folders = plugin.getAllNonFo2kFolders();
      setAllFolders(folders);
    };

    loadTagsAndFolders();
  }, [plugin]);

  const [includeCurrentFile, setIncludeCurrentFile] = useState(true);

  const handleRemoveCurrentFile = () => {
    setIncludeCurrentFile(false);
  };

  const handleAddCurrentFile = () => {
    setIncludeCurrentFile(true);
  };
  useEffect(() => {
    // Create a debounced version of the file change handler
    const debouncedFileChange = debounce(async (file: TFile) => {
      const content = await app.vault.read(file);
      setUnifiedContext(prev => {
        const filtered = prev.filter(item => item.path !== file.path);
        return [
          ...filtered,
          {
            title: file.basename,
            content: content,
            path: file.path,
            reference: `Current File: ${file.basename}`,
          },
        ];
      });
    }, 1000); // 1 second delay

    // Set up the event listener
    const onActiveFileChange = (file: TFile) => {
      debouncedFileChange(file);
    };

    app.vault.on("modify", onActiveFileChange);

    // Cleanup
    return () => {
      app.vault.off("modify", onActiveFileChange);
      debouncedFileChange.cancel();
    };
  }, [fileName, app.vault]);

  useEffect(() => {
    const updateUnifiedContext = async () => {
      const contextFiles = new Map<
        string,
        { title: string; content: string; path: string; reference: string }
      >();

      // Add selected files
      selectedFiles.forEach(file => {
        contextFiles.set(file.path, {
          title: file.title,
          content: file.content,
          path: file.path,
          reference: file.reference || `File: ${file.title}`,
        });
      });

      // Add current file if includeCurrentFile is true
      if (includeCurrentFile && fileName && fileContent) {
        contextFiles.set(fileName, {
          title: fileName,
          content: fileContent,
          path: fileName,
          reference: `Current File: ${fileName}`,
        });
      }

      // Add files with selected tags
      if (selectedTags.length > 0) {
        const filesWithTags = allFiles.filter(file =>
          selectedTags.some(tag => file.content.includes(tag))
        );
        filesWithTags.forEach(file => {
          contextFiles.set(file.path, {
            ...file,
            reference: `Tag: ${selectedTags.join(", ")}`,
          });
        });
      }

      if (selectedFolders.length > 0) {
        const folderContents = await Promise.all(
          selectedFolders.map(async folderPath => {
            const folder = app.vault.getAbstractFileByPath(folderPath);
            if (folder instanceof TFolder) {
              const files = folder.children.filter(
                (file): file is TFile =>
                  file instanceof TFile && file.extension === "md"
              );
              return await Promise.all(
                files.map(async file => ({
                  title: file.basename,
                  content: await app.vault.read(file),
                  path: file.path,
                  reference: `Folder: ${folderPath}`,
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

      // Add YouTube transcripts
      selectedYouTubeVideos.forEach(video => {
        contextFiles.set(`youtube-${video.videoId}`, {
          title: `YouTube: ${video.title}`,
          content: video.transcript,
          path: `https://www.youtube.com/watch?v=${video.videoId}`,
          reference: `YouTube: ${video.title}`,
        });
      });

      // Add Screenpipe context if available
      if (screenpipeContext) {
        contextFiles.set("screenpipe-context", {
          title: "Screenpipe Data",
          content: JSON.stringify(screenpipeContext),
          path: "screenpipe-context",
          reference: "Screenpipe Query Results",
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
    app.vault,
    includeCurrentFile,
    selectedYouTubeVideos,
    screenpipeContext,
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, history]);

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setSelectedFolders([]);
    setSelectedTags([]);
    setIncludeCurrentFile(false);
    setUnifiedContext([]);
    setSelectedYouTubeVideos([]);
    setScreenpipeContext(null);
  }, []);

  const handleRemoveYouTubeVideo = (videoId: string) => {
    setSelectedYouTubeVideos(prev =>
      prev.filter(video => video.videoId !== videoId)
    );
  };

  const [maxContextSize] = useState(80 * 1000); // Keep this one

  const handleActionButton = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGenerating) {
      handleCancelGeneration();
    } else {
      handleSendMessage(e);
    }
  };

  const handleYouTubeTranscript = useCallback(
    (transcript: string, title: string, videoId: string) => {
      console.log(transcript, "this is the transcript");
      setSelectedYouTubeVideos(prev => [
        ...prev,
        {
          videoId,
          title,
          transcript,
        },
      ]);
    },
    []
  );

  const handleSearchResults = useCallback(
    (
      results: {
        title: string;
        content: string;
        reference: string;
        path: string;
      }[]
    ) => {
      setSelectedFiles(prevFiles => {
        const newFiles = results.filter(
          file => !prevFiles.some(prevFile => prevFile.path === file.path)
        );
        return [...prevFiles, ...newFiles];
      });
    },
    []
  );

  const handleDateRangeResults = useCallback(
    (
      results: {
        title: string;
        content: string;
        reference: string;
        path: string;
      }[]
    ) => {
      setSelectedFiles(prevFiles => {
        const newFiles = results.filter(
          file => !prevFiles.some(prevFile => prevFile.path === file.path)
        );
        return [...prevFiles, ...newFiles];
      });
    },
    []
  );

  const handleLastModifiedResults = useCallback(
    (
      results: {
        title: string;
        content: string;
        reference: string;
        path: string;
      }[]
    ) => {
      setSelectedFiles(prevFiles => {
        const newFiles = results.filter(
          file => !prevFiles.some(prevFile => prevFile.path === file.path)
        );
        return [...prevFiles, ...newFiles];
      });
    },
    []
  );

  // Update state to default to gpt-4
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt-4o");

  return (
    <div className="flex flex-col h-full max-h-screen bg-[--background-primary]">
      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col min-h-min-content">
          {messages.map(message => (
            <React.Fragment key={message.id}>
              <MessageRenderer message={message} />
              {message.toolInvocations?.map(
                (toolInvocation: ToolInvocation) => {
                  return (
                    <ToolInvocationHandler
                      key={toolInvocation.toolCallId}
                      toolInvocation={toolInvocation}
                      addToolResult={addToolResult}
                      results={toolInvocation.state}
                      onYoutubeTranscript={handleYouTubeTranscript}
                      onSearchResults={handleSearchResults}
                      onDateRangeResults={handleDateRangeResults}
                      onLastModifiedResults={handleLastModifiedResults}
                      app={app}
                    />
                  );
                }
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-[--background-modifier-border] p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            onClick={() => {
              handleAddCurrentFile();
            }}
            className="bg-[--interactive-normal] hover:bg-[--interactive-hover] text-[--text-normal]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 mr-2"
            >
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            Add Current File
          </Button>

          <div className="flex-grow overflow-x-auto">
            <div className="flex space-x-2">
              {fileName && includeCurrentFile && (
                <SelectedItem
                  key="current-file"
                  item={fileName}
                  onClick={() => handleOpenFile(fileName)}
                  onRemove={handleRemoveCurrentFile}
                  prefix="📄 "
                />
              )}
              {selectedFiles.map((file, index) => (
                <SelectedItem
                  key={`${file.path}-${index}`}
                  item={file.title}
                  onClick={() => handleOpenFile(file.title)}
                  onRemove={() => handleRemoveFile(file.path)}
                  prefix="📄 "
                />
              ))}
              {selectedFolders.map((folder, index) => (
                <SelectedItem
                  key={`${folder}-${index}`}
                  item={folder}
                  onClick={() => handleOpenFolder(folder)}
                  onRemove={() =>
                    setSelectedFolders(folders =>
                      folders.filter(f => f !== folder)
                    )
                  }
                  prefix="📁 "
                />
              ))}
              {selectedTags.map((tag, index) => (
                <SelectedItem
                  key={`${tag}-${index}`}
                  item={tag}
                  onClick={() => {
                    /* Handle tag click */
                  }}
                  onRemove={() =>
                    setSelectedTags(tags => tags.filter(t => t !== tag))
                  }
                  prefix="🏷️ "
                />
              ))}
              {selectedYouTubeVideos.map(video => (
                <SelectedItem
                  key={`youtube-${video.videoId}`}
                  item={video.title}
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${video.videoId}`,
                      "_blank"
                    )
                  }
                  onRemove={() => handleRemoveYouTubeVideo(video.videoId)}
                  prefix="🎥 "
                />
              ))}
              {screenpipeContext && (
                <SelectedItem
                  key="screenpipe-context"
                  item="Screenpipe Data"
                  onClick={() => {
                    /* Handle Screenpipe data click */
                  }}
                  onRemove={() => setScreenpipeContext(null)}
                  prefix="📊 "
                />
              )}
            </div>
          </div>

          <Button
            onClick={handleClearAll}
            className="bg-[--interactive-normal] hover:bg-[--interactive-hover] text-[--text-normal]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleActionButton}
          className="flex items-end"
        >
          <div className="flex-grow overflow-y-auto" ref={inputRef}>
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
          <Button
            type="submit"
            className={`h-full ml-2 font-bold py-2 px-4 rounded ${
              isGenerating
                ? "bg-[--background-modifier-form-field] text-[--text-muted] cursor-not-allowed"
                : "bg-[--interactive-accent] hover:bg-[--interactive-accent-hover] text-[--text-on-accent]"
            }`}
          >
            {isGenerating ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between">
          <ContextLimitIndicator
            unifiedContext={unifiedContext}
            maxContextSize={maxContextSize}
          />
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
        </div>
      </div>
    </div>
  );
};
