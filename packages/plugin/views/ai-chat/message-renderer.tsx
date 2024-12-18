import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.div 
      className="flex items-start mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Avatar role={message.role as "user" | "assistant"} />
      <motion.div className="rounded-lg text-[--text-normal] w-full">
        {message.role === "user" ? (
          <UserMarkdown content={message.content} />
        ) : (
          <AIMarkdown content={message.content} />
        )}
      </motion.div>
    </motion.div>
  );
};
