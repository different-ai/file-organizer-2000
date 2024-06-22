import FileOrganizer from "./index";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import ModelsReact from "./ModelsReact";

export class ModelForXTab {
  private plugin: FileOrganizer;
  private containerEl: HTMLElement;
  private root: Root | null = null;

  constructor(containerEl: HTMLElement, plugin: FileOrganizer) {
    this.containerEl = containerEl;
    this.plugin = plugin;
  }

  create(): HTMLElement {
    const modelTabContent = this.containerEl.createEl("div", {
      cls: "setting-tab-content",
    });

    this.root = createRoot(modelTabContent);
    this.root.render(
      <React.StrictMode>
        <ModelsReact plugin={this.plugin} />
      </React.StrictMode>
    );

    return modelTabContent;
  }
}
