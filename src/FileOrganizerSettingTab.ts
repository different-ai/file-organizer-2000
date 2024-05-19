import {
  PluginSettingTab,
  App,
  Setting,
  Notice,
  ButtonComponent,
} from "obsidian";
import { logMessage, cleanPath } from "../utils";
import FileOrganizer from "./index";
import { configureTask, createOpenAIInstance } from "../standalone/models";

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

    const fileConfigTabHeader = tabHeaders.createEl("div", {
      text: "File Configuration",
      cls: "setting-tab-header",
    });
    const customizationTabHeader = tabHeaders.createEl("div", {
      text: "Customization",
      cls: "setting-tab-header",
    });

    const modelTabHeader = tabHeaders.createEl("div", {
      text: "Models",
      cls: "setting-tab-header",
    });

    const fileConfigTabContent = tabContents.createEl("div", {
      cls: "setting-tab-content",
    });
    const customizationTabContent = tabContents.createEl("div", {
      cls: "setting-tab-content",
    });
    const modelTabContent = tabContents.createEl("div", {
      cls: "setting-tab-content",
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
    modelTabHeader.addEventListener("click", () => {
      this.showTab(modelTabContent, [
        fileConfigTabContent,
        customizationTabContent,
      ]);
    });

    // Models Tab
    // OpenAI Settings Section
    new Setting(modelTabContent).setName("OpenAI Settings").setHeading();

    new Setting(modelTabContent).setName("Enable OpenAI").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.enableOpenAI)
        .onChange(async (value) => {
          this.plugin.settings.enableOpenAI = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("OpenAI API Key").addText((text) =>
      text
        .setPlaceholder("Enter your OpenAI API Key")
        .setValue(this.plugin.settings.openAIApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openAIApiKey = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("OpenAI Model").addText((text) =>
      text
        .setPlaceholder("Enter the OpenAI model name")
        .setValue(this.plugin.settings.openAIModel)
        .onChange(async (value) => {
          this.plugin.settings.openAIModel = value;
          await this.plugin.saveSettings();
        })
    );

    // Anthropic Settings Section
    new Setting(modelTabContent).setName("Anthropic Settings").setHeading();

    new Setting(modelTabContent)
      .setName("Enable Anthropic")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAnthropic)
          .onChange(async (value) => {
            this.plugin.settings.enableAnthropic = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(modelTabContent).setName("Anthropic API Key").addText((text) =>
      text
        .setPlaceholder("Enter your Anthropic API Key")
        .setValue(this.plugin.settings.anthropicApiKey)
        .onChange(async (value) => {
          this.plugin.settings.anthropicApiKey = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("Anthropic Model").addText((text) =>
      text
        .setPlaceholder("Enter the Anthropic model name")
        .setValue(this.plugin.settings.anthropicModel)
        .onChange(async (value) => {
          this.plugin.settings.anthropicModel = value;
          await this.plugin.saveSettings();
        })
    );

    // Ollama Settings Section
    new Setting(modelTabContent).setName("Ollama Settings").setHeading();

    new Setting(modelTabContent).setName("Enable Ollama").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.enableOllama)
        .onChange(async (value) => {
          this.plugin.settings.enableOllama = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("Ollama URL").addText((text) =>
      text
        .setPlaceholder("Enter the Ollama URL")
        .setValue(this.plugin.settings.ollamaUrl)
        .onChange(async (value) => {
          this.plugin.settings.ollamaUrl = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("Ollama Model").addText((text) =>
      text
        .setPlaceholder("Enter the Ollama model name")
        .setValue(this.plugin.settings.ollamaModel)
        .onChange(async (value) => {
          this.plugin.settings.ollamaModel = value;
          await this.plugin.saveSettings();
        })
    );

    // Model Settings Section
    new Setting(modelTabContent).setName("Model Settings").setHeading();

    new Setting(modelTabContent).setName("Tagging Model").addText((text) =>
      text
        .setPlaceholder("Enter the model name for tagging")
        .setValue(this.plugin.settings.taggingModel)
        .onChange(async (value) => {
          this.plugin.settings.taggingModel = value;
          await this.plugin.saveSettings();
          configureTask("tagging", value);
        })
    );

    new Setting(modelTabContent).setName("Folders Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for folders")
        .setValue(this.plugin.settings.foldersModel)
        .onChange(async (value) => {
          this.plugin.settings.foldersModel = value;
          await this.plugin.saveSettings();
          configureTask("folders", value);
        })
    );

    new Setting(modelTabContent)
      .setName("Relationships Model")
      .addText((text) =>
        text
          .setPlaceholder("Enter the model for relationships")
          .setValue(this.plugin.settings.relationshipsModel)
          .onChange(async (value) => {
            this.plugin.settings.relationshipsModel = value;
            await this.plugin.saveSettings();
            configureTask("relationships", value);
          })
      );

    new Setting(modelTabContent).setName("Name Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for name generation")
        .setValue(this.plugin.settings.nameModel)
        .onChange(async (value) => {
          this.plugin.settings.nameModel = value;
          await this.plugin.saveSettings();
          configureTask("name", value);
        })
    );

    new Setting(modelTabContent)
      .setName("Classification Model")
      .addText((text) =>
        text
          .setPlaceholder("Enter the model for classification")
          .setValue(this.plugin.settings.classifyModel)
          .onChange(async (value) => {
            this.plugin.settings.classifyModel = value;
            await this.plugin.saveSettings();
            configureTask("classify", value);
          })
      );

    new Setting(modelTabContent).setName("Vision Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for vision")
        .setValue(this.plugin.settings.visionModel)
        .onChange(async (value) => {
          this.plugin.settings.visionModel = value;
          configureTask("vision", value);
          await this.plugin.saveSettings();
        })
    );

    new Setting(modelTabContent).setName("Formatting Model").addText((text) =>
      text
        .setPlaceholder("Enter the model for formatting")
        .setValue(this.plugin.settings.formatModel)
        .onChange(async (value) => {
          this.plugin.settings.formatModel = value;
          configureTask("format", value);
          await this.plugin.saveSettings();
        })
    );

    // File Configuration Tab
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
        "Enter the path to the folder where the original images and audio will be moved."
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
            logMessage(cleanedPath);
            this.plugin.settings.defaultDestinationPath = cleanedPath;
            await this.plugin.saveSettings();
          })
      );

    // Customization Tab
    new Setting(customizationTabContent).setName("Features").setHeading();

    new Setting(customizationTabContent)
      .setName("FileOrganizer logs")
      .setDesc(
        "Allows you to keep track of the changes made by file Organizer."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useLogs)
          .onChange(async (value) => {
            this.plugin.settings.useLogs = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Rename untitled files only")
      .setDesc("Only rename files that have 'Untitled' in their name.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.renameUntitledOnly)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.renameUntitledOnly = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.renameDocumentTitle) {
              new Notice(
                "Rename document title must be enabled to rename untitled files.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.renameUntitledOnly = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Similar tags")
      .setDesc("Append similar tags to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useSimilarTags)
          .onChange(async (value) => {
            this.plugin.settings.useSimilarTags = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Add similar tags in frontmatter")
      .setDesc("Use frontmatter to add similar tags to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useSimilarTagsInFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.useSimilarTagsInFrontmatter = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Disable Image Annotation")
      .setDesc("Disable the annotation of images during file processing.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.disableImageAnnotation)
          .onChange(async (value) => {
            this.plugin.settings.disableImageAnnotation = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Rename document title")
      .setDesc("Rename the document title based on the content.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.renameDocumentTitle)
          .onChange(async (value) => {
            this.plugin.settings.renameDocumentTitle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Aliases")
      .setDesc("Append aliases to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useAliases)
          .onChange(async (value) => {
            this.plugin.settings.useAliases = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Processed File Tag")
      .setDesc("Specify the tag to be added to processed files.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processedTag)
          .onChange(async (value) => {
            this.plugin.settings.processedTag = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Experimental features")
      .setHeading();

    new Setting(customizationTabContent)
      .setName("Transcribe Embedded Audio")
      .setDesc(
        "This features automatically add transcriptions inside your files where you record a fresh audio recording or drop a audio file."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.transcribeEmbeddedAudio)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.transcribeEmbeddedAudio = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.enableEarlyAccess) {
              new Notice(
                "You need to be a supporter to enable this feature.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.transcribeEmbeddedAudio = true;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Custom Formatting")
      .setHeading();

    new Setting(customizationTabContent)
      .setName("Enable Document Classification")
      .setDesc("Automatically classify and format documents in the inbox.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDocumentClassification)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.enableDocumentClassification = false;
              await this.plugin.saveSettings();
              return;
            }
            if (!this.plugin.settings.enableEarlyAccess) {
              new Notice(
                "You need to be a supporter to enable this feature.",
                6000
              );
              toggle.setValue(false);
              return;
            }
            this.plugin.settings.enableDocumentClassification = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Document Type Configuration")
      .setDesc(
        "To specify the document type for AI formatting, please add a file inside the template folder of File Organizer. Each file should be named according to the document type it represents (e.g., 'workout'). The content of each file should be the prompt that will be applied to the formatting. Additionally, you can access and manage these document types directly through the AI sidebar in the application."
      )
      .setDisabled(true);
  }

  private showTab(activeTab: HTMLElement, otherTabs: HTMLElement[]): void {
    activeTab.style.display = "block";
    otherTabs.forEach((tab) => (tab.style.display = "none"));
  }
}
