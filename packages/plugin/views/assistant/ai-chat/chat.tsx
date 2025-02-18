import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat, UseChatOptions } from "@ai-sdk/react";
import { moment } from "obsidian";
import { Button } from "../../../components/ui/button";
import { RefreshCw } from "lucide-react";

import FileOrganizer from "../../..";
import { GroundingMetadata, DataChunk } from "./types/grounding";
import Tiptap from "./tiptap";
import { usePlugin } from "../provider";

import { logMessage } from "../../../someUtils";
import { MessageRenderer } from "./message-renderer";
import ToolInvocationHandler from "./tool-handlers/tool-invocation-handler";
import { convertToCoreMessages, streamText, ToolInvocation } from "ai";
import { ollama } from "ollama-ai-provider";
import { SourcesSection } from "./components/SourcesSection";
import { ContextLimitIndicator } from "./context-limit-indicator";
import { ModelSelector } from "./model-selector";
import { ModelType } from "./types";
import { AudioRecorder } from "./audio-recorder";
import { logger } from "../../../services/logger";
import { SearchToggle } from "./components/search-toggle";
import { SubmitButton } from "./submit-button";
import { getUniqueReferences, useContextItems } from "./use-context-items";
import { ContextItems } from "./components/context-items";
import { ClearAllButton } from "./components/clear-all-button";
import { useCurrentFile } from "./hooks/use-current-file";
import { SearchAnnotationHandler } from "./tool-handlers/search-annotation-handler";
import {
  isSearchResultsAnnotation,
  SearchResultsAnnotation,
} from "./types/annotations";
import { ExamplePrompts } from "./components/example-prompts";
import { AttachmentHandler } from './components/attachment-handler';
import { LocalAttachment } from './types/attachments';
import { AlertCircle } from "lucide-react";

interface ChatComponentProps {
  plugin: FileOrganizer;
  apiKey: string;
  inputRef: React.RefObject<HTMLDivElement>;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  apiKey,
  inputRef,
}) => {
  const plugin = usePlugin();
  const app = plugin.app;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    setCurrentFile,
    files,
    folders,
    tags,
    searchResults,
    currentFile,
    screenpipe,
    textSelections,
    isLightweightMode,
  } = useContextItems();

  const uniqueReferences = getUniqueReferences();
  logger.debug("uniqueReferences", uniqueReferences);

  const contextItems = {
    files,
    folders,
    tags,
    currentFile,
    screenpipe,
    searchResults,
    textSelections,
  };

  // skip the use context items entirely
  useCurrentFile({
    app,
    setCurrentFile,
  });

  const contextString = React.useMemo(() => {
    if (isLightweightMode) {
      // In lightweight mode, only include metadata
      const lightweightContext = {
        files: Object.fromEntries(
          Object.entries(files).map(([id, file]) => [
            id,
            { ...file, content: "" },
          ])
        ),
        folders: Object.fromEntries(
          Object.entries(folders).map(([id, folder]) => [
            id,
            {
              ...folder,
              files: folder.files.map(f => ({ ...f, content: "" })),
            },
          ])
        ),
        tags: Object.fromEntries(
          Object.entries(tags).map(([id, tag]) => [
            id,
            { ...tag, files: tag.files.map(f => ({ ...f, content: "" })) },
          ])
        ),
        searchResults: Object.fromEntries(
          Object.entries(searchResults).map(([id, search]) => [
            id,
            {
              ...search,
              results: search.results.map(r => ({ ...r, content: "" })),
            },
          ])
        ),
        // Keep these as is
        currentFile: currentFile ? { ...currentFile, content: "" } : null,
        screenpipe,
        textSelections,
      };
      return JSON.stringify(lightweightContext);
    }
    return JSON.stringify(contextItems);
  }, [contextItems, isLightweightMode]);
  logger.debug("contextString", contextString);

  const chatBody = {
    currentDatetime: window.moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    enableScreenpipe: plugin.settings.enableScreenpipe,
    newUnifiedContext: contextString,
    model: plugin.settings.selectedModel, // Pass selected model to server
    enableSearchGrounding: plugin.settings.enableSearchGrounding,
  };

  const [groundingMetadata, setGroundingMetadata] =
    useState<GroundingMetadata | null>(null);

  const {
    isLoading: isGenerating,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    addToolResult,
    error,
    reload,
  } = useChat({
    onDataChunk: (chunk: DataChunk) => {
      if (chunk.type === "metadata" && chunk.data?.groundingMetadata) {
        setGroundingMetadata(chunk.data.groundingMetadata);
      }
    },
    maxSteps: 2,
    api: `${plugin.getServerUrl()}/api/chat`,
    experimental_throttle: 100,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${plugin.getApiKey()}`,
    },
    fetch: async (url, options) => {
      logMessage(plugin.settings.showLocalLLMInChat, "showLocalLLMInChat");
      logMessage(selectedModel, "selectedModel");
      // Handle different model types
      if (
        !plugin.settings.showLocalLLMInChat ||
        selectedModel === "gpt-4o"
      ) {
        // Use server fetch for non-local models
        return fetch(url, options);
      }

      // Handle local models (llama3.2 or custom)
      if (!options?.body) {
        throw new Error('Request options or body is undefined');
      }
      const { messages, newUnifiedContext, currentDatetime } = JSON.parse(
        options.body as string
      );
      logger.debug("local model context", {
        model: selectedModel,
        contextLength: newUnifiedContext.length,
        contextPreview: newUnifiedContext.slice(0, 200),
        messageCount: messages.length,
      });
      const result = await streamText({
        model: ollama(selectedModel),
        system: `
          ${newUnifiedContext},
          currentDatetime: ${currentDatetime},
          `,
        messages: convertToCoreMessages(messages),
      });

      return result.toDataStreamResponse();
    },
    onToolCall({ toolCall }) {
      logMessage("toolCall", toolCall);
    },
    keepLastMessageOnError: true,
    onError: error => {
      logger.error(error.message);
      setErrorMessage(
        error.message ||
          "Connection failed. If the problem persists, please check your internet connection or VPN."
      );
    },
    onFinish: () => {
      setErrorMessage(null);
    },
  } as UseChatOptions);

  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const handleAttachmentsChange = useCallback((newAttachments: LocalAttachment[]) => {
    setAttachments(newAttachments);
  }, []);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    logger.debug("handleSendMessage", e, input);
    e.preventDefault();
    if (isGenerating) {
      handleCancelGeneration();
      return;
    }

    const messageBody = {
      ...chatBody,
      experimental_attachments: attachments.map(({ id, size, ...attachment }) => ({
        name: attachment.name,
        contentType: attachment.contentType,
        url: attachment.url,
      })),
    };

    handleSubmit(e, { body: messageBody });
    // Clear attachments after sending
    setAttachments([]);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, history]);

  const [maxContextSize] = useState(80 * 1000); // Keep this one

  // Update state to default to gpt-4
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    plugin.settings.selectedModel
  );

  useEffect(() => {
    // Update selectedModel when plugin settings change
    setSelectedModel(plugin.settings.selectedModel);
  }, [plugin.settings.selectedModel]);

  const handleTranscriptionComplete = (text: string) => {
    handleInputChange({
      target: { value: text },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleExampleClick = (prompt: string) => {
    handleInputChange({
      target: { value: prompt },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleRetry = () => {
    setErrorMessage(null);
    reload();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-[--background-modifier-border] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span role="img" aria-label="ai" className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-medium">AI Assistant</h2>
              <p className="text-sm text-[--text-muted]">
                {isGenerating ? "Processing..." : "Ready to help"}
              </p>
            </div>
          </div>
   
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col space-y-4">
          {errorMessage && (
            <div className="bg-[--background-modifier-error] bg-opacity-10 text-[--text-error] p-4 rounded-lg flex items-center justify-between">
              <span className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {errorMessage}
              </span>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="text-[--text-error]"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-[--text-normal] mb-4 text-lg font-medium">Try these examples</h3>
              <ExamplePrompts onExampleClick={handleExampleClick} />
            </div>
          ) : (
            messages.map(message => (
              <React.Fragment key={message.id}>
                <MessageRenderer message={message} />
                {message.annotations?.map((annotation, index) => {
                  if (isSearchResultsAnnotation(annotation)) {
                    return (
                      <SearchAnnotationHandler
                        key={`${message.id}-annotation-${index}`}
                        annotation={annotation}
                      />
                    );
                  }
                  return null;
                })}
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
            ))
          )}

          {isGenerating && (
            <div className="flex items-center space-x-4 bg-[--background-primary-alt] border border-[--background-modifier-border] rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm">Processing request</span>
              </div>
              <div className="text-sm text-[--text-muted]">|</div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-[--text-muted] rounded-full"></div>
                <span className="text-sm text-[--text-muted]">Analyzing context</span>
              </div>
              <div className="text-sm text-[--text-muted]">|</div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-[--text-muted] rounded-full"></div>
                <span className="text-sm text-[--text-muted]">Generating response</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          {groundingMetadata && (
            <SourcesSection groundingMetadata={groundingMetadata} />
          )}
        </div>
      </div>

      {/* Chat Input Section */}
      <div className="border-t border-[--background-modifier-border] p-4">
        <div className="flex items-center space-x-2 mb-4">
          <ContextItems />
          <ClearAllButton />
        </div>

                {/* Tip about adding @file, @tag, or @folder */}
                <div className="text-[--text-muted] text-sm mt-2 mb-2 ml-2">
          Tip: Enter <code>@note</code>, <code>@tag</code>, or{" "}
          <code>@folder</code> to add items to context.
        </div>

        <form onSubmit={handleSendMessage} className="flex flex-col space-y-4">
          <div className={`flex flex-grow ${error ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="overflow-y-auto relative w-full" ref={inputRef}>
              <Tiptap
                value={input}
                onChange={handleTiptapChange}
                onKeyDown={handleKeyDown}
              />

              <div className="absolute bottom-0 right-12 h-full flex items-center space-x-2">
                <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
              </div>
            </div>
            <SubmitButton isGenerating={isGenerating} />
          </div>

          {/* Enhancement Options */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-[--background-primary-alt]"
              onClick={() => handleExampleClick("Can you summarize this for me?")}
            >
              <span role="img" aria-label="summary" className="text-lg">📝</span>
              <span>Quick Summary</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-[--background-primary-alt]"
              onClick={() => handleExampleClick("What are the key points?")}
            >
              <span role="img" aria-label="key points" className="text-lg">🎯</span>
              <span>Key Points</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-[--background-primary-alt]"
              onClick={() => handleExampleClick("Extract action items from this.")}
            >
              <span role="img" aria-label="action items" className="text-lg">✅</span>
              <span>Action Items</span>
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-4">
          <ContextLimitIndicator
            unifiedContext={contextString}
            maxContextSize={maxContextSize}
          />
          <div className="flex items-center space-x-2">
            <SearchToggle selectedModel={selectedModel} />
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
