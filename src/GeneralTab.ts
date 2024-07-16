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

    const fileOrganizerSettingsEl = modelTabContent.createEl("div", {
      cls: "file-organizer-settings",
    });

    // File Organizer Settings Section

    new Setting(fileOrganizerSettingsEl)
      .setName("File Organizer Serial Key")
      .setDesc(
        "Login to start a free trial to generate a key and paste it here."
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your File Organizer Serial Key")
          .setValue(this.plugin.settings.API_KEY)
          .onChange(async (value) => {
            this.plugin.settings.API_KEY = value;
            await this.plugin.saveSettings();
          })
      );
    const loginButton = fileOrganizerSettingsEl.createEl("button", {
      text: "Login to File Organizer",
      cls: "file-organizer-login-button",
    });
    loginButton.style.marginTop = "1rem";
    loginButton.addEventListener("click", () => {
      window.open("https://app.fileorganizer2000.com", "_blank");
    });

    return modelTabContent;
  }
}
