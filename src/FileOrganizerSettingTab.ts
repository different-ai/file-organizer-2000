import { App, PluginSettingTab } from "obsidian";
import FileOrganizer from "./index";
import { FileConfigTab } from "./FileConfigTab";
import { CustomizationTab } from "./CustomizationTab";
import { ModelTab } from "./ModelTab";
import { ModelForXTab } from "./ModelTaskTab"; // Import the new tab

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
    const modelForXTabHeader = tabHeaders.createEl("div", {
      text: "Advanced Model Config",
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
    const modelForXTabContent = new ModelForXTab(
      tabContents,
      this.plugin
    ).create();

    modelTabHeader.addEventListener("click", () => {
      this.showTab(modelTabContent, [
        fileConfigTabContent,
        customizationTabContent,
        modelForXTabContent,
      ]);
    });

    fileConfigTabHeader.addEventListener("click", () => {
      this.showTab(fileConfigTabContent, [
        modelTabContent,
        customizationTabContent,
        modelForXTabContent,
      ]);
    });

    customizationTabHeader.addEventListener("click", () => {
      this.showTab(customizationTabContent, [
        modelTabContent,
        fileConfigTabContent,
        modelForXTabContent,
      ]);
    });

    modelForXTabHeader.addEventListener("click", () => {
      this.showTab(modelForXTabContent, [
        modelTabContent,
        fileConfigTabContent,
        customizationTabContent,
      ]);
    });

    // Default to showing the first tab
    this.showTab(modelTabContent, [
      fileConfigTabContent,
      customizationTabContent,
      modelForXTabContent,
    ]);



    // Append tooltips to relevant elements
    enableOpenAITooltip.appendTo(containerEl.querySelector(".enable-openai"));
    apiKeyTooltip.appendTo(containerEl.querySelector(".openai-api-key"));
    modelTooltip.appendTo(containerEl.querySelector(".openai-model"));

    // Add event listeners for inline validation
    const apiKeyInput = containerEl.querySelector(".openai-api-key input");
    apiKeyInput.addEventListener("input", () => {
      validateApiKey(apiKeyInput.value);
    });

    function validateApiKey(key) {
      // Example validation logic
      if (key.startsWith("sk-")) {
        apiKeyInput.classList.remove("invalid");
        apiKeyInput.classList.add("valid");
      } else {
        apiKeyInput.classList.remove("valid");
        apiKeyInput.classList.add("invalid");
      }
    }

    // Function to show the selected tab and hide others
    this.showTab = (show, hide) => {
      show.style.display = "block";
      hide.forEach((tab) => (tab.style.display = "none"));
    };

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
}
