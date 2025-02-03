import React from "react";
import { FileText } from "lucide-react";
import { usePlugin } from "../../provider";

interface AppendButtonProps {
  content: string;
}

export const AppendButton: React.FC<AppendButtonProps> = ({ content }) => {
  const plugin = usePlugin();

  const handleAppend = async () => {
    const activeFile = plugin.app.workspace.getActiveFile();
    if (!activeFile) return;

    const fileContent = await plugin.app.vault.read(activeFile);
    await plugin.app.vault.modify(activeFile, fileContent + "\n\n" + content);
  };

  return (
    <button
      onClick={handleAppend}
      className="p-1 hover:bg-[--background-modifier-hover] rounded"
      title="Append to current note"
    >
      <FileText size={16} className="text-[--text-muted]" />
    </button>
  );
};
