import { TFile } from "obsidian";
import FileOrganizer from "..";
import { Inbox } from "../inbox";

export function registerEventHandlers(plugin: FileOrganizer) {
  plugin.registerEvent(
    plugin.app.vault.on("create", async file => {
      // wait 1s
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!file.path.includes(plugin.settings.pathToWatch)) return;
      if (file instanceof TFile) {
        if (plugin.settings.useInbox) {
          Inbox.getInstance().enqueueFiles([file]);
        } else {
          plugin.processFileV2(file);
        }
      }
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("rename", async (file, oldPath) => {
      // wait 1s
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!file.path.includes(plugin.settings.pathToWatch)) return;
      if (file instanceof TFile) {
        if (plugin.settings.useInbox) {
          Inbox.getInstance().enqueueFiles([file]);
        } else {
          plugin.processFileV2(file, oldPath);
        }
      }
    })
  );
}
