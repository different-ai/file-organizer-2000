import React from "react";
import { MarkdownContent } from "./shared/markdown-renderer";

// Icon components
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// ... Add other icon components similarly ...

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  actionText: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, onClick, tooltip, actionText }) => (
  <button 
    className="clickable-icon-container" 
    title={tooltip}
    onClick={onClick}
  >
    <span className="clickable-icon">{icon}</span>
    <span className="icon-action-text">{actionText}</span>
  </button>
);

interface AIMarkdownProps {
  content: string;
}

export const AIMarkdown: React.FC<AIMarkdownProps> = ({ content }) => {
  const handleCopy = () => navigator.clipboard.writeText(content);

  return (
    <MarkdownContent 
      content={content} 
      className="obsidian-renderer"
    >
      <div className="icon-container">
        <ActionButton
          icon={<CopyIcon />}
          onClick={handleCopy}
          tooltip="Copy content"
          actionText="Copy"
        />
      </div>
    </MarkdownContent>
  );
};
