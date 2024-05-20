import { Setting } from "obsidian";
import { configureTask } from "../standalone/models";
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

    // Model Settings Section
    new Setting(modelTabContent).setName("Model Settings").setHeading();

    new Setting(modelTabContent).setName("Tagging Model").addText((text) =>
      text
        .setPlaceholder("Enter the model name for tagging")
        .setValue(this.plugin.settings.taggingModel)
        .onChange(async (value) => {
          this.plugin.settings.taggingModel = value;
          await this.plugin.saveSettings();
          configureTask("tagging", value);
        })
    );

    new Setting(modelTabContent).setName("Folders Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for folders")
        .setValue(this.plugin.settings.foldersModel)
        .onChange(async (value) => {
          this.plugin.settings.foldersModel = value;
          await this.plugin.saveSettings();
          configureTask("folders", value);
        })
    );

    new Setting(modelTabContent)
      .setName("Relationships Model")
      .addText((text) =>
        text
          .setPlaceholder("Enter the model for relationships")
          .setValue(this.plugin.settings.relationshipsModel)
          .onChange(async (value) => {
            this.plugin.settings.relationshipsModel = value;
            await this.plugin.saveSettings();
            configureTask("relationships", value);
          })
      );

    new Setting(modelTabContent).setName("Name Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for name generation")
        .setValue(this.plugin.settings.nameModel)
        .onChange(async (value) => {
          this.plugin.settings.nameModel = value;
          await this.plugin.saveSettings();
          configureTask("name", value);
        })
    );

    new Setting(modelTabContent)
      .setName("Classification Model")
      .addText((text) =>
        text
          .setPlaceholder("Enter the model for classification")
          .setValue(this.plugin.settings.classifyModel)
          .onChange(async (value) => {
            this.plugin.settings.classifyModel = value;
            await this.plugin.saveSettings();
            configureTask("classify", value);
          })
      );

    new Setting(modelTabContent).setName("Vision Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for vision")
        .setValue(this.plugin.settings.visionModel)
        .onChange(async (value) => {
          this.plugin.settings.visionModel = value;
          configureTask("vision", value);
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("Formatting Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for formatting")
        .setValue(this.plugin.settings.formatModel)
        .onChange(async (value) => {
          this.plugin.settings.formatModel = value;
          configureTask("format", value);
          await this.plugin.saveSettings();
        })
    );

    // Anthropic Settings Section
    new Setting(modelTabContent).setName("Anthropic Settings").setHeading();

    const anthropicSettings = new Setting(modelTabContent)
      .setName("Enable Anthropic")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableAnthropic)
          .onChange(async (value) => {
            this.plugin.settings.enableAnthropic = value;
            await this.plugin.saveSettings();
            this.toggleSettingsVisibility(anthropicSettingsEl, value);
          });
      });

    const anthropicSettingsEl = modelTabContent.createEl("div");
    this.toggleSettingsVisibility(
      anthropicSettingsEl,
      this.plugin.settings.enableAnthropic
    );

    new Setting(anthropicSettingsEl)
      .setName("Anthropic API Key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your Anthropic API Key")
          .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (value) => {
            this.plugin.settings.anthropicApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(anthropicSettingsEl)
      .setName("Anthropic Model")
      .addText((text) =>
        text
          .setPlaceholder("Enter the Anthropic model name")
          .setValue(this.plugin.settings.anthropicModel)
          .onChange(async (value) => {
            this.plugin.settings.anthropicModel = value;
            await this.plugin.saveSettings();
          })
      );

    // Ollama Settings Section
    new Setting(modelTabContent).setName("Ollama Settings").setHeading();

    const ollamaSettings = new Setting(modelTabContent)
      .setName("Enable Ollama")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableOllama)
          .onChange(async (value) => {
            this.plugin.settings.enableOllama = value;
            await this.plugin.saveSettings();
            this.toggleSettingsVisibility(ollamaSettingsEl, value);
          });
      });

    const ollamaSettingsEl = modelTabContent.createEl("div");
    this.toggleSettingsVisibility(
      ollamaSettingsEl,
      this.plugin.settings.enableOllama
    );

    new Setting(ollamaSettingsEl).setName("Ollama URL").addText((text) =>
      text
        .setPlaceholder("Enter the Ollama URL")
        .setValue(this.plugin.settings.ollamaUrl)
        .onChange(async (value) => {
          this.plugin.settings.ollamaUrl = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(ollamaSettingsEl).setName("Ollama Model(s)").addText(
      (text) =>
        text
          .setPlaceholder("Enter the Ollama model names, separated by commas")
          .setValue(
            Array.isArray(this.plugin.settings.ollamaModels)
              ? this.plugin.settings.ollamaModels.join(", ")
              : ""
          )
          .onChange(
            debounce(async (value) => {
              if (typeof value === "string") {
                this.plugin.settings.ollamaModels = value
                  .split(",")
                  .map((model) => model.trim())
                  .filter((model) => model.length > 0);
                await this.plugin.saveSettings();
              } else {
                console.error("Invalid input for Ollama models:", value);
              }
            }, 2000)
          ) // 2000 milliseconds = 2 seconds
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

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
