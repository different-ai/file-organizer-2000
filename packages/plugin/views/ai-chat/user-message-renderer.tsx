import React from "react";
import { MarkdownContent } from "./shared/markdown-renderer";

interface UserMarkdownProps {
  content: string;
}

export const UserMarkdown: React.FC<UserMarkdownProps> = ({ content }) => {
  return (
    <MarkdownContent 
      content={content} 
      className="simple-obsidian-renderer p-3"
    />
  );
};
