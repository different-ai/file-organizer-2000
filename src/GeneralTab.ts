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
    modelTabContent.createEl("h6", { text: "Pro Settings" });
    // Pro Account Toggle
    const proAccountEl = modelTabContent.createEl("div");
    proAccountEl.createEl("div", { cls: "separation-bar" });

    new Setting(proAccountEl)
      .setName("Use Pro Account")
      .setDesc(
        "Enable this to route use your api key from File Organizer 2000."
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

    const loginButton = fileOrganizerSettingsEl.createEl("button", {
      text: "Login to File Organizer",
      cls: "file-organizer-login-button",
    });
    loginButton.addEventListener("click", () => {
      window.open("https://app.fileorganizer2000.com", "_blank");
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
          })
      );

    // DONT THINK WE NEED THIS ANYMORE, WE HAVE THE LOGIN BUTTON
    // Special message for File Organizer
    // const fileOrganizerMessageEl = fileOrganizerSettingsEl.createEl("div", {
    //   cls: "file-organizer-message",
    // });
    // fileOrganizerMessageEl
    //   .createEl("p", {
    //     text: "Access your dashboard at ",
    //   })
    //   .createEl("a", {
    //     href: "https://app.fileorganizer2000.com",
    //     text: "File Organizer Dashboard",
    //     target: "_blank",
    //   });

    // OpenAI Settings Section
    const openAISettingsEl = modelTabContent.createEl("div", {
      cls: "openai-settings",
    });
    // add separation bar
    openAISettingsEl.createEl("div", { cls: "separation-bar" });
    // add OpenAI title

    this.updateSettingsVisibility();

    return modelTabContent;
  }

  private updateSettingsVisibility(): void {
    const isPro = this.plugin.settings.usePro;
    const fileOrganizerSettingsEl = this.containerEl.querySelector(
      ".file-organizer-settings"
    );
    const openAISettingsEl = this.containerEl.querySelector(".openai-settings");

    if (fileOrganizerSettingsEl) {
      fileOrganizerSettingsEl.style.display = isPro ? "block" : "none";
    }

    if (openAISettingsEl) {
      openAISettingsEl.style.display = isPro ? "none" : "block";
    }
  }
}
