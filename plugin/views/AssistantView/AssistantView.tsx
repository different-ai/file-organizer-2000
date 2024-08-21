import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";

import { Root, createRoot } from "react-dom/client";
import { AssistantView } from "./AssistantViewReact";
import FileOrganizer from "../..";


export const ASSISTANT_VIEW_TYPE = "fo2k.assistant.sidebar2";

export class AssistantViewWrapper extends ItemView {
  root: Root | null = null;
  plugin: FileOrganizer;

  constructor(leaf: WorkspaceLeaf, plugin: FileOrganizer) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return ASSISTANT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Assistant";
  }

  getIcon(): string {
    return "sparkle"; // Change this to the desired icon name
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1]);
    this.render();
  }

  render(): void {
    this.root?.render(
      <React.StrictMode>
        <AssistantView plugin={this.plugin} leaf={this.leaf} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}