import { Setting } from "obsidian";
import { configureTask } from "../standalone/models";
import FileOrganizer from "./index";

import { models } from "../standalone/models"; // Import models

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

    this.createModelDropdown(
      modelTabContent,
      "Tagging Model",
      "taggingModel",
      "tagging"
    );
    this.createModelDropdown(
      modelTabContent,
      "Folders Model",
      "foldersModel",
      "folders"
    );
    this.createModelDropdown(
      modelTabContent,
      "Relationships Model",
      "relationshipsModel",
      "relationships"
    );
    this.createModelDropdown(
      modelTabContent,
      "Name Model",
      "nameModel",
      "name"
    );
    this.createModelDropdown(
      modelTabContent,
      "Classification Model",
      "classifyModel",
      "classify"
    );
    this.createModelDropdown(
      modelTabContent,
      "Vision Model",
      "visionModel",
      "vision"
    );
    this.createModelDropdown(
      modelTabContent,
      "Formatting Model",
      "formatModel",
      "format"
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

    new Setting(ollamaSettingsEl).setName("Ollama Model").addText(
      (text) =>
        text
          .setPlaceholder("Enter the Ollama model name")
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

                console.log(
                  "Ollama models:",
                  this.plugin.settings.ollamaModels
                );
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

  private createModelDropdown(
    container: HTMLElement,
    settingName: string,
    settingKey: keyof FileOrganizer["settings"],
    taskType: string
  ): void {
    new Setting(container).setName(settingName).addDropdown((dropdown) => {
      const loadOptions = async () => {
        dropdown.selectEl.innerHTML = "";
        Object.keys(models).forEach((model) => {
          dropdown.addOption(model, model);
        });
        dropdown.setValue(this.plugin.settings[settingKey] as string);
      };

      loadOptions();
      setInterval(loadOptions, 5000);

      dropdown.onChange(async (value) => {
        this.plugin.settings[settingKey] = value;
        await this.plugin.saveSettings();
        configureTask(taskType, value);
      });
    });
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
