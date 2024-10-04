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

    this.createContent(modelTabContent);

    return modelTabContent;
  }

  private createContent(container: HTMLElement): void {
    container.empty();

    const fileOrganizerSettingsEl = container.createEl("div", {
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
          const isValid = await this.plugin.isLicenseKeyValid(
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
          this.createContent(container);
        })
      );

    if (this.plugin.settings.isLicenseValid) {
      fileOrganizerSettingsEl.createEl("p", {
        text: "License Status: Activated",
        cls: "license-status activated",
      });
    }

    const getLicenseButton = fileOrganizerSettingsEl.createEl("button", {
      text: "Get License",
      cls: "file-organizer-login-button",
    });
    getLicenseButton.style.marginTop = "1rem";
    getLicenseButton.addEventListener("click", () => {
      window.open("https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=get-license", "_blank");
    });

    const youtubeEmbedEl = container.createEl("div", {
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

    // Text below the YouTube video
    const supportTextEl = youtubeEmbedEl.createEl("p", {
      cls: "file-organizer-support-text",
    });
    supportTextEl.innerHTML = `File Organizer 2000 is an open-source initiative developed by two brothers. If you find it valuable, please <a href="https://fileorganizer2000.com/?utm_source=obsidian&utm_medium=in-app&utm_campaign=support-us" target="_blank">consider supporting us</a> to help improve and maintain the project. 🙏`;

    // Adjust iframe height to fill available space
    const resizeObserver = new ResizeObserver(() => {
      const availableHeight = container.clientHeight - youtubeEmbedEl.offsetTop - supportTextEl.offsetHeight;
      iframe.style.height = `${Math.max(315, availableHeight)}px`;
    });

    resizeObserver.observe(container);
  }
}