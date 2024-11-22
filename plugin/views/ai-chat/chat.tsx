import React, { useState, useEffect, useRef } from "react";
import { useChat, UseChatOptions } from "@ai-sdk/react";
import { moment } from "obsidian";

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
import { getUniqueReferences, useContextItems } from "./use-context-items";
import { ContextItems } from "./components/context-items";
import { ClearAllButton } from "./components/clear-all-button";
import { useCurrentFile } from "./hooks/use-current-file";

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
    const contextString = JSON.stringify(contextItems);
    return contextString;
  }, [contextItems]);
  logger.debug("contextString", contextString);

  const chatBody = {
    currentDatetime: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    enableScreenpipe: plugin.settings.enableScreenpipe,
    newUnifiedContext: contextString,
  };

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
        const { messages, unifiedContext, currentDatetime, enableScreenpipe } =
          JSON.parse(options.body as string);
        const result = await streamText({
          model: ollama("llama3.2"),
          system: getChatSystemPrompt(
            unifiedContext,
            enableScreenpipe,
            currentDatetime
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

          <ContextItems />

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
            unifiedContext={contextString}
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
