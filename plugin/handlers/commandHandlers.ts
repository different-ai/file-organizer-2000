import { TFile } from "obsidian";
import FileOrganizer from "../index";

export function registerCommandHandlers(plugin: FileOrganizer) {
  plugin.addCommand({
    id: "append-existing-tags",
    name: "Append existing tags",
    callback: async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        const fileContent = await plugin.getTextFromFile(activeFile);
        await plugin.appendSimilarTags(fileContent, activeFile);
      }
    },
  });

  plugin.addCommand({
    id: "show-assistant",
    name: "Show Assistant",
    callback: async () => {
      await plugin.showAssistantSidebar();
    },
  });

  plugin.addCommand({
    id: "add-to-inbox",
    name: "Put in inbox",
    callback: async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        await plugin.processFileV2(activeFile);
      }
    },
  });

  plugin.addCommand({
    id: "organize-text-file",
    name: "Organize text file",
    callback: async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        const fileContent = await plugin.getTextFromFile(activeFile);
        await plugin.organizeFile(activeFile, fileContent);
      }
    },
  });
}