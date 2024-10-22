import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import FileOrganizer from '../..';
import AIChatSidebar from './container';
import { AppContext } from './provider';

export const CHAT_VIEW_TYPE = "fo2k.ai.chat";

export class AIChatView extends ItemView {
  private root: Root;
  private plugin: FileOrganizer;

  constructor(leaf: WorkspaceLeaf, plugin: FileOrganizer) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Fo2k Chat';
  }

  getIcon(): string {
    return 'bot';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    
    if (!this.root) {
      this.root = createRoot(container);
    }
    this.root.render(
      <AppContext.Provider value={{ plugin: this.plugin, root: this.root }}>
        <AIChatSidebar
          plugin={this.plugin}
          apiKey={this.plugin.settings.API_KEY}
        />
      </AppContext.Provider>
    );
  }

  async onClose(): Promise<void> {
    this.root.unmount();
  }
}