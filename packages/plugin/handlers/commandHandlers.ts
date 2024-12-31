import { WorkspaceLeaf } from "obsidian";
import FileOrganizer from "../index";
import { ORGANIZER_VIEW_TYPE, AssistantViewWrapper } from "../views/assistant/view";
import { App, TFile } from "obsidian";
import { logger } from "../services/logger";



export function initializeOrganizer(plugin: FileOrganizer) {

  plugin.registerView(
    ORGANIZER_VIEW_TYPE,
    (leaf: WorkspaceLeaf) => new AssistantViewWrapper(leaf, plugin)
  );

  plugin.addRibbonIcon("sparkle", "Fo2k Assistant View", () => {
    plugin.ensureAssistantView();
  });

}

export function initializeFileOrganizationCommands(plugin: FileOrganizer) {

  plugin.addCommand({
    id: "add-to-inbox",
    name: "Put in inbox",
    callback: async () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (activeFile) {
        await plugin.app.vault.rename(activeFile, `${plugin.settings.pathToWatch}/${activeFile.name}`);
      }
    },
  });
}

export async function addTextToDocument(app: App, content: string, path?: string): Promise<void> {
  try {
    let targetFile: TFile;
    console.log("path", path, 'addTextToDocument');
    
    if (path) {
      targetFile = app.vault.getAbstractFileByPath(path) as TFile;
      if (!targetFile) {
        throw new Error(`File not found at path: ${path}`);
      }
    } else {
      // Get the active file
      targetFile = app.workspace.getActiveFile();
      if (!targetFile) {
        throw new Error("No active file found");
      }
    }

    // Get current content
    const currentContent = await app.vault.read(targetFile);
    
    // Get editor if it exists
    const editor = app.workspace.activeEditor?.editor;
    
    if (editor) {
      // If we have an editor, insert at cursor position
      const cursor = editor.getCursor();
      editor.replaceRange(content, cursor);
    } else {
      // Otherwise append to the end
      await app.vault.modify(targetFile, currentContent + "\n" + content);
    }
    
    logger.info(`Successfully added text to document: ${targetFile.path}`);
  } catch (error) {
    logger.error("Error adding text to document:", error);
    throw error;
  }
}
