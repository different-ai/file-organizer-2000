import React from "react";
import { Copy } from "lucide-react";

interface CopyButtonProps {
  content: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-[--background-modifier-hover] rounded"
      title="Copy to clipboard"
    >
      <Copy className="h-4 w-4 text-[--text-muted]" />
    </button>
  );
};
