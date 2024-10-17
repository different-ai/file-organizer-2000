import * as React from 'react';
import { App, PluginSettingTab } from 'obsidian';
import FileOrganizer from '../../index';
import { createRoot, Root } from 'react-dom/client';
import { SettingsTabContent } from './main';
import { logMessage } from '../../../utils';

export class FileOrganizerSettingTab extends PluginSettingTab {
  plugin: FileOrganizer;
  private root: Root | null = null;

  constructor(app: App, plugin: FileOrganizer) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    if (!this.root) {
      this.root = createRoot(containerEl);
    }

    this.root.render(
      <React.StrictMode>
        <SettingsTabContent plugin={this.plugin} />
      </React.StrictMode>
    );
  }

  hide(): void {
    logMessage("hide");
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

