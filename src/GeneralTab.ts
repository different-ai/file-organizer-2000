// GeneralTab.ts

import { Setting, Notice } from "obsidian";
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

    const fileOrganizerSettingsEl = modelTabContent.createEl("div", {
      cls: "file-organizer-settings",
    });

    new Setting(fileOrganizerSettingsEl)
      .setName("File Organizer License Key")
      .setDesc("Get a license key to activate File Organizer 2000.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your File Organizer License Key")
          .setValue(this.plugin.settings.API_KEY)
          .onChange(async (value) => {
            this.plugin.settings.API_KEY = value;
            await this.plugin.saveSettings();
          })
      )
      .addButton((button) =>
        button.setButtonText("Activate").onClick(async () => {
          const isValid = await this.plugin.checkAPIKey(
            this.plugin.settings.API_KEY
          );
          if (isValid) {
            new Notice(
              "License key activated successfully!",
              5000
            ).noticeEl.addClass("success");
          } else {
            new Notice("Invalid license key. Please try again.");
          }
        })
      );

    const getLicenseButton = fileOrganizerSettingsEl.createEl("button", {
      text: "Get License",
      cls: "file-organizer-login-button",
    });
    getLicenseButton.style.marginTop = "1rem";
    getLicenseButton.addEventListener("click", () => {
      window.open("https://app.fileorganizer2000.com", "_blank");
    });
    getLicenseButton.style.marginTop = "1rem";
    getLicenseButton.addEventListener("click", () => {
      window.open("https://app.fileorganizer2000.com", "_blank");
    });
    const youtubeEmbedEl = modelTabContent.createEl("div", {
      cls: "youtube-embed",
    });

    const iframe = youtubeEmbedEl.createEl("iframe", {
      attr: {
        width: "100%",
        height: "315",
        src: "https://www.youtube.com/embed/dRtLCBFzTAo?si=eo0h8dxTW-AIsNpp",
        frameborder: "0",
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: "",
      },
    });

    // Adjust iframe height to fill available space
    const resizeObserver = new ResizeObserver(() => {
      const availableHeight =
        modelTabContent.clientHeight - youtubeEmbedEl.offsetTop;
      iframe.style.height = `${Math.max(315, availableHeight)}px`;
    });

    resizeObserver.observe(modelTabContent);

    return modelTabContent;
  }
}
