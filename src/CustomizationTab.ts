import { Setting, Notice } from "obsidian";
import FileOrganizer from "./index";

export class CustomizationTab {
  private plugin: FileOrganizer;
  private containerEl: HTMLElement;

  constructor(containerEl: HTMLElement, plugin: FileOrganizer) {
    this.containerEl = containerEl;
    this.plugin = plugin;
  }

  create(): HTMLElement {
    const customizationTabContent = this.containerEl.createEl("div", {
      cls: "setting-tab-content",
    });

    new Setting(customizationTabContent)
      .setName("FileOrganizer logs")
      .setDesc("Allows you to keep track of the changes made by file organizer.")
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
      .setDesc("Only rename files that have 'untitled' in their name.")
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
      .setName("Disable image annotation")
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
      .setName("Processed file tag")
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
      .setName("Enable alias generation")
      .setDesc("Enable the generation of aliases in the assistant sidebar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAliasGeneration)
          .onChange(async (value) => {
            this.plugin.settings.enableAliasGeneration = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(customizationTabContent)
      .setName("Enable similar files")
      .setDesc("Enable the display of similar files in the assistant sidebar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableSimilarFiles)
          .onChange(async (value) => {
            this.plugin.settings.enableSimilarFiles = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(customizationTabContent)
      .setName("Enable atomic notes")
      .setDesc("Enable the generation of atomic notes in the assistant sidebar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAtomicNotes)
          .onChange(async (value) => {
            this.plugin.settings.enableAtomicNotes = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Custom formatting")
      .setHeading();

    new Setting(customizationTabContent)
      .setName("Enable document auto-formatting")
      .setDesc("Automatically format documents processed through the inbox when content matches a category of your AI templates.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDocumentClassification)
          .onChange(async (value) => {
            if (!value) {
              this.plugin.settings.enableDocumentClassification = false;
              await this.plugin.saveSettings();
              return;
            }

            this.plugin.settings.enableDocumentClassification = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(customizationTabContent)
      .setName("Document type configuration")
      .setDesc("To specify the document type for AI formatting, please add a file inside the template folder of File Organizer. Each file should be named according to the document type it represents (e.g., 'workout'). The content of each file should be the prompt that will be applied to the formatting. Additionally, you can access and manage these document types directly through the AI sidebar in the application.")
      .setDisabled(true);

    return customizationTabContent;
  }
}
