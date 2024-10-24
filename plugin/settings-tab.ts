import { App, PluginSettingTab, Setting } from "obsidian";
import FileOrganizer from "./main";

export class FileOrganizerSettingTab extends PluginSettingTab {
  plugin: FileOrganizer;

  constructor(app: App, plugin: FileOrganizer) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // ... (other settings)

    new Setting(containerEl)
      .setName("Use Local Chat")
      .setDesc("Toggle to use local chat instead of server-based chat")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useLocalChat)
        .onChange(async (value) => {
          this.plugin.settings.useLocalChat = value;
          await this.plugin.saveSettings();
        }));
  }
}
