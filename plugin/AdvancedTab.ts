import { Setting } from "obsidian";
import FileOrganizer from "./index";

export class ModelForXTab {
  private plugin: FileOrganizer;
  private containerEl: HTMLElement;

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
      .setDesc(
        "Enable Self-Hosting to host the server on your own machine. Requires technical skills and an external OpenAI API Key + credits. Keep disabled for default version of the plugin."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableSelfHosting)
          .onChange(async (value) => {
            this.plugin.settings.enableSelfHosting = value;
            this.toggleSettingsVisibility(selfHostSettingsEl, value);
            await this.plugin.saveSettings();
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
          this.plugin.settings.selfHostingURL = value;
          await this.plugin.saveSettings();
        })
    );

    return modelTabContent;
  }

  private toggleSettingsVisibility(
    settingEl: HTMLElement,
    isVisible: boolean
  ): void {
    settingEl.style.display = isVisible ? "block" : "none";
  }
}
