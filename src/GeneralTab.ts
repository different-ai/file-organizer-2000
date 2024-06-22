// GeneralTab.ts

import { Setting } from "obsidian";
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
    // add margin top to the tab content

    // title
    // Pro Account Toggle
    const proAccountEl = modelTabContent.createEl("div");

    new Setting(proAccountEl)
      .setName("Use Pro Account")
      .setDesc(
        "Disable this to use your own LLMs then go to the advanced tab to setup your own"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.usePro).onChange(async (value) => {
          this.plugin.settings.usePro = value;
          await this.plugin.saveSettings();
          this.updateSettingsVisibility();
          this.plugin.initalizeModels();
        })
      );

    const fileOrganizerSettingsEl = modelTabContent.createEl("div", {
      cls: "file-organizer-settings",
    });

    // File Organizer Settings Section
     new Setting(fileOrganizerSettingsEl)
      .setName("File Organizer API Key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your File Organizer API Key")
          .setValue(this.plugin.settings.API_KEY)
          .onChange(async (value) => {
            this.plugin.settings.API_KEY = value;
            await this.plugin.saveSettings();
            this.updateLoginButtonVisibility();
          })
      );
     new Setting(fileOrganizerSettingsEl).addButton((button) => {
      button
        .setButtonText("Login to File Organizer")
        .setClass("file-organizer-login-button")
        .onClick(() => {
          window.open("https://app.fileorganizer2000.com", "_blank");
        });
    });

    this.updateSettingsVisibility();
    this.updateLoginButtonVisibility();

    return modelTabContent;
  }

  private updateSettingsVisibility(): void {
    const isPro = this.plugin.settings.usePro;
    const fileOrganizerSettingsEl = this.containerEl.querySelector(
      ".file-organizer-settings"
    );

    if (fileOrganizerSettingsEl) {
      fileOrganizerSettingsEl.style.display = isPro ? "block" : "none";
    }
  }

  private updateLoginButtonVisibility(): void {
    const loginButton = this.containerEl.querySelector(
      ".file-organizer-login-button"
    );
    if (loginButton) {
      loginButton.style.display = this.plugin.settings.API_KEY ? "none" : "block";
  }
  }
}

