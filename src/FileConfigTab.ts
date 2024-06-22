import { Setting } from "obsidian";
import { cleanPath } from "../utils";
import FileOrganizer from "./index";

export class FileConfigTab {
  private plugin: FileOrganizer;
  private containerEl: HTMLElement;

  constructor(containerEl: HTMLElement, plugin: FileOrganizer) {
    this.containerEl = containerEl;
    this.plugin = plugin;
  }

  create(): HTMLElement {
    const fileConfigTabContent = this.containerEl.createEl("div", {
    });

    new Setting(fileConfigTabContent)
      .setName("Inbox folder")
      .setDesc("Choose which folder to automatically organize files from")
      .addText((text) =>
        text
          .setPlaceholder("Enter your path")
          .setValue(this.plugin.settings.pathToWatch)
          .onChange(async (value) => {
            this.plugin.settings.pathToWatch = cleanPath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(fileConfigTabContent)
      .setName("Attachments folder")
      .setDesc(
        "Enter the path to the folder where the original images will be moved."
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your path")
          .setValue(this.plugin.settings.attachmentsPath)
          .onChange(async (value) => {
            this.plugin.settings.attachmentsPath = cleanPath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(fileConfigTabContent)
      .setName("File Organizer log folder")
      .setDesc("Choose a folder for Organization Logs e.g. Ava/Logs.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your path")
          .setValue(this.plugin.settings.logFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.logFolderPath = cleanPath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(fileConfigTabContent)
      .setName("Output folder path")
      .setDesc(
        "Enter the path where you want to save the processed files. e.g. Processed/myfavoritefolder"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your path")
          .setValue(this.plugin.settings.defaultDestinationPath)
          .onChange(async (value) => {
            const cleanedPath = cleanPath(value);
            this.plugin.settings.defaultDestinationPath = cleanedPath;
            await this.plugin.saveSettings();
          })
      );

    new Setting(fileConfigTabContent)
      .setName("Ignore folders")
      .setDesc(
        "Enter folder paths to ignore during organization, separated by commas. e.g. Folder1,Folder2"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter folder paths")
          .setValue(this.plugin.settings.ignoreFolders.join(","))
          .onChange(async (value) => {
            this.plugin.settings.ignoreFolders = value.split(",").map(cleanPath);
            await this.plugin.saveSettings();
          })
      );

    return fileConfigTabContent;
  }
}
