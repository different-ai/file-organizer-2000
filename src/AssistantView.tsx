import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";

import { Root, createRoot } from "react-dom/client";
import { AssistantView } from "./AssistantViewReact";
import FileOrganizer from ".";
import { logMessage } from "../utils";

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

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1]);
    logMessage("AssistantViewWrapper", this.plugin);
    this.root.render(
      <React.StrictMode>
        <AssistantView plugin={this.plugin} />
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}
