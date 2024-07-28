import React, { useState, useEffect } from "react";
import { useChat } from "ai/react";
import { TFile } from "obsidian";
import FileOrganizer from "../..";

interface AIChatSidebarProps {
  plugin: FileOrganizer;
  activeFile: TFile | null;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  plugin,
  activeFile,
}) => {
  const [fileContent, setFileContent] = useState<string>("");
  console.log('file Content',  fileContent);
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `${plugin.getServerUrl()}/api/chat`,
    body: { fileContent }, // Add this line
  });

  useEffect(() => {
    const loadFileContent = async () => {
      if (activeFile) {
        const content = await plugin.app.vault.read(activeFile);
        setFileContent(content);
      }
    };
    loadFileContent();
  }, [activeFile, plugin.app.vault]);

  return (
    <div className="ai-chat-sidebar">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === "user" ? "User: " : "AI: "}
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default AIChatSidebar;