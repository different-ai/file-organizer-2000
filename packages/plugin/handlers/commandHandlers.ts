import { WorkspaceLeaf } from "obsidian";
import FileOrganizer from "../index";
import { ORGANIZER_VIEW_TYPE, AssistantViewWrapper } from "../views/organizer/view";



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
