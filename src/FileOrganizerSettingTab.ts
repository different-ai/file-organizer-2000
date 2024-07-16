import { App, PluginSettingTab } from "obsidian";
import FileOrganizer from "./index";
import { FileConfigTab } from "./FileConfigTab";
import { CustomizationTab } from "./CustomizationTab";
import { ModelTab } from "./GeneralTab";

export class FileOrganizerSettingTab extends PluginSettingTab {
  plugin: FileOrganizer;

  constructor(app: App, plugin: FileOrganizer) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const tabs = containerEl.createEl("div", { cls: "setting-tabs" });
    const tabHeaders = tabs.createEl("div", { cls: "setting-tab-headers" });
    const tabContents = tabs.createEl("div", { cls: "setting-tab-contents" });
    const modelTabHeader = tabHeaders.createEl("div", {
      text: "General",
      cls: "setting-tab-header",
    });
    const fileConfigTabHeader = tabHeaders.createEl("div", {
      text: "File Configuration",
      cls: "setting-tab-header",
    });
    const customizationTabHeader = tabHeaders.createEl("div", {
      text: "Customization",
      cls: "setting-tab-header",
    });

    const modelTabContent = new ModelTab(tabContents, this.plugin).create();
    const fileConfigTabContent = new FileConfigTab(
      tabContents,
      this.plugin
    ).create();
    const customizationTabContent = new CustomizationTab(
      tabContents,
      this.plugin
    ).create();

    modelTabHeader.addEventListener("click", () => {
      this.showTab(modelTabContent, [
        fileConfigTabContent,
        customizationTabContent,
      ]);
    });

    fileConfigTabHeader.addEventListener("click", () => {
      this.showTab(fileConfigTabContent, [
        modelTabContent,
        customizationTabContent,
      ]);
    });

    customizationTabHeader.addEventListener("click", () => {
      this.showTab(customizationTabContent, [
        modelTabContent,
        fileConfigTabContent,
      ]);
    });

    // Default to showing the first tab
    this.showTab(modelTabContent, [
      fileConfigTabContent,
      customizationTabContent,
    ]);

    // CSS for tooltips and validation
    const style = document.createElement("style");
    style.textContent = `
      .tooltip {
        font-size: 0.9em;
        color: #666;
        margin-top: 5px;
      }
      .valid {
        border-color: green;
      }
      .invalid {
        border-color: red;
      }
    `;
    document.head.appendChild(style);
  }

  private showTab(activeTab: HTMLElement, otherTabs: HTMLElement[]): void {
    activeTab.style.display = "block";
    otherTabs.forEach((tab) => (tab.style.display = "none"));
  }

  private validateApiKey(key: string, inputElement: HTMLInputElement): void {
    // Example validation logic
    if (key.startsWith("sk-")) {
      inputElement.classList.remove("invalid");
      inputElement.classList.add("valid");
    } else {
      inputElement.classList.remove("valid");
      inputElement.classList.add("invalid");
    }
  }
}
