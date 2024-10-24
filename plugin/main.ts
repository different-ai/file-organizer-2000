import { Plugin, TAbstractFile, TFile } from "obsidian";

export interface FileOrganizerSettings {
  // ... (other settings)
  useLocalChat: boolean;
}

const DEFAULT_SETTINGS: FileOrganizerSettings = {
  // ... (other default settings)
  useLocalChat: false,
};

export default class FileOrganizer extends Plugin {
  settings: FileOrganizerSettings;

  async onload() {
    await this.loadSettings();
    // ... (rest of the onload implementation)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // ... (rest of the class implementation)
}
