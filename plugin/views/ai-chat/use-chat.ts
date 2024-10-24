import { useState, useCallback } from 'react';
import { Message, CoreMessage, ToolInvocation } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { useChat as useServerChat, UseChatOptions as ServerChatOptions } from "@ai-sdk/react";

interface UseChatOptions extends ServerChatOptions {
  useLocalChat: boolean;
  apiUrl: string;
  apiKey: string;
  body: any;
}

export function useChat(options: UseChatOptions) {
  if (options.useLocalChat) {
    return useLocalChat(options);
  } else {
    return useServerChat({
      ...options,
      api: options.apiUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
    });
  }
}

function useLocalChat(options: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addToolResult = useCallback((toolCallId: string, result: string) => {
    // Handle tool results
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (!lastMessage?.toolInvocations) return prev;

      const updatedToolInvocations = lastMessage.toolInvocations.map(tool => {
        if (tool.toolCallId === toolCallId) {
          return { ...tool, result };
        }
        return tool;
      });

      return prev.map((msg, i) => 
        i === prev.length - 1 
          ? { ...msg, toolInvocations: updatedToolInvocations }
          : msg
      );
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
      };
      addMessage(userMessage);
      setInput('');

      // Use Ollama directly
      const model = ollama(process.env.OLLAMA_MODEL || 'llama2');
      const response = await model.chat([userMessage as CoreMessage]);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
      };
      addMessage(assistantMessage);

      options.onFinish?.(assistantMessage, { usage: { total_tokens: 0 }, finish_reason: 'stop' });
    } catch (error) {
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, options]);

  const stop = useCallback(() => {
    // Implement abort logic here if needed
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    addToolResult,
  };
}
