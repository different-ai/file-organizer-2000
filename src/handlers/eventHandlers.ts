import { TFile } from "obsidian";
import FileOrganizer from "..";

export function registerEventHandlers(plugin: FileOrganizer) {
  plugin.registerEvent(
    plugin.app.vault.on("create", (file) => {
      if (!file.path.includes(plugin.settings.pathToWatch)) return;
      if (file instanceof TFile) {
        plugin.processFileV2(file);
      }
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("rename", (file, oldPath) => {
      if (!file.path.includes(plugin.settings.pathToWatch)) return;
      if (file instanceof TFile) {
        plugin.processFileV2(file, oldPath);
      }
    })
  );
}