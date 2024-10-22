import React from "react";
import { Avatar } from "./avatar";
import { AIMarkdown } from "./ai-message-renderer";
import { UserMarkdown } from "./user-message-renderer";
import { ToolInvocation } from "ai";

interface MessageRendererProps {
  message: {
    id: string;
    role: string;
    content: string;
    toolInvocations?: ToolInvocation[];
  };
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  message,
}) => {
  if (message.toolInvocations) {
    return null;
  }
  return (
    <div className="flex items-start mb-4">
      <Avatar role={message.role as "user" | "assistant"} />
      <div className="ml-2 p-2 rounded-lg text-[--text-normal]">
        {message.role === "user" ? (
          <UserMarkdown content={message.content} />
        ) : message.toolInvocations ? (
          <UserMarkdown content={message.content} />
        ) : (
          <AIMarkdown content={message.content} />
        )}
      </div>
    </div>
  );
};
