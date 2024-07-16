import { Setting } from "obsidian";
import FileOrganizer from "./index";

export class ModelForXTab {
  private plugin: FileOrganizer;
  private containerEl: HTMLElement;
  private tempSettings: Partial<FileOrganizer["settings"]> = {};

  constructor(containerEl: HTMLElement, plugin: FileOrganizer) {
    this.containerEl = containerEl;
    this.plugin = plugin;
  }

  create(): HTMLElement {
    const modelTabContent = this.containerEl.createEl("div", {
      cls: "setting-tab-content",
    });

    const selfHostSettings = new Setting(modelTabContent)
      .setName("Enable Self-Hosting")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.enableOllama).onChange((value) => {
          this.tempSettings.enableOllama = value;
          this.toggleSettingsVisibility(selfHostSettingsEl, value);
        });
      });

    const selfHostSettingsEl = modelTabContent.createEl("div");
    this.toggleSettingsVisibility(
      selfHostSettingsEl,
      this.plugin.settings.enableSelfHosting
    );

    new Setting(selfHostSettingsEl).setName("Server URL").addText((text) =>
      text
        .setPlaceholder("Enter your Server URL")
        .setValue(this.plugin.settings.selfHostingURL)
        .onChange(async (value) => {
          this.tempSettings.selfHostingURL = value;
          // save settings
          await this.plugin.saveSettings();
        })
    );
    // add separator

    return modelTabContent;
  }

  private toggleSettingsVisibility(
    settingEl: HTMLElement,
    isVisible: boolean
  ): void {
    settingEl.style.display = isVisible ? "block" : "none";
  }
}
