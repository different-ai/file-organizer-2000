import React, { useState, useEffect, useRef } from "react";
import { useChat, UseChatOptions } from "@ai-sdk/react";
import { TFolder, TFile, moment, debounce, Vault } from "obsidian";

import FileOrganizer from "../..";
import Tiptap from "./tiptap";
import { usePlugin } from "../organizer/provider";

import { logMessage } from "../../someUtils";
import { MessageRenderer } from "./message-renderer";
import ToolInvocationHandler from "./tool-handlers/tool-invocation-handler";
import { convertToCoreMessages, streamText, ToolInvocation } from "ai";
import { ollama } from "ollama-ai-provider";
import { getChatSystemPrompt } from "../../../web/lib/prompts/chat-prompt";
import { ContextLimitIndicator } from "./context-limit-indicator";
import { ModelSelector } from "./model-selector";
import { ModelType } from "./types";
import { AudioRecorder } from "./audio-recorder";
import { logger } from "../../services/logger";
import { SubmitButton } from "./submit-button";
import { AddCurrentFileButton } from "./components/add-current-file-button";
import { useContextItems, addFileContext, addTagContext } from "./use-context-items";
import { ContextItems } from "./components/context-items";
import { ClearAllButton } from "./components/clear-all-button";

interface ChatComponentProps {
  plugin: FileOrganizer;
  fileContent: string;
  fileName: string | null;
  apiKey: string;
  inputRef: React.RefObject<HTMLDivElement>;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  fileContent,
  fileName,
  apiKey,
  inputRef,
}) => {
  const plugin = usePlugin();
  const app = plugin.app;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unifiedContext, setUnifiedContext] = useState<
    { title: string; content: string; path: string; reference: string }[]
  >([]);

  const { toggleCurrentFile, setCurrentFile, files, folders, tags } =
    useContextItems();

  const getFolderFiles = async (folderRef: TFolder) => {
    const files: TFile[] = [];
    Vault.recurseChildren(folderRef, file => {
      if (file instanceof TFile) {
        files.push(file);
      }
    });

    return Promise.all(
      files.map(async file => ({
        path: file.path,
        content: await plugin.app.vault.cachedRead(file),
      }))
    );
  };

  const processFolder = async (folder: any) => {
    const folderRef = plugin.app.vault.getFolderByPath(folder.path);
    if (!folderRef) return folder;

    const folderFiles = await getFolderFiles(folderRef);

    return {
      ...folder,
      children: folderFiles,
    };
  };

  const processTag = async (tag: TagContextItem) => {
    // Get all files with this tag
    const taggedFiles = app.vault.getFiles()
      .filter(file => {
        const cache = app.metadataCache.getFileCache(file);
        return cache?.tags?.some(t => t.tag === `#${tag.name}`);
      });

    // Get content for all tagged files
    const tagFiles = await Promise.all(
      taggedFiles.map(async file => ({
        path: file.path,
        content: await app.vault.cachedRead(file),
      }))
    );

    return {
      ...tag,
      children: tagFiles,
    };
  };

  const createContextString = (
    folders: any[], 
    files: any[], 
    tags: Array<TagContextItem & { children: Array<{ path: string; content: string }> }>
  ) => {
    let contextString = "# Available Content\n\n";

    // First list all tags and their associated files
    if (tags.length > 0) {
      contextString += "## Tags and Tagged Files\n\n";
      tags.forEach(tag => {
        contextString += `#${tag.name}\n`;
        if (tag.children && tag.children.length > 0) {
          tag.children.forEach(file => {
            contextString += `  └── 📄 ${file.path}\n`;
          });
        }
        contextString += "\n";
      });
    }

    // Then list all folders and their contents
    if (folders.length > 0) {
      contextString += "## Folders\n\n";
      folders.forEach(folder => {
        contextString += `📁 Folder: ${folder.path}\n`;
        if (folder.children && folder.children.length > 0) {
          folder.children.forEach((file: any) => {
            contextString += `  └── 📄 ${file.path}\n`;
          });
        }
        contextString += "\n";
      });
    }

    // Then list all individual files
    if (files.length > 0) {
      contextString += "## Individual Files\n\n";
      files.forEach(file => {
        contextString += `📄 ${file.path}\n`;
      });
      contextString += "\n";
    }

    // Finally, add the full content of all files
    contextString += "## File Contents\n\n";
    
    // Add tagged files first
    tags.forEach(tag => {
      if (tag.children && tag.children.length > 0) {
        tag.children.forEach(file => {
          contextString += `### 📄 ${file.path} (tagged with #${tag.name})\n\n${file.content}\n\n---\n\n`;
        });
      }
    });
    
    // Add folder files
    folders.forEach(folder => {
      if (folder.children && folder.children.length > 0) {
        folder.children.forEach((file: any) => {
          contextString += `### 📄 ${file.path}\n\n${file.content}\n\n---\n\n`;
        });
      }
    });
    
    // Add individual files
    files.forEach(file => {
      contextString += `### 📄 ${file.path}\n\n${file.content}\n\n---\n\n`;
    });

    return contextString;
  };

  const chatBody = React.useMemo(async () => {
    // Process both folders and tags
    const processedFolders = await Promise.all(
      Object.values(folders).map(processFolder)
    );
    const processedTags = await Promise.all(
      Object.values(tags).map(processTag)
    );
    const processedFiles = Object.values(files);

    const contextString = createContextString(processedFolders, processedFiles, processedTags);
    console.log("contextString", contextString);

    return {
      unifiedContext: contextString,
      enableScreenpipe: plugin.settings.enableScreenpipe,
      currentDatetime: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    };
  }, [files, folders, tags, plugin.settings.enableScreenpipe]);

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
    experimental_throttle: 100,
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
    onToolCall({ toolCall }) {
      logMessage("toolCall", toolCall);
    },
    keepLastMessageOnError: true,
    onError: error => {
      logger.error(error.message);
      setErrorMessage(
        "Connection failed. If the problem persists, please check your internet connection or VPN."
      );
    },
    onFinish: () => {
      setErrorMessage(null);
    },
  } as UseChatOptions);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    logger.debug("handleSendMessage", e, input);
    e.preventDefault();
    if (isGenerating) {
      handleCancelGeneration();
      return;
    }

    handleSubmit(e, { body: chatBody });
  };

  const handleCancelGeneration = () => {
    stop();
  };

  const handleTiptapChange = async (newContent: string) => {
    handleInputChange({
      target: { value: newContent },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event as unknown as React.FormEvent<HTMLFormElement>);
    }
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, history]);

  const [maxContextSize] = useState(80 * 1000); // Keep this one

  // Update state to default to gpt-4
  const [selectedModel, setSelectedModel] = useState<ModelType>("gpt-4o");

  const handleTranscriptionComplete = (text: string) => {
    handleInputChange({
      target: { value: text },
    } as React.ChangeEvent<HTMLInputElement>);
  };
  // Update current file when it changes
  useEffect(() => {
    if (fileName && fileContent) {
      setCurrentFile({
        id: fileName,
        title: fileName,
        content: fileContent,
        name: fileName,
      });
    }
  }, [fileName, fileContent, setCurrentFile]);

  return (
    <div className="flex flex-col h-full max-h-screen ">
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
          <AddCurrentFileButton onAddCurrentFile={() => toggleCurrentFile()} />

          <ContextItems
            onOpenFile={handleOpenFile}
            onOpenFolder={handleOpenFolder}
          />

          <ClearAllButton />
        </div>

        <form
          // onSubmit={handleSendMessage}
          className="flex items-end"
        >
          <div className="flex-grow overflow-y-auto relative" ref={inputRef}>
            <Tiptap
              value={input}
              onChange={handleTiptapChange}
              onKeyDown={handleKeyDown}
            />

            <div className="absolute bottom-0 right-0 h-full flex items-center">
              <AudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </div>
          </div>
          <SubmitButton isGenerating={isGenerating} />
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
