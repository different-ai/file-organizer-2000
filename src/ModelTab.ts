import { Setting } from "obsidian";
import { configureTask } from "../standalone/models";
import FileOrganizer from "./index";

export class ModelTab {
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

    // OpenAI Settings Section

    const openAISettingsEl = modelTabContent.createEl("div");
    this.toggleSettingsVisibility(openAISettingsEl, true);

    new Setting(openAISettingsEl)
      .setName("User Pro Account")
      .setDesc(
        "Enable this to route OpenAI API calls through the File Organizer 2000 server."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useOpenAIProxy)
          .onChange(async (value) => {
            this.plugin.settings.useOpenAIProxy = value;
            await this.plugin.saveSettings();
            this.plugin.updateOpenAIConfig();
          })
      );

    this.toggleSettingsVisibility(
      openAISettingsEl,
      this.plugin.settings.enableOpenAI
    );

    new Setting(openAISettingsEl).setName("OpenAI API Key").addText((text) =>
      text
        .setPlaceholder("Enter your OpenAI API Key")
        .setValue(this.plugin.settings.openAIApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openAIApiKey = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(openAISettingsEl).setName("OpenAI Model").addText((text) =>
      text
        .setPlaceholder("Enter the OpenAI model name")
        .setValue(this.plugin.settings.openAIModel)
        .onChange(async (value) => {
          this.plugin.settings.openAIModel = value;
          await this.plugin.saveSettings();
        })
    );

    // OpenAI Base URL Setting
    new Setting(openAISettingsEl).setName("OpenAI Base URL").addText((text) =>
      text
        .setPlaceholder("Enter the OpenAI base URL")
        .setValue(this.plugin.settings.openAIBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.openAIBaseUrl = value;
          await this.plugin.saveSettings();
        })
    );

    // Additional Information for OpenAI Settings
    const openAIInfoEl = modelTabContent.createEl("div", {
      cls: "setting-info",
    });
    openAIInfoEl
      .createEl("p", {
        text: "To obtain an OpenAI API key, visit the OpenAI API platform at ",
      })
      .createEl("a", {
        href: "https://platform.openai.com/",
        text: "OpenAI API Platform",
        target: "_blank",
      });
    openAIInfoEl.createEl("p", {
      text: "For more advanced settings, go to the Advanced Models tab.",
    });

    return modelTabContent;
  }

  private toggleSettingsVisibility(
    settingEl: HTMLElement,
    isVisible: boolean
  ): void {
    settingEl.style.display = isVisible ? "block" : "none";
  }
}
